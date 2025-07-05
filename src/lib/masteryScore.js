/**
 * Utility functions for managing mastery score updates
 */

/**
 * Triggers a refresh of the mastery score displayed in the sidebar
 * This function is globally available after the Sidebar component mounts
 */
export const refreshMasteryScore = () => {
  if (typeof window !== 'undefined' && window.refreshMasteryScore) {
    window.refreshMasteryScore();
  }
};

/**
 * Refresh mastery score after a delay (useful after API calls)
 */
export const refreshMasteryScoreAfterDelay = (delay = 1000) => {
  setTimeout(() => {
    refreshMasteryScore();
  }, delay);
};

/**
 * Refresh mastery score multiple times with intervals (for important updates)
 */
export const refreshMasteryScoreWithRetry = (times = 3, interval = 2000) => {
  for (let i = 0; i < times; i++) {
    setTimeout(() => {
      refreshMasteryScore();
    }, i * interval);
  }
};

/**
 * Hook to use mastery score refresh functionality
 * Call this in components where you want to trigger updates after actions
 */
export const useMasteryScoreRefresh = () => {
  return {
    refreshMasteryScore,
    refreshAfterDelay: refreshMasteryScoreAfterDelay,
    refreshWithRetry: refreshMasteryScoreWithRetry
  };
};

/**
 * Common scenarios where mastery score should be refreshed
 */
export const REFRESH_SCENARIOS = {
  QUIZ_COMPLETED: 'quiz_completed',
  CONTENT_GENERATED: 'content_generated',
  MATERIAL_UPLOADED: 'material_uploaded',
  STUDY_SESSION_COMPLETED: 'study_session_completed',
  FLASHCARD_REVIEWED: 'flashcard_reviewed'
};

/**
 * Trigger refresh based on scenario with appropriate timing
 * This is a regular function, not a hook, so it can be called anywhere
 */
export const refreshForScenario = (scenario) => {
  switch (scenario) {
    case REFRESH_SCENARIOS.QUIZ_COMPLETED:
      // Quiz completion is important, refresh multiple times
      refreshMasteryScoreWithRetry(3, 2000);
      break;
    case REFRESH_SCENARIOS.CONTENT_GENERATED:
      // Content generation might affect mastery, refresh after delay
      refreshMasteryScoreAfterDelay(1500);
      break;
    case REFRESH_SCENARIOS.MATERIAL_UPLOADED:
      // Material upload might create new progress entries
      refreshMasteryScoreAfterDelay(2000);
      break;
    case REFRESH_SCENARIOS.STUDY_SESSION_COMPLETED:
      // Study session affects mastery significantly
      refreshMasteryScoreWithRetry(2, 3000);
      break;
    case REFRESH_SCENARIOS.FLASHCARD_REVIEWED:
      // Regular flashcard review, single refresh
      refreshMasteryScoreAfterDelay(1000);
      break;
    default:
      // Default refresh after short delay
      refreshMasteryScoreAfterDelay(1000);
  }
};
