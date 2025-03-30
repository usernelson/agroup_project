"""
Fallback implementations for admin functions when Keycloak admin access fails
"""

import logging
import json
import os
import time
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

# Setup a storage directory for mock data
STORAGE_DIR = Path(os.path.dirname(os.path.abspath(__file__))) / 'storage'
STORAGE_DIR.mkdir(exist_ok=True)

# File to store mock users
USERS_FILE = STORAGE_DIR / 'mock_users.json'

def load_mock_users():
    """Load mock users from storage"""
    try:
        if USERS_FILE.exists():
            with open(USERS_FILE, 'r') as f:
                return json.load(f)
        
        # Create initial mock data
        mock_users = generate_mock_users()
        save_mock_users(mock_users)
        return mock_users
    except Exception as e:
        logger.error(f"Error loading mock users: {e}")
        return generate_mock_users()

def save_mock_users(users):
    """Save mock users to storage"""
    try:
        with open(USERS_FILE, 'w') as f:
            json.dump(users, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"Error saving mock users: {e}")
        return False

def generate_mock_users():
    """Generate mock user data"""
    current_timestamp = int(time.time())
    
    return [
        {
            "id": "mock-1",
            "email": "estudiante1@ejemplo.com",
            "firstName": "👤 Juan (Ejemplo)",
            "lastName": "Pérez",
            "enabled": True,
            "role": "alumno",
            "attributes": {
                "phone_number": ["+56 9 1234 5678"],
                "gender": ["Masculino"],
                "birth_date": ["1995-05-15"],
                "created_by": ["992a31a3-3f01-4d6c-9a3a-18fe12375630"]
            },
            "createdTimestamp": current_timestamp * 1000
        },
        {
            "id": "mock-2",
            "email": "estudiante2@ejemplo.com",
            "firstName": "👤 María (Ejemplo)",
            "lastName": "González",
            "enabled": True,
            "role": "alumno",
            "attributes": {
                "phone_number": ["+56 9 8765 4321"],
                "gender": ["Femenino"],
                "birth_date": ["1997-08-22"],
                "created_by": ["992a31a3-3f01-4d6c-9a3a-18fe12375630"]
            },
            "createdTimestamp": current_timestamp * 1000
        },
        {
            "id": "mock-3",
            "email": "estudiante3@ejemplo.com",
            "firstName": "👤 Carlos (Ejemplo)",
            "lastName": "Rodríguez",
            "enabled": False,
            "role": "alumno",
            "attributes": {
                "gender": ["Masculino"],
                "birth_date": ["1996-03-10"],
                "created_by": ["992a31a3-3f01-4d6c-9a3a-18fe12375630"]
            },
            "createdTimestamp": current_timestamp * 1000
        }
    ]

def fallback_get_users(current_user_id):
    """Fallback function for getting users created by current user"""
    logger.warning("Using fallback for get_users due to admin token failure")
    
    mock_users = load_mock_users()
    
    # Filter users by creator ID
    filtered_users = []
    for user in mock_users:
        created_by = user.get("attributes", {}).get("created_by", [""])[0]
        if created_by == current_user_id:
            filtered_users.append(user)
    
    # If no users match this creator, provide at least one example
    if not filtered_users and mock_users:
        # Clone the first mock user and update its created_by attribute
        example = dict(mock_users[0])
        if "attributes" not in example:
            example["attributes"] = {}
        example["attributes"]["created_by"] = [current_user_id]
        example["id"] = f"example-{str(uuid.uuid4())[:8]}"
        example["firstName"] = "👤 Ejemplo"
        example["lastName"] = "para Usuario Actual"
        filtered_users.append(example)
    
    return filtered_users

def fallback_create_user(user_data, creator_id):
    """Fallback function for creating a user"""
    logger.warning("Using fallback for create_user due to admin token failure")
    
    mock_users = load_mock_users()
    
    # Create a new user with provided data
    new_user = {
        "id": f"mock-{str(uuid.uuid4())}",
        "email": user_data.get("email", ""),
        "firstName": user_data.get("firstName", ""),
        "lastName": user_data.get("lastName", ""),
        "enabled": user_data.get("enabled", True),
        "role": "alumno",
        "attributes": {
            "phone_number": [user_data.get("phone_number", "")],
            "gender": [user_data.get("gender", "")],
            "birth_date": [user_data.get("birthdate", "")],
            "created_by": [creator_id]
        },
        "createdTimestamp": int(time.time()) * 1000
    }
    
    mock_users.append(new_user)
    save_mock_users(mock_users)
    
    return new_user

def fallback_update_user(user_id, user_data):
    """Fallback function for updating a user"""
    logger.warning("Using fallback for update_user due to admin token failure")
    
    mock_users = load_mock_users()
    
    # Find the user to update
    for i, user in enumerate(mock_users):
        if user["id"] == user_id:
            # Update basic fields
            if "firstName" in user_data:
                mock_users[i]["firstName"] = user_data["firstName"]
            if "lastName" in user_data:
                mock_users[i]["lastName"] = user_data["lastName"]
            if "enabled" in user_data:
                mock_users[i]["enabled"] = user_data["enabled"]
            
            # Ensure attributes exist
            if "attributes" not in mock_users[i]:
                mock_users[i]["attributes"] = {}
            
            # Update attributes
            attrs = mock_users[i]["attributes"]
            if "gender" in user_data:
                attrs["gender"] = [user_data["gender"]]
            if "birthdate" in user_data:
                attrs["birth_date"] = [user_data["birthdate"]]
            if "phone_number" in user_data:
                attrs["phone_number"] = [user_data["phone_number"]]
            
            # Never modify created_by
            if "created_by" in user_data and "created_by" in attrs:
                # Keep original created_by
                pass
            
            save_mock_users(mock_users)
            return mock_users[i]
    
    # User not found
    return None

def fallback_delete_user(user_id):
    """Fallback function for deleting a user"""
    logger.warning("Using fallback for delete_user due to admin token failure")
    
    mock_users = load_mock_users()
    
    # Find and remove the user
    for i, user in enumerate(mock_users):
        if user["id"] == user_id:
            del mock_users[i]
            save_mock_users(mock_users)
            return True
    
    # User not found
    return False
