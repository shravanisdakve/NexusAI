


export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
  // For group chat simulation
  user?: { displayName:string | null, email: string | null };
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

export interface PomodoroState {
    state: 'stopped' | 'running';
    mode: 'focus' | 'break';
    startTime: number; // UTC timestamp
}

export interface StudyRoom {
    id:string;
    name: string;
    courseId: string;
    maxUsers: number;
    university?: string; // Can be linked to a university
    // In a real app, this would be a list of user IDs
    users: { email: string; displayName: string }[];
    createdBy: string; // user email
    pomodoro?: PomodoroState;
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