# Quiz Attempts API

## Overview

Quiz Attempts track when users take quizzes and store their scores and answers. Every time a user submits quiz answers, a QuizAttempt record is created along with individual QuestionAttempt records for each question.

## Model Structure

### QuizAttempt
```json
{
    "id": 25,
    "user": 1,
    "quiz": 1,
    "score": 85.5,
    "timestamp": "2024-01-01T14:15:00Z"
}
```

### QuestionAttempt (linked to QuizAttempt)
```json
{
    "id": 100,
    "quiz_attempt": 25,
    "question": 15,
    "selected_option": "b",
    "is_correct": true
}
```

## API Endpoints

### List User's Quiz Attempts
```http
GET /api/quiz-attempts/
```
**Response:**
```json
{
    "results": [
        {
            "id": 25,
            "user": "john_doe",
            "quiz": 1,
            "score": 85.5,
            "timestamp": "2024-01-01T14:15:00Z",
            "question_attempts": [
                {
                    "question": 15,
                    "selected_option": "b",
                    "is_correct": true
                },
                {
                    "question": 16,
                    "selected_option": "a",
                    "is_correct": false
                }
            ]
        }
    ]
}
```

### Get Specific Quiz Attempt
```http
GET /api/quiz-attempts/{id}/
```
**Response:**
```json
{
    "id": 25,
    "user": "john_doe",
    "quiz": 1,
    "score": 85.5,
    "timestamp": "2024-01-01T14:15:00Z",
    "question_attempts": [
        {
            "question": 15,
            "selected_option": "b",
            "is_correct": true
        },
        {
            "question": 16,
            "selected_option": "a",
            "is_correct": false
        }
    ]
}
```

### Create Quiz Attempt (Manual)
```http
POST /api/quiz-attempts/
```
**Payload:**
```json
{
    "quiz": 1,
    "score": 75.0,
    "question_attempts": [
        {
            "question": 15,
            "selected_option": "b",
            "is_correct": true
        },
        {
            "question": 16,
            "selected_option": "a",
            "is_correct": false
        }
    ]
}
```

**Note:** You typically don't need to create QuizAttempts manually. They are automatically created when you submit quiz answers using the `POST /api/quizzes/{id}/submit_answers/` endpoint.

## Automatic Creation Process

### Recommended: Submit Quiz Answers
Instead of manually creating QuizAttempt records, use the quiz submission endpoint:

```http
POST /api/quizzes/{quiz_id}/submit_answers/
```
**Payload:**
```json
{
    "answers": {
        "15": "b",
        "16": "a",
        "17": "True"
    }
}
```

This automatically:
1. Creates a QuizAttempt record
2. Creates QuestionAttempt records for each answer
3. Calculates the score
4. Returns detailed results with explanations

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
            "question_text": "What is the derivative of x²?",
            "user_answer": "2x",
            "correct_answer": "2x",
            "is_correct": true,
            "explanation": "The derivative of x² is 2x using the power rule..."
        }
    ]
}
```

## Frontend Integration

### React Hook for Quiz Attempts
```jsx
import { useState, useEffect } from 'react';

const useQuizAttempts = () => {
    const [attempts, setAttempts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchAttempts();
    }, []);
    
    const fetchAttempts = async () => {
        try {
            const response = await fetch('/api/quiz-attempts/', {
                credentials: 'include'
            });
            const data = await response.json();
            setAttempts(data.results);
        } catch (error) {
            console.error('Failed to fetch attempts:', error);
        } finally {
            setLoading(false);
        }
    };
    
    return { attempts, loading, refetch: fetchAttempts };
};

// Usage in component
const QuizHistory = () => {
    const { attempts, loading } = useQuizAttempts();
    
    if (loading) return <div>Loading...</div>;
    
    return (
        <div className="quiz-history">
            <h2>Your Quiz History</h2>
            {attempts.map(attempt => (
                <div key={attempt.id} className="attempt-card">
                    <h3>Quiz #{attempt.quiz}</h3>
                    <p>Score: {attempt.score}%</p>
                    <p>Date: {new Date(attempt.timestamp).toLocaleDateString()}</p>
                    <p>Questions: {attempt.question_attempts.length}</p>
                </div>
            ))}
        </div>
    );
};
```

### Vue.js Quiz Attempts Component
```vue
<template>
  <div class="quiz-attempts">
    <h2>Quiz History</h2>
    
    <div v-if="loading" class="loading">
      Loading quiz history...
    </div>
    
    <div v-else-if="attempts.length === 0" class="no-attempts">
      No quiz attempts yet. Take your first quiz!
    </div>
    
    <div v-else class="attempts-list">
      <div 
        v-for="attempt in attempts" 
        :key="attempt.id"
        class="attempt-card"
        @click="viewAttempt(attempt)"
      >
        <div class="attempt-header">
          <h3>Quiz #{{ attempt.quiz }}</h3>
          <span class="score" :class="getScoreClass(attempt.score)">
            {{ attempt.score }}%
          </span>
        </div>
        
        <div class="attempt-details">
          <p>Date: {{ formatDate(attempt.timestamp) }}</p>
          <p>Questions: {{ attempt.question_attempts.length }}</p>
          <p>Correct: {{ getCorrectCount(attempt.question_attempts) }}</p>
        </div>
      </div>
    </div>
    
    <!-- Detailed view modal -->
    <div v-if="selectedAttempt" class="modal-overlay" @click="selectedAttempt = null">
      <div class="modal-content" @click.stop>
        <h3>Quiz Attempt Details</h3>
        <p>Score: {{ selectedAttempt.score }}%</p>
        <p>Date: {{ formatDate(selectedAttempt.timestamp) }}</p>
        
        <div class="question-breakdown">
          <h4>Question Breakdown</h4>
          <div 
            v-for="(qa, index) in selectedAttempt.question_attempts"
            :key="qa.question"
            class="question-attempt"
            :class="{ correct: qa.is_correct, incorrect: !qa.is_correct }"
          >
            <span>Question {{ index + 1 }}: {{ qa.is_correct ? '✓' : '✗' }}</span>
            <span>Answer: {{ qa.selected_option }}</span>
          </div>
        </div>
        
        <button @click="selectedAttempt = null">Close</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuizAttempts',
  
  data() {
    return {
      attempts: [],
      loading: true,
      selectedAttempt: null
    };
  },
  
  async mounted() {
    await this.loadAttempts();
  },
  
  methods: {
    async loadAttempts() {
      try {
        const response = await fetch('/api/quiz-attempts/', {
          credentials: 'include'
        });
        const data = await response.json();
        this.attempts = data.results;
      } catch (error) {
        console.error('Failed to load quiz attempts:', error);
      } finally {
        this.loading = false;
      }
    },
    
    viewAttempt(attempt) {
      this.selectedAttempt = attempt;
    },
    
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString();
    },
    
    getCorrectCount(questionAttempts) {
      return questionAttempts.filter(qa => qa.is_correct).length;
    },
    
    getScoreClass(score) {
      if (score >= 90) return 'excellent';
      if (score >= 80) return 'good';
      if (score >= 70) return 'fair';
      return 'needs-improvement';
    }
  }
};
</script>
```

### Analytics with Quiz Attempts
```jsx
const QuizAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    
    useEffect(() => {
        calculateAnalytics();
    }, []);
    
    const calculateAnalytics = async () => {
        try {
            const response = await fetch('/api/quiz-attempts/', {
                credentials: 'include'
            });
            const data = await response.json();
            const attempts = data.results;
            
            const analytics = {
                totalAttempts: attempts.length,
                averageScore: attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length,
                highestScore: Math.max(...attempts.map(a => a.score)),
                lowestScore: Math.min(...attempts.map(a => a.score)),
                recentAttempts: attempts.slice(0, 5),
                scoreDistribution: calculateScoreDistribution(attempts),
                improvementTrend: calculateImprovementTrend(attempts)
            };
            
            setAnalytics(analytics);
        } catch (error) {
            console.error('Failed to calculate analytics:', error);
        }
    };
    
    const calculateScoreDistribution = (attempts) => {
        const ranges = { '90-100': 0, '80-89': 0, '70-79': 0, '60-69': 0, '0-59': 0 };
        
        attempts.forEach(attempt => {
            if (attempt.score >= 90) ranges['90-100']++;
            else if (attempt.score >= 80) ranges['80-89']++;
            else if (attempt.score >= 70) ranges['70-79']++;
            else if (attempt.score >= 60) ranges['60-69']++;
            else ranges['0-59']++;
        });
        
        return ranges;
    };
    
    const calculateImprovementTrend = (attempts) => {
        if (attempts.length < 2) return 'insufficient-data';
        
        // Sort by timestamp (most recent first)
        const sorted = attempts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const recent = sorted.slice(0, 5);
        const older = sorted.slice(5, 10);
        
        const recentAvg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length;
        const olderAvg = older.length > 0 ? older.reduce((sum, a) => sum + a.score, 0) / older.length : recentAvg;
        
        if (recentAvg > olderAvg + 5) return 'improving';
        if (recentAvg < olderAvg - 5) return 'declining';
        return 'stable';
    };
    
    if (!analytics) return <div>Loading analytics...</div>;
    
    return (
        <div className="quiz-analytics">
            <h2>Quiz Performance Analytics</h2>
            
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total Attempts</h3>
                    <p className="stat-value">{analytics.totalAttempts}</p>
                </div>
                
                <div className="stat-card">
                    <h3>Average Score</h3>
                    <p className="stat-value">{analytics.averageScore.toFixed(1)}%</p>
                </div>
                
                <div className="stat-card">
                    <h3>Highest Score</h3>
                    <p className="stat-value">{analytics.highestScore}%</p>
                </div>
                
                <div className="stat-card">
                    <h3>Trend</h3>
                    <p className={`stat-value trend-${analytics.improvementTrend}`}>
                        {analytics.improvementTrend}
                    </p>
                </div>
            </div>
            
            <div className="score-distribution">
                <h3>Score Distribution</h3>
                {Object.entries(analytics.scoreDistribution).map(([range, count]) => (
                    <div key={range} className="distribution-bar">
                        <span>{range}%: {count} attempts</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
```

## Data Flow

### Complete Quiz Taking Flow
1. **Get Quiz Questions**: `GET /api/quizzes/{id}/questions/`
2. **User Takes Quiz**: Collects answers in frontend
3. **Submit Answers**: `POST /api/quizzes/{id}/submit_answers/`
4. **Auto-Creation**: QuizAttempt and QuestionAttempt records created
5. **View Results**: Immediate response with scores and explanations
6. **View History**: `GET /api/quiz-attempts/` to see all attempts

### Key Relationships
- **QuizAttempt** belongs to a **User** and a **Quiz**
- **QuestionAttempt** belongs to a **QuizAttempt** and a **Question**
- Each quiz submission creates one QuizAttempt with multiple QuestionAttempts

## Error Handling

### Common Errors
```json
// Quiz not found
{
    "error": "Quiz with id 999 not found"
}

// Invalid score
{
    "score": ["Score must be between 0 and 100"]
}

// Missing question attempts
{
    "question_attempts": ["This field is required."]
}
```

### Best Practices
1. **Always use the quiz submission endpoint** instead of manually creating attempts
2. **Check user permissions** - users can only see their own attempts
3. **Handle network errors** gracefully in frontend
4. **Validate quiz completion** before submission
5. **Cache attempt data** to avoid repeated API calls

## Performance Tips

### Filtering and Pagination
```javascript
// Get recent attempts only
const recentAttempts = await fetch('/api/quiz-attempts/?limit=10');

// Filter by quiz
const mathQuizAttempts = await fetch('/api/quiz-attempts/?quiz=1');

// Get attempts from specific date range
const dateRange = await fetch('/api/quiz-attempts/?timestamp__gte=2024-01-01');
```

### Optimizing Frontend
```jsx
// Use memo to prevent unnecessary re-renders
const AttemptCard = React.memo(({ attempt }) => {
    return (
        <div className="attempt-card">
            <h3>Score: {attempt.score}%</h3>
            <p>{new Date(attempt.timestamp).toLocaleDateString()}</p>
        </div>
    );
});

// Lazy load detailed question attempts
const [detailedAttempt, setDetailedAttempt] = useState(null);

const loadDetailedAttempt = async (attemptId) => {
    const response = await fetch(`/api/quiz-attempts/${attemptId}/`);
    const data = await response.json();
    setDetailedAttempt(data);
};
```
