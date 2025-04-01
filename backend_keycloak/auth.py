# Authentication utilities for Keycloak integration

import requests
import json
import time
import logging
import urllib3
from config import (
    KEYCLOAK_URL, REALM, 
    CLIENT_ID, CLIENT_SECRET,
    ADMIN_CLIENT_ID, ADMIN_USERNAME, ADMIN_PASSWORD,
    VERIFY_SSL, SSL_CERT_PATH,
    KEYCLOAK_URL_ALTERNATIVES
)

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# CRITICAL FIX: Disable insecure request warnings if we're not verifying SSL
if not VERIFY_SSL:
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    logger.warning(
        "SSL verification is disabled. This should only be used in development environments."
    )

# Cache for tokens to reduce API calls
_token_cache = {}
# Variable to store the discovered working Keycloak URL
_working_keycloak_url = None

# CRITICAL FIX: Create standard request settings for Keycloak
def get_request_settings():
    """Get standard request settings for all Keycloak API calls"""
    settings = {}
    
    # Handle SSL verification
    if SSL_CERT_PATH:
        settings['verify'] = SSL_CERT_PATH
    else:
        settings['verify'] = VERIFY_SSL
    
    return settings

def try_keycloak_url(url):
    """
    Test if a Keycloak URL is working by making a request to the well-known endpoint.
    
    Args:
        url (str): The Keycloak base URL to test
        
    Returns:
        bool: True if the URL works, False otherwise
    """
    try:
        # Try with both formats (with and without /auth prefix)
        well_known_urls = [
            f"{url}/realms/{REALM}/.well-known/openid-configuration",
        ]
        
        # For backward compatibility, also try with /auth prefix
        if "/auth" not in url:
            well_known_urls.append(f"{url}/auth/realms/{REALM}/.well-known/openid-configuration")
        
        for well_known_url in well_known_urls:
            logger.debug(f"[try_keycloak_url] Testing URL: {well_known_url}")
            
            request_settings = get_request_settings()
            try:
                response = requests.get(well_known_url, timeout=5, **request_settings)
                
                if response.status_code == 200:
                    # Check if the response is valid JSON with token_endpoint
                    try:
                        config = response.json()
                        if 'token_endpoint' in config:
                            logger.info(f"[try_keycloak_url] Found working Keycloak URL: {well_known_url}")
                            logger.info(f"[try_keycloak_url] Token endpoint: {config['token_endpoint']}")
                            return True
                    except json.JSONDecodeError:
                        logger.debug(f"[try_keycloak_url] Response is not valid JSON")
                else:
                    logger.debug(f"[try_keycloak_url] Failed with status code: {response.status_code}")
            except Exception as inner_e:
                logger.debug(f"[try_keycloak_url] Error testing specific URL {well_known_url}: {inner_e}")
                
        logger.debug(f"[try_keycloak_url] All URL patterns failed for base: {url}")
        return False
    except Exception as e:
        logger.debug(f"[try_keycloak_url] Error testing Keycloak URL: {url} - {str(e)}")
        return False

def discover_keycloak_url():
    """
    Discover the correct working Keycloak URL by trying multiple URL patterns.
    This helps with different Keycloak deployment configurations.
    
    Returns:
        str: The working Keycloak URL or None if none work
    """
    global _working_keycloak_url
    
    # If we already discovered a working URL, return it
    if _working_keycloak_url:
        return _working_keycloak_url
    
    # Try standard URL first
    if try_keycloak_url(KEYCLOAK_URL):
        _working_keycloak_url = KEYCLOAK_URL
        logger.info(f"[discover_keycloak_url] Using Keycloak URL: {_working_keycloak_url}")
        return _working_keycloak_url
    
    # Try alternative URLs
    for alt_url in KEYCLOAK_URL_ALTERNATIVES:
        logger.info(f"[discover_keycloak_url] Trying alternative URL: {alt_url}")
        if try_keycloak_url(alt_url):
            _working_keycloak_url = alt_url
            logger.info(f"[discover_keycloak_url] Using alternative Keycloak URL: {_working_keycloak_url}")
            return _working_keycloak_url
    
    # If no URL works, log an error and return the default
    logger.error("[discover_keycloak_url] Could not find a working Keycloak URL")
    return KEYCLOAK_URL

def get_admin_token():
    """
    Get a Keycloak admin token with proper error handling and caching.
    
    Returns:
        str: The admin access token if successful, None otherwise
    """
    cache_key = 'admin_token'
    
    # Check if we have a valid cached token
    if cache_key in _token_cache:
        token_data = _token_cache[cache_key]
        if token_data['expires_at'] > time.time():
            logger.debug("[get_admin_token] Token administrativo obtenido del cache.")
            return token_data['token']
    
    try:
        # Discover the working Keycloak URL
        keycloak_url = discover_keycloak_url()
        
        # Request a new admin token
        token_url = f"{keycloak_url}/realms/master/protocol/openid-connect/token"
        payload = {
            'grant_type': 'password',
            'client_id': ADMIN_CLIENT_ID,
            'username': ADMIN_USERNAME,
            'password': ADMIN_PASSWORD
        }
        
        # Log attempt without credentials
        logger.debug(f"[get_admin_token] Requesting new admin token for {ADMIN_USERNAME} at {token_url}")
        
        # CRITICAL FIX: Add request settings with SSL handling
        request_settings = get_request_settings()
        
        response = requests.post(token_url, data=payload, **request_settings)
        
        if response.status_code != 200:
            logger.error(f"[get_admin_token] Failed to get admin token: {response.status_code} - {response.text}")
            return None
        
        token_response = response.json()
        admin_token = token_response['access_token']
        expires_in = token_response.get('expires_in', 60)  # Default to 60 seconds
        
        # Cache the token with expiration time (subtract 30s for safety margin)
        _token_cache[cache_key] = {
            'token': admin_token,
            'expires_at': time.time() + expires_in - 30
        }
        
        logger.debug("[get_admin_token] New administrative token obtained and cached.")
        return admin_token
        
    except Exception as e:
        logger.error(f"[get_admin_token] Error obtaining admin token: {e}")
        return None

def validate_token(token):
    """
    Validate a token using Keycloak's introspection endpoint.
    
    Args:
        token (str): The token to validate
        
    Returns:
        dict: The token information if valid, None otherwise
    """
    if not token:
        logger.warning("[validate_token] No token provided")
        return None
    
    try:
        # Discover the working Keycloak URL
        keycloak_url = discover_keycloak_url()
        
        introspect_url = f"{keycloak_url}/realms/{REALM}/protocol/openid-connect/token/introspect"
        logger.debug(f"[validate_token] POST to {introspect_url}")
        
        # CRITICAL FIX: Add request settings with SSL handling
        request_settings = get_request_settings()
        
        # Use direct HTTP Basic Auth for client authentication instead of form parameters
        # This appears to be more reliable for Keycloak token introspection
        response = requests.post(
            introspect_url,
            auth=(CLIENT_ID, CLIENT_SECRET),  # Use HTTP Basic Auth
            data={'token': token},
            headers={'Content-Type': 'application/x-www-form-urlencoded'},
            **request_settings
        )
        
        logger.debug(f"[validate_token] Status code: {response.status_code}")
        
        if response.status_code != 200:
            logger.error(f"[validate_token] Error response: {response.text}")
            return None
        
        introspection_result = response.json()
        logger.debug(f"[validate_token] Response text: {introspection_result}")
        
        # If token is not active, return None
        if not introspection_result.get('active', False):
            logger.warning("[validate_token] Token is not active")
            return None
            
        return introspection_result
        
    except Exception as e:
        logger.error(f"[validate_token] Error validating token: {e}")
        return None

def check_permissions(token, required_roles=None):
    """
    Check if the token has all required roles.
    
    Args:
        token (str): The token to check
        required_roles (list): List of required role names
        
    Returns:
        bool: True if token has all required roles, False otherwise
    """
    if not token or not required_roles:
        return False
    
    try:
        # First validate the token
        token_info = validate_token(token)
        if not token_info:
            return False
        
        # Extract roles from the token info
        user_roles = []
        
        # Check resource_access roles
        resource_access = token_info.get('resource_access', {})
        for client, client_data in resource_access.items():
            user_roles.extend(client_data.get('roles', []))
        
        # Check realm_access roles
        realm_access = token_info.get('realm_access', {})
        user_roles.extend(realm_access.get('roles', []))
        
        # Check if all required roles are present
        return all(role in user_roles for role in required_roles)
        
    except Exception as e:
        logger.error(f"[check_permissions] Error checking permissions: {e}")
        return False
