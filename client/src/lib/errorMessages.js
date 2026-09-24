// Map API error codes to user-friendly messages
export const getErrorMessage = (error) => {
  // If we've already processed it
  if (error.userMessage) return error.userMessage;
  
  const code = error.response?.data?.code;
  const status = error.response?.status;
  
  const codeMessages = {
    RATE_LIMITED: 'Too many requests. Please try again later.',
    AUTHENTICATION_ERROR: 'Your session has expired. Please log in again.',
    AUTHORIZATION_ERROR: "You don't have permission to do that.",
    NOT_FOUND: 'The requested resource was not found.',
    USER_EXISTS: 'An account with that email or username already exists.',
    INVALID_CREDENTIALS: 'Invalid email or password.',
    ROOM_NOT_FOUND: 'Room not found. Check the room code and try again.',
    ROOM_FULL: 'This room is full.',
    ALREADY_MEMBER: "You're already a member of this room.",
    VALIDATION_ERROR: 'Please check your input and try again.',
  };
  
  if (code && codeMessages[code]) return codeMessages[code];
  if (status === 429) return 'Too many requests. Please try again later.';
  if (!error.response) return 'Network error. Please check your connection.';
  
  return error.response?.data?.error || 'Something went wrong. Please try again.';
};
