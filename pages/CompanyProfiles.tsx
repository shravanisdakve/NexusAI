import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Card } from '../components/ui';
import {
    Building2, ArrowLeft, Clock, BarChart3, IndianRupee, Code,
    BookOpen, Target, ChevronRight, ExternalLink, Search
} from 'lucide-react';
import { trackToolUsage } from '../services/personalizationService';

interface CampusPresence {
    college: string;
    avgPackage: string;
    highestPackage: string;
    totalOffers: number;
}

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
    campusPresence?: CampusPresence[];
}

const COMPANIES: CompanyProfile[] = [
    {
        name: 'TCS', logo: '', sector: 'IT Services & Consulting',
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
        campusPresence: [
            { college: 'SPIT', avgPackage: '7.2 LPA', highestPackage: '11.5 LPA', totalOffers: 142 },
            { college: 'VJTI', avgPackage: '7.8 LPA', highestPackage: '12.0 LPA', totalOffers: 185 },
            { college: 'DJSCE', avgPackage: '6.5 LPA', highestPackage: '9.0 LPA', totalOffers: 120 },
            { college: 'NMIMS', avgPackage: '8.2 LPA', highestPackage: '14.5 LPA', totalOffers: 95 },
        ]
    },
    {
        name: 'Infosys', logo: '', sector: 'IT Services & Digital',
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
        campusPresence: [
            { college: 'SPIT', avgPackage: '6.8 LPA', highestPackage: '9.5 LPA', totalOffers: 85 },
            { college: 'VJTI', avgPackage: '7.2 LPA', highestPackage: '10.0 LPA', totalOffers: 110 },
            { college: 'NMIMS', avgPackage: '7.5 LPA', highestPackage: '12.0 LPA', totalOffers: 65 },
        ]
    },
    {
        name: 'Wipro', logo: '', sector: 'IT Services & Consulting',
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
        name: 'Accenture', logo: '', sector: 'Consulting & IT Services',
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
        campusPresence: [
            { college: 'SPIT', avgPackage: '4.6 LPA', highestPackage: '6.5 LPA', totalOffers: 142 },
            { college: 'VJTI', avgPackage: '4.8 LPA', highestPackage: '6.8 LPA', totalOffers: 156 },
            { college: 'DJSCE', avgPackage: '4.5 LPA', highestPackage: '6.2 LPA', totalOffers: 118 },
            { college: 'KJ Somaiya', avgPackage: '4.4 LPA', highestPackage: '6.0 LPA', totalOffers: 94 },
        ]
    },
    {
        name: 'Cognizant', logo: '', sector: 'IT Services & Digital',
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
        campusPresence: [
            { college: 'KJSCE', avgPackage: '4.2 LPA', highestPackage: '8.0 LPA', totalOffers: 84 },
            { college: 'TSEC', avgPackage: '4.1 LPA', highestPackage: '7.5 LPA', totalOffers: 72 },
            { college: 'VESIT', avgPackage: '4.0 LPA', highestPackage: '6.8 LPA', totalOffers: 96 },
        ]
    },
    {
        name: 'Capgemini', logo: '', sector: 'IT Services & Consulting',
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
        name: 'Tech Mahindra', logo: '', sector: 'IT Services & Telecom',
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
        name: 'L&T Infotech (LTIMindtree)', logo: '', sector: 'IT Services & Engineering',
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
        name: 'Persistent Systems', logo: '', sector: 'Product Engineering & Digital',
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
        name: 'Godrej', logo: '', sector: 'Conglomerate (IT/Manufacturing)',
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
    {
        name: 'JP Morgan Chase', logo: '', sector: 'Investment Banking & Fintech',
        ctcRange: '14 – 20 LPA', eligibility: '7.5 CGPA +, no backlogs',
        testPattern: {
            sections: [
                { name: 'Coding (DSA)', questions: 2, duration: '60 min', topics: ['Arrays', 'Strings', 'Linked Lists', 'Trees', 'Graphs'] },
                { name: 'Technical MCQ', questions: 20, duration: '20 min', topics: ['Java', 'Spring', 'OOP', 'SQL', 'OS'] },
            ],
            totalDuration: '80 min', negativeMarking: false,
        },
        interviewRounds: ['Coding Test', 'HireVue Video Interview', 'CFG Hackathon (Optional)', 'Technical Interview', 'HR Interview'],
        tips: ['Focus on clean code and time complexity', 'Strong DSA is mandatory', 'Practice behavioral questions for HireVue', 'Knowledge of Java/Spring is a huge plus'],
        website: 'https://jpmorganchase.com/careers', difficulty: 'Hard',
        campusPresence: [
            { college: 'SPIT', avgPackage: '14.8 LPA', highestPackage: '17.7 LPA', totalOffers: 18 },
            { college: 'VJTI', avgPackage: '15.5 LPA', highestPackage: '19.5 LPA', totalOffers: 22 },
            { college: 'DJSCE', avgPackage: '14.0 LPA', highestPackage: '16.5 LPA', totalOffers: 12 },
        ]
    },
    {
        name: 'Barclays', logo: '', sector: 'Financial Services',
        ctcRange: '12 – 18 LPA', eligibility: '60% throughout, no active backlogs',
        testPattern: {
            sections: [
                { name: 'Aptitude & Logical', questions: 30, duration: '30 min', topics: ['Quant', 'Logical', 'Verbal'] },
                { name: 'Coding', questions: 2, duration: '45 min', topics: ['Strings', 'Sorting', 'Searching', 'Basic DP'] },
            ],
            totalDuration: '75 min', negativeMarking: false,
        },
        interviewRounds: ['Online Test', 'Technical Interview', 'HR Interview'],
        tips: ['Values are very important to Barclays (RISES)', 'Prepare Java and SQL deeply', 'Focus on problem-solving approach', 'Be ready for scenario-based questions'],
        website: 'https://search.jobs.barclays', difficulty: 'Hard',
        campusPresence: [
            { college: 'SPIT', avgPackage: '12.5 LPA', highestPackage: '14.5 LPA', totalOffers: 15 },
            { college: 'VJTI', avgPackage: '13.0 LPA', highestPackage: '15.0 LPA', totalOffers: 18 },
            { college: 'TSEC', avgPackage: '11.8 LPA', highestPackage: '13.5 LPA', totalOffers: 8 },
        ]
    },
];

interface CompanyProfilesProps {
    onSwitchToTab?: (tab: 'tracker' | 'predictor', data?: any) => void;
}

const CompanyProfiles: React.FC<CompanyProfilesProps> = ({ onSwitchToTab }) => {
    const navigate = useNavigate();
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfile | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
    const [ctcFilter, setCtcFilter] = useState<string>('All');

    React.useEffect(() => { trackToolUsage('placement'); }, []);

    const filtered = COMPANIES.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             c.sector.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDifficulty = difficultyFilter === 'All' || c.difficulty === difficultyFilter;
        
        let matchesCtc = true;
        if (ctcFilter !== 'All') {
            const val = parseFloat(c.ctcRange.split('–')[0]);
            if (ctcFilter === 'High (>10 LPA)') matchesCtc = val >= 10;
            else if (ctcFilter === 'Mid (5-10 LPA)') matchesCtc = val >= 5 && val < 10;
            else if (ctcFilter === 'Entry (<5 LPA)') matchesCtc = val < 5;
        }

        return matchesSearch && matchesDifficulty && matchesCtc;
    });

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
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                                id="company-search"
                                name="companySearch"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search companies..."
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50"
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <select 
                                value={difficultyFilter} 
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                            >
                                <option value="All">All Difficulties</option>
                                <option value="Easy">Easy</option>
                                <option value="Medium">Medium</option>
                                <option value="Hard">Hard</option>
                            </select>
                            <select 
                                value={ctcFilter} 
                                onChange={(e) => setCtcFilter(e.target.value)}
                                className="bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                            >
                                <option value="All">All Packages</option>
                                <option value="High (>10 LPA)">High (&gt;10 LPA)</option>
                                <option value="Mid (5-10 LPA)">Mid (5-10 LPA)</option>
                                <option value="Entry (<5 LPA)">Entry (&lt;5 LPA)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                        {filtered.map(company => (
                            <button
                                key={company.name}
                                onClick={() => setSelectedCompany(company)}
                                className="p-[14px] rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-500 transition-all text-left flex flex-col group hover:-translate-y-[2px]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-white leading-tight">{company.name}</h3>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{company.sector.split(' & ')[0]}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${company.difficulty === 'Easy' ? 'bg-emerald-500/20 text-emerald-400' : company.difficulty === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {company.difficulty}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-2 mb-3 mt-1">
                                    <span className="text-emerald-400 font-bold text-[13px] flex items-center gap-[2px] bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                        <IndianRupee size={12} />{company.ctcRange.split(' – ')[0]} LPA
                                    </span>
                                    <span className="text-slate-500 text-[11px] flex items-center gap-1 font-medium"><Clock size={12} />{company.testPattern.totalDuration.split(' ')[0]}m</span>
                                </div>

                                <div className="flex flex-wrap gap-1 mt-auto">
                                    {company.testPattern.sections.slice(0, 2).map(s => (
                                        <span key={s.name} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-500 font-medium">{s.name}</span>
                                    ))}
                                    {company.testPattern.sections.length > 2 && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-700 opacity-70">+{company.testPattern.sections.length - 2}</span>}
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
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">CTC Range</p>
                            <p className="text-2xl font-black text-emerald-400 mt-2">{selectedCompany.ctcRange}</p>
                        </Card>
                        <Card className="p-5 text-center">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Test Duration</p>
                            <p className="text-2xl font-black text-blue-400 mt-2">{selectedCompany.testPattern.totalDuration}</p>
                        </Card>
                        <Card className="p-5 text-center">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Negative Marking</p>
                            <p className={`text-2xl font-black mt-2 ${selectedCompany.testPattern.negativeMarking ? 'text-rose-400' : 'text-emerald-400'}`}>
                                {selectedCompany.testPattern.negativeMarking ? 'Yes' : 'No'}
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
                                            <p className="text-xs text-slate-500">{section.questions} questions • {section.duration}</p>
                                        </div>
                                        <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{section.duration}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {section.topics.map(topic => (
                                            <span key={topic} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">{topic}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Interview Rounds */}
                    <Card className="p-6 space-y-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-violet-400" /> Selection Process
                        </h3>
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

                    {/* MU Campus Intelligence */}
                    {selectedCompany.campusPresence && (
                        <Card className="p-6 space-y-4 border-amber-500/20 bg-amber-500/5">
                            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                                <Building2 className="w-5 h-5" /> MU Campus Intelligence (Top-4)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-slate-500 border-b border-slate-700/50">
                                            <th className="pb-2 text-left font-bold uppercase text-xs">College</th>
                                            <th className="pb-2 text-center font-bold uppercase text-xs">Avg Package</th>
                                            <th className="pb-2 text-center font-bold uppercase text-xs">Highest</th>
                                            <th className="pb-2 text-right font-bold uppercase text-xs">Offers</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/30">
                                        {selectedCompany.campusPresence.map((cp, idx) => (
                                            <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 font-bold text-slate-200">{cp.college}</td>
                                                <td className="py-3 text-center text-emerald-400 font-mono">{cp.avgPackage}</td>
                                                <td className="py-3 text-center text-amber-400 font-mono">{cp.highestPackage}</td>
                                                <td className="py-3 text-right text-slate-300">{cp.totalOffers}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500 italic mt-4 flex items-center gap-1">
                                <Target size={12} /> Live placement data aggregated from MU 2024-25 session records.
                            </p>
                        </Card>
                    )}

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
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button 
                            variant="outline" 
                            onClick={() => window.open(selectedCompany.website, '_blank')} 
                            className="gap-2 border-slate-700 text-slate-400"
                        >
                            Website <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => onSwitchToTab?.('tracker', { 
                                company: selectedCompany.name, 
                                role: 'Software Engineer', 
                                ctc: selectedCompany.ctcRange 
                            })} 
                            className="gap-2 border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                        >
                            Add to Tracker
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={() => onSwitchToTab?.('predictor', { 
                                targetCompany: selectedCompany.name 
                            })} 
                            className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                            Predict Fit
                        </Button>
                        <Button onClick={() => navigate('/aptitude-trainer')} className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-600/20">
                            Practice <Code className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyProfiles;
