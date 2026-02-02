export interface User {
    id: string;
    email: string;
    displayName: string;
    branch: string;
    year: number;
    college: string;
    createdAt: string;
}

export interface Course {
    id: string;
    name: string;
    color: string;
    createdAt?: string;
}

export interface Resource {
    id: string;
    title: string;
    description?: string;
    type: 'Notes' | 'Paper' | 'Book' | 'Video';
    branch: string;
    year: number;
    subject: string;
    link: string;
    uploadedBy: string; // User ID
    createdAt: string;
}

export interface StudyRoom {
    id: string;
    name: string;
    courseId: string;
    maxUsers: number;
    createdBy: string;
    university?: string;
    users: { email: string | null; displayName: string | null; }[];
    technique: string;
    topic: string;
    createdAt?: string;
}

export interface ChatMessage {
    id?: string;
    role: 'user' | 'model';
    parts: { text: string }[];
    user: { displayName: string | null, email: string | null };
    timestamp: number;
}

// You can add other types here as needed, e.g., for Pomodoro, Quiz, etc.
export interface PomodoroState {
    mode: 'work' | 'short_break' | 'long_break';
    timeLeft: number;
    isActive: boolean;
    cycleCount: number;
}

export interface Quiz {
    id: string;
    topic: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    answers: { userId: string, displayName: string, answerIndex: number, timestamp: number }[];
    createdAt: number;
}

export type Mood = 'Happy' | 'Calm' | 'Overwhelmed' | 'Sad' | 'Angry';
