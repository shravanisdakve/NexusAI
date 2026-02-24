import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card } from '../components/ui';
import {
    Building2, ArrowLeft, Clock, BarChart3, IndianRupee, Code,
    BookOpen, Target, ChevronRight, ExternalLink, Search
} from 'lucide-react';
import { trackToolUsage } from '../services/personalizationService';

interface CompanyProfile {
    name: string;
    logo: string;
    sector: string;
    ctcRange: string;
    eligibility: string;
    testPattern: {
        sections: { name: string; questions: number; duration: string; topics: string[] }[];
        totalDuration: string;
        negativeMarking: boolean;
    };
    interviewRounds: string[];
    tips: string[];
    website: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
}

const COMPANIES: CompanyProfile[] = [
    {
        name: 'TCS', logo: '🟦', sector: 'IT Services & Consulting',
        ctcRange: '3.36 – 11 LPA', eligibility: '60% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Numerical Ability', questions: 26, duration: '40 min', topics: ['Percentages', 'Time & Work', 'Probability', 'Number Systems', 'Algebra'] },
                { name: 'Verbal Ability', questions: 24, duration: '30 min', topics: ['Reading Comprehension', 'Sentence Correction', 'Para Jumbles', 'Vocabulary'] },
                { name: 'Reasoning Ability', questions: 30, duration: '50 min', topics: ['Arrangements', 'Blood Relations', 'Coding-Decoding', 'Series', 'Puzzles'] },
                { name: 'Coding (Advanced)', questions: 2, duration: '45 min', topics: ['DSA', 'String Manipulation', 'Pattern Problems', 'Algorithms'] },
            ],
            totalDuration: '165 min', negativeMarking: false,
        },
        interviewRounds: ['TCS NQT Online Test', 'Technical Interview', 'Managerial Interview', 'HR Interview'],
        tips: ['Focus on TCS NQT Foundation for Digital role', 'Practice coding in Java/Python', 'TCS NQT score valid for 2 years', 'Prepare TCS-specific previous papers'],
        website: 'https://www.tcs.com/careers', difficulty: 'Medium',
    },
    {
        name: 'Infosys', logo: '🟪', sector: 'IT Services & Digital',
        ctcRange: '3.6 – 9.5 LPA', eligibility: '60% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Quantitative Aptitude', questions: 15, duration: '25 min', topics: ['Number Systems', 'Algebra', 'Probability', 'Percentages', 'Data Interpretation'] },
                { name: 'Logical Reasoning', questions: 15, duration: '25 min', topics: ['Blood Relations', 'Puzzles', 'Syllogisms', 'Arrangements', 'Coding-Decoding'] },
                { name: 'Verbal Ability', questions: 20, duration: '20 min', topics: ['Reading Comprehension', 'Grammar', 'Vocabulary', 'Error Identification'] },
                { name: 'Pseudo Code / Coding', questions: 5, duration: '40 min', topics: ['Pseudocode Tracing', 'Basic DSA', 'Arrays', 'Strings'] },
            ],
            totalDuration: '110 min', negativeMarking: false,
        },
        interviewRounds: ['InfyTQ Online Test', 'Technical Interview', 'HR Interview'],
        tips: ['InfyTQ certification gives bonus advantage', 'Focus on Pseudocode section', 'Infosys Springboard courses help preparation', 'Practice on HackerRank for coding rounds'],
        website: 'https://www.infosys.com/careers', difficulty: 'Medium',
    },
    {
        name: 'Wipro', logo: '🟩', sector: 'IT Services & Consulting',
        ctcRange: '3.5 – 6.5 LPA', eligibility: '60% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Quantitative Aptitude', questions: 16, duration: '16 min', topics: ['Percentages', 'Ratio', 'Probability', 'Time & Work', 'Profit & Loss'] },
                { name: 'Logical Reasoning', questions: 14, duration: '14 min', topics: ['Arrangements', 'Coding-Decoding', 'Series', 'Blood Relations'] },
                { name: 'Verbal Ability', questions: 16, duration: '16 min', topics: ['Reading Comprehension', 'Grammar', 'Sentence Correction'] },
                { name: 'Written English (Essay)', questions: 1, duration: '20 min', topics: ['Essay on given topic (200-400 words)'] },
                { name: 'Coding', questions: 2, duration: '60 min', topics: ['Basic Programming', 'Loops', 'Arrays', 'Data Structures'] },
            ],
            totalDuration: '128 min', negativeMarking: false,
        },
        interviewRounds: ['NLTH Online Test', 'Technical Interview', 'HR Interview'],
        tips: ['Wipro NLTH (National Level Talent Hunt) is the main entry', 'Essay writing is unique — practice beforehand', 'Coding is moderate difficulty', 'Focus on speed for aptitude sections'],
        website: 'https://careers.wipro.com', difficulty: 'Easy',
    },
    {
        name: 'Accenture', logo: '🟣', sector: 'Consulting & IT Services',
        ctcRange: '4.5 – 12 LPA', eligibility: '60% throughout, no backlogs',
        testPattern: {
            sections: [
                { name: 'Cognitive Ability', questions: 50, duration: '50 min', topics: ['Problem Solving', 'Verbal Ability', 'Abstract Reasoning', 'Flowcharts'] },
                { name: 'Technical Assessment', questions: 40, duration: '40 min', topics: ['MS Office', 'Pseudocode', 'Networking', 'Cloud Basics', 'DBMS'] },
                { name: 'Coding', questions: 2, duration: '45 min', topics: ['Arrays', 'Strings', 'Sorting', 'Basic Algorithms'] },
            ],
            totalDuration: '135 min', negativeMarking: false,
        },
        interviewRounds: ['Online Assessment', 'Communication Assessment', 'Technical + HR Interview (combined)'],
        tips: ['Accenture sometimes uses game-based aptitude tests', 'Communication assessment involves speaking and listening', 'Technical round covers broad CS basics', 'Group projects on resume are valued'],
        website: 'https://www.accenture.com/careers', difficulty: 'Medium',
    },
    {
        name: 'Cognizant', logo: '🔵', sector: 'IT Services & Digital',
        ctcRange: '4 – 8 LPA', eligibility: '60% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Quantitative Aptitude', questions: 16, duration: '20 min', topics: ['Percentages', 'Number Systems', 'Algebra', 'Geometry'] },
                { name: 'Logical Reasoning', questions: 14, duration: '20 min', topics: ['Series', 'Puzzles', 'Arrangements', 'Direction Sense'] },
                { name: 'Verbal Ability', questions: 25, duration: '25 min', topics: ['Reading Comprehension', 'Grammar', 'Sentence Completion'] },
                { name: 'Coding (Automata Fix)', questions: 2, duration: '30 min', topics: ['Bug Fixing', 'Code Completion', 'Algorithm Implementation'] },
            ],
            totalDuration: '95 min', negativeMarking: false,
        },
        interviewRounds: ['GenC Online Test', 'Technical Interview', 'HR Interview'],
        tips: ['Cognizant GenC / GenC Next / GenC Elevate are different tiers', 'AMCAT-based test for some drives', 'Focus on automata (code debugging) section', 'Prepare for Java/C++ specific questions'],
        website: 'https://careers.cognizant.com', difficulty: 'Easy',
    },
    {
        name: 'Capgemini', logo: '🟡', sector: 'IT Services & Consulting',
        ctcRange: '3.8 – 7.5 LPA', eligibility: '60% throughout, no backlogs',
        testPattern: {
            sections: [
                { name: 'Aptitude', questions: 16, duration: '25 min', topics: ['Quant', 'Logical Reasoning', 'Verbal'] },
                { name: 'Pseudocode & Technical', questions: 20, duration: '25 min', topics: ['Pseudocode Tracing', 'Output Prediction', 'CS Fundamentals'] },
                { name: 'Game-Based Round', questions: 5, duration: '15 min', topics: ['Pattern Recognition', 'Spatial Reasoning', 'Decision Making'] },
                { name: 'Essay Writing', questions: 1, duration: '20 min', topics: ['Business / Technology / Social topic'] },
                { name: 'Coding', questions: 2, duration: '45 min', topics: ['Basic Programming', 'DSA', 'Problem Solving'] },
            ],
            totalDuration: '130 min', negativeMarking: false,
        },
        interviewRounds: ['Online Assessment', 'Technical Interview', 'HR Interview'],
        tips: ['Game-based round is unique to Capgemini', 'Essay writing requires structured thinking', 'Pseudocode section is heavily weighted', 'Practice CoCubes-style questions'],
        website: 'https://www.capgemini.com/careers', difficulty: 'Medium',
    },
    {
        name: 'Tech Mahindra', logo: '🔴', sector: 'IT Services & Telecom',
        ctcRange: '3.25 – 7 LPA', eligibility: '60% throughout',
        testPattern: {
            sections: [
                { name: 'English Communication', questions: 20, duration: '20 min', topics: ['Grammar', 'Reading Comprehension', 'Vocabulary'] },
                { name: 'Quantitative Aptitude', questions: 20, duration: '25 min', topics: ['Percentages', 'Speed-Distance', 'Number Systems'] },
                { name: 'Logical Reasoning', questions: 20, duration: '25 min', topics: ['Series', 'Coding-Decoding', 'Arrangements'] },
                { name: 'Coding', questions: 2, duration: '30 min', topics: ['Basic Programming', 'String Operations'] },
            ],
            totalDuration: '100 min', negativeMarking: false,
        },
        interviewRounds: ['Online Test', 'Group Discussion', 'Technical Interview', 'HR Interview'],
        tips: ['Tech Mahindra often includes GD round', 'Telecom domain knowledge is a plus', 'Practice basic coding thoroughly', 'Focus on English communication skills'],
        website: 'https://careers.techmahindra.com', difficulty: 'Easy',
    },
    {
        name: 'L&T Infotech (LTIMindtree)', logo: '🟠', sector: 'IT Services & Engineering',
        ctcRange: '4.5 – 9 LPA', eligibility: '65% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Quantitative Aptitude', questions: 20, duration: '25 min', topics: ['Time & Work', 'Probability', 'Percentages', 'DI'] },
                { name: 'Logical Reasoning', questions: 20, duration: '25 min', topics: ['Arrangements', 'Syllogisms', 'Puzzles', 'Data Sufficiency'] },
                { name: 'Verbal Ability', questions: 15, duration: '15 min', topics: ['RC', 'Grammar', 'Vocabulary', 'Para Jumbles'] },
                { name: 'Coding', questions: 2, duration: '30 min', topics: ['DSA', 'Algorithms', 'Problem Solving'] },
            ],
            totalDuration: '95 min', negativeMarking: false,
        },
        interviewRounds: ['Online Assessment', 'Technical Interview (2 rounds)', 'HR Interview'],
        tips: ['LTIMindtree merger means updated test pattern', 'Higher eligibility criteria than others', 'Strong DSA preparation needed', '2 technical rounds — deeper CS knowledge required'],
        website: 'https://www.ltimindtree.com/careers', difficulty: 'Hard',
    },
    {
        name: 'Persistent Systems', logo: '🟤', sector: 'Product Engineering & Digital',
        ctcRange: '5.1 – 9 LPA', eligibility: '60% throughout, based in Pune/Mumbai',
        testPattern: {
            sections: [
                { name: 'Aptitude', questions: 15, duration: '20 min', topics: ['Quant', 'Logical Reasoning', 'Verbal'] },
                { name: 'Technical MCQ', questions: 20, duration: '20 min', topics: ['OOP', 'DBMS', 'OS', 'Networking', 'DSA'] },
                { name: 'Coding', questions: 2, duration: '40 min', topics: ['Medium-Hard DSA', 'Dynamic Programming', 'Trees/Graphs'] },
            ],
            totalDuration: '80 min', negativeMarking: false,
        },
        interviewRounds: ['Online Test', 'Technical Interview (2 rounds)', 'HR Interview'],
        tips: ['Pune-based company — strong in Maharashtra placements', 'Technical MCQs cover core CS deeply', 'Coding is harder than average mass-recruiter', 'Focus on OOP concepts and DBMS'],
        website: 'https://www.persistent.com/careers', difficulty: 'Hard',
    },
    {
        name: 'Godrej', logo: '🟩', sector: 'Conglomerate (IT/Manufacturing)',
        ctcRange: '5 – 10 LPA', eligibility: '65% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Aptitude & Reasoning', questions: 30, duration: '30 min', topics: ['Quant', 'Logical Reasoning', 'DI'] },
                { name: 'Domain Knowledge', questions: 20, duration: '20 min', topics: ['Branch-specific technical questions'] },
                { name: 'English Communication', questions: 15, duration: '15 min', topics: ['Grammar', 'Comprehension', 'Business Writing'] },
            ],
            totalDuration: '65 min', negativeMarking: true,
        },
        interviewRounds: ['Written Test', 'Group Discussion', 'Technical Interview', 'HR Interview'],
        tips: ['One of the few with negative marking — be careful', 'GD is a mandatory round', 'Domain knowledge section varies by branch', 'Godrej values leadership and cultural fit'],
        website: 'https://www.godrej.com/careers', difficulty: 'Hard',
    },
];

const CompanyProfiles: React.FC = () => {
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    React.useEffect(() => { trackToolUsage('placement'); }, []);

    const filtered = COMPANIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.sector.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
            {selectedCompany && (
                <div className="flex items-center gap-3">
                    <Button variant="ghost" onClick={() => setSelectedCompany(null)} className="p-2 text-slate-400">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h3 className="text-lg font-bold text-white">{selectedCompany.name}</h3>
                        <p className="text-xs text-slate-500">{selectedCompany.sector}</p>
                    </div>
                </div>
            )}

            {!selectedCompany ? (
                <div className="space-y-6">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search companies..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(company => (
                            <button
                                key={company.name}
                                onClick={() => setSelectedCompany(company)}
                                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-500 transition-all text-left group hover:scale-[1.02]"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{company.logo}</span>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{company.name}</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{company.sector}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${company.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : company.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {company.difficulty}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="text-slate-400 flex items-center gap-1"><IndianRupee size={12} />{company.ctcRange}</span>
                                    <span className="text-slate-500 flex items-center gap-1"><Clock size={12} />{company.testPattern.totalDuration}</span>
                                </div>

                                <div className="flex flex-wrap gap-1.5">
                                    {company.testPattern.sections.slice(0, 3).map(s => (
                                        <span key={s.name} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700">{s.name}</span>
                                    ))}
                                    {company.testPattern.sections.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 text-slate-500">+{company.testPattern.sections.length - 3}</span>}
                                </div>

                                <div className="mt-4 flex items-center text-xs text-amber-400 group-hover:text-amber-300 transition-colors">
                                    View full pattern <ChevronRight size={14} className="ml-1" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* CTC & Eligibility */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="p-5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CTC Range</p>
                            <p className="text-2xl font-black text-emerald-400 mt-2">{selectedCompany.ctcRange}</p>
                        </Card>
                        <Card className="p-5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Test Duration</p>
                            <p className="text-2xl font-black text-blue-400 mt-2">{selectedCompany.testPattern.totalDuration}</p>
                        </Card>
                        <Card className="p-5 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Negative Marking</p>
                            <p className={`text-2xl font-black mt-2 ${selectedCompany.testPattern.negativeMarking ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {selectedCompany.testPattern.negativeMarking ? 'Yes ⚠️' : 'No ✅'}
                            </p>
                        </Card>
                    </div>

                    <Card className="p-4 border-slate-700/50 bg-slate-800/30">
                        <p className="text-xs text-slate-400"><span className="font-bold text-slate-300">Eligibility:</span> {selectedCompany.eligibility}</p>
                    </Card>

                    {/* Test Pattern */}
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5 text-amber-400" /> Test Pattern Breakdown</h3>
                        <div className="space-y-3">
                            {selectedCompany.testPattern.sections.map((section, idx) => (
                                <div key={idx} className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-bold text-white text-sm">{section.name}</h4>
                                            <p className="text-[10px] text-slate-500">{section.questions} questions • {section.duration}</p>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{section.duration}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {section.topics.map(topic => (
                                            <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Interview Rounds */}
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2"><Target className="w-5 h-5 text-violet-400" /> Selection Process</h3>
                        <div className="flex flex-wrap gap-3 items-center">
                            {selectedCompany.interviewRounds.map((round, idx) => (
                                <React.Fragment key={idx}>
                                    <div className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-sm text-violet-300 font-medium">
                                        {round}
                                    </div>
                                    {idx < selectedCompany.interviewRounds.length - 1 && <ChevronRight className="text-slate-600 w-4 h-4" />}
                                </React.Fragment>
                            ))}
                        </div>
                    </Card>

                    {/* Tips */}
                    <Card className="p-6 border-emerald-500/20 bg-emerald-500/5">
                        <h3 className="text-lg font-bold text-emerald-300 flex items-center gap-2 mb-4"><BookOpen className="w-5 h-5" /> Preparation Tips</h3>
                        <ul className="space-y-2">
                            {selectedCompany.tips.map((tip, idx) => (
                                <li key={idx} className="text-sm text-slate-300 flex items-start gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400 flex-shrink-0" /> {tip}
                                </li>
                            ))}
                        </ul>
                    </Card>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" onClick={() => window.open(selectedCompany.website, '_blank')} className="gap-2 border-amber-500/30 text-amber-400">
                            Visit Careers Page <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => navigate('/aptitude-trainer')} className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600">
                            <Code className="w-4 h-4" /> Practice Aptitude
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyProfiles;
