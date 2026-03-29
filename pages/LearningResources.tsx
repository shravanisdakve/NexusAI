import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card } from '../components/ui';
import {
    Play, BookOpen, Code2, Calculator, MessageCircle, UserCheck,
    Briefcase, Star, Clock, ChevronRight, ExternalLink, X,
    Brain, FileText, Lightbulb, GraduationCap, TrendingUp, Zap, Settings, Globe
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trackToolUsage } from '../services/personalizationService';

interface VideoResource {
    id: string;
    title: string;
    channel: string;
    description: string;
    youtubeUrl: string;
    duration: string;
    tags: string[];
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    recommended?: boolean;
}

interface ResourceCategory {
    id: string;
    label: string;
    emoji: string;
    icon: React.ReactNode;
    color: string;
    gradient: string;
    description: string;
    videos: VideoResource[];
    branches: string[]; // Supported branches: ['CS', 'IT', 'MECH', 'CIVIL', 'EXTC', 'ELEX', 'ELECT', 'all']
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
    {
        id: 'dsa',
        label: 'DSA & Coding',
        emoji: '💻',
        icon: <Code2 className="w-5 h-5" />,
        color: 'text-violet-400',
        gradient: 'from-violet-600/20 to-indigo-600/10',
        description: 'Master Data Structures & Algorithms for coding rounds',
        branches: ['Computer Engineering', 'Information Technology', 'CS', 'IT'],
        videos: [
            {
                id: 'dsa-1', title: 'Complete DSA Roadmap for Beginners', channel: 'Striver (takeUforward)',
                description: 'The ultimate DSA roadmap covering what to study, in which order, and how to practice effectively for placements.',
                youtubeUrl: 'rZ41y93P2Qo', duration: '22 min', tags: ['Roadmap', 'Beginner'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'dsa-2', title: 'Arrays - Complete Tutorial', channel: 'Apna College',
                description: 'Everything about arrays — declaration, traversal, common patterns like two pointers, sliding window, and Kadane\'s algorithm.',
                youtubeUrl: 'NTHVTY6w2Co', duration: '1 hr 45 min', tags: ['Arrays', 'Two Pointer'], difficulty: 'Beginner',
            },
            {
                id: 'dsa-3', title: 'Linked List Explained Simply', channel: 'Abdul Bari',
                description: 'Visual explanation of Linked Lists — singly, doubly, circular. Includes reversal, cycle detection, and merge operations.',
                youtubeUrl: 'dmb1i4oN5oE', duration: '30 min', tags: ['Linked List', 'Pointers'], difficulty: 'Beginner',
            },
            {
                id: 'dsa-4', title: 'Recursion & Backtracking - Full Course', channel: 'Striver (takeUforward)',
                description: 'Deep dive into recursion patterns, backtracking problems like N-Queens, subset generation, and permutations.',
                youtubeUrl: 'yVdKa8dnKiE', duration: '1 hr 20 min', tags: ['Recursion', 'Backtracking'], difficulty: 'Intermediate',
            },
            {
                id: 'dsa-5', title: 'Dynamic Programming for Beginners', channel: 'Neetcode',
                description: 'Clear explanation of DP concepts — memoization vs tabulation, Fibonacci, Knapsack, LCS, and coin change problems.',
                youtubeUrl: 'oBt53YbR9Kk', duration: '45 min', tags: ['DP', 'Optimization'], difficulty: 'Intermediate', recommended: true,
            },
            {
                id: 'dsa-6', title: 'Graph Algorithms - BFS, DFS, Dijkstra', channel: 'Abdul Bari',
                description: 'Complete guide to graph traversals, shortest path algorithms, and when to use BFS vs DFS in placement coding rounds.',
                youtubeUrl: 'tWVWeAqZ0WU', duration: '50 min', tags: ['Graphs', 'BFS', 'DFS'], difficulty: 'Intermediate',
            },
            {
                id: 'dsa-7', title: 'Binary Tree & BST - All You Need', channel: 'Love Babbar',
                description: 'Comprehensive coverage of tree traversals, BST operations, height, diameter, LCA, and common interview questions.',
                youtubeUrl: '_ANrF3FJm7I', duration: '1 hr 10 min', tags: ['Trees', 'BST'], difficulty: 'Intermediate',
            },
            {
                id: 'dsa-8', title: 'Sorting Algorithms Visualized', channel: 'Striver (takeUforward)',
                description: 'Visual explanation of Bubble, Selection, Insertion, Merge, Quick, and Counting sort with time complexity analysis.',
                youtubeUrl: 'HGk_ypEuS24', duration: '55 min', tags: ['Sorting', 'Algorithms'], difficulty: 'Beginner',
            },
            {
                id: 'dsa-9', title: 'Stack & Queue Problems for Interviews', channel: 'Apna College',
                description: 'Important stack and queue problems — valid parentheses, next greater element, min stack, and sliding window maximum.',
                youtubeUrl: 'GYptUgnIM_I', duration: '40 min', tags: ['Stack', 'Queue'], difficulty: 'Intermediate',
            },
            {
                id: 'dsa-10', title: 'Top 20 Coding Patterns for Interviews', channel: 'Neetcode',
                description: 'Master the 20 most common coding patterns that cover 90% of interview problems — a must-watch before placement season.',
                youtubeUrl: 'DjYZk8nrXVY', duration: '35 min', tags: ['Patterns', 'Strategy'], difficulty: 'Advanced', recommended: true,
            },
        ],
    },
    {
        id: 'electronics',
        label: 'Electronics Core',
        emoji: '⚡',
        icon: <Zap className="w-5 h-5" />, // Note: Need to import Zap if not there
        color: 'text-yellow-400',
        gradient: 'from-yellow-600/20 to-amber-600/10',
        description: 'Core concepts for EXTC, ELEX and Electrical students',
        branches: ['Electronics & Telecommunication', 'Electronics Engineering', 'Electrical Engineering', 'EXTC', 'ELEX', 'ELECT'],
        videos: [
            {
                id: 'elec-1', title: 'Digital Electronics Full Course', channel: 'Neso Academy',
                description: 'Complete series on number systems, logic gates, K-maps, combinational & sequential circuits — fundamental for all ECE exams.',
                youtubeUrl: 'vR40S8nU9c0', duration: '12 hr', tags: ['Digital', 'Gates'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'elec-2', title: 'Signals & Systems for Beginners', channel: 'Anis Sir',
                description: 'Master Fourier transforms, Z-transforms, and LTI systems with exam-oriented shortcuts and visualization.',
                youtubeUrl: '3uFzH8fL-28', duration: '1 hr 15 min', tags: ['Signals', 'Shortcuts'], difficulty: 'Intermediate',
            },
            {
                id: 'elec-3', title: 'Microprocessors (8085/8086) Explained', channel: 'Knowledge Gate',
                description: 'Complete architecture and instruction set explanation for core electronics and CS students.',
                youtubeUrl: 'ii7V_QG6Plo', duration: '55 min', tags: ['Microprocessor', 'Arch'], difficulty: 'Intermediate',
            },
        ],
    },
    {
        id: 'mechanical',
        label: 'Mechanical & Civil',
        emoji: '⚙️',
        icon: <Settings className="w-5 h-5" />, // Note: Need to import Settings if not there
        color: 'text-orange-400',
        gradient: 'from-orange-600/20 to-red-600/10',
        description: 'Thermodynamics, Mechanics and Core fundamental courses',
        branches: ['Mechanical Engineering', 'Civil Engineering', 'MECH', 'CIVIL'],
        videos: [
            {
                id: 'mech-1', title: 'Thermodynamics - Laws & Concepts', channel: 'Magic Marks',
                description: 'Visual explanation of First and Second law of thermodynamics, entropy, and heat engines for core mechanical preparation.',
                youtubeUrl: 'z0_fIPN4q_o', duration: '40 min', tags: ['Thermodynamics', 'Laws'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'mech-2', title: 'Engineering Mechanics - Truss & Frames', channel: 'The Engineering Mindset',
                description: 'In-depth guide to solving trusses and frames using method of joints and sections — critical for Civil and Mech students.',
                youtubeUrl: 'y-mXnO1W-gU', duration: '35 min', tags: ['Mechanics', 'Truss'], difficulty: 'Intermediate',
            },
            {
                id: 'mech-3', title: 'Fluid Mechanics - Properties & Equations', channel: 'GATE Academy',
                description: 'Viscosity, surface tension, and Bernoulli’s equation — placement specific questions and core concepts.',
                youtubeUrl: 'wR9E0V9XoV8', duration: '1 hr', tags: ['Fluid', 'Bernoulli'], difficulty: 'Intermediate',
            },
        ],
    },
    {
        id: 'aptitude',
        label: 'Aptitude & Reasoning',
        emoji: '🧮',
        icon: <Calculator className="w-5 h-5" />,
        color: 'text-blue-400',
        gradient: 'from-blue-600/20 to-cyan-600/10',
        description: 'Crack quantitative, logical, and verbal sections',
        branches: ['all'],
        videos: [
            {
                id: 'apt-1', title: 'Quantitative Aptitude - Complete Course', channel: 'CareerRide',
                description: 'Full aptitude course covering percentages, ratio, time & work, speed-distance, probability — everything for TCS/Infosys tests.',
                youtubeUrl: 'zX38n2W8y8s', duration: '2 hr', tags: ['Quant', 'Percentages'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'apt-2', title: 'Logical Reasoning - Tricks & Shortcuts', channel: 'Placement Season',
                description: 'Quick tricks for solving logical reasoning problems — coding-decoding, blood relations, seating arrangements, and series.',
                youtubeUrl: 'yV-37C_J8E0', duration: '45 min', tags: ['Logical', 'Shortcuts'], difficulty: 'Beginner',
            },
            {
                id: 'apt-3', title: 'Verbal Ability for Placement Exams', channel: 'Unacademy',
                description: 'Master reading comprehension, para jumbles, sentence correction, and vocabulary for placement verbal sections.',
                youtubeUrl: 'v7L6_v911pU', duration: '1 hr', tags: ['Verbal', 'English'], difficulty: 'Beginner',
            },
            {
                id: 'apt-4', title: 'Data Interpretation Made Easy', channel: 'CareerRide',
                description: 'Learn to quickly solve DI problems — tables, bar charts, pie charts, and line graphs with speed techniques.',
                youtubeUrl: 'f_A8iF-J_gU', duration: '50 min', tags: ['DI', 'Charts'], difficulty: 'Intermediate',
            },
            {
                id: 'apt-5', title: 'Time & Work - All Types Solved', channel: 'Adda247',
                description: 'Every type of Time & Work problem with shortcuts — pipes & cisterns, efficiency, alternate days work patterns.',
                youtubeUrl: 'XmE7pS_X0uY', duration: '35 min', tags: ['Time & Work', 'Quant'], difficulty: 'Intermediate',
            },
            {
                id: 'apt-6', title: 'Probability & Permutation Combo', channel: 'Wifistudy',
                description: 'Clear concepts of probability, permutations and combinations with placement-level practice problems.',
                youtubeUrl: 'fD3Zq8mC87Y', duration: '55 min', tags: ['Probability', 'P&C'], difficulty: 'Intermediate', recommended: true,
            },
        ],
    },
    {
        id: 'interview',
        label: 'Interview Preparation',
        emoji: '🎤',
        icon: <UserCheck className="w-5 h-5" />,
        color: 'text-emerald-400',
        gradient: 'from-emerald-600/20 to-teal-600/10',
        description: 'Ace HR, technical, and behavioral interview rounds',
        branches: ['all'],
        videos: [
            {
                id: 'int-1', title: 'Top 10 HR Interview Questions & Answers', channel: 'Interview Tips',
                description: 'The most asked HR questions — Tell me about yourself, strengths/weaknesses, why this company, salary expectations, and more.',
                youtubeUrl: '1mHjMNZZvFo', duration: '20 min', tags: ['HR', 'Common Questions'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'int-2', title: 'STAR Method for Behavioral Interviews', channel: 'Career Vidz',
                description: 'Master the STAR technique (Situation, Task, Action, Result) to structure your behavioral interview answers perfectly.',
                youtubeUrl: 'Z190u8v_p7k', duration: '15 min', tags: ['STAR Method', 'Behavioral'], difficulty: 'Beginner',
            },
            {
                id: 'int-3', title: 'Technical Interview Tips for Freshers', channel: 'TechLead Show',
                description: 'What to expect in technical rounds — how to approach problems, communicate your thought process, and handle pressure.',
                youtubeUrl: 'p7-9Uf-l5b4', duration: '25 min', tags: ['Technical', 'Tips'], difficulty: 'Intermediate',
            },
            {
                id: 'int-4', title: 'Body Language in Interviews', channel: 'Placement Season',
                description: 'Non-verbal communication matters! Learn about posture, eye contact, hand gestures, and confidence projection.',
                youtubeUrl: 'PCWVi5pAa30', duration: '12 min', tags: ['Body Language', 'Soft Skills'], difficulty: 'Beginner',
            },
            {
                id: 'int-5', title: 'Stress Interview - How to Handle It', channel: 'Interview Tips',
                description: 'How to stay calm and respond professionally during stress rounds — handling trick questions, pressure, and rapid-fire.',
                youtubeUrl: 'G1p0m7B9m8A', duration: '18 min', tags: ['Stress Round', 'Pressure'], difficulty: 'Advanced',
            },
            {
                id: 'int-6', title: 'Self Introduction That Impresses', channel: 'Leverage Edu',
                description: 'Craft the perfect self-introduction for interviews — structure, what to include, what to avoid, and real examples.',
                youtubeUrl: 'K0Z2X_a2tqU', duration: '10 min', tags: ['Introduction', 'First Impression'], difficulty: 'Beginner', recommended: true,
            },
        ],
    },
    {
        id: 'gd',
        label: 'Group Discussion',
        emoji: '💬',
        icon: <MessageCircle className="w-5 h-5" />,
        color: 'text-cyan-400',
        gradient: 'from-cyan-600/20 to-sky-600/10',
        description: 'Learn GD strategies, topics, and dos/don\'ts',
        branches: ['all'],
        videos: [
            {
                id: 'gd-1', title: 'How to Win a Group Discussion', channel: 'TalentSprint',
                description: 'Complete strategy for GDs — how to initiate, when to intervene, body language, and how to summarize effectively.',
                youtubeUrl: 'HGdbuvNjm-U', duration: '22 min', tags: ['Strategy', 'Tips'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'gd-2', title: 'Top 20 GD Topics for 2025-26', channel: 'Unacademy',
                description: 'Most frequently asked GD topics in campus placements — AI, WFH, startups vs MNCs, cryptocurrency, and more with sample arguments.',
                youtubeUrl: 'Tr5tSaFrVoU', duration: '30 min', tags: ['Topics', 'Current Affairs'], difficulty: 'Beginner',
            },
            {
                id: 'gd-3', title: 'GD Dos and Don\'ts', channel: 'Leverage Edu',
                description: 'Common mistakes students make in GDs and how to avoid them — interrupting, staying silent, going off-topic, and more.',
                youtubeUrl: 'vTWZ07G5e5s', duration: '15 min', tags: ['Mistakes', 'Etiquette'], difficulty: 'Beginner',
            },
            {
                id: 'gd-4', title: 'How to Structure GD Arguments', channel: 'CareerRide',
                description: 'Learn to build structured arguments using frameworks — pros/cons, stakeholder analysis, and data-driven points.',
                youtubeUrl: 'HGdbuvNjm-U', duration: '18 min', tags: ['Arguments', 'Structure'], difficulty: 'Intermediate',
            },
        ],
    },
    {
        id: 'resume',
        label: 'Resume & Profile',
        emoji: '📄',
        icon: <FileText className="w-5 h-5" />,
        color: 'text-amber-400',
        gradient: 'from-amber-600/20 to-orange-600/10',
        description: 'Build a resume that gets shortlisted',
        branches: ['all'],
        videos: [
            {
                id: 'res-1', title: 'How to Write a Perfect Resume for Freshers', channel: 'Placement Season',
                description: 'Step-by-step guide to creating a fresher resume — what to include, formatting, action verbs, and ATS-friendly tips.',
                youtubeUrl: 'y8YH0Qbu5h4', duration: '20 min', tags: ['Resume', 'Fresher'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'res-2', title: 'LinkedIn Profile Optimization', channel: 'Career Vidz',
                description: 'Optimize your LinkedIn profile to attract recruiters — headline, summary, skills, recommendations, and networking tips.',
                youtubeUrl: 'BcPkz2ZNHKA', duration: '15 min', tags: ['LinkedIn', 'Profile'], difficulty: 'Beginner',
            },
            {
                id: 'res-3', title: 'GitHub Profile That Stands Out', channel: 'Fireship',
                description: 'Make your GitHub profile impress recruiters — README profile, pinned repos, contribution graph, and project showcasing.',
                youtubeUrl: 'dkE4mVhwMB4', duration: '10 min', tags: ['GitHub', 'Portfolio'], difficulty: 'Intermediate', recommended: true,
            },
            {
                id: 'res-4', title: 'Projects to Add in Your Resume', channel: 'Love Babbar',
                description: 'What kind of projects look good on a fresher resume — full-stack, ML, mobile apps — with real examples.',
                youtubeUrl: 'oC483DTjRXU', duration: '25 min', tags: ['Projects', 'Portfolio'], difficulty: 'Intermediate',
            },
        ],
    },
    {
        id: 'company',
        label: 'Company-Specific Prep',
        emoji: '🏢',
        icon: <Briefcase className="w-5 h-5" />,
        color: 'text-rose-400',
        gradient: 'from-rose-600/20 to-pink-600/10',
        description: 'Targeted prep for specific company tests',
        branches: ['all'],
        videos: [
            {
                id: 'comp-1', title: 'TCS NQT 2025 - Complete Preparation', channel: 'Placement Season',
                description: 'Everything about TCS NQT — exam pattern, syllabus, important topics, practice questions, and scoring strategy.',
                youtubeUrl: 'eP08W29jGGo', duration: '45 min', tags: ['TCS', 'NQT'], difficulty: 'Beginner', recommended: true,
            },
            {
                id: 'comp-2', title: 'Infosys Placement Preparation Guide', channel: 'Adda247',
                description: 'Complete guide for Infosys — certification, exam pattern, pseudocode section, and interview preparation.',
                youtubeUrl: '0W6H3l9Uf50', duration: '35 min', tags: ['Infosys', 'Placement'], difficulty: 'Beginner',
            },
            {
                id: 'comp-3', title: 'Wipro Elite NTH Exam Strategy', channel: 'CareerRide',
                description: 'Wipro ELITE (National Level Talent Hunt) — pattern, essay writing tips, coding practice, and time management.',
                youtubeUrl: 'I9l_v1X_oZk', duration: '30 min', tags: ['Wipro', 'ELITE'], difficulty: 'Beginner',
            },
            {
                id: 'comp-4', title: 'Accenture Assessment Preparation', channel: 'Placement Season',
                description: 'Accenture cognitive, technical, and coding assessment — what to expect, game-based rounds, and communication test tips.',
                youtubeUrl: 'S_G_f_V_V_I', duration: '28 min', tags: ['Accenture', 'Cognitive'], difficulty: 'Intermediate',
            },
            {
                id: 'comp-5', title: 'Cognizant GenC Preparation', channel: 'Unacademy',
                description: 'Cognizant GenC, GenC Next, and GenC Elevate — understand tiers, AMCAT-based test, Automata Fix section prep.',
                youtubeUrl: 'M9n7U2d906A', duration: '40 min', tags: ['Cognizant', 'GenC'], difficulty: 'Intermediate',
            },
            {
                id: 'comp-6', title: 'Capgemini Exceller Drive Prep', channel: 'CareerRide',
                description: 'Capgemini game-based aptitude, pseudocode, essay writing, and coding round — what makes it unique and how to crack each section.',
                youtubeUrl: '9mR9_n4yKjg', duration: '25 min', tags: ['Capgemini', 'Exceller'], difficulty: 'Intermediate',
            },
        ],
    },
];

// Helper to get safe YouTube embed URL from various formats
const getEmbedUrl = (url: string) => {
    if (!url) return null;
    // Extract ID (handling watch URLs, youtu.be, embed URLs, shorts, and IDs)
    const match = url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\s?]+)/);
    const id = match ? match[1] : (url.includes('://') ? null : url);
    return id ? `https://www.youtube.com/embed/${id}` : null;
};

const VideoThumbnail: React.FC<{ youtubeUrl: string, title: string, duration?: string }> = ({ youtubeUrl, title, duration }) => {
    const [error, setError] = React.useState(false);

    // Extract ID for thumbnail
    const match = youtubeUrl.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^&\s?]+)/);
    const youtubeId = match ? match[1] : (youtubeUrl.includes('://') ? null : youtubeUrl);

    // Use hqdefault as primary because it's higher quality and more reliable for newer videos
    const [thumbUrl, setThumbUrl] = React.useState(`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`);

    if (!youtubeId) return (
        <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center border-b border-slate-700">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 text-center line-clamp-2">{title}</div>
        </div>
    );

    return (
        <div className="relative aspect-video bg-slate-900 overflow-hidden">
            {!error ? (
                <img
                    src={thumbUrl}
                    alt={title}
                    className="w-full aspect-video object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={() => {
                        if (thumbUrl.includes('hqdefault')) {
                            setThumbUrl(`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`);
                        } else if (thumbUrl.includes('mqdefault')) {
                            setThumbUrl(`https://img.youtube.com/vi/${youtubeId}/0.jpg`);
                        } else {
                            setError(true);
                        }
                    }}
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700">
                    <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-2">
                        <Play size={24} className="text-violet-400 ml-1" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 text-center line-clamp-1">{title}</span>
                </div>
            )}
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                    <Play size={24} className="text-slate-900 ml-1" />
                </div>
            </div>
            {duration && (
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono z-10">{duration}</div>
            )}
        </div>
    );
};


const LearningResources: React.FC = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    // Determine user's primary domain focus
    const userBranch = user?.branch || '';
    const isCSBranch = ['Computer Engineering', 'Information Technology', 'CS', 'IT'].includes(userBranch);
    const isCoreBranch = ['Mechanical Engineering', 'Civil Engineering', 'Electronics & Telecommunication', 'Electronics Engineering', 'Electrical Engineering', 'MECH', 'CIVIL', 'EXTC', 'ELEX', 'ELECT'].includes(userBranch);

    const initialCategory = searchParams.get('category') || (isCoreBranch && !isCSBranch ? 'electronics' : 'dsa');

    const [selectedCategory, setSelectedCategory] = useState(initialCategory);
    const [playingVideo, setPlayingVideo] = useState<VideoResource | null>(null);
    const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
    const [showAllBranches, setShowAllBranches] = useState(!userBranch || userBranch === 'General');

    React.useEffect(() => { trackToolUsage('placement'); }, []);

    // Filter categories based on branch relevance or "Show All" toggle
    const visibleCategories = RESOURCE_CATEGORIES.filter(cat =>
        showAllBranches ||
        cat.branches.includes('all') ||
        cat.branches.includes(userBranch) ||
        (isCSBranch && (cat.id === 'dsa')) ||
        (isCoreBranch && (cat.id === 'electronics' || cat.id === 'mechanical'))
    );

    const category = RESOURCE_CATEGORIES.find(c => c.id === selectedCategory) || visibleCategories[0] || RESOURCE_CATEGORIES[0];

    const filteredVideos = category.videos.filter(v =>
        filterDifficulty === 'all' || v.difficulty === filterDifficulty
    );

    const handleCategoryChange = (id: string) => {
        setSelectedCategory(id);
        setSearchParams({ category: id });
        setPlayingVideo(null);
        setFilterDifficulty('all');
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {/* Personalization Banner */}
            {userBranch && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                            <GraduationCap className="text-violet-400 w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Academic Profile</p>
                            <p className="text-sm text-slate-200 font-semibold">{userBranch} Student</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-slate-700/50">
                        <button
                            onClick={() => setShowAllBranches(false)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!showAllBranches ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'text-slate-400 hover:text-white'}`}
                        >
                            🎯 Targeted
                        </button>
                        <button
                            onClick={() => setShowAllBranches(true)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showAllBranches ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                        >
                            🌐 Explore All
                        </button>
                    </div>
                </div>
            )}
            {/* Video Player Modal */}
            {playingVideo && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
                    <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{playingVideo.title}</h3>
                                <p className="text-sm text-slate-400 mt-1">{playingVideo.channel} • {playingVideo.duration}</p>
                            </div>
                            <button onClick={() => setPlayingVideo(null)} className="p-2 text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                            {getEmbedUrl(playingVideo.youtubeUrl) ? (
                                <iframe
                                    className="absolute inset-0 w-full h-full rounded-2xl"
                                    src={`${getEmbedUrl(playingVideo.youtubeUrl)}?autoplay=1&rel=0`}
                                    title={playingVideo.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center p-8 text-center border border-slate-700">
                                    <Globe className="w-12 h-12 text-slate-500 mb-4" />
                                    <h4 className="text-white font-bold mb-2">Direct Embed Unavailable</h4>
                                    <p className="text-sm text-slate-400 max-w-md">This resource is hosted on an external site and cannot be previewed directly here.</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex-1 p-4 rounded-xl bg-slate-800/80 border border-slate-700 w-full">
                                <p className="text-sm text-slate-300 leading-relaxed">{playingVideo.description}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {playingVideo.tags.map(tag => (
                                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            {playingVideo.youtubeUrl && (
                                <a
                                    href={playingVideo.youtubeUrl.includes('://') ? playingVideo.youtubeUrl : `https://www.youtube.com/watch?v=${playingVideo.youtubeUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/20 transition-all whitespace-nowrap"
                                >
                                    <ExternalLink size={18} /> Open in YouTube
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Category Tabs */}
            <div className="flex items-center gap-2 flex-wrap bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 overflow-x-auto">
                {visibleCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border whitespace-nowrap ${selectedCategory === cat.id
                            ? `${cat.color} bg-slate-700/50 border-slate-600`
                            : 'text-slate-400 border-transparent hover:text-white'
                            }`}
                    >
                        <span className="text-base">{cat.emoji}</span>
                        <span className="hidden md:inline">{cat.label}</span>
                    </button>
                ))}
            </div>

            {/* Category Header */}
            <div className={`p-6 rounded-2xl bg-gradient-to-r ${category.gradient} border border-slate-700/50`}>
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center ${category.color}`}>
                        {category.icon}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{category.label}</h2>
                        <p className="text-sm text-slate-400 mt-1">{category.description}</p>
                        <p className="text-xs text-slate-500 mt-2">{category.videos.length} curated videos from top educators</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filter:</span>
                {['all', 'Beginner', 'Intermediate', 'Advanced'].map(d => (
                    <button
                        key={d}
                        onClick={() => setFilterDifficulty(d)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterDifficulty === d
                            ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30'
                            : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        {d === 'all' ? '📺 All' : d === 'Beginner' ? '🟢 Beginner' : d === 'Intermediate' ? '🟡 Intermediate' : '🔴 Advanced'}
                    </button>
                ))}
            </div>

            {/* Recommended Section */}
            {filterDifficulty === 'all' && category.videos.some(v => v.recommended) && (
                <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase text-amber-400 tracking-wider flex items-center gap-2">
                        <Star size={14} /> Must Watch
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.videos.filter(v => v.recommended).map(video => (
                            <button
                                key={video.id}
                                onClick={() => setPlayingVideo(video)}
                                className="group text-left rounded-2xl overflow-hidden border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all hover:scale-[1.02]"
                            >
                                <div className="relative">
                                    <VideoThumbnail youtubeUrl={video.youtubeUrl} title={video.title} duration={video.duration} />
                                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-amber-500 text-[10px] text-white font-bold z-10">⭐ Recommended</div>
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-amber-300 transition-colors">{video.title}</h4>
                                    <p className="text-[11px] text-slate-500 mt-1">{video.channel}</p>
                                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{video.description}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* All Videos Grid */}
            <div className="space-y-3">
                <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider flex items-center gap-2">
                    <BookOpen size={14} /> {filterDifficulty === 'all' ? 'All Videos' : `${filterDifficulty} Level`} ({filteredVideos.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVideos.map(video => (
                        <button
                            key={video.id}
                            onClick={() => setPlayingVideo(video)}
                            className="group text-left rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-800/30 hover:border-slate-500 transition-all hover:scale-[1.02]"
                        >
                            <div className="relative">
                                <VideoThumbnail youtubeUrl={video.youtubeUrl} title={video.title} duration={video.duration} />
                                {video.difficulty && (
                                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold z-10 ${video.difficulty === 'Beginner' ? 'bg-emerald-600 text-white' :
                                        video.difficulty === 'Intermediate' ? 'bg-amber-600 text-white' :
                                            'bg-rose-600 text-white'
                                        }`}>{video.difficulty}</div>
                                )}
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-violet-300 transition-colors">{video.title}</h4>
                                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                                    {video.channel} <span className="text-slate-600">•</span> <Clock size={10} /> {video.duration}
                                </p>
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">{video.description}</p>
                                <div className="flex flex-wrap gap-1 mt-3">
                                    {video.tags.map(tag => (
                                        <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-700">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {filteredVideos.length === 0 && (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No videos found with this filter</p>
                </div>
            )}
        </div>
    );
};

export default LearningResources;
