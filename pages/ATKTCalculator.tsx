import React, { useState } from 'react';
import { PageHeader, Button, Input, Card } from '@/components/ui';
import {
    Calculator,
    CheckCircle2,
    AlertCircle,
    Info,
    Download,
    Trophy,
    GraduationCap,
    TrendingUp
} from 'lucide-react';
import { calculateGrace, checkProgression, SubjectMarks } from '@/services/atkService';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

const ATKTCalculator: React.FC = () => {
    const { t } = useLanguage();
    const [subjects, setSubjects] = useState<any[]>([
        { name: "Applied Mathematics IV", obtained: "", passing: "" },
        { name: "Engineering Mechanics", obtained: "", passing: "" },
    ]);
    const [extracurriculars, setExtracurriculars] = useState(false);
    const [totalAggregate, setTotalAggregate] = useState(0);
    const [currentSemester, setCurrentSemester] = useState(1);
    const [cumulativeCredits, setCumulativeCredits] = useState(0);

    const [report, setReport] = useState<any>(null);
    const [progression, setProgression] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const calculateAggregate = (subjs: any[]) => {
        const total = subjs.reduce((acc, s) => acc + (Number(s.obtained) || 0), 0);
        setTotalAggregate(total);
    };

    const handleSubjectChange = (index: number, field: string, value: string) => {
        const newSubjects = [...subjects];
        
        if (field === 'name') {
            newSubjects[index].name = value;
        } else {
            (newSubjects[index] as any)[field] = value;
        }

        if (field === 'obtained' || field === 'passing') {
          const obs = Number(newSubjects[index].obtained || 0);
          const pss = Number(newSubjects[index].passing || 0);
          newSubjects[index].status = obs >= pss ? 'Pass' : 'Fail';
        }

        setSubjects(newSubjects);
        calculateAggregate(newSubjects);
    };

    const addSubject = () => {
        setSubjects([...subjects, { name: '', obtained: '', passing: '', distinctionMarks: 60, status: 'Fail' }]);
    };

    const removeSubject = (index: number) => {
        setSubjects(subjects.filter((_, i) => i !== index));
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const mappedSubjects = subjects.map(s => ({
              ...s,
              obtainedMarks: Number(s.obtained || 0),
              passingMarks: Number(s.passing || 0),
              distinctionMarks: s.distinctionMarks || 60,
              status: s.status || 'Fail'
            }));
            const graceRes = await calculateGrace(mappedSubjects, totalAggregate, extracurriculars);
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
                title={t('atk.title')}
                subtitle={t('atk.subtitle')}
                icon={<Calculator className="w-8 h-8 text-purple-400" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Input Section */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <GraduationCap className="text-blue-400" />
                                {t('atk.academicScorecard')}
                            </h2>
                            <Button variant="outline" size="sm" onClick={addSubject} className="gap-2">
                                <TrendingUp className="w-4 h-4" /> {t('atk.addSubject')}
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
                                        <label className="text-xs text-slate-400 mb-1 block">{t('atk.subjectName')}</label>
                                        <Input
                                            value={subject.name}
                                            onChange={(e) => handleSubjectChange(index, 'name', e.target.value)}
                                            placeholder={t('atk.subjectPlaceholder')}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">{t('atk.marksObtained')}</label>
                                        <Input
                                            type="text"
                                            value={subject.obtained}
                                            onChange={(e) => handleSubjectChange(index, 'obtained', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs text-slate-400 mb-1 block">{t('atk.passingMarks')}</label>
                                        <Input
                                            type="text"
                                            value={subject.passing}
                                            onChange={(e) => handleSubjectChange(index, 'passing', e.target.value)}
                                        />
                                    </div>
                                    <div className="md:col-span-2 flex items-end justify-center pb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${subject.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {subject.status === 'Pass' ? t('atk.pass') : t('atk.fail')}
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
                                {t('atk.progressionMetrics')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">{t('atk.currentSemester')}</label>
                                    <select
                                        className="w-full bg-slate-900 border-slate-700 rounded-lg p-2 text-slate-200"
                                        value={currentSemester}
                                        onChange={(e) => setCurrentSemester(Number(e.target.value))}
                                    >
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                                            <option key={sem} value={sem}>Semester {sem}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm text-slate-400 mb-2 block">{t('atk.cumulativeCredits')}</label>
                                    <Input
                                        type="number"
                                        value={cumulativeCredits}
                                        onChange={(e) => setCumulativeCredits(Number(e.target.value))}
                                        placeholder="Enter total credits earned"
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-100">{t('atk.totalAggregate')}</h4>
                                        <p className="text-2xl font-black text-white">{totalAggregate} <span className="text-sm font-normal text-slate-400">marks</span></p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleCalculate} className="w-full mt-8 gap-2 py-6" size="lg">
                                <Calculator className="w-5 h-5" /> {t('atk.calculateProgression')}
                            </Button>
                    </Card>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    <AnimatePresence>
                        {report && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <Card className="p-6 border-slate-700 bg-slate-800/80">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <CheckCircle2 className="text-emerald-400" />
                                        {t('atk.graceAnalysis')}
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-slate-400">{t('atk.graceAvailable')}</span>
                                            <span className="font-bold text-emerald-400">{report.totalGraceAvailable} %</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-slate-700">
                                            <span className="text-slate-200">{t('atk.recommendedGrace')}</span>
                                            <span className="text-emerald-400">+{report.graceApplied} marks</span>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6 border-slate-700 bg-slate-800/80">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Info className="text-blue-400" />
                                        {t('atk.eligibility')}
                                    </h3>
                                    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 flex flex-col items-center">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${progression?.isEligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {progression?.isEligible ? <CheckCircle2 size={32} /> : <AlertCircle size={32} />}
                                        </div>
                                        <p className="text-center font-bold text-lg mb-1">{progression?.reason}</p>
                                        <p className="text-xs text-slate-500 text-center uppercase tracking-widest">{t('atk.muRuleReference')}</p>
                                    </div>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Card className="p-6 bg-violet-900/20 border-violet-500/20">
                        <h4 className="text-violet-400 font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-tighter">
                            <Info size={14} /> {t('atk.engineeringRule')}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            {t('atk.engineeringRuleText')}
                        </p>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ATKTCalculator;
