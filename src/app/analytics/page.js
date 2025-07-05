"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  FileQuestion,
  Clock,
  Award,
  RefreshCw,
  Target,
} from "lucide-react";
import ProgressChart from "@/components/charts/ProgressChart";
import SubjectPerformanceChart from "@/components/charts/SubjectPerformanceChart";

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

  // Generate dummy data for empty responses
  const generateDummyData = () => {
    const now = new Date();

    // Generate smoother progression for scores
    let lastScore = 70; // Start with base score
    let studyStreak = 0;

    const dummyAnalytics = Array.from({ length: 14 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (13 - index));

      // Generate realistic score progression
      const scoreChange =
        Math.random() > 0.7
          ? Math.random() * 10 - 3 // Occasional bigger changes
          : Math.random() * 4 - 1; // Small variations
      lastScore = Math.min(Math.max(lastScore + scoreChange, 65), 98); // Keep between 65-98

      // More quizzes on weekends (index % 7 >= 5)
      const isWeekend = new Date(date).getDay() % 6 === 0;
      const baseQuizzes = isWeekend ? 3 : 1;

      // Study streak calculation
      if (Math.random() > 0.2) {
        // 80% chance of studying
        studyStreak++;
      } else {
        studyStreak = 0;
      }

      return {
        timestamp: date.toISOString(),
        quizzes_attempted: baseQuizzes + Math.floor(Math.random() * 3),
        average_score: Math.round(lastScore * 10) / 10,
        study_time: 1.5 + Math.random() * 2 + (isWeekend ? 2 : 0),
        streak: studyStreak,
      };
    });

    // Calculate dashboard stats from analytics
    const totalQuizzes = dummyAnalytics.reduce(
      (sum, day) => sum + day.quizzes_attempted,
      0
    );
    const avgScore = Math.round(
      dummyAnalytics.reduce((sum, day) => sum + day.average_score, 0) /
        dummyAnalytics.length
    );
    const totalStudyTime = Math.round(
      dummyAnalytics.reduce((sum, day) => sum + day.study_time, 0)
    );
    const highestScore = Math.round(
      Math.max(...dummyAnalytics.map((day) => day.average_score))
    );

    const dummyDashboard = {
      total_quizzes_attempted: totalQuizzes,
      average_quiz_score: avgScore,
      total_study_time: totalStudyTime,
      highest_quiz_score: highestScore,
      recent_topics: [
        { name: "Mathematics", count: Math.ceil(totalQuizzes * 0.4) },
        { name: "Physics", count: Math.ceil(totalQuizzes * 0.3) },
        { name: "Chemistry", count: Math.ceil(totalQuizzes * 0.2) },
        { name: "Biology", count: Math.ceil(totalQuizzes * 0.1) },
      ],
      top_subjects: [
        { name: "Algebra", average_score: Math.min(avgScore + 5, 98) },
        { name: "Geometry", average_score: avgScore },
        { name: "Physics Mechanics", average_score: avgScore - 2 },
        { name: "Chemical Bonds", average_score: avgScore - 4 },
      ],
      recent_achievements: [
        { description: `Completed ${totalQuizzes} quizzes` },
        { description: `Achieved ${highestScore}% highest score` },
        {
          description: `Study streak: ${Math.max(
            ...dummyAnalytics.map((d) => d.streak)
          )} days`,
        },
        { description: `Studied for ${totalStudyTime} hours total` },
        { description: "Mastered Algebra fundamentals" },
      ],
    };

    return { analytics: dummyAnalytics, dashboard: dummyDashboard };
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // COMMENTED OUT: Fetch all analytics endpoints in parallel
      // const [analyticsResponse, dashboardResponse, summaryResponse] =
      //   await Promise.all([
      //     apiService.getAnalytics().catch((err) => {
      //       console.warn("Analytics data not available:", err);
      //       return { data: [] };
      //     }),
      //     apiService.getAnalyticsDashboard().catch((err) => {
      //       console.warn("Dashboard data not available:", err);
      //       return { data: null };
      //     }),
      //     apiService.getAnalyticsSummaryStats().catch((err) => {
      //       console.warn("Summary stats not available:", err);
      //       return { data: null };
      //     }),
      //   ]);

      // COMMENTED OUT: Check if we have real data, otherwise use dummy data
      // const hasRealData =
      //   analyticsResponse.data?.length > 0 && dashboardResponse.data !== null;

      // ALWAYS USE DUMMY DATA FOR NOW
      console.log("Using dummy data for visualization");
      const dummyData = generateDummyData();
      setAnalytics(dummyData.analytics);
      setDashboardData(dummyData.dashboard);
      setSummaryStats([
        { total_study_time: dummyData.dashboard.total_study_time },
      ]);

      // COMMENTED OUT: Real data handling
      // if (!hasRealData) {
      //   console.log(
      //     "No real data available, using dummy data for visualization"
      //   );
      //   const dummyData = generateDummyData();
      //   setAnalytics(dummyData.analytics);
      //   setDashboardData(dummyData.dashboard);
      //   setSummaryStats([
      //     { total_study_time: dummyData.dashboard.total_study_time },
      //   ]);
      // } else {
      //   setAnalytics(analyticsResponse.data);
      //   setDashboardData(dashboardResponse.data);
      //   setSummaryStats(summaryResponse.data);
      // }
    } catch (error) {
      console.error("Error in analytics data setup:", error);
      // Fall back to dummy data on error
      const dummyData = generateDummyData();
      setAnalytics(dummyData.analytics);
      setDashboardData(dummyData.dashboard);
      setSummaryStats([
        { total_study_time: dummyData.dashboard.total_study_time },
      ]);

      toast({
        title: "Notice",
        description:
          "Using sample data for visualization. Real data unavailable.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAnalytics = async () => {
    try {
      setRefreshing(true);
      // COMMENTED OUT: API call for updating analytics
      // await apiService.updateAnalytics();
      
      // Simulate update with new dummy data
      toast({
        title: "Success",
        description: "Analytics data refreshed with new dummy data!",
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
    const date = new Date(timeString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Sort analytics for display
  const sortedAnalytics = [...analytics].sort(
    (a, b) =>
      new Date(b.timestamp || b.last_updated) -
      new Date(a.timestamp || a.last_updated)
  );

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
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Quizzes Attempted
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {dashboardData.total_quizzes_attempted || 0}
                </p>
              </div>
              <FileQuestion className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Score
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(dashboardData.average_quiz_score || 0).toFixed(1)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Study Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {Math.round(dashboardData.total_study_time || 0)}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Best Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {(dashboardData.highest_quiz_score || 0).toFixed(1)}%
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <ProgressChart analytics={analytics} />
        <SubjectPerformanceChart dashboardData={dashboardData} />
      </div>

      {/* Recent Activity List */}
      <div className="grid grid-cols-1 gap-8 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h2>
            <div className="text-sm text-gray-500">
              Last {analytics.length} entries
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quizzes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Study Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAnalytics.slice(0, 7).map((entry, index) => (
                  <tr
                    key={entry.timestamp || index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTime(entry.timestamp || entry.last_updated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {entry.quizzes_attempted ||
                        entry.total_quizzes_attempted ||
                        0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(
                        entry.average_score ||
                        entry.average_quiz_score ||
                        0
                      ).toFixed(1)}
                      %
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(entry.study_time || 0).toFixed(1)}h
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      {dashboardData && (
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Detailed Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Recent Topics</p>
              <ul className="space-y-1">
                {(dashboardData.recent_topics || []).map((topic, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{topic.name}</span>
                    <span className="text-sm text-gray-500">
                      {topic.count} quizzes
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Strongest Subjects</p>
              <ul className="space-y-1">
                {(dashboardData.top_subjects || []).map((subject, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{subject.name}</span>
                    <span className="text-sm text-green-600">
                      {subject.average_score}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-500">Recent Progress</p>
              <ul className="space-y-1">
                {(dashboardData.recent_achievements || [])
                  .slice(0, 5)
                  .map((achievement, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <Award className="h-4 w-4 text-yellow-500 mr-2" />
                      <span>{achievement.description}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

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
