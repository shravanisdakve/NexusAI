import React, { useState } from 'react';
import { PageHeader, Button, Input, Card } from '@/components/ui';
import {
    Calculator,
    CheckCircle2,
    AlertCircle,
    Info,
<<<<<<< Updated upstream
=======
    Download,
>>>>>>> Stashed changes
    Trophy,
    GraduationCap,
    TrendingUp
} from 'lucide-react';
<<<<<<< Updated upstream
import { calculateGrace, checkProgression, SubjectMarks } from '@/services/atkService';
=======
import { calculateGrace, checkProgression, SubjectMarks } from '../services/atkService';
>>>>>>> Stashed changes
import { motion, AnimatePresence } from 'framer-motion';

const ATKTCalculator: React.FC = () => {
    const [subjects, setSubjects] = useState<SubjectMarks[]>([
        { name: 'Applied Mathematics-I', obtainedMarks: 0, passingMarks: 32, distinctionMarks: 60, status: 'Fail' },
        { name: 'Engineering Mechanics', obtainedMarks: 0, passingMarks: 32, distinctionMarks: 60, status: 'Fail' },
    ]);
    const [extracurriculars, setExtracurriculars] = useState(false);
    const [totalAggregate, setTotalAggregate] = useState(0);
    const [currentSemester, setCurrentSemester] = useState(1);
    const [cumulativeCredits, setCumulativeCredits] = useState(0);

    const [report, setReport] = useState<any>(null);
    const [progression, setProgression] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSubjectChange = (index: number, field: keyof SubjectMarks, value: any) => {
        const newSubjects = [...subjects];
        (newSubjects[index] as any)[field] = value;

        if (field === 'obtainedMarks' || field === 'passingMarks') {
            newSubjects[index].status = newSubjects[index].obtainedMarks >= newSubjects[index].passingMarks ? 'Pass' : 'Fail';
        }

        setSubjects(newSubjects);
        calculateAggregate(newSubjects);
    };

    const calculateAggregate = (subjs: SubjectMarks[]) => {
        const total = subjs.reduce((acc, s) => acc + (Number(s.obtainedMarks) || 0), 0);
        setTotalAggregate(total);
    };

    const addSubject = () => {
        setSubjects([...subjects, { name: '', obtainedMarks: 0, passingMarks: 32, distinctionMarks: 60, status: 'Fail' }]);
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const graceRes = await calculateGrace(subjects, totalAggregate, extracurriculars);
            const progRes = await checkProgression(currentSemester, cumulativeCredits);
            setReport(graceRes.report);
            setProgression(progRes.result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <PageHeader
                title="MU ATKT & Grace Marks Navigator"
                subtitle="Navigate the complexities of Mumbai University ordinances and NEP progression rules with precision."
                icon={<Calculator className="w-8 h-8 text-purple-400" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
<<<<<<< Updated upstream
=======
                {/* Input Section */}
>>>>>>> Stashed changes
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <GraduationCap className="text-blue-400" />
                                Academic Scorecard
                            </h2>
                            <Button variant="outline" size="sm" onClick={addSubject} className="gap-2">
                                <TrendingUp className="w-4 h-4" /> Add Subject
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {subjects.map((subject, index) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={index}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-700/50 relative group"
                                >
                                    <div className="md:col-span-5">
                                        <label className="text-xs text-slate-400 mb-1 block">Subject Name</label>
                                        <Input
                                            value={subject.name}
                                            onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                                            placeholder="e.g. Applied Math"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">Marks Obtained</label>
                                        <Input
                                            type="number"
                                            value={subject.obtainedMarks}
                                            onChange={(e) => handleSubjectChange(index, 'obtainedMarks', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">Passing Marks</label>
                                        <Input
                                            type="number"
                                            value={subject.passingMarks}
                                            onChange={(e) => handleSubjectChange(index, 'passingMarks', parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-end justify-center pb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${subject.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {subject.status}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeSubject(index)}
                                        className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-purple-400" />
                            Progression Metrics (NEP 2024-25)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Current Semester</label>
                                <select
                                    className="w-full bg-slate-900 border-slate-700 rounded-lg p-2 text-slate-200"
                                    value={currentSemester}
                                    onChange={(e) => setCurrentSemester(parseInt(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                                        <option key={s} value={s}>Semester {s}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-slate-400 mb-2 block">Cumulative Credits Earned</label>
                                <Input
                                    type="number"
                                    value={cumulativeCredits}
                                    onChange={(e) => setCumulativeCredits(parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={extracurriculars}
                                    onChange={(e) => setExtracurriculars(e.target.checked)}
                                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-500 focus:ring-purple-500"
                                />
                                <span className="text-sm text-slate-300">Participation in NSS / NCC / Cultural Activities (O.229-A)</span>
                            </label>
                        </div>
                    </Card>

                    <Button
                        className="w-full py-6 text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
                        onClick={handleCalculate}
                        disabled={loading}
                    >
                        {loading ? 'Analyzing Ordinances...' : 'Execute Calculation Engine'}
                    </Button>
                </div>

<<<<<<< Updated upstream
=======
                {/* Report Section */}
>>>>>>> Stashed changes
                <div className="space-y-6">
                    <AnimatePresence>
                        {report && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <Card className="p-6 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-lg">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-emerald-400">
                                        <CheckCircle2 className="w-5 h-5" />
                                        Eligibility Report
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(report).map(([key, val]: [string, any]) => {
                                            if (typeof val !== 'object' || !val) return null;
                                            return (
                                                <div key={key} className="p-3 rounded-lg bg-slate-900/60 border border-slate-700">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-xs font-mono text-slate-400">{key.toUpperCase()}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${val.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                                            {val.eligible ? 'ELIGIBLE' : 'NOT APPLICABLE'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-slate-300">{val.details}</p>
                                                    {val.marksRecommended > 0 && (
                                                        <div className="mt-2 text-xs flex items-center gap-1 text-emerald-400">
                                                            <Trophy className="w-3 h-3" />
                                                            Recommended Grace: +{val.marksRecommended} Marks
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card>

                                {progression && (
                                    <Card className={`p-6 border-blue-500/30 backdrop-blur-lg ${progression.canPromote ? 'bg-blue-500/5' : 'bg-rose-500/5 border-rose-500/30'}`}>
                                        <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${progression.canPromote ? 'text-blue-400' : 'text-rose-400'}`}>
                                            <TrendingUp className="w-5 h-5" />
                                            NEP Progression Status
                                        </h3>
                                        <p className="text-sm text-slate-300 mb-4">{progression.message}</p>
                                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ${progression.canPromote ? 'bg-blue-500' : 'bg-rose-500'}`}
                                                style={{ width: `${Math.min(100, (cumulativeCredits / progression.threshold) * 100)}%` }}
                                            />
                                        </div>
<<<<<<< Updated upstream
                                    </Card>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
=======
                                        <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
                                            <span>CREDITS: {cumulativeCredits}</span>
                                            <span>TARGET: {progression.threshold}</span>
                                        </div>
                                    </Card>
                                )}

                                <Card className="p-4 bg-slate-800/80 border-slate-700 text-xs text-slate-400 italic">
                                    <div className="flex gap-2">
                                        <Info className="w-4 h-4 shrink-0 text-amber-400" />
                                        <p>
                                            Disclaimer: This report is based on Mumbai University Ordinances 0.5042-A, 0.5044-A, 0.229-A and NEP 2024-25 progression rules. Actual results depend on the university's final decision and individual eligibility criteria.
                                        </p>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!report && (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
                            <AlertCircle className="w-12 h-12 text-slate-600 mb-4" />
                            <h3 className="text-slate-400 font-medium">No Data Processed</h3>
                            <p className="text-slate-500 text-sm mt-2">Enter your academic scores to receive a detailed ordinance analysis.</p>
                        </div>
                    )}
>>>>>>> Stashed changes
                </div>
            </div>
        </div>
    );
};

export default ATKTCalculator;
