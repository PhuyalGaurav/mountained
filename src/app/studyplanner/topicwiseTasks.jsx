import React, { useState } from "react";

const TopicwiseTasks = ({ topic, topicIndex }) => {
  // Generate uneven number of tasks (1-4) based on topic index
  const generateTasksForTopic = () => {
    const taskCounts = [2, 1, 3, 4, 2, 1, 3, 2, 4, 1, 3, 2]; // Varies 1-4
    const taskCount = taskCounts[topicIndex % taskCounts.length];

    const taskTemplates = [
      { title: `Study ${topic?.topic || "Topic"} fundamentals`, type: "study" },
      { title: `Practice exercises`, type: "practice" },
      { title: `Review notes`, type: "review" },
      { title: `Complete assignment`, type: "assignment" },
    ];

    return taskTemplates.slice(0, taskCount).map((template, index) => ({
      id: index + 1,
      title: template.title,
      completed: Math.random() > 0.7, // Random completion status
      type: template.type,
    }));
  };

  const [tasks, setTasks] = useState(generateTasksForTopic());

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showAddTask, setShowAddTask] = useState(false);

  const toggleTask = (taskId) => {
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addTask = () => {
    if (newTaskTitle.trim()) {
      const newTask = {
        id: Date.now(),
        title: newTaskTitle,
        completed: false,
        type: "custom",
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setShowAddTask(false);
    }
  };

  const getTaskIcon = (type) => {
    switch (type) {
      case "study":
        return "📚";
      case "practice":
        return "✏️";
      case "review":
        return "📖";
      case "assignment":
        return "📝";
      case "custom":
        return "✅";
      default:
        return "📋";
    }
  };

  const completedCount = tasks.filter((task) => task.completed).length;
  const progressPercentage =
    tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div>
      {/* Progress indicator */}
      <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
        <span>
          {completedCount} of {tasks.length} completed
        </span>
        <span className="text-orange-600 font-medium">
          {Math.round(progressPercentage)}%
        </span>
      </div>

      <div className="w-full bg-orange-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2 mb-3">
        {tasks.map((task) => (
          <div
            key={task.id}
            className={`flex items-center space-x-3 p-2 rounded transition-colors ${
              task.completed
                ? "bg-orange-50 border border-orange-200"
                : "bg-gray-50 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {/* Custom Checkbox with Box */}
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                task.completed
                  ? "bg-orange-500 border-orange-500 text-white"
                  : "border-gray-300 hover:border-orange-400 bg-white"
              }`}
            >
              {task.completed && (
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <span className="text-sm">{getTaskIcon(task.type)}</span>
            <span
              className={`text-sm flex-1 ${
                task.completed ? "line-through text-gray-500" : "text-gray-700"
              }`}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>

      {/* Add Task Section */}
      {showAddTask ? (
        <div className="border border-orange-200 rounded-md p-2 bg-orange-50">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a task..."
            className="w-full text-sm bg-transparent border-none outline-none placeholder-gray-500"
            onKeyPress={(e) => e.key === "Enter" && addTask()}
            autoFocus
          />
          <div className="flex justify-end space-x-2 mt-2">
            <button
              onClick={() => {
                setShowAddTask(false);
                setNewTaskTitle("");
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Cancel
            </button>
            <button
              onClick={addTask}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium px-2 py-1"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddTask(true)}
          className="w-full text-left text-sm text-gray-500 hover:text-orange-600 p-2 border border-dashed border-gray-200 rounded-md hover:border-orange-300 transition-colors"
        >
          + Add task
        </button>
      )}
    </div>
  );
};

export default TopicwiseTasks;
