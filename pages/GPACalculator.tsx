import React, { useState } from 'react';
import { PageHeader, Button, Input } from '../components/ui';
import { Calculator, Plus, Trash2 } from 'lucide-react';

interface Subject {
    id: number;
    name: string;
    credits: string;
    grade: string;
}

const gradePoints: { [key: string]: number } = {
    'O': 10, 'A+': 9, 'A': 8, 'B+': 7, 'B': 6, 'C': 5, 'P': 4, 'F': 0
};

const GPACalculator: React.FC = () => {
    const [subjects, setSubjects] = useState<Subject[]>([
        { id: 1, name: '', credits: '', grade: '' }
    ]);
    const [gpa, setGpa] = useState<number | null>(null);

    const addSubject = () => {
        setSubjects([...subjects, { id: Date.now(), name: '', credits: '', grade: '' }]);
    };

    const removeSubject = (id: number) => {
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const updateSubject = (id: number, field: keyof Subject, value: string) => {
        setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const calculateGPA = () => {
        let totalCredits = 0;
        let totalPoints = 0;
        let isValid = true;

        subjects.forEach(sub => {
            const credits = parseFloat(sub.credits);
            const points = gradePoints[sub.grade.toUpperCase()];

            if (isNaN(credits) || points === undefined) {
                isValid = false;
            } else {
                totalCredits += credits;
                totalPoints += (credits * points);
            }
        });

        if (isValid && totalCredits > 0) {
            setGpa(parseFloat((totalPoints / totalCredits).toFixed(2)));
        } else {
            alert("Please enter valid credits and grades (O, A+, A, B+, B, C, P, F)");
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <PageHeader title="GPA Calculator" subtitle="Calculate your SGPA easily" />

            <div className="bg-slate-800/50 rounded-xl p-6 ring-1 ring-slate-700">
                <div className="space-y-4">
                    {subjects.map((subject, index) => (
                        <div key={subject.id} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm text-slate-400 mb-1">Subject {index + 1}</label>
                                <Input
                                    value={subject.name}
                                    onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                    placeholder="Subject Name"
                                />
                            </div>
                            <div className="w-24">
                                <label className="block text-sm text-slate-400 mb-1">Credits</label>
                                <Input
                                    type="number"
                                    value={subject.credits}
                                    onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                                    placeholder="3"
                                />
                            </div>
                            <div className="w-32">
                                <label className="block text-sm text-slate-400 mb-1">Grade</label>
                                <Input
                                    value={subject.grade}
                                    onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                                    placeholder="e.g. A+"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                className="mb-1 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                onClick={() => removeSubject(subject.id)}
                            >
                                <Trash2 size={20} />
                            </Button>
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex gap-4">
                    <Button onClick={addSubject} variant="secondary">
                        <Plus size={16} className="mr-2" /> Add Subject
                    </Button>
                    <Button onClick={calculateGPA} className="bg-violet-600 hover:bg-violet-700">
                        <Calculator size={16} className="mr-2" /> Calculate GPA
                    </Button>
                </div>

                {gpa !== null && (
                    <div className="mt-8 p-6 bg-slate-900/50 rounded-xl text-center border border-violet-500/30">
                        <p className="text-slate-400 mb-2">Your Calculated GPA</p>
                        <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                            {gpa}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GPACalculator;
