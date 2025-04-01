#!/usr/bin/env python3
"""
Test direct access to Keycloak Docker container
"""

import requests
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger('keycloak_test')

# Container URLs to test
TEST_URLS = [
    "http://10.0.0.1:8080",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
]

# Disable SSL warnings (for testing only)
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_keycloak_docker_access():
    """Test direct access to the Keycloak container"""
    print("="*80)
    print(" KEYCLOAK DOCKER ACCESS TEST")
    print("="*80)
    
    # Check for realm parameter
    realm = "servicios_agroup"
    if len(sys.argv) > 1:
        realm = sys.argv[1]
        print(f"Using provided realm: {realm}")
    else:
        print(f"Using default realm: {realm}")
    
    successful_urls = []
    
    for base_url in TEST_URLS:
        print(f"\nTesting direct access to: {base_url}")
        
        # Test 1: Root connection
        try:
            response = requests.get(f"{base_url}/", timeout=5, verify=False)
            print(f"  Base URL: Status {response.status_code}")
            if response.status_code < 400:
                print("  ✓ Successfully connected to base URL")
            else:
                print(f"  ✗ Failed to connect: {response.status_code}")
                continue
        except Exception as e:
            print(f"  ✗ Connection error: {e}")
            continue
            
        # Test 2: Well-known endpoint
        endpoints = [
            f"{base_url}/realms/{realm}/.well-known/openid-configuration",
            f"{base_url}/auth/realms/{realm}/.well-known/openid-configuration"
        ]
        
        for endpoint in endpoints:
            try:
                print(f"  Testing: {endpoint}")
                response = requests.get(endpoint, timeout=5, verify=False)
                print(f"  Status: {response.status_code}")
                
                if response.status_code == 200:
                    try:
                        data = response.json()
                        if 'token_endpoint' in data:
                            print(f"  ✓ Found valid OpenID configuration!")
                            print(f"  ✓ Token endpoint: {data['token_endpoint']}")
                            successful_urls.append((base_url, endpoint))
                        else:
                            print("  ✗ Missing token_endpoint in response")
                    except Exception as e:
                        print(f"  ✗ Not valid JSON: {e}")
            except Exception as e:
                print(f"  ✗ Request error: {e}")
    
    print("\n" + "="*80)
    if successful_urls:
        print(f"SUCCESS! Found {len(successful_urls)} working Keycloak URLs:")
        for base_url, endpoint in successful_urls:
            prefix = "/auth" if "/auth/" in endpoint else ""
            print(f"\nRecommended configuration:")
            print(f"  KEYCLOAK_BASE_URL = '{base_url}'")
            print(f"  KEYCLOAK_URL = '{base_url}{prefix}'")
            
            # Extract token endpoint format
            try:
                response = requests.get(endpoint, timeout=5, verify=False)
                if response.status_code == 200:
                    data = response.json()
                    if 'token_endpoint' in data:
                        token_endpoint = data['token_endpoint'] 
                        print(f"  Token endpoint: {token_endpoint}")
            except:
                pass
    else:
        print("❌ Could not find any working Keycloak endpoints.")
        print("Please check your Docker container configuration and network access.")
    print("="*80)

if __name__ == "__main__":
    test_keycloak_docker_access()
