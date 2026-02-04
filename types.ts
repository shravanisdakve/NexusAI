
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
    college?: string;
    branch?: string;
    year?: number;
    token?: string;
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
    topic?: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    answers: { userId: string, displayName: string, answerIndex: number }[];
}

export interface ChatMessage {
    id?: string;
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

export type MoodLabel = 'Happy' | 'Calm' | 'Overwhelmed' | 'Sad' | 'Angry';

export interface Mood {
    emoji?: string;
    label: MoodLabel;
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

export interface PersonalQuiz {
    id?: string;
    questions: {
        topic: string;
        question: string;
        options: string[];
        correctOptionIndex: number;
        explanation?: string;
    }[];
    score?: number;
    completed?: boolean;
    dateTaken?: number;
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
    persona?: string;
    count?: number;
    topic?: string;
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
    quizSet?: string;
}

export interface PomodoroState {
    timeLeft: number;
    isActive: boolean;
    isBreak: boolean;
    mode: 'focus' | 'shortBreak' | 'longBreak';
    startTime: number | null;
}

export interface StudyTask {
    id?: string;
    _id?: string;
    title: string;
    description: string;
    type: 'note' | 'quiz' | 'study-room' | 'review';
    referenceId?: string;
    completed: boolean;
}

export interface StudyDay {
    day: number;
    tasks: StudyTask[];
}

export interface StudyPlan {
    id?: string;
    _id?: string;
    courseId: string;
    goal: string;
    durationDays: number;
    startDate: number;
    days: StudyDay[];
    createdAt: number;
}
export interface Thread {
    id: string;
    courseId: string;
    title: string;
    content: string;
    category: string;
    author: {
        id: string;
        displayName: string;
        email: string;
    };
    upvotes: number;
    repliesCount: number;
    isVerified: boolean;
    pyqTag?: string;
    createdAt: number;
}

export interface Post {
    id: string;
    threadId: string;
    content: string;
    author: {
        id: string;
        displayName: string;
        email: string;
    };
    upvotes: number;
    isBestAnswer: boolean;
    createdAt: number;
}

export interface Goal {
    id: string;
    title: string;
    status: 'In Progress' | 'Completed';
    createdAt: string;
    userId?: string;
}
