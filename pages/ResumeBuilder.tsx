import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Input, Textarea, Button } from '@/components/ui';
import { FileText, Sparkles, Copy, ExternalLink, CheckCircle2, Printer } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { trackToolUsage } from '@/services/personalizationService';

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
    const [skillsInput, setSkillsInput] = useState('React, TypeScript, Node.js, MongoDB');
    const [projectsInput, setProjectsInput] = useState('Built a collaborative study room with real-time chat and AI-assisted quiz generation');
    const [achievementsInput, setAchievementsInput] = useState('Improved app performance by 30% through lazy-loading and code splitting');

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
        const bucket = toRoleBucket(targetRole);
        const keywords = dedupeCaseInsensitive([
            ...ROLE_KEYWORDS[bucket],
            ...skillList,
            ...COMMON_INDIAN_HR_KEYWORDS,
        ]);
        return keywords.slice(0, 24);
    }, [targetRole, skillList]);

    const summary = useMemo(() => {
        const branch = user?.branch ? `${user.branch} student` : 'engineering student';
        const topSkills = skillList.slice(0, 4).join(', ') || 'modern software development';
        const role = targetRole.trim() || 'Software Engineer';
        return `Results-focused ${branch} targeting ${role} roles. Hands-on with ${topSkills}. Built practical projects with measurable outcomes and strong collaboration across product-focused teams.`;
    }, [targetRole, skillList, user?.branch]);

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
        window.print();
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12 resume-builder-root">
            <div className="resume-print-hide">
                <PageHeader
                    title="Resume Builder"
                    subtitle="Generate a recruiter-friendly profile summary and keyword set for service and product hiring."
                    icon={<FileText className="w-8 h-8 text-indigo-400" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 resume-print-layout">
                <Card className="xl:col-span-2 p-6 space-y-4 resume-print-hide">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        Candidate Inputs
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name" />
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
                    </div>

                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" />
                    <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="Target role (e.g. Frontend Developer)" />

                    <div>
                        <p className="text-xs text-slate-400 mb-2">Skills (comma separated)</p>
                        <Textarea rows={3} value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
                    </div>

                    <div>
                        <p className="text-xs text-slate-400 mb-2">Projects (one per line)</p>
                        <Textarea rows={4} value={projectsInput} onChange={(e) => setProjectsInput(e.target.value)} />
                    </div>

                    <div>
                        <p className="text-xs text-slate-400 mb-2">Achievements (one per line)</p>
                        <Textarea rows={3} value={achievementsInput} onChange={(e) => setAchievementsInput(e.target.value)} />
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
                                Print Resume <Printer className="w-3 h-3" />
                            </Button>
                        </div>
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
