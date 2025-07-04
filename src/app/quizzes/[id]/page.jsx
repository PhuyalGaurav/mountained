"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

export default function QuizDetails({ params }) {
  const resolvedParams = use(params);
  const { id: quizId } = resolvedParams;
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

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
      
      // Process questions to ensure options is always an array
      const processedQuestions = questionsData.map(question => {
        let options = [];
        
        // Handle different possible formats for options
        if (Array.isArray(question.options)) {
          options = question.options;
        } else if (typeof question.options === 'string') {
          // If options is a JSON string, parse it
          try {
            const parsed = JSON.parse(question.options);
            options = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            // If it's not JSON, treat as comma-separated string
            options = question.options.split(',').map(opt => opt.trim()).filter(opt => opt);
          }
        } else if (question.options && typeof question.options === 'object') {
          // If options is an object, convert to array
          options = Object.values(question.options);
        } else {
          // Fallback: try to get options from other possible fields
          options = question.choices || question.answers || [];
          if (!Array.isArray(options)) {
            options = [];
          }
        }
        
        return {
          ...question,
          options: options
        };
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
    }
  }, [isAuthenticated, fetchQuizData]);

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

  const handleAnswerSelect = (questionId, selectedOption) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: selectedOption,
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
      
      // Format answers for submission
      const formattedAnswers = Object.keys(answers).map((questionId) => ({
        question_id: parseInt(questionId),
        selected_option: answers[questionId],
      }));

      const response = await apiService.submitQuizAnswers(quizId, {
        answers: formattedAnswers,
        time_taken: timeElapsed,
      });

      setQuizResults(response.data);
      setQuizCompleted(true);
      setShowReview(true);

      toast({
        title: "Quiz Completed!",
        description: `You scored ${response.data.score}%`,
      });
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast({
        title: "Error",
        description: "Failed to submit quiz. Please try again.",
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
    const result = quizResults.question_results?.find(
      (r) => r.question_id === question.id
    );
    return result?.is_correct;
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
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <div className="max-w-md mx-auto">
              <AlertCircle className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ready to start the quiz?
              </h2>
              <p className="text-gray-600 mb-6">
                This quiz contains {Array.isArray(questions) ? questions.length : 0} questions. Take your time and
                read each question carefully.
              </p>
              <Button onClick={startQuiz} size="lg" className="px-8">
                Start Quiz
              </Button>
            </div>
          </div>
        ) : quizCompleted && quizResults ? (
          /* Quiz Results Screen */
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Award className={`h-16 w-16 mx-auto mb-4 ${getScoreColor(quizResults.score)}`} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Quiz Completed!
              </h2>
              <p className={`text-3xl font-bold mb-4 ${getScoreColor(quizResults.score)}`}>
                {quizResults.score}%
              </p>
              <p className="text-gray-600 mb-6">
                You answered {quizResults.correct_answers} out of {Array.isArray(questions) ? questions.length : 0} questions correctly
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Time taken: {formatTime(quizResults.time_taken || timeElapsed)}
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => setShowReview(!showReview)} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  {showReview ? "Hide Review" : "Review Answers"}
                </Button>
                <Button onClick={retakeQuiz}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake Quiz
                </Button>
              </div>
            </div>

            {/* Review Section */}
            {showReview && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Review</h3>
                <div className="space-y-6">
                  {questions.map((question, index) => {
                    const isCorrect = isQuestionCorrect(question);
                    return (
                      <div key={question.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-start gap-3">
                          {isCorrect ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600 mt-1 flex-shrink-0" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-2">
                              {index + 1}. {question.question_text}
                            </p>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-600">
                                Your answer: <span className={isCorrect ? "text-green-600" : "text-red-600"}>{answers[question.id]}</span>
                              </p>
                              {!isCorrect && (
                                <p className="text-gray-600">
                                  Correct answer: <span className="text-green-600">{question.correct_answer}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
                  {Array.isArray(currentQuestion.options) && currentQuestion.options.length > 0 ? (
                    currentQuestion.options.map((option, index) => (
                      <label
                        key={index}
                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                          answers[currentQuestion.id] === option
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion.id}`}
                          value={option}
                          checked={answers[currentQuestion.id] === option}
                          onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                          className="sr-only"
                        />
                        <div
                          className={`w-4 h-4 rounded-full border-2 mr-3 flex-shrink-0 ${
                            answers[currentQuestion.id] === option
                              ? "border-blue-500 bg-blue-500"
                              : "border-gray-300"
                          }`}
                        >
                          {answers[currentQuestion.id] === option && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
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
