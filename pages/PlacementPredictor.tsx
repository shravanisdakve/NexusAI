import React, { useState } from 'react';
import { Card, Button } from '../components/ui';
import { Target, TrendingUp, AlertCircle, Briefcase, GraduationCap, Code, Building2, Check } from 'lucide-react';
import { predictPlacement, PredictionResult } from '../services/placementService';

const MU_COLLEGES = [
    'SPIT', 'VJTI', 'DJSCE', 'NMIMS', 'KJSCE', 'TSEC', 'VESIT', 'FR AGNEL', 'THAKUR', 'VIDYALANKAR', 'OTHER'
];

const BRANCHES = [
    'COMPUTER ENGINEERING', 'INFORMATION TECHNOLOGY', 'EXTC', 'ELECTRONICS', 'DATA SCIENCE', 'AI & ML', 'OTHER'
];

const TARGET_COMPANIES = [
    'TCS Ninja', 'TCS Digital', 'Infosys', 'Infosys DSE', 'JP Morgan', 'Morgan Stanley', 'Barclays', 'Accenture', 'Cognizant', 'Jio'
];

const COMMON_SKILLS = [
    'Java', 'Python', 'C++', 'JavaScript', 'React', 'Node', 'Spring Boot', 'SQL', 'DSA', 'AWS', 'System Design'
];

interface PlacementPredictorProps {
    prefillData?: any;
    onPrefillConsumed?: () => void;
}

const PlacementPredictor: React.FC<PlacementPredictorProps> = ({ prefillData, onPrefillConsumed }) => {
    const [formParams, setFormParams] = useState({
        college: 'SPIT',
        branch: 'COMPUTER ENGINEERING',
        cgpa: 8.5,
        targetCompany: 'TCS Digital',
        skills: [] as string[]
    });

    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<PredictionResult | null>(null);

    React.useEffect(() => {
        if (prefillData && prefillData.targetCompany) {
            // Find the closest match in TARGET_COMPANIES
            const match = TARGET_COMPANIES.find(t => 
                t.toLowerCase().includes(prefillData.targetCompany.toLowerCase()) ||
                prefillData.targetCompany.toLowerCase().includes(t.toLowerCase())
            );
            if (match) {
                setFormParams(prev => ({ ...prev, targetCompany: match }));
            }
            onPrefillConsumed?.();
        }
    }, [prefillData, onPrefillConsumed]);

    const handlePredict = async () => {
        setLoading(true);
        const result = await predictPlacement({
            college: formParams.college,
            branch: formParams.branch,
            cgpa: formParams.cgpa,
            skills: formParams.skills,
            targetCompany: formParams.targetCompany
        });
        setPrediction(result);
        setLoading(false);
    };

    const toggleSkill = (skill: string) => {
        setFormParams(prev => ({
            ...prev,
            skills: prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill]
        }));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-fade-in">
            <div className="flex flex-col gap-2 mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <TrendingUp className="text-amber-400" /> Package & Placement Predictor
                </h2>
                <p className="text-sm text-slate-400">
                    Calculates your probability of shortlisting and conversion based on live MU placement trends (SPIT, VJTI, NMIMS etc.), your CGPA, and specific skill expectations.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 space-y-5 border-slate-700/50 bg-slate-800/40">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label htmlFor="college-select" className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                <GraduationCap size={12}/> College (MU)
                            </label>
                            <select 
                                id="college-select"
                                name="college"
                                value={formParams.college}
                                onChange={(e) => setFormParams({...formParams, college: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500/50 focus:outline-none"
                            >
                                {MU_COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label htmlFor="branch-select" className="block text-[10px] font-black text-slate-500 uppercase mb-1.5">Branch</label>
                            <select 
                                id="branch-select"
                                name="branch"
                                value={formParams.branch}
                                onChange={(e) => setFormParams({...formParams, branch: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500/50 focus:outline-none"
                            >
                                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label htmlFor="company-select" className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                                <Briefcase size={12} /> Target Company
                            </label>
                            <select 
                                id="company-select"
                                name="targetCompany"
                                value={formParams.targetCompany}
                                onChange={(e) => setFormParams({...formParams, targetCompany: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:border-amber-500/50 focus:outline-none"
                            >
                                {TARGET_COMPANIES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label htmlFor="cgpa-range" className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 flex items-center justify-between">
                                <span>CGPA: <span className="text-amber-400 font-mono">{formParams.cgpa}</span></span>
                            </label>
                            <input 
                                id="cgpa-range"
                                name="cgpa"
                                type="range" 
                                min="5" max="10" step="0.1"
                                value={formParams.cgpa}
                                onChange={(e) => setFormParams({...formParams, cgpa: parseFloat(e.target.value)})}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
                            />
                        </div>

                        <div className="col-span-2 border-t border-slate-700/50 pt-4">
                            <label id="skills-label" className="block text-[10px] font-black text-slate-500 uppercase mb-3 flex items-center gap-1">
                                <Code size={12} /> Tech Skill Breakdown
                            </label>
                            <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="skills-label">
                                {COMMON_SKILLS.map(skill => {
                                    const active = formParams.skills.includes(skill);
                                    return (
                                        <button
                                            key={skill}
                                            onClick={() => toggleSkill(skill)}
                                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                                                active ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500'
                                            }`}
                                        >
                                            {skill}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <Button onClick={handlePredict} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 mt-4">
                        {loading ? 'Analyzing Data...' : 'Run Prediction Model'}
                    </Button>
                </Card>

                <div className="space-y-4">
                    {prediction ? (
                        <div className="space-y-4 animate-fade-in">
                            <Card className="p-6 border-slate-700/50 flex flex-col items-center justify-center text-center bg-gradient-to-br from-slate-900 to-slate-800">
                                <div className="relative mb-4">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-700" />
                                        <circle 
                                            cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="transparent" 
                                            strokeDasharray={2 * Math.PI * 56} 
                                            strokeDashoffset={2 * Math.PI * 56 * (1 - prediction.probability / 100)} 
                                            className={`${prediction.probability >= 75 ? 'text-emerald-400' : prediction.probability >= 50 ? 'text-amber-400' : 'text-rose-400'} transition-all duration-1000`} 
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-3xl font-black text-white">{prediction.probability}%</span>
                                    </div>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">Selection Probability</h3>
                                <p className="text-sm text-slate-400 max-w-xs leading-relaxed">{prediction.message}</p>
                            </Card>

                            <div className="grid grid-cols-2 gap-4">
                                <Card className="p-4 bg-slate-800/50 border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expected CTC</p>
                                    <p className="text-lg font-black text-emerald-400">{prediction.ctcEstimate}</p>
                                </Card>
                                <Card className="p-4 bg-slate-800/50 border-slate-700/50">
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Skill Match</p>
                                    <p className="text-lg font-black text-amber-400">{prediction.matchedSkillsCount} / {prediction.expectedSkills.length}</p>
                                </Card>
                            </div>

                            {/* Targeted Prep Check */}
                            <Card className="p-4 bg-amber-500/10 border-amber-500/20">
                                <h4 className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-2">
                                    <Target size={16} /> Targeted Prep Needed
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(prediction.expectedSkills || []).map(s => {
                                        const hasSkill = formParams.skills.some(userSkill => userSkill.toUpperCase() === s.toUpperCase());
                                        return (
                                            <span key={s} className={`text-xs px-2 py-1 rounded-md ${hasSkill ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400 border border-slate-700 line-through opacity-70'}`}>
                                                {s} {hasSkill ? <Check className="inline-block ml-1" size={10} /> : ''}
                                            </span>
                                        );
                                    })}
                                </div>
                                <p className="text-xs text-amber-500/70 mt-3 flex items-start gap-1.5">
                                    <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                    Missing skills (crossed out) act as a strong filter for {formParams.targetCompany}.
                                </p>
                            </Card>

                            {prediction.breakdown && (
                                <Card className="p-5 border-slate-700/50 bg-slate-900/30">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Probability Breakdown</h4>
                                    <div className="space-y-2.5">
                                        {prediction.breakdown.map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-[11px]">
                                                <span className="text-slate-300">{item.label}</span>
                                                <span className={`font-mono font-bold ${item.type === 'positive' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                    {item.impact > 0 ? `+${item.impact}` : item.impact}%
                                                </span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-2 border-t border-slate-700/50 flex justify-between text-xs font-bold">
                                            <span className="text-white">Final Score</span>
                                            <span className="text-amber-400 font-mono">{prediction.probability}%</span>
                                        </div>
                                    </div>
                                </Card>
                            )}

                            {prediction.comparisons && (
                                <Card className="p-5 border-emerald-500/15 bg-emerald-500/5">
                                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <TrendingUp size={12} /> Company Benchmarks
                                    </h4>
                                    <div className="grid grid-cols-1 gap-1.5">
                                        {prediction.comparisons.map((comp, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-700/30">
                                                <span className="text-xs font-bold text-slate-200">{comp.company}</span>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-16 h-1 rounded-full bg-slate-800 overflow-hidden">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-1000 ${comp.probability >= 70 ? 'bg-emerald-500' : comp.probability >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                                                            style={{ width: `${comp.probability}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-slate-400 w-8">{comp.probability}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic mt-3 leading-tight">
                                        Comparison based on {formParams.college} trends and skill-set eligibility.
                                    </p>
                                </Card>
                            )}
                        </div>
                    ) : (
                        <Card className="h-full border-slate-700/50 border-dashed bg-slate-800/10 p-6 flex flex-col justify-center">
                            <div className="text-center mb-8">
                                <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-400 mb-1">Awaiting Parameters</h3>
                                <p className="text-xs text-slate-500">Prediction logic assesses 4 primary factors:</p>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { icon: <GraduationCap size={16} />, label: 'Academic Standing', desc: 'CGPA thresholds for MU colleges' },
                                    { icon: <Code size={16} />, label: 'Technical Stack', desc: 'Skill-match with company requirements' },
                                    { icon: <Building2 size={16} />, label: 'Market Trends', desc: 'Active hiring data for target tier' },
                                    { icon: <Target size={16} />, label: 'Fit Analysis', desc: 'Profile strength vs. role expectations' }
                                ].map((factor, i) => (
                                    <div key={i} className="flex gap-4 p-3 rounded-xl bg-slate-900/40 border border-slate-800/50 opacity-60">
                                        <div className="text-slate-400 shrink-0">{factor.icon}</div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-300">{factor.label}</p>
                                            <p className="text-[10px] text-slate-500">{factor.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlacementPredictor;
