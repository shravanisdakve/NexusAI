import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Input, Card, Spinner, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui';
import {
    Search,
    ChevronRight,
    Book,
    Cpu,
    Code,
    Settings,
    Info,
    Download,
    GraduationCap,
    BookOpen,
    Brain,
    ArrowLeft,
    TrendingUp,
    Sparkles,
    Play,
    Layers,
    Compass,
    X,
    ArrowRight
} from 'lucide-react';
import { getCurriculum, SemesterData, Subject, Module } from '@/services/curriculumService';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import PageLayout from '../components/ui/PageLayout';

const getMockSubjects = (branch: string, sem: number): Subject[] => {
    const b = branch.toLowerCase();
    
    // First Year (Common for almost all branches in MU)
    if (sem === 1) {
        return [
            {
                subjectCode: "BSC101", name: "Applied Mathematics-I", credits: 4, category: "Basic Science",
                modules: [{ moduleNumber: 1, title: "Complex Numbers", topics: ["De Moivre's Theorem", "Exponential Form"] }]
            },
            {
                subjectCode: "BSC102", name: "Applied Physics-I", credits: 3, category: "Basic Science",
                modules: [{ moduleNumber: 1, title: "Quantum Physics", topics: ["De Broglie hypothesis", "Schrodinger equation"] }]
            },
            {
                subjectCode: "ESC101", name: "Engineering Mechanics", credits: 3, category: "Engineering Science",
                modules: [{ moduleNumber: 1, title: "Statics", topics: ["Resolutions of forces", "Equilibrium"] }]
            }
        ];
    }

    if (sem === 2) {
        return [
            {
                subjectCode: "BSC201", name: "Applied Mathematics-II", credits: 4, category: "Basic Science",
                modules: [{ moduleNumber: 1, title: "Differential Equations", topics: ["First order", "Higher order"] }]
            },
            {
                subjectCode: "ESC201", name: "Engineering Graphics", credits: 3, category: "Engineering Science",
                modules: [{ moduleNumber: 1, title: "Projections", topics: ["Lines", "Planes"] }]
            },
            {
                subjectCode: "ESC202", name: "C Programming", credits: 3, category: "Engineering Science",
                modules: [{ moduleNumber: 1, title: "Basics", topics: ["Loops", "Arrays", "Functions"] }]
            }
        ];
    }

    // Computer Engineering (CSE)
    if (b.includes('comp') || b === 'cse' || b.includes('aids')) {
        if (sem === 3) return [
            { subjectCode: "CSC301", name: "Applied Mathematics-III", credits: 4, category: "Core", modules: [{ moduleNumber: 1, title: "Laplace Transform", topics: ["Properties", "Inverse Laplace"] }] },
            { subjectCode: "CSC302", name: "Discrete Structures", credits: 3, category: "Core", modules: [{ moduleNumber: 1, title: "Set Theory", topics: ["Logic", "Relations"] }] },
            { subjectCode: "CSC303", name: "Data Structures", credits: 3, category: "Core", modules: [{ moduleNumber: 1, title: "Linear DS", topics: ["Linked Lists", "Stacks"] }] },
        ];
        if (sem === 4) return [
            { subjectCode: "CSC401", name: "Applied Mathematics-IV", credits: 4, category: "Core", modules: [{ moduleNumber: 1, title: "Probability", topics: ["Random Variables"] }] },
            { subjectCode: "CSC402", name: "Analysis of Algorithms", credits: 3, category: "Core", modules: [{ moduleNumber: 1, title: "Sorting", topics: ["QuickSort", "MergeSort"] }] },
            { subjectCode: "CSC403", name: "Operating Systems", credits: 3, category: "Core", modules: [{ moduleNumber: 1, title: "Processes", topics: ["Scheduling"] }] },
        ];
    }

    // IT Engineering
    if (b === 'it' || b.includes('information')) {
        if (sem === 3) return [
            { subjectCode: "ITC301", name: "Engineering Math-III", credits: 4, category: "Core", modules: [{ moduleNumber: 1, title: "Matrices", topics: ["Eigenvalues"] }] },
            { subjectCode: "ITC302", name: "Data Structures", credits: 3, category: "Core", modules: [{ moduleNumber: 1, title: "Introduction", topics: ["Search", "Sort"] }] },
        ];
    }

    return [];
};

const INTERNET_LINKS_BY_SUBJECT_CODE: Record<string, { tutorial?: string; material?: string }> = {
    BSC101: {
        tutorial: 'https://www.khanacademy.org/math/calculus-1',
        material: 'https://tutorial.math.lamar.edu/Classes/CalcI/CalcI.aspx'
    },
    ESC101: {
        tutorial: 'https://nptel.ac.in/courses',
        material: 'https://openstax.org/details/books/university-physics-volume-1'
    },
    BSC201: {
        tutorial: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/video_galleries/video-lectures/',
        material: 'https://ocw.mit.edu/courses/18-03-differential-equations-spring-2010/'
    }
};

const INTERNET_LINKS_BY_SUBJECT_KEYWORD: Array<{ keywords: string[]; tutorial: string; material: string }> = [
    {
        keywords: ['mathematics', 'math', 'calculus', 'differential equations', 'linear algebra'],
        tutorial: 'https://www.khanacademy.org/math/calculus-1',
        material: 'https://tutorial.math.lamar.edu/'
    },
    {
        keywords: ['mechanics', 'physics'],
        tutorial: 'https://nptel.ac.in/courses',
        material: 'https://openstax.org/details/books/university-physics-volume-1'
    },
    {
        keywords: ['data structures', 'algorithms', 'programming', 'computer'],
        tutorial: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
        material: 'https://www.geeksforgeeks.org/dsa/dsa-tutorial-learn-data-structures-and-algorithms/'
    },
    {
        keywords: ['chemistry'],
        tutorial: 'https://www.khanacademy.org/science/chemistry',
        material: 'https://openstax.org/details/books/chemistry-2e'
    }
];

const MODULE_SPECIFIC_LINKS: Record<string, { tutorial?: string; material?: string }> = {
    "Complex Numbers": {
        tutorial: "https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:complex",
        material: "https://tutorial.math.lamar.edu/Classes/Alg/ComplexNumbers.aspx"
    }
};

const buildTutorialSearchLink = (subject: string, moduleTitle: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject} ${moduleTitle} tutorial`)}`;

const buildMaterialSearchLink = (subject: string, moduleTitle: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(`${subject} ${moduleTitle} lecture notes pdf`)}`;

const normalizeHttpUrl = (url?: string): string => {
    const value = String(url || '').trim();
    if (!value) return '';
    if (/^https?:\/\//i.test(value)) return value;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(value)) return `https://${value}`;
    return '';
};

const openExternalResource = (url: string) => {
    const safeUrl = normalizeHttpUrl(url);
    if (!safeUrl) return;
    const anchor = document.createElement('a');
    anchor.href = safeUrl;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
};

const normalizeCurriculumData = (raw: any, fallbackSemester: number): SemesterData => {
    const rawSubjects = Array.isArray(raw?.subjects) ? raw.subjects : [];

    const subjects: Subject[] = rawSubjects.map((subject: any) => {
        const rawModules = Array.isArray(subject?.modules) ? subject.modules : [];
        const modules: Module[] = rawModules.map((module: any, moduleIndex: number) => ({
            moduleNumber: Number(module?.moduleNumber) || (moduleIndex + 1),
            title: String(module?.title || `Module ${moduleIndex + 1}`),
            topics: Array.isArray(module?.topics) ? module.topics.map((topic: any) => String(topic)) : [],
            technicalRequirements: typeof module?.technicalRequirements === 'string' ? module.technicalRequirements : undefined,
            pedagogyFocus: typeof module?.pedagogyFocus === 'string' ? module.pedagogyFocus : undefined,
            weightage: typeof module?.weightage === 'number' ? module.weightage : undefined
        }));

        return {
            subjectCode: String(subject?.subjectCode || '').trim(),
            name: String(subject?.name || 'Untitled Subject'),
            credits: Number(subject?.credits) || 0,
            category: String(subject?.category || 'General'),
            modules,
            tutorials: Array.isArray(subject?.tutorials) ? subject.tutorials : undefined
        };
    });

    return {
        semesterNumber: Number(raw?.semesterNumber) || fallbackSemester,
        subjects
    };
};

const buildEmptySemester = (sem: number): SemesterData => ({
    semesterNumber: sem,
    subjects: []
});

const resolveResourceLinks = (subject: Subject, module: Module): { tutorial: string; material: string } => {
    const tutorials = Array.isArray(subject.tutorials) ? subject.tutorials : [];
    const videoItem = tutorials.find((item: any) => item?.type === 'video' || item?.type === 'interactive' || item?.type === 'tutorial');
    const pdfItem = tutorials.find((item: any) => item?.type === 'pdf' || item?.type === 'notes' || item?.type === 'material');
    const curatedByCode = INTERNET_LINKS_BY_SUBJECT_CODE[subject.subjectCode] || {};
    const subjectLower = String(subject.name || '').toLowerCase();
    const curatedByKeyword = INTERNET_LINKS_BY_SUBJECT_KEYWORD.find((entry) =>
        entry.keywords.some((keyword) => subjectLower.includes(keyword))
    );
    const extraLink = tutorials.find((item: any) => item?.link && item?.link !== videoItem?.link)?.link;
    const tutorialFromData = normalizeHttpUrl(videoItem?.link) || normalizeHttpUrl(tutorials[0]?.link);
    const materialFromData = normalizeHttpUrl(pdfItem?.link) || normalizeHttpUrl(extraLink);

    const normalizedTitle = String(module.title || '').trim().toLowerCase();
    const moduleLinks = Object.entries(MODULE_SPECIFIC_LINKS).find(([key]) => key.toLowerCase() === normalizedTitle)?.[1] || {};

    return {
        tutorial:
            moduleLinks.tutorial ||
            tutorialFromData ||
            curatedByCode.tutorial ||
            curatedByKeyword?.tutorial ||
            buildTutorialSearchLink(subject.name, module.title),
        material:
            moduleLinks.material ||
            materialFromData ||
            curatedByCode.material ||
            curatedByKeyword?.material ||
            buildMaterialSearchLink(subject.name, module.title)
    };
};

const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
        <>
            {parts.map((part, i) => 
                part.toLowerCase() === query.toLowerCase() 
                    ? <span key={i} className="bg-blue-500/30 text-blue-200 rounded-sm px-0.5">{part}</span> 
                    : part
            )}
        </>
    );
};

const CurriculumExplorer: React.FC = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const { user } = useAuth();
    
    // Auto-initialize from user profile
    const [branch, setBranch] = useState<string>(user?.branch || '');
    const [semester, setSemester] = useState<number | null>(user?.semester ? Number(user.semester) : null);
    const [showSwitcher, setShowSwitcher] = useState(false);
    
    const [curriculum, setCurriculum] = useState<SemesterData | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

    const branches = [
        { value: 'common', label: 'Common for All Branches' },
        { value: 'cse', label: 'Computer Engineering (CSE)' },
        { value: 'it', label: 'Information Technology (IT)' },
        { value: 'extc', label: 'Electronics & Telecom (EXTC)' },
        { value: 'mech', label: 'Mechanical Engineering' },
        { value: 'civil', label: 'Civil Engineering' },
        { value: 'aids', label: 'AI & Data Science' }
    ];

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            if (!branch || !semester) {
                setCurriculum(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            setLoadError('');
            try {
                const data = await getCurriculum(branch, semester);
                if (cancelled) return;
                if (data.success && data.curriculum && data.curriculum.subjects?.length > 0) {
                    setCurriculum(normalizeCurriculumData(data.curriculum, semester));
                } else {
                    const mockSubjects = getMockSubjects(branch, semester);
                    if (mockSubjects.length > 0) {
                        setCurriculum({ semesterNumber: semester, subjects: mockSubjects });
                        setLoadError('');
                    } else {
                        setCurriculum(buildEmptySemester(semester));
                        setLoadError(data?.message || 'No curriculum available.');
                    }
                }
            } catch (error: any) {
                if (cancelled) return;
                const mockSubjects = getMockSubjects(branch, semester);
                if (mockSubjects.length > 0) {
                    setCurriculum({ semesterNumber: semester, subjects: mockSubjects });
                    setLoadError('');
                } else {
                    setCurriculum(buildEmptySemester(semester));
                    setLoadError('Curriculum data unavailable.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        run();
        return () => { cancelled = true; };
    }, [branch, semester]);

    useEffect(() => {
        if (curriculum?.subjects) {
            const filtered = curriculum.subjects.filter(s =>
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSubjects(filtered);
            
            // AUTO-SYNC: If current selection is invalid for new curriculum, reset it
            const isSelectionValid = filtered.some(s => s.subjectCode.toLowerCase() === expandedSubject?.toLowerCase());
            if (filtered.length > 0 && (!expandedSubject || !isSelectionValid)) {
                setExpandedSubject(filtered[0].subjectCode);
            }
        } else {
            setFilteredSubjects([]);
        }
    }, [curriculum, searchQuery]);

    const selectedSubject = (curriculum?.subjects || []).find(s => 
        s.subjectCode.toLowerCase() === expandedSubject?.toLowerCase()
    );

    // DEBUG: Selection Pipeline Trace
    useEffect(() => {
        if (expandedSubject) {
            console.log('Selection Triggered:', expandedSubject);
            console.log('Curriculum Status:', curriculum ? 'Loaded' : 'Missing');
            console.log('Match Found:', !!selectedSubject);
        }
    }, [expandedSubject, selectedSubject, curriculum]);

    const SubjectDetailView: React.FC<{ subject: Subject }> = ({ subject }) => {
        const linksByModule = (subject.modules || []).reduce((acc, mod) => {
            acc[mod.moduleNumber] = resolveResourceLinks(subject, mod);
            return acc;
        }, {} as Record<number, { tutorial: string; material: string }>);

        return (
            <div className="max-w-4xl mx-auto py-3">
                {/* 1. HERO CONTROL CENTER */}
                <div className="bg-slate-900/40 border border-white/[0.06] rounded-[2rem] p-5 mb-4 relative overflow-hidden group shadow-2xl shadow-black/40">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="relative z-10">
                        <div className="flex flex-wrap items-start justify-between gap-5 mb-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="px-3.5 py-1 bg-violet-500/10 text-violet-400 text-[9px] font-black rounded-lg border border-violet-500/20 uppercase tracking-[0.2em] shadow-sm">
                                        {subject.subjectCode}
                                    </span>
                                    <span className="px-3.5 py-1 bg-white/5 text-slate-500 text-[9px] font-black rounded-lg border border-white/5 uppercase tracking-[0.2em]">
                                        {subject.category}
                                    </span>
                                </div>
                                <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-[0.9] max-w-2xl">
                                    {subject.name}
                                </h2>
                            </div>

                            <div className="flex gap-3">
                                <div className="bg-slate-950/80 border border-white/[0.04] rounded-2xl p-4 min-w-[100px] text-center shadow-xl">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Credits</p>
                                    <p className="text-2xl font-black text-violet-500 drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">{subject.credits}</p>
                                </div>
                                <div className="bg-slate-950/80 border border-white/[0.04] rounded-2xl p-4 min-w-[100px] text-center shadow-xl">
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5">Modules</p>
                                    <p className="text-2xl font-black text-slate-300 italic">{(subject.modules || []).length}</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-end">
                            <div className="space-y-3 lg:col-span-3">
                                <div className="flex items-center gap-2.5 text-slate-400">
                                    <div className="p-1.5 bg-violet-600/10 rounded-lg"><Info size={13} className="text-violet-500" /></div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Syllabus Overview</p>
                                </div>
                                <p className="text-slate-500 text-[10px] font-medium leading-[1.6] max-w-xl italic">
                                    Optimized for technical depth and exam efficiency. High-performance modules identified in current semester topology. Recommended focus on practical implementation of theoretical frameworks.
                                </p>
                            </div>
                            
                            <div className="flex justify-end lg:col-span-2">
                                <button
                                    onClick={() => {
                                        const query = `Generate a targeted AI study plan for ${subject.name}`;
                                        navigate(`/tutor?q=${encodeURIComponent(query)}`);
                                    }} 
                                    className="relative group/btn flex items-center gap-4 bg-violet-600 hover:bg-violet-500 text-white py-3 px-6 rounded-2xl transition-all shadow-2xl shadow-violet-950/60 active:scale-95 border border-white/10"
                                >
                                    <Brain size={18} className="animate-pulse" />
                                    <div className="text-left">
                                        <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 leading-tight mb-1">Initiate AI</p>
                                        <p className="text-[13px] font-black uppercase tracking-[0.2em] leading-tight italic">Study Plan</p>
                                    </div>
                                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full opacity-0 group-hover/btn:opacity-30 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. MODULE TOPOLOGY GRID */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 px-6 md:px-0">
                        <div className="p-1.5 bg-slate-900/60 rounded-xl border border-white/5"><Layers size={13} className="text-violet-500" /></div>
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Module Blueprints</h3>
                        <div className="flex-1 h-px bg-white/[0.04]" />
                    </div>

                    <div className="grid gap-3">
                        {(subject.modules || []).map((mod) => (
                            <Card key={mod.moduleNumber} className="group relative overflow-hidden bg-slate-900/40 border-white/[0.04] p-0 rounded-2xl hover:border-violet-500/30 transition-all hover:bg-slate-900/60 shadow-xl">
                                <div className="flex flex-col md:flex-row min-h-[100px]">
                                    <div className="w-full md:w-12 bg-slate-950/60 flex items-center justify-center border-b md:border-b-0 md:border-r border-white/5 relative shrink-0 text-xl font-black text-slate-800 italic group-hover:text-violet-600/40 transition-all duration-500">
                                        {String(mod.moduleNumber).padStart(2, '0')}
                                    </div>
                                    
                                    <div className="flex-1 p-2.5 flex flex-col xl:flex-row justify-between gap-3">
                                        <div className="space-y-2 flex-1">
                                            <h4 className="text-base font-black text-slate-200 uppercase tracking-tight group-hover:text-white transition-colors leading-tight italic">
                                                {mod.title}
                                            </h4>
                                            <div className="flex flex-wrap gap-x-3 gap-y-1">
                                                {(mod.topics || []).map((topic, i) => (
                                                    <div key={i} className="flex items-center gap-2 group/topic">
                                                        <div className="w-1 h-1 rounded-full bg-violet-600/40 group-hover/topic:bg-violet-500 group-hover/topic:scale-125 transition-all" />
                                                        <span className="text-[10px] font-bold text-slate-500 group-hover/topic:text-slate-300 transition-colors uppercase tracking-wide leading-none">{topic}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-1.5 shrink-0">
                                            {[
                                                { label: 'Tutorials', icon: Play, link: linksByModule[mod.moduleNumber]?.tutorial, color: 'hover:text-blue-400 hover:bg-blue-500/10' },
                                                { label: 'Notes', icon: Download, link: linksByModule[mod.moduleNumber]?.material, color: 'hover:text-emerald-400 hover:bg-emerald-500/10' },
                                                { label: 'AI Tutor', icon: Brain, click: () => navigate(`/tutor?q=Explain ${mod.title}`), color: 'hover:text-amber-400 hover:bg-amber-500/10' }
                                            ].map((btn) => (
                                                <button 
                                                    key={btn.label}
                                                    onClick={() => btn.click ? btn.click() : (btn.link && openExternalResource(btn.link))}
                                                    className={`px-3 py-2 rounded-xl bg-slate-950/40 border border-white/5 text-[8px] font-black uppercase tracking-widest text-slate-500 transition-all flex items-center gap-2 active:scale-95 ${btn.color} ${!btn.link && !btn.click ? 'opacity-30 cursor-not-allowed' : ''}`}
                                                >
                                                    <btn.icon size={11} /> {btn.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    // Rendering
    return (
        <PageLayout 
            main={
                <div className="h-full">
                    <AnimatePresence mode="wait">
                        {loading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[500px]">
                                <div className="w-10 h-10 border-2 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Mapping MU Syllabus...</p>
                            </motion.div>
                        ) : selectedSubject ? (
                            <motion.div
                                key={selectedSubject.subjectCode}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="overflow-y-auto custom-scrollbar h-full pr-1 px-4"
                            >
                                <SubjectDetailView subject={selectedSubject} />
                            </motion.div>
                        ) : (
                            <div className="flex h-full flex-col items-center justify-center p-12 text-center bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/[0.04]">
                                <div className="w-20 h-20 rounded-3xl bg-slate-950/60 border border-white/5 flex items-center justify-center mb-10 relative group">
                                    <div className="absolute inset-0 bg-violet-500/10 blur-2xl rounded-full group-hover:bg-violet-500/20 transition-colors" />
                                    <BookOpen className="w-10 h-10 text-slate-700 group-hover:text-violet-500 transition-colors" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-300 italic uppercase">Workspace Ready</h3>
                                <p className="text-slate-600 mt-4 max-w-[280px] text-[10px] font-bold uppercase tracking-[0.2em] leading-relaxed">
                                    {expandedSubject 
                                        ? `Synchronizing details for ${expandedSubject}...`
                                        : 'Select a subject from your semester topology on the right to begin exploration.'
                                    }
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            }
            side={
                <div className="flex flex-col h-full space-y-3">
                    {/* 1. ACADEMIC SCOPE */}
                    <div className="bg-slate-900/40 border border-white/[0.06] rounded-[2rem] p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Academic Scope</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="branch-select" className="sr-only">Select Branch</label>
                            <select
                                id="branch-select"
                                name="branch"
                                className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 px-4 text-[11px] font-bold text-slate-300 focus:border-violet-500/50 outline-none appearance-none"
                                value={branch}
                                onChange={(e) => {
                                    setBranch(e.target.value);
                                    setExpandedSubject(null);
                                }}
                            >
                                {branches.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                            </select>
                            <label htmlFor="semester-select" className="sr-only">Select Semester</label>
                            <select
                                id="semester-select"
                                name="semester"
                                className="w-full bg-slate-950/60 border border-white/5 rounded-xl py-3 px-4 text-[11px] font-bold text-slate-300 focus:border-violet-500/50 outline-none appearance-none"
                                value={semester ?? ''}
                                onChange={(e) => {
                                    setSemester(Number(e.target.value));
                                    setExpandedSubject(null);
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                            </select>
                        </div>
                        <button className="text-[9px] font-black text-slate-600 hover:text-white transition-colors uppercase tracking-widest">Clear selection</button>
                    </div>

                    {/* 2. BRANCH TOPOLOGY */}
                    <div className="flex-1 flex flex-col bg-slate-900/40 border border-white/[0.06] rounded-[2rem] overflow-hidden">
                        <div className="p-4 pb-2 flex items-center justify-between">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Branch Topology</p>
                            <span className="text-[8px] font-black text-slate-600 bg-white/5 px-2 py-1 rounded-md uppercase">{filteredSubjects.length} subjects</span>
                        </div>
                        
                        <div className="px-4 mb-2">
                            <div className="relative group/search">
                                <label htmlFor="subject-search" className="sr-only">Search Subjects</label>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 group-hover/search:text-violet-500 transition-colors" />
                                <input
                                    id="subject-search"
                                    name="search"
                                    type="text"
                                    className="w-full bg-slate-950/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[11px] font-bold text-slate-300 placeholder:text-slate-700 outline-none focus:border-violet-500/30 transition-all"
                                    placeholder="Search system..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6">
                            <div className="space-y-1.5">
                                {filteredSubjects.map((subject) => (
                                    <button
                                        key={subject.subjectCode}
                                        onClick={() => {
                                            console.log('SELECTING:', subject.subjectCode);
                                            setExpandedSubject(subject.subjectCode);
                                        }}
                                        className={`w-full group relative flex flex-col p-4 rounded-2xl transition-all border text-left ${expandedSubject?.toLowerCase() === subject.subjectCode.toLowerCase()
                                            ? 'bg-violet-600/10 border-violet-500/20 shadow-lg shadow-violet-900/10'
                                            : 'bg-transparent border-transparent hover:bg-white/[0.03]'}`}
                                    >
                                        <div className="flex flex-col gap-1.5">
                                            <span className={`text-[11px] font-black transition-colors uppercase leading-tight truncate ${expandedSubject?.toLowerCase() === subject.subjectCode.toLowerCase() ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                                                {subject.name}
                                            </span>
                                            <p className="text-[8px] font-black text-slate-700 uppercase tracking-widest leading-none">
                                                {subject.subjectCode} • {subject.credits} CR
                                            </p>
                                        </div>
                                        {expandedSubject?.toLowerCase() === subject.subjectCode.toLowerCase() && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1 h-8 bg-violet-500 rounded-full" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. RESOURCE HUB */}
                    <div className="bg-slate-900/40 border border-white/[0.06] rounded-[2rem] p-6">
                        <div className="flex items-center gap-2 mb-4">
                             <BookOpen className="w-3.5 h-3.5 text-violet-500" />
                             <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Resource Hub</p>
                        </div>
                        <p className="text-[9px] font-medium text-slate-600 leading-relaxed mb-4">
                            Need previous year papers or targeted lecture notes?
                        </p>
                        <button 
                            onClick={() => navigate('/paper-bank')}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-[11px] font-black uppercase tracking-[0.2em] text-white rounded-xl transition-all shadow-lg shadow-violet-950/40 active:scale-[0.98]"
                        >
                            Access Paper Bank
                        </button>
                    </div>
                </div>
            }
        />
    );
};

export default CurriculumExplorer;
