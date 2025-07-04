"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
import { getCourseContent } from "@/app/services/courseContent";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileQuestion,
  CreditCard,
  ClipboardList,
  FileText,
  Loader2,
  Sparkles,
  Download,
} from "lucide-react";

export default function CourseDetails({ params }) {
  const { course: courseId } = params;
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [topic, setTopic] = useState(null);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [extractedTexts, setExtractedTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({
    flashcards: false,
    quiz: false,
    studyTasks: false,
    summary: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchCourseData();
    }
  }, [isAuthenticated, courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);

      // Fetch curriculum topic data
      const topicResponse = await apiService.getCurriculumTopic(courseId);
      setTopic(topicResponse.data);

      // Fetch learning materials
      const materialsResponse = await apiService.getLearningMaterials();
      const allMaterials = materialsResponse.data;

      // Filter materials related to this topic
      const relatedMaterials = allMaterials.filter(
        (material) =>
          material.topic === parseInt(courseId) ||
          material.topic?.id === parseInt(courseId)
      );
      setLearningMaterials(relatedMaterials);

      // Get extracted texts for this topic
      const texts = await getCourseContent(
        topicResponse.data.topic,
        topicResponse.data.subject
      );
      setExtractedTexts(texts);
    } catch (error) {
      console.error("Error fetching course data:", error);
      toast({
        title: "Error",
        description: "Failed to load course data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (type, materialId) => {
    try {
      setGenerating((prev) => ({ ...prev, [type]: true }));

      let response;
      const data = { topic_id: courseId };

      switch (type) {
        case "flashcards":
          response = await apiService.generateFlashcards(materialId, data);
          toast({
            title: "Success",
            description: "Flashcards generated successfully!",
          });
          break;
        case "quiz":
          response = await apiService.generateQuiz(materialId, data);
          toast({
            title: "Success",
            description: "Quiz generated successfully!",
          });
          break;
        case "studyTasks":
          response = await apiService.generateStudyTasks(materialId, data);
          toast({
            title: "Success",
            description: "Study tasks generated successfully!",
          });
          break;
        case "summary":
          response = await apiService.generateSummary(materialId, data);
          toast({
            title: "Success",
            description: "Summary generated successfully!",
          });
          break;
        default:
          throw new Error("Unknown generation type");
      }

      // Refresh the page data
      await fetchCourseData();
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to generate ${type}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setGenerating((prev) => ({ ...prev, [type]: false }));
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Course not found.</p>
          <Button onClick={() => router.push("/courses")} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Button
          onClick={() => router.push("/courses")}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {topic.topic}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {topic.subject}
                </span>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Grade {topic.grade}
                </span>
                <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full">
                  {topic.unit}
                </span>
              </div>
              {topic.description && (
                <p className="text-gray-700 leading-relaxed">
                  {topic.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Generation Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Generate Learning Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {learningMaterials.length > 0 ? (
            learningMaterials.slice(0, 1).map((material) => (
              <div key={material.id} className="space-y-4">
                <Button
                  onClick={() => generateContent("flashcards", material.id)}
                  disabled={generating.flashcards}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  {generating.flashcards ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Generate Flashcards
                </Button>

                <Button
                  onClick={() => generateContent("quiz", material.id)}
                  disabled={generating.quiz}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  {generating.quiz ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileQuestion className="h-4 w-4" />
                  )}
                  Generate Quiz
                </Button>

                <Button
                  onClick={() => generateContent("studyTasks", material.id)}
                  disabled={generating.studyTasks}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  {generating.studyTasks ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ClipboardList className="h-4 w-4" />
                  )}
                  Generate Study Tasks
                </Button>

                <Button
                  onClick={() => generateContent("summary", material.id)}
                  disabled={generating.summary}
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                >
                  {generating.summary ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Generate Summary
                </Button>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No learning materials available for content generation.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Upload learning materials to enable AI-powered content
                generation.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Learning Materials */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Learning Materials
        </h2>
        {learningMaterials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {learningMaterials.map((material) => (
              <div
                key={material.id}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {material.title || `Material ${material.id}`}
                    </h3>
                    {material.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {material.description}
                      </p>
                    )}
                  </div>
                  <Download className="h-5 w-5 text-gray-400" />
                </div>

                <div className="space-y-2">
                  {material.file_path && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">File:</span>{" "}
                      {material.file_path}
                    </div>
                  )}
                  {material.upload_date && (
                    <div className="text-xs text-gray-500">
                      <span className="font-medium">Uploaded:</span>{" "}
                      {new Date(material.upload_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No learning materials available for this topic.
            </p>
          </div>
        )}
      </div>

      {/* Extracted Texts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Course Content
        </h2>
        {extractedTexts.length > 0 ? (
          <div className="space-y-6">
            {extractedTexts.map((text, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-sm border"
              >
                <h3 className="font-semibold text-gray-900 mb-3">
                  Content Section {index + 1}
                </h3>
                <div className="prose max-w-none text-gray-700">
                  <p className="whitespace-pre-wrap">{text}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              No extracted content available for this topic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
