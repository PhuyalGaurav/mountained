"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Share,
  Eye,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Trash2,
  ExternalLink,
  FileText,
} from "lucide-react";

export default function ExportedQuizzes() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [exportedQuizzes, setExportedQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchExportedQuizzes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExportedQuizzes();
      const quizzes = response.data.results || response.data || [];
      
      console.log("Exported quizzes:", quizzes);
      setExportedQuizzes(quizzes);
    } catch (error) {
      console.error("Error fetching exported quizzes:", error);
      toast({
        title: "Error",
        description: "Failed to load exported quizzes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchExportedQuizzes();
    }
  }, [isAuthenticated]);

  const deleteExportedQuiz = async (quizId) => {
    try {
      setDeleting(quizId);
      await apiService.deleteExportedQuiz(quizId);
      
      // Remove from local state
      setExportedQuizzes(prev => prev.filter(quiz => quiz.id !== quizId));
      
      toast({
        title: "Quiz Deleted",
        description: "Exported quiz has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting exported quiz:", error);
      toast({
        title: "Error",
        description: "Failed to delete exported quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const shareQuiz = async (quiz) => {
    try {
      const shareableUrl = `${window.location.origin}/exported-quizzes/${quiz.id}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
        toast({
          title: "Link Copied!",
          description: "Shareable quiz link copied to clipboard.",
        });
      } else {
        toast({
          title: "Share Link",
          description: `Quiz ID: ${quiz.id}`,
        });
      }
    } catch (error) {
      console.error("Error sharing quiz:", error);
      toast({
        title: "Error",
        description: "Failed to copy share link.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access exported quizzes.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exported quizzes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.push("/quizzes")}
              variant="outline"
              size="sm"
              className="hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Quizzes
            </Button>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Exported Quizzes
          </h1>
          
          <p className="text-gray-600">
            Manage and share your exported quiz collection
          </p>
        </div>

        {/* Exported Quizzes Grid */}
        {exportedQuizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Download className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Exported Quizzes Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Start by exporting a quiz from the quiz details page.
              </p>
              <Button onClick={() => router.push("/quizzes")}>
                <Target className="h-4 w-4 mr-2" />
                Browse Quizzes
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exportedQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        Exported Quiz #{quiz.id}
                      </CardTitle>
                      <CardDescription className="mt-2 line-clamp-2">
                        {quiz.quiz ? `Reference to Quiz ID: ${quiz.quiz}` : "Standalone exported quiz"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Quiz Stats */}
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Download className="h-4 w-4 mr-2" />
                      Export ID: {quiz.id}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {formatDate(quiz.created_at)}
                    </div>
                    {quiz.quiz && (
                      <div className="flex items-center text-gray-600">
                        <Target className="h-4 w-4 mr-2" />
                        Original Quiz ID: {quiz.quiz}
                      </div>
                    )}
                    {quiz.file && (
                      <div className="flex items-center text-gray-600">
                        <FileText className="h-4 w-4 mr-2" />
                        <span className="truncate">{quiz.file.split('/').pop()}</span>
                      </div>
                    )}
                  </div>

                  {/* Export Info */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {quiz.file ? 'File Export' : 'Reference Export'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: #{quiz.id}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => router.push(`/exported-quizzes/${quiz.id}`)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {quiz.file && (
                      <Button
                        onClick={() => window.open(quiz.file, '_blank')}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => shareQuiz(quiz)}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Share className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    
                    <Button
                      onClick={() => deleteExportedQuiz(quiz.id)}
                      variant="outline"
                      size="sm"
                      disabled={deleting === quiz.id}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      {deleting === quiz.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
