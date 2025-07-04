# Flashcards

## Overview

The Flashcard system provides AI-generated study cards from learning materials. Flashcards are automatically created when learning materials are uploaded and can also be manually created or edited.

## Model Structure

```python
{
    "id": 1,
    "learning_material": 2,
    "front": "What is Ohm's Law?",
    "back": "Ohm's Law states that V = IR, where V is voltage, I is current, and R is resistance.",
    "difficulty": "easy",
    "topic": "Electricity",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
}
```

## API Endpoints

### List Flashcards
```http
GET /api/flashcards/
```

**Response:**
```json
{
    "count": 25,
    "next": "http://localhost:8000/api/flashcards/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "learning_material": 2,
            "front": "What is Ohm's Law?",
            "back": "Ohm's Law states that V = IR, where V is voltage, I is current, and R is resistance.",
            "difficulty": "easy",
            "topic": "Electricity",
            "created_at": "2024-01-01T12:00:00Z"
        },
        {
            "id": 2,
            "learning_material": 2,
            "front": "Define electrical resistance",
            "back": "Electrical resistance is the opposition to the flow of electric current, measured in ohms (Ω).",
            "difficulty": "medium",
            "topic": "Electricity",
            "created_at": "2024-01-01T12:05:00Z"
        }
    ]
}
```

### Create Flashcard
```http
POST /api/flashcards/
Content-Type: application/json

{
    "learning_material": 2,
    "front": "What is the unit of electrical power?",
    "back": "The unit of electrical power is the watt (W).",
    "difficulty": "easy",
    "topic": "Electricity"
}
```

### Get Specific Flashcard
```http
GET /api/flashcards/{id}/
```

### Update Flashcard
```http
PUT /api/flashcards/{id}/
Content-Type: application/json

{
    "front": "Updated question",
    "back": "Updated answer",
    "difficulty": "medium"
}
```

### Delete Flashcard
```http
DELETE /api/flashcards/{id}/
```

## Automatic Generation

Flashcards are automatically generated when learning materials are uploaded using AI analysis:

### Generation Process
1. **Content Analysis**: Extract key concepts and terminology
2. **Question Generation**: Create meaningful questions using GPT
3. **Answer Formulation**: Generate clear, concise answers
4. **Difficulty Assessment**: Assign appropriate difficulty levels
5. **Topic Classification**: Categorize by subject matter

### AI Prompt Example
The system uses prompts like:
```
Generate study flashcards from this educational content about [topic].
Create question-answer pairs that test key concepts, definitions, and relationships.
Make questions clear and answers concise but complete.
Include a mix of definition, concept, and application questions.
```

## Frontend Integration

### React Flashcard Component
```jsx
import React, { useState, useEffect } from 'react';

const FlashcardDeck = ({ materialId }) => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [showBack, setShowBack] = useState(false);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchFlashcards();
    }, [materialId]);
    
    const fetchFlashcards = async () => {
        try {
            const response = await fetch(
                `/api/flashcards/?learning_material=${materialId}`,
                { credentials: 'include' }
            );
            const data = await response.json();
            setFlashcards(data.results);
        } catch (error) {
            console.error('Failed to fetch flashcards:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const nextCard = () => {
        setShowBack(false);
        setCurrentCard((prev) => (prev + 1) % flashcards.length);
    };
    
    const previousCard = () => {
        setShowBack(false);
        setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    };
    
    const flipCard = () => {
        setShowBack(!showBack);
    };
    
    if (loading) return <div>Loading flashcards...</div>;
    if (flashcards.length === 0) return <div>No flashcards available</div>;
    
    const card = flashcards[currentCard];
    
    return (
        <div className="flashcard-deck">
            <div className="card-counter">
                {currentCard + 1} of {flashcards.length}
            </div>
            
            <div className="flashcard" onClick={flipCard}>
                <div className={`card-content ${showBack ? 'flipped' : ''}`}>
                    <div className="card-front">
                        <h3>Question</h3>
                        <p>{card.front}</p>
                        <div className="difficulty-badge">{card.difficulty}</div>
                    </div>
                    <div className="card-back">
                        <h3>Answer</h3>
                        <p>{card.back}</p>
                        <div className="topic-tag">{card.topic}</div>
                    </div>
                </div>
            </div>
            
            <div className="card-controls">
                <button onClick={previousCard} disabled={flashcards.length <= 1}>
                    Previous
                </button>
                <button onClick={flipCard}>
                    {showBack ? 'Show Question' : 'Show Answer'}
                </button>
                <button onClick={nextCard} disabled={flashcards.length <= 1}>
                    Next
                </button>
            </div>
        </div>
    );
};

// Flashcard study session with spaced repetition
const StudySession = ({ materialId }) => {
    const [flashcards, setFlashcards] = useState([]);
    const [currentCard, setCurrentCard] = useState(0);
    const [showBack, setShowBack] = useState(false);
    const [sessionStats, setSessionStats] = useState({
        correct: 0,
        incorrect: 0,
        total: 0
    });
    
    const markCorrect = () => {
        setSessionStats(prev => ({ 
            ...prev, 
            correct: prev.correct + 1,
            total: prev.total + 1 
        }));
        nextCard();
    };
    
    const markIncorrect = () => {
        setSessionStats(prev => ({ 
            ...prev, 
            incorrect: prev.incorrect + 1,
            total: prev.total + 1 
        }));
        // Add card back to deck for review
        const cardToReview = flashcards[currentCard];
        setFlashcards(prev => [...prev, cardToReview]);
        nextCard();
    };
    
    const nextCard = () => {
        setShowBack(false);
        if (currentCard < flashcards.length - 1) {
            setCurrentCard(prev => prev + 1);
        } else {
            // Session complete
            alert(`Session complete! Correct: ${sessionStats.correct + 1}, 
                   Incorrect: ${sessionStats.incorrect}`);
        }
    };
    
    return (
        <div className="study-session">
            <div className="session-stats">
                <span>Correct: {sessionStats.correct}</span>
                <span>Incorrect: {sessionStats.incorrect}</span>
                <span>Progress: {sessionStats.total}/{flashcards.length}</span>
            </div>
            
            {/* Flashcard display */}
            
            {showBack && (
                <div className="answer-controls">
                    <button onClick={markIncorrect} className="incorrect">
                        Incorrect - Review Again
                    </button>
                    <button onClick={markCorrect} className="correct">
                        Correct - Continue
                    </button>
                </div>
            )}
        </div>
    );
};
```

### Vue.js Flashcard Component
```vue
<template>
  <div class="flashcard-container">
    <div v-if="loading" class="loading">Loading flashcards...</div>
    
    <div v-else-if="flashcards.length === 0" class="no-cards">
      No flashcards available for this material.
    </div>
    
    <div v-else class="flashcard-deck">
      <div class="deck-header">
        <h3>{{ deckTitle }}</h3>
        <div class="card-counter">
          Card {{ currentIndex + 1 }} of {{ flashcards.length }}
        </div>
      </div>
      
      <div class="flashcard" :class="{ flipped: isFlipped }" @click="flipCard">
        <div class="card-face card-front">
          <div class="card-header">
            <span class="difficulty-badge" :class="currentCard.difficulty">
              {{ currentCard.difficulty }}
            </span>
            <span class="topic-tag">{{ currentCard.topic }}</span>
          </div>
          <div class="card-content">
            <h4>Question</h4>
            <p>{{ currentCard.front }}</p>
          </div>
          <div class="card-footer">
            <small>Click to reveal answer</small>
          </div>
        </div>
        
        <div class="card-face card-back">
          <div class="card-header">
            <span class="difficulty-badge" :class="currentCard.difficulty">
              {{ currentCard.difficulty }}
            </span>
            <span class="topic-tag">{{ currentCard.topic }}</span>
          </div>
          <div class="card-content">
            <h4>Answer</h4>
            <p>{{ currentCard.back }}</p>
          </div>
          <div class="card-footer">
            <small>Click to see question</small>
          </div>
        </div>
      </div>
      
      <div class="controls">
        <button 
          @click="previousCard" 
          :disabled="currentIndex === 0"
          class="nav-button"
        >
          ← Previous
        </button>
        
        <button @click="flipCard" class="flip-button">
          {{ isFlipped ? 'Show Question' : 'Show Answer' }}
        </button>
        
        <button 
          @click="nextCard" 
          :disabled="currentIndex === flashcards.length - 1"
          class="nav-button"
        >
          Next →
        </button>
      </div>
      
      <div class="study-mode-toggle">
        <button @click="toggleStudyMode" class="study-mode-button">
          {{ studyMode ? 'Exit Study Mode' : 'Start Study Mode' }}
        </button>
      </div>
      
      <!-- Study Mode Controls -->
      <div v-if="studyMode && isFlipped" class="study-controls">
        <h4>How well did you know this?</h4>
        <div class="difficulty-buttons">
          <button @click="markCard('hard')" class="difficulty-button hard">
            Hard - Show again soon
          </button>
          <button @click="markCard('medium')" class="difficulty-button medium">
            Medium - Show again later
          </button>
          <button @click="markCard('easy')" class="difficulty-button easy">
            Easy - Show much later
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    materialId: {
      type: Number,
      required: true
    },
    deckTitle: {
      type: String,
      default: 'Study Deck'
    }
  },
  
  data() {
    return {
      flashcards: [],
      currentIndex: 0,
      isFlipped: false,
      loading: true,
      studyMode: false,
      studyStats: {
        easy: 0,
        medium: 0,
        hard: 0
      }
    };
  },
  
  computed: {
    currentCard() {
      return this.flashcards[this.currentIndex] || {};
    }
  },
  
  async mounted() {
    await this.loadFlashcards();
  },
  
  methods: {
    async loadFlashcards() {
      try {
        const response = await fetch(
          `/api/flashcards/?learning_material=${this.materialId}`,
          { credentials: 'include' }
        );
        const data = await response.json();
        this.flashcards = data.results;
      } catch (error) {
        console.error('Failed to load flashcards:', error);
      } finally {
        this.loading = false;
      }
    },
    
    flipCard() {
      this.isFlipped = !this.isFlipped;
    },
    
    nextCard() {
      if (this.currentIndex < this.flashcards.length - 1) {
        this.currentIndex++;
        this.isFlipped = false;
      }
    },
    
    previousCard() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.isFlipped = false;
      }
    },
    
    toggleStudyMode() {
      this.studyMode = !this.studyMode;
      if (!this.studyMode) {
        this.resetStudyStats();
      }
    },
    
    markCard(difficulty) {
      this.studyStats[difficulty]++;
      
      // In a real implementation, you might want to:
      // 1. Send the rating to the backend for spaced repetition
      // 2. Adjust the card's next review date
      // 3. Remove easy cards from current session
      
      this.nextCard();
      
      // If we've reached the end, show results
      if (this.currentIndex >= this.flashcards.length) {
        this.showStudyResults();
      }
    },
    
    resetStudyStats() {
      this.studyStats = { easy: 0, medium: 0, hard: 0 };
    },
    
    showStudyResults() {
      const total = Object.values(this.studyStats).reduce((a, b) => a + b, 0);
      alert(`Study session complete!
        Easy: ${this.studyStats.easy}
        Medium: ${this.studyStats.medium} 
        Hard: ${this.studyStats.hard}
        Total cards reviewed: ${total}`);
    }
  }
};
</script>

<style scoped>
.flashcard-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.flashcard {
  perspective: 1000px;
  height: 300px;
  margin: 20px 0;
  cursor: pointer;
  position: relative;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  transition: transform 0.6s;
  background: white;
  border: 1px solid #ddd;
}

.card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-back {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  transform: rotateY(180deg);
}

.flipped .card-front {
  transform: rotateY(-180deg);
}

.flipped .card-back {
  transform: rotateY(0deg);
}

.card-header {
  display: flex;
  justify-content: space-between;
  padding: 15px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
}

.difficulty-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.difficulty-badge.easy { background: #4CAF50; }
.difficulty-badge.medium { background: #FF9800; }
.difficulty-badge.hard { background: #F44336; }

.topic-tag {
  padding: 4px 8px;
  background: rgba(255,255,255,0.2);
  border-radius: 12px;
  font-size: 12px;
}

.card-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.card-content h4 {
  margin-bottom: 15px;
  font-size: 18px;
}

.card-content p {
  font-size: 16px;
  line-height: 1.5;
}

.card-footer {
  padding: 15px;
  text-align: center;
  border-top: 1px solid rgba(255,255,255,0.2);
  font-style: italic;
}

.controls {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 20px 0;
}

.nav-button, .flip-button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
}

.nav-button {
  background: #6c757d;
  color: white;
}

.nav-button:hover:not(:disabled) {
  background: #5a6268;
}

.nav-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.flip-button {
  background: #007bff;
  color: white;
}

.flip-button:hover {
  background: #0056b3;
}

.study-mode-button {
  padding: 12px 24px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  width: 100%;
  margin: 20px 0;
}

.study-controls {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

.difficulty-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.difficulty-button {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  color: white;
}

.difficulty-button.easy { background: #28a745; }
.difficulty-button.medium { background: #ffc107; color: #333; }
.difficulty-button.hard { background: #dc3545; }
</style>
```

## Filtering and Search

### Filter by Material
```http
GET /api/flashcards/?learning_material=2
```

### Filter by Difficulty
```http
GET /api/flashcards/?difficulty=easy
```

### Filter by Topic
```http
GET /api/flashcards/?topic=Electricity
```

### Search in Questions/Answers
```http
GET /api/flashcards/?search=resistance
```

### Combined Filters
```http
GET /api/flashcards/?learning_material=2&difficulty=medium&search=voltage
```

## Study Features

### Spaced Repetition (Future Enhancement)
```python
# Example model extension for spaced repetition
{
    "id": 1,
    "next_review": "2024-01-05T09:00:00Z",
    "review_count": 3,
    "ease_factor": 2.5,
    "interval": 7  # days
}
```

### Performance Tracking
```python
# User performance on flashcards
{
    "user": 1,
    "flashcard": 1,
    "last_reviewed": "2024-01-01T15:00:00Z",
    "confidence_level": "medium",
    "review_count": 5,
    "success_rate": 0.8
}
```

## Error Handling

### Validation Errors
```json
{
    "front": ["This field is required."],
    "back": ["This field is required."]
}
```

### Not Found
```json
{
    "detail": "Not found."
}
```

## Best Practices

### Frontend Implementation
1. **Progressive Loading**: Load cards in batches for large decks
2. **Offline Support**: Cache cards for offline study
3. **Responsive Design**: Ensure cards work on mobile devices
4. **Accessibility**: Include keyboard navigation and screen reader support

### Study Optimization
1. **Randomization**: Shuffle cards for each study session
2. **Progress Tracking**: Save user progress and preferences
3. **Adaptive Review**: Focus on difficult cards
4. **Session Management**: Support timed study sessions

### Performance
1. **Pagination**: Use pagination for large flashcard sets
2. **Lazy Loading**: Load card content as needed
3. **Caching**: Cache frequently accessed cards
4. **Background Sync**: Sync study progress in background
