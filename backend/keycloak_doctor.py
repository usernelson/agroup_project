#!/usr/bin/env python3
"""
Keycloak Doctor - A diagnostic tool for Keycloak connectivity issues
"""

import requests
import sys
import os
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger('keycloak_doctor')

# Import configurations from your app
try:
    from config import KEYCLOAK_URL, KEYCLOAK_BASE_URL, REALM, CLIENT_ID, CLIENT_SECRET, VERIFY_SSL
    from auth import get_request_settings
except ImportError:
    logger.error("Could not import from config.py or auth.py. Make sure they exist and are in your PYTHONPATH.")
    sys.exit(1)

def check_keycloak_connectivity():
    """Run a series of checks to diagnose Keycloak connectivity issues"""
    print("="*80)
    print(" KEYCLOAK DOCTOR - Diagnosing Connectivity Issues")
    print("="*80)
    
    # Get request settings
    request_settings = get_request_settings()
    print(f"\n1. SSL Verification: {'ENABLED' if VERIFY_SSL else 'DISABLED'}")
    
    # Check basic connectivity to the server 
    print(f"\n2. Testing base connectivity to Keycloak server at {KEYCLOAK_BASE_URL}")
    try:
        response = requests.get(KEYCLOAK_BASE_URL, timeout=5, **request_settings)
        print(f"   ✓ Server is reachable (Status: {response.status_code})")
    except Exception as e:
        print(f"   ✗ Cannot connect to server: {str(e)}")
        print("\n   Possible solutions:")
        print("   - Check if the server is running")
        print("   - Check network connectivity")
        print("   - Check firewall settings")
        return
    
    # Try different URL patterns
    print("\n3. Testing common Keycloak URL patterns:")
    test_urls = [
        f"{KEYCLOAK_BASE_URL}/realms/{REALM}/.well-known/openid-configuration",
        f"{KEYCLOAK_BASE_URL}/auth/realms/{REALM}/.well-known/openid-configuration",
        f"{KEYCLOAK_BASE_URL}/keycloak/auth/realms/{REALM}/.well-known/openid-configuration"
    ]
    
    working_urls = []
    for url in test_urls:
        try:
            print(f"   Testing {url}...")
            response = requests.get(url, timeout=5, **request_settings)
            if response.status_code == 200:
                print(f"   ✓ URL works! (Status: 200)")
                try:
                    config = response.json()
                    print(f"   ✓ Valid OpenID configuration found")
                    print(f"   - Token endpoint: {config.get('token_endpoint', 'Not found')}")
                    working_urls.append(url)
                except:
                    print(f"   ✗ Response is not valid JSON")
            else:
                print(f"   ✗ Status code: {response.status_code}")
        except Exception as e:
            print(f"   ✗ Error: {str(e)}")
    
    if not working_urls:
        print("\n   ⚠️ No working Keycloak URL pattern found!")
        print("   Possible solutions:")
        print("   - Check KEYCLOAK_BASE_URL in your config")
        print("   - Check REALM name in your config")
        print("   - Verify Keycloak server configuration")
    else:
        print(f"\n   ✅ Found {len(working_urls)} working Keycloak URL(s)")
        
        # Extract the base URL pattern from the first working URL
        working_base = working_urls[0].split('/realms')[0]
        print(f"   The correct base URL appears to be: {working_base}")
        print(f"   Update your config.py to use: KEYCLOAK_URL = '{working_base}'")
    
    # Test token endpoint directly
    token_endpoint = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    print(f"\n4. Testing token endpoint at {token_endpoint}")
    try:
        # Use OPTIONS request to check if endpoint exists without triggering auth error
        response = requests.options(token_endpoint, timeout=5, **request_settings)
        if response.status_code < 500:  # Any response that's not a server error
            print(f"   ✓ Endpoint exists (Status: {response.status_code})")
        else:
            print(f"   ✗ Endpoint error (Status: {response.status_code})")
    except Exception as e:
        print(f"   ✗ Cannot reach endpoint: {str(e)}")
    
    # Test client credentials
    print(f"\n5. Testing client credentials for {CLIENT_ID}")
    try:
        test_data = {
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET
        }
        
        for base_url in [url.split('/realms')[0] for url in working_urls] or [KEYCLOAK_URL]:
            token_url = f"{base_url}/realms/{REALM}/protocol/openid-connect/token"
            print(f"   Testing with URL: {token_url}")
            response = requests.post(token_url, data=test_data, timeout=5, **request_settings)
            print(f"   Status code: {response.status_code}")
            if response.status_code == 200:
                print(f"   ✓ Client credentials are valid!")
                break
            elif response.status_code == 401:
                print(f"   ✗ Invalid client credentials")
            elif response.status_code == 404:
                print(f"   ✗ Endpoint not found")
            else:
                try:
                    print(f"   Response: {response.text}")
                except:
                    pass
    except Exception as e:
        print(f"   ✗ Error testing client credentials: {str(e)}")
    
    print("\n" + "="*80)
    print(" DIAGNOSIS COMPLETE")
    print("="*80)
    
    if working_urls:
        print("\nRECOMMENDATION:")
        base_url = working_urls[0].split('/realms')[0]
        print(f"Update your config.py with this URL structure:")
        print(f"KEYCLOAK_URL = '{base_url}'")
    else:
        print("\nNo working Keycloak URL found. Please check your Keycloak installation and configuration.")
    
    print("\nIf problems persist, check Keycloak logs for more specific error messages.")

if __name__ == "__main__":
    check_keycloak_connectivity()
