import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { PageHeader, Button, Input, Select } from '../components/ui';
import { FileText, Sparkles, Download, CheckCircle, ArrowLeft, Printer, Layout, GraduationCap, Clock } from 'lucide-react';
import { generateMockPaper } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

const paperSettingsSchema = z.object({
    subject: z.string().min(3, "Subject name must be at least 3 chars").max(60, "Subject name is too long"),
    branch: z.string().min(2, "Please enter a valid branch"),
    year: z.string(),
    semester: z.string().min(1, "Please select a semester")
});

interface MockPaper {
    subject: string;
    time: string;
    totalMarks: number;
    instructions: string[];
    questions: {
        number: number;
        title: string;
        totalMarks: number;
        subQuestions: { text: string; marks: number }[];
    }[];
}

const MockPaperGenerator: React.FC = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [branch, setBranch] = useState(user?.branch || '');
    const [subject, setSubject] = useState('');
    const [year, setYear] = useState('First Year');
    const [semester, setSemester] = useState('Sem 1');
    const [loading, setLoading] = useState(false);
    const [paper, setPaper] = useState<MockPaper | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = paperSettingsSchema.safeParse({ subject, branch, year, semester });
        if (!result.success) {
            const fieldErrors: { [key: string]: string } = {};
            result.error.issues.forEach(err => {
                if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setLoading(true);
        try {
            const result = await generateMockPaper(branch, subject, year, semester, language);
            setPaper(result);
        } catch (error) {
            console.error("Error generating paper:", error);
            setErrors({ submit: "Failed to generate paper. AI quota might be full." });
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20 no-print-bg">
            <div className="flex items-center gap-4 no-print px-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2 text-slate-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Button>
                <PageHeader title="MU Mock Paper Gen" subtitle="AI-generated exams following Mumbai University patterns." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start px-4">
                <div className="lg:col-span-1 space-y-4 no-print">
                    <div className="bg-slate-800 rounded-2xl p-6 border border-white/10 shadow-card">
                        <form onSubmit={handleGenerate} className="space-y-5">
                            <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-2">
                                <Sparkles size={18} className="text-violet-400" /> Paper Settings
                            </h3>
                            
                            <div>
                                <label htmlFor="paper-subject-input" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Subject</label>
                                <Input
                                    id="paper-subject-input"
                                    name="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Applied Math IV"
                                    className={errors.subject ? 'border-red-500/50 focus:ring-red-500' : ''}
                                />
                                {errors.subject && <p className="text-[10px] text-red-400 mt-1 ml-1">{errors.subject}</p>}
                            </div>

                            <div>
                                <label htmlFor="paper-branch-input" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Branch</label>
                                <Input
                                    id="paper-branch-input"
                                    name="branch"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="e.g. Comps / IT"
                                    className={errors.branch ? 'border-red-500/50 focus:ring-red-500' : ''}
                                />
                                {errors.branch && <p className="text-[10px] text-red-400 mt-1 ml-1">{errors.branch}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="paper-year-select" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Year</label>
                                    <Select id="paper-year-select" name="year" value={year} onChange={(e) => setYear(e.target.value)}>
                                        <option>FE</option>
                                        <option>SE</option>
                                        <option>TE</option>
                                        <option>BE</option>
                                    </Select>
                                </div>
                                <div>
                                    <label htmlFor="paper-sem-select" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Sem</label>
                                    <Select id="paper-sem-select" name="semester" value={semester} onChange={(e) => setSemester(e.target.value)}>
                                        {Array.from({ length: 8 }, (_, i) => (
                                            <option key={i+1}>Sem {i+1}</option>
                                        ))}
                                    </Select>
                                </div>
                            </div>

                            <Button type="submit" isLoading={loading} className="w-full bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-900/20 py-6">
                                <FileText size={18} className="mr-2" /> Generate
                            </Button>
                            
                            {errors.submit && <p className="text-xs text-red-400 text-center">{errors.submit}</p>}
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-3 min-h-[600px]">
                    {loading ? (
                        <div className="bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-20 text-center flex flex-col items-center justify-center h-full">
                            <motion.div 
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full mb-6"
                            />
                            <p className="text-slate-200 font-bold text-lg">Curating MU Paper Schema...</p>
                            <p className="text-slate-500 text-sm mt-2">Aligning questions with MU {semester} patterns.</p>
                        </div>
                    ) : paper ? (
                        <div className="space-y-6 animate-in fade-in duration-700">
                            <div className="flex justify-end gap-3 no-print">
                                <Button variant="ghost" onClick={() => setPaper(null)} className="text-slate-400">Clear</Button>
                                <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
                                    <Printer size={18} className="mr-2" /> Print PDF
                                </Button>
                            </div>

                            <div className="bg-white text-slate-900 shadow-2xl p-12 font-serif min-h-[11in] print:shadow-none print:p-0 relative overflow-hidden">
                                {/* MU Header Style */}
                                <div className="text-center border-b-2 border-slate-900 pb-8 mb-10">
                                    <p className="text-sm font-bold opacity-60 mb-2 uppercase tracking-widest ont-sans">Official Mock Assessment</p>
                                    <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-4">University of Mumbai</h2>
                                    <div className="flex justify-between items-center mt-6 font-sans text-[11px] font-black opacity-90 px-4 uppercase tracking-tighter">
                                        <div className="flex items-center gap-1"><Clock size={12} /> Time: {paper.time}</div>
                                        <div className="flex items-center gap-1 font-extrabold text-sm">{paper.subject} ({semester})</div>
                                        <div className="flex items-center gap-1"><GraduationCap size={12} /> Marks: {paper.totalMarks}</div>
                                    </div>
                                </div>

                                <div className="mb-10 font-sans text-xs">
                                    <h4 className="font-black underline mb-3 text-[13px]">INSTRUCTIONS TO CANDIDATES:</h4>
                                    <ul className="space-y-1.5 opacity-80">
                                        {paper.instructions.map((inst, i) => (
                                            <li key={i} className="flex gap-2">
                                                <span className="font-bold">{i+1}.</span>
                                                <span className="leading-relaxed">{inst}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-12">
                                    {paper.questions.map((q, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-2">
                                                <h3 className="font-black text-xl flex items-baseline gap-2">
                                                    <span className="text-base text-slate-400">Q.{q.number}</span>
                                                    {q.title}
                                                </h3>
                                                <span className="font-black bg-slate-100 px-3 py-1 rounded text-sm">[{q.totalMarks}]</span>
                                            </div>
                                            <div className="space-y-6 pl-8">
                                                {q.subQuestions.map((sub, sIdx) => (
                                                    <div key={sIdx} className="flex justify-between items-start gap-4">
                                                        <div className="flex-1 flex gap-4">
                                                            <span className="font-bold opacity-40">({String.fromCharCode(97 + sIdx)})</span>
                                                            <div className="prose prose-sm max-w-none text-slate-900 leading-relaxed font-medium">
                                                                <ReactMarkdown>{sub.text}</ReactMarkdown>
                                                            </div>
                                                        </div>
                                                        <span className="font-bold opacity-40 text-sm whitespace-nowrap">({sub.marks})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-24 text-center">
                                    <div className="inline-block px-10 py-2 border-2 border-slate-900 font-black text-sm uppercase tracking-[0.4em]">
                                        End of Paper
                                    </div>
                                    <p className="mt-8 text-[9px] font-sans opacity-30 uppercase tracking-widest font-black">
                                        Verified MU Pattern Logic Applied | Branch: {branch} | {year}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/20 border border-slate-700/50 rounded-3xl h-full p-16 text-center flex flex-col items-center justify-center animate-in fade-in duration-1000">
                            <div className="p-6 bg-slate-800 rounded-full w-24 h-24 mb-6 flex items-center justify-center ring-8 ring-slate-800/40">
                                <Layout className="text-slate-600 w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-100 mb-3 tracking-tight">Paper Blueprint Empty</h3>
                            <p className="text-slate-500 max-w-sm mx-auto leading-relaxed text-sm font-medium">
                                Configure your exam specifications on the left. Our AI uses Mumbai University's 2026 examination schema.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    @page { size: auto; margin: 0mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; }
                    .no-print { display: none !important; }
                    .no-print-bg { background: white !important; }
                    .bg-white { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 40px !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default MockPaperGenerator;
