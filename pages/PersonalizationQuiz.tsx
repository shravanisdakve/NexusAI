import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, BookOpen, Clock, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getStates, getCities, getColleges } from '../data/colleges';

const PersonalizationQuiz: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        learningGoals: [] as string[],
        learningStyle: '',
        studyTime: '',
        targetExam: '',
        minorDegree: '',
        backlogs: 0,
        branch: '',
        year: '',
        state: '',
        city: '',
        college: ''
    });
    const questions = [
        {
            id: 'branch-year',
            title: "Let's get to know you",
            subtitle: "Help us tailor your academic journey",
            type: 'input-group',
            fields: [
                {
                    name: 'state',
                    label: 'State',
                    type: 'select',
                    options: 'dynamic' // dynamic marker to use logic below
                },
                {
                    name: 'city',
                    label: 'City',
                    type: 'select',
                    options: 'dynamic'
                },
                {
                    name: 'college',
                    label: 'College Name',
                    type: 'searchable-select', // New type for searchable dropdown
                    options: 'dynamic',
                    placeholder: 'Select your college'
                },
                {
                    name: 'branch',
                    label: 'Branch',
                    type: 'select',
                    options: ['CSE', 'IT', 'ECE', 'Mechanical', 'Civil', 'Electrical', 'Other']
                },
                {
                    name: 'year',
                    label: 'Current Year',
                    type: 'select',
                    options: ['1st Year', '2nd Year', '3rd Year', '4th Year']
                }
            ]
        },
        {
            id: 'goals',
            title: "What drives you?",
            subtitle: "Select all that apply",
            icon: <Target className="w-8 h-8 text-violet-400" />,
            type: 'multi-select',
            options: [
                { id: 'placements', label: 'Top Placements', icon: '💼', desc: 'Aiming for FAANG & Tier-1 companies' },
                { id: 'research', label: 'Research & GATE', icon: '🔬', desc: 'Pursuing higher studies or R&D' },
                { id: 'skills', label: 'Skill Mastery', icon: '⚡', desc: 'Building practical engineering skills' },
                { id: 'exams', label: 'Ace Exams', icon: '📚', desc: 'Topping university semester exams' }
            ]
        },
        {
            id: 'style',
            title: "How do you learn best?",
            subtitle: "We'll adapt content to your style",
            icon: <Brain className="w-8 h-8 text-pink-400" />,
            type: 'single-select',
            key: 'learningStyle',
            options: [
                { id: 'visual', label: 'Visual', icon: '🎥', desc: 'Video tutorials & diagrams' },
                { id: 'text', label: 'Reading', icon: '📖', desc: 'In-depth documentation & books' },
                { id: 'interactive', label: 'Hands-on', icon: '🛠️', desc: 'Projects & code labs' }
            ]
        },
        {
            id: 'context',
            title: "Academic Context",
            subtitle: "Mumbai University specifics",
            icon: <Award className="w-8 h-8 text-amber-400" />,
            type: 'mixed',
            fields: [
                {
                    name: 'targetExam',
                    label: 'Primary Target',
                    type: 'select',
                    options: ['Semester Exams', 'GATE', 'Placements', 'GRE/CAT', 'None']
                },
                {
                    name: 'minorDegree',
                    label: 'Minor/Honors Degree (Optional)',
                    type: 'select',
                    options: ['None', 'AI/ML', 'Data Science', 'Cyber Security', 'Blockchain', 'IoT']
                },
                {
                    name: 'backlogs',
                    label: 'Active Backlogs (KTs)',
                    type: 'number',
                    placeholder: '0'
                }
            ]
        }
    ];

    const handleNext = () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
        } else {
            // Navigate to signup with data
            navigate('/signup', { state: { personalizationData: formData } });
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        } else {
            navigate('/signup'); // Go back to signup if on first step
        }
    };

    const handleSkip = () => {
        navigate('/signup');
    };

    const isStepValid = () => {
        const currentQ = questions[step];
        if (currentQ.id === 'branch-year') {
            return formData.college && formData.branch && formData.year;
        }
        if (currentQ.id === 'goals') {
            return formData.learningGoals.length > 0;
        }
        if (currentQ.id === 'style') {
            return !!formData.learningStyle;
        }
        return true; // Context step is optional or has defaults
    };

    const updateField = (field: string, value: any) => {
        setFormData(prev => {
            // Reset dependent fields
            const newData = { ...prev, [field]: value };
            if (field === 'state') {
                newData.city = '';
                newData.college = '';
            } else if (field === 'city') {
                newData.college = '';
            }
            return newData;
        });
    };

    const toggleGoal = (goal: string) => {
        setFormData(prev => {
            const goals = prev.learningGoals.includes(goal)
                ? prev.learningGoals.filter(g => g !== goal)
                : [...prev.learningGoals, goal];
            return { ...prev, learningGoals: goals };
        });
    };

    const currentQ = questions[step];

    // Get dropdown options dynamically
    let stateOptions: string[] = [];
    let cityOptions: string[] = [];
    let collegeOptions: string[] = [];

    if (currentQ?.fields) {
        // Only load these if we are on the relevant step
        stateOptions = getStates();
        cityOptions = getCities(formData.state);
        collegeOptions = getColleges(formData.state, formData.city);
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative z-10">

                {/* Header Navigation */}
                <div className="flex justify-between items-center mb-6">
                    <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors">
                        &larr; Back
                    </button>
                    <button onClick={handleSkip} className="text-slate-400 hover:text-white transition-colors text-sm">
                        Skip for now
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700/50 h-2 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-4 mb-2">
                                {currentQ.icon}
                                <h2 className="text-3xl font-bold text-white">{currentQ.title}</h2>
                            </div>
                            <p className="text-slate-400 text-lg">{currentQ.subtitle}</p>
                        </div>

                        <div className="space-y-6">
                            {currentQ.type === 'input-group' && (
                                <div className="grid gap-4">
                                    {currentQ.fields?.map((field: any) => {
                                        // Determine options based on field type/marker
                                        let opts = field.options;
                                        if (field.options === 'dynamic') {
                                            if (field.name === 'state') opts = stateOptions;
                                            else if (field.name === 'city') opts = cityOptions;
                                            else if (field.name === 'college') opts = collegeOptions;
                                        }

                                        if (field.type === 'searchable-select') {
                                            return (
                                                <div key={field.name} className="relative">
                                                    <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
                                                    <div className="relative">
                                                        <select
                                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                                                            value={formData[field.name as keyof typeof formData] as string}
                                                            onChange={(e) => updateField(field.name, e.target.value)}
                                                            disabled={!opts || opts.length === 0}
                                                        >
                                                            <option value="">{field.placeholder || `Select ${field.label}`}</option>
                                                            {opts && opts.map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }

                                        return (
                                            <div key={field.name}>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">{field.label}</label>
                                                {field.type === 'select' ? (
                                                    <div className="relative">
                                                        <select
                                                            className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
                                                            value={formData[field.name as keyof typeof formData] as string}
                                                            onChange={(e) => updateField(field.name, e.target.value)}
                                                            disabled={field.options === 'dynamic' && (!opts || opts.length === 0)}
                                                        >
                                                            <option value="">Select {field.label}</option>
                                                            {opts && Array.isArray(opts) && opts.map((opt: string) => (
                                                                <option key={opt} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-400">
                                                            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <input
                                                        type={field.type}
                                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                                        placeholder={field.placeholder}
                                                        value={formData[field.name as keyof typeof formData] as string | number}
                                                        onChange={(e) => updateField(field.name, field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}

                            {currentQ.type === 'multi-select' && (
                                <div className="space-y-4">
                                    <p className="text-sm text-violet-400 font-medium text-right">{formData.learningGoals.length} selected</p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {currentQ.options?.map((opt: any) => (
                                            <motion.button
                                                key={opt.id}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={() => toggleGoal(opt.id)}
                                                className={`p-4 rounded-xl border-2 text-left transition-all ${formData.learningGoals.includes(opt.id)
                                                    ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_15px_rgba(139,92,246,0.3)]'
                                                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="text-3xl mb-2">{opt.icon}</div>
                                                <h3 className="text-white font-bold mb-1">{opt.label}</h3>
                                                <p className="text-slate-400 text-sm">{opt.desc}</p>
                                                {formData.learningGoals.includes(opt.id) && (
                                                    <div className="absolute top-4 right-4 text-violet-500">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {currentQ.type === 'single-select' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {currentQ.options?.map((opt: any) => (
                                        <motion.button
                                            key={opt.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => updateField(currentQ.key!, opt.id)}
                                            className={`p-6 rounded-xl border-2 flex flex-col items-center text-center transition-all ${formData.learningStyle === opt.id
                                                ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_15px_rgba(236,72,153,0.3)]'
                                                : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                                                }`}
                                        >
                                            <div className="text-4xl mb-4">{opt.icon}</div>
                                            <h3 className="text-white font-bold mb-2">{opt.label}</h3>
                                            <p className="text-slate-400 text-sm">{opt.desc}</p>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {currentQ.type === 'mixed' && (
                                <div className="grid gap-6">
                                    {currentQ.fields?.map((field: any) => (
                                        <div key={field.name}>
                                            <label className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                                            {field.type === 'select' ? (
                                                <select
                                                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                                    value={formData[field.name as keyof typeof formData] as string}
                                                    onChange={(e) => updateField(field.name, e.target.value)}
                                                >
                                                    {field.options.map((opt: string) => (
                                                        <option key={opt} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type={field.type}
                                                        className="w-full bg-slate-900/50 border border-slate-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                                        value={formData[field.name as keyof typeof formData] as number}
                                                        onChange={(e) => updateField(field.name, parseInt(e.target.value) || 0)}
                                                    />
                                                    <div className="absolute right-4 top-3 text-slate-500 text-sm">Active KTs</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
                        {step === questions.length - 1 ? 'Finish & Sign Up' : 'Next Step'}
                        <ArrowRight className={`w-5 h-5 transition-transform ${isStepValid() ? 'group-hover:translate-x-1' : ''}`} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PersonalizationQuiz;
