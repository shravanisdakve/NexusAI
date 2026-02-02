import React, { useState, useMemo } from 'react';
import { PageHeader, Button, Input } from '../components/ui';
import { Shield, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KTCalculator: React.FC = () => {
    const navigate = useNavigate();
    const [ia1, setIa1] = useState<number | ''>('');
    const [ia2, setIa2] = useState<number | ''>('');
    const [endSemMax, setEndSemMax] = useState<80 | 60>(80);

    const calculation = useMemo(() => {
        const val1 = ia1 === '' ? 0 : ia1;
        const val2 = ia2 === '' ? 0 : ia2;

        // MU IA is average of two tests out of 20
        const iaTotal = (val1 + val2) / 2;

        let passingThreshold = 40; // Default passing 40/100
        let endSemPassingPercentage = 0.4; // 32/80 or 24/60

        if (endSemMax === 60) {
            passingThreshold = 40; // Still 40% usually
        }

        const minInEndSem = Math.ceil(endSemMax * endSemPassingPercentage);
        const marksNeededToPassTotal = Math.max(0, passingThreshold - iaTotal);

        const finalRequired = Math.max(minInEndSem, marksNeededToPassTotal);

        let status: 'safe' | 'caution' | 'danger' = 'safe';
        if (finalRequired > endSemMax * 0.6) status = 'danger';
        else if (finalRequired > endSemMax * 0.45) status = 'caution';

        return {
            iaTotal,
            minInEndSem,
            finalRequired,
            status
        };
    }, [ia1, ia2, endSemMax]);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2">
                    <ArrowLeft size={20} />
                </Button>
                <PageHeader
                    title="KT Avoidance Tool"
                    subtitle="Calculate exactly what you need to clear your Mumbai University papers."
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-slate-800/50 rounded-2xl p-8 ring-1 ring-slate-700 space-y-6">
                    <h3 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                        <Shield className="text-sky-400" /> Exam Parameters
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Internal Assessment 1 (Out of 20)</label>
                            <Input
                                id="ia1-marks"
                                name="ia1"
                                type="number"
                                value={ia1}
                                onChange={(e) => setIa1(e.target.value === '' ? '' : Math.min(20, Math.max(0, parseInt(e.target.value))))}
                                placeholder="Enter IA1 marks"
                                className="bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Internal Assessment 2 (Out of 20)</label>
                            <Input
                                id="ia2-marks"
                                name="ia2"
                                type="number"
                                value={ia2}
                                onChange={(e) => setIa2(e.target.value === '' ? '' : Math.min(20, Math.max(0, parseInt(e.target.value))))}
                                placeholder="Enter IA2 marks"
                                className="bg-slate-900/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">End Sem Paper Weightage</label>
                            <div className="flex gap-4 mt-2">
                                <button
                                    onClick={() => setEndSemMax(80)}
                                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${endSemMax === 80 ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                >
                                    80 Marks
                                </button>
                                <button
                                    onClick={() => setEndSemMax(60)}
                                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${endSemMax === 60 ? 'border-sky-500 bg-sky-500/10 text-sky-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                >
                                    60 Marks
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-6">
                    <div className={`rounded-2xl p-8 ring-2 transition-all duration-500 ${calculation.status === 'safe' ? 'bg-emerald-950/20 ring-emerald-500/50' :
                        calculation.status === 'caution' ? 'bg-amber-950/20 ring-amber-500/50' :
                            'bg-rose-950/20 ring-rose-500/50'
                        }`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Required Marks</h3>
                                <div className="text-5xl font-black text-slate-100 mt-2">
                                    {calculation.finalRequired}
                                    <span className="text-xl text-slate-500 font-medium ml-2">/ {endSemMax}</span>
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl ${calculation.status === 'safe' ? 'bg-emerald-500/20 text-emerald-400' :
                                calculation.status === 'caution' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-rose-500/20 text-rose-400'
                                }`}>
                                {calculation.status === 'safe' ? <CheckCircle size={32} /> :
                                    calculation.status === 'caution' ? <AlertTriangle size={32} /> :
                                        <AlertTriangle size={32} />}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-slate-900/50 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">IA Average Score</span>
                                <span className="text-slate-100 font-bold">{calculation.iaTotal} / 20</span>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-900/50 flex justify-between items-center">
                                <span className="text-slate-400 text-sm">Min. Required in Theory</span>
                                <span className="text-slate-100 font-bold">{calculation.minInEndSem} / {endSemMax}</span>
                            </div>
                        </div>

                        <div className="mt-8">
                            <p className="text-sm font-medium opacity-80 leading-relaxed italic">
                                {calculation.status === 'safe' && "You're in the safe zone! Focus on maintaining consistent scores."}
                                {calculation.status === 'caution' && "Stay cautious. You need a solid performance in the End Sem to clear this."}
                                {calculation.status === 'danger' && "Danger! IA scores are low. You must score highly in the End Sem to avoid a KT."}
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-2xl p-6 ring-1 ring-slate-700 border-l-4 border-sky-500">
                        <h4 className="text-sky-400 font-bold mb-2 flex items-center gap-2">
                            <Shield size={16} /> MU Passing Rule Note
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Under Mumbai University regulations, you generally need 40% combined in Internal Assessment and End Sem. However, you MUST score at least 40% (32/80 or 24/60) in the theory paper specifically to pass the subject.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default KTCalculator;
