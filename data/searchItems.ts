import { 
    MessageSquare, 
    Brain, 
    FileText, 
    Users, 
    Briefcase, 
    Calculator, 
    GraduationCap, 
    Shield, 
    Play,
    Building2,
    LayoutDashboard,
    Bell
} from 'lucide-react';

export interface SearchItem {
    key: string;
    name: string;
    description: string;
    href: string;
    icon: any;
    category: 'Tools' | 'Placement' | 'Academic' | 'Resources';
    mode: 'study' | 'placement' | 'both';
}

export const searchItems: SearchItem[] = [
    // Study Tools
    { key: 'tutor', name: 'AI Tutor', description: 'Personalized AI learning assistant', href: '/tutor', icon: MessageSquare, category: 'Tools', mode: 'study' },
    { key: 'quiz', name: 'AI Quiz Master', description: 'Generate quizzes from notes or topics', href: '/quizzes', icon: Brain, category: 'Tools', mode: 'study' },
    { key: 'notes', name: 'Smart Notes', description: 'AI-powered note taking and organization', href: '/notes', icon: FileText, category: 'Tools', mode: 'study' },
    { key: 'lobby', name: 'Study Rooms', description: 'Join or create collaborative study sessions', href: '/study-lobby', icon: Users, category: 'Tools', mode: 'study' },
    
    // Placement Tools
    { key: 'tracker', name: 'Placement Tracker', description: 'Manage and track company applications', href: '/placement', icon: Briefcase, category: 'Placement', mode: 'placement' },
    { key: 'viva', name: 'Viva Simulator', description: 'Practice interviews with AI bots', href: '/viva-simulator', icon: Users, category: 'Placement', mode: 'placement' },
    { key: 'resume', name: 'Resume Builder', description: 'Create ATS-friendly resumes', href: '/resume-builder', icon: FileText, category: 'Placement', mode: 'placement' },
    { key: 'companies', name: 'Company Hub', description: 'Profiles and tracking for hiring partners', href: '/company-hub', icon: Building2, category: 'Placement', mode: 'placement' },
    
    // Academic / Resources
    { key: 'gpa', name: 'GPA Calculator', description: 'Calculate semester and cumulative pointers', href: '/gpa-calculator', icon: Calculator, category: 'Academic', mode: 'both' },
    { key: 'curriculum', name: 'MU Curriculum', description: 'Engineering syllabus and course maps', href: '/curriculum', icon: GraduationCap, category: 'Academic', mode: 'study' },
    { key: 'paperbank', name: 'MU Paper Bank', description: 'Previous year university papers', href: '/mock-paper', icon: FileText, category: 'Academic', mode: 'study' },
    { key: 'kt', name: 'ATKT Navigator', description: 'Support for clearing backlogs', href: '/kt-calculator', icon: Shield, category: 'Academic', mode: 'study' },
    { key: 'library', name: 'Learning Resources', description: 'Video lectures and study materials', href: '/learning-resources', icon: Play, category: 'Resources', mode: 'both' },
    { key: 'dashboard', name: 'Dashboard', description: 'Overview of your progress', href: '/', icon: LayoutDashboard, category: 'Academic', mode: 'both' },
    { key: 'university', name: 'University Status', description: 'Updates from Mumbai University', href: '/university-status', icon: Bell, category: 'Academic', mode: 'study' },
];
