#!/usr/bin/env python3
"""
Utility to find working admin credentials for Keycloak
by testing common combinations
"""

import requests
import sys
import logging
import itertools

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger('admin_finder')

# Import configurations if available
try:
    from config import KEYCLOAK_URL
except ImportError:
    KEYCLOAK_URL = "http://10.0.0.1:8080"
    logger.warning(f"Could not import config, using default URL: {KEYCLOAK_URL}")

# Common usernames and passwords to try
COMMON_USERNAMES = [
    'admin', 'administrator', 'root', 'keycloak', 'user', 'Admin',
    'agroup', 'agroup-admin'
]

COMMON_PASSWORDS = [
    'admin', 'password', 'Admin', 'Password', 'changeme', 'secret', 
    'keycloak', 'agroup', 'password123', 'admin123', '12345678',
    'josefa'
]

# IMPORTANT: Add Docker env variables that are often used for Keycloak admin
DOCKER_ENV_PREFIXES = [
    'KEYCLOAK_ADMIN', 'KC_ADMIN', 'ADMIN'
]

def test_admin_credentials(username, password):
    """Test if admin credentials work for Keycloak"""
    token_url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    
    payload = {
        'grant_type': 'password',
        'client_id': 'admin-cli',
        'username': username,
        'password': password
    }
    
    try:
        response = requests.post(token_url, data=payload, timeout=5, verify=False)
        if response.status_code == 200:
            print(f"✅ FOUND WORKING CREDENTIALS: username='{username}', password='{password}'")
            print("\nAdd these to your config.py:")
            print(f"ADMIN_USERNAME = '{username}'")
            print(f"ADMIN_PASSWORD = '{password}'\n")
            return True
        else:
            if 'invalid_grant' in response.text:
                logger.debug(f"Invalid credentials: {username}/{password}")
            else:
                logger.info(f"Failed but different error: {username}/{password} - {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Error testing {username}/{password}: {e}")
        return False

def get_docker_env_variables():
    """Try to find Keycloak admin credentials in Docker container"""
    print("\nAttempting to retrieve credentials from Docker container...")
    try:
        import subprocess
        # Try to get container ID for Keycloak
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=keycloak', '--format', '{{.ID}}'], 
            capture_output=True, text=True
        )
        container_id = result.stdout.strip()
        
        if not container_id:
            print("Could not find Keycloak container")
            return {}
        
        # Get environment variables from the container
        result = subprocess.run(
            ['docker', 'exec', container_id, 'env'], 
            capture_output=True, text=True
        )
        
        env_vars = {}
        for line in result.stdout.splitlines():
            if '=' in line:
                key, value = line.split('=', 1)
                for prefix in DOCKER_ENV_PREFIXES:
                    if key.startswith(prefix):
                        env_vars[key] = value
                        print(f"Found potential credential env var: {key}={value}")
        
        return env_vars
    except Exception as e:
        print(f"Error retrieving Docker env variables: {e}")
        return {}

def main():
    """Main function to test various credential combinations"""
    print(f"🔍 Testing admin credentials for Keycloak at {KEYCLOAK_URL}")
    
    # Disable SSL warnings for testing
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    # First, try to get env vars from Docker
    env_vars = get_docker_env_variables()
    
    # Extract potential usernames and passwords from env vars
    docker_usernames = []
    docker_passwords = []
    
    for key, value in env_vars.items():
        key_lower = key.lower()
        if 'user' in key_lower or 'admin' in key_lower:
            docker_usernames.append(value)
        if 'pass' in key_lower or 'pwd' in key_lower:
            docker_passwords.append(value)
    
    # Combine with common values
    all_usernames = docker_usernames + COMMON_USERNAMES
    all_passwords = docker_passwords + COMMON_PASSWORDS
    
    # Remove duplicates while preserving order
    all_usernames = list(dict.fromkeys(all_usernames))
    all_passwords = list(dict.fromkeys(all_passwords))
    
    print(f"\nTesting {len(all_usernames)} usernames and {len(all_passwords)} passwords...")
    print(f"This may take some time ({len(all_usernames) * len(all_passwords)} combinations).")
    
    # Try docker-derived combinations first
    if docker_usernames and docker_passwords:
        print("\nTrying Docker-derived credentials first...")
        for username, password in itertools.product(docker_usernames, docker_passwords):
            if test_admin_credentials(username, password):
                return
    
    # Try a smarter combination approach:
    # 1. First try exact matches (same index in both lists)
    print("\nTrying matching pairs...")
    for i in range(min(len(all_usernames), len(all_passwords))):
        if test_admin_credentials(all_usernames[i], all_passwords[i]):
            return
    
    # 2. Try common defaults
    print("\nTrying common default combinations...")
    common_pairs = [
        ('admin', 'admin'),
        ('admin', 'password'),
        ('admin', 'changeme'),
        ('keycloak', 'keycloak'),
        ('keycloak', 'password'),
        ('admin', 'password123'),
    ]
    
    for username, password in common_pairs:
        if username in all_usernames and password in all_passwords:
            if test_admin_credentials(username, password):
                return
    
    # 3. Try all remaining combinations
    print("\nTrying all remaining combinations...")
    for username, password in itertools.product(all_usernames, all_passwords):
        if test_admin_credentials(username, password):
            return
    
    print("\n❌ Could not find working admin credentials")
    print("You may need to manually check your Keycloak configuration.")
    print("Common places to look:")
    print("1. Docker run command or docker-compose.yml file")
    print("2. Keycloak configuration files")
    print("3. Check if you need to create an admin user")

if __name__ == "__main__":
    main()
