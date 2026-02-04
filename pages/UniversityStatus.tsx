import React, { useState } from 'react';
import { PageHeader, Card, Button } from '@/components/ui';
import {
    Bell,
    Calendar,
    FileText,
    Link as LinkIcon,
    ExternalLink,
    Clock,
    Search,
    Filter,
    ArrowRight,
    Megaphone,
    GraduationCap
} from 'lucide-react';
import { motion } from 'framer-motion';

const UniversityStatus: React.FC = () => {
    const circulars = [
        {
            id: 1,
            title: "NEP 2024-25: Revised Progression Criteria for FE/SE",
            date: "Feb 02, 2026",
            category: "Academic",
            urgent: true,
            link: "https://mu.ac.in/circulars"
        },
        {
            id: 2,
            title: "Summer 2026 Examination: Form Filling Notice",
            date: "Jan 28, 2026",
            category: "Exams",
            urgent: false,
            link: "https://mu.ac.in/exams"
        },
        {
            id: 3,
            title: "Inter-University Research Convention 'Avishkar'",
            date: "Jan 25, 2026",
            category: "Events",
            urgent: false,
            link: "https://mu.ac.in/events"
        }
    ];

    const schedules = [
        { subject: "Engineering Mechanics", date: "May 12, 2026", time: "10:30 AM", status: "Confirmed" },
        { subject: "Applied Mathematics II", date: "May 15, 2026", time: "10:30 AM", status: "Tentative" },
        { subject: "Basic Electrical Engg", date: "May 19, 2026", time: "10:30 AM", status: "Tentative" }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <PageHeader
                title="MU Hub Command Center"
                subtitle="The definitive real-time dashboard for Mumbai University engineering administration."
                icon={<Bell className="w-8 h-8 text-blue-400" />}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Circular Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Megaphone className="w-5 h-5 text-rose-500" />
                            Official Circular Feed
                        </h3>
                        <Button variant="ghost" size="sm" className="text-xs text-slate-500">
                            Archive Rules
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {circulars.map((item) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ scale: 1.01 }}
                            >
                                <Card className={`p-5 relative transition-all border-l-4 ${item.urgent ? 'border-l-rose-500 bg-rose-500/5' : 'border-l-blue-500 bg-slate-800/40'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${item.urgent ? 'bg-rose-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {item.category}
                                                </span>
                                                <span className="text-[10px] font-mono text-slate-500">{item.date}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-white leading-tight pr-8">
                                                {item.title}
                                            </h4>
                                        </div>
                                        <a href={item.link} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors">
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                    <div className="mt-4 flex items-center gap-4">
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-2">
                                            <FileText className="w-3 h-3" /> AI Summary
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-2 text-slate-500">
                                            <LinkIcon className="w-3 h-3" /> Related Ordinance
                                        </Button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* SAMARTH Portal Integration Status */}
                    <Card className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center p-3 shadow-2xl">
                                <img src="https://samarth.edu.in/images/logo.png" alt="SAMARTH Logo" className="w-full grayscale brightness-0 opacity-80" />
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-xl font-bold text-white mb-2">SAMARTH Portal Bridge</h3>
                                <p className="text-sm text-slate-400 mb-4">
                                    Your student profile is synchronized with the SAMARTH HEI portal. Check exam enrollment and result declaration status automatically.
                                </p>
                                <div className="flex justify-center md:justify-start gap-4">
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        Session Active
                                    </div>
                                    <div className="text-xs text-slate-500">Last Synced: 2 hours ago</div>
                                </div>
                            </div>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 whitespace-nowrap">
                                Sync Portal Data
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Deadlines & Prediction */}
                <div className="space-y-8">
                    {/* Exam Timetable */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2 px-2">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            University Timeline
                        </h3>
                        <Card className="p-0 overflow-hidden">
                            <div className="bg-blue-600/10 p-4 border-b border-white/5 flex justify-between items-center">
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">May 2026 Series</span>
                                <Button variant="ghost" size="sm" className="h-6 text-[10px]">Edit Schedule</Button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {schedules.map((exam, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                        <div className="space-y-0.5">
                                            <h5 className="text-sm font-bold text-white">{exam.subject}</h5>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {exam.date}</span>
                                                <span className="px-1.5 py-0.5 rounded bg-slate-800">{exam.status}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-blue-500 uppercase">92 Days</p>
                                            <p className="text-[8px] text-slate-600 uppercase">REMAINING</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button variant="ghost" className="w-full text-xs text-slate-500 h-10 border-t border-white/5 rounded-none">
                                Import from SAMARTH
                            </Button>
                        </Card>
                    </div>

                    {/* AI Result Predictor */}
                    <Card className="p-6 border-emerald-500/30 bg-emerald-500/5 backdrop-blur-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <h4 className="font-bold text-white">AI Result Forecaster</h4>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Based on historic data of the last 4 years for **Branch: Computer Engineering**, we predict:
                            </p>
                            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-slate-500">Declaration Odds</span>
                                    <span className="text-xs font-bold text-emerald-400">HIGH (92%)</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] mb-1">
                                        <span className="text-slate-500 uppercase font-black">Predicted Window</span>
                                        <span className="text-white">June 15 - June 22</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 w-[65%]"></div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] text-slate-600 italic">
                                *Prediction is statistical and not an official announcement.
                            </p>
                        </div>
                    </Card>

                    {/* Useful Links */}
                    <div className="space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Essential MU Links</h5>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { name: "Degree Certificate Portal", icon: <FileText className="w-3 h-3" /> },
                                { name: "Convocation Status", icon: <ArrowRight className="w-3 h-3" /> },
                                { name: "Transcript Application", icon: <LinkIcon className="w-3 h-3" /> }
                            ].map((l, i) => (
                                <button key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/40 border border-white/5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition-all">
                                    <span className="flex items-center gap-2">{l.icon} {l.name}</span>
                                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UniversityStatus;
