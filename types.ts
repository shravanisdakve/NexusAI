


export interface Resource {
    id: string;
    title: string;
    description: string;
    type: string;
    branch: string;
    year: number;
    subject: string;
    link: string;
    uploadedBy: string | User;
    createdAt: string;
    _id?: string; // Add optional Mongo ID
}

export interface User {
    id: string; // Or whatever ID system you use
    displayName: string;
    email: string;
    university?: string;
    // Add other fields as necessary
}

export interface Flashcard {
    id: string;
    front: string;
    back: string;
    bucket: number;
    lastReview: number; // timestamp
}

export interface Quiz {
    id: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    answers: { userId: string, displayName: string, answerIndex: number }[];
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    // For group chat simulation
    user?: { displayName: string | null, email: string | null };
    timestamp?: number;
    attachment?: {
        name: string;
        type: string;
        size: number;
    }
}

export interface Course {
    id: string;
    name: string;
    color: string;
}

export interface Mood {
    emoji: string;
    label: string;
    timestamp: number;
}



export interface StudyRoom {
    id: string;
    name: string;
    courseId: string;
    maxUsers: number;
    university?: string; // Can be linked to a university
    // In a real app, this would be a list of user IDs
    users: { email: string; displayName: string }[];
    createdBy: string; // user email

    technique?: string;
    topic?: string;
}

export interface LeaderboardEntry {
    email: string;
    displayName: string;
    studyTime: number; // in seconds
    quizScore: number; // percentage
    quizCount: number;
}

export interface Assignment {
    id: string;
    userId: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'To Do' | 'In Progress' | 'Done';
}

export interface Note {
    id: string;
    courseId: string;
    title: string;
    type?: 'text' | 'file'; // Discriminator for note type
    content?: string; // For text notes and extracted text
    fileUrl?: string; // For file notes
    fileName?: string;
    fileType?: string;
    fileExtension?: string;
    fileSize?: number;
    createdAt: number | string; // Can be timestamp or ISO string from backend
}

export interface GeminiRequest {
    message?: string;
    notes?: string;
    prompt?: string;
    aspectRatio?: string;
    text?: string;
    base64Data?: string;
    mimeType?: string;
    language?: string;
    context?: string;
    reportJson?: string;
    mood?: string;
    goalTitle?: string;
    branch?: string;
    interest?: string;
    difficulty?: string;
    subject?: string;
    year?: string;
}

export interface GeminiResponse {
    error?: string;
    image?: string;
    summary?: string;
    code?: string;
    text?: string;
    question?: string;
    suggestions?: string;
    flashcards?: string;
    suggestion?: string;
    breakdown?: string;
    ideas?: string;
    paper?: any;
}

export interface PomodoroState {
    timeLeft: number;
    isActive: boolean;
    isBreak: boolean;
    mode: 'focus' | 'shortBreak' | 'longBreak';
    startTime: number | null;
}