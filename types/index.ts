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
  prompt?: string; // made optional
  message?: string; // for chat
  courseContext?: string;
  aspectRatio?: string;
  base64Data?: string;
  mimeType?: string;
  language?: string;
  reportJson?: string;
  mood?: string;
  goalTitle?: string;
  notes?: string;
  context?: string;
  branch?: string; // Added
  interest?: string; // Added
  difficulty?: string; // Added
  text?: string; // for summarizeText
}

export interface GeminiResponse {
  success?: boolean; // made optional as often error is returned directly
  response?: string;
  error?: string;
  image?: string;
  summary?: string;
  code?: string;
  text?: string;
  question?: string;
  suggestions?: string;
  suggestion?: string; // Added singular
  flashcards?: string;
  breakdown?: string;
  ideas?: string; // Added
}
