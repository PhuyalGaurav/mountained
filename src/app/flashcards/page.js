"use client";

import { useEffect, useState } from "react";
import { Flashcard } from "../../components/ui/flashcard";
import { Button } from "../../components/ui/button";
import { apiService } from "../services/api";
import { useAuth } from "../services/auth-context";
import { useToast } from "../../hooks/use-toast";
import { useRouter } from "next/navigation";
import { Input } from "../../components/ui/input";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function FlashcardsPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");

  const LeftIcon = ChevronLeft;
  const RightIcon = ChevronRight;

  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    remembered: 0,
    total: 0,
  });
  const [loadingCards, setLoadingCards] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: "all",
    curriculum: "all",
    topic: "all",
    search: "",
  });
  const [curriculums, setCurriculums] = useState([
    {
      id: "math",
      name: "Mathematics",
      topics: ["Algebra", "Geometry", "Calculus"],
    },
    {
      id: "science",
      name: "Science",
      topics: ["Physics", "Chemistry", "Biology"],
    },
    {
      id: "history",
      name: "History",
      topics: ["World History", "Geography", "Civics"],
    },
    {
      id: "language",
      name: "Language Arts",
      topics: ["Grammar", "Literature", "Writing"],
    },
  ]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      fetchFlashcards();
    }
  }, [isAuthenticated, isLoading]);

  const fetchFlashcards = async () => {
    try {
      setLoadingCards(true);
      const response = await apiService.getFlashcards().catch((err) => {
        console.warn("Flashcards not available:", err);
        return {
          data: [
            {
              id: 1,
              front: "What is the capital of France?",
              back: "Paris",
              difficulty: "easy",
              curriculum: "history",
              topic: "Geography",
            },
            {
              id: 2,
              front: "What is the chemical symbol for gold?",
              back: "Au",
              difficulty: "medium",
              curriculum: "science",
              topic: "Chemistry",
            },
            {
              id: 3,
              front: "What is the speed of light in meters per second?",
              back: "299,792,458 m/s",
              difficulty: "hard",
              curriculum: "science",
              topic: "Physics",
            },
          ],
        };
      });

      setFlashcards(response.data);
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      toast({
        title: "Error",
        description: "Failed to load flashcards. Using sample cards.",
        variant: "destructive",
      });
    } finally {
      setLoadingCards(false);
    }
  };

  const handleCardResult = (remembered) => {
    setStats((prev) => ({
      remembered: prev.remembered + (remembered ? 1 : 0),
      total: prev.total + 1,
    }));

    // Move to next card
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Finished all cards
      toast({
        title: "Session Complete!",
        description: `You remembered ${stats.remembered} out of ${stats.total} cards.`,
      });
      // Reset to start
      setCurrentIndex(0);
      setStats({ remembered: 0, total: 0 });
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const getFilteredCards = () => {
    return flashcards.filter((card) => {
      // Filter by difficulty
      if (
        filters.difficulty !== "all" &&
        card.difficulty !== filters.difficulty
      ) {
        return false;
      }

      // Filter by curriculum
      if (
        filters.curriculum !== "all" &&
        card.curriculum !== filters.curriculum
      ) {
        return false;
      }

      // Filter by topic
      if (filters.topic !== "all" && card.topic !== filters.topic) {
        return false;
      }

      // Filter by search term
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          card.front.toLowerCase().includes(searchTerm) ||
          card.back.toLowerCase().includes(searchTerm)
        );
      }

      return true;
    });
  };

  // Reset current index when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setStats({ remembered: 0, total: 0 });
  }, [filters]);

  const filteredCards = getFilteredCards();

  if (isLoading || loadingCards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Flashcards</h1>
        <p className="text-gray-600 mt-2">
          Test your knowledge with interactive flashcards!
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search Filter */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={filters.difficulty}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, difficulty: e.target.value }))
              }
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Curriculum Filter */}
          <div>
            <select
              value={filters.curriculum}
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  curriculum: e.target.value,
                  topic: "all", // Reset topic when curriculum changes
                }));
              }}
              className="w-full bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5"
            >
              <option value="all">All Subjects</option>
              {curriculums.map((curr) => (
                <option key={curr.id} value={curr.id}>
                  {curr.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-gray-600">
          Card {currentIndex + 1} of {filteredCards.length}
        </div>
        <div className="text-gray-600">
          Remembered: {stats.remembered}/{stats.total}
        </div>
      </div>

      <div className="flex items-center justify-center space-x-6">
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <LeftIcon className="w-8 h-8 text-gray-600" />
        </button>
        {flashcards.length > 0 ? (
          <Flashcard
            front={flashcards[currentIndex].front}
            back={flashcards[currentIndex].back}
            difficulty={flashcards[currentIndex].difficulty}
            onResult={handleCardResult}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No flashcards available.</p>
            <Button onClick={fetchFlashcards}>Refresh</Button>
          </div>
        )}
        <button
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          onClick={handleNext}
          disabled={currentIndex === flashcards.length - 1}
        >
          <RightIcon className="w-8 h-8 text-gray-600" />
        </button>
      </div>

      <div className="mt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-gray-500">
              Session Progress
            </p>
            <p className="text-2xl font-semibold text-gray-900">
              {Math.round((stats.total / flashcards.length) * 100)}%
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-gray-500">Cards Reviewed</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.total}
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-gray-500">Success Rate</p>
            <p className="text-2xl font-semibold text-gray-900">
              {stats.total > 0
                ? Math.round((stats.remembered / stats.total) * 100)
                : 0}
              %
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <p className="text-sm font-medium text-gray-500">Remaining Cards</p>
            <p className="text-2xl font-semibold text-gray-900">
              {flashcards.length - currentIndex - 1}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
