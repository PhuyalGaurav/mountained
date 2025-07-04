# Quiz System

## Features
- AI-powered quiz generation from PDFs and text files
- Multiple question types: multiple choice, true/false, short answer
- Real-time quiz taking with instant results
- Detailed explanations for each answer
- Progress tracking and analytics

## Question Types

**Multiple Choice**
```json
{
    "question_type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"]
}
```


**True/False**
```json
{
    "question_type": "true_false"
}
```

**Short Answer**
```json
{
    "question_type": "short_answer"
}
```

## API Endpoints

### List All Quizzes
```http
GET /api/quizzes/
```
**Response:**
```json
{
    "results": [
        {
            "id": 1,
            "title": "Math Quiz",
            "difficulty": "medium",
            "question_count": 10
        }
    ]
}
```

### Create Quiz
```http
POST /api/quizzes/
```
**Payload:**
```json
{
    "title": "New Quiz",
    "learning_material": 2,
    "difficulty": "medium"
}
```

### Get Quiz Questions
```http
GET /api/quizzes/{id}/questions/
```
**Response:**
```json
{
    "quiz_id": 1,
    "title": "Math Quiz",
    "questions": [
        {
            "id": 15,
            "question_text": "What is 2+2?",
            "question_type": "multiple_choice",
            "options": ["3", "4", "5", "6"],
            "order": 1
        }
    ]
}
```

### Submit Quiz Answers
```http
POST /api/quizzes/{id}/submit_answers/
```
**Payload:**
```json
{
    "answers": {
        "15": "4",
        "16": "True"
    }
}
```
**Response:**
```json
{
    "attempt_id": 25,
    "score": 85.0,
    "total_questions": 10,
    "correct_answers": 8,
    "results": [
        {
            "question_id": 15,
            "user_answer": "4",
            "correct_answer": "4",
            "is_correct": true,
            "explanation": "2+2 equals 4"
        }
    ]
}
```

### Generate Quiz from File
```http
POST /api/learning-materials/generate_quiz_from_file/
```
**Payload (FormData):**
- `file`: PDF or text file
- `title`: Quiz title
- `num_questions`: Number (default: 10)
- `difficulty`: "easy", "medium", or "hard"

### User's Quiz Attempts
```http
GET /api/quiz-attempts/
```

### Specific Attempt Details
```http
GET /api/quiz-attempts/{id}/
```

## Frontend Integration

### React Quiz Component
```jsx
import React, { useState, useEffect } from 'react';

const QuizTaker = ({ quizId }) => {
    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);
    
    useEffect(() => {
        fetchQuiz();
    }, [quizId]);
    
    const fetchQuiz = async () => {
        const response = await fetch(`/api/quizzes/${quizId}/questions/`, {
            credentials: 'include'
        });
        const data = await response.json();
        setQuiz(data);
    };
    
    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };
    
    const submitQuiz = async () => {
        const response = await fetch(`/api/quizzes/${quizId}/submit_answers/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ answers }),
            credentials: 'include'
        });
        
        const results = await response.json();
        setResults(results);
        setSubmitted(true);
    };
    
    if (!quiz) return <div>Loading...</div>;
    
    if (submitted) {
        return (
            <div className="quiz-results">
                <h2>Quiz Results</h2>
                <p>Score: {results.score}%</p>
                <p>Correct: {results.correct_answers}/{results.total_questions}</p>
                
                <div className="question-results">
                    {results.results.map((result, index) => (
                        <div key={result.question_id} className="result-item">
                            <h4>Question {index + 1}</h4>
                            <p>{result.question_text}</p>
                            <p>Your answer: {result.user_answer}</p>
                            <p>Correct answer: {result.correct_answer}</p>
                            <p className={result.is_correct ? 'correct' : 'incorrect'}>
                                {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                            </p>
                            <p><small>{result.explanation}</small></p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    
    const question = quiz.questions[currentQuestion];
    
    return (
        <div className="quiz-container">
            <h2>{quiz.title}</h2>
            <div className="progress">
                Question {currentQuestion + 1} of {quiz.questions.length}
            </div>
            
            <div className="question">
                <h3>{question.question_text}</h3>
                
                {question.question_type === 'multiple_choice' && (
                    <div className="options">
                        {question.options.map((option, index) => (
                            <label key={index}>
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    onChange={() => handleAnswer(question.id, option)}
                                    checked={answers[question.id] === option}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}
                
                {question.question_type === 'true_false' && (
                    <div className="options">
                        <label>
                            <input
                                type="radio"
                                name={`question_${question.id}`}
                                value="True"
                                onChange={() => handleAnswer(question.id, 'True')}
                                checked={answers[question.id] === 'True'}
                            />
                            True
                        </label>
                        <label>
                            <input
                                type="radio"
                                name={`question_${question.id}`}
                                value="False"
                                onChange={() => handleAnswer(question.id, 'False')}
                                checked={answers[question.id] === 'False'}
                            />
                            False
                        </label>
                    </div>
                )}
                
                {question.question_type === 'short_answer' && (
                    <input
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswer(question.id, e.target.value)}
                        placeholder="Type your answer..."
                    />
                )}
            </div>
            
            <div className="navigation">
                {currentQuestion > 0 && (
                    <button onClick={() => setCurrentQuestion(prev => prev - 1)}>
                        Previous
                    </button>
                )}
                
                {currentQuestion < quiz.questions.length - 1 ? (
                    <button onClick={() => setCurrentQuestion(prev => prev + 1)}>
                        Next
                    </button>
                ) : (
                    <button onClick={submitQuiz} disabled={Object.keys(answers).length === 0}>
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
};
```

### Vue.js Quiz Component
```vue
<template>
  <div class="quiz-container">
    <div v-if="loading">Loading quiz...</div>
    
    <div v-else-if="submitted" class="quiz-results">
      <h2>Quiz Complete!</h2>
      <div class="score">
        <h3>Your Score: {{ results.score }}%</h3>
        <p>{{ results.correct_answers }} out of {{ results.total_questions }} correct</p>
      </div>
      
      <div class="detailed-results">
        <h4>Question Review</h4>
        <div
          v-for="(result, index) in results.results"
          :key="result.question_id"
          class="result-item"
          :class="{ correct: result.is_correct, incorrect: !result.is_correct }"
        >
          <h5>Question {{ index + 1 }}</h5>
          <p class="question-text">{{ result.question_text }}</p>
          <p>Your answer: <strong>{{ result.user_answer }}</strong></p>
          <p>Correct answer: <strong>{{ result.correct_answer }}</strong></p>
          <p class="explanation">{{ result.explanation }}</p>
        </div>
      </div>
    </div>
    
    <div v-else-if="quiz" class="quiz-taking">
      <h2>{{ quiz.title }}</h2>
      <div class="progress-bar">
        <div 
          class="progress-fill" 
          :style="{ width: (answeredCount / quiz.questions.length) * 100 + '%' }"
        ></div>
      </div>
      
      <div class="question-container">
        <div
          v-for="(question, index) in quiz.questions"
          :key="question.id"
          v-show="currentQuestion === index"
          class="question"
        >
          <h3>Question {{ index + 1 }} of {{ quiz.questions.length }}</h3>
          <p class="question-text">{{ question.question_text }}</p>
          
          <!-- Multiple Choice -->
          <div v-if="question.question_type === 'multiple_choice'" class="options">
            <label
              v-for="option in question.options"
              :key="option"
              class="option-label"
            >
              <input
                v-model="answers[question.id]"
                type="radio"
                :value="option"
              />
              {{ option }}
            </label>
          </div>
          
          <!-- True/False -->
          <div v-else-if="question.question_type === 'true_false'" class="options">
            <label class="option-label">
              <input
                v-model="answers[question.id]"
                type="radio"
                value="True"
              />
              True
            </label>
            <label class="option-label">
              <input
                v-model="answers[question.id]"
                type="radio"
                value="False"
              />
              False
            </label>
          </div>
          
          <!-- Short Answer -->
          <div v-else-if="question.question_type === 'short_answer'" class="short-answer">
            <input
              v-model="answers[question.id]"
              type="text"
              placeholder="Type your answer..."
              class="answer-input"
            />
          </div>
        </div>
      </div>
      
      <div class="navigation">
        <button
          v-if="currentQuestion > 0"
          @click="previousQuestion"
          class="nav-button"
        >
          Previous
        </button>
        
        <button
          v-if="currentQuestion < quiz.questions.length - 1"
          @click="nextQuestion"
          class="nav-button"
        >
          Next
        </button>
        
        <button
          v-else
          @click="submitQuiz"
          :disabled="!canSubmit"
          class="submit-button"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    quizId: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      quiz: null,
      loading: true,
      currentQuestion: 0,
      answers: {},
      submitted: false,
      results: null
    };
  },
  computed: {
    answeredCount() {
      return Object.keys(this.answers).length;
    },
    canSubmit() {
      return this.answeredCount === this.quiz?.questions.length;
    }
  },
  async mounted() {
    await this.loadQuiz();
  },
  methods: {
    async loadQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${this.quizId}/questions/`, {
          credentials: 'include'
        });
        this.quiz = await response.json();
      } catch (error) {
        console.error('Failed to load quiz:', error);
      } finally {
        this.loading = false;
      }
    },
    
    nextQuestion() {
      if (this.currentQuestion < this.quiz.questions.length - 1) {
        this.currentQuestion++;
      }
    },
    
    previousQuestion() {
      if (this.currentQuestion > 0) {
        this.currentQuestion--;
      }
    },
    
    async submitQuiz() {
      try {
        const response = await fetch(`/api/quizzes/${this.quizId}/submit_answers/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCsrfToken()
          },
          body: JSON.stringify({ answers: this.answers }),
          credentials: 'include'
        });
        
        this.results = await response.json();
        this.submitted = true;
        this.$emit('quiz-completed', this.results);
      } catch (error) {
        console.error('Failed to submit quiz:', error);
      }
    },
    
    getCsrfToken() {
      // Implementation for getting CSRF token
      return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
  }
};
</script>
```

## Advanced Features

### Adaptive Difficulty
```javascript
// Generate quiz with adaptive difficulty based on user performance
const generateAdaptiveQuiz = async (materialId, userLevel) => {
    const response = await fetch('/api/learning-materials/generate_quiz_from_file/', {
        method: 'POST',
        body: JSON.stringify({
            learning_material: materialId,
            difficulty: userLevel, // 'beginner', 'intermediate', 'advanced'
            num_questions: 15,
            adaptive: true
        })
    });
    return response.json();
};
```

### Quiz Analytics
```javascript
// Get detailed quiz performance analytics
const getQuizAnalytics = async (quizId) => {
    const response = await fetch(`/api/quizzes/${quizId}/analytics/`, {
        credentials: 'include'
    });
    return response.json();
};
```

## Error Handling

### Common Errors
```json
{
    "detail": "Quiz not found."
}
```

```json
{
    "answers": ["This field is required."]
}
```

```json
{
    "error": "invalid_answers",
    "message": "Some question IDs are invalid",
    "invalid_questions": [999, 1000]
}
```

## Performance Considerations

### Optimization Tips
1. **Pagination**: Use pagination for large question sets
2. **Caching**: Cache quiz questions to reduce database queries
3. **Lazy Loading**: Load questions as needed
4. **Background Processing**: Generate quizzes asynchronously for large materials

### Monitoring
- Track quiz completion rates
- Monitor question difficulty distribution
- Analyze user performance patterns
- Alert on generation failures
