import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader, Button, Card, Input } from '../components/ui';
import {
    ClipboardList, ArrowLeft, Plus, Trash2, Edit3, ChevronRight, ChevronDown,
    Calendar, Building2, IndianRupee, X, Check, Bell, BookOpen, Play,
    Calculator, MessageCircle, UserCheck, Code2, Target, Lightbulb,
    AlertTriangle, Star, ExternalLink, Clock, Zap,
    FileText, User, Users, Briefcase, Brain
} from 'lucide-react';
import { trackToolUsage } from '../services/personalizationService';

const APPS_PER_PAGE = 5;

type Status = 'upcoming' | 'applied' | 'aptitude' | 'gd' | 'technical' | 'hr' | 'offer' | 'rejected';

interface Application {
    id: string;
    company: string;
    role: string;
    ctc: string;
    date: string;
    status: Status;
    notes: string;
}

interface CompanyRound {
    round: string;
    description: string;
    status: Status;
    icon: React.ElementType;
    tips: string[];
    practiceLinks: { label: string; href: string; icon: React.ReactNode }[];
    videoIds?: { title: string; youtubeId: string; channel: string }[];
}

interface CompanyIntel {
    name: string;
    matchAliases: string[];
    rounds: CompanyRound[];
    difficulty: string;
    ctcRange: string;
    testDuration: string;
    keySkills: string[];
}

// Company intelligence database
const COMPANY_INTEL: CompanyIntel[] = [
    {
        name: 'TCS', matchAliases: ['tcs', 'tata consultancy', 'tata consultancy services', 'tcs nqt', 'tcs digital'],
        difficulty: 'Medium', ctcRange: '3.36 – 11 LPA', testDuration: '165 min',
        keySkills: ['Quant Aptitude', 'Verbal', 'Coding', 'Email Writing'],
        rounds: [
            {
                round: 'TCS NQT (Online Test)', description: 'Foundation aptitude test — Numerical, Verbal, Reasoning + Coding sections',
                status: 'aptitude', icon: Brain,
                tips: ['Practice Numerical Ability daily — 15 questions in 40 min', 'Verbal section has RC, Sentence Completion & Arrangement', 'Coding: 1 easy + 1 medium problem in C/Java/Python', 'Email writing section — practice professional email format'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'TCS NQT Complete Preparation', youtubeId: 'rfCRaeOCQ8U', channel: 'Placement Season' },
                ],
            },
            {
                round: 'Technical Interview', description: 'CS fundamentals — DBMS, OS, OOPS, Data Structures, Project discussion',
                status: 'technical', icon: Code2,
                tips: ['Revise DBMS: SQL queries, normalization, joins, transactions', 'OS: Process scheduling, deadlocks, memory management, paging', 'OOPS concepts: Polymorphism, inheritance, encapsulation with examples', 'Be ready to explain your projects with architecture diagrams'],
                practiceLinks: [
                    { label: 'DSA Practice', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'TCS Technical Interview Questions', youtubeId: 'ftONRF624BQ', channel: 'TechLead' },
                ],
            },
            {
                round: 'Managerial / HR Round', description: 'Behavioral, situational, and HR questions',
                status: 'hr', icon: UserCheck,
                tips: ['Prepare "Tell me about yourself" — keep it 2 minutes max', 'Know about TCS: Tata Group, CEO, recent projects, iON, Quartz', 'Questions about relocation, night shifts, bond agreement (2 years)', 'Be confident about your strengths and areas for improvement'],
                practiceLinks: [
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'HR Interview Tips', youtubeId: '1mHjMNZZvFo', channel: 'Interview Tips' },
                ],
            },
        ],
    },
    {
        name: 'Infosys', matchAliases: ['infosys', 'infytq', 'infy', 'infosys sp', 'infosys dse', 'infosys power programmer'],
        difficulty: 'Medium', ctcRange: '3.6 – 9.5 LPA', testDuration: '110 min',
        keySkills: ['Quant', 'Logical Reasoning', 'Pseudocode', 'Coding'],
        rounds: [
            {
                round: 'InfyTQ / Online Assessment', description: 'MCQs on Aptitude, Logical Reasoning, Verbal + Pseudocode + Coding (2-3 problems)',
                status: 'aptitude', icon: Brain,
                tips: ['Pseudocode section is unique to Infosys — practice reading & tracing code', 'Logical reasoning: Focus on patterns, series, and analytical puzzles', 'Coding: Usually 2-3 problems, difficulty varies by role (SP/DSE/PP)', 'For Power Programmer: Expect harder DSA problems (DP, Graphs)'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Infosys InfyTQ Preparation', youtubeId: 'ZT24mTIEkSI', channel: 'Adda247' },
                ],
            },
            {
                round: 'Technical + HR Interview', description: 'Combined technical and HR round (Infosys often merges these)',
                status: 'technical', icon: Code2,
                tips: ['OOPS concepts are heavily asked — prepare with Java examples', 'SQL queries: Practice JOIN, GROUP BY, subqueries', 'Project walkthrough — explain one project end-to-end with challenges', 'Know about Infosys: Narayana Murthy, Infosys Lex, recent innovations'],
                practiceLinks: [
                    { label: 'DSA Practice', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Technical Interview Preparation', youtubeId: 'ftONRF624BQ', channel: 'TechLead' },
                ],
            },
        ],
    },
    {
        name: 'Wipro', matchAliases: ['wipro', 'wipro nlth', 'wipro elite', 'wipro turbo'],
        difficulty: 'Easy-Medium', ctcRange: '3.5 – 6.5 LPA', testDuration: '128 min',
        keySkills: ['Aptitude', 'Written Communication', 'Coding', 'Essay'],
        rounds: [
            {
                round: 'NLTH Online Assessment', description: 'Aptitude + Logical + Verbal + Essay Writing + Coding (1-2 problems)',
                status: 'aptitude', icon: Brain,
                tips: ['Essay writing is unique — practice 300-word essays on current topics', 'Quant: Focus on basics — percentages, ratios, time & work', 'Written communication: Grammar correction, sentence completion', 'Coding: 1-2 simple problems — arrays, strings, basic logic'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Wipro NLTH Preparation', youtubeId: 'Rq7VEdpGXoA', channel: 'CareerRide' },
                ],
            },
            {
                round: 'Technical Interview', description: 'CS fundamentals and project discussion',
                status: 'technical', icon: Code2,
                tips: ['Revise C/C++/Java basics — pointers, OOPs, data types', 'Expect questions on your final year project in detail', 'DBMS and OS basics are commonly asked', 'Know about Wipro: Azim Premji, WILP program, recent tech initiatives'],
                practiceLinks: [
                    { label: 'DSA Practice', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
            },
            {
                round: 'HR Round', description: 'Standard HR questions + company fit assessment',
                status: 'hr', icon: UserCheck,
                tips: ['Be prepared for relocation and service agreement questions', 'Wipro has a 1-year service bond — know the terms', 'Practice group introduction to build confidence'],
                practiceLinks: [
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                ],
            },
        ],
    },
    {
        name: 'Accenture', matchAliases: ['accenture', 'accenture ase', 'accenture analyst'],
        difficulty: 'Easy-Medium', ctcRange: '4.5 – 12 LPA', testDuration: '135 min',
        keySkills: ['Cognitive Assessment', 'Technical Assessment', 'Coding', 'Communication'],
        rounds: [
            {
                round: 'Cognitive + Technical Assessment', description: 'Game-based cognitive test + Technical MCQs + Coding challenge',
                status: 'aptitude', icon: Brain,
                tips: ['Cognitive section has unique game-based problems — practice spatial reasoning', 'Technical MCQs: OOPS, DBMS, Networking, Cloud basics', 'Coding: 1-2 problems — string manipulation, array operations', 'Communication test: Email writing and professional language'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Accenture Assessment Prep', youtubeId: 'UysgBTnw1aE', channel: 'Placement Season' },
                ],
            },
            {
                round: 'Interview (Technical + HR)', description: 'Combined interview round covering technical proficiency and behavioral fit',
                status: 'technical', icon: Code2,
                tips: ['Accenture focuses heavily on communication skills', 'Project discussion — explain your role, technologies, and learnings', 'Be ready for "Why Accenture?" — research their strategy consulting and tech services', 'Scenario-based questions: "How would you handle a conflict with a team member?"'],
                practiceLinks: [
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                    { label: 'GD Practice', href: '/practice-hub?tab=gd', icon: <MessageCircle className="w-3.5 h-3.5" /> },
                ],
            },
        ],
    },
    {
        name: 'Cognizant', matchAliases: ['cognizant', 'cts', 'cognizant genc', 'genc', 'genc next', 'genc elevate'],
        difficulty: 'Easy', ctcRange: '4 – 8 LPA', testDuration: '95 min',
        keySkills: ['Quant', 'Logical', 'Verbal', 'Automata Fix', 'Coding'],
        rounds: [
            {
                round: 'GenC Online Assessment (AMCAT)', description: 'AMCAT-based Quant + Logical + Verbal + Automata Fix + Coding',
                status: 'aptitude', icon: Brain,
                tips: ['Automata Fix is unique — you need to debug/fix given code snippets', 'AMCAT aptitude: Standard quant, logical, and verbal questions', 'GenC Elevate has additional advanced coding problems', 'Time management is key — dont spend too much on one section'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Cognizant GenC Preparation', youtubeId: 'T37BKEN9Z2M', channel: 'Unacademy' },
                ],
            },
            {
                round: 'Technical + HR Interview', description: 'Combined face-to-face interview',
                status: 'hr', icon: UserCheck,
                tips: ['Cognizant interviews are usually shorter and focused on basics', 'DBMS and SQL are frequently asked', 'Know about Cognizant: headquarters, recent acquisitions, digital engineering focus', 'Be ready with 2-3 well-prepared projects'],
                practiceLinks: [
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                ],
            },
        ],
    },
    {
        name: 'Capgemini', matchAliases: ['capgemini', 'capgemini exceller', 'capgemini elevate'],
        difficulty: 'Medium', ctcRange: '3.8 – 7.5 LPA', testDuration: '130 min',
        keySkills: ['Game-Based Aptitude', 'Pseudocode', 'Essay', 'Coding'],
        rounds: [
            {
                round: 'Exceller Online Assessment', description: 'Game-based aptitude + Pseudocode MCQs + Essay + Coding (2 problems)',
                status: 'aptitude', icon: Brain,
                tips: ['Game-based section tests behavioral patterns — stay calm and consistent', 'Pseudocode: Practice tracing code execution and identifying outputs', 'Essay: 200-300 words on given topic — keep it structured with intro-body-conclusion', 'Coding: 2 medium-level problems — practice arrays, strings, and basic DP'],
                practiceLinks: [
                    { label: 'Aptitude Practice', href: '/practice-hub?tab=aptitude', icon: <Calculator className="w-3.5 h-3.5" /> },
                    { label: 'DSA Coding', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
                videoIds: [
                    { title: 'Capgemini Exceller Prep', youtubeId: 'V_6Iu1j5Kak', channel: 'CareerRide' },
                ],
            },
            {
                round: 'Technical Interview', description: 'CS fundamentals and project discussion',
                status: 'technical', icon: Code2,
                tips: ['Focus on OOPS concepts with real-world examples', 'Capgemini values problem-solving — expect scenario-based questions', 'Know about their DEMS model (Design, Execute, Manage, Sustain)', 'Prepare 1 project deeply with technical challenges and solutions'],
                practiceLinks: [
                    { label: 'DSA Practice', href: '/practice-hub?tab=dsa', icon: <Code2 className="w-3.5 h-3.5" /> },
                ],
            },
            {
                round: 'HR Round', description: 'Behavioral and HR interview',
                status: 'hr', icon: UserCheck,
                tips: ['Capgemini HR rounds focus on communication and cultural fit', 'Research their "Get the Future You Want" tagline', 'Be prepared for salary negotiation questions', 'Show enthusiasm for learning and technology trends'],
                practiceLinks: [
                    { label: 'HR Practice', href: '/practice-hub?tab=hr', icon: <UserCheck className="w-3.5 h-3.5" /> },
                ],
            },
        ],
    },
];

const STATUS_CONFIG: { id: Status; label: string; color: string; bgColor: string; borderColor: string }[] = [
    { id: 'upcoming', label: 'Upcoming', color: 'text-slate-300', bgColor: 'bg-slate-800/50', borderColor: 'border-slate-700' },
    { id: 'applied', label: 'Applied', color: 'text-blue-300', bgColor: 'bg-blue-500/5', borderColor: 'border-blue-500/20' },
    { id: 'aptitude', label: 'Aptitude', color: 'text-violet-300', bgColor: 'bg-violet-500/5', borderColor: 'border-violet-500/20' },
    { id: 'gd', label: 'GD', color: 'text-cyan-300', bgColor: 'bg-cyan-500/5', borderColor: 'border-cyan-500/20' },
    { id: 'technical', label: 'Technical', color: 'text-amber-300', bgColor: 'bg-amber-500/5', borderColor: 'border-amber-500/20' },
    { id: 'hr', label: 'HR', color: 'text-emerald-300', bgColor: 'bg-emerald-500/5', borderColor: 'border-emerald-500/20' },
    { id: 'offer', label: 'Offer', color: 'text-green-300', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
    { id: 'rejected', label: 'Rejected', color: 'text-rose-300', bgColor: 'bg-rose-500/5', borderColor: 'border-rose-500/20' },
];

const STORAGE_KEY = 'nexusai_placement_tracker';

// Helper: match company name to intel
const getCompanyIntel = (companyName: string): CompanyIntel | null => {
    const lower = companyName.toLowerCase().trim();
    return COMPANY_INTEL.find(c => c.matchAliases.some(a => lower.includes(a) || a.includes(lower))) || null;
};

// Helper: get current round info based on status
const getCurrentRound = (intel: CompanyIntel, status: Status): CompanyRound | null => {
    return intel.rounds.find(r => r.status === status) || null;
};

// Helper: get next round after current status
const getNextRound = (intel: CompanyIntel, status: Status): CompanyRound | null => {
    const idx = intel.rounds.findIndex(r => r.status === status);
    if (idx === -1 || idx >= intel.rounds.length - 1) return null;
    return intel.rounds[idx + 1];
};

interface PlacementTrackerProps {
    prefillData?: any;
    onPrefillConsumed?: () => void;
}

const PlacementTracker: React.FC<PlacementTrackerProps> = ({ prefillData, onPrefillConsumed }) => {
    const navigate = useNavigate();
    const [applications, setApplications] = useState<Application[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ company: '', role: '', ctc: '', date: '', status: 'upcoming' as Status, notes: '' });
    const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
    const [expandedApp, setExpandedApp] = useState<string | null>(null);
    const [playingVideo, setPlayingVideo] = useState<{ title: string; youtubeId: string } | null>(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { trackToolUsage('placement'); }, []);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) { try { setApplications(JSON.parse(saved)); } catch { } }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
    }, [applications]);

    useEffect(() => {
        if (prefillData && prefillData.company) {
            setForm({
                company: prefillData.company,
                role: prefillData.role || '',
                ctc: prefillData.ctc || '',
                date: new Date().toISOString().split('T')[0],
                status: 'upcoming',
                notes: ''
            });
            setShowForm(true);
            onPrefillConsumed?.();
        }
    }, [prefillData, onPrefillConsumed]);

    const resetForm = () => {
        setForm({ company: '', role: '', ctc: '', date: '', status: 'upcoming', notes: '' });
        setEditingId(null);
        setShowForm(false);
    };

    const paginatedApps = React.useMemo(() => {
        const start = (currentPage - 1) * APPS_PER_PAGE;
        return applications.slice(start, start + APPS_PER_PAGE);
    }, [applications, currentPage]);

    const totalPages = Math.max(1, Math.ceil(applications.length / APPS_PER_PAGE));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.company.trim()) return;

        const intel = getCompanyIntel(form.company);
        const autoCtc = !form.ctc && intel ? intel.ctcRange : form.ctc;

        if (editingId) {
            setApplications(prev => prev.map(app => app.id === editingId ? { ...app, ...form, ctc: autoCtc } : app));
        } else {
            const newApp: Application = { ...form, ctc: autoCtc, id: Date.now().toString() };
            setApplications(prev => [...prev, newApp]);
            // Auto-expand the new app to show prep resources
            setExpandedApp(newApp.id);
        }
        resetForm();
    };

    const handleEdit = (app: Application) => {
        setForm({ company: app.company, role: app.role, ctc: app.ctc, date: app.date, status: app.status, notes: app.notes });
        setEditingId(app.id);
        setShowForm(true);
    };

    const handleDelete = (id: string) => {
        setApplications(prev => prev.filter(app => app.id !== id));
        if (expandedApp === id) setExpandedApp(null);
    };

    const moveToStatus = (id: string, newStatus: Status) => {
        setApplications(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
    };

    const getStatusApps = (status: Status) => applications.filter(app => app.status === status);

    const totalApps = applications.length;
    const offers = applications.filter(a => a.status === 'offer').length;
    const active = applications.filter(a => !['offer', 'rejected'].includes(a.status)).length;

    // Get stage notification for current status
    const getStageNotification = (app: Application): { message: string; type: 'info' | 'warning' | 'success' } | null => {
        const intel = getCompanyIntel(app.company);
        if (!intel) return null;
        const currentRound = getCurrentRound(intel, app.status);
        const nextRound = getNextRound(intel, app.status);
        if (app.status === 'applied') return { message: `${intel.name} typically starts with: ${intel.rounds[0]?.round}. Start preparing now!`, type: 'info' };
        if (app.status === 'offer') return { message: `Congratulations on your ${intel.name} offer!`, type: 'success' };
        if (currentRound) return { message: `You're in the ${currentRound.round}. ${nextRound ? `Next up: ${nextRound.round}` : 'This is the final round — give it your best!'}`, type: 'info' };
        return null;
    };

    // Company Prep Guide Panel
    const renderPrepGuide = (app: Application) => {
        const intel = getCompanyIntel(app.company);
        if (!intel) return (
            <div className="mt-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Lightbulb size={14} className="text-amber-400" />
                    <span>Company data not found. Practice general aptitude, coding, and HR skills from the <Link to="/practice-hub" className="text-violet-400 underline">Practice Hub</Link>.</span>
                </div>
            </div>
        );

        const currentRound = getCurrentRound(intel, app.status);
        const notification = getStageNotification(app);

        return (
            <div className="mt-3 space-y-3 animate-in slide-in-from-top-2">
                {/* Stage Notification */}
                {notification && (
                    <div className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                        notification.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' :
                            'bg-blue-500/10 border-blue-500/20 text-blue-300'
                        }`}>
                        <Bell size={16} className="mt-0.5 flex-shrink-0" />
                        <span className="text-xs">{notification.message}</span>
                    </div>
                )}

                {/* Company Info Bar */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/5 border border-violet-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                                <Building2 size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white text-sm">{intel.name} Interview Process</h4>
                                <p className="text-[10px] text-slate-400">{intel.difficulty} • {intel.testDuration} test • {intel.ctcRange}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {intel.keySkills.map(s => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">{s}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Interview Rounds Timeline */}
                <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                        <Target size={12} /> Interview Rounds & Resources
                    </h5>
                    {intel.rounds.map((round, idx) => {
                        const isCurrentRound = round.status === app.status;
                        const isPastRound = STATUS_CONFIG.findIndex(s => s.id === round.status) < STATUS_CONFIG.findIndex(s => s.id === app.status);
                        return (
                            <div key={idx} className={`p-4 rounded-xl border transition-all ${isCurrentRound ? 'bg-violet-500/10 border-violet-500/30 ring-1 ring-violet-500/20' :
                                isPastRound ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' :
                                    'bg-slate-800/30 border-slate-700/50'
                                }`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <round.icon size={20} className="text-violet-400" />
                                        <div>
                                            <h6 className="text-sm font-bold text-white flex items-center gap-2">
                                                {round.round}
                                                {isCurrentRound && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500 text-white font-bold animate-pulse">CURRENT</span>}
                                                {isPastRound && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">CLEARED</span>}
                                            </h6>
                                            <p className="text-[11px] text-slate-400">{round.description}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tips */}
                                {(isCurrentRound || !isPastRound) && (
                                    <div className="mt-3 space-y-1.5">
                                        {round.tips.map((tip, tidx) => (
                                            <div key={tidx} className="flex items-start gap-2 text-xs text-slate-300">
                                                <Lightbulb size={11} className="text-amber-400 mt-0.5 flex-shrink-0" />
                                                <span>{tip}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Practice Links + Videos */}
                                {(isCurrentRound || !isPastRound) && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {round.practiceLinks.map((link, lidx) => (
                                            <Link key={lidx} to={link.href} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[11px] font-bold hover:bg-violet-500/20 transition-colors">
                                                {link.icon} {link.label}
                                            </Link>
                                        ))}
                                        {round.videoIds?.map((vid, vidx) => (
                                            <button
                                                key={vidx}
                                                onClick={(e) => { e.stopPropagation(); setPlayingVideo(vid); }}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-bold hover:bg-rose-500/20 transition-colors"
                                            >
                                                <Play size={11} /> {vid.title}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div className="flex justify-between items-center pt-2">
                    <Link to={`/company-hub?tab=companies`} className="text-[11px] text-violet-400 hover:underline flex items-center gap-1">
                        <Building2 size={12} /> View all company profiles
                    </Link>
                    <Link to={`/learning-resources?category=company`} className="text-[11px] text-rose-400 hover:underline flex items-center gap-1">
                        <Play size={12} /> Company-specific tutorials
                    </Link>
                </div>
            </div>
        );
    };

    return (
        <div className="layout-container py-8 space-y-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <PageHeader 
                    title="Placement Arena" 
                    subtitle="TRACK APPLICATIONS & MASTER INDUSTRY INTERVIEWS" 
                    icon={<Briefcase />} 
                />
                <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2 bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20 px-6 h-12 text-[10px] font-black uppercase tracking-widest">
                    <Plus size={16} /> Add Application
                </Button>
            </div>

            {/* Video Player Modal */}
            {playingVideo && (() => {
                const getEmbedUrl = (idOrUrl: string) => {
                    if (!idOrUrl) return null;
                    const match = idOrUrl.match(/(?:v=|youtu\.be\/|embed\/)([^&\s?]+)/);
                    const id = match ? match[1] : (idOrUrl.includes('://') ? null : idOrUrl);
                    return id ? `https://www.youtube.com/embed/${id}` : null;
                };
                const embedUrl = getEmbedUrl(playingVideo.youtubeId);
                const watchUrl = playingVideo.youtubeId.includes('://') ? playingVideo.youtubeId : `https://www.youtube.com/watch?v=${playingVideo.youtubeId}`;

                return (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPlayingVideo(null)}>
                        <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-white">{playingVideo.title}</h3>
                                <button onClick={() => setPlayingVideo(null)} className="text-slate-400 hover:text-white"><X size={22} /></button>
                            </div>
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                {embedUrl ? (
                                    <iframe className="absolute inset-0 w-full h-full rounded-2xl" src={`${embedUrl}?autoplay=1&rel=0`} title={playingVideo.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                                ) : (
                                    <div className="absolute inset-0 w-full h-full rounded-2xl bg-slate-900 flex flex-col items-center justify-center p-6 text-center border border-slate-700">
                                        <Zap className="w-10 h-10 text-violet-400 mb-3" />
                                        <h4 className="text-white font-bold mb-2">Embed Unavailable</h4>
                                        <p className="text-xs text-slate-500 max-w-sm">This content must be viewed directly on the provider's platform.</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex justify-end">
                                <a
                                    href={watchUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
                                >
                                    <ExternalLink size={16} /> Open in YouTube
                                </a>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="premium-card p-6 bg-slate-900/40 border-slate-700/30 flex flex-col items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total</p>
                    <p className="text-3xl font-black text-white italic">{totalApps}</p>
                </div>
                <div className="premium-card p-6 bg-slate-900/40 border-blue-500/20 flex flex-col items-center">
                    <p className="text-[10px] font-black text-blue-500/60 uppercase tracking-[0.2em] mb-2">Active</p>
                    <p className="text-3xl font-black text-blue-400 italic">{active}</p>
                </div>
                <div className="premium-card p-6 bg-slate-900/40 border-emerald-500/20 flex flex-col items-center">
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em] mb-2">Offers</p>
                    <p className="text-3xl font-black text-emerald-400 italic">{offers}</p>
                </div>
            </div>

            {/* Actions & Filters */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                <div className="flex items-center gap-2 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
                    <button 
                        onClick={() => setViewMode('board')} 
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            viewMode === 'board' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Board
                    </button>
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                            viewMode === 'list' ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        List
                    </button>
                </div>
                
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    MU Placement Season 2024-25
                </p>
            </div>

            {/* Getting Started / Empty State */}
            {applications.length === 0 && !showForm && (
                <div className="py-12 flex flex-col items-center text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    <div className="space-y-2">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto border border-slate-700/50">
                            <ClipboardList className="w-8 h-8 text-slate-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">No applications tracked yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Start tracking your placement journey. Add your first application manually or use a template below.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
                        {[
                            { name: 'TCS', ctc: '3.36-11 LPA', color: 'border-blue-500/20 text-blue-400' },
                            { name: 'Infosys', ctc: '3.6-9.5 LPA', color: 'border-amber-500/20 text-amber-400' },
                            { name: 'Accenture', ctc: '4.5-12 LPA', color: 'border-rose-500/20 text-rose-400' },
                            { name: 'Wipro', ctc: '3.5-6.5 LPA', color: 'border-cyan-500/20 text-cyan-400' }
                        ].map(tmpl => (
                            <button
                                key={tmpl.name}
                                onClick={() => {
                                    setForm({ ...form, company: tmpl.name, ctc: tmpl.ctc, status: 'applied', date: new Date().toISOString().split('T')[0] });
                                    setShowForm(true);
                                }}
                                className={`p-4 rounded-2xl bg-slate-800/30 border ${tmpl.color} hover:bg-slate-800/50 transition-all text-left flex flex-col gap-2`}
                            >
                                <Building2 size={18} />
                                <div>
                                    <p className="text-sm font-bold text-white">{tmpl.name}</p>
                                    <p className="text-[10px] opacity-60 font-mono italic">{tmpl.ctc}</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    <Button onClick={() => setShowForm(true)} className="bg-violet-600 hover:bg-violet-500 gap-2">
                        <Plus size={16} /> Add Custom Application
                    </Button>
                </div>
            )}

            {/* Add/Edit Form Modal */}
            {showForm && (
                <Card className="p-6 border-rose-500/20 bg-slate-800/80 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="font-bold text-white">{editingId ? 'Edit' : 'Add'} Application</h3>
                        <button onClick={resetForm} className="text-slate-400 hover:text-white"><X size={18} /></button>
                    </div>

                    {/* Company Intel Preview */}
                    {form.company && getCompanyIntel(form.company) && (
                        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center gap-3">
                            <Zap size={16} className="text-violet-400" />
                            <div>
                                <p className="text-xs font-bold text-violet-300">
                                    {getCompanyIntel(form.company)!.name} detected — round-by-round prep guide will be auto-generated!
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                    {getCompanyIntel(form.company)!.rounds.length} interview rounds • {getCompanyIntel(form.company)!.difficulty} difficulty • {getCompanyIntel(form.company)!.ctcRange}
                                </p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="tracker-company" className="block text-xs text-slate-400 mb-1">Company *</label>
                            <Input id="tracker-company" name="company" aria-label="Company Name" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="e.g. TCS, Infosys, Wipro" required />
                        </div>
                        <div>
                            <label htmlFor="tracker-role" className="block text-xs text-slate-400 mb-1">Role</label>
                            <Input id="tracker-role" name="role" aria-label="Job Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Software Engineer" />
                        </div>
                        <div>
                            <label htmlFor="tracker-ctc" className="block text-xs text-slate-400 mb-1">CTC</label>
                            <Input id="tracker-ctc" name="ctc" aria-label="Expected or Offered CTC" value={form.ctc} onChange={(e) => setForm({ ...form, ctc: e.target.value })} placeholder={getCompanyIntel(form.company)?.ctcRange || 'e.g. 3.6 LPA'} />
                        </div>
                        <div>
                            <label htmlFor="tracker-date" className="block text-xs text-slate-400 mb-1">Date</label>
                            <Input id="tracker-date" name="applicationDate" aria-label="Application Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                        </div>
                        <div>
                            <label htmlFor="tracker-status" className="block text-xs text-slate-400 mb-1">Current Status</label>
                            <select id="tracker-status" name="status" aria-label="Application Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-violet-500 outline-none">
                                {STATUS_CONFIG.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="tracker-notes" className="block text-xs text-slate-400 mb-1">Notes</label>
                            <Input id="tracker-notes" name="notes" aria-label="Additional Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes..." />
                        </div>
                        <div className="md:col-span-2 flex gap-3 justify-end">
                            <Button variant="ghost" type="button" onClick={resetForm}>Cancel</Button>
                            <Button type="submit" className="bg-rose-600 hover:bg-rose-500 gap-2"><Check size={16} /> {editingId ? 'Update' : 'Add'}</Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* Board View */}
            {viewMode === 'board' && applications.length > 0 && (
                <div className="overflow-x-auto pb-4">
                    <div className="flex gap-4 min-w-[1200px]">
                        {STATUS_CONFIG.map(status => {
                            const apps = getStatusApps(status.id);
                            return (
                                <div key={status.id} className={`flex-1 min-w-[200px] rounded-2xl border ${status.borderColor} ${status.bgColor} p-3`}>
                                    <div className="flex items-center justify-between mb-3 px-1">
                                        <h4 className={`text-xs font-black uppercase tracking-wider ${status.color}`}>{status.label}</h4>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-bold">{apps.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {apps.map(app => {
                                            const intel = getCompanyIntel(app.company);
                                            const notification = getStageNotification(app);
                                            return (
                                                <div key={app.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 group hover:border-slate-500 transition-all">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                                                                {app.company}
                                                                {intel && <span title="Company intel available"><Zap size={10} className="text-violet-400" /></span>}
                                                            </h5>
                                                            {app.role && <p className="text-[10px] text-slate-500">{app.role}</p>}
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => setExpandedApp(expandedApp === app.id ? null : app.id)} className="p-1 text-slate-500 hover:text-violet-400" title="View prep guide">
                                                                <BookOpen size={12} />
                                                            </button>
                                                            <button onClick={() => handleEdit(app)} className="p-1 text-slate-500 hover:text-white"><Edit3 size={12} /></button>
                                                            <button onClick={() => handleDelete(app.id)} className="p-1 text-slate-500 hover:text-rose-400"><Trash2 size={12} /></button>
                                                        </div>
                                                    </div>
                                                    {app.ctc && <p className="text-[10px] text-emerald-400 flex items-center gap-1 mb-1"><IndianRupee size={10} />{app.ctc}</p>}
                                                    {app.date && <p className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10} />{app.date}</p>}
                                                    {app.notes && <p className="text-[10px] text-slate-600 mt-1 italic">"{app.notes}"</p>}

                                                    {/* Mini notification */}
                                                    {intel && notification && (
                                                        <div className="mt-2 p-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
                                                            <p className="text-[9px] text-blue-300 flex items-start gap-1">
                                                                <Bell size={9} className="mt-0.5 flex-shrink-0" />
                                                                {notification.message}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Quick resource links for current round */}
                                                    {intel && (() => {
                                                        const round = getCurrentRound(intel, app.status) || (app.status === 'applied' ? intel.rounds[0] : null);
                                                        if (!round) return null;
                                                        return (
                                                            <div className="mt-2 flex flex-wrap gap-1">
                                                                {round.practiceLinks.slice(0, 2).map((link, i) => (
                                                                    <Link key={i} to={link.href} className="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 text-[9px] font-bold hover:bg-violet-500/20" onClick={e => e.stopPropagation()}>
                                                                        {link.icon} {link.label}
                                                                    </Link>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}

                                                    {/* Quick move buttons */}
                                                    {!['offer', 'rejected'].includes(status.id) && (
                                                        <div className="flex gap-1 mt-2 pt-2 border-t border-slate-800">
                                                            {STATUS_CONFIG.filter(s => s.id !== status.id).slice(0, 3).map(s => (
                                                                <button key={s.id} onClick={() => moveToStatus(app.id, s.id)} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500 hover:text-white transition-all" title={`Move to ${s.label}`}>
                                                                    → {s.label.slice(2, 5)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {apps.length === 0 && (
                                            <div className="p-4 text-center text-[11px] text-slate-600 border border-dashed border-slate-700 rounded-xl">
                                                No applications
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && applications.length > 0 && (
                <div className="space-y-3">
                    {paginatedApps.map(app => {
                            const statusConfig = STATUS_CONFIG.find(s => s.id === app.status);
                            const intel = getCompanyIntel(app.company);
                            const isExpanded = expandedApp === app.id;
                            return (
                                <Card key={app.id} className={`overflow-hidden border ${isExpanded ? 'border-violet-500/30' : 'border-slate-700/50'} transition-all`}>
                                    <div className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-all cursor-pointer" onClick={() => setExpandedApp(isExpanded ? null : app.id)}>
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                                                <Building2 size={18} className="text-slate-400" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                                                    {app.company}
                                                    {intel && <span title="Prep guide available"><Zap size={12} className="text-violet-400" /></span>}
                                                </h4>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-0.5">
                                                    {app.role && <span>{app.role}</span>}
                                                    {app.ctc && <span className="text-emerald-400">{app.ctc}</span>}
                                                    {app.date && <span>{app.date}</span>}
                                                    {intel && <span className="text-violet-400">• {intel.rounds.length} rounds</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${statusConfig?.bgColor} ${statusConfig?.color} border ${statusConfig?.borderColor}`}>
                                                {statusConfig?.label}
                                            </span>
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(app); }} className="p-1.5 text-slate-500 hover:text-white"><Edit3 size={14} /></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(app.id); }} className="p-1.5 text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
                                            <ChevronDown size={16} className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                        </div>
                                    </div>

                                    {/* Expanded Prep Guide */}
                                    {isExpanded && (
                                        <div className="px-4 pb-4 border-t border-slate-700/30">
                                            {renderPrepGuide(app)}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    }
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between pt-4">
                            <span className="text-xs text-slate-500">Page {currentPage} of {totalPages}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
                                <Button size="sm" variant="ghost" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Expanded App Prep Guide (for board view) */}
            {viewMode === 'board' && expandedApp && (() => {
                const app = applications.find(a => a.id === expandedApp);
                if (!app) return null;
                return (
                    <Card className="p-6 border-violet-500/20">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <BookOpen size={18} className="text-violet-400" />
                                Prep Guide: {app.company}
                            </h3>
                            <button onClick={() => setExpandedApp(null)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                        </div>
                        {renderPrepGuide(app)}
                    </Card>
                );
            })()}
        </div>
    );
};

export default PlacementTracker;
