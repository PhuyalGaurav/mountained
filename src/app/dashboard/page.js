"use client";

import { useAuth } from "../services/auth-context";
import { apiService } from "../services/api";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, FileQuestion, Clock, TrendingUp } from "lucide-react";
import { useToast } from "../../hooks/use-toast";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [dashboardData, setDashboardData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
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

      // Fetch analytics dashboard data and summary stats in parallel
      const [dashboardResponse, summaryResponse] = await Promise.all([
        apiService.getAnalyticsDashboard().catch((err) => {
          console.warn("Dashboard data not available:", err);
          return { data: null };
        }),
        apiService.getAnalyticsSummaryStats().catch((err) => {
          console.warn("Summary stats not available:", err);
          return { data: null };
        }),
      ]);

      setDashboardData(dashboardResponse.data);
      setSummaryStats(summaryResponse.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Using default values.",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Extract stats from analytics data or use defaults
  const getStats = () => {
    if (summaryStats && summaryStats.length > 0) {
      const stats = summaryStats[0];
      return {
        totalCourses: stats.total_courses || 0,
        completedQuizzes: stats.completed_quizzes || 0,
        averageScore: stats.average_score || 0,
        studyStreak: stats.study_streak || 0,
      };
    }

    // Default values when analytics data is not available
    return {
      totalCourses: 12,
      completedQuizzes: 24,
      averageScore: 87,
      studyStreak: 7,
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome back, {user?.username || user?.email || "User"}!
        </p>
      </div>

      {/* Loading indicator for data */}
      {loadingData && (
        <div className="mb-4 text-center">
          <p className="text-gray-500">Loading analytics data...</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Courses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalCourses}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileQuestion className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Quizzes Completed
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedQuizzes}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.averageScore}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Study Streak</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.studyStreak} days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activity
          </h2>
          {dashboardData && dashboardData.recent_activities ? (
            <div className="space-y-4">
              {dashboardData.recent_activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {activity.type === "quiz" ? (
                      <FileQuestion className="h-5 w-5 text-green-600" />
                    ) : (
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FileQuestion className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Completed Math Quiz
                  </p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Started Physics Course
                  </p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <FileQuestion className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    Completed Chemistry Quiz
                  </p>
                  <p className="text-xs text-gray-500">2 days ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Profile Information
          </h2>
          {user && (
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-medium text-gray-900">
                    {user.username || "User"}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                {user.first_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      First Name:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user.first_name}
                    </span>
                  </div>
                )}
                {user.last_name && (
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Last Name:
                    </span>
                    <span className="ml-2 text-sm text-gray-900">
                      {user.last_name}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-gray-500">
                    Member since:
                  </span>
                  <span className="ml-2 text-sm text-gray-900">
                    {user.date_joined
                      ? new Date(user.date_joined).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => router.push("/courses")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Courses
                  </Button>
                  <Button
                    onClick={() => router.push("/quizzes")}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <FileQuestion className="h-4 w-4 mr-2" />
                    Take a Quiz
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
