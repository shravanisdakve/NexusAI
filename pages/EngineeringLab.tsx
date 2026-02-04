import React, { useState } from 'react';
import { PageHeader, Button, Card, Input } from '@/components/ui';
import {
    Database,
    Cpu,
    Zap,
    Layers,
    ArrowRightLeft,
    Code2,
    Binary,
    Activity,
    Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EngineeringLab: React.FC = () => {
    const [activeBranch, setActiveBranch] = useState<'Computer/IT' | 'Mechanical' | 'Civil/EXTC'>('Computer/IT');

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <PageHeader
                title="Branch Specialization Lab"
                subtitle="High-fidelity simulators and design tools for core engineering disciplines."
                icon={<Layers className="w-8 h-8 text-emerald-400" />}
            />

            {/* Branch Selector */}
            <div className="flex gap-4 p-1.5 bg-slate-800/50 rounded-2xl w-fit border border-white/5">
                {(['Computer/IT', 'Mechanical', 'Civil/EXTC'] as const).map(branch => (
                    <button
                        key={branch}
                        onClick={() => setActiveBranch(branch)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeBranch === branch
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {branch}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-8">
                <AnimatePresence mode="wait">
                    {activeBranch === 'Computer/IT' && (
                        <motion.div
                            key="cs"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* ER to Relational Mapper */}
                            <Card className="p-8 space-y-6 bg-gradient-to-br from-slate-800 to-indigo-950/30 border-indigo-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                        <Database className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">ER-to-Relational Mapper</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">DBMS Course (2343113)</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-300">
                                    Input your Entities and Relationships in natural language, and our engine will generate the optimized Relational Schema (3NF) and SQL DDL commands.
                                </p>
                                <div className="p-4 bg-slate-900/80 rounded-xl border border-white/5 space-y-4">
                                    <textarea
                                        className="w-full bg-transparent border-none outline-none text-sm font-mono text-indigo-300 placeholder:text-slate-600 resize-none h-24"
                                        placeholder="e.g. Student (ID, Name) - enrolls in - Course (Code, Title)"
                                    ></textarea>
                                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500">Generate Schema</Button>
                                </div>
                            </Card>

                            {/* Algorithm Visualizer */}
                            <Card className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                        <Activity className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Algorithm Visualizer</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">Analysis of Algorithms</p>
                                    </div>
                                </div>
                                <div className="aspect-video bg-slate-900 rounded-2xl flex items-center justify-center border border-slate-700 relative overflow-hidden">
                                    <div className="flex items-end gap-1 h-32 px-12">
                                        {[40, 70, 20, 90, 50, 80, 30].map((h, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ height: 0 }}
                                                animate={{ height: `${h}%` }}
                                                className="w-4 bg-emerald-500/40 rounded-t-sm border-t-2 border-emerald-400"
                                            />
                                        ))}
                                    </div>
                                    <div className="absolute top-4 right-4 animate-pulse px-2 py-1 rounded bg-emerald-500/20 text-[10px] text-emerald-400 font-bold border border-emerald-500/30">
                                        QUICK_SORT_ACTIVE
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" className="flex-1">Step Backward</Button>
                                    <Button className="flex-1">Play Partitioning</Button>
                                </div>
                            </Card>
                        </motion.div>
                    )}

                    {activeBranch === 'Mechanical' && (
                        <motion.div
                            key="mech"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* P-V Diagram Designer */}
                            <Card className="p-8 space-y-6 bg-gradient-to-br from-slate-800 to-rose-950/30 border-rose-500/20">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                        <Zap className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Thermodynamics Lab</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">Rankine & Otto Cycles</p>
                                    </div>
                                </div>
                                <div className="aspect-square max-w-[300px] mx-auto bg-slate-900 rounded-full border-4 border-slate-700 relative flex items-center justify-center overflow-hidden">
                                    <div className="absolute inset-0 opacity-10 bg-[conic-gradient(from_0deg,transparent,rgba(244,63,94,0.5),transparent)] animate-[spin_10s_linear_infinite]"></div>
                                    <div className="text-center">
                                        <span className="text-4xl font-black text-rose-500">85%</span>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thermal Efficiency</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-500 block mb-1">Inlet Temp</span>
                                        <span className="text-lg font-bold text-white">450°C</span>
                                    </div>
                                    <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                        <span className="text-[10px] text-slate-500 block mb-1">Pressure</span>
                                        <span className="text-lg font-bold text-white">12 Bar</span>
                                    </div>
                                </div>
                                <Button className="w-full bg-rose-600 hover:bg-rose-500">Calculate Work Output</Button>
                            </Card>

                            {/* Beam Solver */}
                            <Card className="p-8 space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                                        <Box className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">SFD & BMD Solver</h3>
                                        <p className="text-xs text-slate-400 uppercase tracking-widest">Strength of Materials</p>
                                    </div>
                                </div>
                                <div className="h-40 bg-slate-900 rounded-xl border border-slate-700 flex flex-col justify-center p-8">
                                    {/* Beam Visualization */}
                                    <div className="h-1 bg-slate-500 w-full relative">
                                        <div className="absolute -top-12 left-1/4 flex flex-col items-center">
                                            <div className="w-0.5 h-12 bg-rose-400"></div>
                                            <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                                            <span className="text-[10px] text-rose-400 font-bold mt-1">20 kN</span>
                                        </div>
                                        <div className="absolute -bottom-1 left-0 w-4 h-4 bg-slate-400 clip-triangle"></div>
                                        <div className="absolute -bottom-1 right-0 w-4 h-4 bg-slate-400 clip-triangle"></div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 italic">
                                    Generating Mohr's Circle and Beam Deflection models for Semester III curriculum.
                                </p>
                                <Button variant="outline" className="w-full">Download BMD Export (DXF)</Button>
                            </Card>
                        </motion.div>
                    )}

                    {activeBranch === 'Civil/EXTC' && (
                        <motion.div
                            key="civil"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-slate-800/40 rounded-3xl p-12 border-2 border-dashed border-slate-700 flex flex-col items-center text-center gap-6"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-slate-800 flex items-center justify-center">
                                <Cpu className="w-10 h-10 text-slate-600" />
                            </div>
                            <div className="max-w-md">
                                <h3 className="text-2xl font-bold text-slate-300">Advanced Lab Coming Soon</h3>
                                <p className="text-slate-500 mt-4 leading-relaxed">
                                    We are currently training our AI models on Bode Plot generation and Network Theorem solvers for EXTC, alongside Surveying models for Civil Engineering.
                                </p>
                            </div>
                            <Button variant="ghost" className="text-blue-400">Notify me on rollout</Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default EngineeringLab;
