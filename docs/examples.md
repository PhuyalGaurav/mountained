# Examples

## Complete Integration Examples

This section provides complete, working examples of how to integrate with the Mountained backend API for common use cases.

## Example 1: Complete Learning Flow

This example demonstrates uploading a learning material, generating AI content, and taking a quiz.

### JavaScript/React Implementation

```jsx
import React, { useState } from 'react';

const CompleteLearningFlow = () => {
    const [step, setStep] = useState(1);
    const [material, setMaterial] = useState(null);
    const [quiz, setQuiz] = useState(null);
    const [results, setResults] = useState(null);
    
    // Step 1: Upload Learning Material
    const uploadMaterial = async (file, title, subject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('subject', subject);
        
        try {
            const response = await fetch('/api/learning-materials/', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
            
            const materialData = await response.json();
            setMaterial(materialData);
            setStep(2);
            
            // Automatically generate quiz
            await generateQuiz(materialData.id);
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };
    
    // Step 2: Generate Quiz with AI
    const generateQuiz = async (materialId) => {
        try {
            const response = await fetch(`/api/learning-materials/${materialId}/`, {
                credentials: 'include'
            });
            const materialData = await response.json();
            
            // Generate quiz from the material
            const quizFormData = new FormData();
            quizFormData.append('title', `${materialData.title} - Quiz`);
            quizFormData.append('num_questions', '10');
            quizFormData.append('difficulty', 'medium');
            
            const quizResponse = await fetch('/api/learning-materials/generate_quiz_from_file/', {
                method: 'POST',
                body: quizFormData,
                credentials: 'include'
            });
            
            const quizData = await quizResponse.json();
            setQuiz(quizData);
            setStep(3);
        } catch (error) {
            console.error('Quiz generation failed:', error);
        }
    };
    
    // Step 3: Take Quiz
    const submitQuizAnswers = async (answers) => {
        try {
            const response = await fetch(`/api/quizzes/${quiz.quiz.id}/submit_answers/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ answers }),
                credentials: 'include'
            });
            
            const resultsData = await response.json();
            setResults(resultsData);
            setStep(4);
        } catch (error) {
            console.error('Quiz submission failed:', error);
        }
    };
    
    return (
        <div className="learning-flow">
            {step === 1 && (
                <MaterialUploadStep onUpload={uploadMaterial} />
            )}
            {step === 2 && (
                <div>Generating AI content...</div>
            )}
            {step === 3 && quiz && (
                <QuizTakingStep quiz={quiz} onSubmit={submitQuizAnswers} />
            )}
            {step === 4 && results && (
                <ResultsStep results={results} material={material} />
            )}
        </div>
    );
};

// Individual step components
const MaterialUploadStep = ({ onUpload }) => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onUpload(file, title, subject);
    };
    
    return (
        <form onSubmit={handleSubmit} className="upload-form">
            <h2>Upload Learning Material</h2>
            <input
                type="file"
                accept=".pdf,.txt"
                onChange={(e) => setFile(e.target.files[0])}
                required
            />
            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
            />
            <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
            />
            <button type="submit">Upload and Generate Content</button>
        </form>
    );
};

const QuizTakingStep = ({ quiz, onSubmit }) => {
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    
    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };
    
    const handleSubmit = () => {
        onSubmit(answers);
    };
    
    const question = quiz.questions[currentQuestion];
    
    return (
        <div className="quiz-taking">
            <h2>{quiz.quiz.title}</h2>
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
                                />
                                {option}
                            </label>
                        ))}
                    </div>
                )}
                
                {question.question_type === 'true_false' && (
                    <div className="options">
                        {['True', 'False'].map(option => (
                            <label key={option}>
                                <input
                                    type="radio"
                                    name={`question_${question.id}`}
                                    value={option}
                                    onChange={() => handleAnswer(question.id, option)}
                                />
                                {option}
                            </label>
                        ))}
                    </div>
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
                    <button onClick={handleSubmit}>
                        Submit Quiz
                    </button>
                )}
            </div>
        </div>
    );
};

const ResultsStep = ({ results, material }) => {
    return (
        <div className="results">
            <h2>Quiz Results</h2>
            <div className="score-summary">
                <div className="score-circle">
                    <span className="score-value">{results.score}%</span>
                </div>
                <p>{results.correct_answers} out of {results.total_questions} correct</p>
            </div>
            
            <div className="detailed-results">
                {results.results.map((result, index) => (
                    <div key={result.question_id} className="result-item">
                        <h4>Question {index + 1}</h4>
                        <p className="question-text">{result.question_text}</p>
                        <div className="answers">
                            <p>Your answer: <strong>{result.user_answer}</strong></p>
                            <p>Correct answer: <strong>{result.correct_answer}</strong></p>
                        </div>
                        <div className={`status ${result.is_correct ? 'correct' : 'incorrect'}`}>
                            {result.is_correct ? '✓ Correct' : '✗ Incorrect'}
                        </div>
                        <p className="explanation">{result.explanation}</p>
                    </div>
                ))}
            </div>
            
            <div className="next-steps">
                <h3>What's Next?</h3>
                <button onClick={() => window.location.reload()}>
                    Upload Another Material
                </button>
                <button onClick={() => {/* Navigate to flashcards */}}>
                    Study Flashcards
                </button>
                <button onClick={() => {/* Navigate to analytics */}}>
                    View Analytics
                </button>
            </div>
        </div>
    );
};

// Utility function for CSRF token
const getCsrfToken = () => {
    return document.querySelector('[name=csrfmiddlewaretoken]')?.value ||
           document.querySelector('meta[name="csrf-token"]')?.content;
};

export default CompleteLearningFlow;
```

## Example 2: Study Session Manager

A comprehensive study session that combines multiple AI features.

```jsx
import React, { useState, useEffect } from 'react';

const StudySessionManager = ({ materialId }) => {
    const [sessionData, setSessionData] = useState({
        material: null,
        flashcards: [],
        summary: null,
        studyTasks: [],
        quiz: null
    });
    const [currentActivity, setCurrentActivity] = useState('overview');
    const [sessionStats, setSessionStats] = useState({
        startTime: new Date(),
        activitiesCompleted: 0,
        totalScore: 0
    });
    
    useEffect(() => {
        loadStudySession();
    }, [materialId]);
    
    const loadStudySession = async () => {
        try {
            // Load all study materials
            const [material, flashcards, quiz] = await Promise.all([
                fetch(`/api/learning-materials/${materialId}/`).then(r => r.json()),
                fetch(`/api/flashcards/?learning_material=${materialId}`).then(r => r.json()),
                fetch(`/api/quizzes/?learning_material=${materialId}`).then(r => r.json())
            ]);
            
            setSessionData({
                material,
                flashcards: flashcards.results,
                quiz: quiz.results[0], // Get first quiz
                summary: material.summary,
                studyTasks: [] // Would be loaded from study tasks endpoint
            });
        } catch (error) {
            console.error('Failed to load study session:', error);
        }
    };
    
    const completeActivity = (activityType, score = null) => {
        setSessionStats(prev => ({
            ...prev,
            activitiesCompleted: prev.activitiesCompleted + 1,
            totalScore: score ? prev.totalScore + score : prev.totalScore
        }));
    };
    
    return (
        <div className="study-session">
            <SessionHeader 
                material={sessionData.material}
                stats={sessionStats}
            />
            
            <ActivityNavigation 
                currentActivity={currentActivity}
                setCurrentActivity={setCurrentActivity}
                sessionData={sessionData}
            />
            
            <div className="activity-content">
                {currentActivity === 'overview' && (
                    <SessionOverview 
                        sessionData={sessionData}
                        setCurrentActivity={setCurrentActivity}
                    />
                )}
                
                {currentActivity === 'summary' && (
                    <SummaryView 
                        summary={sessionData.summary}
                        onComplete={() => completeActivity('summary')}
                    />
                )}
                
                {currentActivity === 'flashcards' && (
                    <FlashcardSession 
                        flashcards={sessionData.flashcards}
                        onComplete={(score) => completeActivity('flashcards', score)}
                    />
                )}
                
                {currentActivity === 'quiz' && sessionData.quiz && (
                    <QuizSession 
                        quiz={sessionData.quiz}
                        onComplete={(score) => completeActivity('quiz', score)}
                    />
                )}
            </div>
            
            <SessionProgress 
                sessionData={sessionData}
                currentActivity={currentActivity}
            />
        </div>
    );
};

const SessionHeader = ({ material, stats }) => {
    const sessionDuration = new Date() - stats.startTime;
    const minutes = Math.floor(sessionDuration / 60000);
    
    return (
        <div className="session-header">
            <h1>{material?.title}</h1>
            <div className="session-stats">
                <span>Duration: {minutes}m</span>
                <span>Activities: {stats.activitiesCompleted}</span>
                <span>Subject: {material?.subject}</span>
            </div>
        </div>
    );
};

const ActivityNavigation = ({ currentActivity, setCurrentActivity, sessionData }) => {
    const activities = [
        { id: 'overview', name: 'Overview', icon: '📋' },
        { id: 'summary', name: 'Summary', icon: '📝', available: !!sessionData.summary },
        { id: 'flashcards', name: 'Flashcards', icon: '🎴', available: sessionData.flashcards.length > 0 },
        { id: 'quiz', name: 'Quiz', icon: '🎯', available: !!sessionData.quiz }
    ];
    
    return (
        <nav className="activity-nav">
            {activities.map(activity => (
                <button
                    key={activity.id}
                    className={`nav-item ${currentActivity === activity.id ? 'active' : ''} ${!activity.available ? 'disabled' : ''}`}
                    onClick={() => activity.available && setCurrentActivity(activity.id)}
                    disabled={!activity.available}
                >
                    <span className="nav-icon">{activity.icon}</span>
                    <span className="nav-name">{activity.name}</span>
                </button>
            ))}
        </nav>
    );
};

const SessionOverview = ({ sessionData, setCurrentActivity }) => {
    return (
        <div className="session-overview">
            <h2>Study Session Overview</h2>
            <p>This session includes the following activities:</p>
            
            <div className="activity-cards">
                {sessionData.summary && (
                    <div className="activity-card" onClick={() => setCurrentActivity('summary')}>
                        <h3>📝 Read Summary</h3>
                        <p>Review the key concepts and main points</p>
                        <div className="estimated-time">~5 minutes</div>
                    </div>
                )}
                
                {sessionData.flashcards.length > 0 && (
                    <div className="activity-card" onClick={() => setCurrentActivity('flashcards')}>
                        <h3>🎴 Study Flashcards</h3>
                        <p>{sessionData.flashcards.length} flashcards to review</p>
                        <div className="estimated-time">~{sessionData.flashcards.length * 0.5} minutes</div>
                    </div>
                )}
                
                {sessionData.quiz && (
                    <div className="activity-card" onClick={() => setCurrentActivity('quiz')}>
                        <h3>🎯 Take Quiz</h3>
                        <p>Test your knowledge with AI-generated questions</p>
                        <div className="estimated-time">~15 minutes</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudySessionManager;
```

## Example 3: Python/Django Integration

Server-side integration example for processing learning materials.

```python
# views.py - Custom view for batch processing
from rest_framework.decorators import api_view
from rest_framework.response import Response
from core.models import LearningMaterial, Quiz, Flashcard, Summary, StudyTask
import openai

@api_view(['POST'])
def create_complete_study_package(request):
    """
    Create a complete study package from uploaded material:
    - Process the material
    - Generate summary
    - Create flashcards
    - Generate quiz
    - Create study tasks
    """
    try:
        # Upload and process material
        material_data = {
            'title': request.data.get('title'),
            'subject': request.data.get('subject'),
            'topic': request.data.get('topic'),
            'file': request.FILES.get('file')
        }
        
        material = LearningMaterial.objects.create(**material_data)
        
        # Generate all AI content
        study_package = {
            'material': material,
            'summary': material.generate_summary(),
            'flashcards': material.generate_flashcards(),
            'study_tasks': material.generate_study_tasks(),
        }
        
        # Generate quiz
        quiz_data = material.generate_quiz(
            title=f"{material.title} - Quiz",
            num_questions=int(request.data.get('num_questions', 10)),
            difficulty=request.data.get('difficulty', 'medium')
        )
        
        study_package['quiz'] = quiz_data
        
        # Serialize response
        from core.serializers import (
            LearningMaterialSerializer, 
            FlashcardSerializer, 
            SummarySerializer,
            StudyTaskSerializer
        )
        
        response_data = {
            'material': LearningMaterialSerializer(material).data,
            'summary': SummarySerializer(study_package['summary']).data,
            'flashcards': FlashcardSerializer(study_package['flashcards'], many=True).data,
            'study_tasks': StudyTaskSerializer(study_package['study_tasks'], many=True).data,
            'quiz': quiz_data,  # Already serialized
            'estimated_study_time': calculate_study_time(study_package)
        }
        
        return Response(response_data, status=201)
        
    except Exception as e:
        return Response({'error': str(e)}, status=400)

def calculate_study_time(study_package):
    """Calculate estimated study time for the package"""
    base_time = 10  # Base reading time
    flashcard_time = len(study_package['flashcards']) * 0.5
    quiz_time = 15  # Estimated quiz time
    
    return {
        'total_minutes': int(base_time + flashcard_time + quiz_time),
        'breakdown': {
            'reading': base_time,
            'flashcards': flashcard_time,
            'quiz': quiz_time
        }
    }

# Custom management command for batch processing
# management/commands/process_batch_materials.py
from django.core.management.base import BaseCommand
from core.models import LearningMaterial
import os

class Command(BaseCommand):
    help = 'Process multiple learning materials from a directory'
    
    def add_arguments(self, parser):
        parser.add_argument('directory', type=str, help='Directory containing PDF files')
        parser.add_argument('--subject', type=str, default='General', help='Subject for all materials')
        parser.add_argument('--generate-ai', action='store_true', help='Generate AI content')
    
    def handle(self, *args, **options):
        directory = options['directory']
        subject = options['subject']
        generate_ai = options['generate_ai']
        
        if not os.path.exists(directory):
            self.stdout.write(self.style.ERROR(f'Directory not found: {directory}'))
            return
        
        processed_count = 0
        
        for filename in os.listdir(directory):
            if filename.endswith('.pdf'):
                file_path = os.path.join(directory, filename)
                title = os.path.splitext(filename)[0]
                
                try:
                    # Create learning material
                    with open(file_path, 'rb') as file:
                        material = LearningMaterial.objects.create(
                            title=title,
                            subject=subject,
                            file=file
                        )
                    
                    if generate_ai:
                        # Generate AI content
                        material.generate_summary()
                        material.generate_flashcards()
                        material.generate_study_tasks()
                        
                        # Generate quiz
                        material.generate_quiz(
                            title=f"{title} - Quiz",
                            num_questions=10,
                            difficulty='medium'
                        )
                    
                    processed_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'Processed: {title}')
                    )
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Failed to process {filename}: {str(e)}')
                    )
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully processed {processed_count} materials')
        )
```

## Example 4: Vue.js Complete App

```vue
<template>
  <div id="app">
    <AppHeader :user="currentUser" />
    
    <main class="main-content">
      <router-view 
        :key="$route.fullPath"
        @material-uploaded="handleMaterialUploaded"
        @quiz-completed="handleQuizCompleted"
      />
    </main>
    
    <AppFooter />
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import AppFooter from './components/AppFooter.vue';

export default {
  name: 'App',
  components: {
    AppHeader,
    AppFooter
  },
  
  data() {
    return {
      currentUser: null,
      loading: true
    };
  },
  
  async created() {
    await this.checkAuthentication();
    this.loading = false;
  },
  
  methods: {
    async checkAuthentication() {
      try {
        const response = await fetch('/api/auth/user/', {
          credentials: 'include'
        });
        
        if (response.ok) {
          this.currentUser = await response.json();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    },
    
    handleMaterialUploaded(material) {
      // Update analytics or navigate to study session
      this.$router.push(`/study/${material.id}`);
    },
    
    handleQuizCompleted(results) {
      // Show celebration or navigate to analytics
      this.$router.push('/dashboard');
    }
  }
};
</script>

<!-- Learning Materials Page -->
<template>
  <div class="materials-page">
    <div class="page-header">
      <h1>Learning Materials</h1>
      <button @click="showUploadModal = true" class="upload-button">
        📚 Upload New Material
      </button>
    </div>
    
    <div class="materials-grid">
      <div 
        v-for="material in materials"
        :key="material.id"
        class="material-card"
        @click="openMaterial(material)"
      >
        <div class="material-icon">📄</div>
        <h3>{{ material.title }}</h3>
        <p class="material-subject">{{ material.subject }}</p>
        <p class="material-topic">{{ material.topic }}</p>
        <div class="material-actions">
          <button @click.stop="startStudySession(material)">Study</button>
          <button @click.stop="takeQuiz(material)">Quiz</button>
        </div>
      </div>
    </div>
    
    <!-- Upload Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="showUploadModal = false">
      <div class="modal-content" @click.stop>
        <h2>Upload Learning Material</h2>
        <form @submit.prevent="uploadMaterial">
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.txt"
            @change="handleFileSelect"
            required
          />
          <input
            v-model="uploadForm.title"
            type="text"
            placeholder="Title"
            required
          />
          <input
            v-model="uploadForm.subject"
            type="text"
            placeholder="Subject"
            required
          />
          <input
            v-model="uploadForm.topic"
            type="text"
            placeholder="Topic (optional)"
          />
          <div class="modal-actions">
            <button type="button" @click="showUploadModal = false">Cancel</button>
            <button type="submit" :disabled="uploading">
              {{ uploading ? 'Uploading...' : 'Upload' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialsPage',
  
  data() {
    return {
      materials: [],
      showUploadModal: false,
      uploadForm: {
        title: '',
        subject: '',
        topic: ''
      },
      selectedFile: null,
      uploading: false,
      loading: true
    };
  },
  
  async mounted() {
    await this.loadMaterials();
  },
  
  methods: {
    async loadMaterials() {
      try {
        const response = await fetch('/api/learning-materials/', {
          credentials: 'include'
        });
        const data = await response.json();
        this.materials = data.results;
      } catch (error) {
        console.error('Failed to load materials:', error);
      } finally {
        this.loading = false;
      }
    },
    
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
    },
    
    async uploadMaterial() {
      if (!this.selectedFile) return;
      
      this.uploading = true;
      
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('title', this.uploadForm.title);
      formData.append('subject', this.uploadForm.subject);
      if (this.uploadForm.topic) {
        formData.append('topic', this.uploadForm.topic);
      }
      
      try {
        const response = await fetch('/api/learning-materials/', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (response.ok) {
          const material = await response.json();
          this.materials.unshift(material);
          this.showUploadModal = false;
          this.resetUploadForm();
          this.$emit('material-uploaded', material);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        this.uploading = false;
      }
    },
    
    resetUploadForm() {
      this.uploadForm = { title: '', subject: '', topic: '' };
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    },
    
    openMaterial(material) {
      this.$router.push(`/materials/${material.id}`);
    },
    
    startStudySession(material) {
      this.$router.push(`/study/${material.id}`);
    },
    
    async takeQuiz(material) {
      // Check if quiz exists, if not generate one
      try {
        const response = await fetch(`/api/quizzes/?learning_material=${material.id}`);
        const data = await response.json();
        
        if (data.results.length > 0) {
          this.$router.push(`/quiz/${data.results[0].id}`);
        } else {
          // Generate quiz
          await this.generateQuiz(material);
        }
      } catch (error) {
        console.error('Failed to load quiz:', error);
      }
    },
    
    async generateQuiz(material) {
      // Implementation for quiz generation
      console.log('Generating quiz for:', material.title);
    }
  }
};
</script>
```

## Example 5: Error Handling and Loading States

```jsx
// hooks/useApi.js
import { useState, useCallback } from 'react';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const request = useCallback(async (url, options = {}) => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
            
            return await response.json();
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);
    
    return { request, loading, error };
};

// components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <h2>Something went wrong</h2>
                    <details>
                        <summary>Error details</summary>
                        <pre>{this.state.error?.toString()}</pre>
                    </details>
                    <button onClick={() => window.location.reload()}>
                        Reload Page
                    </button>
                </div>
            );
        }
        
        return this.props.children;
    }
}

export default ErrorBoundary;
```

These examples demonstrate real-world integration patterns and best practices for using the Mountained backend API effectively.
