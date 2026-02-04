import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Input, Card, Spinner } from '@/components/ui';
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
    Grid,
    BookOpen
} from 'lucide-react';
import { getCurriculum, SemesterData, Subject, Module } from '@/services/curriculumService';
import { motion, AnimatePresence } from 'framer-motion';

const CurriculumExplorer: React.FC = () => {
    const [branch, setBranch] = useState('Common for All Branches');
    const [semester, setSemester] = useState(1);
    const [curriculum, setCurriculum] = useState<SemesterData | null>(null);
    const [loading, setLoading] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const branches = [
        'Common for All Branches',
        'Computer Engineering',
        'Information Technology',
        'Mechanical Engineering',
        'Civil Engineering',
        'Electronics & Telecommunication (EXTC)',
        'Artificial Intelligence & Data Science'
    ];

    useEffect(() => {
        fetchCurriculum();
    }, [branch, semester]);

    const fetchCurriculum = async () => {
        setLoading(true);
        try {
            const data = await getCurriculum(branch, semester);
            if (data.success) {
                setCurriculum(data.curriculum);
            }
        } catch (error) {
            console.error(error);
            // Fallback to mock data if backend fails
            if (branch === 'Common for All Branches' && semester === 1) {
                setCurriculum({
                    semesterNumber: 1,
                    subjects: [
                        {
                            subjectCode: "BSC101",
                            name: "Applied Mathematics-I",
                            credits: 4,
                            category: "Basic Science Course",
                            modules: [
                                {
                                    moduleNumber: 1,
                                    title: "Complex Numbers",
                                    topics: ["Cartesian, polar and exponential form", "De Moivre’s Theorem", "Expansion of sin nθ and cos nθ"],
                                    technicalRequirements: "Scientific Calculator",
                                    pedagogyFocus: "Conceptual clarity on imaginary units"
                                },
                                {
                                    moduleNumber: 2,
                                    title: "Partial Differentiation",
                                    topics: ["Euler’s Theorem on Homogeneous functions", "Maxima and Minima of functions of two variables"],
                                    technicalRequirements: "Symbolic Math Engine",
                                    pedagogyFocus: "Visualization of surfaces and stationary points"
                                }
                            ]
                        },
                        {
                            subjectCode: "ESC101",
                            name: "Engineering Mechanics",
                            credits: 3,
                            category: "Engineering Science Course",
                            modules: [
                                {
                                    moduleNumber: 1,
                                    title: "Force Systems",
                                    topics: ["Classification of force systems", "Varignon’s Theorem", "Resultant of coplanar forces"],
                                    pedagogyFocus: "Vector representation of forces"
                                },
                                {
                                    moduleNumber: 3,
                                    title: "Robot Kinematics",
                                    topics: ["Degrees of Freedom (DOF)", "D-H Parameters", "Introduction to Robotic Links"],
                                    technicalRequirements: "3D Modeling Visualizer",
                                    pedagogyFocus: "Modern applications of mechanics"
                                }
                            ]
                        }
                    ]
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredSubjects = curriculum?.subjects.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <PageHeader
                title="MU Curriculum Twin"
                subtitle="A high-fidelity digital mirror of the Mumbai University syllabus, optimized for NEP 2020."
                icon={<BookOpen className="w-8 h-8 text-blue-400" />}
            />

            {/* Selection Controls */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <Card className="md:col-span-8 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 font-medium">Engineering Branch</label>
                            <select
                                className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-3 text-slate-200 focus:border-blue-500 outline-none transition-all"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                            >
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 font-medium">Semester</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setSemester(s)}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all ${semester === s
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-110'
                                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="md:col-span-4 p-6">
                    <div className="space-y-2">
                        <label className="text-sm text-slate-400 font-medium">Quick Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <Input
                                className="pl-10"
                                placeholder="Search subject or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Content Area */}
            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Spinner size="lg" className="text-blue-500" />
                    <p className="text-slate-400 animate-pulse font-medium">Retrieving Curriculum Data Twin...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Subject List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-lg font-bold text-slate-300 flex items-center gap-2 px-2">
                            <Grid className="w-5 h-5 text-blue-400" />
                            Core Subjects
                        </h3>
                        <div className="space-y-3">
                            {filteredSubjects.map((subject) => (
                                <motion.div
                                    key={subject.subjectCode}
                                    layoutId={subject.subjectCode}
                                    onClick={() => setExpandedSubject(subject.subjectCode)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${expandedSubject === subject.subjectCode
                                        ? 'bg-blue-600/10 border-blue-500/50 shadow-lg'
                                        : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-500'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-900/80 text-blue-400">
                                            {subject.subjectCode}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500">
                                            {subject.credits} CREDITS
                                        </span>
                                    </div>
                                    <h4 className={`font-bold transition-colors ${expandedSubject === subject.subjectCode ? 'text-white' : 'text-slate-200'
                                        }`}>
                                        {subject.name}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                                        {subject.category}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Module Detail View */}
                    <div className="lg:col-span-2">
                        <AnimatePresence mode="wait">
                            {expandedSubject ? (
                                <motion.div
                                    key={expandedSubject}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="space-y-6"
                                >
                                    {curriculum?.subjects.find(s => s.subjectCode === expandedSubject)?.modules.map((module) => (
                                        <Card key={module.moduleNumber} className="p-6 border-slate-700/40 overflow-hidden relative group">
                                            <div className="absolute right-0 top-0 p-8 opacity-5 text-slate-200 group-hover:opacity-10 transition-opacity">
                                                <span className="text-9xl font-black">{module.moduleNumber}</span>
                                            </div>

                                            <div className="flex items-start gap-4 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-blue-500/20">
                                                    M{module.moduleNumber}
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-bold text-white mb-1">{module.title}</h3>
                                                    <div className="flex flex-wrap gap-2">
                                                        {module.technicalRequirements && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                                                <Settings className="w-3 h-3" /> {module.technicalRequirements}
                                                            </span>
                                                        )}
                                                        {module.pedagogyFocus && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400 flex items-center gap-1">
                                                                <Cpu className="w-3 h-3" /> {module.pedagogyFocus}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 pl-14">
                                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Book className="w-3 h-3" />
                                                    Syllabus Topics
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                    {module.topics.map((topic, i) => (
                                                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                                                            <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                                                            {topic}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="mt-6 pl-14 flex gap-4">
                                                <Button size="sm" variant="outline" className="text-[10px] h-8 gap-2">
                                                    <Code className="w-3 h-3" /> Tutorials
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-[10px] h-8 gap-2">
                                                    <Download className="w-3 h-3" /> Material
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </motion.div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-800/20 rounded-3xl border-2 border-dashed border-slate-700/50">
                                    <BookOpen className="w-20 h-20 text-slate-700 mb-6" />
                                    <h3 className="text-2xl font-bold text-slate-600">Select a subject to begin exploration</h3>
                                    <p className="text-slate-500 mt-4 max-w-md">
                                        Dive deep into each module, discover technical requirements, and access pedagogical resources specifically designed for the NEP 2020 framework.
                                    </p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CurriculumExplorer;
