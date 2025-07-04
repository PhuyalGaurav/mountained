"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Users,
  Clock,
  Award,
} from "lucide-react";

export default function CoursesPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurriculumTopics();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterTopics();
  }, [topics, searchTerm, selectedGrade, selectedSubject]);

  const fetchCurriculumTopics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurriculumTopics();
      const topicsData = response.data;
      setTopics(topicsData);

      // Extract unique grades and subjects for filters
      const uniqueGrades = [
        ...new Set(topicsData.map((topic) => topic.grade)),
      ].sort();
      const uniqueSubjects = [
        ...new Set(topicsData.map((topic) => topic.subject)),
      ].sort();

      setGrades(uniqueGrades);
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching curriculum topics:", error);
      toast({
        title: "Error",
        description: "Failed to load courses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = topics;

    if (searchTerm) {
      filtered = filtered.filter(
        (topic) =>
          topic.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.unit.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedGrade) {
      filtered = filtered.filter((topic) => topic.grade === selectedGrade);
    }

    if (selectedSubject) {
      filtered = filtered.filter((topic) => topic.subject === selectedSubject);
    }

    setFilteredTopics(filtered);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedGrade("");
    setSelectedSubject("");
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
        <p className="text-gray-600">Please log in to access courses.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
            <p className="text-gray-600 mt-2">
              Explore curriculum topics and learning materials
            </p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Request New Course
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Subjects</option>
            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          {(searchTerm || selectedGrade || selectedSubject) && (
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
              <p className="text-sm font-medium text-gray-500">Total Topics</p>
              <p className="text-2xl font-semibold text-gray-900">
                {topics.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Filter className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Subjects</p>
              <p className="text-2xl font-semibold text-gray-900">
                {subjects.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Grades</p>
              <p className="text-2xl font-semibold text-gray-900">
                {grades.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Filtered</p>
              <p className="text-2xl font-semibold text-gray-900">
                {filteredTopics.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
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
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                      {topic.grade}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded ml-2">
                      {topic.subject}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {topic.topic}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Unit: {topic.unit}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Est. 2-3 hours</span>
                </div>
                <Button size="sm" variant="outline">
                  Start Learning
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
