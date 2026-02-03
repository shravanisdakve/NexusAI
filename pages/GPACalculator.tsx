import React, { useState } from 'react';
import { PageHeader, Button, Input } from '../components/ui';
import { Calculator, Plus, Trash2, AlertCircle, CheckCircle, Target, Zap } from 'lucide-react';

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
    const [mode, setMode] = useState<'SGPA' | 'CGPA'>('SGPA');
    const [subjects, setSubjects] = useState<Subject[]>([
        { id: 1, name: '', credits: '', grade: '' },
        { id: 2, name: '', credits: '', grade: '' },
        { id: 3, name: '', credits: '', grade: '' }
    ]);
    const [semesters, setSemesters] = useState<{ id: number, pointer: string }[]>([
        { id: 1, pointer: '' },
        { id: 2, pointer: '' }
    ]);
    const [result, setResult] = useState<{ gpa: number, percentage: string, classType: string, kts: number } | null>(null);
    const [cgpaResult, setCgpaResult] = useState<{ cgpa: number, percentage: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const addSubject = () => {
        setSubjects([...subjects, { id: Date.now(), name: '', credits: '', grade: '' }]);
    };

    const removeSubject = (id: number) => {
        if (subjects.length > 1) {
            setSubjects(subjects.filter(s => s.id !== id));
        }
    };

    const updateSubject = (id: number, field: keyof Subject, value: string) => {
        setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const calculateGPA = () => {
        let totalCredits = 0;
        let totalPoints = 0;
        let kts = 0;
        let isValid = true;
        setError(null);

        subjects.forEach(sub => {
            const credits = parseFloat(sub.credits);
            const grade = sub.grade.toUpperCase();
            const points = gradePoints[grade];

            if (isNaN(credits) || points === undefined) {
                isValid = false;
            } else {
                totalCredits += credits;
                totalPoints += (credits * points);
                if (grade === 'F') kts++;
            }
        });

        if (isValid && totalCredits > 0) {
            const gpaValue = totalPoints / totalCredits;
            // MU Formula: Percentage = (GPA - 0.75) * 10
            const percentageValue = (gpaValue - 0.75) * 10;

            let classType = "Pass Class";
            if (gpaValue >= 7.75) classType = "First Class with Distinction";
            else if (gpaValue >= 6.75) classType = "First Class";
            else if (gpaValue >= 5.75) classType = "Higher Second Class";
            else if (gpaValue >= 5.00) classType = "Second Class";

            setResult({
                gpa: parseFloat(gpaValue.toFixed(2)),
                percentage: percentageValue > 0 ? percentageValue.toFixed(2) : "0.00",
                classType,
                kts
            });
        } else {
            setError("Ensure all credits are numbers and grades are valid (O, A+, A, B+, B, C, P, F).");
            setResult(null);
        }
    };

    const calculateCGPA = () => {
        let totalPointers = 0;
        let count = 0;
        let isValid = true;
        setError(null);

        semesters.forEach(sem => {
            const p = parseFloat(sem.pointer);
            if (isNaN(p) || p < 0 || p > 10) {
                isValid = false;
            } else {
                totalPointers += p;
                count++;
            }
        });

        if (isValid && count > 0) {
            const cgpaVal = totalPointers / count;
            const percentageVal = (cgpaVal - 0.75) * 10;
            setCgpaResult({
                cgpa: parseFloat(cgpaVal.toFixed(2)),
                percentage: percentageVal > 0 ? percentageVal.toFixed(2) : "0.00"
            });
        } else {
            setError("Ensure all semester pointers are valid numbers between 0 and 10.");
            setCgpaResult(null);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <PageHeader title="GPA Calculator" subtitle="Mumbai University SGPA & Percentage Engine" />

            <div className="flex justify-center mb-8">
                <div className="bg-slate-800/50 p-1.5 rounded-2xl ring-1 ring-white/5 flex gap-2">
                    <button
                        onClick={() => { setMode('SGPA'); setResult(null); setCgpaResult(null); setError(null); }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'SGPA' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        SGPA Mode
                    </button>
                    <button
                        onClick={() => { setMode('CGPA'); setResult(null); setCgpaResult(null); setError(null); }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${mode === 'CGPA' ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/40' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                        CGPA Mode
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 rounded-3xl p-6 ring-1 ring-white/5 backdrop-blur-md shadow-xl">
                        {mode === 'SGPA' ? (
                            <div className="space-y-4">
                                {subjects.map((subject, index) => (
                                    <div key={subject.id} className="flex gap-3 items-end group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                        <div className="flex-1">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">S{index + 1}</label>
                                            <Input
                                                id={`subject-name-${subject.id}`}
                                                name={`subjectName-${subject.id}`}
                                                value={subject.name}
                                                onChange={(e) => updateSubject(subject.id, 'name', e.target.value)}
                                                placeholder="Subject (Optional)"
                                                className="h-11 bg-slate-900/50 border-white/5"
                                            />
                                        </div>
                                        <div className="w-20">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Credits</label>
                                            <Input
                                                id={`subject-credits-${subject.id}`}
                                                name={`subjectCredits-${subject.id}`}
                                                type="number"
                                                value={subject.credits}
                                                onChange={(e) => updateSubject(subject.id, 'credits', e.target.value)}
                                                placeholder="3"
                                                className="h-11 bg-slate-900/50 border-white/5 text-center"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Grade</label>
                                            <Input
                                                id={`subject-grade-${subject.id}`}
                                                name={`subjectGrade-${subject.id}`}
                                                value={subject.grade}
                                                onChange={(e) => updateSubject(subject.id, 'grade', e.target.value)}
                                                placeholder="O-F"
                                                className={`h-11 bg-slate-900/50 border-white/5 text-center font-bold ${subject.grade.toUpperCase() === 'F' ? 'text-rose-400' : 'text-violet-400'}`}
                                            />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            className="h-11 w-11 p-0 text-slate-600 hover:text-red-400 hover:bg-red-400/5 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => removeSubject(subject.id)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                ))}
                                <div className="mt-8 flex gap-3">
                                    <Button onClick={addSubject} variant="secondary" className="bg-slate-700/50 hover:bg-slate-700 h-11 border-white/5">
                                        <Plus size={18} className="mr-2" /> Add Subject
                                    </Button>
                                    <Button onClick={calculateGPA} className="flex-1 bg-violet-600 hover:bg-violet-500 h-11 shadow-lg shadow-violet-900/30">
                                        <Calculator size={18} className="mr-2" /> Calculate Results
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {semesters.map((sem, index) => (
                                        <div key={sem.id} className="group relative">
                                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Semester {index + 1}</label>
                                            <div className="flex gap-2">
                                                <Input
                                                    id={`sem-pointer-${sem.id}`}
                                                    name={`semPointer-${sem.id}`}
                                                    type="number"
                                                    step="0.01"
                                                    value={sem.pointer}
                                                    onChange={(e) => setSemesters(semesters.map(s => s.id === sem.id ? { ...s, pointer: e.target.value } : s))}
                                                    placeholder="Pointer (e.g. 9.12)"
                                                    className="h-11 bg-slate-900/50 border-white/5"
                                                />
                                                {semesters.length > 1 && (
                                                    <Button
                                                        variant="ghost"
                                                        className="h-11 w-11 p-0 text-slate-600 hover:text-red-400 hover:bg-red-400/5 opacity-0 group-hover:opacity-100 transition-all"
                                                        onClick={() => setSemesters(semesters.filter(s => s.id !== sem.id))}
                                                    >
                                                        <Trash2 size={18} />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <Button onClick={() => setSemesters([...semesters, { id: Date.now(), pointer: '' }])} variant="secondary" className="bg-slate-700/50 hover:bg-slate-700 h-11 border-white/5">
                                        <Plus size={18} className="mr-2" /> Add Semester
                                    </Button>
                                    <Button onClick={calculateCGPA} className="flex-1 bg-violet-600 hover:bg-violet-500 h-11 shadow-lg shadow-violet-900/30">
                                        <Calculator size={18} className="mr-2" /> Calculate CGPA
                                    </Button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    {mode === 'SGPA' ? (
                        result ? (
                            <div className="space-y-6 sticky top-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-slate-800/80 rounded-[2.5rem] p-8 ring-1 ring-violet-500/20 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Calculator size={80} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">SGPA Result</p>
                                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-2">
                                        {result.gpa}
                                    </div>
                                    <div className="inline-block px-3 py-1 bg-violet-500/20 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-violet-500/30">
                                        {result.classType}
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 rounded-3xl p-6 ring-1 ring-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white">Conversion</h4>
                                        <span className="text-[10px] text-slate-500 font-medium">MU Formula used</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-white">{result.percentage}%</span>
                                        <span className="text-xs text-slate-400">Approx. Percentage</span>
                                    </div>
                                </div>

                                {result.kts > 0 ? (
                                    <div className="bg-rose-500/10 rounded-3xl p-6 border border-rose-500/20">
                                        <h4 className="text-sm font-bold text-rose-400 flex items-center gap-2 mb-2">
                                            <AlertCircle size={16} /> KT Risk Detected
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            You have {result.kts} potential KTs. Switch to the **Study Room** to prioritize these modules before the final exam.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-500/10 rounded-3xl p-6 border border-emerald-500/20">
                                        <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
                                            <CheckCircle size={16} /> Clear Status
                                        </h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Zero KTs detected. Maintain this consistency to ensure a smooth transition to the next semester.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-slate-800/30 rounded-3xl p-8 ring-1 ring-white/5 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center h-64 lg:min-h-full">
                                <Calculator size={40} className="text-slate-700 mb-4" />
                                <h4 className="text-slate-400 font-bold mb-1">Waiting for SGPA Data</h4>
                                <p className="text-xs text-slate-500">Fill in your subject credits and grades to generate the SGPA report.</p>
                            </div>
                        )
                    ) : (
                        cgpaResult ? (
                            <div className="space-y-6 sticky top-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-slate-800/80 rounded-[2.5rem] p-8 ring-1 ring-violet-500/20 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Target size={80} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Final CGPA</p>
                                    <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-500 mb-2">
                                        {cgpaResult.cgpa}
                                    </div>
                                    <div className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-500/30">
                                        Overall Degree Average
                                    </div>
                                </div>

                                <div className="bg-slate-800/50 rounded-3xl p-6 ring-1 ring-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-sm font-bold text-white">Degree Percentage</h4>
                                        <span className="text-[10px] text-slate-500 font-medium">Aggregate Formula</span>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-3xl font-bold text-white">{cgpaResult.percentage}%</span>
                                        <span className="text-xs text-slate-400">Total Calculation</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-800/30 rounded-3xl p-8 ring-1 ring-white/5 border border-dashed border-slate-700 flex flex-col items-center justify-center text-center h-64 lg:min-h-full">
                                <Zap size={40} className="text-slate-700 mb-4" />
                                <h4 className="text-slate-400 font-bold mb-1">Waiting for CGPA Data</h4>
                                <p className="text-xs text-slate-500">Enter your pointers for all semesters to calculate your cumulative GPA.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default GPACalculator;
