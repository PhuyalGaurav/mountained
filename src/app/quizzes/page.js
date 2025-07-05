"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Award,
  Star,
  Play,
  CheckCircle,
  XCircle,
  Calendar,
  User,
  FileQuestion,
  TrendingUp,
  Target,
  History,
  BarChart3,
  RefreshCw,
  SortDesc,
  Grid3X3,
  List,
  Eye,
} from "lucide-react";

// Helper functions
function generateQuizTitle(quiz) {
  // If quiz has a specific title, use it
  if (quiz.title && quiz.title.trim() && quiz.title !== "Quiz") {
    return quiz.title;
  }

  // Generate descriptive title based on available data
  let title = "";

  // Start with subject if available
  if (quiz.topic?.subject) {
    title = quiz.topic.subject;

    // Add specific topic if it's different from subject
    if (quiz.topic.topic && quiz.topic.topic !== quiz.topic.subject) {
      title += `: ${quiz.topic.topic}`;
    }

    // Add grade level
    if (quiz.topic.grade) {
      title += ` (Grade ${quiz.topic.grade})`;
    }
  } else if (quiz.topic?.topic) {
    // If no subject but has topic
    title = quiz.topic.topic;
    if (quiz.topic.grade) {
      title += ` - Grade ${quiz.topic.grade}`;
    }
  } else if (quiz.material?.title) {
    // If based on learning material
    title = `Quiz: ${quiz.material.title}`;
  } else if (quiz.course?.title) {
    // If based on course
    title = `${quiz.course.title} Quiz`;
  } else {
    // Last resort - generic but include difficulty
    title = `${quiz.difficulty || "Practice"} Quiz`;
    if (quiz.topic?.grade) {
      title += ` - Grade ${quiz.topic.grade}`;
    }
  }

  return title || "Practice Quiz";
}

function generateQuizSubtitle(quiz) {
  const parts = [];

  // Add question count
  const questionCount = quiz.questions?.length || quiz.question_count || 0;
  if (questionCount > 0) {
    parts.push(`${questionCount} question${questionCount !== 1 ? "s" : ""}`);
  }

  // Add difficulty
  if (quiz.difficulty) {
    parts.push(`${quiz.difficulty} difficulty`);
  }

  // Add creation date
  if (quiz.created_at) {
    const date = new Date(quiz.created_at);
    const isRecent = Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000; // 7 days
    if (isRecent) {
      parts.push("Recently created");
    }
  }

  return parts.join(" • ") || "Practice quiz";
}

function generateQuizTopicLabel(quiz) {
  // Priority order: specific topic > subject > course > material > fallback
  if (quiz.topic?.topic && quiz.topic.topic.trim()) {
    return quiz.topic.topic;
  }

  if (quiz.topic?.subject && quiz.topic.subject.trim()) {
    return quiz.topic.subject;
  }

  if (quiz.course?.title && quiz.course.title.trim()) {
    return quiz.course.title;
  }

  if (quiz.material?.title && quiz.material.title.trim()) {
    return quiz.material.title;
  }

  if (quiz.topic?.grade) {
    return `Grade ${quiz.topic.grade}`;
  }

  // Last resort
  return quiz.difficulty || "General";
}

function getScoreColor(score) {
  if (score >= 90) return "text-green-600";
  if (score >= 70) return "text-yellow-600";
  return "text-red-600";
}

function getStatusColor(status) {
  switch (status) {
    case "completed":
      return "bg-green-500";
    case "in_progress":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
}

function getStatusTextColor(status) {
  switch (status) {
    case "completed":
      return "text-green-600";
    case "in_progress":
      return "text-yellow-600";
    default:
      return "text-gray-600";
  }
}

function getStatusText(status) {
  switch (status) {
    case "completed":
      return "Completed";
    case "in_progress":
      return "In Progress";
    default:
      return "Not Started";
  }
}

export default function QuizzesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("recent"); // recent, score, title, attempts
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const [quizzesResponse, attemptsResponse] = await Promise.all([
        apiService.getQuizzes(),
        apiService.getQuizAttempts().catch((err) => {
          console.warn("Failed to fetch quiz attempts:", err);
          return { data: [] };
        }),
      ]);

      console.log("Quiz data structure:", quizzesResponse.data);
      console.log("Quiz attempts data:", attemptsResponse.data);

      const quizzesData = quizzesResponse.data;
      const attemptsData = Array.isArray(attemptsResponse.data)
        ? attemptsResponse.data
        : attemptsResponse.data?.results || [];

      // Enhance quizzes with attempt data
      const enhancedQuizzes = quizzesData.map((quiz) => {
        const quizAttempts = attemptsData.filter(
          (attempt) => attempt.quiz === quiz.id
        );
        const completedAttempts = quizAttempts.filter(
          (attempt) => attempt.score !== null
        );
        const bestScore =
          completedAttempts.length > 0
            ? Math.max(...completedAttempts.map((a) => a.score || 0))
            : null;
        const avgScore =
          completedAttempts.length > 0
            ? Math.round(
                completedAttempts.reduce((sum, a) => sum + (a.score || 0), 0) /
                  completedAttempts.length
              )
            : null;
        const lastAttempt =
          quizAttempts.length > 0
            ? quizAttempts.sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
              )[0]
            : null;

        return {
          ...quiz,
          attempts: quizAttempts,
          attemptCount: quizAttempts.length,
          completedAttempts: completedAttempts.length,
          bestScore,
          avgScore,
          lastAttempt,
          status:
            lastAttempt?.score !== null
              ? "completed"
              : quizAttempts.length > 0
              ? "in_progress"
              : "not_started",
        };
      });

      setQuizzes(enhancedQuizzes);
      setFilteredQuizzes(enhancedQuizzes);
      setQuizAttempts(attemptsData);
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
  }, [toast]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchQuizzes();
    }
  }, [isAuthenticated, fetchQuizzes]);

  useEffect(() => {
    let filtered = quizzes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((quiz) => {
        const title = generateQuizTitle(quiz).toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        return (
          title.includes(searchLower) ||
          quiz.topic?.topic?.toLowerCase().includes(searchLower) ||
          quiz.topic?.subject?.toLowerCase().includes(searchLower) ||
          quiz.material?.title?.toLowerCase().includes(searchLower) ||
          quiz.course?.title?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter(
        (quiz) => quiz.difficulty === selectedDifficulty
      );
    }

    // Filter by topic/subject
    if (selectedTopic) {
      filtered = filtered.filter((quiz) => {
        const topicLabel = generateQuizTopicLabel(quiz).toLowerCase();
        return topicLabel.includes(selectedTopic.toLowerCase());
      });
    }

    // Filter by status
    if (selectedStatus) {
      filtered = filtered.filter((quiz) => quiz.status === selectedStatus);
    }

    // Apply sorting
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => {
          const aDate = a.lastAttempt?.timestamp || a.created_at;
          const bDate = b.lastAttempt?.timestamp || b.created_at;
          return new Date(bDate) - new Date(aDate);
        });
        break;
      case "score":
        filtered.sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0));
        break;
      case "title":
        filtered.sort((a, b) =>
          generateQuizTitle(a).localeCompare(generateQuizTitle(b))
        );
        break;
      case "attempts":
        filtered.sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));
        break;
      default:
        break;
    }

    setFilteredQuizzes(filtered);
  }, [
    quizzes,
    searchTerm,
    selectedDifficulty,
    selectedTopic,
    selectedStatus,
    sortBy,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDifficulty("");
    setSelectedTopic("");
    setSelectedStatus("");
    setSortBy("recent");
  };

  const refreshData = async () => {
    await fetchQuizzes();
    toast({
      title: "Success",
      description: "Quiz data refreshed successfully.",
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
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
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 pt-16 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                My Quizzes
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2">
                Practice with your AI-generated quizzes and track your progress
              </p>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <Button
                onClick={refreshData}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={() => router.push("/quizzes/create")}
                className="flex items-center gap-2"
              >
                <FileQuestion className="h-4 w-4" />
                Create Quiz
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-6 w-6 lg:h-8 lg:w-8 text-blue-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">
                    Total Quizzes
                  </p>
                  <p className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {quizzes.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8 text-green-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">
                    Completed
                  </p>
                  <p className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {quizzes.filter((q) => q.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8 text-purple-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">
                    Avg Score
                  </p>
                  <p className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {(() => {
                      const completedQuizzes = quizzes.filter(
                        (q) => q.bestScore !== null
                      );
                      if (completedQuizzes.length === 0) return "—";
                      const avg = Math.round(
                        completedQuizzes.reduce(
                          (sum, q) => sum + q.bestScore,
                          0
                        ) / completedQuizzes.length
                      );
                      return `${avg}%`;
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 lg:h-8 lg:w-8 text-yellow-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">
                    Best Score
                  </p>
                  <p className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {(() => {
                      const scores = quizzes
                        .map((q) => q.bestScore)
                        .filter((s) => s !== null);
                      return scores.length > 0
                        ? `${Math.max(...scores)}%`
                        : "—";
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <History className="h-6 w-6 lg:h-8 lg:w-8 text-indigo-600" />
                </div>
                <div className="ml-3 lg:ml-4">
                  <p className="text-xs lg:text-sm font-medium text-gray-500">
                    Total Attempts
                  </p>
                  <p className="text-xl lg:text-2xl font-semibold text-gray-900">
                    {quizzes.reduce((sum, q) => sum + (q.attemptCount || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filters */}
        <Card className="mb-4 lg:mb-6">
          <CardContent className="p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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

                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="not_started">Not Started</option>
                </select>

                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Topics</option>
                  {Array.from(
                    new Set(quizzes.map((quiz) => generateQuizTopicLabel(quiz)))
                  )
                    .filter((topic) => topic && topic !== "General")
                    .sort()
                    .map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center gap-2 lg:gap-3">
                <div className="flex items-center gap-1 lg:gap-2">
                  <SortDesc className="h-4 w-4 text-gray-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="recent">Recent</option>
                    <option value="score">Best Score</option>
                    <option value="title">Title</option>
                    <option value="attempts">Most Attempts</option>
                  </select>
                </div>

                <div className="flex items-center border border-gray-300 rounded-md">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${
                      viewMode === "grid"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${
                      viewMode === "list"
                        ? "bg-blue-100 text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {(searchTerm ||
                  selectedDifficulty ||
                  selectedTopic ||
                  selectedStatus ||
                  sortBy !== "recent") && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    size="sm"
                    className="whitespace-nowrap"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quizzes Display */}
        {loading ? (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {quizzes.length === 0
                  ? "No quizzes found"
                  : "No matching quizzes"}
              </h3>
              <p className="text-gray-500 mb-4">
                {quizzes.length === 0
                  ? "You haven't created any quizzes yet."
                  : "Try adjusting your filters to find more quizzes."}
              </p>
              <div className="flex justify-center gap-4">
                <Button onClick={() => router.push("/quizzes/create")}>
                  <FileQuestion className="h-4 w-4 mr-2" />
                  Create New Quiz
                </Button>
                {quizzes.length > 0 && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredQuizzes.map((quiz) => (
                  <QuizGridCard key={quiz.id} quiz={quiz} router={router} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {filteredQuizzes.map((quiz) => (
                  <QuizListCard key={quiz.id} quiz={quiz} router={router} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Enhanced Grid Card Component
function QuizGridCard({ quiz, router }) {
  return (
    <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-in-out">
      <CardContent className="p-4 lg:p-6">
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <span className="px-2 lg:px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {generateQuizTopicLabel(quiz)}
          </span>
          <div className="flex items-center text-xs lg:text-sm text-gray-500">
            <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
            <span>
              {quiz.questions?.length || quiz.question_count || 0} questions
            </span>
          </div>
        </div>

        <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-2 h-12 lg:h-16 line-clamp-2">
          {generateQuizTitle(quiz)}
        </h3>

        <p className="text-xs lg:text-sm text-gray-600 mb-3 lg:mb-4 h-8 lg:h-10 line-clamp-2">
          {generateQuizSubtitle(quiz)}
        </p>

        {/* Enhanced Progress/Stats */}
        <div className="space-y-2 lg:space-y-3 mb-3 lg:mb-4">
          {quiz.attemptCount > 0 && (
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-500">
                {quiz.attemptCount} attempt{quiz.attemptCount !== 1 ? "s" : ""}
              </span>
              {quiz.bestScore !== null && (
                <span
                  className={`font-medium ${getScoreColor(quiz.bestScore)}`}
                >
                  Best: {quiz.bestScore}%
                </span>
              )}
            </div>
          )}

          {quiz.avgScore !== null && quiz.completedAttempts > 1 && (
            <div className="flex items-center justify-between text-xs lg:text-sm">
              <span className="text-gray-500">Average Score</span>
              <span className={`font-medium ${getScoreColor(quiz.avgScore)}`}>
                {quiz.avgScore}%
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs lg:text-sm text-gray-500 pt-3 lg:pt-4 border-t border-gray-100 mb-3 lg:mb-4">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-1.5 text-gray-400" />
            <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center">
            <span
              className={`h-2 w-2 rounded-full mr-1 lg:mr-1.5 ${getStatusColor(
                quiz.status
              )}`}
            ></span>
            <span className={getStatusTextColor(quiz.status)}>
              {getStatusText(quiz.status)}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/quizzes/${quiz.id}`)}
            className="flex-1 flex items-center justify-center gap-1 lg:gap-2 text-sm"
          >
            <Play className="h-3 w-3 lg:h-4 lg:w-4" />
            {quiz.status === "completed" ? "Retake" : "Start Quiz"}
          </Button>
          {quiz.attemptCount > 0 && (
            <Button
              onClick={() =>
                router.push(
                  `/quizzes/${quiz.id}?attemptId=${quiz.lastAttempt?.id}`
                )
              }
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// New List Card Component
function QuizListCard({ quiz, router }) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2 lg:mb-3">
              <div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-1">
                  {generateQuizTitle(quiz)}
                </h3>
                <p className="text-xs lg:text-sm text-gray-600">
                  {generateQuizSubtitle(quiz)}
                </p>
              </div>
              <span className="px-2 lg:px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 self-start">
                {generateQuizTopicLabel(quiz)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-4 text-xs lg:text-sm text-gray-500">
              <div className="flex items-center">
                <Clock className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span>
                  {quiz.questions?.length || quiz.question_count || 0} questions
                </span>
              </div>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
              </div>
              {quiz.attemptCount > 0 && (
                <div className="flex items-center">
                  <History className="h-3 w-3 lg:h-4 lg:w-4 mr-1" />
                  <span>
                    {quiz.attemptCount} attempt
                    {quiz.attemptCount !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="flex items-center">
                <span
                  className={`h-2 w-2 rounded-full mr-1 lg:mr-1.5 ${getStatusColor(
                    quiz.status
                  )}`}
                ></span>
                <span className={getStatusTextColor(quiz.status)}>
                  {getStatusText(quiz.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 lg:gap-3">
            {quiz.bestScore !== null && (
              <div className="text-center lg:text-right">
                <div className="text-xs text-gray-500">Best Score</div>
                <div
                  className={`text-base lg:text-lg font-bold ${getScoreColor(
                    quiz.bestScore
                  )}`}
                >
                  {quiz.bestScore}%
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => router.push(`/quizzes/${quiz.id}`)}
                className="flex items-center gap-1 lg:gap-2 text-sm"
              >
                <Play className="h-3 w-3 lg:h-4 lg:w-4" />
                {quiz.status === "completed" ? "Retake" : "Start"}
              </Button>
              {quiz.attemptCount > 0 && (
                <Button
                  onClick={() =>
                    router.push(
                      `/quizzes/${quiz.id}?attemptId=${quiz.lastAttempt?.id}`
                    )
                  }
                  variant="outline"
                  className="flex items-center gap-1 lg:gap-2 text-sm"
                >
                  <Eye className="h-3 w-3 lg:h-4 lg:w-4" />
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
