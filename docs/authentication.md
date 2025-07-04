# Authentication

## Overview

The Mountained backend currently uses Django's built-in authentication system with session-based authentication for development. The API is configured with permissive permissions for easy integration during development.

## Current Authentication Method

### Session Authentication
- Default Django session authentication
- Suitable for web applications with same-origin requests
- Automatically handles CSRF protection

## Authentication Endpoints

### User Registration
```http
POST /api/users/
Content-Type: application/json

{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword",
    "first_name": "John",
    "last_name": "Doe"
}
```

### User Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "username": "newuser",
    "password": "securepassword"
}
```

### User Logout
```http
POST /api/auth/logout/
```

### Get Current User
```http
GET /api/auth/user/
```

## Permission Levels

### Current Settings (Development)
- **AllowAny**: Most endpoints are open for development
- **IsAuthenticated**: Some user-specific endpoints require authentication

### Production Recommendations
For production deployment, consider implementing:

1. **Token Authentication**
   ```python
   # Add to INSTALLED_APPS
   'rest_framework.authtoken',
   
   # Update REST_FRAMEWORK settings
   'DEFAULT_AUTHENTICATION_CLASSES': [
       'rest_framework.authentication.TokenAuthentication',
   ],
   'DEFAULT_PERMISSION_CLASSES': [
       'rest_framework.permissions.IsAuthenticated',
   ],
   ```

2. **JWT Authentication**
   ```bash
   pip install djangorestframework-simplejwt
   ```

## User Model

The backend uses a custom user model with additional fields:

```python
{
    "id": 1,
    "username": "johndoe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "is_active": true,
    "date_joined": "2024-01-01T00:00:00Z"
}
```

## Frontend Integration

### JavaScript Example
```javascript
// Login
const login = async (username, password) => {
    const response = await fetch('/api/auth/login/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
    });
    return response.json();
};

// Get CSRF token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
```

### React Example
```jsx
import { useState, useEffect } from 'react';

const useAuth = () => {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        checkAuth();
    }, []);
    
    const checkAuth = async () => {
        try {
            const response = await fetch('/api/auth/user/', {
                credentials: 'include'
            });
            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    };
    
    const login = async (credentials) => {
        // Login implementation
    };
    
    const logout = async () => {
        await fetch('/api/auth/logout/', {
            method: 'POST',
            credentials: 'include'
        });
        setUser(null);
    };
    
    return { user, login, logout };
};
```

## Security Considerations

### Development
- CORS is configured to allow all origins
- CSRF protection is enabled
- Session cookies are used

### Production Recommendations
1. Configure specific CORS origins
2. Use HTTPS only
3. Implement rate limiting
4. Add proper token authentication
5. Enable additional security headers
6. Use environment variables for secrets

## Error Responses

### Authentication Errors
```json
{
    "detail": "Authentication credentials were not provided."
}
```

### Permission Errors
```json
{
    "detail": "You do not have permission to perform this action."
}
```

### Invalid Credentials
```json
{
    "non_field_errors": ["Unable to log in with provided credentials."]
}
```
