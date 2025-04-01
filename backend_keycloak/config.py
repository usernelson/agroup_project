# config.py
# Archivo de configuración para almacenar variables de entorno y constantes.

# Configuration for Keycloak integration

import os

# Base URLs pointing directly to your Docker container on port 8080
KEYCLOAK_BASE_URL = os.environ.get('KEYCLOAK_BASE_URL', 'http://10.0.0.1:8080')
# For Keycloak 26.1.1, no /auth prefix is needed (removed in newer versions)
KEYCLOAK_URL = f"{KEYCLOAK_BASE_URL}"
KEYCLOAK_ADMIN_URL = KEYCLOAK_URL  # Use same base URL for admin endpoints

# Realm configuration
REALM = os.environ.get('KEYCLOAK_REALM', 'servicios_agroup')
REALM_NAME = REALM  # Alias for consistency with existing code

# API client configuration
CLIENT_ID = os.environ.get('KEYCLOAK_CLIENT_ID', 'ateacher_client_api_rest')
CLIENT_SECRET = os.environ.get('KEYCLOAK_CLIENT_SECRET', 'e94pkOURZYfT684aiu2uhpCb3E4RERFC')

# CRITICAL FIX: Admin client configuration with correct credentials
# The current admin credentials are invalid according to the logs
ADMIN_CLIENT_ID = os.environ.get('KEYCLOAK_ADMIN_CLIENT_ID', 'admin-cli')

# IMPORTANT: Update these with the values from your Docker Keycloak setup
# You need to use the actual admin username and password you set when creating the Keycloak container
ADMIN_USERNAME = os.environ.get('KEYCLOAK_ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.environ.get('KEYCLOAK_ADMIN_PASSWORD', 'password')  # Changed from 'admin' to a more likely default

# Cache settings
TOKEN_CACHE_TTL = 300  # 5 minutes in seconds
INTROSPECTION_CACHE_TTL = 60  # 1 minute in seconds

# API configuration
API_URL = os.environ.get('API_URL', 'https://ia.agroup.app/api')

# SSL verification settings
VERIFY_SSL = os.environ.get('VERIFY_SSL', 'False').lower() in ('true', '1', 't')
SSL_CERT_PATH = os.environ.get('SSL_CERT_PATH', None)  # Path to CA certificate if needed

# Alternative URLs to try
KEYCLOAK_URL_ALTERNATIVES = [
    f"http://10.0.0.1:8080",      # Direct to Docker container
    f"http://localhost:8080",     # Local access if running on same host
    f"http://127.0.0.1:8080",     # Localhost alternative
    f"{KEYCLOAK_BASE_URL}/auth",  # With /auth prefix (for older Keycloak versions)
]
