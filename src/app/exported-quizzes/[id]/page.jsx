"use client";

import { useState, useEffect, use } from "react";
import { apiService } from "@/app/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QuestionCard } from "@/components/ui/quiz-progress";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Share,
  Clock,
  Target,
  BookOpen,
  Calendar,
  Download,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

export default function ExportedQuizView({ params }) {
  const resolvedParams = use(params);
  const { id: exportedQuizId } = resolvedParams;
  const { toast } = useToast();
  const router = useRouter();

  const [exportedQuiz, setExportedQuiz] = useState(null);
  const [originalQuiz, setOriginalQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [exportedQuizData, setExportedQuizData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExportedQuiz = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await apiService.getExportedQuiz(exportedQuizId);
        console.log("Exported quiz data:", response.data);
        
        setExportedQuiz(response.data);
        
        // Try to fetch the exported file data if available
        if (response.data.file) {
          try {
            const fileResponse = await fetch(response.data.file);
            if (fileResponse.ok) {
              const fileData = await fileResponse.json();
              console.log("Exported quiz file data:", fileData);
              setExportedQuizData(fileData);
              if (fileData.questions) {
                setQuestions(fileData.questions);
              }
            }
          } catch (fileError) {
            console.error("Error fetching exported quiz file:", fileError);
          }
        }
        
        // If there's a reference to the original quiz, fetch its data as fallback
        if (response.data.quiz && !exportedQuizData) {
          try {
            const [quizResponse, questionsResponse] = await Promise.all([
              apiService.getQuiz(response.data.quiz),
              apiService.getQuizQuestions(response.data.quiz)
            ]);
            
            setOriginalQuiz(quizResponse.data);
            if (!questions.length) {
              setQuestions(questionsResponse.data);
            }
          } catch (quizError) {
            console.error("Error fetching original quiz data:", quizError);
            // Don't fail the whole page if we can't fetch the original quiz
            toast({
              title: "Warning",
              description: "Could not load quiz details, but the exported quiz is still available.",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching exported quiz:", error);
        setError(error);
        
        toast({
          title: "Error",
          description: "Failed to load exported quiz. Please check the link and try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (exportedQuizId) {
      fetchExportedQuiz();
    }
  }, [exportedQuizId, toast]);

  const shareQuiz = async () => {
    try {
      const shareableUrl = window.location.href;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareableUrl);
        toast({
          title: "Link Copied!",
          description: "Shareable quiz link copied to clipboard.",
        });
      } else {
        toast({
          title: "Share Link",
          description: `Quiz ID: ${exportedQuizId}`,
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exported quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !exportedQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <Button
              onClick={() => router.push("/exported-quizzes")}
              variant="ghost"
              size="sm"
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exported Quizzes
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quiz Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The exported quiz you're looking for doesn't exist or may have been deleted.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
              <Button 
                onClick={() => router.push("/exported-quizzes")}
                variant="outline"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                View All Exported Quizzes
              </Button>
              
              <Button 
                onClick={() => router.push('/quizzes')}
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <Target className="h-4 w-4 mr-2" />
                Browse Quizzes
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={() => router.push("/exported-quizzes")}
              variant="outline"
              size="sm"
              className="hover:shadow-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Exported Quizzes
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={shareQuiz}
                variant="outline"
                size="sm"
                className="hover:shadow-sm"
              >
                <Share className="h-4 w-4 mr-2" />
                Share
              </Button>
              
              {exportedQuiz.file && (
                <Button
                  onClick={() => window.open(exportedQuiz.file, '_blank')}
                  variant="outline"
                  size="sm"
                  className="hover:shadow-sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download File
                </Button>
              )}
              
              {originalQuiz && (
                <Button
                  onClick={() => router.push(`/quizzes/${originalQuiz.id}`)}
                  variant="outline"
                  size="sm"
                  className="hover:shadow-sm"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Original Quiz
                </Button>
              )}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {exportedQuizData?.title || originalQuiz?.title || "Exported Quiz"}
          </h1>
          
          <p className="text-gray-600 mb-4">
            {exportedQuizData?.description || 
             (originalQuiz ? `Quiz covering ${originalQuiz.topic?.topic || "various topics"}` : 
              "No description available")}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium border border-blue-200">
              {exportedQuizData?.subject || originalQuiz?.topic?.subject || "General"}
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium border border-green-200">
              Grade {exportedQuizData?.grade || originalQuiz?.topic?.grade || "N/A"}
            </span>
            <span className={`
              px-3 py-1 rounded-full font-medium border
              ${(exportedQuizData?.difficulty || originalQuiz?.difficulty) === 'easy' ? 'bg-green-100 text-green-800 border-green-200' :
                (exportedQuizData?.difficulty || originalQuiz?.difficulty) === 'medium' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-red-100 text-red-800 border-red-200'}
            `}>
              {exportedQuizData?.difficulty || originalQuiz?.difficulty || "medium"}
            </span>
            <span className="flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium border border-gray-200">
              <Target className="h-4 w-4 mr-1" />
              {questions.length || exportedQuizData?.total_questions || 0} questions
            </span>
            <span className="flex items-center bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium border border-purple-200">
              <Clock className="h-4 w-4 mr-1" />
              {exportedQuizData?.time_limit || originalQuiz?.time_limit || 30} minutes
            </span>
          </div>
        </div>

        {/* Quiz Metadata */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Quiz Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Exported Date</p>
                <p className="font-medium">
                  {formatDate(exportedQuiz.metadata?.export_date || exportedQuiz.created_at)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Questions</p>
                <p className="font-medium">{exportedQuiz.questions?.length || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Estimated Time</p>
                <p className="font-medium">{exportedQuiz.metadata?.estimated_time || exportedQuiz.time_limit || 30} minutes</p>
              </div>
              <div>
                <p className="text-gray-600">Export ID</p>
                <p className="font-medium font-mono text-xs">{exportedQuiz.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Preview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Questions Preview</CardTitle>
            <CardDescription>
              Review all questions and answers in this exported quiz
            </CardDescription>
          </CardHeader>
          <CardContent>
            {questions.length > 0 ? (
              <div className="space-y-6">
                {questions.map((question, index) => (
                  <QuestionCard
                    key={index}
                    question={{
                      ...question,
                      question: question.question_text,
                      id: index + 1
                    }}
                    questionIndex={index}
                    totalQuestions={questions.length}
                    userAnswer={null}
                    onAnswerChange={() => {}} // Read-only mode
                    showReview={true}
                    correctAnswer={question.correct_option}
                    isCorrect={null} // No user answer to compare
                    readonly={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions available in this exported quiz.</p>
                {exportedQuiz.file && (
                  <p className="text-sm text-gray-500 mt-2">
                    File: {exportedQuiz.file.split('/').pop()}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Footer */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={shareQuiz}
                variant="outline"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <Share className="h-4 w-4 mr-2" />
                Share Quiz
              </Button>
              
              {exportedQuiz.metadata?.original_quiz_id && (
                <Button
                  onClick={() => router.push(`/quizzes/${exportedQuiz.metadata.original_quiz_id}`)}
                  className="flex-1 sm:flex-none min-w-[140px]"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Take Original Quiz
                </Button>
              )}
              
              <Button
                onClick={() => router.push("/quizzes")}
                variant="outline"
                className="flex-1 sm:flex-none min-w-[140px]"
              >
                <Target className="h-4 w-4 mr-2" />
                Browse More Quizzes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
