# API Documentation

## Overview

This document describes the API endpoints and usage for this project.

## Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

## Authentication

### API Key Authentication
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://api.example.com/endpoint
```

### Example Headers
```javascript
{
  "Authorization": "Bearer YOUR_API_KEY",
  "Content-Type": "application/json"
}
```

## Endpoints

### Users

#### GET /users
Get a list of users.

**Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (default: 20)
- `search` (string, optional): Search term

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "created_at": "2023-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### POST /users
Create a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### GET /users/{id}
Get a specific user by ID.

**Parameters:**
- `id` (string, required): User ID

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "created_at": "2023-01-01T00:00:00Z"
}
```

#### PUT /users/{id}
Update a user.

**Parameters:**
- `id` (string, required): User ID

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### DELETE /users/{id}
Delete a user.

**Parameters:**
- `id` (string, required): User ID

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

## Rate Limiting

API requests are rate limited:
- **Free tier**: 100 requests per hour
- **Premium tier**: 1000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (1-based, default: 1)
- `limit`: Items per page (max: 100, default: 20)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "has_next": true,
    "has_prev": false
  }
}
```

## Filtering and Sorting

### Filtering
```
GET /users?status=active&role=admin
```

### Sorting
```
GET /users?sort=created_at&order=desc
```

### Search
```
GET /users?search=john
```

## Data Types

### User Object
```typescript
interface User {
  id: string;           // UUID
  email: string;        // Email address
  name: string;         // Full name
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin' | 'moderator';
  created_at: string;   // ISO 8601 datetime
  updated_at: string;   // ISO 8601 datetime
}
```

## Examples

### JavaScript/Node.js
```javascript
const response = await fetch('/api/users', {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

### Python
```python
import requests

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

response = requests.get('/api/users', headers=headers)
data = response.json()
```

### cURL
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  "https://api.example.com/users"
```

## Webhooks

### Webhook Events
- `user.created` - When a new user is created
- `user.updated` - When a user is updated
- `user.deleted` - When a user is deleted

### Webhook Payload
```json
{
  "event": "user.created",
  "timestamp": "2023-01-01T00:00:00Z",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

## SDKs and Libraries

- **JavaScript**: `npm install @yourproject/sdk`
- **Python**: `pip install yourproject-sdk`
- **Go**: `go get github.com/yourproject/sdk-go`

## Support

- Documentation: [docs.yourproject.com](https://docs.yourproject.com)
- Support: support@yourproject.com
- Status: [status.yourproject.com](https://status.yourproject.com)