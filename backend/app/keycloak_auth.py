import requests
import logging
from app.config import Config

def get_access_token(username, password):
    url = f"{Config.KEYCLOAK_URL}/realms/{Config.KEYCLOAK_REALM}/protocol/openid-connect/token"
    # Log para verificar la URL a la que se está haciendo la petición
    logging.debug(f"Solicitando token desde: {url} para el usuario: {username}")
    data = {
        "grant_type": "password",
        "client_id": Config.KEYCLOAK_CLIENT_ID,
        "client_secret": Config.KEYCLOAK_CLIENT_SECRET,
        "username": username,
        "password": password
    }
    response = requests.post(url, data=data)
    logging.debug(f"Respuesta de Keycloak: {response.status_code} - {response.text}")
    return response.json()

def verify_mfa(challenge, mfa_code):
    url = f"{Config.KEYCLOAK_URL}/realms/{Config.KEYCLOAK_REALM}/protocol/openid-connect/token"
    logging.debug(f"Verificando MFA en: {url} con challenge: {challenge}")
    data = {
        "grant_type": "urn:ietf:params:oauth:grant-type:mfa",
        "client_id": Config.KEYCLOAK_CLIENT_ID,
        "client_secret": Config.KEYCLOAK_CLIENT_SECRET,
        "challenge": challenge,
        "mfa_code": mfa_code
    }
    response = requests.post(url, data=data)
    logging.debug(f"Respuesta de Keycloak (MFA): {response.status_code} - {response.text}")
    return response.json()

def verify_token(token):
    url = f"{Config.KEYCLOAK_URL}/realms/{Config.KEYCLOAK_REALM}/protocol/openid-connect/userinfo"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    return None

