import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStates, getCities, getColleges } from '../data/colleges';

type PersonalizationData = {
    learningGoals: string[];
    learningStyle: string;
    studyTime: string;
    targetExam: string;
    minorDegree: string;
    backlogs: number;
    branch: string;
    year: string;
    state: string;
    city: string;
    college: string;
};

const PersonalizationQuiz: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<PersonalizationData>({
        learningGoals: [],
        learningStyle: '',
        studyTime: '',
        targetExam: 'Semester Exams',
        minorDegree: 'None',
        backlogs: 0,
        branch: '',
        year: '',
        state: '',
        city: '',
        college: '',
    });

    const goals = [
        { id: 'placements', label: t('personalization.goal.placements'), desc: t('personalization.goal.placementsDesc') },
        { id: 'research', label: t('personalization.goal.research'), desc: t('personalization.goal.researchDesc') },
        { id: 'skills', label: t('personalization.goal.skills'), desc: t('personalization.goal.skillsDesc') },
        { id: 'exams', label: t('personalization.goal.exams'), desc: t('personalization.goal.examsDesc') },
    ];

    const styles = [
        { id: 'visual', label: t('personalization.style.visual'), desc: t('personalization.style.visualDesc') },
        { id: 'text', label: t('personalization.style.reading'), desc: t('personalization.style.readingDesc') },
        { id: 'interactive', label: t('personalization.style.handsOn'), desc: t('personalization.style.handsOnDesc') },
    ];

    const states = useMemo(() => getStates(), []);
    const cities = useMemo(() => getCities(formData.state), [formData.state]);
    const colleges = useMemo(() => getColleges(formData.state, formData.city), [formData.state, formData.city]);

    const isStepValid = () => {
        if (step === 0) return !!formData.state && !!formData.city && !!formData.college && !!formData.branch && !!formData.year;
        if (step === 1) return formData.learningGoals.length > 0;
        if (step === 2) return !!formData.learningStyle;
        return true;
    };

    const handleNext = () => {
        if (step < 3) {
            setStep((prev) => prev + 1);
            return;
        }
        navigate('/signup', { state: { personalizationData: formData } });
    };

    const handleBack = () => {
        if (step > 0) {
            setStep((prev) => prev - 1);
            return;
        }
        navigate('/signup');
    };

    const handleSkip = () => navigate('/signup');

    const updateField = (field: keyof PersonalizationData, value: string | number | string[]) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value } as PersonalizationData;
            if (field === 'state') {
                next.city = '';
                next.college = '';
            }
            if (field === 'city') {
                next.college = '';
            }
            return next;
        });
    };

    const toggleGoal = (goal: string) => {
        setFormData((prev) => {
            const exists = prev.learningGoals.includes(goal);
            const learningGoals = exists
                ? prev.learningGoals.filter((g) => g !== goal)
                : [...prev.learningGoals, goal];
            return { ...prev, learningGoals };
        });
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors">
                        {t('personalization.back')}
                    </button>
                    <button onClick={handleSkip} className="text-slate-400 hover:text-white transition-colors text-sm">
                        {t('personalization.skip')}
                    </button>
                </div>

                <div className="w-full bg-slate-700/50 h-2 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / 4) * 100}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {step === 0 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{t('personalization.aboutYouTitle')}</h2>
                                    <p className="text-slate-400 text-lg mt-2">{t('personalization.aboutYouSubtitle')}</p>
                                </div>

                                <div className="grid gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('personalization.state')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.state}
                                            onChange={(e) => updateField('state', e.target.value)}
                                        >
                                            <option value="">{t('personalization.selectState')}</option>
                                            {states.map((state) => <option key={state} value={state}>{state}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('personalization.city')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            disabled={!formData.state}
                                        >
                                            <option value="">{t('personalization.selectCity')}</option>
                                            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('personalization.college')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.college}
                                            onChange={(e) => updateField('college', e.target.value)}
                                            disabled={!formData.city}
                                        >
                                            <option value="">{t('personalization.selectCollege')}</option>
                                            {colleges.map((college) => <option key={college} value={college}>{college}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('personalization.branch')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.branch}
                                            onChange={(e) => updateField('branch', e.target.value)}
                                        >
                                            <option value="">{t('personalization.selectBranch')}</option>
                                            <option value="CSE">CSE</option>
                                            <option value="IT">IT</option>
                                            <option value="ECE">ECE</option>
                                            <option value="Mechanical">Mechanical</option>
                                            <option value="Civil">Civil</option>
                                            <option value="Electrical">Electrical</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-1">{t('personalization.currentYear')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.year}
                                            onChange={(e) => updateField('year', e.target.value)}
                                        >
                                            <option value="">{t('personalization.selectYear')}</option>
                                            <option value={t('resources.year1')}>{t('resources.year1')}</option>
                                            <option value={t('resources.year2')}>{t('resources.year2')}</option>
                                            <option value={t('resources.year3')}>{t('resources.year3')}</option>
                                            <option value={t('resources.year4')}>{t('resources.year4')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{t('personalization.goalsTitle')}</h2>
                                    <p className="text-slate-400 text-lg mt-2">{t('personalization.goalsSubtitle')}</p>
                                </div>
                                <p className="text-sm text-violet-400 font-medium text-right">{formData.learningGoals.length} {t('personalization.selected')}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {goals.map((goal) => (
                                        <button
                                            key={goal.id}
                                            onClick={() => toggleGoal(goal.id)}
                                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${formData.learningGoals.includes(goal.id)
                                                ? 'border-violet-500 bg-violet-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <h3 className="text-white font-bold mb-1">{goal.label}</h3>
                                            <p className="text-slate-400 text-sm">{goal.desc}</p>
                                            {formData.learningGoals.includes(goal.id) && (
                                                <div className="absolute top-4 right-4 text-violet-500">
                                                    <CheckCircle2 size={20} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{t('personalization.styleTitle')}</h2>
                                    <p className="text-slate-400 text-lg mt-2">{t('personalization.styleSubtitle')}</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {styles.map((style) => (
                                        <button
                                            key={style.id}
                                            onClick={() => updateField('learningStyle', style.id)}
                                            className={`p-6 rounded-xl border-2 flex flex-col items-center text-center transition-all ${formData.learningStyle === style.id
                                                ? 'border-pink-500 bg-pink-500/10'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <h3 className="text-white font-bold mb-2">{style.label}</h3>
                                            <p className="text-slate-400 text-sm">{style.desc}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white">{t('personalization.contextTitle')}</h2>
                                    <p className="text-slate-400 text-lg mt-2">{t('personalization.contextSubtitle')}</p>
                                </div>

                                <div className="grid gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('personalization.primaryTarget')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.targetExam}
                                            onChange={(e) => updateField('targetExam', e.target.value)}
                                        >
                                            <option value="Semester Exams">Semester Exams</option>
                                            <option value="GATE">GATE</option>
                                            <option value="Placements">Placements</option>
                                            <option value="GRE/CAT">GRE/CAT</option>
                                            <option value="None">None</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('personalization.minorDegree')}</label>
                                        <select
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.minorDegree}
                                            onChange={(e) => updateField('minorDegree', e.target.value)}
                                        >
                                            <option value="None">None</option>
                                            <option value="AI/ML">AI/ML</option>
                                            <option value="Data Science">Data Science</option>
                                            <option value="Cyber Security">Cyber Security</option>
                                            <option value="Blockchain">Blockchain</option>
                                            <option value="IoT">IoT</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-300 mb-2">{t('personalization.backlogs')}</label>
                                        <input
                                            type="number"
                                            min={0}
                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                            value={formData.backlogs}
                                            onChange={(e) => updateField('backlogs', parseInt(e.target.value, 10) || 0)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 flex justify-end">
                    <button
                        onClick={handleNext}
                        disabled={!isStepValid()}
                        className={`group flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${isStepValid()
                            ? 'bg-white text-slate-900 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                            }`}
                    >
                        {step === 3 ? t('personalization.finishAndSignup') : t('personalization.nextStep')}
                        <ArrowRight className={`w-5 h-5 transition-transform ${isStepValid() ? 'group-hover:translate-x-1' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalizationQuiz;
