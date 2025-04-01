# cache.py
# Implementación de una caché simple para almacenar el token administrativo.

import time

# Diccionario que almacena el token y la hora de expiración.
_admin_token_cache = {
    "token": None,
    "expires_at": 0  # Timestamp Unix en el que expira el token
}

def get_cached_admin_token():
    """
    Retorna el token almacenado en caché si existe y no ha expirado.
    """
    if _admin_token_cache["token"] and _admin_token_cache["expires_at"] > time.time():
        return _admin_token_cache["token"]
    return None

def set_cached_admin_token(token, expires_in):
    """
    Almacena el token en la caché junto con su tiempo de expiración.

    Args:
        token (str): El token obtenido desde Keycloak.
        expires_in (int): Tiempo en segundos en el que el token será válido.
    """
    # Se establece la hora de expiración actualizando el timestamp actual más el tiempo de validez.
    # Se resta un margen de seguridad de 10 segundos para evitar usar tokens expirados.
    _admin_token_cache["token"] = token
    _admin_token_cache["expires_at"] = time.time() + expires_in - 10

