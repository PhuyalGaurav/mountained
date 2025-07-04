# API Endpoints

## Base URL
```
http://localhost:8000/api/
```

## Core Resources

### Learning Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/learning-materials/` | List all learning materials |
| POST | `/learning-materials/` | Upload new learning material |
| GET | `/learning-materials/{id}/` | Get specific material |
| PUT | `/learning-materials/{id}/` | Update material |
| DELETE | `/learning-materials/{id}/` | Delete material |
| POST | `/learning-materials/generate_quiz_from_file/` | Generate quiz from uploaded file |

### Quizzes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quizzes/` | List all quizzes |
| POST | `/quizzes/` | Create new quiz |
| GET | `/quizzes/{id}/` | Get specific quiz |
| PUT | `/quizzes/{id}/` | Update quiz |
| DELETE | `/quizzes/{id}/` | Delete quiz |
| GET | `/quizzes/{id}/questions/` | Get quiz questions |
| POST | `/quizzes/{id}/submit_answers/` | Submit quiz answers |

### Quiz Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quiz-questions/` | List all questions |
| POST | `/quiz-questions/` | Create new question |
| GET | `/quiz-questions/{id}/` | Get specific question |
| PUT | `/quiz-questions/{id}/` | Update question |
| DELETE | `/quiz-questions/{id}/` | Delete question |

### Quiz Attempts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/quiz-attempts/` | List user's attempts |
| POST | `/quiz-attempts/` | Create new attempt |
| GET | `/quiz-attempts/{id}/` | Get specific attempt |

### Flashcards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flashcards/` | List all flashcards |
| POST | `/flashcards/` | Create new flashcard |
| GET | `/flashcards/{id}/` | Get specific flashcard |
| PUT | `/flashcards/{id}/` | Update flashcard |
| DELETE | `/flashcards/{id}/` | Delete flashcard |

### Summaries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/summaries/` | List all summaries |
| POST | `/summaries/` | Create new summary |
| GET | `/summaries/{id}/` | Get specific summary |
| PUT | `/summaries/{id}/` | Update summary |
| DELETE | `/summaries/{id}/` | Delete summary |

### Study Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/study-tasks/` | List all study tasks |
| POST | `/study-tasks/` | Create new study task |
| GET | `/study-tasks/{id}/` | Get specific task |
| PUT | `/study-tasks/{id}/` | Update task |
| DELETE | `/study-tasks/{id}/` | Delete task |

### Curriculum Topics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/curriculum-topics/` | List all topics |
| POST | `/curriculum-topics/` | Create new topic |
| GET | `/curriculum-topics/{id}/` | Get specific topic |
| PUT | `/curriculum-topics/{id}/` | Update topic |
| DELETE | `/curriculum-topics/{id}/` | Delete topic |

### Personalized Curriculum
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/personalized-curriculum/` | List user's curriculum |
| POST | `/personalized-curriculum/` | Create curriculum entry |
| GET | `/personalized-curriculum/{id}/` | Get specific entry |
| PUT | `/personalized-curriculum/{id}/` | Update entry |
| DELETE | `/personalized-curriculum/{id}/` | Delete entry |

### User Progress
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user-progress/` | List user's progress |
| POST | `/user-progress/` | Create progress entry |
| GET | `/user-progress/{id}/` | Get specific progress |
| PUT | `/user-progress/{id}/` | Update progress |
| DELETE | `/user-progress/{id}/` | Delete progress |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/analytics/` | List user analytics |
| GET | `/analytics/dashboard/` | Get dashboard data |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/` | List users (admin only) |
| POST | `/users/` | Register new user |
| GET | `/users/{id}/` | Get user profile |
| PUT | `/users/{id}/` | Update user |

## Content Types

All endpoints accept and return JSON data unless otherwise specified.

### File Upload Endpoints
For file uploads (learning materials), use `multipart/form-data`:

```http
POST /api/learning-materials/
Content-Type: multipart/form-data

{
    "title": "Sample Document",
    "subject": "Mathematics",
    "topic": "Algebra",
    "file": [binary file data]
}
```

## Common Headers

### Request Headers
```http
Content-Type: application/json
Accept: application/json
X-CSRFToken: [csrf-token]  # For POST/PUT/DELETE requests
```

### Response Headers
```http
Content-Type: application/json
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## Pagination

List endpoints support pagination with the following parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `page` | Page number | 1 |
| `page_size` | Items per page | 20 |

### Pagination Response Format
```json
{
    "count": 100,
    "next": "http://localhost:8000/api/learning-materials/?page=3",
    "previous": "http://localhost:8000/api/learning-materials/?page=1",
    "results": [
        // ... array of objects
    ]
}
```

## Filtering and Search

### Query Parameters
Most list endpoints support filtering:

```http
GET /api/learning-materials/?subject=Mathematics
GET /api/quizzes/?difficulty=medium
GET /api/flashcards/?topic=algebra
```

### Search
```http
GET /api/learning-materials/?search=calculus
GET /api/quizzes/?search=geometry
```

## Ordering

Use the `ordering` parameter to sort results:

```http
GET /api/learning-materials/?ordering=created_at
GET /api/quizzes/?ordering=-score  # Descending order
```

Available ordering fields vary by endpoint. Common fields:
- `created_at`, `-created_at`
- `updated_at`, `-updated_at`
- `title`, `-title`
- `score`, `-score`

## Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 204 | No Content - Resource deleted successfully |
| 400 | Bad Request - Invalid request data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Permission denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

## Rate Limiting

Currently no rate limiting is implemented for development. For production, consider implementing rate limiting based on user or IP address.

## API Versioning

The current API is version 1. Future versions may be available at `/api/v2/` etc.
