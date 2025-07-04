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
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { text: selectedOption, key: optionKey },
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
      
      // Validate that all answers have valid question IDs
      const validQuestionIds = new Set(questions.map(q => q.id.toString()));
      const invalidAnswers = Object.keys(answers).filter(qId => !validQuestionIds.has(qId));
      
      if (invalidAnswers.length > 0) {
        console.warn("Found answers for invalid question IDs:", invalidAnswers);
      }
      
      // Format answers for submission - backend expects object mapping question IDs to option keys
      const formattedAnswers = {};
      
      Object.keys(answers).forEach((questionId) => {
        const answerData = answers[questionId];
        console.log(`Processing answer for question ${questionId}:`, answerData);
        
        // Validate the question exists
        const question = questions.find(q => q.id === parseInt(questionId));
        if (!question) {
          console.warn(`Question ${questionId} not found in questions array`);
          return;
        }
        
        let selectedOptionKey;
        
        if (answerData && typeof answerData === 'object' && answerData.key) {
          // New format with key already extracted
          selectedOptionKey = answerData.key;
        } else if (typeof answerData === 'string') {
          // Old format - try to find the key for this text
          if (question && question.options && typeof question.options === 'object' && !Array.isArray(question.options)) {
            // Find the key that maps to this answer text
            const optionKey = Object.entries(question.options).find(([key, value]) => value === answerData)?.[0];
            selectedOptionKey = optionKey || answerData;
          } else if (question?.optionMapping) {
            // Legacy option mapping support
            const optionKey = Object.keys(question.optionMapping).find(
              key => question.optionMapping[key] === answerData
            );
            selectedOptionKey = optionKey || answerData;
          } else {
            selectedOptionKey = answerData;
          }
        } else {
          console.warn(`Invalid answer format for question ${questionId}:`, answerData);
          return;
        }
        
        if (selectedOptionKey && selectedOptionKey.trim() !== '') {
          // Use the format expected by backend: question_id_X: option_key
          formattedAnswers[`question_id_${questionId}`] = selectedOptionKey;
        }
      });

      if (Object.keys(formattedAnswers).length === 0) {
        toast({
          title: "Invalid Answers",
          description: "Please check your answers and try again.",
          variant: "destructive",
        });
        return;
      }

      // Primary submission format - backend expects answers as object mapping question IDs to option keys
      const submissionData = {
        answers: formattedAnswers,
        time_taken: timeElapsed,
      };

      console.log("Submitting quiz answers - DEBUG INFO:");
      console.log("- Quiz ID:", quizId);
      console.log("- Total Questions:", questions.length);
      console.log("- User Answers:", answers);
      console.log("- Formatted Answers:", formattedAnswers);
      console.log("- Total Answers Provided:", Object.keys(formattedAnswers).length);
      console.log("- Time Elapsed:", timeElapsed);
      console.log("- Questions Structure:", questions.map(q => ({
        id: q.id,
        text: q.question_text?.substring(0, 50) + "...",
        options: q.options,
        correct_option: q.correct_option
      })));

      // Try the primary submit_answers endpoint with our formatted data
      let response;
      try {
        console.log("Attempting primary submission with data:", submissionData);
        response = await apiService.submitQuizAnswers(quizId, submissionData);
        console.log("Primary submission successful:", response.data);
      } catch (submitError) {
        console.log("Primary submission failed:");
        console.log("- Status:", submitError.response?.status);
        console.log("- Status Text:", submitError.response?.statusText);
        console.log("- Error Data:", submitError.response?.data);
        console.log("- Request Data:", submissionData);
        console.log("Trying alternative formats...");
        
        // Build fallback formats in case the primary doesn't work
        const questionIdToAnswer = {};
        Object.keys(answers).forEach((questionId) => {
          const answerData = answers[questionId];
          if (answerData?.key) {
            questionIdToAnswer[questionId] = answerData.key;
          }
        });
        
        // Try different data formats as fallbacks
        try {
          // Format 1: Simple question_id: option_key mapping (without question_id_ prefix)
          const altFormat1 = {
            answers: questionIdToAnswer,
            time_taken: timeElapsed
          };
          console.log("Trying format 1 (simple mapping):", altFormat1);
          response = await apiService.submitQuizAnswers(quizId, altFormat1);
          console.log("Format 1 successful:", response.data);
        } catch (e1) {
          console.log("Format 1 failed:");
          console.log("- Status:", e1.response?.status);
          console.log("- Error Data:", e1.response?.data);
          
          try {
            // Format 2: Array format with objects
            const altFormat2 = {
              answers: Object.keys(questionIdToAnswer).map(qId => ({
                question_id: parseInt(qId),
                selected_option: questionIdToAnswer[qId]
              })),
              time_taken: timeElapsed
            };
            console.log("Trying format 2 (array):", altFormat2);
            response = await apiService.submitQuizAnswers(quizId, altFormat2);
            console.log("Format 2 successful:", response.data);
          } catch (e2) {
            console.log("Format 2 failed:");
            console.log("- Status:", e2.response?.status);
            console.log("- Error Data:", e2.response?.data);
            
            try {
              // Format 3: Just answers without time_taken
              const altFormat3 = {
                answers: formattedAnswers
              };
              console.log("Trying format 3 (no time):", altFormat3);
              response = await apiService.submitQuizAnswers(quizId, altFormat3);
              console.log("Format 3 successful:", response.data);
            } catch (e3) {
              console.log("Format 3 failed:");
              console.log("- Status:", e3.response?.status);
              console.log("- Error Data:", e3.response?.data);
              
              try {
                // Format 4: Quiz attempt approach
                const quizAttemptData = {
                  quiz: parseInt(quizId),
                  score: 0, // Will be calculated by backend
                  question_attempts: Object.keys(questionIdToAnswer).map(qId => ({
                    question: parseInt(qId),
                    selected_option: questionIdToAnswer[qId],
                    is_correct: false // Will be calculated by backend
                  }))
                };
                console.log("Trying quiz attempt format:", quizAttemptData);
                response = await apiService.createQuizAttempt(quizAttemptData);
                console.log("Quiz attempt successful:", response.data);
              } catch (e4) {
                console.log("Quiz attempt failed:");
                console.log("- Status:", e4.response?.status);
                console.log("- Error Data:", e4.response?.data);
                
                // Format 5: Try with just the answer values (strings)
                try {
                  const altFormat5 = {};
                  Object.keys(answers).forEach((questionId) => {
                    const answerData = answers[questionId];
                    if (answerData?.text) {
                      altFormat5[questionId] = answerData.text;
                    }
                  });
                  console.log("Trying format 5 (answer text):", { answers: altFormat5 });
                  response = await apiService.submitQuizAnswers(quizId, { answers: altFormat5 });
                  console.log("Format 5 successful:", response.data);
                } catch (e5) {
                  console.log("Format 5 failed:");
                  console.log("- Status:", e5.response?.status);
                  console.log("- Error Data:", e5.response?.data);
                  
                  // All formats failed, re-throw the original error
                  console.log("All submission formats failed, throwing original error");
                  throw submitError;
                }
              }
            }
          }
        }
      }

      console.log("Quiz submission response:", response.data);

      // Handle different response formats and extract attempt ID
      let results;
      let attemptId;
      
      if (response.data.score !== undefined) {
        // Direct quiz results
        results = response.data;
        attemptId = response.data.attempt_id || response.data.id;
      } else if (response.data.results) {
        // Results nested in response
        results = response.data.results;
        attemptId = response.data.attempt_id || response.data.id;
      } else if (response.data.question_attempts) {
        // Quiz attempt format - convert to expected format
        const correct = response.data.question_attempts.filter(qa => qa.is_correct).length;
        const total = response.data.question_attempts.length;
        results = {
          score: Math.round((correct / total) * 100),
          correct_answers: correct,
          total_questions: total,
          time_taken: timeElapsed,
          question_results: response.data.question_attempts.map(qa => ({
            question_id: qa.question,
            is_correct: qa.is_correct,
            selected_option: qa.selected_option
          }))
        };
        attemptId = response.data.id;
      } else {
        // Fallback - calculate results ourselves
        console.log("No structured response, calculating results from user answers");
        
        // Build answer data for calculation
        const answerData = Object.keys(answers).map(questionId => ({
          question_id: parseInt(questionId),
          selected_option: answers[questionId]?.key || answers[questionId]
        }));
        
        const calculatedResults = answerData.map(answer => {
          const question = questions.find(q => q.id === answer.question_id);
          const correctKey = question?.correct_option || question?.correct_answer;
          const isCorrect = answer.selected_option === correctKey;
          
          console.log('Calculating result for question:', {
            questionId: answer.question_id,
            selectedOption: answer.selected_option,
            correctKey,
            isCorrect
          });
          
          return {
            question_id: answer.question_id,
            is_correct: isCorrect,
            selected_option: answer.selected_option,
            correct_option: correctKey
          };
        });
        
        const correctCount = calculatedResults.filter(r => r.is_correct).length;
        
        results = {
          score: Math.round((correctCount / questions.length) * 100),
          correct_answers: correctCount,
          total_questions: questions.length,
          time_taken: timeElapsed,
          question_results: calculatedResults
        };
        attemptId = response.data.attempt_id || response.data.id;
      }

      // Store the attempt ID for future reference
      if (attemptId) {
        setQuizAttemptId(attemptId);
        console.log("Stored quiz attempt ID:", attemptId);
      }

      setQuizResults(results);
      setQuizCompleted(true);
      setShowReview(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${results.score}%`,
      });
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
    setTimeElapsed(0);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowReview(false);
    setQuizAttemptId(null);
  };

  const loadQuizAttemptForReview = async (attemptId) => {
    try {
      console.log("Loading quiz attempt for review:", attemptId);
      const attemptResults = await fetchQuizAttemptData(attemptId);
      
      // Reconstruct user answers from the attempt data
      const reconstructedAnswers = {};
      if (attemptResults.question_results) {
        attemptResults.question_results.forEach(result => {
          reconstructedAnswers[result.question_id] = {
            key: result.selected_option,
            text: getOptionTextFromKey(result.question_id, result.selected_option)
          };
        });
      }
      
      setAnswers(reconstructedAnswers);
      setQuizResults(attemptResults);
      setQuizCompleted(true);
      setShowReview(true);
      setQuizAttemptId(attemptId);
      
      console.log("Loaded quiz attempt data:", {
        results: attemptResults,
        answers: reconstructedAnswers
      });
    } catch (error) {
      console.error("Error loading quiz attempt for review:", error);
      toast({
        title: "Error",
        description: "Failed to load quiz attempt details.",
        variant: "destructive",
      });
    }
  };

  const getOptionTextFromKey = (questionId, optionKey) => {
    const question = questions.find(q => q.id === questionId);
    if (question?.options && typeof question.options === 'object' && question.options[optionKey]) {
      return question.options[optionKey];
    }
    return optionKey; // Fallback to just showing the key
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getAnsweredQuestionsCount = () => {
    return Object.keys(answers).length;
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
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
    const userAnswerData = answers[question.id];
    if (!userAnswerData) {
      console.log(`Question ${question.id}: No user answer found`);
      return false;
    }
    
    // Get the selected option key
    let selectedKey;
    if (typeof userAnswerData === 'object' && userAnswerData.key) {
      selectedKey = userAnswerData.key;
    } else if (typeof userAnswerData === 'string') {
      // Try to find the key for this text
      if (question.options && typeof question.options === 'object') {
        selectedKey = Object.entries(question.options).find(([key, value]) => value === userAnswerData)?.[0];
      }
    }
    
    // Compare with correct option
    const correctKey = question.correct_option || question.correct_answer;
    const isCorrect = selectedKey === correctKey;
    
    console.log(`Question ${question.id} correctness calculation:`, {
      selectedKey,
      correctKey,
      isCorrect,
      userAnswerData
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
    const userAnswerData = answers[question.id];
    
    if (!userAnswerData) {
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
    
    if (typeof userAnswerData === 'object' && userAnswerData.text) {
      return userAnswerData.text;
    } else if (typeof userAnswerData === 'string') {
      return userAnswerData;
    } else if (typeof userAnswerData === 'object' && userAnswerData.key) {
      // We have just the key, need to get the text
      return getOptionTextFromKey(question.id, userAnswerData.key);
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
              This quiz doesn't have any questions yet. Please try again later or contact support.
            </p>
            <Button onClick={() => router.push("/quizzes")}>
              Back to Quizzes
            </Button>
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
                  {currentQuestion.options && typeof currentQuestion.options === 'object' && !Array.isArray(currentQuestion.options) ? (
                    Object.entries(currentQuestion.options).map(([key, option]) => (
                      <label
                        key={key}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          answers[currentQuestion.id]?.key === key
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={key}
                          checked={answers[currentQuestion.id]?.key === key}
                          onChange={() => setAnswers(prev => ({
                            ...prev,
                            [currentQuestion.id]: { text: option, key: key }
                          }))}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                            answers[currentQuestion.id]?.key === key
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[currentQuestion.id]?.key === key && (
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
                    currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          answers[currentQuestion.id]?.text === option
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id]?.text === option}
                          onChange={() => setAnswers(prev => ({
                            ...prev,
                            [currentQuestion.id]: { text: option, key: String.fromCharCode(97 + index) } // a, b, c, d
                          }))}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                            answers[currentQuestion.id]?.text === option
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[currentQuestion.id]?.text === option && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                        <span className="font-medium text-blue-600 mr-3">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="text-gray-800">{option}</span>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <p className="text-gray-600">No options available for this question.</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Question data: {JSON.stringify(currentQuestion.options)}
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
