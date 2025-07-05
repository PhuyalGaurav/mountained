"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuizTimer, QuestionCard } from "@/components/ui/quiz-progress";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
  Play,
  Pause,
  Save,
  Download,
  Share,
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
  const [exporting, setExporting] = useState(false);

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

  // Debug effect to monitor quiz results changes
  useEffect(() => {
    if (quizResults) {
      console.log("🔍 Quiz results state changed:", {
        score: quizResults.score,
        correct_answers: quizResults.correct_answers,
        total_questions: quizResults.total_questions,
        timestamp: new Date().toISOString()
      });
      
      // Warning if score is 0 but we have correct answers
      if (quizResults.score === 0 && quizResults.correct_answers > 0) {
        console.warn("⚠️ DETECTED SCORE CALCULATION ISSUE: Score is 0 but correct_answers > 0", quizResults);
      }
    }
  }, [quizResults]);

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
      
      // Debug the raw response
      console.log("🔍 Raw API Response Debug:");
      console.log("- Score from API:", response.data.score);
      console.log("- Correct answers from API:", response.data.correct_answers);
      console.log("- Total questions from API:", response.data.total_questions);
      console.log("- Results array:", response.data.results);
      
      // Client-side score verification/calculation
      let verifiedCorrectCount = 0;
      let questionResults = response.data.results || [];
      
      // If we have individual question results, count the correct ones
      if (questionResults.length > 0) {
        verifiedCorrectCount = questionResults.filter(result => result.is_correct === true).length;
        console.log("🧮 Client-side verification:");
        console.log("- Questions with results:", questionResults.length);
        console.log("- Client-calculated correct count:", verifiedCorrectCount);
        
        // Log each question result for debugging
        questionResults.forEach((result, index) => {
          console.log(`Question ${index + 1} (ID: ${result.question_id}): ${result.is_correct ? '✅ Correct' : '❌ Incorrect'}`);
        });
      }
      
      // Use client verification if available, otherwise fall back to API data
      const finalCorrectCount = questionResults.length > 0 ? verifiedCorrectCount : (response.data.correct_answers || 0);
      const finalTotalQuestions = response.data.total_questions || questions.length;
      const clientCalculatedScore = finalTotalQuestions > 0 ? (finalCorrectCount / finalTotalQuestions) * 100 : 0;
      
      // Use client-calculated score if it differs significantly from API score
      const apiScore = response.data.score || 0;
      const scoreDifference = Math.abs(clientCalculatedScore - apiScore);
      const useClientScore = scoreDifference > 1; // Use client score if difference > 1%
      
      const finalScore = useClientScore ? clientCalculatedScore : apiScore;
      
      console.log("📊 Final Score Calculation:");
      console.log("- API Score:", apiScore);
      console.log("- Client Calculated Score:", clientCalculatedScore);
      console.log("- Score Difference:", scoreDifference);
      console.log("- Using Client Score:", useClientScore);
      console.log("- Final Score Used:", finalScore);
      
      // Ensure the score is a valid number (never NaN or undefined)
      const safeScore = isNaN(finalScore) ? 0 : Math.max(0, Math.min(100, finalScore));
      
      // Additional validation: if score is 0 but we have correct answers, recalculate
      if (safeScore === 0 && finalCorrectCount > 0 && finalTotalQuestions > 0) {
        const recalculatedScore = (finalCorrectCount / finalTotalQuestions) * 100;
        console.warn("🔧 Score was 0 but we have correct answers, recalculating:", {
          correctCount: finalCorrectCount,
          totalQuestions: finalTotalQuestions,
          recalculatedScore: recalculatedScore
        });
        const finalRecalculatedScore = Math.max(0, Math.min(100, recalculatedScore));
        
        const results = {
          score: finalRecalculatedScore,
          correct_answers: finalCorrectCount,
          total_questions: finalTotalQuestions,
          time_taken: timeElapsed,
          question_results: questionResults
        };
        
        console.log("🔒 Setting recalculated quiz results immediately:", results);
        
        // Set all quiz completion states atomically to prevent race conditions
        setQuizResults(results);
        setQuizCompleted(true);
        setShowReview(true);
        
        // Show toast with corrected score warning
        toast({
          title: "Quiz Completed!",
          description: `You scored ${results.score.toFixed(1)}% (Score was corrected due to calculation error)`,
          variant: "default",
        });
        
        console.warn("Used recalculated score due to zero score with correct answers");
        return; // Exit early with corrected results
      }
      
      const results = {
        score: safeScore,
        correct_answers: finalCorrectCount,
        total_questions: finalTotalQuestions,
        time_taken: timeElapsed,
        question_results: questionResults
      };
      
      console.log("🔒 Setting quiz results immediately:", results);
      
      const attemptId = response.data.attempt_id;

      // Store the attempt ID for future reference (skip if it's a mock response)
      if (attemptId && !response.data._mock_response) {
        setQuizAttemptId(attemptId);
        console.log("Stored quiz attempt ID:", attemptId);
      }

      // Set all quiz completion states atomically to prevent race conditions
      setQuizResults(results);
      setQuizCompleted(true);
      setShowReview(true);

      // Add a small delay to ensure the UI updates properly
      setTimeout(() => {
        console.log("🔄 Post-submission verification - current results:", results);
        
        // Double-check that the displayed results are correct
        if (results.score === 0 && results.correct_answers > 0) {
          console.warn("🚨 DETECTED POST-SUBMISSION SCORE ISSUE - attempting correction");
          const correctedScore = (results.correct_answers / results.total_questions) * 100;
          const correctedResults = { ...results, score: correctedScore };
          
          setQuizResults(correctedResults);
          
          toast({
            title: "Score Corrected",
            description: `Your actual score is ${correctedScore.toFixed(1)}%`,
            variant: "default",
          });
        }
      }, 100); // Small delay to ensure React has updated the DOM

      // Show appropriate toast message based on whether this is a mock response
      if (response.data._mock_response) {
        toast({
          title: "Quiz Completed!",
          description: `You scored ${results.score.toFixed(1)}% (Note: Results not saved due to server issue)`,
          variant: "destructive",
        });
        console.warn("Quiz completed with mock response due to server error:", response.data._error);
      } else {
        // Show warning if we had to use client-side calculation due to score discrepancy
        if (useClientScore && scoreDifference > 10) {
          toast({
            title: "Quiz Completed!",
            description: `You scored ${results.score.toFixed(1)}% (Score was corrected due to server calculation error)`,
            variant: "default",
          });
          console.warn("Used client-side score calculation due to server discrepancy:", {
            serverScore: apiScore,
            clientScore: clientCalculatedScore,
            difference: scoreDifference
          });
        } else {
          toast({
            title: "Quiz Completed!",
            description: `You scored ${results.score.toFixed(1)}%`,
          });
        }
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

  const exportQuiz = async () => {
    try {
      setExporting(true);
      
      if (!quiz || !quiz.id || !questions || questions.length === 0) {
        toast({
          title: "Export Error",
          description: "Cannot export quiz - no quiz data available.",
          variant: "destructive",
        });
        return null;
      }

      // Create the quiz data to export
      const quizData = {
        id: quiz.id,
        title: quiz.title || `Quiz on ${quiz.topic?.topic || "Unknown Topic"}`,
        description: `Quiz covering ${quiz.topic?.topic || "various topics"} for Grade ${quiz.topic?.grade || "N/A"}`,
        difficulty: quiz.difficulty || "medium",
        subject: quiz.topic?.subject || "General",
        grade: quiz.topic?.grade || null,
        time_limit: quiz.time_limit || 30,
        total_questions: questions.length,
        questions: questions.map(question => ({
          id: question.id,
          question_text: question.question_text,
          question_type: question.question_type || "multiple_choice",
          options: question.options,
          correct_option: question.correct_option || question.correct_answer,
          explanation: question.explanation || null,
          difficulty: question.difficulty || quiz.difficulty || "medium"
        })),
        metadata: {
          original_quiz_id: quiz.id,
          export_date: new Date().toISOString(),
          exported_by: "user",
          estimated_time: Math.ceil(questions.length * 1.5)
        }
      };

      // Create a JSON file
      const quizBlob = new Blob([JSON.stringify(quizData, null, 2)], {
        type: 'application/json'
      });

      // Create FormData for file upload
      const formData = new FormData();
      const fileName = `quiz-${quiz.id}-export-${new Date().toISOString().split('T')[0]}.json`;
      formData.append('file', quizBlob, fileName);
      formData.append('quiz', quiz.id.toString());

      console.log("Exporting quiz with file:", fileName);
      console.log("Quiz data:", quizData);

      const response = await apiService.createExportedQuiz(formData);
      
      console.log("Quiz export successful:", response.data);
      
      toast({
        title: "Quiz Exported Successfully!",
        description: `Quiz "${quizData.title}" has been exported and saved. Export ID: ${response.data.id}`,
        variant: "default",
      });

      return response.data.id; // Return the exported quiz ID for potential sharing
      
    } catch (error) {
      console.error("Error exporting quiz:", error);
      console.error("Export error details:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        config: error.config
      });
      
      let errorMessage = "Failed to export quiz. Please try again.";
      
      if (error.response?.status === 400) {
        const errorData = error.response?.data;
        if (errorData && typeof errorData === 'object') {
          errorMessage = `Invalid data: ${JSON.stringify(errorData)}`;
        } else {
          errorMessage = "Invalid quiz data for export. Please check the quiz content.";
        }
      } else if (error.response?.status === 401) {
        errorMessage = "You need to be logged in to export quizzes.";
      } else if (error.response?.status === 403) {
        errorMessage = "You don't have permission to export this quiz.";
      } else if (error.response?.status === 404) {
        errorMessage = "Quiz not found or export endpoint unavailable.";
      } else if (error.response?.status === 500) {
        errorMessage = "Server error occurred while exporting quiz.";
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      toast({
        title: "Export Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error; // Re-throw for handling in share function
    } finally {
      setExporting(false);
    }
  };

  const shareQuiz = async () => {
    try {
      // First export the quiz if not already exported
      const exportedQuizId = await exportQuiz();
      
      if (exportedQuizId) {
        // Create a shareable URL (adjust the domain as needed)
        const shareableUrl = `${window.location.origin}/exported-quizzes/${exportedQuizId}`;
        
        // Copy to clipboard if available
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareableUrl);
          toast({
            title: "Quiz Shared!",
            description: "Shareable link copied to clipboard.",
            variant: "default",
          });
        } else {
          // Fallback for browsers without clipboard API
          toast({
            title: "Quiz Exported!",
            description: `Quiz exported with ID: ${exportedQuizId}`,
            variant: "default",
          });
        }
      }
    } catch (error) {
      console.error("Error sharing quiz:", error);
      // Error already handled in exportQuiz function
    }
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
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button 
                onClick={() => router.push("/quizzes")}
                variant="outline"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Quizzes
              </Button>
              
              {quiz?.topic && (
                <Button 
                  onClick={() => router.push(`/quizzes/create?topic=${quiz.topic.id}&subject=${encodeURIComponent(quiz.topic.subject)}&grade=${quiz.topic.grade}`)}
                  variant="outline"
                  className="flex-1 sm:flex-none min-w-[150px]"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Create Similar Quiz
                </Button>
              )}
              
              <Button 
                onClick={() => router.push('/quizzes/create')}
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <Target className="h-4 w-4 mr-2" />
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
              className="hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
            
            <div className="flex items-center gap-2">
              {/* Export and Share buttons in header */}
              {!quizStarted && !quizCompleted && (
                <>
                  <Button
                    onClick={exportQuiz}
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="hover:shadow-sm"
                    title="Export quiz for offline use or sharing"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={shareQuiz}
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="hover:shadow-sm"
                    title="Share quiz with others"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </>
              )}
              
              {quizStarted && !quizCompleted && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center text-sm text-gray-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200">
                    <Clock className="h-4 w-4 mr-1 text-blue-600" />
                    <span className="font-medium">{formatTime(timeElapsed)}</span>
                  </div>
                  <div className="text-sm text-gray-700 bg-green-50 px-3 py-1 rounded-md border border-green-200">
                    <span className="font-medium">{getAnsweredQuestionsCount()}/{questions.length}</span>
                    <span className="text-green-600 ml-1">answered</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {quiz.title || `Quiz on ${quiz.topic?.topic || "Topic"}`}
          </h1>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium border border-blue-200">
              {quiz.topic?.subject}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium border border-green-200">
              Grade {quiz.topic?.grade}
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-medium border border-purple-200">
              {quiz.difficulty}
            </span>
            <span className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium border border-gray-200">
              <Target className="h-4 w-4 mr-1" />
              {Array.isArray(questions) ? questions.length : 0} questions
            </span>
          </div>
        </div>

        {/* Quiz Content */}
        {!quizStarted && !quizCompleted ? (
          /* Quiz Start Screen */
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-6 text-white">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-white mx-auto mb-3" />
                <h2 className="text-2xl font-bold mb-2">
                  Ready to start the quiz?
                </h2>
                <p className="text-indigo-100">
                  Test your knowledge and track your progress
                </p>
              </div>
            </div>
            
            <div className="px-6 py-6">
              <div className="max-w-md mx-auto space-y-6">
                {/* Quiz Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                    <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-blue-800">
                      {Array.isArray(questions) ? questions.length : 0}
                    </p>
                    <p className="text-blue-600 text-sm font-medium">Questions</p>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5">
                    <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xl font-bold text-green-800">
                      {Math.ceil((Array.isArray(questions) ? questions.length : 0) * 1.5)}
                    </p>
                    <p className="text-green-600 text-sm font-medium">Est. Minutes</p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-yellow-800 mb-3">Quiz Instructions:</h3>
                  <ul className="text-yellow-700 text-sm space-y-1">
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                      Read each question carefully
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                      Select the best answer for each question
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                      You can navigate between questions freely
                    </li>
                    <li className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-2 flex-shrink-0"></div>
                      Submit when you're ready to see your results
                    </li>
                  </ul>
                </div>
                
                <Button 
                  onClick={startQuiz} 
                  size="lg" 
                  className="w-full"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Start Quiz
                </Button>
                
                {/* Export/Share options */}
                <div className="flex gap-2">
                  <Button 
                    onClick={exportQuiz}
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="flex-1"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={shareQuiz}
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="flex-1"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : quizCompleted && quizResults ? (
          /* Quiz Results Screen */
          <div className="space-y-6">
            {/* Results Summary */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                <CardTitle className="flex items-center text-xl">
                  <Award className="h-6 w-6 mr-2 text-green-600" />
                  Quiz Complete!
                </CardTitle>
                <CardDescription className="text-base">
                  Here are your results for this quiz attempt
                </CardDescription>
              </CardHeader>
              
              <CardContent className="p-8">
                {/* Score Display - with loading protection */}
                <div className="text-center mb-8">
                  {submitting ? (
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gray-200 text-gray-500 text-xl font-bold mb-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                    </div>
                  ) : (
                    <div className={`
                      inline-flex items-center justify-center w-32 h-32 rounded-full text-4xl font-bold text-white mb-4
                      ${(quizResults.score || 0) >= 90 ? 'bg-green-500' : 
                        (quizResults.score || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
                    `}>
                      {Math.round(quizResults.score || 0)}%
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {submitting ? 'Calculating Results...' :
                     (quizResults.score || 0) >= 90 ? 'Excellent!' : 
                     (quizResults.score || 0) >= 70 ? 'Well Done!' : 'Keep Practicing!'}
                  </h2>
                  <p className="text-gray-600">
                    {submitting ? 'Please wait while we process your answers' :
                     `You scored ${(quizResults.score || 0).toFixed(1)}% on this quiz`}
                  </p>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {quizResults.correct_answers}
                    </p>
                    <p className="text-blue-600 text-sm">Correct Answers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Target className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {quizResults.total_questions}
                    </p>
                    <p className="text-gray-600 text-sm">Total Questions</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-800">
                      {formatTime(quizResults.time_taken || timeElapsed)}
                    </p>
                    <p className="text-purple-600 text-sm">Time Taken</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">
                      {Math.round(((quizResults.correct_answers || 0) / (quizResults.total_questions || 1)) * 100)}%
                    </p>
                    <p className="text-blue-600 text-sm">Accuracy</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button 
                    onClick={() => setShowReview(!showReview)} 
                    variant="outline"
                    className="flex-1 sm:flex-none min-w-[140px]"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showReview ? "Hide Review" : "Review Answers"}
                  </Button>
                  
                  <Button 
                    onClick={exportQuiz}
                    variant="outline"
                    disabled={exporting}
                    className="flex-1 sm:flex-none min-w-[140px]"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Quiz
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    onClick={shareQuiz}
                    variant="outline"
                    disabled={exporting}
                    className="flex-1 sm:flex-none min-w-[140px]"
                  >
                    {exporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
                        Sharing...
                      </>
                    ) : (
                      <>
                        <Share className="h-4 w-4 mr-2" />
                        Share Quiz
                      </>
                    )}
                  </Button>
                  
                  {recentAttempts.length > 0 && (
                    <Button 
                      onClick={() => setShowHistory(!showHistory)} 
                      variant="outline"
                      className="flex-1 sm:flex-none min-w-[140px]"
                    >
                      <History className="h-4 w-4 mr-2" />
                      {showHistory ? "Hide History" : "Quiz History"}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={retakeQuiz}
                    className="flex-1 sm:flex-none min-w-[140px]"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Retake Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Review Section */}
            {showReview && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="flex items-center text-lg">
                    <Eye className="h-5 w-5 mr-2 text-blue-600" />
                    Answer Review & Explanations
                  </CardTitle>
                  <CardDescription>
                    Review your answers and learn from detailed explanations
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {questions.map((question, index) => {
                      const isCorrect = isQuestionCorrect(question);
                      const userAnswer = answers[question.id];
                      const correctKey = question.correct_option || question.correct_answer;
                      
                      return (
                        <QuestionCard
                          key={question.id}
                          question={{
                            ...question,
                            question: question.question_text
                          }}
                          questionIndex={index}
                          totalQuestions={questions.length}
                          userAnswer={userAnswer}
                          onAnswerChange={() => {}} // Read-only in review mode
                          showReview={true}
                          correctAnswer={correctKey}
                          isCorrect={isCorrect}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Enhanced Quiz History Section */}
            {showHistory && recentAttempts.length > 0 && (
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-lg">
                        <History className="h-5 w-5 mr-2 text-purple-600" />
                        Quiz History
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Track your progress with {recentAttempts.length} attempt{recentAttempts.length !== 1 ? 's' : ''}
                      </CardDescription>
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
                </CardHeader>
                
                <CardContent className="p-0">
                  {/* Performance Summary */}
                  <div className="p-6 bg-gray-50 border-b">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {recentAttempts.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(getBestScore() || 0)}`}>
                          {getBestScore() || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Best Score</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getScoreColor(getAverageScore() || 0)}`}>
                          {getAverageScore() || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Average Score</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const improvementCount = recentAttempts.reduce((count, attempt, index) => {
                              if (index === 0) return count;
                              const previousScore = recentAttempts[index - 1]?.score || 0;
                              return attempt.score > previousScore ? count + 1 : count;
                            }, 0);
                            return improvementCount;
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">Improvements</div>
                      </div>
                    </div>
                  </div>

                  {/* Attempt History */}
                  <div className="divide-y divide-gray-200">
                    {recentAttempts.map((attempt, index) => {
                      const isLatest = index === 0;
                      const isBest = attempt.score === getBestScore();
                      const previousScore = index < recentAttempts.length - 1 ? recentAttempts[index + 1]?.score : null;
                      const improvement = previousScore ? attempt.score - previousScore : 0;
                      
                      return (
                        <div
                          key={attempt.id}
                          className={`p-6 hover:bg-gray-50 transition-colors ${
                            isLatest ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                              {/* Score Circle */}
                              <div className={`
                                w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg
                                ${attempt.score >= 90 ? 'bg-green-500' : 
                                  attempt.score >= 70 ? 'bg-yellow-500' : 'bg-red-500'}
                              `}>
                                {Math.round(attempt.score || 0)}%
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h5 className="font-medium text-gray-900">
                                    Attempt #{attempt.id}
                                  </h5>
                                  {isLatest && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                      Latest
                                    </span>
                                  )}
                                  {isBest && (
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                      Best
                                    </span>
                                  )}
                                  {improvement > 0 && (
                                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1 rounded-full flex items-center">
                                      <TrendingUp className="h-3 w-3 mr-1" />
                                      +{improvement.toFixed(1)}%
                                    </span>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Enhanced Quiz Taking Screen */
          <div className="space-y-0">
            {/* Timer (if quiz has time limit) */}
            {quiz.time_limit && (
              <div className="bg-white border-b border-gray-200 px-6 py-3">
                <QuizTimer
                  timeElapsed={timeElapsed}
                  timeLimit={quiz.time_limit * 60} // Convert minutes to seconds
                  onTimeUp={submitQuiz}
                />
              </div>
            )}

            {/* Main Quiz Content */}
            <div className="min-h-screen bg-gray-50 px-6 py-8">
              <div className="max-w-4xl mx-auto">
                {/* Question Card */}
                {currentQuestion && (
                  <QuestionCard
                    question={{
                      ...currentQuestion,
                      question: currentQuestion.question_text
                    }}
                    questionIndex={currentQuestionIndex}
                    totalQuestions={questions.length}
                    userAnswer={answers[currentQuestion.id]}
                    onAnswerChange={(optionKey) => handleAnswerSelect(currentQuestion.id, optionKey, optionKey)}
                    showReview={false}
                  />
                )}

                {/* Enhanced Navigation */}
                <Card className="mt-6">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      {/* Left: Previous Button */}
                      <Button
                        onClick={previousQuestion}
                        variant="outline"
                        disabled={currentQuestionIndex === 0}
                        className="w-full sm:w-auto min-w-[120px] disabled:opacity-30"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Previous
                      </Button>

                      {/* Center: Progress and Actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="text-center">
                          <div className="text-base font-semibold text-gray-800">
                            {getAnsweredQuestionsCount()} of {questions.length} answered
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {timeElapsed > 0 && `Time: ${formatTime(timeElapsed)}`}
                          </div>
                        </div>

                        {/* Save Progress Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                          onClick={() => {
                            // Save current progress (could be implemented later)
                            toast({
                              title: "Progress Saved",
                              description: "Your answers have been saved locally.",
                            });
                          }}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>

                      {/* Right: Next/Submit Button */}
                      <div className="w-full sm:w-auto">
                        {currentQuestionIndex === questions.length - 1 ? (
                          <Button
                            onClick={submitQuiz}
                            disabled={submitting || getAnsweredQuestionsCount() === 0}
                            className="w-full sm:w-auto min-w-[120px] disabled:opacity-50"
                          >
                            {submitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Submit Quiz
                              </>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={nextQuestion}
                            className="w-full sm:w-auto min-w-[120px]"
                          >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="bg-blue-50 rounded-md p-3 border border-blue-200">
                          <div className="text-lg font-bold text-blue-600">
                            {currentQuestionIndex + 1}
                          </div>
                          <div className="text-xs text-blue-500 font-medium">Current</div>
                        </div>
                        <div className="bg-green-50 rounded-md p-3 border border-green-200">
                          <div className="text-lg font-bold text-green-600">
                            {getAnsweredQuestionsCount()}
                          </div>
                          <div className="text-xs text-green-500 font-medium">Answered</div>
                        </div>
                        <div className="bg-yellow-50 rounded-md p-3 border border-yellow-200">
                          <div className="text-lg font-bold text-yellow-600">
                            {questions.length - getAnsweredQuestionsCount()}
                          </div>
                          <div className="text-xs text-yellow-500 font-medium">Remaining</div>
                        </div>
                        <div className="bg-purple-50 rounded-md p-3 border border-purple-200">
                          <div className="text-lg font-bold text-purple-600">
                            {Math.round((getAnsweredQuestionsCount() / questions.length) * 100)}%
                          </div>
                          <div className="text-xs text-purple-500 font-medium">Complete</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Question Overview Panel (Optional - can be toggled) */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Question Overview
                    </CardTitle>
                    <CardDescription>
                      Click on any question to navigate directly to it
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                      {questions.map((question, index) => {
                        const isAnswered = answers[question.id] !== undefined;
                        const isCurrent = index === currentQuestionIndex;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => navigateToQuestion(index)}
                            className={`
                              aspect-square rounded-md text-sm font-medium transition-all duration-200
                              flex items-center justify-center relative border
                              hover:scale-105 active:scale-95
                              ${isCurrent 
                                ? 'bg-blue-600 text-white border-blue-400 shadow-md ring-1 ring-blue-300' 
                                : isAnswered 
                                  ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:shadow-sm' 
                                  : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:shadow-sm'
                              }
                            `}
                            title={`Question ${index + 1}${isAnswered ? ' (answered)' : ''}`}
                          >
                            {index + 1}
                            {isAnswered && !isCurrent && (
                              <CheckCircle className="absolute -top-1 -right-1 h-3 w-3 text-green-600 bg-white rounded-full border border-green-200" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
