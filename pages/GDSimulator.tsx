import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Card } from '../components/ui';
import { 
    Users, User, ShieldCheck, Zap, Send, RefreshCw, ArrowLeft, MessageCircle, 
    Trophy, Star, Mic, ChevronRight, Pin, Layout, BarChart, BookOpen, Clock, Lightbulb,
    TrendingUp, Award, CheckCircle2
} from 'lucide-react';
import { streamChat } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { trackToolUsage } from '../services/personalizationService';

interface Message {
    sender: string;
    text: string;
    isUser: boolean;
    avatar: string;
}

interface GDResult {
    communicationScore: number;
    relevanceScore: number;
    argumentScore: number;
    leadershipScore: number;
    overallScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
}

const SAMPLE_TOPICS = [
    { text: 'Is AI a threat to Indian IT jobs?', category: 'Tech' },
    { text: 'Work from Home vs Office productivity.', category: 'Corporate' },
    { text: 'Coding mandatory in schools?', category: 'Education' },
    { text: 'Social Media: Harm vs Good.', category: 'Social' },
    { text: 'Startups vs MNCs for freshers.', category: 'Corporate' },
    { text: 'India focusing on IT vs Manufacturing.', category: 'Eco' },
];

const PARTICIPANTS = [
    { name: 'Participant A', icon: User, color: 'text-blue-400', style: 'analytical' },
    { name: 'Participant B', icon: Zap, color: 'text-amber-400', style: 'practical' },
    { name: 'Participant C', icon: ShieldCheck, color: 'text-violet-400', style: 'devil_advocate' },
];

const GDSimulator: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'practice' | 'topics' | 'analysis'>('practice');
    const [topic, setTopic] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [round, setRound] = useState(0);
    const [result, setResult] = useState<GDResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [typingParticipant, setTypingParticipant] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const MAX_ROUNDS = 4;

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    useEffect(() => { trackToolUsage('placement'); }, []);
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

    const readStreamToText = async (stream: ReadableStream<Uint8Array> | null): Promise<string> => {
        if (!stream) return '';
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let out = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            chunk.split('\n').forEach(line => {
                if (line.startsWith('data: ')) {
                    try { out += JSON.parse(line.slice(6)).text; } catch { }
                }
            });
        }
        return out;
    };

    const startGD = async () => {
        if (!topic.trim()) return;
        setIsStarted(true); setIsLoading(true); setRound(0); setMessages([]); setResult(null); setIsFinished(false);
        try {
            const prompt = `Simulate a GD on: "${topic}". Start with 3 participants (A,B,C) with different viewpoints. Format: **Participant A:** [msg] **Participant B:** [msg] **Participant C:** [msg]. Invite the user.`;
            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            const segments = text.split(/\*\*Participant\s+([ABC])\s*\([^)]*\):\*\*/g).filter(Boolean);
            const msgs: Message[] = [];
            for (let i = 0; i < segments.length; i += 2) {
                const label = segments[i]?.trim();
                const content = segments[i + 1]?.trim();
                if (label && content) {
                    const idx = label === 'A' ? 0 : label === 'B' ? 1 : 2;
                    msgs.push({ sender: PARTICIPANTS[idx].name, text: content, isUser: false, avatar: `p_${label.toLowerCase()}` });
                }
            }
            for (const m of msgs) {
                setTypingParticipant(m.sender); await sleep(1500 + Math.random() * 1000);
                setMessages(prev => [...prev, m]); setTypingParticipant(null); await sleep(500);
            }
        } catch (e) { console.error(e); } finally { setIsLoading(false); setTypingParticipant(null); }
    };

    const handleUserResponse = async (e: React.FormEvent) => {
        e.preventDefault(); if (!input.trim() || isLoading) return;
        const msg = input; setInput(''); setMessages(prev => [...prev, { sender: 'You', text: msg, isUser: true, avatar: 'user' }]);
        setIsLoading(true); setRound(r => r + 1);
        try {
            const prompt = `Topic: "${topic}". User said: "${msg}". 3 participants respond (A,B,C). Format: **Participant A:** [msg] **Participant B:** [msg] **Participant C:** [msg]. ${round + 1 >= MAX_ROUNDS ? 'Conclude.' : 'Continue.'}`;
            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            const segments = text.split(/\*\*Participant\s+([ABC]):\*\*/g).filter(Boolean);
            const msgs: Message[] = [];
            for (let i = 0; i < segments.length; i += 2) {
                const l = segments[i]?.trim(); const c = segments[i+1]?.trim();
                if (l && c) {
                    const idx = l === 'A' ? 0 : l === 'B' ? 1 : 2;
                    msgs.push({ sender: PARTICIPANTS[idx].name, text: c, isUser: false, avatar: `p_${l.toLowerCase()}` });
                }
            }
            const shuffled = [...msgs].sort(() => Math.random() - 0.5);
            for (const m of shuffled) {
                setTypingParticipant(m.sender); await sleep(2000 + Math.random() * 2000);
                setMessages(prev => [...prev, m]); setTypingParticipant(null); await sleep(500);
            }
            if (round + 1 >= MAX_ROUNDS) setIsFinished(true);
        } catch (e) { console.error(e); } finally { setIsLoading(false); setTypingParticipant(null); }
    };

    const evaluatePerformance = async () => {
        setIsEvaluating(true);
        try {
            const prompt = `Evaluate GD on "${topic}". Conversation: ${messages.map(m=>`${m.sender}: ${m.text}`).join('\n')}. JSON only: communicationScore, relevanceScore, argumentScore, leadershipScore, overallScore, feedback, strengths[], improvements[]. 1-10 range.`;
            const stream = await streamChat(prompt); const text = await readStreamToText(stream);
            const match = text.match(/\{[\s\S]*\}/); if (match) setResult(JSON.parse(match[0]));
        } catch (e) { console.error(e); } finally { setIsEvaluating(false); }
    };

    const PracticeTab = (
        <div className="space-y-6">
            {!isStarted ? (
                <div className="flex-1 flex items-center justify-center py-12">
                    <Card className="max-w-xl w-full p-10 bg-[#0A0C10] border-cyan-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/5 blur-[100px] rounded-full -mr-40 -mt-40" />
                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mb-8 text-cyan-400 group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                            <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Neural GD Chamber</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed mb-10 max-w-xs italic">
                                Virtual deliberation engine with three AI behavioral profiles.
                            </p>
                            <div className="w-full space-y-6 text-left">
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">Case Topic</label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="Specify discussion vector..."
                                            className="h-14 bg-slate-950 border-white/5 rounded-2xl text-[13px] font-medium italic"
                                        />
                                        <Button variant="ghost" onClick={() => setTopic(SAMPLE_TOPICS[Math.floor(Math.random()*SAMPLE_TOPICS.length)].text)} 
                                            className="h-14 w-14 rounded-2xl border border-white/5 text-slate-500 hover:text-cyan-400">
                                            <RefreshCw size={20} />
                                        </Button>
                                    </div>
                                </div>
                                <Button 
                                    onClick={startGD} 
                                    disabled={!topic.trim()} 
                                    className="w-full h-14 bg-cyan-600 hover:bg-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl shadow-cyan-900/20"
                                >
                                    Initialize Round
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : result ? (
                <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <Card className="p-12 text-center bg-[#0A0C10] border-cyan-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 blur-[100px] rounded-full -mr-40 -mt-40" />
                        <div className="w-24 h-24 rounded-[2rem] bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400 mb-8 shadow-2xl">
                            <Trophy size={48} />
                        </div>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Debrief Complete</h3>
                        <div className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-500/50 py-4 tabular-nums">
                            {result.overallScore}/10
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            {[
                                { l: 'Vox', v: result.communicationScore, c: 'text-blue-400' },
                                { l: 'Scope', v: result.relevanceScore, c: 'text-emerald-400' },
                                { l: 'Logic', v: result.argumentScore, c: 'text-violet-400' },
                                { l: 'Lead', v: result.leadershipScore, c: 'text-amber-400' },
                            ].map(i => (
                                <div key={i.l} className="p-5 rounded-2xl bg-slate-950 border border-white/5">
                                    <p className="text-[9px] font-black text-slate-500 uppercase mb-2">{i.l}</p>
                                    <p className={`text-2xl font-black italic ${i.c}`}>{i.v}</p>
                                </div>
                            ))}
                        </div>
                        <Card className="p-8 text-left bg-cyan-500/5 border-white/5 rounded-3xl italic text-sm text-slate-400 leading-relaxed font-medium">
                            {result.feedback}
                        </Card>
                        <Button variant="ghost" onClick={() => { setIsStarted(false); setTopic(''); setResult(null); }} className="w-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white mt-4">
                            New Simulation
                        </Button>
                    </Card>
                </div>
            ) : (
                <div className="h-[600px] flex gap-6">
                    <div className="flex-1 flex flex-col bg-[#0A0C10] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
                        <div className="p-6 bg-slate-950/50 border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-3">
                                    {PARTICIPANTS.map((p, i) => (
                                        <div key={i} className={`w-10 h-10 rounded-full bg-slate-900 border-2 border-slate-950 flex items-center justify-center ${p.color} shadow-xl`}>
                                            <p.icon size={18} />
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Interaction</h4>
                                    <span className="text-xs font-black text-cyan-400 italic">V-Round {round+1}/{MAX_ROUNDS}</span>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => { setIsStarted(false); setRound(0); setMessages([]); }} className="text-[10px] font-black text-slate-600 hover:text-white uppercase tracking-widest">
                                Abort
                            </Button>
                        </div>
                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                            <div className="flex justify-center mb-8">
                                <div className="px-6 py-2 rounded-full bg-cyan-500/5 border border-cyan-500/10 text-[10px] font-black text-cyan-400 uppercase tracking-widest italic flex items-center gap-3">
                                    <Pin size={12} className="rotate-45" /> {topic}
                                </div>
                            </div>
                            {messages.map((m, i) => (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={i} className={`flex ${m.isUser ? 'justify-end' : 'justify-start'} gap-4`}>
                                    {!m.isUser && (
                                        <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 mt-1 shadow-lg text-slate-500">
                                            {m.avatar === 'p_a' ? <User size={18} className="text-blue-400" /> : m.avatar === 'p_b' ? <Zap size={18} className="text-amber-400" /> : <ShieldCheck size={18} className="text-violet-400" />}
                                        </div>
                                    )}
                                    <div className={`max-w-[75%] p-5 rounded-[2rem] ${m.isUser ? 'bg-cyan-600 text-white rounded-tr-sm shadow-xl shadow-cyan-600/10' : 'bg-slate-900 border border-white/5 text-slate-200 rounded-tl-sm'}`}>
                                        {!m.isUser && <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">{m.sender}</p>}
                                        <p className="text-sm leading-relaxed font-medium tracking-tight italic opacity-90">{m.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                            {(isLoading || typingParticipant) && (
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0 animate-pulse">
                                        <MessageCircle size={18} className="text-cyan-400" />
                                    </div>
                                    <div className="bg-slate-900/50 border border-white/5 rounded-[2rem] p-5 italic text-[11px] font-black text-slate-500 tracking-[0.2em] animate-pulse">
                                        {typingParticipant ? `${typingParticipant.toUpperCase()} IS RESPONDING...` : 'PROCESSING NEURAL REACTION...'}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-8 bg-slate-950 border-t border-white/5">
                            {isFinished ? (
                                <Button onClick={evaluatePerformance} isLoading={isEvaluating} className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-600 text-[10px] font-black uppercase tracking-[0.4em] rounded-2xl shadow-2xl">
                                    Final Synthesis Evaluation
                                </Button>
                            ) : (
                                <form onSubmit={handleUserResponse} className="relative flex items-center">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Transmit viewpoint..."
                                        className="h-14 bg-slate-900 border-white/5 rounded-2xl pr-16 text-sm font-medium italic"
                                        disabled={isLoading}
                                    />
                                    <button disabled={isLoading || !input.trim()} className="absolute right-3 p-3 rounded-xl bg-cyan-600 text-white hover:bg-cyan-500 transition-all shadow-xl shadow-cyan-600/20">
                                        <Send size={18} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    const TopicsTab = (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Tech Vector', 'Economic Matrix', 'Social Engineering', 'Corporate Logic'].map(cat => (
                <Card key={cat} className="p-8 bg-slate-900/40 border-white/5 rounded-[2.5rem] group hover:border-cyan-500/30 transition-all cursor-pointer">
                    <div className="flex justify-between items-start mb-10">
                        <div className="p-3 bg-slate-950 border border-white/5 rounded-xl group-hover:text-cyan-400 transition-colors">
                            <BookOpen size={20} />
                        </div>
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic group-hover:text-cyan-500">12 Cases</span>
                    </div>
                    <h4 className="text-sm font-black text-white italic tracking-tighter uppercase mb-2">{cat}</h4>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-relaxed">Simulate complex multidimensional debates in this domain.</p>
                </Card>
            ))}
        </div>
    );

    const AnalysisTab = (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 p-10 bg-slate-900/40 border-white/5 rounded-[3rem]">
                <h4 className="text-xl font-black text-white italic tracking-tighter uppercase mb-12 underline underline-offset-8 decoration-cyan-500/30">Engagement Analytics</h4>
                <div className="space-y-12">
                    {[
                        { l: 'Discussion Dominance', v: '65%', c: 'bg-blue-500' },
                        { l: 'Argument Integrity', v: '82%', c: 'bg-cyan-500' },
                        { l: 'Conflict Resolution', v: '44%', c: 'bg-violet-500' },
                        { l: 'Neural Alignment', v: '91%', c: 'bg-emerald-500' },
                    ].map(s => (
                        <div key={s.l} className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest italic">
                                <span>{s.l}</span>
                                <span className="text-white">{s.v}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full ${s.c} shadow-[0_0_8px_rgba(6,182,212,0.5)]`} style={{ width: s.v }} />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="space-y-6">
                {[
                    { l: 'Neural Milestone', t: 'Vocal Leader Elite', s: 'unlocked', icon: Award },
                    { l: 'Logic Level', t: 'Tier 4 Logic Gate', s: 'syncing', icon: TrendingUp },
                ].map((m, i) => (
                    <Card key={i} className="p-8 bg-[#0A0C10] border-cyan-500/20 rounded-[2.5rem] flex items-center gap-6">
                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <m.icon size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-600 uppercase mb-1">{m.l}</p>
                            <h5 className="text-sm font-black text-white italic uppercase tracking-tight">{m.t}</h5>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in duration-700 space-y-8 pb-12">
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 gap-1 w-fit">
                {(['practice', 'topics', 'analysis'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`h-11 px-8 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-600/20 font-black' 
                            : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'practice' && PracticeTab}
                    {activeTab === 'topics' && TopicsTab}
                    {activeTab === 'analysis' && AnalysisTab}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default GDSimulator;
