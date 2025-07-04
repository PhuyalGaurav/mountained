# Getting Started

## Prerequisites

- Python 3.11+
- Django 4.2+
- PostgreSQL (or SQLite for development)
- OpenAI API key
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mountained-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   DATABASE_URL=sqlite:///db.sqlite3
   OPENAI_API_KEY=your-openai-api-key
   ALLOWED_HOSTS=localhost,127.0.0.1
   ```

5. **Database Setup**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Load Sample Data (Optional)**
   ```bash
   python manage.py load_curriculum
   ```

7. **Run Development Server**
   ```bash
   python manage.py runserver
   ```

## API Testing

The API is now available at `http://localhost:8000/api/`

### Using Django REST Framework Browsable API
Navigate to `http://localhost:8000/api/` in your browser to explore the API using DRF's built-in interface.

### Using curl
```bash
# Test API health
curl http://localhost:8000/api/

# List learning materials
curl http://localhost:8000/api/learning-materials/
```

## CORS Configuration

The backend is configured for development with permissive CORS settings. In production, update `CORS_ALLOWED_ORIGINS` in `settings.py` to include only your frontend domains.

## Admin Interface

Access the Django admin at `http://localhost:8000/admin/` using the superuser credentials you created.

## Next Steps

- Review the [API Endpoints](./api-endpoints.md) documentation
- Explore [AI Features](./ai-features.md) for content generation
- Check out [Examples](./examples.md) for common use cases
