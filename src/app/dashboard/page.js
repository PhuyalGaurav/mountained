"use client";

import { useAuth } from "../services/auth-context";
import { apiService } from "../services/api";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  FileQuestion,
  Clock,
  TrendingUp,
  Award,
  Target,
  BarChart3,
} from "lucide-react";
import ProgressChart from "../../components/charts/ProgressChart";
import SubjectPerformanceChart from "../../components/charts/SubjectPerformanceChart";
import { useToast } from "../../hooks/use-toast";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [quizData, setQuizData] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchDashboardData();
    }
  }, [isAuthenticated, isLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);

      // Fetch all available data from APIs
      const [
        dashboardResponse,
        summaryResponse,
        analyticsResponse,
        quizzesResponse,
        quizAttemptsResponse,
        userProgressResponse,
      ] = await Promise.all([
        apiService.getAnalyticsDashboard().catch((err) => {
          console.warn("Dashboard data not available:", err);
          return { data: null };
        }),
        apiService.getAnalyticsSummaryStats().catch((err) => {
          console.warn("Summary stats not available:", err);
          return { data: null };
        }),
        apiService.getAnalytics().catch((err) => {
          console.warn("Analytics data not available:", err);
          return { data: [] };
        }),
        apiService.getQuizzes().catch((err) => {
          console.warn("Quiz data not available:", err);
          return { data: [] };
        }),
        apiService.getQuizAttempts().catch((err) => {
          console.warn("Quiz attempts not available:", err);
          return { data: [] };
        }),
        apiService.getUserProgress().catch((err) => {
          console.warn("User progress not available:", err);
          return { data: null };
        }),
      ]);

      console.log("API Responses:", {
        dashboard: dashboardResponse.data,
        summary: summaryResponse.data,
        analytics: analyticsResponse.data,
        quizzes: quizzesResponse.data,
        attempts: quizAttemptsResponse.data,
        progress: userProgressResponse.data,
      });

      console.log("Processed data:", {
        dashboardDataLength: dashboardResponse.data
          ? Object.keys(dashboardResponse.data).length
          : 0,
        summaryStatsLength: summaryResponse.data
          ? Array.isArray(summaryResponse.data)
            ? summaryResponse.data.length
            : Object.keys(summaryResponse.data).length
          : 0,
        analyticsDataLength: (analyticsResponse.data || []).length,
        quizDataLength: Array.isArray(quizzesResponse.data)
          ? quizzesResponse.data.length
          : 0,
        quizAttemptsLength: Array.isArray(quizAttemptsResponse.data)
          ? quizAttemptsResponse.data.length
          : 0,
        userProgressAvailable: !!userProgressResponse.data,
      });

      setDashboardData(dashboardResponse.data);
      setSummaryStats(summaryResponse.data);
      setAnalyticsData(analyticsResponse.data || []);
      setQuizData(
        Array.isArray(quizzesResponse.data) ? quizzesResponse.data : []
      );
      setQuizAttempts(
        Array.isArray(quizAttemptsResponse.data)
          ? quizAttemptsResponse.data
          : []
      );
      setUserProgress(userProgressResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description:
          "Failed to load dashboard data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate real stats from API data
  const getStats = () => {
    // Calculate from quiz attempts if available
    if (quizAttempts && quizAttempts.length > 0) {
      const completedAttempts = quizAttempts.filter(
        (attempt) => attempt.score !== null && attempt.score !== undefined
      );
      const totalQuizzes = quizAttempts.length;
      const averageScore =
        completedAttempts.length > 0
          ? Math.round(
              completedAttempts.reduce(
                (sum, attempt) => sum + (attempt.score || 0),
                0
              ) / completedAttempts.length
            )
          : 0;
      const highestScore =
        completedAttempts.length > 0
          ? Math.max(...completedAttempts.map((attempt) => attempt.score || 0))
          : 0;

      return {
        totalQuizzes,
        completedQuizzes: completedAttempts.length,
        averageScore,
        highestScore,
        totalCourses: quizData.length, // Number of available quizzes as proxy for courses
        studyStreak: userProgress?.study_streak || 0,
      };
    }

    // Use summary stats if available
    if (summaryStats && summaryStats.length > 0) {
      const stats = summaryStats[0];
      return {
        totalCourses: stats.total_courses || 0,
        totalQuizzes: stats.total_quizzes || quizData.length,
        completedQuizzes: stats.completed_quizzes || 0,
        averageScore: Math.round(stats.average_score || 0),
        highestScore: Math.round(stats.highest_score || 0),
        studyStreak: stats.study_streak || 0,
      };
    }

    // Use dashboard data if available
    if (dashboardData) {
      return {
        totalCourses: dashboardData.total_courses || quizData.length,
        totalQuizzes:
          dashboardData.total_quizzes_attempted ||
          dashboardData.total_quizzes_taken ||
          0,
        completedQuizzes: dashboardData.completed_quizzes || 0,
        averageScore: Math.round(dashboardData.average_quiz_score || 0),
        highestScore: Math.round(dashboardData.highest_quiz_score || 0),
        studyStreak: dashboardData.study_streak || 0,
      };
    }

    // Fallback to zero values if no data is available
    return {
      totalCourses: quizData.length,
      totalQuizzes: 0,
      completedQuizzes: 0,
      averageScore: 0,
      highestScore: 0,
      studyStreak: 0,
    };
  };

  const stats = getStats();

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.username || user?.email || "User"}!
                Here&apos;s your learning overview.
              </p>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <Button
                onClick={() => router.push("/courses")}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Courses
              </Button>
              <Button
                onClick={() => router.push("/quizzes")}
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Take Quiz
              </Button>
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                disabled={loadingData}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                {loadingData ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  "Refresh"
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loadingData && (
          <div className="mb-6 flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <p className="ml-3 text-gray-600">Loading your dashboard data...</p>
          </div>
        )}

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Quizzes Attempted */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-xl text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">
                  Quizzes Attempted
                </p>
                <p className="text-3xl font-bold mt-1">{stats.totalQuizzes}</p>
                <p className="text-orange-200 text-xs mt-1">
                  {stats.completedQuizzes} completed
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <FileQuestion className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Average Score
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.averageScore}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-green-600 text-xs font-medium">
                    {stats.completedQuizzes > 0
                      ? "Based on completed quizzes"
                      : "No data yet"}
                  </p>
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* Available Courses */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Available Quizzes
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalCourses}
                </p>
                <p className="text-blue-600 text-xs mt-1 font-medium">
                  Ready to take
                </p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Highest Score */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  Highest Score
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.highestScore}%
                </p>
                <p className="text-purple-600 text-xs mt-1 font-medium">
                  {stats.highestScore > 0
                    ? "Personal best"
                    : "Take your first quiz!"}
                </p>
              </div>
              <div className="bg-purple-50 p-3 rounded-lg">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Progress Chart - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Learning Progress
              </h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Score</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-600">Study Time</span>
                </div>
              </div>
            </div>
            {analyticsData && analyticsData.length > 0 ? (
              <ProgressChart analytics={analyticsData} />
            ) : quizAttempts && quizAttempts.length > 0 ? (
              <ProgressChart
                analytics={quizAttempts
                  .filter((attempt) => attempt.score !== null)
                  .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                  .map((attempt) => ({
                    timestamp: attempt.timestamp,
                    average_score: attempt.score,
                    study_time: 0.5, // Placeholder study time
                    quizzes_attempted: 1,
                  }))}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    No progress data available yet
                  </p>
                  <p className="text-sm text-gray-400">
                    Start taking quizzes to see your progress!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {/* Activity Items from Quiz Attempts */}
              {quizAttempts && quizAttempts.length > 0 ? (
                quizAttempts
                  .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                  .slice(0, 3)
                  .map((attempt, index) => {
                    const quiz = quizData.find((q) => q.id === attempt.quiz);
                    const score = attempt.score || 0;
                    const timeAgo = new Date(
                      attempt.timestamp
                    ).toLocaleDateString();

                    return (
                      <div
                        key={attempt.id || index}
                        className="flex items-center p-3 bg-orange-50 rounded-lg"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                            <FileQuestion className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            Completed {quiz?.title || "Quiz"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Score: {Math.round(score)}% • {timeAgo}
                          </p>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-8">
                  <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No recent activity</p>
                  <p className="text-gray-400 text-xs">
                    Take your first quiz to see activity here
                  </p>
                </div>
              )}

              {/* Study Streak */}
              {stats.studyStreak > 0 && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Target className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {stats.studyStreak}-day study streak
                    </p>
                    <p className="text-xs text-gray-500">Keep it up!</p>
                  </div>
                </div>
              )}

              {/* Available Quizzes Call to Action */}
              {stats.totalCourses > stats.totalQuizzes && (
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Ready to Learn
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-700 mb-2">
                      {stats.totalCourses - stats.totalQuizzes} more quizzes
                      available
                    </p>
                    <Button
                      onClick={() => router.push("/quizzes")}
                      size="sm"
                      className="bg-blue-500 hover:bg-blue-600 text-white text-xs"
                    >
                      Explore Quizzes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Grid - Subject Performance and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Subject Performance Chart */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Quiz Performance
            </h2>
            {quizAttempts && quizAttempts.length > 0 ? (
              <SubjectPerformanceChart
                dashboardData={{
                  quiz_attempts: quizAttempts,
                  quizzes: quizData,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No performance data available</p>
                  <p className="text-xs text-gray-400">
                    Complete quizzes to see performance breakdown
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Learning Insights */}
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Learning Insights
            </h2>

            {/* Top Performing Quizzes */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Top Performing Quizzes
              </h3>
              <div className="space-y-3">
                {quizAttempts && quizAttempts.length > 0 ? (
                  quizAttempts
                    .filter(
                      (attempt) =>
                        attempt.score !== null && attempt.score !== undefined
                    )
                    .sort((a, b) => (b.score || 0) - (a.score || 0))
                    .slice(0, 3)
                    .map((attempt, index) => {
                      const quiz = quizData.find((q) => q.id === attempt.quiz);
                      return (
                        <div
                          key={attempt.id || index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-2 h-2 rounded-full mr-3 ${
                                index === 0
                                  ? "bg-orange-500"
                                  : index === 1
                                  ? "bg-orange-400"
                                  : "bg-orange-300"
                              }`}
                            ></div>
                            <span className="text-sm font-medium text-gray-900">
                              {quiz?.title || `Quiz ${attempt.quiz}`}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">
                            {Math.round(attempt.score || 0)}%
                          </span>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">No quiz results yet</p>
                    <p className="text-xs text-gray-400">
                      Complete quizzes to see performance insights
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Quizzes */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Available Quizzes
              </h3>
              <div className="space-y-3">
                {quizData && quizData.length > 0 ? (
                  quizData.slice(0, 4).map((quiz, index) => {
                    const attemptCount = quizAttempts.filter(
                      (attempt) => attempt.quiz === quiz.id
                    ).length;
                    return (
                      <div
                        key={quiz.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 text-blue-500 mr-3" />
                          <span className="text-sm text-gray-900">
                            {quiz.title || `Quiz ${quiz.id}`}
                          </span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {attemptCount > 0
                            ? `${attemptCount} attempts`
                            : "Not attempted"}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500">
                      No quizzes available
                    </p>
                    <p className="text-xs text-gray-400">
                      Create your first quiz to get started
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Performance Recommendation */}
            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
              <h3 className="text-sm font-semibold text-orange-800 mb-2">
                💡 Study Recommendation
              </h3>
              <p className="text-sm text-orange-700">
                {stats.averageScore > 0
                  ? stats.averageScore >= 80
                    ? "Great work! Consider challenging yourself with more advanced topics."
                    : stats.averageScore >= 60
                    ? "Good progress! Focus on reviewing incorrect answers to improve your scores."
                    : "Keep practicing! Review the material and retake quizzes to build confidence."
                  : "Start taking quizzes to get personalized study recommendations based on your performance."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
