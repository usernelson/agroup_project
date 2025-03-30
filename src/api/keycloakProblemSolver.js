/**
 * Keycloak Problem Solver
 * 
 * Utility to help diagnose and suggest fixes for common Keycloak authentication issues
 */

/**
 * Checks common Keycloak admin token issues and returns diagnostic information
 * @returns {Object} - Diagnostic information and suggestions
 */
export const diagnoseKeycloakAdminIssue = async () => {
  console.log('[KeycloakProblemSolver] Running diagnostics...');
  
  const issues = [];
  const suggestions = [];
  
  // 1. Check if there's a valid user token
  const userToken = localStorage.getItem('token');
  if (!userToken) {
    issues.push('No user authentication token found');
    suggestions.push('Log in to the application first');
  } else {
    try {
      // Basic token structure check
      const parts = userToken.split('.');
      if (parts.length !== 3) {
        issues.push('User token has invalid format');
        suggestions.push('Log out and log in again to get a fresh token');
      } else {
        // Check payload
        const payload = JSON.parse(atob(parts[1]));
        console.log('[KeycloakProblemSolver] Token payload:', payload);
        
        // Check for admin or realm-management roles
        let hasAdminRole = false;
        
        if (payload.resource_access && 
            payload.resource_access.realm_management &&
            payload.resource_access.realm_management.roles) {
          
          hasAdminRole = payload.resource_access.realm_management.roles.includes('manage-users');
        }
        
        if (!hasAdminRole && payload.realm_access && payload.realm_access.roles) {
          hasAdminRole = payload.realm_access.roles.includes('admin') || 
                         payload.realm_access.roles.includes('realm-admin');
        }
        
        if (!hasAdminRole) {
          issues.push('User token does not have admin/manage-users roles');
          suggestions.push('Backend should use a service account with realm-management/manage-users role');
        }
        
        // Check token expiration
        const expiryTime = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        if (expiryTime < now) {
          issues.push('User token is expired');
          suggestions.push('Log out and log in again to get a fresh token');
        } else {
          const minutesRemaining = Math.floor((expiryTime - now) / 60000);
          console.log(`[KeycloakProblemSolver] Token expires in ${minutesRemaining} minutes`);
        }
      }
    } catch (error) {
      issues.push('Error parsing user token');
      suggestions.push('Log out and log in again to get a fresh token');
      console.error('[KeycloakProblemSolver] Token parse error:', error);
    }
  }
  
  // Backend Admin Configuration Suggestions
  suggestions.push(
    'Make sure your backend has a valid service account with admin permissions',
    'Check if the admin token in your backend has expired or been revoked',
    'Ensure your backend is using client credentials flow with the correct client_secret'
  );
  
  return {
    timestamp: new Date().toISOString(),
    issues,
    suggestions,
    actionRequired: issues.length > 0,
    useMockData: true
  };
};

/**
 * Generates a backend configuration guide for Keycloak admin access
 * @returns {string} - Configuration guide as markdown
 */
export const generateKeycloakAdminConfigGuide = () => {
  return `
# Fixing Keycloak Admin Access

Here's how to fix the 401 Unauthorized errors when accessing Keycloak admin API:

## Backend Configuration

1. Edit your Python backend configuration:

\`\`\`python
# Keycloak admin credentials
KEYCLOAK_ADMIN_CLIENT_ID = "admin-cli"  # Use admin-cli client for administration
KEYCLOAK_ADMIN_CLIENT_SECRET = "your-admin-cli-secret" # Optional, if client is confidential
KEYCLOAK_ADMIN_USERNAME = "admin"       # Keycloak admin username
KEYCLOAK_ADMIN_PASSWORD = "your-secure-password"  # Keycloak admin password
\`\`\`

2. Ensure your admin token retrieval doesn't use stale cached tokens:

\`\`\`python
def get_admin_token():
    """Get a fresh admin token for Keycloak administration."""
    # Don't use cached tokens as they expire
    token_data = {
        "client_id": KEYCLOAK_ADMIN_CLIENT_ID,
        "grant_type": "password",
        "username": KEYCLOAK_ADMIN_USERNAME,
        "password": KEYCLOAK_ADMIN_PASSWORD
    }
    
    if KEYCLOAK_ADMIN_CLIENT_SECRET:
        token_data["client_secret"] = KEYCLOAK_ADMIN_CLIENT_SECRET
    
    response = requests.post(
        f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token",
        data=token_data
    )
    
    if response.status_code != 200:
        print(f"Error getting admin token: {response.text}")
        raise Exception(f"Failed to get admin token: {response.status_code}")
        
    return response.json()["access_token"]
\`\`\`

3. Use the token for admin requests:

\`\`\`python
def get_users():
    admin_token = get_admin_token()  # Get fresh token every time
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{KEYCLOAK_URL}/admin/realms/{REALM_NAME}/users", headers=headers)
    # Process response...
\`\`\`
  `;
};

export default {
  diagnoseKeycloakAdminIssue,
  generateKeycloakAdminConfigGuide
};
