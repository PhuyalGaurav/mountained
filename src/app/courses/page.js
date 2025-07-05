"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  FileText,
  GraduationCap,
} from "lucide-react";

export default function CoursesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState([]);
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const fetchCurriculumTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCurriculumTopics();
      const topicsData = response.data || [];
      setTopics(topicsData);

      // Extract unique grades and subjects for filters with error handling
      const uniqueGrades = [
        ...new Set(topicsData
          .map((topic) => topic.grade)
          .filter(grade => grade != null && grade !== '')
        ),
      ].sort();
      
      const uniqueSubjects = [
        ...new Set(topicsData
          .map((topic) => topic.subject)
          .filter(subject => subject != null && subject !== '')
        ),
      ].sort();

      setGrades(uniqueGrades);
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error("Error fetching curriculum topics:", error);
      
      let errorMessage = "Failed to load courses. Please try again.";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please log in again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterTopics = useCallback(() => {
    setFiltering(true);
    
    // Add a small delay to show loading state for better UX
    setTimeout(() => {
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
      setFiltering(false);
    }, 100);
  }, [topics, searchTerm, selectedGrade, selectedSubject]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurriculumTopics();
    }
  }, [isAuthenticated, fetchCurriculumTopics]);

  useEffect(() => {
    filterTopics();
  }, [filterTopics]);

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
          <Button className="bg-orange/80 hover:border-solid">
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
              aria-label="Search courses by topic, subject, or unit"
            />
          </div>

          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter by grade"
          >
            <option value="">All Grades</option>
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                Grade {grade}
              </option>
            ))}
          </select>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            aria-label="Filter by subject"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <FileText className="h-8 w-8 text-green-600" />
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
              <GraduationCap className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Grade Levels</p>
              <p className="text-2xl font-semibold text-gray-900">
                {grades.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      {loading || filtering ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white p-6 rounded-lg shadow-sm border animate-pulse"
              aria-label="Loading course information"
            >
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses found
          </h3>
          <p className="text-gray-500">
            {searchTerm || selectedGrade || selectedSubject
              ? "Try adjusting your search or filter criteria."
              : "No courses are available at the moment."}
          </p>
          {(searchTerm || selectedGrade || selectedSubject) && (
            <Button 
              variant="outline" 
              onClick={clearFilters}
              className="mt-4"
            >
              Clear All Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md hover:border-orange-200 transition-all duration-200 cursor-pointer group focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              onClick={() => router.push(`/courses/${topic.id}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  router.push(`/courses/${topic.id}`);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`View course: ${topic.topic} - ${topic.subject}, Grade ${topic.grade}`}
            >
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${getSubjectColor(
                      topic.subject
                    )}`}
                    aria-label={`Subject: ${topic.subject}`}
                  >
                    {topic.subject}
                  </span>
                  <span 
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                    aria-label={`Grade level: ${topic.grade}`}
                  >
                    Grade {topic.grade}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors line-clamp-2">
                  {topic.topic}
                </h3>
                
                <p className="text-sm text-gray-600 mb-4">
                  <span className="font-medium">Unit:</span> {topic.unit}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center text-sm text-gray-500">
                    <BookOpen className="h-4 w-4 mr-1" aria-hidden="true" />
                    <span>Course Topic</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-orange-600 transition-colors" aria-hidden="true" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const getSubjectColor = (subject) => {
  switch (subject.toLowerCase()) {
    case "mathematics":
      return "bg-blue-100 text-blue-800";
    case "science":
      return "bg-green-100 text-green-800";
    case "english":
      return "bg-yellow-100 text-yellow-800";
    case "social studies":
      return "bg-purple-100 text-purple-800";
    case "computer science":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};
