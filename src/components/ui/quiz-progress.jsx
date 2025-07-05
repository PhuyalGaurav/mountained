import React from "react";
import { CheckCircle, XCircle, Circle, Clock, Target, Info, Lightbulb } from "lucide-react";

export function QuizProgressBar({ 
  currentQuestion, 
  totalQuestions, 
  answeredQuestions = {}, 
  onQuestionClick,
  timeElapsed 
}) {
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const answeredCount = Object.keys(answeredQuestions).length;

  return (
    <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="px-8 py-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">
              Question {currentQuestion + 1} of {totalQuestions}
            </span>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-blue-800">{answeredCount}/{totalQuestions} answered</span>
              </div>
              {timeElapsed > 0 && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-green-800">{formatTime(timeElapsed)}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Navigation */}
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: totalQuestions }, (_, index) => {
            const questionNumber = index + 1;
            const isAnswered = answeredQuestions[index] !== undefined;
            const isCurrent = index === currentQuestion;
            
            return (
              <button
                key={index}
                onClick={() => onQuestionClick(index)}
                className={`
                  w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300
                  flex items-center justify-center border-2 transform hover:scale-105 active:scale-95
                  ${isCurrent 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg ring-2 ring-blue-300' 
                    : isAnswered 
                      ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200 hover:shadow-md' 
                      : 'bg-gray-50 text-gray-600 border-gray-300 hover:bg-gray-100 hover:shadow-sm'
                  }
                `}
                title={`Question ${questionNumber}${isAnswered ? ' (answered)' : ''}`}
              >
                {questionNumber}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function QuizTimer({ timeElapsed, timeLimit, onTimeUp }) {
  const timeRemaining = timeLimit ? timeLimit - timeElapsed : null;
  const isRunningOut = timeRemaining && timeRemaining <= 60; // Last minute
  
  React.useEffect(() => {
    if (timeRemaining <= 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeRemaining, onTimeUp]);

  if (!timeLimit) return null;

  return (
    <div className={`text-center p-3 rounded-lg border ${
      isRunningOut ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'
    }`}>
      <div className="flex items-center justify-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="font-medium">
          Time Remaining: {formatTime(Math.max(0, timeRemaining))}
        </span>
      </div>
      {isRunningOut && (
        <div className="text-xs mt-1">Time is running out!</div>
      )}
    </div>
  );
}

export function QuestionCard({ 
  question, 
  questionIndex, 
  totalQuestions, 
  userAnswer, 
  onAnswerChange,
  showReview = false,
  correctAnswer = null,
  isCorrect = null 
}) {
  const handleOptionChange = (optionKey) => {
    if (showReview) return; // Read-only in review mode
    onAnswerChange(optionKey);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-semibold rounded-full border border-blue-200">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        {showReview && isCorrect !== null && (
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${
            isCorrect 
              ? 'bg-green-100 text-green-800 border-green-300' 
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Correct
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4" />
                Incorrect
              </>
            )}
          </div>
        )}
      </div>

      {/* Question Text */}
      <h3 className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed">
        {question.question}
      </h3>

      {/* Answer Options */}
      <div className="space-y-3">
        {question.options && typeof question.options === 'object' && 
          Object.entries(question.options).map(([key, text]) => {
            const isSelected = userAnswer === key;
            const isCorrectOption = showReview && correctAnswer === key;
            const isWrongSelection = showReview && isSelected && !isCorrect;
            
            return (
              <label
                key={key}
                className={`
                  block p-4 rounded-lg border cursor-pointer transition-all duration-200
                  hover:scale-[1.01] active:scale-[0.99]
                  ${showReview 
                    ? isCorrectOption 
                      ? 'bg-green-50 border-green-300 text-green-900 shadow-sm'
                      : isWrongSelection
                        ? 'bg-red-50 border-red-300 text-red-900 shadow-sm'
                        : isSelected
                          ? 'bg-gray-50 border-gray-300'
                          : 'bg-white border-gray-200'
                    : isSelected 
                      ? 'bg-blue-50 border-blue-300 text-blue-900 shadow-sm'
                      : 'bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm'
                  }
                `}
              >
                <div className="flex items-center">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={key}
                    checked={isSelected}
                    onChange={() => handleOptionChange(key)}
                    disabled={showReview}
                    className="sr-only"
                  />
                  <div className={`
                    w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 flex items-center justify-center
                    ${isSelected 
                      ? showReview && isCorrectOption
                        ? 'border-green-500 bg-green-500'
                        : showReview && isWrongSelection
                          ? 'border-red-500 bg-red-500'
                          : 'border-blue-500 bg-blue-500'
                      : 'border-gray-400'
                    }
                  `}>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm text-gray-800 mr-2">
                      {key.toUpperCase()}.
                    </span>
                    <span className={`text-sm ${showReview && isCorrectOption ? 'font-semibold' : 'font-medium'}`}>
                      {text}
                    </span>
                  </div>
                  {showReview && isCorrectOption && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-2" />
                  )}
                  {showReview && isWrongSelection && (
                    <XCircle className="h-5 w-5 text-red-600 ml-2" />
                  )}
                </div>
              </label>
            );
          })
        }
      </div>

      {/* Review Information */}
      {showReview && (
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm space-y-2">
              <div>
                <span className="font-semibold text-gray-700">Your answer: </span>
                <span className={`font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {userAnswer ? `${userAnswer.toUpperCase()}. ${question.options?.[userAnswer] || userAnswer}` : 'No answer'}
                </span>
              </div>
              {correctAnswer && (
                <div>
                  <span className="font-semibold text-gray-700">Correct answer: </span>
                  <span className="text-green-600 font-medium">
                    {correctAnswer.toUpperCase()}. {question.options?.[correctAnswer] || correctAnswer}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Explanation Section */}
          {question.explanation && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Lightbulb className="w-5 h-5 text-blue-600 mr-2" />
                Explanation
              </h4>
              <p className="text-blue-800 text-sm leading-relaxed">
                {question.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
