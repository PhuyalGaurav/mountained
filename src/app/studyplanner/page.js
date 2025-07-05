"use client";

import React, { useState, useEffect } from "react";
import { apiService } from "../services/api";
import TopicwiseTasks from "./topicwiseTasks"; // Importing the TopicwiseTasks component

const TasksComponent = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCurriculumTopics();
        setTopics(response.data);
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError("Failed to load topics");

        // Fallback to dummy data for demonstration
        const dummyTopics = [
          { id: 1, topic: "Accountancy", subject: "Commerce" },
          { id: 2, topic: "Computer Science", subject: "Technology" },
          { id: 3, topic: "Mathematics", subject: "Science" },
          { id: 4, topic: "Physics", subject: "Science" },
          { id: 5, topic: "Chemistry", subject: "Science" },
          { id: 6, topic: "Biology", subject: "Science" },
          { id: 7, topic: "English Literature", subject: "Languages" },
          { id: 8, topic: "History", subject: "Social Studies" },
          { id: 9, topic: "Geography", subject: "Social Studies" },
          { id: 10, topic: "Economics", subject: "Commerce" },
          { id: 11, topic: "Business Studies", subject: "Commerce" },
          { id: 12, topic: "Psychology", subject: "Social Studies" },
        ];
        setTopics(dummyTopics);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  // No grouping - use topics directly

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Study Planner</h2>
        <h3 className="text-gray-600 mb-6">
          Get done with your study tasks for the day!
        </h3>
        <div className="divider mb-8"></div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          <span className="ml-3 text-gray-600">
            Loading curriculum topics...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* heading +button /////////////(divider) layout */}
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Study Planner</h2>
      <h3 className="text-gray-600 mb-6">
        Get done with your study tasks for the day!
      </h3>

      <div className="divider mb-8"></div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-medium">Notice:</p>
          <p>{error} - Using sample data for demonstration</p>
        </div>
      )}

      {/* Topics Layout with Horizontal Scroll - Orange Boxed */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-6 min-w-max">
          {topics.map((topic, index) => (
            <div key={topic.id} className="min-w-80 max-w-80 flex-shrink-0">
              {/* Topic Box */}
              <div className="bg-white rounded-lg border border-orange-200 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <h3 className="text-xl font-semibold text-white">
                    {topic.topic}
                  </h3>
                  {topic.subject && (
                    <p className="text-orange-100 text-sm">{topic.subject}</p>
                  )}
                </div>

                <div className="p-4">
                  <TopicwiseTasks topic={topic} topicIndex={index} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollbar hint */}
      <div className="text-center text-gray-500 text-sm mt-4">
        <p>← Scroll horizontally to view more topics →</p>
      </div>

      {topics.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-orange-300 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Topics Available
          </h3>
          <p className="text-gray-600">
            Study tasks will appear here once curriculum topics are loaded.
          </p>
        </div>
      )}
    </div>
  );
};

export default TasksComponent;
