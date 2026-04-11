import React, { useState, useRef } from 'react';
import { PageHeader, Button, Input, Select, Spinner } from '../components/ui';
import { Upload, FileText, CheckCircle, AlertCircle, Search, Trash2, Library, Terminal, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ingestPaper, getSubjects, getPaperYears, browsePapers } from '../services/muTutorService';
import { extractTextFromFile } from '../services/geminiService';

const MUPaperBank: React.FC = () => {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form metadata
    const [subject, setSubject] = useState('');
    const [branch, setBranch] = useState(user?.branch || '');
    const [semester, setSemester] = useState(1);
    const [paperYear, setPaperYear] = useState(2023);
    const [paperType, setPaperType] = useState<'May' | 'Dec' | 'KT'>('May');
    const [year, setYear] = useState<'FE' | 'SE' | 'TE' | 'BE'>('FE');

    const [subjects, setSubjects] = useState<string[]>([]);
    const [paperYears, setPaperYears] = useState<number[]>([]);
    const [browseResults, setBrowseResults] = useState<any[]>([]);
    const [browseLoading, setBrowseLoading] = useState(false);
    const [browseMode, setBrowseMode] = useState<'subject' | 'year' | null>(null);

    const handleBrowseSubject = async () => {
        setBrowseLoading(true);
        setBrowseMode('subject');
        try {
            const subs = await getSubjects();
            setSubjects(subs);
            setBrowseResults([]);
        } catch (err) {
            console.error(err);
        } finally {
            setBrowseLoading(false);
        }
    };

    const handleBrowseYear = async () => {
        setBrowseLoading(true);
        setBrowseMode('year');
        try {
            const yrs = await getPaperYears();
            setPaperYears(yrs);
            setBrowseResults([]);
        } catch (err) {
            console.error(err);
        } finally {
            setBrowseLoading(false);
        }
    };

    const handleFetchPapers = async (val: string | number, type: 'subject' | 'year') => {
        setBrowseLoading(true);
        try {
            const res = await browsePapers(type === 'subject' ? val as string : undefined, type === 'year' ? val as number : undefined);
            setBrowseResults(res);
        } catch (err) {
            console.error(err);
        } finally {
            setBrowseLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setStatus(null);
        }
    };

    const handleUpload = async () => {
        if (!file || !subject || !branch) {
            setStatus({ type: 'error', message: 'Please fill all metadata and select a file.' });
            return;
        }

        setUploading(true);
        setStatus(null);

        try {
            // 1. Convert to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = () => resolve((reader.result as string).split(',')[1]);
                reader.readAsDataURL(file);
            });
            const base64Data = await base64Promise;

            // 2. OCR/Extract text with Gemini
            setStatus({ type: 'success', message: 'Processing with Gemini OCR...' });
            const extractedText = await extractTextFromFile(base64Data, file.type);

            // 3. Ingest Paper into MU-Aware database
            setStatus({ type: 'success', message: 'Analyzing with MU Professor Persona...' });
            await ingestPaper({
                text: extractedText,
                subject,
                branch,
                semester,
                paperYear,
                paperType,
                year
            });

            setStatus({ type: 'success', message: `Successfully added ${subject} (${paperYear}) to the MU Knowledge Base!` });
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err: any) {
            console.error("Paper upload and processing failed:", err);
            let errorMessage = err.message || 'Failed to process paper.';
            if (err.status === 429 || err.code === 'AI_QUOTA_EXCEEDED') {
                const hint = err.retryAfterSec ? ` Please retry in about ${err.retryAfterSec}s.` : ' AI is busy; please try again in a short while.';
                errorMessage = `AI rate limit reached.${hint}`;
            }
            setStatus({ type: 'error', message: errorMessage });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <PageHeader 
                title="MU Question Paper Bank" 
                subtitle="Contribute past papers to improve AI predictions and generate smarter answers."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* UPLOAD FORM */}
                <div className="lg:col-span-1 border-r border-slate-700/50 pr-8 space-y-8">
                    <div className="bg-slate-800/80 rounded-3xl p-6 ring-1 ring-slate-700 shadow-2xl space-y-6">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                            <Upload size={18} className="text-sky-400" /> Upload Paper
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="subject-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject</label>
                                <Input 
                                    id="subject-input"
                                    name="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Computer Graphics"
                                    className="bg-slate-900/50"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="year-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Year</label>
                                    <Select id="year-select" name="year" value={year} onChange={(e) => setYear(e.target.value as any)}>
                                        <option value="FE">First Year (FE)</option>
                                        <option value="SE">Second Year (SE)</option>
                                        <option value="TE">Third Year (TE)</option>
                                        <option value="BE">Final Year (BE)</option>
                                    </Select>
                                </div>
                                <div>
                                    <label htmlFor="semester-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sem</label>
                                    <Select id="semester-select" name="semester" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="paper-year-input" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Paper Year</label>
                                    <Input id="paper-year-input" name="paperYear" type="number" value={paperYear} onChange={(e) => setPaperYear(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label htmlFor="cycle-select" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cycle</label>
                                    <Select id="cycle-select" name="paperCycle" value={paperType} onChange={(e) => setPaperType(e.target.value as any)}>
                                        <option value="May">May/June</option>
                                        <option value="Dec">Nov/Dec</option>
                                        <option value="KT">K.T. Exam</option>
                                    </Select>
                                </div>
                            </div>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-8 py-10 transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-4 ${
                                    file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/5'
                                }`}
                            >
                                <input id="paper-file-upload" name="paperFileUpload" ref={fileInputRef} type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                                {file ? (
                                    <>
                                        <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center">
                                            <FileText size={24} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 line-clamp-1 px-4">{file.name}</span>
                                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                                            <Trash2 size={14} className="mr-1 text-red-400" /> Remove
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-slate-700/50 text-slate-400 rounded-xl flex items-center justify-center">
                                            <Upload size={24} />
                                        </div>
                                        <span className="text-sm font-medium text-slate-400">Click to Select PDF/Image</span>
                                    </>
                                )}
                            </div>

                            <Button 
                                className="w-full h-12 bg-sky-600 hover:bg-sky-500 font-bold"
                                onClick={handleUpload}
                                isLoading={uploading}
                                disabled={!file}
                            >
                                Upload & Process with AI
                            </Button>

                            {status && (
                                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
                                    status.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }}`}>
                                    {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                                    <p>{status.message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PAPER LIST / BROWSE */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Official Archives Section (Moved for prominence) */}
                    <div className="bg-gradient-to-br from-indigo-900/40 via-slate-800 to-slate-800 rounded-3xl p-8 ring-2 ring-indigo-500/40 shadow-2xl overflow-hidden relative group">
                        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
                        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all duration-700"></div>
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                            <div>
                                <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-2">
                                    <Library className="text-indigo-400 w-8 h-8" /> Official Archives
                                </h3>
                                <p className="text-slate-400 text-sm max-w-md">Reference past papers with high-fidelity PDFs provided by MU faculty.</p>
                            </div>
                            <div className="flex flex-wrap gap-4 w-full md:w-auto">
                                {[
                                    { name: 'CSE Sem 4 (May 2024)', url: '/past-papers/cse-sem4-2024-may.pdf' },
                                    { name: 'CSE Sem 4 (Nov 2023)', url: '/past-papers/cse-sem4-2023-nov.pdf' }
                                ].map((paper, i) => (
                                    <a 
                                        key={i}
                                        href={paper.url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex-1 md:flex-none flex items-center gap-3 p-4 bg-slate-900/60 rounded-2xl border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all group/item shadow-lg"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover/item:scale-110 transition-transform">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-100 block">{paper.name}</span>
                                            <span className="text-xs text-slate-500 uppercase tracking-widest font-mono">Verify PDF</span>
                                        </div>
                                        <Download size={16} className="text-slate-600 group-hover/item:text-indigo-400 ml-2" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-3xl p-8 ring-1 ring-slate-700/50 min-h-[400px] flex flex-col items-start justify-start">
                        <div className="w-full flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <Library size={24} className="text-sky-400" />
                                <h3 className="text-xl font-bold text-slate-100">Explore MU Paper Repository</h3>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant={browseMode === 'subject' ? 'primary' : 'ghost'} onClick={handleBrowseSubject} className="border border-slate-700">Browse by Subject</Button>
                                <Button size="sm" variant={browseMode === 'year' ? 'primary' : 'ghost'} onClick={handleBrowseYear} className="border border-slate-700">Browse by Year</Button>
                            </div>
                        </div>

                        {browseLoading ? (
                            <div className="w-full flex flex-col items-center justify-center py-20">
                                <Spinner className="w-8 h-8 text-sky-500 mb-4" />
                                <p className="text-slate-500">Retrieving from MU Knowledge Base...</p>
                            </div>
                        ) : browseMode === 'subject' ? (
                            <div className="w-full">
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {subjects.map(s => (
                                        <button 
                                            key={s} 
                                            onClick={() => handleFetchPapers(s, 'subject')}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-sky-500/20 hover:text-sky-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors text-slate-400"
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                                <BrowseResults results={browseResults} />
                            </div>
                        ) : browseMode === 'year' ? (
                            <div className="w-full">
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {paperYears.map(y => (
                                        <button 
                                            key={y} 
                                            onClick={() => handleFetchPapers(y, 'year')}
                                            className="px-3 py-1.5 bg-slate-800 hover:bg-sky-500/20 hover:text-sky-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors text-slate-400"
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                                <BrowseResults results={browseResults} />
                            </div>
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-20 text-center">
                                <Search size={48} className="text-slate-700 mb-6" />
                                <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                                    Select a browsing mode above to explore categorised questions and past papers.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BrowseResults: React.FC<{ results: any[] }> = ({ results }) => {
    if (results.length === 0) return null;

    return (
        <div className="space-y-4 w-full">
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Found {results.length} Matching Entries</h4>
            <div className="grid grid-cols-1 gap-3">
                {results.map((q, i) => (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 hover:border-sky-500/30 transition-colors group">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <p className="text-slate-200 font-medium mb-1 line-clamp-2 leading-relaxed">{q.questionText}</p>
                                <div className="flex flex-wrap gap-2 items-center text-xs">
                                    <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md border border-slate-700 group-hover:border-sky-500/20">{q.subject}</span>
                                    <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 rounded-md border border-sky-500/20">Year: {q.paperYear}</span>
                                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded-md border border-amber-500/20">{q.marks} Marks</span>
                                    {q.frequency > 1 && (
                                        <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20 flex items-center gap-1">
                                            <Terminal size={10} /> Repeated {q.frequency}x
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="p-2 bg-slate-800 rounded-xl text-slate-500 group-hover:text-sky-400 transition-colors shadow-inner">
                                <FileText size={16} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MUPaperBank;
