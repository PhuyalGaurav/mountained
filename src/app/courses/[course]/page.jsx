"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@/app/services/auth-context";
import { apiService } from "@/app/services/api";
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
  CheckCircle,
  Plus,
} from "lucide-react";

export default function CourseDetails({ params }) {
  const resolvedParams = use(params);
  const { course: courseId } = resolvedParams;
  const { isAuthenticated, isLoading, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [topic, setTopic] = useState(null);
  const [learningMaterials, setLearningMaterials] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [studyTasks, setStudyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("quizzes");
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

      // Fetch related content in parallel
      const [
        materialsResponse,
        quizzesResponse,
        flashcardsResponse,
        summariesResponse,
        studyTasksResponse,
      ] = await Promise.all([
        apiService.getLearningMaterials(),
        apiService.getQuizzes(),
        apiService.getFlashcards(),
        apiService.getSummaries(),
        apiService.getStudyTasks(),
      ]);

      console.log('All learning materials:', materialsResponse.data);
      console.log('Current course ID:', courseId);

      const filterByTopic = (item) => {
        const matches = item.topic === parseInt(courseId) ||
          item.topic?.id === parseInt(courseId);
        console.log(`Item ${item.id}: topic=${item.topic}, matches=${matches}`);
        return matches;
      };

      const filteredMaterials = materialsResponse.data.filter(filterByTopic);
      console.log('Filtered learning materials:', filteredMaterials);

      setLearningMaterials(filteredMaterials);
      setQuizzes(quizzesResponse.data.filter(filterByTopic));
      setFlashcards(flashcardsResponse.data.filter(filterByTopic));
      setSummaries(summariesResponse.data.filter(filterByTopic));
      setStudyTasks(studyTasksResponse.data.filter(filterByTopic));
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

      // Check if user exists
      if (!user?.id) {
        toast({
          title: "User Error",
          description: "Please log in again to generate content.",
          variant: "destructive",
        });
        return;
      }

      const data = { 
        topic_id: parseInt(courseId),
        title: `${type === 'quiz' ? 'Quiz' : type === 'flashcards' ? 'Flashcards' : type === 'studyTasks' ? 'Study Tasks' : 'Summary'} for ${topic?.topic || 'Topic'}`,
        difficulty: 'medium',
        created_by: user.id
      };

      let response;

      // If no materialId, create a basic learning material first or use topic-based generation
      if (!materialId) {
        console.log('No learning material found, attempting direct generation...');
        // For now, let's try to generate without materialId and see what the API expects
        switch (type) {
          case "flashcards":
            response = await apiService.createFlashcard(data);
            break;
          case "quiz":
            response = await apiService.createQuiz(data);
            break;
          case "studyTasks":
            response = await apiService.createStudyTask(data);
            break;
          case "summary":
            response = await apiService.createSummary(data);
            break;
          default:
            throw new Error("Unknown generation type");
        }
      } else {
        switch (type) {
          case "flashcards":
            response = await apiService.generateFlashcards(materialId, data);
            break;
          case "quiz":
            response = await apiService.generateQuiz(materialId, data);
            break;
          case "studyTasks":
            response = await apiService.generateStudyTasks(materialId, data);
            break;
          case "summary":
            response = await apiService.generateSummary(materialId, data);
            break;
          default:
            throw new Error("Unknown generation type");
        }
      }

      console.log(`${type} generation response:`, response.data);
      
      toast({
        title: "Success!",
        description: `${type === 'quiz' ? 'Quiz' : type === 'flashcards' ? 'Flashcards' : type === 'studyTasks' ? 'Study Tasks' : 'Summary'} generated successfully!`,
      });
      
      // Refresh the page data after a short delay to allow backend processing
      setTimeout(() => {
        fetchCourseData();
      }, 2000);
      
    } catch (error) {
      console.error(`Error generating ${type}:`, error);
      
      // Handle specific backend errors
      let errorMessage = "An unexpected error occurred.";
      
      if (error.response?.status === 500) {
        if (error.response?.data?.detail?.includes('created_by')) {
          errorMessage = "User authentication error. Please log out and log back in.";
        } else {
          errorMessage = "Server error occurred. The content generation service may be temporarily unavailable.";
        }
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.detail || error.response?.data?.error || "Invalid request. Please check your input.";
      } else if (error.response?.status === 404) {
        errorMessage = "Learning material not found. Please try refreshing the page.";
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please log in again.";
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Generation Failed",
        description: errorMessage,
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

      {/* AI-Generated Resources */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("quizzes")}
              className={`${
                activeTab === "quizzes"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Quizzes ({quizzes.length})
            </button>
            <button
              onClick={() => setActiveTab("flashcards")}
              className={`${
                activeTab === "flashcards"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Flashcards ({flashcards.length})
            </button>
            <button
              onClick={() => setActiveTab("summaries")}
              className={`${
                activeTab === "summaries"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Summaries ({summaries.length})
            </button>
            <button
              onClick={() => setActiveTab("studyTasks")}
              className={`${
                activeTab === "studyTasks"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Study Tasks ({studyTasks.length})
            </button>
          </nav>
        </div>
        <div className="mt-6">
          {activeTab === "quizzes" && (
            <ContentRenderer
              type="quiz"
              generating={generating.quiz}
              onGenerate={() => {
                // Build URL parameters for quiz creation
                const params = new URLSearchParams();
                if (topic?.topic) params.set('topic', topic.topic);
                if (topic?.subject) params.set('subject', topic.subject);
                if (topic?.grade) params.set('grade', topic.grade);
                if (learningMaterials[0]?.id) params.set('material', learningMaterials[0].id);
                
                router.push(`/quizzes/create?${params.toString()}`);
              }}
              content={quizzes}
              topic={topic}
              router={router}
              learningMaterialsExist={learningMaterials.length > 0}
            />
          )}
          {activeTab === "flashcards" && (
            <ContentRenderer
              type="flashcards"
              generating={generating.flashcards}
              onGenerate={() =>
                generateContent("flashcards", learningMaterials[0]?.id)
              }
              content={flashcards}
              learningMaterialsExist={learningMaterials.length > 0}
            />
          )}
          {activeTab === "summaries" && (
            <ContentRenderer
              type="summary"
              generating={generating.summary}
              onGenerate={() =>
                generateContent("summary", learningMaterials[0]?.id)
              }
              content={summaries}
              learningMaterialsExist={learningMaterials.length > 0}
            />
          )}
          {activeTab === "studyTasks" && (
            <ContentRenderer
              type="studyTasks"
              generating={generating.studyTasks}
              onGenerate={() =>
                generateContent("studyTasks", learningMaterials[0]?.id)
              }
              content={studyTasks}
              learningMaterialsExist={learningMaterials.length > 0}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ContentRenderer = ({
  type,
  generating,
  onGenerate,
  content,
  topic,
  router,
  learningMaterialsExist,
}) => {
  const typeConfig = {
    quiz: {
      title: "Quiz",
      icon: FileQuestion,
      generationInProgress: "Creating Quiz...",
      generateButtonText: "Create Quiz",
      emptyState: "No quizzes created for this topic yet.",
    },
    flashcards: {
      title: "Flashcards",
      icon: CreditCard,
      generationInProgress: "Generating Flashcards...",
      generateButtonText: "Generate Flashcards",
      emptyState: "No flashcards generated for this topic yet.",
    },
    summary: {
      title: "Summary",
      icon: FileText,
      generationInProgress: "Generating Summary...",
      generateButtonText: "Generate Summary",
      emptyState: "No summaries generated for this topic yet.",
    },
    studyTasks: {
      title: "Study Tasks",
      icon: ClipboardList,
      generationInProgress: "Generating Study Tasks...",
      generateButtonText: "Generate Study Tasks",
      emptyState: "No study tasks generated for this topic yet.",
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={onGenerate}
          disabled={generating}
          className="flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {config.generationInProgress}
            </>
          ) : (
            <>
              {type === 'quiz' ? (
                <Plus className="h-4 w-4" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {config.generateButtonText}
            </>
          )}
        </Button>
      </div>

      {!learningMaterialsExist && content.length === 0 && (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            No content generated yet for this topic.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Click the &quot;{config.generateButtonText}&quot; button above to create your first {config.title.toLowerCase()}.
          </p>
        </div>
      )}

      {learningMaterialsExist && content.length === 0 && (
        <div className="text-center py-8">
          <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">{config.emptyState}</p>
          <p className="text-sm text-gray-400 mt-2">
            Click the &quot;{config.generateButtonText}&quot; button above to create your first {config.title.toLowerCase()}.
          </p>
        </div>
      )}

      {content.length > 0 && (
        <div
          className={type === 'flashcards' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}
        >
          {content.map((item) => {
            if (type === "quiz") {
              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border"
                >
                  <h3 className="font-semibold">Quiz on {topic?.topic || 'Topic'}</h3>
                  <p className="text-sm text-gray-500">
                    Difficulty: {item.difficulty || 'Medium'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.questions?.length || 0} questions
                  </p>
                  <Button
                    className="mt-2"
                    size="sm"
                    onClick={() => router.push(`/quizzes/${item.id}`)}
                  >
                    Take Quiz
                  </Button>
                </div>
              );
            }
            if (type === "flashcards") {
              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border"
                >
                  <p className="font-semibold">{item.front || item.question}</p>
                  <hr className="my-2" />
                  <p>{item.back || item.answer}</p>
                </div>
              );
            }
            if (type === "summary") {
              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border"
                >
                  <h3 className="font-semibold">Summary</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {item.summary_text || item.content || item.text}
                  </p>
                  <Button className="mt-2" size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              );
            }
            if (type === "studyTasks") {
              return (
                <div
                  key={item.id}
                  className="bg-gray-50 p-4 rounded-lg shadow-sm border"
                >
                  <h3 className="font-semibold">Study Tasks</h3>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {(item.tasks || item.task_list || []).map((task, index) => (
                      <li key={index} className="text-gray-700">
                        {typeof task === 'string' ? task : task.description || task.task}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
};
