# Mountained Backend API Documentation

Welcome to the Mountained AI-Powered Educational Backend API documentation. This backend provides comprehensive AI-driven learning features including curriculum management, quiz generation, flashcards, summaries, study tasks, analytics, and personalized learning paths.

## Table of Contents

- [Getting Started](./getting-started.md)
- [Authentication](./authentication.md)
- [API Endpoints](./api-endpoints.md)
- [AI Features](./ai-features.md)
- [Learning Materials](./learning-materials.md)
- [Quiz System](./quiz-system.md)
- [Flashcards](./flashcards.md)
- [Summaries](./summaries.md)
- [Study Tasks](./study-tasks.md)
- [Analytics & Dashboard](./analytics.md)
- [Curriculum Management](./curriculum.md)
- [User Progress](./user-progress.md)
- [Error Handling](./error-handling.md)
- [Examples](./examples.md)

## Quick Overview

The Mountained backend is a Django REST Framework-based API that provides:

### Core Features
- **AI-Powered Content Generation**: Generate quizzes, flashcards, summaries, and study tasks from uploaded materials
- **Learning Material Management**: Upload and process PDF documents with automatic text extraction
- **Intelligent Quiz System**: Create adaptive quizzes with GPT-generated questions and explanations
- **Flashcard Generation**: Auto-create study flashcards from learning materials
- **Summary Generation**: Generate concise summaries for quick review
- **Study Task Planning**: Create personalized study todo lists
- **Analytics Dashboard**: Track learning progress and performance metrics
- **Curriculum Management**: Organize learning by topics and subjects
- **User Progress Tracking**: Monitor learning achievements and milestones

### AI Integration
- **OpenAI GPT Integration**: Uses GPT-4.1-mini for content generation
- **Automatic Topic Mapping**: Uses scikit-learn for intelligent topic classification
- **Content Analysis**: Extracts and analyzes learning materials
- **Personalized Recommendations**: Provides study suggestions based on performance

## Base URL

```
http://localhost:8000/api/
```

## Quick Start

1. **Upload Learning Material**
   ```bash
   POST /api/learning-materials/
   ```

2. **Generate Quiz from File**
   ```bash
   POST /api/learning-materials/generate_quiz_from_file/
   ```

3. **Take Quiz**
   ```bash
   GET /api/quizzes/{id}/questions/
   POST /api/quizzes/{id}/submit_answers/
   ```

4. **View Analytics**
   ```bash
   GET /api/analytics/dashboard/
   ```

## Support

For questions or issues, please refer to the detailed documentation in each section or contact the development team.
