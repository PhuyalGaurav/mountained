"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  BookOpen,
  FileQuestion,
  Clock,
  Award,
  RefreshCw,
} from "lucide-react";

export default function AnalyticsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Fetch all analytics endpoints in parallel
      const [analyticsResponse, dashboardResponse, summaryResponse] =
        await Promise.all([
          apiService.getAnalytics().catch((err) => {
            console.warn("Analytics data not available:", err);
            return { data: [] };
          }),
          apiService.getAnalyticsDashboard().catch((err) => {
            console.warn("Dashboard data not available:", err);
            return { data: null };
          }),
          apiService.getAnalyticsSummaryStats().catch((err) => {
            console.warn("Summary stats not available:", err);
            return { data: null };
          }),
        ]);

      setAnalytics(analyticsResponse.data || []);
      setDashboardData(dashboardResponse.data);
      setSummaryStats(summaryResponse.data);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = async () => {
    try {
      setRefreshing(true);
      await apiService.updateAnalytics();
      toast({
        title: "Success",
        description: "Analytics data updated successfully!",
      });
      await fetchAnalyticsData();
    } catch (error) {
      console.error("Error updating analytics:", error);
      toast({
        title: "Error",
        description: "Failed to update analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Comprehensive view of your learning progress and performance
          </p>
        </div>
        <Button
          onClick={updateAnalytics}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Updating..." : "Update Analytics"}
        </Button>
      </div>

      {/* Summary Stats Cards */}
      {summaryStats && summaryStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {summaryStats.map((stat, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-sm border"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Total Study Time
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stat.total_study_time || 0}h
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* User Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            User Analytics
          </h2>

          {analytics.length > 0 ? (
            <div className="space-y-4">
              {analytics.slice(0, 5).map((analytic, index) => (
                <div
                  key={analytic.id || index}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-500">
                        User ID:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {analytic.user || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-500">
                        Last Updated:
                      </span>
                      <span className="ml-2 text-gray-900">
                        {formatTime(analytic.last_updated)}
                      </span>
                    </div>
                    {analytic.total_quizzes_attempted && (
                      <div>
                        <span className="font-medium text-gray-500">
                          Quizzes Attempted:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {analytic.total_quizzes_attempted}
                        </span>
                      </div>
                    )}
                    {analytic.average_quiz_score && (
                      <div>
                        <span className="font-medium text-gray-500">
                          Avg Score:
                        </span>
                        <span className="ml-2 text-gray-900">
                          {analytic.average_quiz_score}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No analytics data available yet.</p>
              <p className="text-sm text-gray-400 mt-2">
                Start learning to see your progress here!
              </p>
            </div>
          )}
        </div>

        {/* Dashboard Data */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Overview
          </h2>

          {dashboardData ? (
            <div className="space-y-4">
              {/* Display dashboard data if available */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(dashboardData, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                Dashboard data will appear here once available.
              </p>
              <Button
                onClick={updateAnalytics}
                disabled={refreshing}
                className="mt-4"
                variant="outline"
              >
                Generate Analytics
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => (window.location.href = "/courses")}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </Button>
          <Button
            onClick={() => (window.location.href = "/quizzes")}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <FileQuestion className="h-4 w-4" />
            Take a Quiz
          </Button>
          <Button
            onClick={updateAnalytics}
            disabled={refreshing}
            className="flex items-center justify-center gap-2"
            variant="outline"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh Data
          </Button>
        </div>
      </div>
    </div>
  );
}
