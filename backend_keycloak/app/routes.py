from flask import Blueprint, request, jsonify, current_app
from app.keycloak_auth import get_access_token, verify_mfa

routes = Blueprint('routes', __name__)

@routes.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({"error": "Se requieren username y password."}), 400

    keycloak_response = get_access_token(username, password)

    # Si se detecta error en la respuesta, lo logueamos y lo devolvemos
    if keycloak_response.get("error"):
        current_app.logger.error(f"Error de autenticación: {keycloak_response}")
        return jsonify({
            "error": "Credenciales inválidas",
            "details": keycloak_response
        }), 401

    # Si Keycloak indica que se requiere MFA
    if "challenge" in keycloak_response:
        return jsonify({
            "mfa_required": True,
            "challenge": keycloak_response["challenge"]
        })

    return jsonify({
        "access_token": keycloak_response.get("access_token"),
        "refresh_token": keycloak_response.get("refresh_token")
    })

@routes.route('/verify-mfa', methods=['POST'])
def verify_mfa_route():
    data = request.get_json() or {}
    challenge = data.get('challenge')
    mfa_code = data.get('mfa_code')
    
    if not challenge or not mfa_code:
        return jsonify({"error": "Se requieren challenge y mfa_code."}), 400

    keycloak_response = verify_mfa(challenge, mfa_code)

    if keycloak_response.get("error"):
        current_app.logger.error(f"Fallo en verificación MFA: {keycloak_response}")
        return jsonify({
            "error": "Código MFA inválido",
            "details": keycloak_response
        }), 401

    return jsonify({
        "access_token": keycloak_response.get("access_token"),
        "refresh_token": keycloak_response.get("refresh_token")
    })

