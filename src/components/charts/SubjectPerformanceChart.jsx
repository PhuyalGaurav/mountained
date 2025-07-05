"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function SubjectPerformanceChart({ dashboardData = null }) {
  // Prepare data for the chart
  const topSubjects = dashboardData?.top_subjects || [];
  const recentTopics = dashboardData?.recent_topics || [];

  const subjectLabels = topSubjects.map((subject) => subject.name);
  const subjectScores = topSubjects.map((subject) => subject.average_score);

  const topicLabels = recentTopics.map((topic) => topic.name);
  const topicCounts = recentTopics.map((topic) => topic.count);

  // Combine both datasets for a comprehensive view
  const combinedLabels = [
    ...subjectLabels,
    ...topicLabels.filter((label) => !subjectLabels.includes(label)),
  ];

  const performanceData = combinedLabels.map((label) => {
    const subject = topSubjects.find((s) => s.name === label);
    return subject ? subject.average_score : 0;
  });

  const activityData = combinedLabels.map((label) => {
    const topic = recentTopics.find((t) => t.name === label);
    return topic ? topic.count : 0;
  });

  const data = {
    labels: combinedLabels,
    datasets: [
      {
        label: "Average Score (%)",
        data: performanceData,
        backgroundColor: "rgba(147, 51, 234, 0.8)",
        borderColor: "rgba(147, 51, 234, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: "Quiz Count",
        data: activityData,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          pointStyle: "rect",
          padding: 20,
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      title: {
        display: true,
        text: "Subject Performance & Activity",
        font: {
          size: 16,
          weight: "bold",
        },
        padding: 20,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function (context) {
            if (context.dataset.label === "Quiz Count") {
              return `${context.dataset.label}: ${context.parsed.y} quizzes`;
            }
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          maxRotation: 45,
          minRotation: 0,
        },
      },
      y: {
        type: "linear",
        display: true,
        position: "left",
        min: 0,
        max: 100,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: function (value) {
            return value + "%";
          },
        },
        title: {
          display: true,
          text: "Average Score (%)",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      y1: {
        type: "linear",
        display: true,
        position: "right",
        min: 0,
        grid: {
          drawOnChartArea: false,
        },
        border: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          stepSize: 1,
        },
        title: {
          display: true,
          text: "Quiz Count",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  // If no data available, show a message
  if (
    !dashboardData ||
    (topSubjects.length === 0 && recentTopics.length === 0)
  ) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Data Available
            </h3>
            <p className="text-gray-500">
              Subject performance data will appear here once you start taking
              quizzes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div style={{ height: "400px" }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
