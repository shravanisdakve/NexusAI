import React, { useState } from 'react';
import { PageHeader, Button, Input, Select } from '../components/ui';
import { FileText, Sparkles, Download, CheckCircle, ArrowLeft, Printer } from 'lucide-react';
import { generateMockPaper } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
    const [branch, setBranch] = useState(user?.branch || '');
    const [subject, setSubject] = useState('');
    const [year, setYear] = useState('First Year');
    const [loading, setLoading] = useState(false);
    const [paper, setPaper] = useState<MockPaper | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject) return;
        setLoading(true);
        try {
            const result = await generateMockPaper(branch, subject, year);
            setPaper(result);
        } catch (error) {
            console.error("Error generating paper:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4 no-print">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2 text-slate-400">
                    <ArrowLeft size={20} />
                </Button>
                <PageHeader title="MU Mock Paper Gen" subtitle="AI-generated exams following Mumbai University patterns." />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 bg-slate-800/50 rounded-2xl p-6 ring-1 ring-slate-700 no-print">
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2 mb-4">
                            <Sparkles size={18} className="text-violet-400" /> Paper Settings
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Subject Name</label>
                            <Input
                                id="mock-subject"
                                name="subject"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g. Engineering Mechanics"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Branch</label>
                            <Input
                                id="mock-branch"
                                name="branch"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="e.g. Computer Engineering"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Year</label>
                            <Select id="mock-year" name="year" value={year} onChange={(e) => setYear(e.target.value)}>
                                <option>First Year</option>
                                <option>Second Year</option>
                                <option>Third Year</option>
                                <option>Final Year</option>
                            </Select>
                        </div>
                        <Button type="submit" isLoading={loading} className="w-full bg-gradient-to-r from-sky-600 to-violet-600 shadow-lg shadow-sky-500/20">
                            <FileText size={18} className="mr-2" /> Generate Mock Paper
                        </Button>
                    </form>
                </div>

                <div className="lg:col-span-2">
                    {loading ? (
                        <div className="bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-20 text-center flex flex-col items-center justify-center">
                            <div className="w-16 h-16 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-slate-400 font-medium">Analyzing MU patterns and curriculum...</p>
                        </div>
                    ) : paper ? (
                        <div className="space-y-6">
                            <div className="flex justify-end gap-3 no-print">
                                <Button variant="ghost" onClick={() => setPaper(null)} className="text-slate-400">Reset</Button>
                                <Button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600">
                                    <Printer size={18} className="mr-2" /> Print / Save PDF
                                </Button>
                            </div>

                            <div className="bg-white text-slate-900 rounded-none shadow-2xl p-10 font-serif min-h-[11in] print:shadow-none print:p-0">
                                <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
                                    <h2 className="text-2xl font-bold uppercase tracking-tight">Mumbai University Mock Examination</h2>
                                    <div className="flex justify-between items-center mt-4 font-sans text-sm font-bold opacity-80 px-4">
                                        <span>Max Marks: {paper.totalMarks}</span>
                                        <span>{paper.subject}</span>
                                        <span>Time: {paper.time}</span>
                                    </div>
                                </div>

                                <div className="mb-8 font-sans text-sm italic">
                                    <h4 className="font-bold underline mb-2">Instructions to Candidates:</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {paper.instructions.map((inst, i) => (
                                            <li key={i}>{inst}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="space-y-10">
                                    {paper.questions.map((q, idx) => (
                                        <div key={idx} className="relative">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="font-bold text-lg">
                                                    Q.{q.number} {q.title}
                                                </h3>
                                                <span className="font-bold">[{q.totalMarks}]</span>
                                            </div>
                                            <div className="space-y-4 pl-6">
                                                {q.subQuestions.map((sub, sIdx) => (
                                                    <div key={sIdx} className="flex justify-between items-start group">
                                                        <p className="flex-1 pr-12">
                                                            <span className="mr-3 font-semibold">({String.fromCharCode(97 + sIdx)})</span>
                                                            {sub.text}
                                                        </p>
                                                        <span className="font-medium italic opacity-70">({sub.marks})</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-20 text-center font-bold text-sm border-t border-slate-200 pt-6 opacity-50 font-sans">
                                    ----- END OF PAPER -----
                                    <br />
                                    <span className="text-xs">Generated by NexusAI for {branch} students</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/20 border-2 border-dashed border-slate-700 rounded-3xl p-16 text-center">
                            <div className="p-4 bg-slate-800 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center ring-4 ring-slate-800/50">
                                <FileText className="text-slate-600 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-100 mb-2">No Paper Generated</h3>
                            <p className="text-slate-400 max-w-sm mx-auto leading-relaxed">
                                Enter a subject and branch on the left to generate a high-quality mock exam following Mumbai University patterns.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden !important; }
                    .print\\:block, .print\\:show, .bg-white, .bg-white * { visibility: visible !important; }
                    .bg-white { 
                        position: absolute !important; 
                        left: 0 !important; 
                        top: 0 !important; 
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 20px !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default MockPaperGenerator;
