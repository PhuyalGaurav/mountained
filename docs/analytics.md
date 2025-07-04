# Analytics & Dashboard

## Overview

The Analytics system provides comprehensive learning analytics and dashboard data to track user progress, performance metrics, and learning insights. Analytics are automatically updated when users interact with learning materials, take quizzes, and complete study sessions.

## Model Structure

```python
{
    "id": 1,
    "user": 1,
    "total_materials": 15,
    "total_quizzes": 8,
    "total_quiz_attempts": 12,
    "average_quiz_score": 78.5,
    "total_flashcards": 45,
    "study_streak": 7,
    "total_study_time": 1800,  # seconds
    "materials_completed": 10,
    "quizzes_passed": 6,
    "last_activity": "2024-01-01T15:30:00Z",
    "created_at": "2024-01-01T08:00:00Z",
    "updated_at": "2024-01-01T15:30:00Z"
}
```

## API Endpoints

### Get User Analytics
```http
GET /api/analytics/
```

**Response:**
```json
{
    "count": 1,
    "results": [
        {
            "id": 1,
            "user": 1,
            "total_materials": 15,
            "total_quizzes": 8,
            "total_quiz_attempts": 12,
            "average_quiz_score": 78.5,
            "total_flashcards": 45,
            "study_streak": 7,
            "total_study_time": 1800,
            "materials_completed": 10,
            "quizzes_passed": 6,
            "last_activity": "2024-01-01T15:30:00Z",
            "created_at": "2024-01-01T08:00:00Z",
            "updated_at": "2024-01-01T15:30:00Z"
        }
    ]
}
```

### Get Dashboard Data
```http
GET /api/analytics/dashboard/
```

**Response:**
```json
{
    "user_stats": {
        "total_materials": 15,
        "total_quizzes": 8,
        "total_quiz_attempts": 12,
        "average_quiz_score": 78.5,
        "total_flashcards": 45,
        "study_streak": 7,
        "total_study_time": 1800,
        "materials_completed": 10,
        "quizzes_passed": 6,
        "last_activity": "2024-01-01T15:30:00Z"
    },
    "recent_activity": [
        {
            "type": "quiz_attempt",
            "quiz_title": "Physics Quiz",
            "score": 85,
            "timestamp": "2024-01-01T15:30:00Z"
        },
        {
            "type": "material_upload",
            "material_title": "Calculus Notes",
            "timestamp": "2024-01-01T14:20:00Z"
        },
        {
            "type": "flashcard_study",
            "material_title": "Chemistry Basics",
            "cards_reviewed": 12,
            "timestamp": "2024-01-01T13:45:00Z"
        }
    ],
    "performance_trends": {
        "weekly_scores": [75, 78, 82, 78, 85, 89, 91],
        "subject_performance": {
            "Mathematics": 82.5,
            "Physics": 78.0,
            "Chemistry": 85.5
        },
        "study_time_by_day": {
            "Monday": 45,
            "Tuesday": 60,
            "Wednesday": 30,
            "Thursday": 90,
            "Friday": 75,
            "Saturday": 120,
            "Sunday": 90
        }
    },
    "recommendations": [
        {
            "type": "focus_area",
            "message": "Consider reviewing Physics concepts - your average score is below your overall average",
            "subject": "Physics"
        },
        {
            "type": "study_streak",
            "message": "Great job maintaining a 7-day study streak! Keep it up!",
            "streak_count": 7
        }
    ]
}
```

## Automatic Analytics Updates

### Signal-Based Updates
Analytics are automatically updated when:
- Learning materials are uploaded
- Quizzes are completed
- Flashcards are studied
- Study sessions are completed

### Manual Updates
```bash
# Update analytics for all users
python manage.py update_analytics

# Update analytics for specific user
python manage.py update_analytics --user_id 1
```

## Frontend Integration

### React Dashboard Component
```jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchDashboardData();
    }, []);
    
    const fetchDashboardData = async () => {
        try {
            const response = await fetch('/api/analytics/dashboard/', {
                credentials: 'include'
            });
            const data = await response.json();
            setDashboardData(data);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };
    
    if (loading) return <div>Loading dashboard...</div>;
    if (!dashboardData) return <div>No data available</div>;
    
    const { user_stats, recent_activity, performance_trends, recommendations } = dashboardData;
    
    // Prepare chart data
    const chartData = performance_trends.weekly_scores.map((score, index) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index],
        score
    }));
    
    return (
        <div className="dashboard">
            <h1>Learning Dashboard</h1>
            
            {/* Key Metrics */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <h3>Study Streak</h3>
                    <div className="metric-value">{user_stats.study_streak} days</div>
                </div>
                <div className="metric-card">
                    <h3>Average Score</h3>
                    <div className="metric-value">{user_stats.average_quiz_score.toFixed(1)}%</div>
                </div>
                <div className="metric-card">
                    <h3>Materials Completed</h3>
                    <div className="metric-value">{user_stats.materials_completed}</div>
                </div>
                <div className="metric-card">
                    <h3>Study Time</h3>
                    <div className="metric-value">{Math.floor(user_stats.total_study_time / 60)} min</div>
                </div>
            </div>
            
            {/* Performance Chart */}
            <div className="chart-section">
                <h2>Weekly Performance</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#8884d8" 
                            strokeWidth={2}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            
            {/* Subject Performance */}
            <div className="subject-performance">
                <h2>Subject Performance</h2>
                <div className="subject-bars">
                    {Object.entries(performance_trends.subject_performance).map(([subject, score]) => (
                        <div key={subject} className="subject-bar">
                            <span className="subject-name">{subject}</span>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${score}%` }}
                                ></div>
                            </div>
                            <span className="subject-score">{score.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Recent Activity */}
            <div className="recent-activity">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                    {recent_activity.map((activity, index) => (
                        <div key={index} className="activity-item">
                            <div className="activity-icon">
                                {activity.type === 'quiz_attempt' && '🎯'}
                                {activity.type === 'material_upload' && '📚'}
                                {activity.type === 'flashcard_study' && '🎴'}
                            </div>
                            <div className="activity-content">
                                <div className="activity-title">
                                    {activity.type === 'quiz_attempt' && `Quiz: ${activity.quiz_title}`}
                                    {activity.type === 'material_upload' && `Uploaded: ${activity.material_title}`}
                                    {activity.type === 'flashcard_study' && `Studied: ${activity.material_title}`}
                                </div>
                                <div className="activity-details">
                                    {activity.score && `Score: ${activity.score}%`}
                                    {activity.cards_reviewed && `${activity.cards_reviewed} cards reviewed`}
                                </div>
                                <div className="activity-time">
                                    {new Date(activity.timestamp).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Recommendations */}
            <div className="recommendations">
                <h2>Recommendations</h2>
                <div className="recommendation-list">
                    {recommendations.map((rec, index) => (
                        <div key={index} className={`recommendation ${rec.type}`}>
                            <div className="rec-icon">
                                {rec.type === 'focus_area' && '🎯'}
                                {rec.type === 'study_streak' && '🔥'}
                            </div>
                            <div className="rec-message">{rec.message}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Individual Analytics Components
const StudyStreakWidget = ({ streak }) => (
    <div className="study-streak-widget">
        <div className="streak-flame">🔥</div>
        <div className="streak-count">{streak}</div>
        <div className="streak-label">Day Streak</div>
    </div>
);

const QuickStats = ({ stats }) => (
    <div className="quick-stats">
        <div className="stat">
            <span className="stat-number">{stats.total_quizzes}</span>
            <span className="stat-label">Quizzes</span>
        </div>
        <div className="stat">
            <span className="stat-number">{stats.total_flashcards}</span>
            <span className="stat-label">Flashcards</span>
        </div>
        <div className="stat">
            <span className="stat-number">{stats.materials_completed}</span>
            <span className="stat-label">Materials</span>
        </div>
    </div>
);

export { Dashboard, StudyStreakWidget, QuickStats };
```

### Vue.js Dashboard Component
```vue
<template>
  <div class="analytics-dashboard">
    <div v-if="loading" class="loading">Loading analytics...</div>
    
    <div v-else-if="dashboardData" class="dashboard-content">
      <!-- Header with key metrics -->
      <div class="dashboard-header">
        <h1>Your Learning Journey</h1>
        <div class="key-metrics">
          <div class="metric-card highlight">
            <div class="metric-icon">🔥</div>
            <div class="metric-info">
              <div class="metric-value">{{ userStats.study_streak }}</div>
              <div class="metric-label">Day Streak</div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">🎯</div>
            <div class="metric-info">
              <div class="metric-value">{{ userStats.average_quiz_score.toFixed(1) }}%</div>
              <div class="metric-label">Avg Score</div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">📚</div>
            <div class="metric-info">
              <div class="metric-value">{{ userStats.materials_completed }}</div>
              <div class="metric-label">Completed</div>
            </div>
          </div>
          
          <div class="metric-card">
            <div class="metric-icon">⏱️</div>
            <div class="metric-info">
              <div class="metric-value">{{ formatStudyTime(userStats.total_study_time) }}</div>
              <div class="metric-label">Study Time</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Charts and visualizations -->
      <div class="dashboard-grid">
        <!-- Performance Chart -->
        <div class="chart-card">
          <h2>Weekly Performance</h2>
          <div class="chart-container">
            <!-- Chart implementation would go here -->
            <div class="simple-chart">
              <div 
                v-for="(score, index) in performanceTrends.weekly_scores" 
                :key="index"
                class="chart-bar"
                :style="{ height: score + '%' }"
                :title="`Day ${index + 1}: ${score}%`"
              ></div>
            </div>
          </div>
        </div>
        
        <!-- Subject Performance -->
        <div class="chart-card">
          <h2>Subject Performance</h2>
          <div class="subject-performance">
            <div 
              v-for="(score, subject) in performanceTrends.subject_performance"
              :key="subject"
              class="subject-item"
            >
              <div class="subject-name">{{ subject }}</div>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: score + '%' }"
                ></div>
              </div>
              <div class="subject-score">{{ score.toFixed(1) }}%</div>
            </div>
          </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="activity-card">
          <h2>Recent Activity</h2>
          <div class="activity-list">
            <div 
              v-for="(activity, index) in recentActivity"
              :key="index"
              class="activity-item"
            >
              <div class="activity-icon">{{ getActivityIcon(activity.type) }}</div>
              <div class="activity-content">
                <div class="activity-title">{{ getActivityTitle(activity) }}</div>
                <div class="activity-details">{{ getActivityDetails(activity) }}</div>
                <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Recommendations -->
        <div class="recommendations-card">
          <h2>Recommendations</h2>
          <div class="recommendation-list">
            <div 
              v-for="(rec, index) in recommendations"
              :key="index"
              class="recommendation-item"
              :class="rec.type"
            >
              <div class="rec-icon">{{ getRecommendationIcon(rec.type) }}</div>
              <div class="rec-message">{{ rec.message }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsDashboard',
  
  data() {
    return {
      dashboardData: null,
      loading: true,
      error: null
    };
  },
  
  computed: {
    userStats() {
      return this.dashboardData?.user_stats || {};
    },
    
    recentActivity() {
      return this.dashboardData?.recent_activity || [];
    },
    
    performanceTrends() {
      return this.dashboardData?.performance_trends || {};
    },
    
    recommendations() {
      return this.dashboardData?.recommendations || [];
    }
  },
  
  async mounted() {
    await this.loadDashboardData();
  },
  
  methods: {
    async loadDashboardData() {
      try {
        const response = await fetch('/api/analytics/dashboard/', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        
        this.dashboardData = await response.json();
      } catch (error) {
        console.error('Dashboard error:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
    
    formatStudyTime(seconds) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    },
    
    formatTime(timestamp) {
      return new Date(timestamp).toLocaleDateString();
    },
    
    getActivityIcon(type) {
      const icons = {
        quiz_attempt: '🎯',
        material_upload: '📚',
        flashcard_study: '🎴'
      };
      return icons[type] || '📝';
    },
    
    getActivityTitle(activity) {
      switch (activity.type) {
        case 'quiz_attempt':
          return `Quiz: ${activity.quiz_title}`;
        case 'material_upload':
          return `Uploaded: ${activity.material_title}`;
        case 'flashcard_study':
          return `Studied: ${activity.material_title}`;
        default:
          return 'Activity';
      }
    },
    
    getActivityDetails(activity) {
      if (activity.score !== undefined) {
        return `Score: ${activity.score}%`;
      }
      if (activity.cards_reviewed) {
        return `${activity.cards_reviewed} cards reviewed`;
      }
      return '';
    },
    
    getRecommendationIcon(type) {
      const icons = {
        focus_area: '🎯',
        study_streak: '🔥',
        improvement: '📈'
      };
      return icons[type] || '💡';
    }
  }
};
</script>

<style scoped>
.analytics-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  margin-bottom: 30px;
}

.key-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.metric-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
}

.metric-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-icon {
  font-size: 24px;
}

.metric-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

.metric-label {
  font-size: 14px;
  opacity: 0.8;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.chart-card, .activity-card, .recommendations-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.simple-chart {
  display: flex;
  align-items: end;
  height: 200px;
  gap: 5px;
}

.chart-bar {
  flex: 1;
  background: #667eea;
  border-radius: 3px 3px 0 0;
  min-height: 10px;
}

.subject-item {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.subject-name {
  width: 100px;
  font-weight: 500;
}

.progress-bar {
  flex: 1;
  height: 10px;
  background: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #28a745;
  transition: width 0.3s ease;
}

.subject-score {
  width: 50px;
  text-align: right;
  font-weight: bold;
}

.activity-item {
  display: flex;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  font-size: 20px;
}

.activity-title {
  font-weight: 500;
  margin-bottom: 5px;
}

.activity-details {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.activity-time {
  font-size: 12px;
  color: #999;
}

.recommendation-item {
  display: flex;
  gap: 15px;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.recommendation-item.focus_area {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.recommendation-item.study_streak {
  background: #d4edda;
  border-left: 4px solid #28a745;
}

.rec-message {
  font-size: 14px;
  line-height: 1.4;
}

.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #666;
}
</style>
```

## Analytics Metrics

### Core Metrics
- **Study Streak**: Consecutive days of learning activity
- **Average Quiz Score**: Mean score across all quiz attempts
- **Total Study Time**: Cumulative time spent on learning activities
- **Completion Rate**: Percentage of started materials completed
- **Performance Trends**: Score trends over time

### Calculated Fields
- **Learning Velocity**: Materials completed per week
- **Improvement Rate**: Score improvement over time
- **Engagement Score**: Composite score based on activity frequency
- **Mastery Level**: Subject-specific proficiency scores

## Performance Tracking

### Real-time Updates
```javascript
// WebSocket connection for real-time analytics updates
const analyticsSocket = new WebSocket('ws://localhost:8000/ws/analytics/');

analyticsSocket.onmessage = function(event) {
    const data = JSON.parse(event.data);
    updateDashboard(data);
};
```

### Batch Processing
```python
# Scheduled task to update analytics
from celery import shared_task

@shared_task
def update_all_analytics():
    users = User.objects.all()
    for user in users:
        UserAnalytics.objects.update_or_create_for_user(user)
```

## Data Export

### CSV Export
```http
GET /api/analytics/export/?format=csv
```

### JSON Export
```http
GET /api/analytics/export/?format=json
```

## Privacy and Security

### Data Protection
- Analytics data is user-specific and private
- No cross-user data sharing
- Anonymized aggregate data for system insights
- GDPR compliance for data deletion

### Access Control
- Users can only access their own analytics
- Admin users can view aggregate statistics
- API rate limiting to prevent abuse
