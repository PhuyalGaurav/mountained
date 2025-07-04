"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  RotateCcw,
  Eye,
  EyeOff,
  AlertCircle,
  Target,
  History,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function QuizDetails({ params }) {
  const resolvedParams = use(params);
  const { id: quizId } = resolvedParams;
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptIdParam = searchParams.get('attemptId');

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchRecentAttempts = useCallback(async () => {
    try {
      setLoadingHistory(true);
      const response = await apiService.getQuizAttempts();
      const allAttempts = response.data.results || response.data;
      
      // Filter attempts for this quiz and sort by timestamp
      const quizAttempts = allAttempts
        .filter(attempt => attempt.quiz === parseInt(quizId))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      setRecentAttempts(quizAttempts);
      console.log("Quiz attempts for quiz", quizId, ":", quizAttempts);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
      // Non-critical error, don't show toast
    } finally {
      setLoadingHistory(false);
    }
  }, [quizId]);

  const fetchQuizAttemptData = useCallback(async (attemptId) => {
    try {
      console.log("Fetching quiz attempt data for ID:", attemptId);
      const response = await apiService.getQuizAttempt(attemptId);
      console.log("Quiz attempt response:", response.data);
      
      const attempt = response.data;
      
      // Convert quiz attempt data to our expected format
      const results = {
        score: attempt.score || 0,
        correct_answers: attempt.question_attempts?.filter(qa => qa.is_correct).length || 0,
        total_questions: attempt.question_attempts?.length || 0,
        time_taken: attempt.time_taken || 0,
        question_results: attempt.question_attempts?.map(qa => ({
          question_id: qa.question,
          is_correct: qa.is_correct,
          selected_option: qa.selected_option,
          user_answer: qa.selected_option
        })) || []
      };
      
      console.log("Converted attempt results:", results);
      return results;
    } catch (error) {
      console.error("Error fetching quiz attempt:", error);
      throw error;
    }
  }, []);

  const fetchQuizData = useCallback(async () => {
    try {
      setLoading(true);
      const [quizResponse, questionsResponse] = await Promise.all([
        apiService.getQuiz(quizId),
        apiService.getQuizQuestions(quizId),
      ]);
      
      console.log("Quiz response:", quizResponse.data);
      console.log("Questions response:", questionsResponse);
      
      setQuiz(quizResponse.data);
      
      // Ensure questions is always an array
      const questionsData = Array.isArray(questionsResponse.data) 
        ? questionsResponse.data 
        : questionsResponse.data?.questions || questionsResponse.data?.results || [];
      
      // Process questions to handle different option formats
      const processedQuestions = questionsData.map(question => {
        console.log('Processing question:', question.id, {
          original_options: question.options,
          original_type: typeof question.options,
          correct_option: question.correct_option,
          correct_answer: question.correct_answer
        });
        
        // Handle different possible formats for options
        if (typeof question.options === 'string') {
          // If options is a JSON string, parse it
          try {
            const parsed = JSON.parse(question.options);
            question.options = parsed;
            console.log('Parsed JSON options:', question.options);
          } catch (e) {
            // If it's not JSON, treat as comma-separated string and convert to object
            const optionArray = question.options.split(',').map(opt => opt.trim()).filter(opt => opt);
            const optionObject = {};
            optionArray.forEach((opt, index) => {
              optionObject[String.fromCharCode(97 + index)] = opt; // a, b, c, d
            });
            question.options = optionObject;
            console.log('Converted string to options object:', question.options);
          }
        } else if (Array.isArray(question.options)) {
          // Convert array to object format for consistency
          const optionObject = {};
          question.options.forEach((opt, index) => {
            optionObject[String.fromCharCode(97 + index)] = opt; // a, b, c, d
          });
          question.options = optionObject;
          console.log('Converted array to options object:', question.options);
        } else if (question.options && typeof question.options === 'object') {
          // Options is already an object - keep as is
          console.log('Options already in correct object format:', question.options);
        } else {
          // Fallback: try to get options from other possible fields
          const fallbackOptions = question.choices || question.answers || [];
          const optionObject = {};
          if (Array.isArray(fallbackOptions)) {
            fallbackOptions.forEach((opt, index) => {
              optionObject[String.fromCharCode(97 + index)] = opt; // a, b, c, d
            });
          }
          question.options = optionObject;
          console.log('Used fallback options:', question.options);
        }
        
        console.log('Final processed question:', question.id, {
          processed_options: question.options,
          correct_option: question.correct_option,
          correct_answer: question.correct_answer,
          optionKeys: Object.keys(question.options || {})
        });
        
        // Keep the original question structure
        return question;
      });
      
      console.log("Processed questions:", processedQuestions);
      setQuestions(processedQuestions);
      
      // Debug quiz data structure
      if (process.env.NODE_ENV === 'development') {
        apiService.debugQuizData(quizId, processedQuestions);
      }
      
      // Set timer if quiz has time limit (default 30 minutes)
      const timeLimit = quizResponse.data.time_limit || 30 * 60; // 30 minutes in seconds
      setTimeRemaining(timeLimit);

      // Check if quiz is already completed
      if (quizResponse.data.status === 'completed') {
        setQuizCompleted(true);
        setShowReview(true);
        if (quizResponse.data.results) {
          setQuizResults(quizResponse.data.results);
        }
        // If we have a latest_attempt_id, fetch the detailed attempt data
        if (quizResponse.data.latest_attempt_id) {
          try {
            const attemptResults = await fetchQuizAttemptData(quizResponse.data.latest_attempt_id);
            setQuizResults(attemptResults);
            setQuizAttemptId(quizResponse.data.latest_attempt_id);
          } catch (error) {
            console.error("Failed to fetch attempt details:", error);
            // Fallback to basic results if available
            if (quizResponse.data.results) {
              setQuizResults(quizResponse.data.results);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching quiz data:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [quizId, toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizData();
      fetchRecentAttempts();
      
      // If there's an attemptId in the URL, load that specific attempt for review
      if (attemptIdParam) {
        loadQuizAttemptForReview(attemptIdParam);
      }
    }
  }, [isAuthenticated, fetchQuizData, fetchRecentAttempts, attemptIdParam]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (quizStarted && !quizCompleted) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [quizStarted, quizCompleted]);

  const startQuiz = () => {
    setQuizStarted(true);
    setTimeElapsed(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
  };

  const handleAnswerSelect = (questionId, selectedOption, optionKey) => {
    console.log("Answer selected:", { questionId, selectedOption, optionKey });
    // Always store the option key as the primary answer - this is what the backend expects
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey, // Store just the key (e.g., "a", "b", "c", "d")
    }));
  };

  const navigateToQuestion = (index) => {
    setCurrentQuestionIndex(index);
  };

  const nextQuestion = () => {
    if (Array.isArray(questions) && currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const submitQuiz = async () => {
    try {
      setSubmitting(true);
      
      // Validate we have answers
      if (Object.keys(answers).length === 0) {
        toast({
          title: "No Answers",
          description: "Please answer at least one question before submitting.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate that we have valid questions
      if (!Array.isArray(questions) || questions.length === 0) {
        toast({
          title: "Error",
          description: "No questions found. Please refresh and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("=== QUIZ SUBMISSION VALIDATION ===");
      console.log("Questions count:", questions.length);
      console.log("Answers count:", Object.keys(answers).length);
      console.log("Questions IDs:", questions.map(q => q.id));
      console.log("Answer keys:", Object.keys(answers));
      
      // Format answers according to API documentation: {"15": "a", "16": "b"}
      // answers should contain question_id -> option_key mapping
      const formattedAnswers = {};
      
      Object.keys(answers).forEach((questionId) => {
        const answerKey = answers[questionId];
        console.log(`Processing answer for question ${questionId}:`, answerKey);
        
        // answers[questionId] should now just be the option key (e.g., "a", "b", "c", "d")
        if (answerKey && typeof answerKey === 'string' && answerKey.trim() !== '') {
          formattedAnswers[questionId] = answerKey;
        } else {
          console.warn(`Invalid answer format for question ${questionId}:`, answerKey);
        }
      });

      if (Object.keys(formattedAnswers).length === 0) {
        toast({
          title: "No Answers",
          description: "Please answer at least one question before submitting.",
          variant: "destructive",
        });
        return;
      }

      // Submit using the exact format from documentation
      const submissionData = {
        answers: formattedAnswers
      };

      console.log("Submitting quiz answers:", {
        quizId,
        submissionData,
        totalQuestions: questions.length,
        answersProvided: Object.keys(formattedAnswers).length
      });

      let response;
      try {
        response = await apiService.submitQuizAnswers(quizId, submissionData, questions);
        console.log("Quiz submission successful:", response.data);
      } catch (submitError) {
        console.error("Quiz submission failed:", submitError);
        throw submitError;
      }

      console.log("Quiz submission response:", response.data);

      // Handle response according to API documentation
      // Expected format: { "attempt_id": 25, "score": 85.0, "total_questions": 10, "correct_answers": 8, "results": [...] }
      const results = {
        score: response.data.score || 0,
        correct_answers: response.data.correct_answers || 0,
        total_questions: response.data.total_questions || questions.length,
        time_taken: timeElapsed,
        question_results: response.data.results || []
      };
      
      const attemptId = response.data.attempt_id;

      // Store the attempt ID for future reference (skip if it's a mock response)
      if (attemptId && !response.data._mock_response) {
        setQuizAttemptId(attemptId);
        console.log("Stored quiz attempt ID:", attemptId);
      }

      setQuizResults(results);
      setQuizCompleted(true);
      setShowReview(true);

      // Show appropriate toast message based on whether this is a mock response
      if (response.data._mock_response) {
        toast({
          title: "Quiz Completed!",
          description: `You scored ${results.score}% (Note: Results not saved due to server issue)`,
          variant: "destructive",
        });
        console.warn("Quiz completed with mock response due to server error:", response.data._error);
      } else {
        toast({
          title: "Quiz Completed!",
          description: `You scored ${results.score}%`,
        });
      }
    } catch (error) {
      console.error("Error submitting quiz:", error);
      console.error("Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      let errorMessage = "Failed to submit quiz. Please try again.";
      
      if (error.response?.status === 500) {
        errorMessage = "Server error occurred while submitting quiz. Please check your answers and try again.";
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid quiz data. Please check your answers.";
      } else if (error.response?.status === 401) {
        errorMessage = "You need to be logged in to submit a quiz.";
      } else if (error.response?.status === 404) {
        errorMessage = "Quiz not found. It may have been deleted.";
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const retakeQuiz = () => {
    setQuizStarted(false);
    setQuizCompleted(false);
    setQuizResults(null);
    setAnswers({});
    setCurrentQuestionIndex(0);
    setTimeElapsed(0);
    setShowReview(false);
    setQuizAttemptId(null);
  };

  const loadQuizAttemptForReview = async (attemptId) => {
    try {
      const attemptResults = await fetchQuizAttemptData(attemptId);
      setQuizResults(attemptResults);
      setQuizCompleted(true);
      setShowReview(true);
      setQuizAttemptId(attemptId);
    } catch (error) {
      console.error("Failed to load quiz attempt for review:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz attempt for review.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getOptionTextFromKey = (questionId, optionKey) => {
    const question = questions.find(q => q.id === parseInt(questionId));
    if (question && question.options && question.options[optionKey]) {
      return question.options[optionKey];
    }
    return optionKey; // fallback to showing the key itself
  };

  // Get current question safely
  const currentQuestion = Array.isArray(questions) && questions.length > 0 
    ? questions[currentQuestionIndex] 
    : null;

  const isQuestionCorrect = (question) => {
    if (!quizResults) return null;
    
    // First check if backend provided the result in question_results
    const result = quizResults.question_results?.find(
      (r) => r.question_id === question.id
    );
    
    if (result && typeof result.is_correct === 'boolean') {
      console.log(`Question ${question.id} correctness from backend:`, result.is_correct);
      return result.is_correct;
    }
    
    // If no backend result, determine correctness ourselves
    const userAnswer = answers[question.id];
    if (!userAnswer) {
      console.log(`Question ${question.id}: No user answer found`);
      return false;
    }
    
    // Get the correct option key
    const correctKey = question.correct_option || question.correct_answer;
    
    // Direct comparison - userAnswer should now be the option key
    const isCorrect = userAnswer === correctKey;
    
    console.log(`Question ${question.id} correctness calculation:`, {
      userAnswer,
      correctKey,
      isCorrect
    });
    
    return isCorrect;
  };

  const getCorrectAnswerText = (question) => {
    console.log('=== Getting correct answer for question ===', {
      questionId: question.id,
      correct_option: question.correct_option,
      correct_answer: question.correct_answer,
      options: question.options,
      optionsType: typeof question.options
    });
    
    // Get the correct key (could be from correct_option or correct_answer field)
    const correctKey = question.correct_option || question.correct_answer;
    console.log('Correct key found:', correctKey);
    
    // Check if options is an object and we have a correct option key
    if (question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
      console.log('Options is object, looking for key:', correctKey);
      console.log('Available option keys:', Object.keys(question.options));
      
      if (correctKey && question.options[correctKey]) {
        const answerText = question.options[correctKey];
        console.log('✅ Found correct answer text:', answerText);
        return answerText;
      } else {
        console.log('❌ Correct key not found in options');
        
        // Try to find the correct answer by comparing the key in different case formats
        if (correctKey) {
          const lowerKey = correctKey.toLowerCase();
          const upperKey = correctKey.toUpperCase();
          
          console.log('Trying case variations:', { lowerKey, upperKey });
          
          if (question.options[lowerKey]) {
            console.log('✅ Found with lowercase key:', question.options[lowerKey]);
            return question.options[lowerKey];
          }
          if (question.options[upperKey]) {
            console.log('✅ Found with uppercase key:', question.options[upperKey]);
            return question.options[upperKey];
          }
          
          // Try to find by position if key is a number
          const keyAsNum = parseInt(correctKey);
          if (!isNaN(keyAsNum) && keyAsNum >= 0) {
            const optionKeys = Object.keys(question.options);
            console.log('Trying numeric lookup:', { keyAsNum, optionKeys });
            
            if (optionKeys[keyAsNum]) {
              console.log('✅ Found by numeric index (0-based):', question.options[optionKeys[keyAsNum]]);
              return question.options[optionKeys[keyAsNum]];
            }
            // Try 1-based indexing
            if (optionKeys[keyAsNum - 1]) {
              console.log('✅ Found by numeric index (1-based):', question.options[optionKeys[keyAsNum - 1]]);
              return question.options[optionKeys[keyAsNum - 1]];
            }
          }
        }
      }
    }
    
    // Check if the backend provided the correct answer in the results
    if (quizResults?.question_results) {
      const result = quizResults.question_results.find(r => r.question_id === question.id);
      console.log('Checking quiz results for question:', result);
      
      if (result?.correct_answer) {
        console.log('✅ Found correct answer in results:', result.correct_answer);
        return result.correct_answer;
      }
      
      // If the result has the correct option key, map it to text
      if (result?.correct_option && question.options && question.options[result.correct_option]) {
        console.log('✅ Found correct answer via result correct_option:', question.options[result.correct_option]);
        return question.options[result.correct_option];
      }
    }
    
    // Final fallback - if we have a correct key but couldn't map it, show both
    if (correctKey) {
      console.log('❌ Using fallback display for key:', correctKey);
      return `Option ${correctKey.toUpperCase()}`;
    }
    
    console.log('❌ No correct answer found, returning fallback');
    return 'Not available';
  };

  const getUserAnswerText = (question) => {
    const userAnswer = answers[question.id];
    
    if (!userAnswer) {
      // Check if we have the answer in quiz results
      if (quizResults?.question_results) {
        const result = quizResults.question_results.find(r => r.question_id === question.id);
        if (result?.selected_option) {
          // Map the selected option key back to text
          return getOptionTextFromKey(question.id, result.selected_option);
        }
      }
      return 'No answer selected';
    }
    
    // userAnswer is now just the option key (e.g., "a", "b", "c", "d")
    if (typeof userAnswer === 'string') {
      // For multiple choice questions, get the text for this key
      if (question.options && typeof question.options === 'object') {
        const optionText = question.options[userAnswer];
        if (optionText) {
          return `${userAnswer.toUpperCase()}. ${optionText}`;
        }
      }
      
      // For true/false questions, convert the key to display text
      if (userAnswer === 'true') return 'True';
      if (userAnswer === 'false') return 'False';
      
      // For short answer or other question types, the answer is the text itself
      return userAnswer;
    }
    
    return 'Invalid answer format';
  };

  const getScoreColorClass = (score) => {
    if (score >= 90) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 70) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInMs = now - past;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInDays < 7) {
      return `${Math.floor(diffInDays)}d ago`;
    } else {
      return past.toLocaleDateString();
    }
  };

  const getBestScore = () => {
    if (recentAttempts.length === 0) return null;
    return Math.max(...recentAttempts.map(attempt => attempt.score || 0));
  };

  const getAverageScore = () => {
    if (recentAttempts.length === 0) return null;
    const sum = recentAttempts.reduce((acc, attempt) => acc + (attempt.score || 0), 0);
    return Math.round(sum / recentAttempts.length);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access this quiz.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Quiz not found.</p>
          <Button onClick={() => router.push("/quizzes")} className="mt-4">
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              onClick={() => router.push("/quizzes")}
              variant="ghost"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              No Questions Available
            </h2>
            <p className="text-gray-600 mb-6">
              This quiz doesn't have any questions yet. This might happen if the quiz generation failed or is still in progress.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                onClick={() => router.push("/quizzes")}
                variant="outline"
              >
                Back to Quizzes
              </Button>
              
              {quiz?.topic && (
                <Button 
                  onClick={() => router.push(`/quizzes/create?topic=${quiz.topic.id}&subject=${encodeURIComponent(quiz.topic.subject)}&grade=${quiz.topic.grade}`)}
                >
                  Create Similar Quiz
                </Button>
              )}
              
              <Button 
                onClick={() => router.push('/quizzes/create')}
              >
                Create New Quiz
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-gray-50 border rounded text-xs text-left">
                <strong>Debug Info:</strong><br />
                Quiz ID: {quizId}<br />
                Quiz Data: {JSON.stringify(quiz, null, 2)}<br />
                Questions Response: {JSON.stringify(questions, null, 2)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.push("/quizzes")}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
            
            {quizStarted && !quizCompleted && (
              <div className="flex items-center gap-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTime(timeElapsed)}
                </div>
                <div className="text-sm text-gray-600">
                  {getAnsweredQuestionsCount()}/{questions.length} answered
                </div>
              </div>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {quiz.title || `Quiz on ${quiz.topic?.topic || "Topic"}`}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
              {quiz.topic?.subject}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
              Grade {quiz.topic?.grade}
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
              {quiz.difficulty}
            </span>
            <span className="flex items-center">
              <Target className="h-4 w-4 mr-1" />
              {Array.isArray(questions) ? questions.length : 0} questions
            </span>
          </div>
        </div>

        {/* Quiz Content */}
        {!quizStarted && !quizCompleted ? (
          /* Quiz Start Screen */
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6 text-white">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-white mx-auto mb-4" />
                <h2 className="text-2xl font-semibold mb-2">
                  Ready to start the quiz?
                </h2>
                <p className="text-indigo-100">
                  Test your knowledge and track your progress
                </p>
              </div>
            </div>
            
            <div className="px-8 py-8">
              <div className="max-w-md mx-auto space-y-6">
                {/* Quiz Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-blue-800">
                      {Array.isArray(questions) ? questions.length : 0}
                    </p>
                    <p className="text-blue-600 text-sm">Questions</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-lg font-bold text-green-800">
                      {Math.ceil((Array.isArray(questions) ? questions.length : 0) * 1.5)}
                    </p>
                    <p className="text-green-600 text-sm">Est. Minutes</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-2">Quiz Instructions:</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li>• Read each question carefully</li>
                    <li>• Select the best answer for each question</li>
                    <li>• You can navigate between questions freely</li>
                    <li>• Submit when you're ready to see your results</li>
                  </ul>
                </div>
                
                <Button onClick={startQuiz} size="lg" className="w-full">
                  <Target className="h-5 w-5 mr-2" />
                  Start Quiz
                </Button>
              </div>
            </div>
          </div>
        ) : quizCompleted && quizResults ? (
          /* Quiz Results Screen */
          <div className="space-y-6">
            {/* Main Results Card */}
            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="text-center">
                  <Award className={`h-20 w-20 mx-auto mb-4 ${
                    quizResults.score >= 90 ? 'text-yellow-300' : 
                    quizResults.score >= 70 ? 'text-blue-200' : 'text-gray-300'
                  }`} />
                  <h2 className="text-3xl font-bold mb-2">
                    Quiz Completed!
                  </h2>
                  <p className="text-blue-100">
                    {quizAttemptId ? 'Review your previous attempt' : 'Great job! Here are your results'}
                  </p>
                  {quizAttemptId && (
                    <p className="text-xs text-blue-200 mt-1">
                      Viewing attempt #{quizAttemptId}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="px-8 py-6">
                {/* Score Display */}
                <div className="text-center mb-8">
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full border-8 mb-4 ${
                    quizResults.score >= 90 ? 'border-green-200 bg-green-50' :
                    quizResults.score >= 70 ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }`}>
                    <span className={`text-4xl font-bold ${getScoreColor(quizResults.score)}`}>
                      {quizResults.score}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-xl text-gray-700">
                      You scored {quizResults.correct_answers} out of {Array.isArray(questions) ? questions.length : 0} questions correctly
                    </p>
                    <p className="text-gray-500 flex items-center justify-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Time taken: {formatTime(quizResults.time_taken || timeElapsed)}
                    </p>
                  </div>
                </div>
                
                {/* Performance Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800">{quizResults.correct_answers}</p>
                    <p className="text-green-600 text-sm">Correct</p>
                  </div>
                  
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-800">
                      {(Array.isArray(questions) ? questions.length : 0) - quizResults.correct_answers}
                    </p>
                    <p className="text-red-600 text-sm">Incorrect</p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {Math.round((quizResults.correct_answers / (Array.isArray(questions) ? questions.length : 1)) * 100)}%
                    </p>
                    <p className="text-blue-600 text-sm">Accuracy</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    onClick={() => setShowReview(!showReview)} 
                    variant="outline"
                    size="lg"
                    className="flex-1 sm:flex-none"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {showReview ? "Hide Review" : "Review Answers"}
                  </Button>
                  
                  {recentAttempts.length > 0 && (
                    <Button 
                      onClick={() => setShowHistory(!showHistory)} 
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-none"
                    >
                      <History className="h-5 w-5 mr-2" />
                      {showHistory ? "Hide History" : "Quiz History"}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={retakeQuiz}
                    size="lg"
                    className="flex-1 sm:flex-none"
                  >
                    <RotateCcw className="h-5 w-5 mr-2" />
                    Retake Quiz
                  </Button>
                  
                  {/* Debug info for developers */}
                  {process.env.NODE_ENV === 'development' && quizAttemptId && (
                    <div className="w-full mt-4 p-3 bg-gray-50 border rounded text-xs">
                      <strong>Debug Info:</strong><br />
                      Quiz Attempt ID: {quizAttemptId}<br />
                      Results Source: {quizResults ? 'Available' : 'None'}<br />
                      Question Results: {quizResults?.question_results?.length || 0} items<br />
                      Recent Attempts: {recentAttempts.length}
                    </div>
                  )}
                  
                  {/* Show recent attempts if available */}
                  {recentAttempts.length > 0 && process.env.NODE_ENV === 'development' && (
                    <div className="w-full mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">Recent Attempts:</h4>
                      <div className="space-y-1 text-xs">
                        {recentAttempts.map(attempt => (
                          <div key={attempt.id} className="flex justify-between items-center">
                            <span>Attempt #{attempt.id} - Score: {attempt.score}%</span>
                            <span className="text-blue-600">
                              {new Date(attempt.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quiz History Section */}
            {showHistory && recentAttempts.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <History className="h-5 w-5 mr-2 text-purple-600" />
                        Quiz History
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Track your progress with {recentAttempts.length} attempt{recentAttempts.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      {getBestScore() !== null && (
                        <div className="text-sm">
                          <p className="text-gray-600">Best Score</p>
                          <p className={`text-lg font-bold ${getScoreColor(getBestScore())}`}>
                            {getBestScore()}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {loadingHistory ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading history...</p>
                    </div>
                  ) : (
                    <>
                      {/* Statistics Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-blue-800">{recentAttempts.length}</p>
                          <p className="text-blue-600 text-sm">Total Attempts</p>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                          <Award className="h-8 w-8 text-green-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-green-800">{getBestScore() || 0}%</p>
                          <p className="text-green-600 text-sm">Best Score</p>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                          <Target className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                          <p className="text-2xl font-bold text-yellow-800">{getAverageScore() || 0}%</p>
                          <p className="text-yellow-600 text-sm">Average Score</p>
                        </div>
                      </div>

                      {/* Attempts List */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 mb-3">Recent Attempts</h4>
                        {recentAttempts.map((attempt, index) => (
                          <div 
                            key={attempt.id} 
                            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                  <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center ${getScoreColorClass(attempt.score || 0)}`}>
                                    <span className="font-bold text-sm">
                                      {attempt.score || 0}%
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h5 className="font-medium text-gray-900">
                                      Attempt #{attempt.id}
                                    </h5>
                                    {index === 0 && (
                                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        Latest
                                      </span>
                                    )}
                                    {attempt.score === getBestScore() && (
                                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                        Best
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                    <span className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      {formatRelativeTime(attempt.timestamp)}
                                    </span>
                                    <span className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {formatTime(attempt.time_taken || 0)}
                                    </span>
                                    {attempt.question_attempts && (
                                      <span className="flex items-center">
                                        <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                        {attempt.question_attempts.filter(qa => qa.is_correct).length}/{attempt.question_attempts.length} correct
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadQuizAttemptForReview(attempt.id)}
                                  className="text-xs"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Review
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Review Section */}
            {showReview && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Answer Review & Explanations
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Review your answers and learn from explanations
                  </p>
                </div>
                <div className="p-6">
                  <div className="space-y-8">
                    {questions.map((question, index) => {
                      const isCorrect = isQuestionCorrect(question);
                      const userAnswerText = getUserAnswerText(question);
                      const correctAnswer = getCorrectAnswerText(question);
                      
                      // Debug logging
                      console.log(`Question ${index + 1} review data:`, {
                        questionId: question.id,
                        isCorrect,
                        userAnswerText,
                        correctAnswer,
                        questionData: {
                          correct_option: question.correct_option,
                          correct_answer: question.correct_answer,
                          options: question.options
                        },
                        quizResults: quizResults?.question_results?.find(r => r.question_id === question.id),
                        userAnswerData: answers[question.id]
                      });
                      
                      return (
                        <div key={question.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Question Header */}
                          <div className={`px-6 py-4 ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border-b`}>
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {isCorrect ? (
                                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                  </div>
                                ) : (
                                  <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  </div>
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900 mb-1">
                                    Question {index + 1}
                                  </p>
                                  <p className="text-gray-700 leading-relaxed">
                                    {question.question_text}
                                  </p>
                                </div>
                              </div>
                              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                                isCorrect 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isCorrect ? 'Correct' : 'Incorrect'}
                              </div>
                            </div>
                          </div>
                          
                          {/* Answer Details */}
                          <div className="px-6 py-4 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Your Answer */}
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Your Answer:</p>
                                <div className={`p-3 rounded-lg border-2 ${
                                  isCorrect 
                                    ? 'border-green-200 bg-green-50' 
                                    : 'border-red-200 bg-red-50'
                                }`}>
                                  <p className={`font-medium ${
                                    isCorrect ? 'text-green-800' : 'text-red-800'
                                  }`}>
                                    {userAnswerText}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Correct Answer - Always show for comparison */}
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                                <div className="p-3 rounded-lg border-2 border-green-200 bg-green-50">
                                  <p className="font-medium text-green-800">
                                    {correctAnswer}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Explanation */}
                            {question.explanation && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-gray-700 flex items-center">
                                  <AlertCircle className="h-4 w-4 mr-1 text-blue-600" />
                                  Explanation:
                                </p>
                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                  <p className="text-gray-700 leading-relaxed">
                                    {question.explanation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Quiz Taking Screen */
          <div className="space-y-6">
            {/* Question Navigation */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Question Navigation</h3>
                <span className="text-sm text-gray-600">
                  {currentQuestionIndex + 1} of {Array.isArray(questions) ? questions.length : 0}
                </span>
              </div>
              <div className="grid grid-cols-10 gap-2">
                {Array.isArray(questions) && questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => navigateToQuestion(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? "bg-blue-600 text-white"
                        : answers[questions[index]?.id]
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Question {currentQuestionIndex + 1}
                  </h3>
                  <p className="text-gray-800 leading-relaxed">
                    {currentQuestion.question_text}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Multiple Choice Questions */}
                  {(!currentQuestion.question_type || currentQuestion.question_type === 'multiple_choice') && (
                    currentQuestion.options && typeof currentQuestion.options === 'object' && !Array.isArray(currentQuestion.options) ? (
                      Object.entries(currentQuestion.options).map(([key, option]) => (
                        <label
                          key={key}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                            answers[currentQuestion.id] === key
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={key}
                            checked={answers[currentQuestion.id] === key}
                            onChange={() => handleAnswerSelect(currentQuestion.id, option, key)}
                            className="sr-only"
                          />
                          <div
                            className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                              answers[currentQuestion.id] === key
                                ? "border-blue-500 bg-blue-500"
                                : "border-gray-300"
                            }`}
                          >
                            {answers[currentQuestion.id] === key && (
                              <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                            )}
                          </div>
                          <span className="font-medium text-blue-600 mr-3">
                            {key.toUpperCase()}.
                          </span>
                          <span className="text-gray-800">{option}</span>
                        </label>
                      ))
                    ) : Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                      /* Fallback for array format */
                      currentQuestion.options.map((option, index) => {
                        const optionKey = String.fromCharCode(97 + index); // a, b, c, d
                        return (
                          <label
                            key={index}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                              answers[currentQuestion.id] === optionKey
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${currentQuestion.id}`}
                              value={optionKey}
                              checked={answers[currentQuestion.id] === optionKey}
                              onChange={() => handleAnswerSelect(currentQuestion.id, option, optionKey)}
                              className="sr-only"
                            />
                            <div
                              className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                                answers[currentQuestion.id] === optionKey
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {answers[currentQuestion.id] === optionKey && (
                                <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                              )}
                            </div>
                            <span className="font-medium text-blue-600 mr-3">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <span className="text-gray-800">{option}</span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                        <p className="text-gray-600">No options available for this question.</p>
                      </div>
                    )
                  )}
                  
                  {/* True/False Questions */}
                  {currentQuestion.question_type === 'true_false' && (
                    <div className="space-y-3">
                      <label
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          answers[currentQuestion.id] === 'true'
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value="true"
                          checked={answers[currentQuestion.id] === 'true'}
                          onChange={() => handleAnswerSelect(currentQuestion.id, 'True', 'true')}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                            answers[currentQuestion.id] === 'true'
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[currentQuestion.id] === 'true' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-gray-800 font-medium">True</span>
                      </label>
                      
                      <label
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          answers[currentQuestion.id] === 'false'
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value="false"
                          checked={answers[currentQuestion.id] === 'false'}
                          onChange={() => handleAnswerSelect(currentQuestion.id, 'False', 'false')}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                            answers[currentQuestion.id] === 'false'
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[currentQuestion.id] === 'false' && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <XCircle className="h-5 w-5 text-red-600 mr-3" />
                        <span className="text-gray-800 font-medium">False</span>
                      </label>
                    </div>
                  )}
                  
                  {/* Short Answer Questions */}
                  {currentQuestion.question_type === 'short_answer' && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Your Answer:
                      </label>
                      <textarea
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => handleAnswerSelect(currentQuestion.id, e.target.value, e.target.value)}
                        placeholder="Type your answer here..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      />
                      <p className="text-sm text-gray-500">
                        Provide a clear and concise answer to the question above.
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between items-center mt-8">
                  <Button
                    onClick={previousQuestion}
                    variant="outline"
                    disabled={currentQuestionIndex === 0}
                  >
                    Previous
                  </Button>

                  <div className="flex gap-3">
                    {Array.isArray(questions) && currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={submitQuiz}
                        disabled={submitting || getAnsweredQuestionsCount() === 0}
                        className="px-6"
                      >
                        {submitting ? "Submitting..." : "Submit Quiz"}
                      </Button>
                    ) : (
                      <Button onClick={nextQuestion}>Next</Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
