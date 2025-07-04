"use client";

import { useState } from "react";

export function Flashcard({ front, back, difficulty = "medium", onResult }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 border-green-300";
      case "medium":
        return "bg-yellow-100 border-yellow-300";
      case "hard":
        return "bg-red-100 border-red-300";
      default:
        return "bg-gray-100 border-gray-300";
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleResult = (remembered) => {
    if (onResult) {
      onResult(remembered);
    }
    // Reset card to front side after marking result
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      <div
        className={`relative w-full aspect-[3/2] cursor-pointer ${getDifficultyColor(
          difficulty
        )} border rounded-xl shadow-md transition-transform duration-700 transform hover:shadow-lg`}
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
        onClick={handleFlip}
      >
        {/* Front of card */}
        <div
          className="absolute w-full h-full flex flex-col items-center justify-center p-6 backface-hidden"
          style={{ backfaceVisibility: "hidden" }}
        >
          <p className="text-xl font-medium text-gray-900 text-center">
            {front}
          </p>
          <div className="absolute top-3 left-3">
            <span className="text-sm font-medium text-gray-600 capitalize">
              {difficulty}
            </span>
          </div>
        </div>

        {/* Back of card */}
        <div
          className="absolute w-full h-full flex flex-col items-center justify-center p-6 backface-hidden"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <p className="text-xl font-medium text-gray-900 text-center">
            {back}
          </p>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResult(false);
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
              Didn't Remember
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleResult(true);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              Remembered
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
