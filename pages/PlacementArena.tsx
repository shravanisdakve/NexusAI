import React from 'react';
import { PageHeader, Button, Card } from '@/components/ui';
import {
    Briefcase,
    Trophy,
    Target,
    Users,
    ArrowRight,
    Zap,
    Globe,
    Rocket,
    BarChart3,
    Terminal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PlacementArena: React.FC = () => {
    const simulators = [
        {
            id: 'tcs-nqt',
            name: 'TCS NQT 2025 Simulator',
            description: 'Adaptive 75-minute Foundation Round and 90-minute Advanced Round with AI proctoring mimicry.',
            icon: <Terminal className="w-6 h-6" />,
            color: 'text-rose-400',
            bg: 'bg-rose-500/10',
            border: 'border-rose-500/30',
            href: '/placement/tcs-nqt'
        },
        {
            id: 'capgemini',
            name: 'Capgemini Exceller Drive',
            description: 'Game-based aptitude challenges and technical MCQs optimized for the 2025 recruitment pattern.',
            icon: <Zap className="w-6 h-6" />,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/30',
            href: '/placement/capgemini'
        }
    ];

    const stats = [
        { label: 'Highest Package', value: '₹1.68 CPA', college: 'IIT Bombay' },
        { label: 'VJTI Avg', value: '₹8.5 LPA', color: 'text-emerald-400' },
        { label: 'SPIT Avg', value: '₹10.2 LPA', color: 'text-blue-400' },
        { label: 'Mass Recruiters', value: '₹3.6 - 7 LPA' }
    ];

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-12">
            <PageHeader
                title="Placement Arena"
                subtitle="The high-stakes simulator for Mumbai's engineering recruitment ecosystem."
                icon={<Briefcase className="w-8 h-8 text-amber-400" />}
            />

            {/* Placement Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="p-6 text-center group hover:scale-105 transition-transform">
                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{stat.label}</p>
                        <h4 className={`text-2xl font-black ${stat.color || 'text-white'}`}>{stat.value}</h4>
                        {stat.college && <p className="text-[10px] text-slate-500 mt-1">{stat.college}</p>}
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Simulator Section */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                        <Target className="text-rose-500" />
                        Active Assessment Simulators
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {simulators.map((sim) => (
                            <Card key={sim.id} className={`p-6 border-2 ${sim.border} ${sim.bg} flex flex-col h-full`}>
                                <div className={`w-12 h-12 rounded-2xl ${sim.bg} border ${sim.border} flex items-center justify-center ${sim.color} mb-6 shadow-xl`}>
                                    {sim.icon}
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">{sim.name}</h4>
                                <p className="text-sm text-slate-400 mb-8 flex-1">{sim.description}</p>
                                <Button className="w-full gap-2">
                                    Launch Simulator <ArrowRight className="w-4 h-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>

                    <Card className="p-8 bg-gradient-to-br from-indigo-900/40 to-slate-900 border-indigo-500/30 overflow-hidden relative">
                        <div className="absolute right-0 top-0 p-12 opacity-5 scale-150">
                            <Rocket className="w-32 h-32 text-indigo-400" />
                        </div>
                        <div className="relative z-10 max-w-lg">
                            <h3 className="text-2xl font-bold text-white mb-4">AI-Driven Resume Engineering</h3>
                            <p className="text-slate-400 mb-6 text-sm">
                                Optimize your profile for Indian HR tech stacks. Ensure your skills match the standardized taxonomy used by TCS, Capgemini, and local tech startups.
                            </p>
                            <Button variant="outline" className="gap-2 border-indigo-500 text-indigo-400 hover:bg-indigo-500/10">
                                Open Resume Builder <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </Card>
                </div>

                {/* Ecosystem Section */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 px-2">
                        <Globe className="text-blue-400" />
                        Mumbai Startup Hub
                    </h3>
                    <Card className="p-6 space-y-6">
                        <div className="space-y-4">
                            {[
                                { name: 'Jupiter', sector: 'FinTech', stack: 'Java, security' },
                                { name: 'Truemeds', sector: 'HealthTech', stack: 'Backend, Mobile' },
                                { name: 'Haptik', sector: 'AI/NLP', stack: 'ML, Data Eng' }
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-700/50 group hover:border-blue-500/50 transition-colors">
                                    <div>
                                        <h5 className="font-bold text-white">{s.name}</h5>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider">{s.sector}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-mono text-blue-400">{s.stack}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full text-xs text-slate-500 hover:text-white">
                            View 50+ More Local Startups
                        </Button>
                    </Card>

                    <Card className="p-6 bg-amber-500/5 border-amber-500/20">
                        <h4 className="font-bold text-amber-400 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            College Placement Trends
                        </h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">DJ Sanghvi</span>
                                <span className="text-sm font-bold text-white">~₹8-9 LPA</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">Thadomal Shahani</span>
                                <span className="text-sm font-bold text-white">~₹7.5 LPA</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full mt-2">
                                <div className="w-3/4 h-full bg-amber-500 rounded-full"></div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PlacementArena;
