"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Mail,
  BookOpen,
  Trophy,
  Target,
  Calendar,
  Edit3,
  Save,
  X,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function ProfilePage() {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const { toast } = useToast();
  const [userProgress, setUserProgress] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [studyTasks, setStudyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    grade: "",
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      setEditForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        grade: user.grade || "",
      });
      fetchUserData();
    }
  }, [isAuthenticated, user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Fetch user progress
      const progressResponse = await apiService.getUserProgress();
      setUserProgress(progressResponse.data);

      // Fetch quiz attempts
      const attemptsResponse = await apiService.getQuizAttempts();
      setQuizAttempts(attemptsResponse.data);

      // Fetch study tasks
      const tasksResponse = await apiService.getStudyTasks();
      setStudyTasks(tasksResponse.data);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      // Note: This would need a user update endpoint in your API
      toast({
        title: "Info",
        description:
          "Profile update functionality needs to be implemented in the API.",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    }
  };

  const getAverageScore = () => {
    if (quizAttempts.length === 0) return 0;
    return (
      quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0) /
      quizAttempts.length
    );
  };

  const getCompletedTasks = () => {
    return studyTasks.filter((task) => task.completed).length;
  };

  const getTotalStudyTime = () => {
    return studyTasks
      .filter((task) => task.completed)
      .reduce((sum, task) => sum + task.estimated_minutes, 0);
  };

  const getTopSubjects = () => {
    const subjectScores = {};
    quizAttempts.forEach((attempt) => {
      if (attempt.quiz?.topic?.subject) {
        const subject = attempt.quiz.topic.subject;
        if (!subjectScores[subject]) {
          subjectScores[subject] = { total: 0, count: 0 };
        }
        subjectScores[subject].total += attempt.score;
        subjectScores[subject].count += 1;
      }
    });

    return Object.entries(subjectScores)
      .map(([subject, data]) => ({
        subject,
        average: data.total / data.count,
        attempts: data.count,
      }))
      .sort((a, b) => b.average - a.average)
      .slice(0, 3);
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
        <p className="text-gray-600">Please log in to access your profile.</p>
      </div>
    );
  }

  const topSubjects = getTopSubjects();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your account and view your learning progress
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Information */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Profile Information
              </h2>
              {!isEditing ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button size="sm" onClick={handleEditSubmit}>
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-semibold text-2xl">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username || "User"}
              </h3>
              <p className="text-gray-500">{user?.email}</p>
            </div>

            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={editForm.first_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, first_name: e.target.value })
                    }
                    placeholder="Enter first name"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={editForm.last_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, last_name: e.target.value })
                    }
                    placeholder="Enter last name"
                  />
                </div>
                <div>
                  <Label htmlFor="grade">Grade</Label>
                  <Input
                    id="grade"
                    value={editForm.grade}
                    onChange={(e) =>
                      setEditForm({ ...editForm, grade: e.target.value })
                    }
                    placeholder="Enter grade"
                  />
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700">{user?.email}</span>
                </div>
                {user?.first_name && (
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      {user.first_name} {user.last_name}
                    </span>
                  </div>
                )}
                {user?.grade && (
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-gray-500 mr-3" />
                    <span className="text-sm text-gray-700">
                      Grade {user.grade}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-3" />
                  <span className="text-sm text-gray-700">
                    Member since{" "}
                    {user?.date_joined
                      ? new Date(user.date_joined).toLocaleDateString()
                      : "Recently"}
                  </span>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <Button
                onClick={logout}
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Stats and Progress */}
        <div className="lg:col-span-2">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Trophy className="h-6 w-6 text-yellow-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Avg Score</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round(getAverageScore())}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Target className="h-6 w-6 text-green-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Quizzes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {quizAttempts.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Award className="h-6 w-6 text-blue-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Tasks Done</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {getCompletedTasks()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Clock className="h-6 w-6 text-purple-600 mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Study Time</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {Math.round(getTotalStudyTime() / 60)}h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Subjects */}
          {topSubjects.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Performing Subjects
              </h3>
              <div className="space-y-4">
                {topSubjects.map((subject, index) => (
                  <div
                    key={subject.subject}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3 ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                            ? "bg-gray-400"
                            : "bg-orange-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {subject.subject}
                        </p>
                        <p className="text-sm text-gray-500">
                          {subject.attempts} attempts
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {Math.round(subject.average)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recent Quiz Attempts
            </h3>
            {quizAttempts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No quiz attempts yet. Start learning!
              </p>
            ) : (
              <div className="space-y-4">
                {quizAttempts.slice(0, 5).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Quiz #{attempt.quiz}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(attempt.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          attempt.score >= 80
                            ? "text-green-600"
                            : attempt.score >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {Math.round(attempt.score)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
