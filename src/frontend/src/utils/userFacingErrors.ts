/**
 * Converts backend errors into user-friendly English messages
 */
export function getUserFacingError(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Check for authorization errors
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('unauthorized')) {
    return 'You do not have permission to perform this action. Please try signing in again.';
  }

  // Check for actor availability
  if (errorMessage.includes('Actor not available')) {
    return 'Connection to the service is not ready. Please wait a moment and try again.';
  }

  // Check for network errors
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Generic error
  return 'Something went wrong. Please try again.';
}
