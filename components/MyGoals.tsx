import React, { useState, useEffect } from 'react';
import { type Goal, getGoals, addGoal, deleteGoal, updateGoal } from '../services/goalService';
import { useAuth } from '../contexts/AuthContext';
import { Input, Button } from './ui';
import { PlusCircle, Trash2, CheckCircle, Circle } from 'lucide-react';

const MyGoals: React.FC = () => {
    const { currentUser } = useAuth();
    const [goals, setGoals] = useState<Goal[]>([]);
    const [newGoalTitle, setNewGoalTitle] = useState('');

    useEffect(() => {
        if (currentUser) {
            getGoals(currentUser.uid).then(setGoals);
        }
    }, [currentUser]);

    const handleAddGoal = async () => {
        if (currentUser && newGoalTitle.trim()) {
            const newGoal = await addGoal({
                userId: currentUser.uid,
                title: newGoalTitle,
                status: 'In Progress',
            });
            if (newGoal) {
                setGoals([...goals, newGoal]);
            }
            setNewGoalTitle('');
        }
    };
    
    const handleDeleteGoal = async (id: string) => {
        await deleteGoal(id);
        setGoals(goals.filter(g => g.id !== id));
    };
    
    const handleToggleStatus = async (id: string, status: Goal['status']) => {
        const newStatus = status === 'In Progress' ? 'Completed' : 'In Progress';
        await updateGoal(id, { status: newStatus });
        setGoals(goals.map(g => g.id === id ? { ...g, status: newStatus } : g));
    };

    return (
        <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
            <h3 className="text-xl font-bold text-slate-100 flex items-center mb-4">My Goals</h3>
            <div className="space-y-2">
                {goals.map(goal => (
                    <div key={goal.id} className="group flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                        <div className="flex items-center">
                            <button onClick={() => handleToggleStatus(goal.id, goal.status)} className="mr-3">
                                {goal.status === 'Completed' ? <CheckCircle className="text-green-500" /> : <Circle className="text-slate-500" />}
                            </button>
                            <span className={`font-medium ${goal.status === 'Completed' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{goal.title}</span>
                        </div>
                        <button onClick={() => handleDeleteGoal(goal.id)} className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex gap-2">
                <Input 
                    value={newGoalTitle}
                    onChange={(e) => setNewGoalTitle(e.target.value)}
                    placeholder="Set a new goal..."
                    className="text-sm"
                />
                <Button onClick={handleAddGoal} className="px-3 py-2 text-sm"><PlusCircle size={16} /></Button>
            </div>
        </div>
    );
};

export default MyGoals;