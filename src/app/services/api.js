import axios from "axios";

const API_BASE_URL = "https://backend.mountained.phuyalgaurav.com.np/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem("accessToken", access);

          // Update cookie as well
          if (typeof window !== "undefined") {
            document.cookie = `accessToken=${access}; path=/; max-age=${
              7 * 24 * 60 * 60
            }; SameSite=strict; secure=${
              window.location.protocol === "https:"
            }`;
          }

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          // Clear cookies
          if (typeof window !== "undefined") {
            document.cookie =
              "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            document.cookie =
              "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          }
        }
      } else {
        // No refresh token, clear tokens
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          document.cookie =
            "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
          document.cookie =
            "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth functions
export const authService = {
  // Login function
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/token/`, {
        email,
        password,
      });

      const { access, refresh } = response.data;

      // Store tokens in cookies for middleware access
      if (typeof window !== "undefined") {
        document.cookie = `accessToken=${access}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=strict; secure=${window.location.protocol === "https:"}`;
        document.cookie = `refreshToken=${refresh}; path=/; max-age=${
          7 * 24 * 60 * 60
        }; SameSite=strict; secure=${window.location.protocol === "https:"}`;
      }

      // Store tokens in localStorage for client-side API calls
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout function
  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      // Clear cookies
      document.cookie =
        "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie =
        "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }
  },

  // Check if user is authenticated
  isAuthenticated() {
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("accessToken");
    }
    return false;
  },

  // Get current user
  async getCurrentUser() {
    try {
      const response = await api.get("/users/");
      return response.data[0]; // Assuming the API returns the current user
    } catch (error) {
      throw error;
    }
  },
};

// API endpoints
export const apiService = {
  // Analytics - New in v2
  getAnalytics: () => api.get("/analytics/"),
  createAnalytics: (data) => api.post("/analytics/", data),
  getAnalyticsDashboard: () => api.get("/analytics/dashboard/"),
  getAnalyticsSummaryStats: () => api.get("/analytics/summary_stats/"),
  updateAnalytics: () => api.post("/analytics/update_analytics/"),
  getAnalyticsById: (id) => api.get(`/analytics/${id}/`),
  updateAnalyticsById: (id, data) => api.put(`/analytics/${id}/`, data),
  deleteAnalyticsById: (id) => api.delete(`/analytics/${id}/`),

  // Curriculum Topics
  getCurriculumTopics: () => api.get("/curriculum-topics/"),
  getCurriculumTopic: (id) => api.get(`/curriculum-topics/${id}/`),

  // Exported Quizzes - New in v2
  getExportedQuizzes: () => api.get("/exported-quizzes/"),
  createExportedQuiz: (data) => {
    // Handle FormData separately from JSON data
    const config = {};
    if (data instanceof FormData) {
      config.headers = {
        "Content-Type": "multipart/form-data",
      };
    }
    return api.post("/exported-quizzes/", data, config);
  },
  getExportedQuiz: (id) => api.get(`/exported-quizzes/${id}/`),
  updateExportedQuiz: (id, data) => api.put(`/exported-quizzes/${id}/`, data),
  deleteExportedQuiz: (id) => api.delete(`/exported-quizzes/${id}/`),

  // Flashcards
  getFlashcards: () => api.get("/flashcards/"),
  createFlashcard: (data) => api.post("/flashcards/", data),
  getFlashcard: (id) => api.get(`/flashcards/${id}/`),
  updateFlashcard: (id, data) => api.put(`/flashcards/${id}/`, data),
  deleteFlashcard: (id) => api.delete(`/flashcards/${id}/`),

  // Learning Materials
  getLearningMaterials: () => api.get("/learning-materials/"),
  createLearningMaterial: (data) => {
    // Handle FormData separately from JSON data
    const config = {};
    if (data instanceof FormData) {
      // Don't set Content-Type for FormData, let browser set it with boundary
      config.headers = {};
    }
    return api.post("/learning-materials/", data, config);
  },
  uploadLearningMaterial: (data) => {
    // Alias for createLearningMaterial to make upload intent clearer
    const config = {};
    if (data instanceof FormData) {
      config.headers = {};
    }
    return api.post("/learning-materials/", data, config);
  },
  getLearningMaterial: (id) => api.get(`/learning-materials/${id}/`),
  updateLearningMaterial: (id, data) =>
    api.put(`/learning-materials/${id}/`, data),
  deleteLearningMaterial: (id) => api.delete(`/learning-materials/${id}/`),

  // Learning Materials Generation Methods - New in v2
  generateFlashcards: (id, data) =>
    api.post(`/learning-materials/${id}/generate_flashcards/`, data),
  generateQuiz: (id, data) =>
    api.post(`/learning-materials/${id}/generate_quiz/`, data),
  generateQuizFromFile: (data) =>
    api.post(`/learning-materials/generate_quiz_from_file/`, data),
  generateStudyTasks: (id, data) =>
    api.post(`/learning-materials/${id}/generate_study_tasks/`, data),
  generateSummary: (id, data) =>
    api.post(`/learning-materials/${id}/generate_summary/`, data),

  // Personalized Curriculum
  getPersonalizedCurriculum: () => api.get("/personalized-curriculum/"),
  getPersonalizedCurriculumById: (id) =>
    api.get(`/personalized-curriculum/${id}/`),

  // Quiz Attempts
  getQuizAttempts: () => api.get("/quiz-attempts/"),
  createQuizAttempt: (data) => api.post("/quiz-attempts/", data),
  getQuizAttempt: (id) => api.get(`/quiz-attempts/${id}/`),
  updateQuizAttempt: (id, data) => api.put(`/quiz-attempts/${id}/`, data),
  deleteQuizAttempt: (id) => api.delete(`/quiz-attempts/${id}/`),

  // Quizzes
  getQuizzes: () => api.get("/quizzes/"),
  createQuiz: (data) => api.post("/quizzes/", data),
  getQuiz: (id) => api.get(`/quizzes/${id}/`),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}/`, data),
  deleteQuiz: (id) => api.delete(`/quizzes/${id}/`),

  // Quiz Generation Methods - New in v2
  generateQuizQuestions: (id, data) =>
    api.post(`/quizzes/${id}/generate_questions/`, data),
  getQuizQuestions: (id) => api.get(`/quizzes/${id}/questions/`),

  // Quiz submission - try backend first, fallback to local calculation
  submitQuizAnswers: async (quizId, answersData, questions) => {
    console.log("=== API SERVICE SUBMISSION DEBUG ===");
    console.log("Quiz ID:", quizId);
    console.log("Answers data:", answersData);
    console.log("Questions:", questions);

    // First, try to submit to the backend quiz submission endpoint
    try {
      console.log(
        "Attempting to submit to backend quiz submission endpoint..."
      );
      const response = await api.post(
        `/quizzes/${quizId}/submit_answers/`,
        answersData
      );
      console.log("✅ Backend submission successful:", response.data);

      // Validate the response data before returning
      const responseData = response.data;

      // Check if we got a valid score
      if (typeof responseData.score === "number" && responseData.score >= 0) {
        console.log("✅ Backend returned valid score:", responseData.score);
        return response;
      } else {
        console.warn(
          "⚠️ Backend returned invalid/missing score, falling back to local calculation"
        );
        console.log("Backend response data:", responseData);
        // Don't return early - fall through to local calculation
      }
    } catch (backendError) {
      console.log("❌ Backend quiz submission failed:", backendError);
      console.log("Status:", backendError.response?.status);
      console.log("Error data:", backendError.response?.data);

      // If backend submission fails, fall back to local calculation and manual attempt creation
      console.log(
        "Falling back to local calculation and manual quiz attempt creation..."
      );
    }

    // Calculate quiz results locally
    const questionAttempts = [];
    let correctCount = 0;

    // Process each question and determine if the answer is correct
    questions.forEach((question) => {
      const userAnswer = answersData.answers[question.id];
      console.log(`\n=== Processing question ${question.id} ===`);
      console.log("User answer:", userAnswer, "(type:", typeof userAnswer, ")");
      console.log(
        "Question correct_option:",
        question.correct_option,
        "(type:",
        typeof question.correct_option,
        ")"
      );
      console.log(
        "Question correct_answer:",
        question.correct_answer,
        "(type:",
        typeof question.correct_answer,
        ")"
      );

      if (userAnswer) {
        // Get the correct key (could be from correct_option or correct_answer field)
        const correctKey = question.correct_option || question.correct_answer;
        console.log(
          "Determined correct key:",
          correctKey,
          "(type:",
          typeof correctKey,
          ")"
        );

        // Normalize both values to strings and trim whitespace for comparison
        const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
        const normalizedCorrectKey = String(correctKey).trim().toLowerCase();

        console.log("Normalized comparison:", {
          userAnswer: normalizedUserAnswer,
          correctKey: normalizedCorrectKey,
          originalUserAnswer: userAnswer,
          originalCorrectKey: correctKey,
        });

        // Direct comparison using normalized values
        const isCorrect = normalizedUserAnswer === normalizedCorrectKey;

        console.log(`✅ Question ${question.id} final result:`, {
          userAnswer: userAnswer,
          correctKey: correctKey,
          normalized_user: normalizedUserAnswer,
          normalized_correct: normalizedCorrectKey,
          isCorrect: isCorrect,
        });

        // Create minimal question attempt structure
        questionAttempts.push({
          question: question.id,
          selected_option: userAnswer,
          is_correct: isCorrect,
        });

        if (isCorrect) {
          correctCount++;
          console.log(
            `🎉 Question ${question.id} is CORRECT! Total correct so far: ${correctCount}`
          );
        } else {
          console.log(`❌ Question ${question.id} is WRONG!`);
        }
      } else {
        console.log(`⚠️ Question ${question.id}: No user answer provided`);
        // Still create an attempt record for unanswered questions
        questionAttempts.push({
          question: question.id,
          selected_option: null,
          is_correct: false,
        });
      }
    });

    // Calculate score as percentage
    const score =
      questions.length > 0 ? (correctCount / questions.length) * 100 : 0;

    console.log("\n🏆 FINAL QUIZ CALCULATION RESULTS:");
    console.log(`Correct answers: ${correctCount} out of ${questions.length}`);
    console.log(`Score percentage: ${score}%`);
    console.log(
      `Question attempts:`,
      questionAttempts.map((qa) => ({
        question: qa.question,
        correct: qa.is_correct,
        selected: qa.selected_option,
      }))
    );

    if (correctCount === 0 && questions.length > 0) {
      console.error(
        "⚠️⚠️⚠️ WARNING: No correct answers found! This might indicate a comparison issue!"
      );
      console.log("Debug info for first question:");
      if (questions[0]) {
        const firstQ = questions[0];
        const firstAnswer = answersData.answers[firstQ.id];
        console.log("First question data:", {
          id: firstQ.id,
          userAnswer: firstAnswer,
          correct_option: firstQ.correct_option,
          correct_answer: firstQ.correct_answer,
          userAnswerType: typeof firstAnswer,
          correctOptionType: typeof firstQ.correct_option,
        });
      }
    }

    // Try to create a quiz attempt record using the manual endpoint
    try {
      console.log("Attempting to create quiz attempt record...");
      const attemptData = {
        quiz: parseInt(quizId),
        score: parseFloat(score.toFixed(2)),
        question_attempts: questionAttempts,
      };

      console.log("Creating attempt with data:", attemptData);
      const attemptResponse = await api.post("/quiz-attempts/", attemptData);
      console.log(
        "✅ Quiz attempt created successfully:",
        attemptResponse.data
      );

      return {
        data: {
          attempt_id: attemptResponse.data.id,
          score: parseFloat(score.toFixed(2)),
          total_questions: questions.length,
          correct_answers: correctCount,
          results: questionAttempts.map((qa) => ({
            question_id: qa.question,
            is_correct: qa.is_correct,
            selected_option: qa.selected_option,
            user_answer: qa.selected_option,
          })),
          _fallback_used: true,
          _message: "Results calculated locally but saved to backend",
        },
      };
    } catch (attemptError) {
      console.error("❌ Failed to create quiz attempt record:", attemptError);
      console.log("Attempt error status:", attemptError.response?.status);
      console.log("Attempt error data:", attemptError.response?.data);

      // Complete fallback - just return local results without saving
      const mockAttemptId = Date.now();

      return {
        data: {
          attempt_id: mockAttemptId,
          score: parseFloat(score.toFixed(2)),
          total_questions: questions.length,
          correct_answers: correctCount,
          results: questionAttempts.map((qa) => ({
            question_id: qa.question,
            is_correct: qa.is_correct,
            selected_option: qa.selected_option,
            user_answer: qa.selected_option,
          })),
          _mock_response: true,
          _error:
            "Backend endpoints not available - results calculated locally only",
        },
      };
    }
  },

  // Debug helper function to log quiz data
  debugQuizData: (quizId, questions) => {
    console.log("=== QUIZ DEBUG INFO ===");
    console.log("Quiz ID:", quizId);
    console.log("Total questions:", questions.length);

    questions.forEach((question, index) => {
      console.log(`\n--- Question ${index + 1} (ID: ${question.id}) ---`);
      console.log("Question text:", question.question_text);
      console.log("Question type:", question.question_type);
      console.log("Options:", question.options);
      console.log("Options type:", typeof question.options);
      console.log("Correct option:", question.correct_option);
      console.log("Correct answer:", question.correct_answer);

      // Check if correct_option exists and is valid
      if (!question.correct_option && !question.correct_answer) {
        console.warn(
          "⚠️ Missing correct answer data for question",
          question.id
        );
      }

      // Check if options format is correct
      if (question.options) {
        if (
          typeof question.options === "object" &&
          !Array.isArray(question.options)
        ) {
          const optionKeys = Object.keys(question.options);
          console.log("Option keys:", optionKeys);

          const correctKey = question.correct_option || question.correct_answer;
          if (correctKey && !optionKeys.includes(correctKey)) {
            console.warn(
              `⚠️ Correct key "${correctKey}" not found in option keys:`,
              optionKeys
            );
          }
        }
      }
    });
    console.log("=== END QUIZ DEBUG ===\n");
  },

  // Study Tasks
  getStudyTasks: () => api.get("/study-tasks/"),
  createStudyTask: (data) => api.post("/study-tasks/", data),
  getStudyTask: (id) => api.get(`/study-tasks/${id}/`),
  updateStudyTask: (id, data) => api.put(`/study-tasks/${id}/`, data),
  deleteStudyTask: (id) => api.delete(`/study-tasks/${id}/`),

  // Summaries
  getSummaries: () => api.get("/summaries/"),
  createSummary: (data) => api.post("/summaries/", data),
  getSummary: (id) => api.get(`/summaries/${id}/`),
  updateSummary: (id, data) => api.put(`/summaries/${id}/`, data),
  deleteSummary: (id) => api.delete(`/summaries/${id}/`),

  // User Progress
  getUserProgress: () => api.get("/user-progress/"),
  getUserProgressById: (id) => api.get(`/user-progress/${id}/`),

  // Users - New endpoints in v2
  getUsers: () => api.get("/users/"),
  getUser: (id) => api.get(`/users/${id}/`),
};

export default api;
