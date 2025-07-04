"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";

export default function QuizzesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getQuizzes();
      setQuizzes(response.data);
      setFilteredQuizzes(response.data);
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

    if (searchTerm) {
      filtered = filtered.filter((quiz) =>
        quiz.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quiz.topic?.topic?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDifficulty) {
      filtered = filtered.filter((quiz) => quiz.difficulty === selectedDifficulty);
    }

    setFilteredQuizzes(filtered);
  }, [quizzes, searchTerm, selectedDifficulty]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedDifficulty("");
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

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "in_progress":
        return "text-yellow-600";
      default:
        return "text-gray-600";
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
            <p className="text-gray-600 mt-2">
              Practice with your AI-generated quizzes
            </p>
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
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-blue-600" />
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
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizzes.filter(q => q.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {quizzes.filter(q => q.status === 'in_progress').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Filtered</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredQuizzes.length}
              </p>
            </div>
          </div>
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
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No quizzes found
          </h3>
          <p className="text-gray-500 mb-4">
            You haven&apos;t generated any quizzes yet.
          </p>
          <Button onClick={() => router.push("/courses")}>
            Generate Your First Quiz
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-in-out"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(
                      quiz.difficulty
                    )}`}
                  >
                    {quiz.difficulty || 'Medium'}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 h-16">
                  {quiz.title || `Quiz on ${quiz.topic?.topic || 'Topic'}`}
                </h3>

                <p className="text-sm text-gray-600 mb-4 h-10">
                  {quiz.topic?.subject} - Grade {quiz.topic?.grade}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                    <span>{new Date(quiz.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center">
                    <User className={`h-4 w-4 mr-1.5 ${getStatusColor(quiz.status)}`} />
                    <span className={getStatusColor(quiz.status)}>
                      {quiz.status === 'completed' ? 'Completed' : 
                       quiz.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={() => router.push(`/quizzes/${quiz.id}`)}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {quiz.status === 'completed' ? 'Review Quiz' : 'Start Quiz'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
