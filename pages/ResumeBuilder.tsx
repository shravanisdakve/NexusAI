import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Input, Textarea, Button } from '@/components/ui';
import { FileText, Sparkles, Copy, ExternalLink, CheckCircle2, Printer, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackToolUsage } from '@/services/personalizationService';
import { generateResumeAnalysis } from '@/services/geminiService';

const ROLE_KEYWORDS: Record<string, string[]> = {
    frontend: ['React', 'TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'Responsive UI', 'REST API', 'Git'],
    backend: ['Node.js', 'Express', 'REST API', 'MongoDB', 'SQL', 'Authentication', 'System Design', 'Git'],
    fullstack: ['React', 'TypeScript', 'Node.js', 'Express', 'MongoDB', 'REST API', 'Testing', 'Git'],
    data: ['Python', 'Pandas', 'SQL', 'Machine Learning', 'Data Visualization', 'Statistics', 'Numpy'],
    devops: ['CI/CD', 'Docker', 'Kubernetes', 'Linux', 'AWS', 'Monitoring', 'Automation'],
};

const COMMON_INDIAN_HR_KEYWORDS = [
    'Problem Solving',
    'Communication',
    'Team Collaboration',
    'Internship',
    'Project Experience',
    'Ownership',
    'Analytical Thinking',
];

const tokenizeList = (value: string): string[] =>
    value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

const toRoleBucket = (role: string): keyof typeof ROLE_KEYWORDS => {
    const normalized = role.toLowerCase();
    if (normalized.includes('front')) return 'frontend';
    if (normalized.includes('back')) return 'backend';
    if (normalized.includes('full')) return 'fullstack';
    if (normalized.includes('data') || normalized.includes('analyst') || normalized.includes('ml')) return 'data';
    if (normalized.includes('devops') || normalized.includes('cloud')) return 'devops';
    return 'fullstack';
};

const dedupeCaseInsensitive = (items: string[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
        const key = item.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const ResumeBuilder: React.FC = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState<'summary' | 'keywords' | null>(null);
    const [fullName, setFullName] = useState(user?.displayName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState('');
    const [targetRole, setTargetRole] = useState('Software Engineer');
    const [skillsInput, setSkillsInput] = useState('Data Structures, Algorithms, Advanced Database Management, Java, Web Server Technologies');
    const [projectsInput, setProjectsInput] = useState('NexusAI (BE Major Project): Engineered a real-time collaborative study platform using Node.js and WebSockets\nMU Notifications Engine: Built an automated Cheerio pipeline to parse Mumbai University circulars');
    const [achievementsInput, setAchievementsInput] = useState('Maintained distinction (9.1 CGPA) per MU grading standards\nWinner of internal college hackathon');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState<{ 
        summary: string; 
        keywords: string[]; 
        extractedSkills?: string; 
        extractedProjects?: string; 
        extractedAchievements?: string; 
        name?: string; 
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        trackToolUsage('placement');
    }, []);

    useEffect(() => {
        setFullName(user?.displayName || '');
        setEmail(user?.email || '');
    }, [user?.displayName, user?.email]);

    const skillList = useMemo(() => tokenizeList(skillsInput), [skillsInput]);
    const projectList = useMemo(
        () =>
            projectsInput
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
        [projectsInput]
    );
    const achievementList = useMemo(
        () =>
            achievementsInput
                .split('\n')
                .map((item) => item.trim())
                .filter(Boolean),
        [achievementsInput]
    );

    const atsKeywords = useMemo(() => {
        if (aiAnalysis?.keywords) return aiAnalysis.keywords;
        const bucket = toRoleBucket(targetRole);
        const keywords = dedupeCaseInsensitive([
            ...ROLE_KEYWORDS[bucket],
            ...skillList,
            ...COMMON_INDIAN_HR_KEYWORDS,
        ]);
        return keywords.slice(0, 24);
    }, [targetRole, skillList, aiAnalysis]);

    const summary = useMemo(() => {
        if (aiAnalysis?.summary) return aiAnalysis.summary;
        const branch = user?.branch ? `Mumbai University ${user.branch} undergraduate` : 'Mumbai University (MU) engineering undergraduate';
        const topSkills = skillList.slice(0, 4).join(', ') || 'modern software development';
        const role = targetRole.trim() || 'Software Engineer';
        return `Results-focused ${branch} targeting ${role} roles. Hands-on with ${topSkills}. Built practical projects with measurable outcomes, leveraging the rigorous MU curriculum to solve real-world problems.`;
    }, [targetRole, skillList, user?.branch, aiAnalysis]);

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsGenerating(true);
        setError(null);

        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64Data = (event.target?.result as string).split(',')[1];
                const mimeType = file.type;

                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/extraction/extractTextFromFile`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({ base64Data, mimeType })
                });

                const data = await response.json();
                if (data.text) {
                    // Ask AI to structure the extracted text
                    const analysis = await generateResumeAnalysis({
                        targetRole,
                        skills: data.text,
                        projects: 'Extract from text',
                        achievements: 'Extract from text',
                        branch: user?.branch || 'Engineering'
                    });

                    if (analysis) {
                        setAiAnalysis(analysis);
                        if (analysis.extractedSkills) setSkillsInput(analysis.extractedSkills);
                        if (analysis.extractedProjects) setProjectsInput(analysis.extractedProjects);
                        if (analysis.extractedAchievements) setAchievementsInput(analysis.extractedAchievements);
                        setFullName(analysis.name || fullName);
                    }
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error('Import failed:', err);
            setError('Failed to extract data from resume. Please try manual entry.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!skillsInput.trim() || !projectsInput.trim()) {
            setError('Please provide at least some skills and project descriptions for analysis.');
            return;
        }

        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateResumeAnalysis({
                targetRole,
                skills: skillsInput,
                projects: projectsInput,
                achievements: achievementsInput,
                branch: user?.branch || 'Engineering'
            });
            
            if (result && (result.summary || result.keywords)) {
                setAiAnalysis(result);
            } else {
                throw new Error('AI returned an empty response.');
            }
        } catch (err: any) {
            console.error('Failed to generate AI resume summary:', err);
            setError('The AI is currently busy or rate-limited. Using intelligent defaults instead.');
        } finally {
            setIsGenerating(false);
        }
    };

    const contactLine = useMemo(() => {
        const values = [email.trim(), phone.trim()].filter(Boolean);
        return values.join(' | ');
    }, [email, phone]);

    const copyText = async (type: 'summary' | 'keywords') => {
        const payload = type === 'summary' ? summary : atsKeywords.join(', ');
        await navigator.clipboard.writeText(payload);
        setCopied(type);
        window.setTimeout(() => setCopied(null), 1800);
    };

    const openExternalBuilder = () => {
        window.open('https://www.canva.com/resumes/templates/', '_blank', 'noopener,noreferrer');
    };

    const handlePrintResume = () => {
        const printData = {
            fullName,
            email,
            phone,
            targetRole,
            skills: skillList,
            projects: projectList,
            achievements: achievementList,
            summary
        };
        
        localStorage.setItem('nexus_resume_print_data', JSON.stringify(printData));
        window.open('/resume-print', '_blank');
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-24 md:pb-12 resume-builder-root px-1">
            <div className="resume-print-hide">
                <PageHeader
                    title="Resume Builder"
                    subtitle="AI optimization for recruitment patterns."
                    icon={<FileText className="w-8 h-8 text-indigo-400" />}
                    className="md:block hidden"
                />
                <div className="md:hidden pt-4 pb-2">
                    <h1 className="text-2xl font-black text-white italic tracking-tight uppercase">Resume Builder</h1>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">AI Recruitment Sync</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 resume-print-layout relative">
                <Card className="xl:col-span-2 p-5 md:p-6 space-y-4 resume-print-hide bg-slate-900/40 backdrop-blur-md border-white/5">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 italic">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                            Candidate Data
                        </h3>
                        <div className="relative">
                            <input 
                                type="file" 
                                id="resume-upload" 
                                className="hidden" 
                                accept=".pdf,.docx,.txt"
                                onChange={handleImport}
                                disabled={isGenerating}
                            />
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 px-3 text-[9px] font-black tracking-widest uppercase bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                                onClick={() => document.getElementById('resume-upload')?.click()}
                                disabled={isGenerating}
                            >
                                <Copy size={10} className="mr-1.5" /> SYNC RESUME
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input id="resume-fullname" name="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="FULL NAME" className="h-11 text-[11px] font-bold uppercase tracking-widest bg-black/20" />
                        <Input id="resume-email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="EMAIL ADDRESS" className="h-11 text-[11px] font-bold uppercase tracking-widest bg-black/20" />
                    </div>

                    <Input id="resume-phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="PHONE (OPTIONAL)" className="h-11 text-[11px] font-bold uppercase tracking-widest bg-black/20" />
                    <Input id="resume-target-role" name="targetRole" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="TARGET ROLE (E.G. FRONTEND)" className="h-11 text-[11px] font-bold uppercase tracking-widest bg-black/20" />

                    <div>
                        <label htmlFor="resume-skills" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 italic">Technical Skills</label>
                        <Textarea id="resume-skills" name="skills" rows={3} value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} className="text-xs bg-black/20" />
                    </div>

                    <div>
                        <label htmlFor="resume-projects" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 italic">Key Projects</label>
                        <Textarea id="resume-projects" name="projects" rows={4} value={projectsInput} onChange={(e) => setProjectsInput(e.target.value)} className="text-xs bg-black/20" />
                    </div>

                    <div>
                        <label htmlFor="resume-achievements" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 ml-1 italic">Core Achievements</label>
                        <Textarea id="resume-achievements" name="achievements" rows={3} value={achievementsInput} onChange={(e) => setAchievementsInput(e.target.value)} className="text-xs bg-black/20" />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase tracking-widest animate-in fade-in slide-in-from-top-1">
                            <AlertTriangle size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Desktop Button */}
                    <div className="hidden md:block">
                        <Button 
                            onClick={handleGenerateAI} 
                            disabled={isGenerating} 
                            className="w-full h-12 gap-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl shadow-xl shadow-indigo-500/20"
                        >
                            {isGenerating ? 'ANALYZING PATTERNS...' : 'OPTIMIZE WITH AI ✨'}
                        </Button>
                    </div>

                    {/* Mobile Sticky Button Container */}
                    <div className="md:hidden fixed bottom-[76px] left-0 right-0 px-4 z-[40]">
                        <Button 
                            onClick={handleGenerateAI} 
                            disabled={isGenerating} 
                            className="w-full h-14 gap-2 bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-indigo-500/40 border border-white/10 active:scale-95 transition-all"
                        >
                            {isGenerating ? 'ANALYZING...' : 'OPTIMIZE WITH AI ✨'}
                        </Button>
                    </div>
                </Card>

                <Card className="xl:col-span-3 p-6 border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 resume-print-area">
                    <div className="flex items-center justify-between gap-4 mb-4 resume-print-hide">
                        <h3 className="text-lg font-bold text-white">Generated Draft</h3>
                        <div className="flex items-center gap-2">
                            <Button type="button" size="sm" variant="outline" className="gap-2 border-indigo-500 text-indigo-300" onClick={openExternalBuilder}>
                                Template Gallery <ExternalLink className="w-3 h-3" />
                            </Button>
                            <Button type="button" size="sm" className="gap-2" onClick={handlePrintResume}>
                                  <Printer className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="resume-print-hide mb-4 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-2 text-[10px] text-indigo-300">
                        <AlertTriangle size={12} className="shrink-0" />
                        <span>Professional Tip: For the best PDF output, disable "Headers and Footers" in your browser's print settings.</span>
                    </div>

                    <div className="space-y-5">
                        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                            <p className="text-xl font-black text-white">{fullName || 'Your Name'}</p>
                            {contactLine && <p className="text-sm text-slate-400 mt-1">{contactLine}</p>}
                        </div>

                        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs uppercase tracking-widest text-slate-400">Professional Summary</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs gap-1 text-slate-300 resume-print-hide"
                                    onClick={() => copyText('summary')}
                                >
                                    {copied === 'summary' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    Copy
                                </Button>
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed">{summary}</p>
                        </div>

                        <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs uppercase tracking-widest text-slate-400">ATS Keywords</p>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs gap-1 text-slate-300 resume-print-hide"
                                    onClick={() => copyText('keywords')}
                                >
                                    {copied === 'keywords' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    Copy
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {atsKeywords.map((keyword) => (
                                    <span key={keyword} className="text-[11px] px-2 py-1 rounded-md border border-indigo-500/30 bg-indigo-500/10 text-indigo-200 resume-chip">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Project Highlights</p>
                                <ul className="space-y-2 text-sm text-slate-200">
                                    {(projectList.length ? projectList : ['Add project lines on the left to generate highlights.']).map((item, index) => (
                                        <li key={`${item}-${index}`} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
                                <p className="text-xs uppercase tracking-widest text-slate-400 mb-2">Achievement Highlights</p>
                                <ul className="space-y-2 text-sm text-slate-200">
                                    {(achievementList.length ? achievementList : ['Add achievement lines on the left to generate highlights.']).map((item, index) => (
                                        <li key={`${item}-${index}`} className="flex items-start gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            <style>{`
                @media print {
                    .resume-print-hide {
                        display: none !important;
                    }

                    .resume-builder-root {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    .resume-print-layout {
                        display: block !important;
                    }

                    .resume-print-area {
                        background: #ffffff !important;
                        border: 1px solid #d1d5db !important;
                        box-shadow: none !important;
                        color: #111827 !important;
                    }

                    .resume-print-area * {
                        color: #111827 !important;
                        border-color: #d1d5db !important;
                    }

                    .resume-print-area .resume-chip {
                        background: #f3f4f6 !important;
                        color: #111827 !important;
                        border-color: #d1d5db !important;
                    }

                    @page {
                        size: A4;
                        margin: 12mm;
                    }
                }
            `}</style>
        </div>
    );
};

export default ResumeBuilder;
