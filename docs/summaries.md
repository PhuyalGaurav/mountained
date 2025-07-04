# Summaries

## Overview

The Summary system provides AI-generated summaries of learning materials. Summaries are automatically created when learning materials are uploaded and can also be manually generated or edited.

## Model Structure

```python
{
    "id": 1,
    "learning_material": 2,
    "content": "This document covers the fundamental principles of electricity including Ohm's Law, circuit analysis, and basic electrical components. Key concepts include voltage (V), current (I), and resistance (R), with their relationship defined by V = IR.",
    "summary_type": "key_points",
    "length": "medium",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z"
}
```

## API Endpoints

### List Summaries
```http
GET /api/summaries/
```

**Response:**
```json
{
    "count": 12,
    "next": null,
    "previous": null,
    "results": [
        {
            "id": 1,
            "learning_material": 2,
            "content": "This document covers the fundamental principles of electricity...",
            "summary_type": "key_points",
            "length": "medium",
            "created_at": "2024-01-01T12:00:00Z"
        },
        {
            "id": 2,
            "learning_material": 3,
            "content": "Introduction to calculus fundamentals including limits, derivatives...",
            "summary_type": "overview",
            "length": "short",
            "created_at": "2024-01-01T13:00:00Z"
        }
    ]
}
```

### Create Summary
```http
POST /api/summaries/
Content-Type: application/json

{
    "learning_material": 2,
    "summary_type": "key_points",
    "length": "medium"
}
```

### Get Specific Summary
```http
GET /api/summaries/{id}/
```

### Update Summary
```http
PUT /api/summaries/{id}/
Content-Type: application/json

{
    "content": "Updated summary content with new insights...",
    "summary_type": "detailed",
    "length": "long"
}
```

### Delete Summary
```http
DELETE /api/summaries/{id}/
```

## Summary Types

### 1. Key Points
- **Type**: `key_points`
- **Format**: Bullet points highlighting main concepts
- **Use Case**: Quick review before exams

**Example:**
```
• Ohm's Law states that V = IR
• Voltage is measured in volts (V)
• Current is measured in amperes (A)
• Resistance is measured in ohms (Ω)
• Series circuits have components connected end-to-end
• Parallel circuits have components connected side-by-side
```

### 2. Overview
- **Type**: `overview`
- **Format**: Paragraph summary of main topics
- **Use Case**: Understanding document scope

**Example:**
```
This document provides a comprehensive introduction to electrical circuits and fundamental laws governing electricity. It covers Ohm's Law as the foundation for understanding the relationship between voltage, current, and resistance, followed by practical applications in series and parallel circuit analysis.
```

### 3. Detailed
- **Type**: `detailed`
- **Format**: Structured summary with subsections
- **Use Case**: Comprehensive review

**Example:**
```
## Electrical Fundamentals

### Basic Concepts
- Voltage: Electric potential difference that drives current
- Current: Flow of electric charge through a conductor
- Resistance: Opposition to current flow

### Ohm's Law
The fundamental relationship V = IR where:
- V = Voltage (volts)
- I = Current (amperes)  
- R = Resistance (ohms)

### Circuit Types
1. Series Circuits: Single path for current
2. Parallel Circuits: Multiple paths for current
```

## Summary Lengths

### Short
- **Word Count**: 50-100 words
- **Reading Time**: ~30 seconds
- **Use Case**: Quick glance review

### Medium
- **Word Count**: 100-200 words
- **Reading Time**: ~1 minute
- **Use Case**: Standard review sessions

### Long
- **Word Count**: 200-400 words
- **Reading Time**: ~2-3 minutes
- **Use Case**: Detailed study preparation

## Automatic Generation

Summaries are automatically generated when learning materials are uploaded using AI analysis:

### Generation Process
1. **Content Analysis**: Extract main topics and concepts
2. **Structure Identification**: Identify document hierarchy
3. **Key Point Extraction**: Determine most important information
4. **Summary Creation**: Generate coherent summary using GPT
5. **Quality Check**: Verify accuracy and completeness

### AI Prompt Template
```
Analyze this educational content and create a {{summary_type}} summary of {{length}} length.

Content: {{material_content}}

Requirements:
- Focus on key concepts and learning objectives
- Use clear, concise language appropriate for students
- Maintain educational accuracy
- Structure information logically
- Include important definitions and formulas

Summary Type: {{summary_type}}
Target Length: {{length}} ({{word_count}} words)
```

## Frontend Integration

### React Summary Component
```jsx
import React, { useState, useEffect } from 'react';

const SummaryViewer = ({ materialId, summaryType = 'key_points', length = 'medium' }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    
    useEffect(() => {
        loadSummary();
    }, [materialId, summaryType, length]);
    
    const loadSummary = async () => {
        try {
            const response = await fetch(
                `/api/summaries/?learning_material=${materialId}&summary_type=${summaryType}&length=${length}`,
                { credentials: 'include' }
            );
            const data = await response.json();
            
            if (data.results.length > 0) {
                setSummary(data.results[0]);
            } else {
                // No summary exists, generate one
                await generateSummary();
            }
        } catch (error) {
            console.error('Failed to load summary:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const generateSummary = async () => {
        setGenerating(true);
        try {
            const response = await fetch('/api/summaries/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({
                    learning_material: materialId,
                    summary_type: summaryType,
                    length: length
                }),
                credentials: 'include'
            });
            
            const newSummary = await response.json();
            setSummary(newSummary);
        } catch (error) {
            console.error('Failed to generate summary:', error);
        } finally {
            setGenerating(false);
        }
    };
    
    const regenerateSummary = async () => {
        if (summary) {
            await fetch(`/api/summaries/${summary.id}/`, {
                method: 'DELETE',
                credentials: 'include'
            });
        }
        await generateSummary();
    };
    
    if (loading) {
        return <div className="summary-loading">Loading summary...</div>;
    }
    
    if (generating) {
        return (
            <div className="summary-generating">
                <div className="spinner"></div>
                <p>Generating AI summary...</p>
            </div>
        );
    }
    
    return (
        <div className="summary-viewer">
            <div className="summary-header">
                <h3>Summary</h3>
                <div className="summary-controls">
                    <select 
                        value={summaryType} 
                        onChange={(e) => setSummaryType(e.target.value)}
                    >
                        <option value="key_points">Key Points</option>
                        <option value="overview">Overview</option>
                        <option value="detailed">Detailed</option>
                    </select>
                    
                    <select 
                        value={length} 
                        onChange={(e) => setLength(e.target.value)}
                    >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Long</option>
                    </select>
                    
                    <button onClick={regenerateSummary} className="regenerate-btn">
                        🔄 Regenerate
                    </button>
                </div>
            </div>
            
            <div className="summary-content">
                {summary ? (
                    <div 
                        className={`summary-text ${summaryType}`}
                        dangerouslySetInnerHTML={{ 
                            __html: formatSummaryContent(summary.content, summaryType) 
                        }}
                    />
                ) : (
                    <div className="no-summary">
                        <p>No summary available</p>
                        <button onClick={generateSummary}>Generate Summary</button>
                    </div>
                )}
            </div>
            
            {summary && (
                <div className="summary-footer">
                    <small>
                        Generated {new Date(summary.created_at).toLocaleDateString()}
                    </small>
                </div>
            )}
        </div>
    );
};

// Summary formatting utility
const formatSummaryContent = (content, type) => {
    switch (type) {
        case 'key_points':
            // Convert bullet points to HTML
            return content
                .split('\n')
                .filter(line => line.trim())
                .map(line => {
                    if (line.startsWith('•') || line.startsWith('-')) {
                        return `<li>${line.substring(1).trim()}</li>`;
                    }
                    return `<p>${line}</p>`;
                })
                .join('');
                
        case 'detailed':
            // Convert markdown-style headers to HTML
            return content
                .replace(/^## (.+)$/gm, '<h4>$1</h4>')
                .replace(/^### (.+)$/gm, '<h5>$1</h5>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/^/, '<p>')
                .replace(/$/, '</p>');
                
        default:
            return `<p>${content.replace(/\n/g, '</p><p>')}</p>`;
    }
};

// Multi-summary viewer for different types
const SummaryTabs = ({ materialId }) => {
    const [activeTab, setActiveTab] = useState('key_points');
    
    const tabs = [
        { id: 'key_points', name: 'Key Points', icon: '📝' },
        { id: 'overview', name: 'Overview', icon: '👁️' },
        { id: 'detailed', name: 'Detailed', icon: '📋' }
    ];
    
    return (
        <div className="summary-tabs">
            <div className="tab-headers">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-header ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-name">{tab.name}</span>
                    </button>
                ))}
            </div>
            
            <div className="tab-content">
                <SummaryViewer 
                    materialId={materialId}
                    summaryType={activeTab}
                    length="medium"
                />
            </div>
        </div>
    );
};

export { SummaryViewer, SummaryTabs };
```

### Vue.js Summary Component
```vue
<template>
  <div class="summary-component">
    <div class="summary-header">
      <h2>📝 Summary</h2>
      <div class="summary-options">
        <select v-model="selectedType" @change="loadSummary">
          <option value="key_points">Key Points</option>
          <option value="overview">Overview</option>
          <option value="detailed">Detailed</option>
        </select>
        
        <select v-model="selectedLength" @change="loadSummary">
          <option value="short">Short</option>
          <option value="medium">Medium</option>
          <option value="long">Long</option>
        </select>
        
        <button @click="regenerateSummary" :disabled="generating" class="regenerate-button">
          {{ generating ? '⏳' : '🔄' }} 
          {{ generating ? 'Generating...' : 'Regenerate' }}
        </button>
      </div>
    </div>
    
    <div class="summary-content">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading summary...</p>
      </div>
      
      <div v-else-if="generating" class="generating-state">
        <div class="ai-animation">🤖</div>
        <p>AI is generating your summary...</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progress + '%' }"></div>
        </div>
      </div>
      
      <div v-else-if="summary" class="summary-display">
        <div 
          class="summary-text"
          :class="[selectedType, selectedLength]"
          v-html="formattedContent"
        ></div>
        
        <div class="summary-meta">
          <div class="reading-time">
            📖 {{ estimatedReadingTime }} min read
          </div>
          <div class="generated-date">
            Generated {{ formatDate(summary.created_at) }}
          </div>
        </div>
      </div>
      
      <div v-else class="no-summary">
        <div class="empty-state">
          <div class="empty-icon">📄</div>
          <h3>No summary available</h3>
          <p>Generate an AI summary to get key insights from this material.</p>
          <button @click="generateSummary" class="generate-button">
            ✨ Generate Summary
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SummaryComponent',
  
  props: {
    materialId: {
      type: Number,
      required: true
    }
  },
  
  data() {
    return {
      summary: null,
      selectedType: 'key_points',
      selectedLength: 'medium',
      loading: true,
      generating: false,
      progress: 0
    };
  },
  
  computed: {
    formattedContent() {
      if (!this.summary) return '';
      
      return this.formatSummaryContent(this.summary.content, this.selectedType);
    },
    
    estimatedReadingTime() {
      if (!this.summary) return 0;
      
      const wordsPerMinute = 200;
      const wordCount = this.summary.content.split(/\s+/).length;
      return Math.ceil(wordCount / wordsPerMinute);
    }
  },
  
  async mounted() {
    await this.loadSummary();
  },
  
  methods: {
    async loadSummary() {
      this.loading = true;
      
      try {
        const params = new URLSearchParams({
          learning_material: this.materialId,
          summary_type: this.selectedType,
          length: this.selectedLength
        });
        
        const response = await fetch(`/api/summaries/?${params}`, {
          credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.results.length > 0) {
          this.summary = data.results[0];
        } else {
          this.summary = null;
        }
      } catch (error) {
        console.error('Failed to load summary:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async generateSummary() {
      this.generating = true;
      this.progress = 0;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        this.progress += Math.random() * 15;
        if (this.progress > 90) {
          this.progress = 90;
        }
      }, 500);
      
      try {
        const response = await fetch('/api/summaries/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': this.getCsrfToken()
          },
          body: JSON.stringify({
            learning_material: this.materialId,
            summary_type: this.selectedType,
            length: this.selectedLength
          }),
          credentials: 'include'
        });
        
        if (response.ok) {
          this.summary = await response.json();
          this.progress = 100;
          
          setTimeout(() => {
            this.generating = false;
            this.progress = 0;
          }, 500);
        } else {
          throw new Error('Failed to generate summary');
        }
      } catch (error) {
        console.error('Summary generation failed:', error);
        this.generating = false;
        this.progress = 0;
      } finally {
        clearInterval(progressInterval);
      }
    },
    
    async regenerateSummary() {
      if (this.summary) {
        try {
          await fetch(`/api/summaries/${this.summary.id}/`, {
            method: 'DELETE',
            credentials: 'include'
          });
        } catch (error) {
          console.error('Failed to delete old summary:', error);
        }
      }
      
      await this.generateSummary();
    },
    
    formatSummaryContent(content, type) {
      switch (type) {
        case 'key_points':
          return content
            .split('\n')
            .filter(line => line.trim())
            .map(line => {
              if (line.startsWith('•') || line.startsWith('-')) {
                return `<li>${line.substring(1).trim()}</li>`;
              }
              return `<p>${line}</p>`;
            })
            .join('');
            
        case 'detailed':
          return content
            .replace(/^## (.+)$/gm, '<h4>$1</h4>')
            .replace(/^### (.+)$/gm, '<h5>$1</h5>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
            
        default:
          return content
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>');
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },
    
    getCsrfToken() {
      return document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
  }
};
</script>

<style scoped>
.summary-component {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.summary-options {
  display: flex;
  gap: 10px;
  align-items: center;
}

.summary-options select {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: white;
  color: #333;
}

.regenerate-button {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.regenerate-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.regenerate-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.summary-content {
  padding: 20px;
}

.loading-state, .generating-state {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-animation {
  font-size: 3rem;
  animation: bounce 1s infinite;
  margin-bottom: 20px;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 20px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
}

.summary-text {
  line-height: 1.6;
  color: #333;
}

.summary-text.key_points li {
  margin-bottom: 8px;
  padding-left: 10px;
}

.summary-text.detailed h4 {
  color: #667eea;
  margin-top: 24px;
  margin-bottom: 12px;
}

.summary-text.detailed h5 {
  color: #666;
  margin-top: 16px;
  margin-bottom: 8px;
}

.summary-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  font-size: 0.9rem;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
  opacity: 0.3;
}

.empty-state h3 {
  color: #333;
  margin-bottom: 10px;
}

.empty-state p {
  color: #666;
  margin-bottom: 30px;
}

.generate-button {
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

.generate-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}
</style>
```

## Filtering and Search

### Filter by Material
```http
GET /api/summaries/?learning_material=2
```

### Filter by Type
```http
GET /api/summaries/?summary_type=key_points
```

### Filter by Length
```http
GET /api/summaries/?length=medium
```

### Search in Content
```http
GET /api/summaries/?search=electricity
```

## Use Cases

### 1. Quick Review
```javascript
// Get short key points for quick review
const quickReview = await fetch('/api/summaries/?summary_type=key_points&length=short');
```

### 2. Study Preparation
```javascript
// Get detailed summary for comprehensive study
const studyMaterial = await fetch('/api/summaries/?summary_type=detailed&length=long');
```

### 3. Content Overview
```javascript
// Get overview before reading full material
const overview = await fetch('/api/summaries/?summary_type=overview&length=medium');
```

## Best Practices

### Frontend Implementation
1. **Progressive Enhancement**: Show basic content first, then enhance with summaries
2. **Caching**: Cache summaries locally to reduce API calls
3. **Fallback Content**: Always provide fallback when AI generation fails
4. **User Feedback**: Allow users to rate summary quality

### Performance Optimization
1. **Lazy Loading**: Generate summaries on demand
2. **Background Processing**: Generate summaries asynchronously
3. **Caching Strategy**: Cache frequently accessed summaries
4. **Batch Processing**: Generate multiple summaries in batches

### Quality Assurance
1. **Content Validation**: Verify summary accuracy
2. **Length Compliance**: Ensure summaries meet length requirements
3. **Format Consistency**: Maintain consistent formatting
4. **User Feedback Integration**: Use ratings to improve generation
