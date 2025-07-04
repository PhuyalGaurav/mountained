import axios from "axios";

const API_BASE_URL = "https://backend.mountained.phuyalgaurav.com.np/api";

// Create axios instance with auth headers
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

// Course Content Service
export const courseContentService = {
  // Get all learning materials with extracted texts
  async getLearningMaterials() {
    try {
      const response = await api.get("/learning-materials/");
      return response.data;
    } catch (error) {
      console.error("Error fetching learning materials:", error);
      throw error;
    }
  },

  // Get learning material by ID
  async getLearningMaterial(id) {
    try {
      const response = await api.get(`/learning-materials/${id}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching learning material:", error);
      throw error;
    }
  },

  // Get learning materials filtered by topic
  async getLearningMaterialsByTopic(topicId) {
    try {
      const response = await api.get("/learning-materials/");
      const materials = response.data;

      // Filter by topic if topicId is provided
      if (topicId) {
        return materials.filter((material) => material.topic === topicId);
      }

      return materials;
    } catch (error) {
      console.error("Error fetching learning materials by topic:", error);
      throw error;
    }
  },

  // Get extracted text content from learning materials
  async getExtractedTexts(topicId = null) {
    try {
      const materials = await this.getLearningMaterialsByTopic(topicId);

      return materials
        .map((material) => ({
          id: material.id,
          topicId: material.topic,
          extractedText: material.extracted_text,
          fileName: material.file ? material.file.split("/").pop() : "Unknown",
          uploadedAt: material.uploaded_at,
          fileUrl: material.file,
        }))
        .filter((item) => item.extractedText); // Only return items with extracted text
    } catch (error) {
      console.error("Error getting extracted texts:", error);
      throw error;
    }
  },

  // Upload new learning material (file)
  async uploadLearningMaterial(file) {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/learning-materials/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Error uploading learning material:", error);
      throw error;
    }
  },

  // Get course content for a specific topic
  async getCourseContent(topicId) {
    try {
      // Get curriculum topic details
      const topicResponse = await api.get(`/curriculum-topics/${topicId}/`);
      const topic = topicResponse.data;

      // Get learning materials for this topic
      const materials = await this.getLearningMaterialsByTopic(topicId);

      // Get summaries for this topic
      const summariesResponse = await api.get("/summaries/");
      const summaries = summariesResponse.data.filter(
        (summary) => summary.topic === topicId
      );

      // Get quizzes for this topic
      const quizzesResponse = await api.get("/quizzes/");
      const quizzes = quizzesResponse.data.filter(
        (quiz) => quiz.topic === topicId
      );

      return {
        topic,
        materials,
        summaries,
        quizzes,
        extractedTexts: materials.map((m) => m.extracted_text).filter(Boolean),
      };
    } catch (error) {
      console.error("Error getting course content:", error);
      throw error;
    }
  },

  // Search through extracted texts
  async searchExtractedTexts(query, topicId = null) {
    try {
      const extractedTexts = await this.getExtractedTexts(topicId);

      if (!query) return extractedTexts;

      return extractedTexts.filter((item) =>
        item.extractedText.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error("Error searching extracted texts:", error);
      throw error;
    }
  },
};

export default courseContentService;

// Named export for convenience in UI components
export const getCourseContent = (topicId) =>
  courseContentService.getCourseContent(topicId);
