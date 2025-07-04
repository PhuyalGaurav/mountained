# AI Features

## Overview

The Mountained backend leverages advanced AI technologies to provide intelligent educational features. The system uses OpenAI's GPT models for content generation and scikit-learn for topic classification and analysis.

## AI Components

### 1. OpenAI GPT Integration
- **Model**: GPT-4.1-mini (configurable)
- **Purpose**: Content generation, question creation, summarization
- **Features**: Context-aware responses, educational content optimization

### 2. Scikit-Learn ML Pipeline
- **Vectorization**: TF-IDF for text analysis
- **Classification**: Topic mapping and content categorization
- **Analysis**: Learning pattern recognition

## AI-Powered Features

### 1. Intelligent Quiz Generation

Automatically generates educational quizzes from uploaded learning materials.

**Endpoint**: `POST /api/learning-materials/generate_quiz_from_file/`

**Features**:
- Context-aware question generation
- Multiple difficulty levels
- Detailed explanations
- Various question types (MCQ, True/False, Short Answer)

**Example Request**:
```bash
curl -X POST http://localhost:8000/api/learning-materials/generate_quiz_from_file/ \
  -F "file=@document.pdf" \
  -F "title=Physics Quiz" \
  -F "num_questions=10" \
  -F "difficulty=medium"
```

**AI Process**:
1. Extract text from uploaded document
2. Analyze content structure and key concepts
3. Generate contextually relevant questions
4. Create detailed explanations for each answer
5. Assign appropriate difficulty levels

### 2. Smart Flashcard Generation

Creates study flashcards automatically from learning materials.

**Method**: `learning_material.generate_flashcards()`

**Features**:
- Key concept identification
- Question-answer pair generation
- Spaced repetition optimization
- Topic-based organization

**AI Process**:
1. Identify key terms and concepts
2. Generate meaningful questions
3. Create concise, accurate answers
4. Organize by difficulty and topic

### 3. Intelligent Summarization

Generates concise summaries of learning materials for quick review.

**Method**: `learning_material.generate_summary()`

**Features**:
- Key point extraction
- Concept hierarchy preservation
- Customizable summary length
- Structured format

**AI Process**:
1. Analyze document structure
2. Identify main concepts and supporting details
3. Create hierarchical summary
4. Optimize for readability and comprehension

### 4. Study Task Planning

Creates personalized study plans and task lists.

**Method**: `learning_material.generate_study_tasks()`

**Features**:
- Adaptive task scheduling
- Progress-based recommendations
- Difficulty progression
- Goal-oriented planning

**AI Process**:
1. Analyze learning material complexity
2. Break down into manageable tasks
3. Sequence based on dependency and difficulty
4. Provide time estimates and milestones

### 5. Automatic Topic Mapping

Intelligently categorizes content by subject and topic.

**Method**: `learning_material.auto_map_topic()`

**Features**:
- Multi-level categorization
- Subject area detection
- Topic relationship mapping
- Confidence scoring

**AI Process**:
1. Extract text features using TF-IDF
2. Apply trained classification models
3. Map to curriculum topics
4. Assign confidence scores

## AI Configuration

### OpenAI Settings

Configure in your `.env` file:
```env
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL=gpt-4.1-mini
OPENAI_MAX_TOKENS=2000
OPENAI_TEMPERATURE=0.7
```

### Model Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `temperature` | 0.7 | Creativity vs consistency (0-1) |
| `max_tokens` | 2000 | Maximum response length |
| `top_p` | 1.0 | Nucleus sampling parameter |
| `frequency_penalty` | 0.0 | Repetition reduction |

### Topic Classification

The system uses a pre-trained model for topic classification:
```python
# Load curriculum topics for classification
topics = CurriculumTopic.objects.all()
vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
```

## AI Quality Controls

### 1. Content Validation
- Factual accuracy checks
- Educational appropriateness
- Difficulty level validation
- Language quality assessment

### 2. Bias Mitigation
- Diverse training examples
- Regular model evaluation
- Content review processes
- Feedback incorporation

### 3. Performance Monitoring
- Response quality metrics
- Generation speed tracking
- Error rate monitoring
- User satisfaction scores

## Frontend Integration

### JavaScript Example
```javascript
// Generate quiz from file
const generateQuiz = async (file, options = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', options.title || 'Generated Quiz');
    formData.append('num_questions', options.numQuestions || 10);
    formData.append('difficulty', options.difficulty || 'medium');
    
    const response = await fetch('/api/learning-materials/generate_quiz_from_file/', {
        method: 'POST',
        body: formData,
        credentials: 'include'
    });
    
    return response.json();
};

// Generate flashcards
const generateFlashcards = async (materialId) => {
    const response = await fetch(`/api/learning-materials/${materialId}/`, {
        method: 'GET',
        credentials: 'include'
    });
    
    const material = await response.json();
    // Flashcards are automatically generated and linked to the material
    
    const flashcardsResponse = await fetch(`/api/flashcards/?learning_material=${materialId}`);
    return flashcardsResponse.json();
};
```

### React Hook Example
```jsx
import { useState } from 'react';

const useAIGeneration = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const generateContent = async (type, data) => {
        setLoading(true);
        setError(null);
        
        try {
            let endpoint;
            switch (type) {
                case 'quiz':
                    endpoint = '/api/learning-materials/generate_quiz_from_file/';
                    break;
                case 'flashcards':
                    // Automatically generated when material is uploaded
                    break;
                default:
                    throw new Error('Unknown generation type');
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                body: data,
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Generation failed');
            }
            
            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };
    
    return { generateContent, loading, error };
};
```

## Performance Considerations

### 1. Caching
- Generated content is cached in the database
- Avoid regenerating identical content
- Use intelligent cache invalidation

### 2. Async Processing
- Long-running AI tasks use background processing
- Status endpoints for tracking progress
- Real-time updates via WebSocket (future)

### 3. Rate Limiting
- Implement per-user generation limits
- Monitor API usage costs
- Queue system for high-demand periods

## Error Handling

### Common AI Errors
```json
{
    "error": "ai_generation_failed",
    "message": "Failed to generate quiz questions",
    "details": {
        "openai_error": "Token limit exceeded",
        "retry_after": 60
    }
}
```

### Fallback Strategies
1. Retry with reduced complexity
2. Use cached similar content
3. Manual content creation prompts
4. Progressive enhancement

## Future Enhancements

### Planned Features
1. **Adaptive Learning**: Personalized difficulty adjustment
2. **Multi-modal AI**: Image and video content analysis
3. **Real-time Collaboration**: AI-assisted group learning
4. **Advanced Analytics**: Predictive learning insights
5. **Voice Integration**: Audio-based interactions

### Model Improvements
1. Fine-tuned educational models
2. Domain-specific knowledge bases
3. Multilingual support
4. Accessibility enhancements
