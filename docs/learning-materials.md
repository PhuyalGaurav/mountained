# Learning Materials

## Overview

Learning Materials are the core content objects in the system. They represent uploaded documents (PDFs, text files) that serve as the foundation for all AI-powered features including quiz generation, flashcards, summaries, and study tasks.

## Model Structure

```python
{
    "id": 1,
    "title": "Introduction to Calculus",
    "subject": "Mathematics",
    "topic": "Calculus",
    "file": "/uploads/calculus_intro.pdf",
    "content": "Extracted text content...",
    "summary": "Auto-generated summary...",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "user": 1
}
```

## API Endpoints

### List Learning Materials
```http
GET /api/learning-materials/
```

**Response:**
```json
{
    "count": 25,
    "next": "http://localhost:8000/api/learning-materials/?page=2",
    "previous": null,
    "results": [
        {
            "id": 1,
            "title": "Introduction to Calculus",
            "subject": "Mathematics",
            "topic": "Calculus",
            "file": "http://localhost:8000/uploads/calculus_intro.pdf",
            "summary": "This document covers the fundamentals of calculus...",
            "created_at": "2024-01-01T12:00:00Z",
            "updated_at": "2024-01-01T12:00:00Z"
        }
    ]
}
```

### Upload Learning Material
```http
POST /api/learning-materials/
Content-Type: multipart/form-data
```

**Request:**
```javascript
const formData = new FormData();
formData.append('title', 'Physics - Electricity');
formData.append('subject', 'Physics');
formData.append('topic', 'Electricity'); // Optional - will auto-map if not provided
formData.append('file', fileInput.files[0]);
```

**Response:**
```json
{
    "id": 2,
    "title": "Physics - Electricity",
    "subject": "Physics",
    "topic": "Electricity",
    "file": "http://localhost:8000/uploads/electricity_abc123.pdf",
    "content": "Extracted text content from the PDF...",
    "summary": "Auto-generated summary of the electricity concepts...",
    "created_at": "2024-01-01T13:00:00Z",
    "updated_at": "2024-01-01T13:00:00Z"
}
```

### Get Specific Material
```http
GET /api/learning-materials/{id}/
```

### Update Material
```http
PUT /api/learning-materials/{id}/
Content-Type: application/json

{
    "title": "Updated Title",
    "subject": "Updated Subject",
    "topic": "Updated Topic"
}
```

### Delete Material
```http
DELETE /api/learning-materials/{id}/
```

## Special Endpoints

### Generate Quiz from File
```http
POST /api/learning-materials/generate_quiz_from_file/
Content-Type: multipart/form-data
```

**Request Parameters:**
- `file` (required): PDF or text file
- `title` (required): Quiz title
- `num_questions` (optional): Number of questions (default: 10)
- `difficulty` (optional): easy, medium, hard (default: medium)
- `subject` (optional): Subject category
- `topic` (optional): Specific topic

**Response:**
```json
{
    "quiz": {
        "id": 5,
        "title": "Physics Quiz",
        "learning_material": 2,
        "difficulty": "medium",
        "created_at": "2024-01-01T14:00:00Z"
    },
    "questions": [
        {
            "id": 15,
            "question_text": "What is Ohm's Law?",
            "question_type": "multiple_choice",
            "options": [
                "V = IR",
                "V = I/R", 
                "V = I + R",
                "V = I - R"
            ],
            "correct_answer": "V = IR",
            "explanation": "Ohm's Law states that voltage equals current times resistance..."
        }
    ]
}
```

## Automatic Processing

When a learning material is uploaded, several automatic processes are triggered:

### 1. Text Extraction
- PDF files are processed to extract text content
- Text is cleaned and formatted
- Metadata is preserved

### 2. Topic Mapping (if topic not provided)
- Uses scikit-learn TF-IDF vectorization
- Compares against existing curriculum topics
- Assigns best matching topic with confidence score

### 3. Summary Generation
- AI-generated summary using OpenAI GPT
- Key concepts and main points extracted
- Structured for quick review

### 4. Content Analysis
- Text complexity analysis
- Learning objective identification
- Difficulty level assessment

## Frontend Integration Examples

### React Component for File Upload
```jsx
import React, { useState } from 'react';

const MaterialUpload = () => {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [uploading, setUploading] = useState(false);
    
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !title || !subject) return;
        
        setUploading(true);
        
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
            
            if (response.ok) {
                const material = await response.json();
                console.log('Upload successful:', material);
                // Handle success (redirect, show message, etc.)
            }
        } catch (error) {
            console.error('Upload failed:', error);
        } finally {
            setUploading(false);
        }
    };
    
    return (
        <form onSubmit={handleUpload}>
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
            <button type="submit" disabled={uploading}>
                {uploading ? 'Uploading...' : 'Upload Material'}
            </button>
        </form>
    );
};
```

### Vue.js Example
```vue
<template>
  <div class="material-upload">
    <form @submit.prevent="uploadMaterial">
      <input
        ref="fileInput"
        type="file"
        accept=".pdf,.txt"
        @change="handleFileSelect"
        required
      />
      <input
        v-model="materialData.title"
        type="text"
        placeholder="Title"
        required
      />
      <input
        v-model="materialData.subject"
        type="text"
        placeholder="Subject"
        required
      />
      <input
        v-model="materialData.topic"
        type="text"
        placeholder="Topic (optional)"
      />
      <button type="submit" :disabled="uploading">
        {{ uploading ? 'Uploading...' : 'Upload' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      materialData: {
        title: '',
        subject: '',
        topic: ''
      },
      selectedFile: null,
      uploading: false
    };
  },
  methods: {
    handleFileSelect(event) {
      this.selectedFile = event.target.files[0];
    },
    async uploadMaterial() {
      if (!this.selectedFile || !this.materialData.title || !this.materialData.subject) {
        return;
      }
      
      this.uploading = true;
      
      const formData = new FormData();
      formData.append('file', this.selectedFile);
      formData.append('title', this.materialData.title);
      formData.append('subject', this.materialData.subject);
      if (this.materialData.topic) {
        formData.append('topic', this.materialData.topic);
      }
      
      try {
        const response = await fetch('/api/learning-materials/', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (response.ok) {
          const material = await response.json();
          this.$emit('material-uploaded', material);
          this.resetForm();
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        this.uploading = false;
      }
    },
    resetForm() {
      this.materialData = { title: '', subject: '', topic: '' };
      this.selectedFile = null;
      this.$refs.fileInput.value = '';
    }
  }
};
</script>
```

## Filtering and Search

### Filter by Subject
```http
GET /api/learning-materials/?subject=Mathematics
```

### Filter by Topic
```http
GET /api/learning-materials/?topic=Calculus
```

### Search in Title and Content
```http
GET /api/learning-materials/?search=integration
```

### Combined Filters
```http
GET /api/learning-materials/?subject=Physics&search=electricity&ordering=-created_at
```

## File Support

### Supported Formats
- **PDF**: Automatic text extraction using PyPDF2
- **Text Files**: Direct content processing
- **Future**: DOCX, PPTX, images with OCR

### File Size Limits
- Maximum file size: 10MB (configurable)
- Recommended: Under 5MB for optimal processing speed

### Storage
- Files are stored in `/uploads/` directory
- Unique filenames prevent conflicts
- CDN integration recommended for production

## Error Handling

### Common Errors
```json
{
    "file": ["This field is required."],
    "title": ["This field is required."],
    "subject": ["This field is required."]
}
```

### File Processing Errors
```json
{
    "error": "file_processing_failed",
    "message": "Could not extract text from PDF",
    "details": {
        "file_type": "application/pdf",
        "file_size": "15MB"
    }
}
```

## Performance Optimization

### Recommendations
1. **Async Processing**: Large files processed in background
2. **Caching**: Generated content cached to avoid reprocessing
3. **Compression**: File compression for storage efficiency
4. **CDN**: Use CDN for file delivery in production

### Monitoring
- Track upload success rates
- Monitor processing times
- Alert on failures
