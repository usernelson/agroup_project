# routes.py
# Definición de los endpoints de la API utilizando Flask.
# Cada endpoint se comunica con Keycloak para gestionar la autenticación y el perfil de usuario.

import base64
import json
import logging
import requests
from flask import Flask, request, jsonify, make_response
from config import KEYCLOAK_URL, KEYCLOAK_ADMIN_URL, REALM, CLIENT_ID, CLIENT_SECRET
from auth import get_admin_token, get_request_settings

try:
    import admin_fallback
    FALLBACK_AVAILABLE = True
except ImportError:
    FALLBACK_AVAILABLE = False
    logging.warning("Admin fallback module not available. Features will be limited if admin access fails.")

app = Flask(__name__)

# Configuración básica del logging para mostrar mensajes de depuración
logging.basicConfig(level=logging.DEBUG)

# ----------------------------------------------------------------------
# ENDPOINT: Login
# ----------------------------------------------------------------------
@app.route('/api/login', methods=['POST'])
def login():
    """
    Endpoint para iniciar sesión. Recibe las credenciales del usuario,
    realiza la autenticación contra Keycloak y retorna el token de acceso.
    """
    data = request.form
    logging.debug(f"[login] Datos recibidos del cliente: {data}")

    # Configurar la carga útil para la solicitud a Keycloak con grant_type 'password'
    keycloak_payload = {
        "grant_type": "password",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "username": data["username"],
        "password": data["password"],
        "scope": "openid profile email"
    }
    # Se añade el TOTP si está presente en los datos
    if "totp" in data:
        keycloak_payload["totp"] = data["totp"]

    # URL para obtener el token de acceso
    token_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
    logging.debug(f"[login] Enviando POST a {token_url} con {keycloak_payload}")

    # CRITICAL FIX: Add request settings with SSL handling
    request_settings = get_request_settings()
    response = requests.post(token_url, data=keycloak_payload, **request_settings)
    logging.debug(f"[login] Status code: {response.status_code}")
    logging.debug(f"[login] Response text: {response.text}")

    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("access_token")
        if not access_token:
            return jsonify({"error": "No se recibió access_token desde Keycloak"}), 401

        # Decodificar el JWT para extraer la expiración (exp)
        try:
            token_parts = access_token.split('.')
            # Se corrige el padding de la parte del payload en base64
            payload_b64 = token_parts[1] + '=' * ((4 - len(token_parts[1]) % 4) % 4)
            payload_data = json.loads(base64.urlsafe_b64decode(payload_b64))
            exp_time = payload_data.get('exp')
        except Exception as e:
            logging.warning(f"[login] Error al decodificar el JWT: {e}")
            exp_time = None

        # Se crea la respuesta y se almacena el token en una cookie HttpOnly
        resp = make_response(jsonify({
            "message": "Login exitoso",
            "access_token": access_token,
            "exp": exp_time
        }))
        resp.set_cookie(
            "access_token",
            access_token,
            httponly=True,  # La cookie no es accesible vía JavaScript
            secure=True,    # Solo se enviará en conexiones seguras (HTTPS)
            samesite="Strict"
        )
        return resp

    # En caso de error en las credenciales se retorna error 401
    return jsonify({"error": "Credenciales inválidas"}), 401

# ----------------------------------------------------------------------
# ENDPOINT: Validar Token
# ----------------------------------------------------------------------
@app.route('/api/validate', methods=['GET'])
def validate_token():
    """
    Endpoint para validar el token de acceso del usuario.
    Se utiliza la cookie 'access_token' para la validación contra Keycloak.
    """
    token = request.cookies.get("access_token")
    if not token:
        logging.debug("[validate_token] No se encontró cookie 'access_token'")
        return jsonify({"error": "No autenticado"}), 401

    # Configurar la carga útil para la introspección del token
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    logging.debug(f"[validate_token] POST a {introspect_url} con {introspect_payload}")

    # CRITICAL FIX: Add request settings with SSL handling
    request_settings = get_request_settings()
    response = requests.post(introspect_url, data=introspect_payload, **request_settings)
    logging.debug(f"[validate_token] Status code: {response.status_code}")
    logging.debug(f"[validate_token] Response text: {response.text}")

    introspection_result = response.json()
    # Se verifica que el token esté activo y se extrae información relevante
    if response.status_code == 200 and introspection_result.get("active"):
        username = introspection_result.get("username")
        exp_time = introspection_result.get("exp")
        user_id = introspection_result.get("sub")
        return jsonify({
            "message": "Token válido",
            "username": username,
            "exp": exp_time,
            "user_id": user_id
        }), 200
    else:
        logging.warning("[validate_token] Token inválido o expirado")
        return jsonify({"error": "Token inválido o expirado"}), 401

# ----------------------------------------------------------------------
# ENDPOINT: Logout
# ----------------------------------------------------------------------
@app.route('/api/logout', methods=['POST'])
def logout():
    """
    Endpoint para cerrar sesión. Se elimina la cookie que contiene el token.
    """
    resp = make_response(jsonify({"message": "Logout exitoso"}))
    # Se establece la cookie 'access_token' con una fecha de expiración en el pasado para eliminarla
    resp.set_cookie("access_token", "", expires=0)
    return resp

# ----------------------------------------------------------------------
# ENDPOINT: Obtener Perfil con Roles
# ----------------------------------------------------------------------
@app.route('/api/profile', methods=['GET'])
def get_profile():
    """
    Endpoint para obtener el perfil del usuario autenticado, incluyendo sus roles.
    Se utiliza la cookie 'access_token' para solicitar información a Keycloak.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401

    # URL para obtener información del usuario
    userinfo_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/userinfo"
    headers = {"Authorization": f"Bearer {token}"}
    request_settings = get_request_settings()
    userinfo_response = requests.get(userinfo_url, headers=headers, **request_settings)
    
    if userinfo_response.status_code == 200:
        user_info = userinfo_response.json()
        # Se decodifica el token JWT para extraer roles asociados al usuario
        try:
            token_parts = token.split('.')
            payload_b64 = token_parts[1] + '=' * ((4 - len(token_parts[1]) % 4) % 4)
            payload_data = json.loads(base64.urlsafe_b64decode(payload_b64))
            # Roles asignados a nivel de cliente y realm
            client_roles = payload_data.get("resource_access", {}).get(CLIENT_ID, {}).get("roles", [])
            realm_roles = payload_data.get("realm_access", {}).get("roles", [])
            roles = client_roles + realm_roles
            user_info["roles"] = roles
            # ------ New code to resolve professor name -------
            # Si el token incluye 'created_by', intenta obtener el nombre completo del profesor.
            professor_id = user_info.get("created_by")
            if professor_id:
                try:
                    admin_token = get_admin_token()
                    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
                    prof_resp = requests.get(f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{professor_id}", headers=headers, **request_settings)
                    if prof_resp.status_code == 200:
                        prof_data = prof_resp.json()
                        teacher_name = f"{prof_data.get('firstName', '')} {prof_data.get('lastName', '')}".strip()
                        user_info["teacher_name"] = teacher_name or prof_data.get("email", "Profesor")
                    else:
                        user_info["teacher_name"] = f"Profesor (ID: {professor_id})"
                except Exception as ex:
                    logging.error(f"[get_profile] Error obteniendo nombre del profesor: {ex}")
                    user_info["teacher_name"] = f"Profesor (ID: {professor_id})"
            # ---------------------------------------------------
        except Exception as e:
            logging.error(f"[get_profile] Error al decodificar roles: {e}")
        return jsonify(user_info), 200
    else:
        return jsonify({"error": "No se pudo obtener el perfil"}), 400

# ----------------------------------------------------------------------
# ENDPOINT: Cambiar Email
# ----------------------------------------------------------------------
@app.route('/api/change-email', methods=['POST'])
def change_email():
    """
    Endpoint para actualizar el email del usuario.
    Se valida el token actual, se obtiene el ID del usuario y se actualiza el email mediante
    una llamada administrativa a Keycloak.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401
    
    # Validar el token mediante introspección
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    data = introspect_resp.json()
    if introspect_resp.status_code != 200 or not data.get("active"):
        return jsonify({"error": "Token inválido"}), 401
    
    # Se extrae el ID del usuario desde la respuesta de introspección
    user_id = data.get("sub")
    new_email = request.json.get("new_email")
    
    if not new_email:
        return jsonify({"error": "Email no proporcionado"}), 400
    
    # Obtener token administrativo (se usa caché internamente)
    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500
    
    # Configurar encabezados para autenticarse en Keycloak
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    # Obtener la información actual del usuario
    user_resp = requests.get(
        f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}", 
        headers=headers,
        **request_settings
    )
    if user_resp.status_code != 200:
        logging.error(f"[change_email] Error obteniendo usuario: {user_resp.text}")
        return jsonify({"error": "No se pudo obtener información de usuario"}), 500
    
    user_data = user_resp.json()
    # Actualizar email y, en este caso, se asume que el username es el mismo email
    user_data["email"] = new_email
    user_data["username"] = new_email  
    
    # Realizar la actualización del usuario en Keycloak
    update_resp = requests.put(
        f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}",
        headers=headers,
        json=user_data,
        **request_settings
    )
    
    if update_resp.status_code not in (200, 204):
        logging.error(f"[change_email] Error actualizando email: {update_resp.text}")
        return jsonify({"error": "No se pudo actualizar el email"}), 500
    
    return jsonify({"message": "Email actualizado correctamente"}), 200

# ----------------------------------------------------------------------
# ENDPOINT: Cambiar Contraseña
# ----------------------------------------------------------------------
@app.route('/api/change-password', methods=['POST'])
def change_password():
    """
    Endpoint para actualizar la contraseña del usuario.
    Se valida el token, se obtiene el ID del usuario y se actualiza la contraseña a través de una
    llamada administrativa a Keycloak.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401
    
    # Validar el token mediante introspección
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    data = introspect_resp.json()
    if introspect_resp.status_code != 200 or not data.get("active"):
        return jsonify({"error": "Token inválido"}), 401
    
    # Extraer el ID del usuario
    user_id = data.get("sub")
    new_password = request.json.get("new_password")
    
    if not new_password:
        return jsonify({"error": "Contraseña no proporcionada"}), 400
    
    # Obtener token administrativo
    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500
    
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    # Datos necesarios para actualizar la contraseña
    password_data = {
        "type": "password",
        "value": new_password,
        "temporary": False  # Si se desea que la contraseña sea temporal se podría cambiar a True
    }
    
    # Realizar la llamada para resetear la contraseña del usuario
    update_resp = requests.put(
        f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}/reset-password",
        headers=headers,
        json=password_data,
        **request_settings
    )
    
    if update_resp.status_code not in (200, 204):
        logging.error(f"[change_password] Error actualizando contraseña: {update_resp.text}")
        return jsonify({"error": "No se pudo actualizar la contraseña"}), 500
    
    return jsonify({"message": "Contraseña actualizada correctamente"}), 200

# ----------------------------------------------------------------------
# ENDPOINT: Actualizar Perfil
# ----------------------------------------------------------------------
@app.route('/api/update-profile', methods=['POST'])
def update_profile():
    """
    Endpoint para actualizar atributos adicionales del perfil del usuario,
    tales como género, fecha de nacimiento y número de teléfono.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401
    
    # Validar token mediante introspección
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    data = introspect_resp.json()
    if introspect_resp.status_code != 200 or not data.get("active"):
        return jsonify({"error": "Token inválido"}), 401
    
    # Extraer el ID del usuario
    user_id = data.get("sub")
    profile_data = request.json
    gender = profile_data.get("gender")
    birth_date = profile_data.get("birth_date")
    phone_number = profile_data.get("phone_number")
    
    # Obtener token administrativo
    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500
    
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    # Obtener la información actual del usuario
    user_resp = requests.get(
        f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}", 
        headers=headers,
        **request_settings
    )
    if user_resp.status_code != 200:
        logging.error(f"[update_profile] Error obteniendo usuario: {user_resp.text}")
        return jsonify({"error": "No se pudo obtener información de usuario"}), 500
    
    user_data = user_resp.json()
    
    # Asegurarse de que la clave 'attributes' exista en la data del usuario
    if "attributes" not in user_data:
        user_data["attributes"] = {}
    
    # Actualizar cada atributo si se encuentra en el request
    if gender is not None:
        user_data["attributes"]["gender"] = gender
    if birth_date is not None:
        user_data["attributes"]["birth_date"] = birth_date
    if phone_number is not None:
        user_data["attributes"]["phone_number"] = phone_number
    
    # Realizar la actualización del perfil en Keycloak
    update_resp = requests.put(
        f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}",
        headers=headers,
        json=user_data,
        **request_settings
    )
    
    if update_resp.status_code not in (200, 204):
        logging.error(f"[update_profile] Error actualizando perfil: {update_resp.text}")
        return jsonify({"error": "No se pudo actualizar el perfil"}), 500
    
    return jsonify({"message": "Perfil actualizado correctamente"}), 200

# ----------------------------------------------------------------------
# ENDPOINT: Obtener Usuarios (filtrados por creador)
# ----------------------------------------------------------------------
@app.route('/api/users', methods=['GET'])
def get_users():
    """
    Endpoint para obtener la lista de usuarios creados por el usuario actual.
    Se realiza una introspección del token para obtener el ID actual y luego se filtran
    los usuarios que tengan el mismo 'created_by'.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401

    # Validar token mediante introspección
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    data = introspect_resp.json()
    if introspect_resp.status_code != 200 or not data.get("active"):
        return jsonify({"error": "Token inválido"}), 401

    # ID del usuario actual extraído de la introspección
    current_user_id = data.get("sub")
    admin_token = get_admin_token()
    
    # ADDED: Use fallback if admin token retrieval fails
    if not admin_token:
        logging.warning("[get_users] Could not obtain admin token, using fallback")
        if FALLBACK_AVAILABLE:
            mock_users = admin_fallback.fallback_get_users(current_user_id)
            return jsonify(mock_users), 200
        else:
            return jsonify({"error": "No se pudo obtener token administrativo", "hint": "Verifique las credenciales admin en config.py"}), 500

    # Obtener la lista completa de usuarios desde Keycloak
    users_url = f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users"
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = requests.get(users_url, headers=headers, **request_settings)
    if resp.status_code != 200:
        logging.error(f"[get_users] Error obteniendo usuarios: {resp.text}")
        return jsonify({"error": "No se pudo obtener usuarios"}), 500

    all_users = resp.json()
    filtered = []
    
    # Filtrar usuarios cuyo atributo 'created_by' coincida con el ID del usuario actual
    for user in all_users:
        # Debug logs
        logging.debug(f"[get_users] Evaluando usuario: ID={user.get('id')}, firstName={user.get('firstName')}, lastName={user.get('lastName')}")
        
        attrs = user.get("attributes", {})
        creator = attrs.get("created_by")
        creator_id = creator[0] if isinstance(creator, list) and creator else creator
        
        if creator_id == current_user_id:
            # Convertir atributos en listas a strings para evitar problemas de serialización
            processed_attributes = {}
            for key, value in attrs.items():
                processed_attributes[key] = value[0] if isinstance(value, list) and value else value
            
            # Agregar el usuario filtrado con todos los campos necesarios
            filtered.append({
                "id": user.get("id"),
                "username": user.get("username"),
                "email": user.get("email"),
                "firstName": user.get("firstName", ""),
                "lastName": user.get("lastName", ""),
                "attributes": processed_attributes  # Usar atributos procesados
            })
    
    logging.debug(f"[get_users] Usuarios filtrados: {filtered}")
    return jsonify(filtered), 200

# ----------------------------------------------------------------------
# ENDPOINT: Crear Usuario
# ----------------------------------------------------------------------
@app.route('/api/users', methods=['POST'])
def create_user():
    """
    Endpoint para crear un nuevo usuario (alumno). Valida el token de sesión para
    obtener el ID del usuario actual y usa un token administrativo para crear el usuario en Keycloak.
    Se espera que el request JSON contenga al menos firstName y email.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401

    # Validar token mediante introspección
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    introspect_data = introspect_resp.json()
    if introspect_resp.status_code != 200 or not introspect_data.get("active"):
        return jsonify({"error": "Token inválido"}), 401

    current_user_id = introspect_data.get("sub")
    user_input = request.json
    logging.debug(f"[create_user] Datos recibidos: {user_input}")
    
    if not user_input.get("email"):
        return jsonify({"error": "Falta el email del usuario"}), 400
    
    # Obtener nombre y apellido desde los campos correspondientes
    first_name = user_input.get("firstName", "")
    last_name = user_input.get("lastName", "")
    
    # Si no hay firstName pero hay name, intentar dividir name en firstName y lastName
    if not first_name and user_input.get("name"):
        name_parts = user_input.get("name").split(maxsplit=1)
        first_name = name_parts[0] if len(name_parts) > 0 else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
    
    # Construir el objeto de usuario en el formato que Keycloak espera
    new_user = {
        "username": user_input.get("email"),
        "email": user_input.get("email"),
        "firstName": first_name,
        "lastName": last_name,
        "enabled": True,
        "emailVerified": False,
        "attributes": {
            "gender": [user_input.get("gender", "")],
            "birth_date": [user_input.get("birthdate", "")],
            "phone_number": [user_input.get("phone_number", "")],
            "created_by": [user_input.get("created_by") or current_user_id],
            "professor_id": [user_input.get("professor_id") or current_user_id]
        }
    }
    
    # Si se proporciona una contraseña, configurarla
    if user_input.get("password"):
        new_user["credentials"] = [{
            "type": "password",
            "value": user_input.get("password"),
            "temporary": False
        }]
    else:
        # Generar una contraseña temporal aleatoria si no se proporciona una
        import random
        import string
        random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
        new_user["credentials"] = [{
            "type": "password",
            "value": random_password,
            "temporary": True
        }]

    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500

    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    create_url = f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users"
    
    logging.debug(f"[create_user] Enviando datos a Keycloak: {new_user}")
    response = requests.post(create_url, headers=headers, json=new_user, **request_settings)
    
    if response.status_code not in (201, 204):
        logging.error(f"[create_user] Error al crear usuario: {response.status_code}, {response.text}")
        return jsonify({
            "error": "Error al crear el usuario", 
            "status_code": response.status_code,
            "details": response.text
        }), response.status_code

    # Si la creación fue exitosa, obtener el ID del usuario creado para devolverlo
    search_url = f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users?username={new_user['username']}"
    search_response = requests.get(search_url, headers=headers, **request_settings)
    
    if search_response.status_code == 200 and search_response.json():
        created_user = search_response.json()[0]
        return jsonify({
            "message": "Usuario creado exitosamente",
            "id": created_user.get("id"),
            "username": created_user.get("username"),
            "firstName": created_user.get("firstName"),
            "lastName": created_user.get("lastName"),
            "email": created_user.get("email"),
            "attributes": created_user.get("attributes")
        }), 201
    
    return jsonify({"message": "Usuario creado exitosamente"}), 201

# ----------------------------------------------------------------------
# ENDPOINT: Eliminar Usuario
# ----------------------------------------------------------------------
@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """
    Endpoint para eliminar un usuario específico.
    Solo puede eliminarlo el profesor que lo creó o que está asociado a él.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401
    
    # Validar token y obtener ID del profesor actual
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    introspect_data = introspect_resp.json()
    
    if introspect_resp.status_code != 200 or not introspect_data.get("active"):
        return jsonify({"error": "Token inválido"}), 401
    
    current_user_id = introspect_data.get("sub")
    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500

    # Primero verificamos si el usuario actual tiene permiso para eliminar este usuario
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    # Obtener información del usuario a eliminar
    user_info_url = f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}"
    user_resp = requests.get(user_info_url, headers=headers, **request_settings)
    
    if user_resp.status_code != 200:
        logging.error(f"[delete_user] Error obteniendo usuario: {user_resp.text}")
        return jsonify({"error": "No se pudo obtener información del usuario"}), 500
    
    user_data = user_resp.json()
    attributes = user_data.get("attributes", {})
    
    # Verificar que el usuario actual es el creador o tiene permisos para eliminar
    creator_id = None
    if "created_by" in attributes:
        creator_array = attributes["created_by"]
        creator_id = creator_array[0] if creator_array and len(creator_array) > 0 else None

    if creator_id != current_user_id:
        # Verificar si el usuario actual tiene rol de administrador
        try:
            token_parts = token.split('.')
            payload_b64 = token_parts[1] + '=' * ((4 - len(token_parts[1]) % 4) % 4)
            payload_data = json.loads(base64.urlsafe_b64decode(payload_b64))
            client_roles = payload_data.get("resource_access", {}).get(CLIENT_ID, {}).get("roles", [])
            realm_roles = payload_data.get("realm_access", {}).get("roles", [])
            roles = client_roles + realm_roles
            
            is_admin = "admin" in roles or "realm-admin" in roles
            
            if not is_admin:
                return jsonify({"error": "No tienes permiso para eliminar este usuario"}), 403
                
        except Exception as e:
            logging.error(f"[delete_user] Error verificando roles: {e}")
            return jsonify({"error": "Error al verificar permisos"}), 500
    
    # Realizar la eliminación
    delete_resp = requests.delete(user_info_url, headers=headers, **request_settings)
    
    if delete_resp.status_code not in (200, 204):
        logging.error(f"[delete_user] Error eliminando usuario: {delete_resp.text}")
        return jsonify({"error": "No se pudo eliminar el usuario"}), 500
    
    return jsonify({"message": f"Usuario {user_id} eliminado correctamente"}), 200

# ----------------------------------------------------------------------
# ENDPOINT: Actualizar Usuario
# ----------------------------------------------------------------------
@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """
    Endpoint para actualizar un usuario existente. Permite actualizar
    nombre, apellido, email, género, fecha de nacimiento y teléfono.
    Solo puede actualizarlo el profesor que lo creó o un administrador.
    """
    token = request.cookies.get("access_token")
    if not token:
        return jsonify({"error": "No autenticado"}), 401
    
    # Validar token y obtener ID del profesor actual
    introspect_url = f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token/introspect"
    introspect_payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "token": token
    }
    request_settings = get_request_settings()
    introspect_resp = requests.post(introspect_url, data=introspect_payload, **request_settings)
    introspect_data = introspect_resp.json()
    
    if introspect_resp.status_code != 200 or not introspect_data.get("active"):
        return jsonify({"error": "Token inválido"}), 401
    
    current_user_id = introspect_data.get("sub")
    admin_token = get_admin_token()
    if not admin_token:
        return jsonify({"error": "No se pudo obtener token administrativo"}), 500
    
    # Verificar si el usuario actual puede editar este usuario
    headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    # Obtener información del usuario a actualizar
    user_info_url = f"{KEYCLOAK_ADMIN_URL}/admin/realms/{REALM}/users/{user_id}"
    user_resp = requests.get(user_info_url, headers=headers, **request_settings)
    
    if user_resp.status_code != 200:
        logging.error(f"[update_user] Error obteniendo usuario: {user_resp.text}")
        return jsonify({"error": "No se pudo obtener información del usuario"}), 500
    
    user_data = user_resp.json()
    attributes = user_data.get("attributes", {})
    
    # Verificar que el usuario actual es el creador o tiene permiso para editar
    creator_id = None
    if "created_by" in attributes:
        creator_array = attributes["created_by"]
        creator_id = creator_array[0] if creator_array and len(creator_array) > 0 else None
    
    if creator_id != current_user_id:
        # Verificar si el usuario actual tiene rol de administrador
        try:
            token_parts = token.split('.')
            payload_b64 = token_parts[1] + '=' * ((4 - len(token_parts[1]) % 4) % 4)
            payload_data = json.loads(base64.urlsafe_b64decode(payload_b64))
            client_roles = payload_data.get("resource_access", {}).get(CLIENT_ID, {}).get("roles", [])
            realm_roles = payload_data.get("realm_access", {}).get("roles", [])
            roles = client_roles + realm_roles
            
            is_admin = "admin" in roles or "realm-admin" in roles
            
            if not is_admin:
                return jsonify({"error": "No tienes permiso para actualizar este usuario"}), 403
                
        except Exception as e:
            logging.error(f"[update_user] Error verificando roles: {e}")
            return jsonify({"error": "Error al verificar permisos"}), 500
    
    # Actualizar los campos permitidos
    update_data = request.json
    
    # Actualizar email si se proporciona
    if update_data.get("email"):
        user_data["email"] = update_data["email"]
        # Actualizar también el username si es el mismo que el email
        if user_data.get("username") == user_data.get("email"):
            user_data["username"] = update_data["email"]
    
    # Actualizar nombre y apellido si se proporcionan
    if update_data.get("firstName"):
        user_data["firstName"] = update_data["firstName"]
    
    if update_data.get("lastName"):
        user_data["lastName"] = update_data["lastName"]
    
    # Actualizar atributos personalizados
    if "attributes" not in user_data:
        user_data["attributes"] = {}
    
    if update_data.get("gender"):
        user_data["attributes"]["gender"] = [update_data["gender"]]
    
    if update_data.get("birthdate"):
        user_data["attributes"]["birth_date"] = [update_data["birthdate"]]
    
    if update_data.get("phone_number"):
        user_data["attributes"]["phone_number"] = [update_data["phone_number"]]
    
    # Enviar la actualización a Keycloak
    update_resp = requests.put(user_info_url, headers=headers, json=user_data, **request_settings)
    
    if update_resp.status_code not in (200, 204):
        logging.error(f"[update_user] Error actualizando usuario: {update_resp.text}")
        return jsonify({"error": "No se pudo actualizar el usuario"}), 500
    
    return jsonify({
        "message": "Usuario actualizado correctamente",
        "user": {
            "id": user_data.get("id"),
            "firstName": user_data.get("firstName"),
            "lastName": user_data.get("lastName"),
            "email": user_data.get("email"),
            "attributes": user_data.get("attributes")
        }
    }), 200

# Fixed version of update_user_profile endpoint
@app.route('/api/user-profile', methods=['PUT'])
def update_user_profile():
    """
    Endpoint for users to update their own profile using admin credentials.
    This works around Keycloak's limitation that users can't directly update their own profiles.
    """
    # Get the user token from Authorization header
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Missing or invalid token'}), 401
    
    token = auth_header.split(' ')[1]
    
    # Use our improved validate_token function
    user_info = validate_token(token)
    if not user_info:
        return jsonify({'error': 'Invalid or expired token'}), 401
    
    # Extract user ID from the validated token
    user_id = user_info.get('sub')
    if not user_id:
        return jsonify({'error': 'User ID not found in token'}), 400
    
    logging.debug(f"[update_user_profile] Updating profile for user {user_id}")
    
    # Get request data
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    
    # Ensure we only update the current user's profile
    # This prevents potential security issues where a user could try to update another user's profile
    request_user_id = data.get('id')
    if request_user_id and request_user_id != user_id:
        logging.warning(f"[update_user_profile] Attempt to update different user: {request_user_id} vs {user_id}")
        return jsonify({'error': 'Cannot update another user\'s profile'}), 403
    
    # Get admin token
    admin_token = get_admin_token()
    if not admin_token:
        logging.error("[update_user_profile] Failed to get admin token")
        return jsonify({'error': 'Internal server error: admin authentication failed'}), 500
    
    # Get current user data first
    headers = {
        'Authorization': f'Bearer {admin_token}',
        'Content-Type': 'application/json'
    }
    
    # Get the current user data to preserve existing fields
    user_url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users/{user_id}"
    request_settings = get_request_settings()
    user_response = requests.get(user_url, headers=headers, **request_settings)
    
    if user_response.status_code != 200:
        logging.error(f"[update_user_profile] Failed to get user data: {user_response.status_code} - {user_response.text}")
        return jsonify({'error': f'Failed to retrieve user data: {user_response.status_code}'}), 500
    
    # Get the existing user data and merge with new data
    user_data = user_response.json()
    
    # Update basic fields if provided
    if 'firstName' in data:
        user_data['firstName'] = data['firstName']
    if 'lastName' in data:
        user_data['lastName'] = data['lastName']
    
    # Ensure attributes exists
    if 'attributes' not in user_data:
        user_data['attributes'] = {}
    
    # Update attributes (handle both array and single value formats)
    if 'attributes' in data:
        for key, value in data['attributes'].items():
            # Ensure all attribute values are arrays as required by Keycloak
            if isinstance(value, list):
                user_data['attributes'][key] = value
            else:
                user_data['attributes'][key] = [value]
    
    # Handle direct attribute fields in the request
    attribute_mappings = {
        'phone': 'phone_number',
        'phone_number': 'phone_number',
        'gender': 'gender',
        'birthdate': 'birth_date',
        'birth_date': 'birth_date'
    }
    
    for client_field, keycloak_field in attribute_mappings.items():
        if client_field in data and data[client_field]:
            user_data['attributes'][keycloak_field] = [data[client_field]]
    
    # Preserve the created_by field which should never be modified by the user
    if 'created_by' in user_data.get('attributes', {}):
        created_by = user_data['attributes']['created_by']
        # Make sure we keep it even if the frontend tries to modify it
        if 'created_by' in data.get('attributes', {}) or 'createdBy' in data:
            logging.warning(f"[update_user_profile] Attempt to modify created_by field detected")
            
        # Ensure created_by stays intact
        user_data['attributes']['created_by'] = created_by
    
    # Execute the update
    update_response = requests.put(
        user_url,
        headers=headers,
        json=user_data,
        **request_settings
    )
    
    if update_response.status_code >= 400:
        logging.error(f"[update_user_profile] Failed to update user: {update_response.status_code} - {update_response.text}")
        return jsonify({'error': f'Failed to update user: {update_response.text}'}), update_response.status_code
    
    # Success - return updated user data
    return jsonify({
        'success': True, 
        'message': 'Profile updated successfully',
        'user': {
            'id': user_id,
            'firstName': user_data.get('firstName'),
            'lastName': user_data.get('lastName'),
            'attributes': user_data.get('attributes')
        }
    })

