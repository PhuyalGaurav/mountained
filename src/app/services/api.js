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
  // Curriculum Topics
  getCurriculumTopics: () => api.get("/curriculum-topics/"),
  getCurriculumTopic: (id) => api.get(`/curriculum-topics/${id}/`),

  // Flashcards
  getFlashcards: () => api.get("/flashcards/"),
  createFlashcard: (data) => api.post("/flashcards/", data),
  updateFlashcard: (id, data) => api.put(`/flashcards/${id}/`, data),
  deleteFlashcard: (id) => api.delete(`/flashcards/${id}/`),

  // Quizzes
  getQuizzes: () => api.get("/quizzes/"),
  createQuiz: (data) => api.post("/quizzes/", data),
  getQuiz: (id) => api.get(`/quizzes/${id}/`),

  // Quiz Attempts
  getQuizAttempts: () => api.get("/quiz-attempts/"),
  createQuizAttempt: (data) => api.post("/quiz-attempts/", data),

  // Learning Materials
  getLearningMaterials: () => api.get("/learning-materials/"),
  createLearningMaterial: (data) => api.post("/learning-materials/", data),

  // Study Tasks
  getStudyTasks: () => api.get("/study-tasks/"),
  createStudyTask: (data) => api.post("/study-tasks/", data),
  updateStudyTask: (id, data) => api.put(`/study-tasks/${id}/`, data),

  // Summaries
  getSummaries: () => api.get("/summaries/"),
  createSummary: (data) => api.post("/summaries/", data),

  // User Progress
  getUserProgress: () => api.get("/user-progress/"),

  // Personalized Curriculum
  getPersonalizedCurriculum: () => api.get("/personalized-curriculum/"),
};

export default api;
