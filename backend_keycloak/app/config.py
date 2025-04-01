import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'supersecretkey')
    KEYCLOAK_URL = os.getenv('KEYCLOAK_URL', 'https://keycloak.agroup.app')
    KEYCLOAK_REALM = os.getenv('KEYCLOAK_REALM', 'servicios_agroup')
    KEYCLOAK_CLIENT_ID = os.getenv('KEYCLOAK_CLIENT_ID', 'ateacher_client_api_rest')
    KEYCLOAK_CLIENT_SECRET = os.getenv('KEYCLOAK_CLIENT_SECRET')

