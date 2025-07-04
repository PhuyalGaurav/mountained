"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  FileQuestion,
  Plus,
  Search,
  Clock,
  Star,
  Play,
  Trophy,
  Target,
  BookOpen,
} from "lucide-react";

export default function QuizzesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
      fetchQuizAttempts();
    }
  }, [isAuthenticated]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getQuizzes();
      setQuizzes(response.data);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizAttempts = async () => {
    try {
      const response = await apiService.getQuizAttempts();
      setQuizAttempts(response.data);
    } catch (error) {
      console.error("Error fetching quiz attempts:", error);
    }
  };

  const createNewQuiz = async () => {
    try {
      const newQuiz = {
        difficulty: "medium",
        topic: null, // Will be selected by user
      };
      const response = await apiService.createQuiz(newQuiz);
      toast({
        title: "Success",
        description: "New quiz created successfully!",
      });
      fetchQuizzes();
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getQuizScore = (quizId) => {
    const attempts = quizAttempts.filter((attempt) => attempt.quiz === quizId);
    if (attempts.length === 0) return null;
    const bestScore = Math.max(...attempts.map((attempt) => attempt.score));
    return bestScore;
  };

  const getAttemptCount = (quizId) => {
    return quizAttempts.filter((attempt) => attempt.quiz === quizId).length;
  };

  const filteredQuizzes = quizzes.filter((quiz) => {
    const matchesSearch =
      !searchTerm ||
      quiz.topic?.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quiz.topic?.subject?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDifficulty =
      !selectedDifficulty || quiz.difficulty === selectedDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
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
        <p className="text-gray-600">Please log in to access quizzes.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quizzes</h1>
            <p className="text-gray-600 mt-2">
              Test your knowledge and track your progress
            </p>
          </div>
          <Button
            onClick={createNewQuiz}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Quiz
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileQuestion className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Quizzes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizzes.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizzes.filter((quiz) => getAttemptCount(quiz.id) > 0).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizAttempts.length > 0
                  ? Math.round(
                      quizAttempts.reduce(
                        (sum, attempt) => sum + attempt.score,
                        0
                      ) / quizAttempts.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Play className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Attempts
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizAttempts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          {(searchTerm || selectedDifficulty) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedDifficulty("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Quizzes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quizzes found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or create a new quiz.
          </p>
          <Button onClick={createNewQuiz} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => {
            const score = getQuizScore(quiz.id);
            const attempts = getAttemptCount(quiz.id);

            return (
              <div
                key={quiz.id}
                className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(
                          quiz.difficulty
                        )}`}
                      >
                        {quiz.difficulty.charAt(0).toUpperCase() +
                          quiz.difficulty.slice(1)}
                      </span>
                      {quiz.topic && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded ml-2">
                          {quiz.topic.subject}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {quiz.topic?.topic || "General Quiz"}
                    </h3>
                    {quiz.topic && (
                      <p className="text-sm text-gray-600 mb-3">
                        {quiz.topic.unit} - Grade {quiz.topic.grade}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen className="h-4 w-4 mr-1" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>~{(quiz.questions?.length || 0) * 2} min</span>
                  </div>
                </div>

                {score !== null && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Best Score:</span>
                      <span
                        className={`text-lg font-semibold ${getScoreColor(
                          score
                        )}`}
                      >
                        {Math.round(score)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attempts:</span>
                      <span className="text-sm font-medium">{attempts}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <Button size="sm" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    {attempts > 0 ? "Retake" : "Start Quiz"}
                  </Button>
                  {score !== null && score >= 80 && (
                    <div className="flex items-center text-yellow-600">
                      <Star className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Mastered</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
