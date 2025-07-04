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
  createExportedQuiz: (data) => api.post("/exported-quizzes/", data),
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
  createLearningMaterial: (data) => api.post("/learning-materials/", data),
  getLearningMaterial: (id) => api.get(`/learning-materials/${id}/`),
  updateLearningMaterial: (id, data) =>
    api.put(`/learning-materials/${id}/`, data),
  deleteLearningMaterial: (id) => api.delete(`/learning-materials/${id}/`),

  // Learning Materials Generation Methods - New in v2
  generateFlashcards: (id, data) =>
    api.post(`/learning-materials/${id}/generate_flashcards/`, data),
  generateQuiz: (id, data) =>
    api.post(`/learning-materials/${id}/generate_quiz/`, data),
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
  submitQuizAnswers: (id, data) => api.post(`/quizzes/${id}/submit_answers/`, data),

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
