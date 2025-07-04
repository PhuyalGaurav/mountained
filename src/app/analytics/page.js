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
// Chart.js imports
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

  // Prepare chart data
  const quizLabels = analytics.map((a) => formatTime(a.last_updated));
  const quizAttempts = analytics.map((a) => a.total_quizzes_attempted || 0);
  const avgScores = analytics.map((a) => a.average_quiz_score || 0);

  const quizData = {
    labels: quizLabels,
    datasets: [
      {
        label: "Quiz Attempts",
        data: quizAttempts,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
      },
    ],
  };

  const scoreData = {
    labels: quizLabels,
    datasets: [
      {
        label: "Average Quiz Score",
        data: avgScores,
        borderColor: "rgb(153, 102, 255)",
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        tension: 0.4,
      },
    ],
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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Quiz Attempts Over Time
          </h2>
          <Line
            data={quizData}
            options={{
              responsive: true,
              plugins: { legend: { position: "top" } },
            }}
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Average Quiz Score Over Time
          </h2>
          <Line
            data={scoreData}
            options={{
              responsive: true,
              plugins: { legend: { position: "top" } },
            }}
          />
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
