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
 * Hook to use mastery score refresh functionality
 * Call this in components where you want to trigger updates after actions
 */
export const useMasteryScoreRefresh = () => {
  return {
    refreshMasteryScore,
    
    // Convenience method for refreshing after a delay (useful after API calls)
    refreshAfterDelay: (delay = 1000) => {
      setTimeout(() => {
        refreshMasteryScore();
      }, delay);
    },
    
    // Method to refresh multiple times with intervals (for important updates)
    refreshWithRetry: (times = 3, interval = 2000) => {
      for (let i = 0; i < times; i++) {
        setTimeout(() => {
          refreshMasteryScore();
        }, i * interval);
      }
    }
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
 */
export const refreshForScenario = (scenario) => {
  const { refreshAfterDelay, refreshWithRetry } = useMasteryScoreRefresh();
  
  switch (scenario) {
    case REFRESH_SCENARIOS.QUIZ_COMPLETED:
      // Quiz completion is important, refresh multiple times
      refreshWithRetry(3, 2000);
      break;
    case REFRESH_SCENARIOS.CONTENT_GENERATED:
      // Content generation might affect mastery, refresh after delay
      refreshAfterDelay(1500);
      break;
    case REFRESH_SCENARIOS.MATERIAL_UPLOADED:
      // Material upload might create new progress entries
      refreshAfterDelay(2000);
      break;
    case REFRESH_SCENARIOS.STUDY_SESSION_COMPLETED:
      // Study session affects mastery significantly
      refreshWithRetry(2, 3000);
      break;
    case REFRESH_SCENARIOS.FLASHCARD_REVIEWED:
      // Regular flashcard review, single refresh
      refreshAfterDelay(1000);
      break;
    default:
      // Default refresh after short delay
      refreshAfterDelay(1000);
  }
};
