import React, { useState, useEffect } from 'react';
import { PageHeader, Button, Input, Select, Textarea } from '../components/ui';
import { Calendar, Target, Clock, Sparkles, ArrowLeft, Download, CheckCircle, List, ArrowRight } from 'lucide-react';
import { generateStudyPlan, parseStudyPlanPayload } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { getCourses } from '../services/courseService';
import { saveStudyPlan, updateTaskCompletion, getStudyPlan } from '../services/studyPlanService';
import { useToast } from '../contexts/ToastContext';
import { type Course } from '../types';

interface StudyPlanData {
    title: string;
    overview: string;
    schedule: {
        day: number;
        focus: string;
        tasks: { id?: string; task: string; duration: string; technique: string; completed?: boolean }[];
        resources: string[];
    }[];
    tips: string[];
}

const inferTechniqueFromType = (type: string): string => {
    const normalized = String(type || '').toLowerCase();
    if (normalized === 'quiz') return 'Active Recall';
    if (normalized === 'study-room') return 'Collaborative Learning';
    if (normalized === 'review') return 'Spaced Repetition';
    return 'Focused Practice';
};

const normalizeStudyPlanForDisplay = (raw: any, goal: string, durationDays: number): StudyPlanData => {
    const rawDays = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.schedule)
            ? raw.schedule
            : Array.isArray(raw?.days)
                ? raw.days
                : [];

    const schedule = rawDays.map((entry: any, index: number) => {
        const tasksRaw = Array.isArray(entry?.tasks) ? entry.tasks : [];
        const tasks = tasksRaw.map((task: any, taskIndex: number) => ({
            id: task?._id || task?.id || taskIndex.toString(),
            task: String(task?.task || task?.title || `Task ${taskIndex + 1}`),
            duration: String(task?.duration || '45 min'),
            technique: String(task?.technique || inferTechniqueFromType(task?.type)),
            completed: task?.completed || false
        }));

        const resources = Array.isArray(entry?.resources)
            ? entry.resources.map((item: any) => String(item)).filter(Boolean)
            : [];

        return {
            day: Number(entry?.day) || index + 1,
            focus: String(entry?.focus || entry?.title || `Day ${index + 1} Focus`),
            tasks,
            resources,
        };
    });

    return {
        title: String(raw?.title || `Study Plan: ${goal}`),
        overview: String(raw?.overview || `A ${durationDays}-day roadmap to help you achieve: ${goal}`),
        schedule,
        tips: Array.isArray(raw?.tips)
            ? raw.tips.map((tip: any) => String(tip)).filter(Boolean)
            : [
                'Stick to the plan consistently and track progress daily.',
                'Use active recall and short self-tests after every session.',
                'Revise weak areas at the end of each day.',
            ],
    };
};

const StudyPlan: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { showToast } = useToast();
    const [goal, setGoal] = useState('');
    const [timeframe, setTimeframe] = useState('');
    const [currentLevel, setCurrentLevel] = useState('Beginner');
    const [subjects, setSubjects] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [plan, setPlan] = useState<StudyPlanData | null>(null);

    useEffect(() => {
        const fetchCoursesAndPlan = async () => {
            try {
                const data = await getCourses();
                setCourses(data);
                if (data.length > 0) {
                    const firstCourseId = data[0].id;
                    setSelectedCourseId(firstCourseId);
                    
                    // NEW: Try to fetch existing plan for this course
                    const existingPlan = await getStudyPlan(firstCourseId);
                    if (existingPlan) {
                        const days = existingPlan.durationDays || 7;
                        setPlan(normalizeStudyPlanForDisplay(existingPlan, existingPlan.goal, days));
                        setTimeframe(`${days} days`);
                        setGoal(existingPlan.goal);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch courses/plan", err);
            }
        };
        fetchCoursesAndPlan();
    }, []);

    // NEW: Handle course change to fetch specific plan
    useEffect(() => {
        if (!selectedCourseId) return;
        
        const fetchExisting = async () => {
            setLoading(true);
            try {
                const existingPlan = await getStudyPlan(selectedCourseId);
                if (existingPlan) {
                    const days = existingPlan.durationDays || 7;
                    setPlan(normalizeStudyPlanForDisplay(existingPlan, existingPlan.goal, days));
                    setTimeframe(`${days} days`);
                    setGoal(existingPlan.goal);
                } else {
                    setPlan(null);
                }
            } catch (err) {
                console.error("Plan check failed", err);
            } finally {
                setLoading(false);
            }
        };
        fetchExisting();
    }, [selectedCourseId]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("[StudyPlan] Starting generation for course:", selectedCourseId);
        if (!goal || !timeframe || !subjects || !selectedCourseId) {
            showToast('Please fill all fields and select a course', 'error');
            return;
        }
        setLoading(true);
        try {
            let days = parseInt(timeframe) || 7;
            if (timeframe.toLowerCase().includes('week')) days *= 7;
            if (timeframe.toLowerCase().includes('month')) days *= 30;

            const context = `Level: ${currentLevel}. Subjects: ${subjects}. Timeframe: ${timeframe}`;
            const response = await generateStudyPlan({ goal, durationDays: days, notesContext: context, language });
            const resultJson = response.planJson;
            const parsedPlan = parseStudyPlanPayload(resultJson);
            setPlan(normalizeStudyPlanForDisplay(parsedPlan, goal, days));
            showToast('Plan generated! Review and save it below.', 'success');
        } catch (error) {
            console.error("Error generating plan:", error);
            showToast('Failed to generate plan. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan || !selectedCourseId) return;
        setSaving(true);
        try {
            const daysCount = parseInt(timeframe) || 7;
            const payload = {
                courseId: selectedCourseId,
                goal: goal,
                durationDays: daysCount,
                startDate: new Date(),
                days: plan.schedule.map(d => ({
                    day: d.day,
                    focus: d.focus,
                    tasks: d.tasks.map(t => ({
                        title: t.task,
                        description: '',
                        type: 'note',
                        completed: t.completed || false
                    }))
                }))
            };
            await saveStudyPlan(payload as any);
            showToast('Plan saved successfully! Redirecting...', 'success');
            setTimeout(() => navigate('/'), 1500);
        } catch (error) {
            console.error("Error saving plan:", error);
            showToast('Failed to save plan.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleTask = async (dayIndex: number, taskIndex: number) => {
        if (!plan || !selectedCourseId) return;
        
        const currentTask = plan.schedule[dayIndex].tasks[taskIndex];
        const newCompleted = !currentTask.completed;

        // Optimistic UI update
        const newPlan = { ...plan };
        newPlan.schedule[dayIndex].tasks[taskIndex].completed = newCompleted;
        setPlan(newPlan);

        try {
            // Task ID is usually defined in the normalized tasks 
            // but the normalization in this file doesn't seem to include it.
            // Let's assume the backend can find it by dayIndex and index if we use the service.
            // Looking at the service: updateTaskCompletion(courseId, dayIndex, taskId, completed)
            // If we don't have taskId, we can try to pass the index or something. 
            // Let's refine the normalization first if needed.
            
            const taskId = currentTask.id || taskIndex.toString();
            await updateTaskCompletion(selectedCourseId, dayIndex, taskId, newCompleted);
        } catch (error) {
            console.error("Failed to toggle task on server", error);
            showToast("Progress not saved. Check connection.", 'error');
            // Revert on failure
            const revertedPlan = { ...plan };
            revertedPlan.schedule[dayIndex].tasks[taskIndex].completed = !newCompleted;
            setPlan(revertedPlan);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2 text-slate-400">
                    <ArrowLeft size={20} />
                </Button>
                <PageHeader
                    title="AI Study Planner"
                    subtitle="Transform your goals into a structured daily roadmap."
                />
            </div>

            {!plan ? (
                <div className="bg-slate-800 rounded-3xl p-8 ring-1 ring-slate-700 shadow-xl max-w-2xl mx-auto">
                    <div className="bg-violet-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Calendar className="text-violet-400 w-8 h-8" />
                    </div>
                    <form onSubmit={handleGenerate} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Main Goal</label>
                                <Input
                                    id="study-plan-goal"
                                    name="goal"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                    placeholder="e.g. Ace my Data Structures exam"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Subject Course</label>
                                    <Select
                                        id="study-plan-course"
                                        name="course"
                                        value={selectedCourseId}
                                        onChange={(e) => setSelectedCourseId(e.target.value)}
                                    >
                                        <option value="">Select a course</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Timeframe</label>
                                    <Input
                                        id="study-plan-timeframe"
                                        name="timeframe"
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        placeholder="e.g. 2 weeks"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Current Level</label>
                                <Select
                                    id="study-plan-level"
                                    name="currentLevel"
                                    value={currentLevel}
                                    onChange={(e) => setCurrentLevel(e.target.value)}
                                >
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Subjects/Topics (comma separated)</label>
                                <Textarea
                                    id="study-plan-subjects"
                                    name="subjects"
                                    value={subjects}
                                    onChange={(e) => setSubjects(e.target.value)}
                                    placeholder="e.g. Linked Lists, Trees, Graphs, Sorting Algorithms"
                                />
                            </div>
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-violet-600 hover:bg-violet-500 h-12 text-lg font-bold flex gap-2"
                            isLoading={loading}
                        >
                            <Sparkles size={20} /> Generate Plan
                        </Button>
                    </form>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 ring-1 ring-slate-700 shadow-2xl">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-3xl font-black text-white mb-2">{plan.title}</h3>
                                <p className="text-slate-400 max-w-2xl">{plan.overview}</p>
                            </div>
                            <Button variant="outline" onClick={() => setPlan(null)} className="text-slate-400 font-bold px-6 py-2 border-slate-700">
                                New Plan
                            </Button>
                        </div>

                        <div className="grid gap-6">
                            {plan.schedule.map((day, dayIdx) => (
                                <div key={day.day} className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-violet-500/50 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-violet-600/20 text-violet-400 font-bold px-3 py-1 rounded-full text-sm">
                                            Day {day.day}
                                        </div>
                                        <h4 className="text-xl font-bold text-white">{day.focus}</h4>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <Target size={12} /> Tasks
                                            </p>
                                            {day.tasks.map((task, tidx) => (
                                                <div 
                                                    key={tidx} 
                                                    className="bg-slate-700/30 p-3 rounded-xl flex justify-between items-center text-sm group/task cursor-pointer hover:bg-slate-700/50 transition-colors"
                                                    onClick={() => toggleTask(dayIdx, tidx)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded border ${task.completed ? 'bg-violet-600 border-violet-600' : 'border-slate-500'} flex items-center justify-center transition-colors`}>
                                                            {task.completed && <CheckCircle size={14} className="text-white" />}
                                                        </div>
                                                        <span className={`transition-all ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{task.task}</span>
                                                    </div>
                                                    <span className="text-xs text-slate-400 font-medium bg-slate-700 px-2 py-1 rounded-md">
                                                        {task.duration} • {task.technique}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <List size={12} /> Suggested Resources
                                            </p>
                                            <ul className="space-y-2">
                                                {day.resources.length > 0 ? (
                                                    day.resources.map((res, ridx) => (
                                                        <li key={ridx} className="text-slate-400 text-sm flex gap-2 items-start">
                                                            <span className="text-violet-500 mt-1">•</span>
                                                            {res}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-slate-600 text-xs italic">AI generating resources...</li>
                                                )}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex gap-4">
                            <Button
                                onClick={handleSavePlan}
                                className="flex-1 bg-violet-600 hover:bg-violet-500 h-14 text-lg font-bold shadow-xl shadow-violet-900/20"
                                isLoading={saving}
                            >
                                <CheckCircle className="mr-2" /> Save & Start Plan
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setPlan(null)}
                                className="px-8 border-slate-700 text-slate-400 hover:bg-slate-800"
                            >
                                Discard
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyPlan;
