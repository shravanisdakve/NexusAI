import React, { useState, useEffect, useReducer } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addGoal, getGoals, updateGoal, deleteGoal, Goal } from '../services/goalService';
import { Input, Button } from './ui';
import { PlusCircle, Trash2, CheckCircle, Target, Loader2, Circle } from 'lucide-react';
import { z } from 'zod';

const goalSchema = z.string().min(3, "Goal must be at least 3 characters").max(100, "Goal must be under 100 characters");

type GoalAction =
    | { type: 'SET_GOALS'; payload: Goal[] }
    | { type: 'ADD_GOAL'; payload: Goal }
    | { type: 'UPDATE_GOAL'; id: string; status: 'In Progress' | 'Completed' }
    | { type: 'DELETE_GOAL'; id: string };

function goalsReducer(state: Goal[], action: GoalAction): Goal[] {
    switch (action.type) {
        case 'SET_GOALS': return action.payload;
        case 'ADD_GOAL': return [...state, action.payload];
        case 'UPDATE_GOAL': return state.map(g => g.id === action.id ? { ...g, status: action.status } : g);
        case 'DELETE_GOAL': return state.filter(g => g.id !== action.id);
        default: return state;
    }
}

const GoalsWidget: React.FC = () => {
    const { user } = useAuth();
    const [goals, dispatch] = useReducer(goalsReducer, []);
    const [newGoalTitle, setNewGoalTitle] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            if (user?.id) {
                setIsLoading(true);
                try {
                    const fetchedGoals = await getGoals();
                    dispatch({ type: 'SET_GOALS', payload: fetchedGoals });
                } catch (err) {
                    console.error("Error fetching goals:", err);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchGoals();
    }, [user?.id]);

    const handleAddGoal = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validation = goalSchema.safeParse(newGoalTitle.trim());
        if (!validation.success) {
            setError(validation.error.issues[0].message);
            return;
        }

        if (!user?.id) return;

        setIsSubmitting(true);
        try {
            const newGoal = await addGoal({
                title: newGoalTitle.trim(),
                status: 'In Progress',
            });
            if (newGoal) {
                dispatch({ type: 'ADD_GOAL', payload: newGoal });
                setNewGoalTitle('');
                window.dispatchEvent(new CustomEvent('goalUpdated'));
            }
        } catch (err) {
            setError("Failed to add goal. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleGoalStatus = async (goal: Goal) => {
        const newStatus = goal.status === 'In Progress' ? 'Completed' : 'In Progress';
        try {
            dispatch({ type: 'UPDATE_GOAL', id: goal.id, status: newStatus });
            await updateGoal(goal.id, { status: newStatus });
            window.dispatchEvent(new CustomEvent('goalUpdated'));
        } catch (err) {
            console.error("Failed to update goal:", err);
            // Rollback
            dispatch({ type: 'UPDATE_GOAL', id: goal.id, status: goal.status });
        }
    };

    const handleDeleteGoal = async (id: string) => {
        try {
            const originalGoals = [...goals];
            dispatch({ type: 'DELETE_GOAL', id });
            await deleteGoal(id);
            window.dispatchEvent(new CustomEvent('goalUpdated'));
        } catch (err) {
            console.error("Failed to delete goal:", err);
            // In a more complex app, we'd rollback here
        }
    };

    return (
        <div className="premium-card p-8 group">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-100 flex items-center">
                    <Target className="w-6 h-6 mr-3 text-emerald-400" /> Today's Focus
                </h3>
                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded uppercase tracking-widest border border-emerald-500/20">
                    {goals.filter(g => g.status === 'Completed').length}/{goals.length} Done
                </span>
            </div>

            <form onSubmit={handleAddGoal} className="space-y-2 mb-8">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Input
                            id="new-goal-title"
                            name="newGoalTitle"
                            value={newGoalTitle}
                            onChange={(e) => {
                                setNewGoalTitle(e.target.value);
                                if (error) setError(null);
                            }}
                            placeholder="Add a new goal (e.g., Master BFS/DFS)"
                            className={`text-sm pr-10 rounded-lg border border-white/10 bg-white/5 px-3 py-2 placeholder:text-slate-500 focus:bg-white/10 ${error ? 'border-red-500/50 focus:ring-red-500' : ''}`}
                            disabled={isSubmitting}
                            autoComplete="off"
                        />
                        {isSubmitting && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                            </div>
                        )}
                    </div>
                    <Button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm shadow-none shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all active:scale-95">
                        {isSubmitting ? 'Adding...' : 'Add'}
                    </Button>
                </div>
                {error && <p className="text-[11px] font-medium text-red-400 ml-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </form>

            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-500 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
                        <p className="text-sm">Fetching your goals...</p>
                    </div>
                ) : goals.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                        <CheckCircle className="w-10 h-10 text-slate-600 mx-auto mb-3 opacity-20" />
                        <p className="text-slate-400 text-sm">{user?.displayName ? 'Ready to work, '+user.displayName.split(' ')[0]+'?' : 'No goals set for today.'}</p>
                        <p className="text-[11px] text-slate-600 mt-1 uppercase tracking-widest font-black">Plan, Execute, Conquer.</p>
                    </div>
                ) : (
                    goals.map((goal) => (
                        <div
                            key={goal.id}
                            className="group flex items-center justify-between bg-slate-800/80 p-4 rounded-xl border border-white/5 hover:border-violet-500/30 hover:bg-slate-800 transition-all duration-200"
                        >
                            <label className="flex items-center cursor-pointer group-item flex-1 min-w-0 pr-4">
                                <div className="relative flex items-center justify-center mr-4 shrink-0">
                                    <input
                                        id={`goal-${goal.id}`}
                                        name={`goal-${goal.id}`}
                                        type="checkbox"
                                        checked={goal.status === 'Completed'}
                                        onChange={() => handleToggleGoalStatus(goal)}
                                        className="peer sr-only"
                                    />
                                    <div className="w-5 h-5 border-2 border-slate-600 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all"></div>
                                    <div className="absolute opacity-0 peer-checked:opacity-100 transition-all pointer-events-none">
                                        <CheckCircle size={14} className="text-white" />
                                    </div>
                                </div>
                                <span
                                    className={`text-sm font-medium truncate transition-all ${goal.status === 'Completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}
                                >
                                    {goal.title}
                                </span>
                            </label>
                            <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete goal"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default GoalsWidget;
