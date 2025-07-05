"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import courseContentService from "@/app/services/courseContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  FileQuestion,
  BookOpen,
  Loader2,
  Upload,
  Target,
  Brain,
  Plus,
  X,
  Type,
  CloudUpload,
} from "lucide-react";

export default function CreateQuizPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get parameters from URL for pre-population
  const topicParam = searchParams.get('topic');
  const materialParam = searchParams.get('material');
  const subjectParam = searchParams.get('subject');
  const gradeParam = searchParams.get('grade');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    difficulty: 'medium',
    numQuestions: 10,
    topic: topicParam || '',
    customInstructions: '',
  });
  
  // Other state
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(materialParam || '');
  const [generationType, setGenerationType] = useState('topic'); // 'topic', 'material', 'custom'
  const [customQuestions, setCustomQuestions] = useState([]);
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated) {
      fetchTopics();
      fetchLearningMaterials();
    }
  }, [isAuthenticated]);

  const fetchTopics = async () => {
    try {
      const response = await apiService.getCurriculumTopics();
      setTopics(response.data || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
    }
  };

  const fetchLearningMaterials = async () => {
    try {
      const response = await apiService.getLearningMaterials();
      setLearningMaterials(response.data || []);
    } catch (error) {
      console.error("Error fetching learning materials:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addCustomQuestion = () => {
    setCustomQuestions(prev => [...prev, {
      id: Date.now(),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    }]);
  };

  const removeCustomQuestion = (id) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id));
  };

  const updateCustomQuestion = (id, field, value, optionIndex = null) => {
    setCustomQuestions(prev => prev.map(q => {
      if (q.id === id) {
        if (field === 'options' && optionIndex !== null) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-powerpoint'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, Word document, PowerPoint, or text file.",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploadingFile(true);
    try {
      const response = await courseContentService.uploadLearningMaterial(selectedFile);
      
      console.log("Upload response:", response); // Debug log
      
      // Add the new material to the list and select it
      setLearningMaterials(prev => {
        const updated = [response, ...prev];
        console.log("Updated learning materials:", updated); // Debug log
        return updated;
      });
      
      setSelectedMaterial(response.id);
      console.log("Selected material ID:", response.id); // Debug log
      
      setSelectedFile(null);
      
      toast({
        title: "Success!",
        description: "File uploaded successfully and is ready for quiz generation.",
      });
      
      // Reset the file input
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error("Error uploading file:", error);
      
      let errorMessage = "Failed to upload file. Please try again.";
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.status === 413) {
        errorMessage = "File is too large. Please upload a smaller file.";
      }
      
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingFile(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a quiz title.",
        variant: "destructive",
      });
      return false;
    }

    if (generationType === 'topic' && !formData.topic) {
      toast({
        title: "Validation Error",
        description: "Please select a topic.",
        variant: "destructive",
      });
      return false;
    }

    if (generationType === 'material') {
      // Check if user has either selected an existing material or uploaded a new one
      if (!selectedMaterial) {
        toast({
          title: "Validation Error",
          description: "Please select a learning material or upload a new file.",
          variant: "destructive",
        });
        return false;
      }
      
      // Ensure the selected material exists in the materials list
      const materialExists = learningMaterials.some(material => material.id === selectedMaterial);
      if (!materialExists) {
        toast({
          title: "Validation Error",
          description: "Selected learning material is not valid. Please select a different material or upload a new file.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (generationType === 'custom' && customQuestions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one custom question.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const generateQuiz = async () => {
    console.log("Generate quiz called with:", {
      generationType,
      selectedMaterial,
      learningMaterials: learningMaterials.length,
      formData
    }); // Debug log
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (generationType === 'material' && selectedMaterial) {
        // Generate quiz from learning material - this creates a complete quiz with questions
        const generateData = {
          difficulty: formData.difficulty,
          num_questions: formData.numQuestions,
          custom_instructions: formData.customInstructions || undefined,
        };
        
        console.log("Generating quiz with data:", generateData, "for material:", selectedMaterial); // Debug log
        
        const response = await apiService.generateQuiz(selectedMaterial, generateData);
        
        if (response.data?.quiz_id || response.data?.id) {
          const quizId = response.data.quiz_id || response.data.id;
          toast({
            title: "Success!",
            description: "Quiz generated successfully from your learning material!",
          });
          router.push(`/quizzes/${quizId}`);
          return;
        }
      } else if (generationType === 'topic') {
        // For topic-based quizzes: create quiz first, then generate questions
        const quizData = {
          title: formData.title,
          difficulty: formData.difficulty,
          topic: formData.topic ? parseInt(formData.topic) : null,
        };
        
        const quizResponse = await apiService.createQuiz(quizData);
        const quizId = quizResponse.data.id;
        
        // Generate questions for the quiz
        await apiService.generateQuizQuestions(quizId, {
          difficulty: formData.difficulty,
          num_questions: formData.numQuestions,
          custom_instructions: formData.customInstructions || undefined,
        });
        
        toast({
          title: "Success!",
          description: "Quiz created and questions generated successfully!",
        });
        router.push(`/quizzes/${quizId}`);
      } else if (generationType === 'custom') {
        // For custom quizzes: create quiz with questions included
        const quizData = {
          title: formData.title,
          difficulty: formData.difficulty,
          questions: customQuestions.map(q => ({
            question_text: q.question,
            options: {
              a: q.options[0],
              b: q.options[1],
              c: q.options[2],
              d: q.options[3],
            },
            correct_option: ['a', 'b', 'c', 'd'][q.correctAnswer],
            explanation: q.explanation || undefined,
          })),
        };
        
        const response = await apiService.createQuiz(quizData);
        
        toast({
          title: "Success!",
          description: "Custom quiz created successfully!",
        });
        router.push(`/quizzes/${response.data.id}`);
      }
      
    } catch (error) {
      console.error("Error creating quiz:", error);
      
      let errorMessage = "Failed to create quiz. Please try again.";
      
      if (error.response?.status === 500) {
        errorMessage = "Server error occurred. The quiz generation service may be temporarily unavailable.";
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || error.response?.data?.error || "Invalid quiz data. Please check your input.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please log in again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Please log in to create quizzes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center mb-4">
            <Button
              onClick={() => router.push("/quizzes")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </div>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <FileQuestion className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Quiz</h1>
            <p className="text-gray-600">
              Generate AI-powered quizzes from topics, materials, or create custom questions
            </p>
          </div>
        </div>

        {/* Quiz Type Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Choose Quiz Type
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <button
              onClick={() => setGenerationType('topic')}
              className={`p-4 rounded-lg border-2 transition-all ${
                generationType === 'topic'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Brain className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-medium">Topic-Based</h3>
              <p className="text-sm text-gray-600">Generate from curriculum topics</p>
            </button>
            
            <button
              onClick={() => setGenerationType('material')}
              className={`p-4 rounded-lg border-2 transition-all ${
                generationType === 'material'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-medium">From Material</h3>
              <p className="text-sm text-gray-600">Generate from uploaded files</p>
            </button>
            
            <button
              onClick={() => setGenerationType('custom')}
              className={`p-4 rounded-lg border-2 transition-all ${
                generationType === 'custom'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileQuestion className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-medium">Custom</h3>
              <p className="text-sm text-gray-600">Create your own questions</p>
            </button>
          </div>
          
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Quiz Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Enter quiz title..."
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="difficulty">Difficulty Level</Label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => handleInputChange('difficulty', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {generationType !== 'custom' && (
                <div>
                  <Label htmlFor="numQuestions">Number of Questions</Label>
                  <Input
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.numQuestions}
                    onChange={(e) => handleInputChange('numQuestions', parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Selection */}
        {generationType === 'topic' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
              Topic Selection
            </h2>
            
            {topics.length > 0 ? (
              <div>
                <Label>Select from available topics:</Label>
                <select
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a topic...</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.subject} - Grade {topic.grade} - {topic.topic}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No curriculum topics found.</p>
                <div>
                  <Label htmlFor="topicText">Enter Topic Manually:</Label>
                  <Input
                    id="topicText"
                    value={formData.topic}
                    onChange={(e) => handleInputChange('topic', e.target.value)}
                    placeholder="e.g., Algebra, Photosynthesis, World War II"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div className="mt-4">
              <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
              <textarea
                id="customInstructions"
                value={formData.customInstructions}
                onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                placeholder="Provide specific instructions for quiz generation (e.g., focus on certain concepts, question types, etc.)"
                rows="3"
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {generationType === 'material' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Upload className="h-5 w-5 mr-2 text-green-600" />
              Learning Material Selection
            </h2>
            
            {/* File Upload Section */}
            <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <CloudUpload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-2">Upload New File</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Upload a PDF, Word document, PowerPoint, or text file to generate quiz questions
                </p>
                
                {!selectedFile ? (
                  <div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <CloudUpload className="h-4 w-4 mr-2" />
                      Choose File
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Supported formats: PDF, Word, PowerPoint, Text (Max: 10MB)
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <Upload className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={uploadFile}
                          disabled={uploadingFile}
                          size="sm"
                        >
                          {uploadingFile ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <CloudUpload className="h-4 w-4 mr-2" />
                              Upload
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={removeSelectedFile}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Existing Materials Section */}
            {learningMaterials.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-3">Or Select from Existing Materials</h3>
                <div>
                  <Label>Select a learning material:</Label>
                  <select
                    value={selectedMaterial}
                    onChange={(e) => setSelectedMaterial(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a material...</option>
                    {learningMaterials.map((material) => (
                      <option key={material.id} value={material.id}>
                        {material.file.split('/').pop()} - Uploaded {new Date(material.uploaded_at).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  
                  {/* Show selected material confirmation */}
                  {selectedMaterial && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                          <Upload className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Material Selected: {learningMaterials.find(m => m.id === selectedMaterial)?.file.split('/').pop()}
                          </p>
                          <p className="text-xs text-green-600">Ready for quiz generation</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {learningMaterials.length === 0 && (
              <div className="text-center py-8 border-t">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No existing learning materials found.</p>
                <p className="text-sm text-gray-500">Upload a file above to get started!</p>
              </div>
            )}

            {selectedMaterial && (
              <div className="mt-4">
                <Label htmlFor="customInstructions">Custom Instructions (Optional)</Label>
                <textarea
                  id="customInstructions"
                  value={formData.customInstructions}
                  onChange={(e) => handleInputChange('customInstructions', e.target.value)}
                  placeholder="Provide specific instructions for quiz generation (e.g., focus on certain concepts, question types, etc.)"
                  rows="3"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        )}

        {generationType === 'custom' && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <FileQuestion className="h-5 w-5 mr-2 text-purple-600" />
                Custom Questions
              </h2>
              <Button onClick={addCustomQuestion} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>
            
            {customQuestions.length === 0 ? (
              <div className="text-center py-8">
                <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No custom questions added yet.</p>
                <Button onClick={addCustomQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Question
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {customQuestions.map((question, index) => (
                  <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Question {index + 1}</h3>
                      <Button
                        onClick={() => removeCustomQuestion(question.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <Label>Question Text</Label>
                        <Input
                          value={question.question}
                          onChange={(e) => updateCustomQuestion(question.id, 'question', e.target.value)}
                          placeholder="Enter your question..."
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label>Answer Options</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-600 w-6">
                                {String.fromCharCode(65 + optionIndex)}.
                              </span>
                              <Input
                                value={option}
                                onChange={(e) => updateCustomQuestion(question.id, 'options', e.target.value, optionIndex)}
                                placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                                className="flex-1"
                              />
                              <input
                                type="radio"
                                name={`correct-${question.id}`}
                                checked={question.correctAnswer === optionIndex}
                                onChange={() => updateCustomQuestion(question.id, 'correctAnswer', optionIndex)}
                                className="w-4 h-4"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Select the radio button for the correct answer</p>
                      </div>
                      
                      <div>
                        <Label>Explanation (Optional)</Label>
                        <Input
                          value={question.explanation}
                          onChange={(e) => updateCustomQuestion(question.id, 'explanation', e.target.value)}
                          placeholder="Explain why this is the correct answer..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <Button
            onClick={generateQuiz}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating Quiz...
              </>
            ) : (
              <>
                <FileQuestion className="h-5 w-5 mr-2" />
                Create Quiz
              </>
            )}
          </Button>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            {generationType === 'material' ? 
              'AI will generate questions from your selected material' :
              generationType === 'topic' ?
              'AI will generate questions based on the topic' :
              'Your custom questions will be saved'
            }
          </p>
        </div>
      </div>
    </div>
  );
}
