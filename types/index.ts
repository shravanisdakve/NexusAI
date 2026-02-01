export interface User {
  id: string;
  email: string;
  displayName: string;
  university?: string;
  createdAt?: string; // Add createdAt as it might be returned from backend
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface GeminiRequest {
  prompt: string;
  courseContext?: string;
  aspectRatio?: string; // Add aspectRatio for generateImage
  base64Data?: string; // For summarizeAudioFromBase64, extractTextFromFile
  mimeType?: string; // For summarizeAudioFromBase64, extractTextFromFile
  language?: string; // For generateCode
  reportJson?: string; // For getStudySuggestions
  mood?: string; // For getSuggestionForMood
  goalTitle?: string; // For breakDownGoal
  notes?: string; // For streamStudyBuddyChat
  context?: string; // For generateQuizQuestion, generateFlashcards
}

export interface GeminiResponse {
  success: boolean;
  response?: string;
  error?: string;
  image?: string; // For generateImage
  summary?: string; // For summarization services
  code?: string; // For generateCode
  text?: string; // For extractTextFromFile
  question?: string; // For generateQuizQuestion
  suggestions?: string; // For getStudySuggestions
  flashcards?: string; // For generateFlashcards
  breakdown?: string; // For breakDownGoal
}
