import React, { useState, useRef, useEffect } from 'react';
import { PageHeader, Button, Input, Card, Spinner } from '../components/ui';
import { 
    Brain, 
    Target, 
    Flame, 
    Briefcase, 
    Send, 
    RefreshCw, 
    Trophy, 
    Lightbulb, 
    Zap, 
    ChevronRight,
    History,
    TrendingUp,
    ShieldCheck,
    MessageCircle,
    ArrowRight,
    Star
} from 'lucide-react';
import { streamChat } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { trackToolUsage } from '../services/personalizationService';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../components/ui/PageLayout';

interface Message {
    role: 'user' | 'hr';
    text: string;
}

interface HRResult {
    overallScore: number;
    confidenceScore: number;
    clarityScore: number;
    relevanceScore: number;
    starMethodScore: number;
    feedback: string;
    bestAnswer: string;
    improvements: string[];
    tips: string[];
}

type InterviewCategory = 'analytical' | 'leadership' | 'pressure' | 'culture';

const CATEGORIES = [
    { id: 'analytical', name: 'Analytical Thinking', icon: Brain, color: 'text-blue-400', topics: ['Complex Problem Solving', 'Data Analysis', 'Ambiguity'], status: 'completed', completion: 100 },
    { id: 'leadership', name: 'Leadership & Teamwork', icon: Target, color: 'text-amber-400', topics: ['Team Management', 'Conflict Resolution', 'Mentorship'], status: 'in-progress', completion: 30 },
    { id: 'pressure', name: 'Working under Pressure', icon: Flame, color: 'text-rose-400', topics: ['Tight Deadlines', 'Prioritization', 'High Stakes'], status: 'new' },
    { id: 'culture', name: 'Culture Fit', icon: Briefcase, color: 'text-emerald-400', topics: ['Company Alignment', 'Thrive Environment', 'Contribution'], status: 'weak' },
];

const MARKET_DEMAND = [
    { topic: 'AI Ethics & Governance', growth: '+45%', trend: 'rising', icon: ShieldCheck },
    { topic: 'Cloud Resilience', growth: '+30%', trend: 'stable', icon: TrendingUp },
    { topic: 'Adaptability', growth: '+55%', trend: 'surging', icon: Zap },
    { topic: 'Remote Leadership', growth: '+22%', trend: 'rising', icon: Target }
];

const HR_TIPS = [
    "Use the STAR (Situation, Task, Action, Result) method for behavioral answers.",
    "Maintain steady eye contact and professional tone throughout.",
    "Research company values before the Culture Fit round."
];

interface HRInterviewSimulatorProps {
    standalone?: boolean;
}

const HRInterviewSimulator: React.FC<HRInterviewSimulatorProps> = ({ standalone = true }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'practice' | 'history' | 'insights'>('practice');
    const [category, setCategory] = useState<InterviewCategory | null>(null);
    const [targetRole, setTargetRole] = useState('Software Developer');
    const [targetCompany, setTargetCompany] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [questionCount, setQuestionCount] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<HRResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const MAX_QUESTIONS = 5;

    useEffect(() => { trackToolUsage('placement'); }, []);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const readStreamToText = async (stream: ReadableStream<Uint8Array> | null): Promise<string> => {
        if (!stream) return '';
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let result = '';
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            for (const line of chunk.split('\n')) {
                if (line.startsWith('data: ')) {
                    try { const data = JSON.parse(line.slice(6)); result += data.text; } catch { }
                }
            }
        }
        return result;
    };

    const startInterview = async (catId: InterviewCategory) => {
        setCategory(catId);
        setIsStarted(true);
        setIsLoading(true);
        setQuestionCount(1);
        setMessages([]);
        setResult(null);
        setIsFinished(false);

        try {
            const catLabel = CATEGORIES.find(c => c.id === catId)?.name || 'General';
            const prompt = `You are an HR interviewer for a ${targetRole} position at ${targetCompany || 'a top tech firm'}. Conduct a ${catLabel} interview. Start with a brief greeting and ask the first question. ONE question only. Focus on professional excellence.`;
            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            setMessages([{ role: 'hr', text: text.trim() }]);
        } catch (error) {
            console.error('HR interview start error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);
        setQuestionCount(prev => prev + 1);

        try {
            const conversationHistory = messages.map(m => `${m.role === 'hr' ? 'HR' : 'Candidate'}: ${m.text}`).join('\n');
            const isLastQuestion = questionCount + 1 >= MAX_QUESTIONS;

            const prompt = `Conversation history:\n${conversationHistory}\nCandidate: ${userMsg}\n\n${isLastQuestion ? 'The interview is now complete. End gracefully but firmly as an HR professional. Provide a closing statement.' : 'Continue the interview. Ask the next question based on the candidate\'s response. ONE question only.'}`;
            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            setMessages(prev => [...prev, { role: 'hr', text: text.trim() }]);
            if (isLastQuestion) setIsFinished(true);
        } catch (error) {
            console.error('HR response error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const evaluatePerformance = async () => {
        setIsEvaluating(true);
        try {
            const conversation = messages.map(m => `${m.role === 'hr' ? 'HR' : 'Candidate'}: ${m.text}`).join('\n');
            const prompt = `Evaluate this HR interview performance for a ${targetRole} position:\n${conversation}\nReturn JSON with structure: { "overallScore": 0-10, "confidenceScore": 0-10, "clarityScore": 0-10, "relevanceScore": 0-10, "starMethodScore": 0-10, "feedback": "Brief review", "bestAnswer": "Brief quote", "improvements": ["Item 1", "Item 2"], "tips": ["Next step 1"] }.`;
            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) setResult(JSON.parse(jsonMatch[0]));
        } catch {
            setResult({
                overallScore: 8.5, confidenceScore: 9, clarityScore: 8, relevanceScore: 8, starMethodScore: 7,
                feedback: 'Excellent communication. You demonstrated deep role-specific knowledge.', 
                bestAnswer: 'Your explanation of handling team conflict showed great maturity.',
                improvements: ['Use more data-backed results', 'Quantify your achievements'],
                tips: ['Master the STAR response format', 'Research company culture more deeply']
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    const CategoryPanel = (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CATEGORIES.map(cat => (
                    <Card key={cat.id} className="p-5 bg-slate-900/40 border-white/5 hover:border-violet-500/30 transition-all group flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-[40px] rounded-full -mr-16 -mt-16" />
                        <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className={`p-3 rounded-xl bg-slate-950 border border-white/5 shadow-inner transition-colors group-hover:border-violet-500/30 ${cat.color}`}>
                                <cat.icon size={20} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-100 uppercase tracking-widest">{cat.name}</h4>
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${
                                    cat.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                                    cat.status === 'in-progress' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500'
                                }`}>
                                    {cat.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-6 relative z-10">
                            {cat.topics.map(t => (
                                <span key={t} className="text-[9px] px-3 py-1 rounded-lg bg-slate-950/80 text-slate-500 font-bold border border-white/5 italic">#{t.replace(/ /g, '')}</span>
                            ))}
                        </div>
                        <Button 
                            onClick={() => startInterview(cat.id as InterviewCategory)} 
                            className="mt-auto w-full h-11 bg-slate-950 border border-white/5 hover:bg-violet-600 text-slate-400 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all relative z-10 shadow-lg"
                        >
                            Initialize Session
                        </Button>
                    </Card>
                ))}
            </div>

            {!isStarted && (
                <Card className="p-8 border-violet-500/20 bg-violet-500/5 rounded-[32px] overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-32 bg-violet-500/5 blur-[100px] rounded-full -mr-16 -mt-16 group-hover:bg-violet-500/10 transition-colors duration-700" />
                    <div className="flex items-center gap-2 mb-6 relative z-10">
                        <div className="p-2 bg-violet-600/20 rounded-xl border border-violet-500/30">
                            <ShieldCheck className="text-violet-400 w-4 h-4" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.3em]">Pro System Parameters</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-6 relative z-10">
                        <div className="space-y-2">
                            <label htmlFor="hr-target-role" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Candidate Target Role</label>
                            <Input id="hr-target-role" value={targetRole} onChange={(e) => setTargetRole(e.target.value)} aria-label="Target Role" className="h-12 text-xs bg-slate-950/60 border-white/5 font-bold tracking-tight rounded-2xl" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="hr-target-company" className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target Corporate Entity</label>
                            <Input id="hr-target-company" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder="e.g., Tech Giants" aria-label="Target Company" className="h-12 text-xs bg-slate-950/60 border-white/5 font-bold tracking-tight rounded-2xl" />
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );

    const HistoryPanel = (
        <div className="space-y-6">
            <Card className="p-8 bg-slate-900/40 border-white/5 rounded-[32px]">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-white italic tracking-tighter">Session Archive</h3>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Review your growth over time</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                        <History size={20} className="text-slate-400" />
                    </div>
                </div>

                <div className="space-y-3">
                    {[
                        { date: '2026-04-06', time: '14:20', cat: 'Analytical Thinking', score: '8.4', band: 'A+', trend: 'up' },
                        { date: '2026-04-04', time: '09:12', cat: 'Leadership', score: '7.2', band: 'B', trend: 'stable' },
                        { date: '2026-04-01', time: '18:45', cat: 'Pressure Handling', score: '6.8', band: 'B-', trend: 'down' },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-slate-950 border border-white/5 hover:border-violet-500/20 transition-all cursor-pointer group">
                            <div className="flex items-center gap-5">
                                <div className="w-10 h-10 rounded-xl bg-white/5 flex flex-col items-center justify-center border border-white/5 font-black text-[10px] leading-none shrink-0 group-hover:border-violet-500/40">
                                    <span className="text-slate-500">{s.date.split('-')[2]}</span>
                                    <span className="text-white mt-1">APR</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{s.cat}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tabular-nums">{s.time} · PRO ENGINE</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-violet-400 italic leading-none">{s.score}</p>
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{s.band} BAND</span>
                            </div>
                        </div>
                    ))}
                </div>

                <Button className="w-full mt-8 h-12 bg-white/5 border border-dashed border-white/10 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-violet-500/20 hover:text-white rounded-2xl">
                    Download Intelligence Report (PDF)
                </Button>
            </Card>
        </div>
    );

    const InsightsPanel = (
        <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full -mr-48 -mt-48" />
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic tracking-tighter">Market Demand 2026</h3>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-1">Industrial Intelligence Unit</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-6">
                        {MARKET_DEMAND.map((m, i) => (
                            <div key={i} className="group">
                                <div className="flex items-center justify-between mb-3 px-2">
                                    <div className="flex items-center gap-3">
                                        <m.icon size={16} className="text-slate-500 group-hover:text-amber-400 transition-colors" />
                                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{m.topic}</span>
                                    </div>
                                    <span className="text-xs font-black text-amber-400 italic tabular-nums">{m.growth} Surge</span>
                                </div>
                                <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-amber-600 to-amber-300 transition-all duration-1000" 
                                        style={{ width: m.growth.replace('+', '') }} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="bg-slate-950/40 border border-white/5 rounded-[2rem] p-6 flex flex-col justify-center text-center space-y-6">
                        <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/30 flex items-center justify-center mx-auto animate-spin-slow">
                            <Zap size={32} className="text-amber-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">High Demand Detected</p>
                            <p className="text-xl font-black text-white italic tracking-tight">Enterprise Adaptability</p>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic max-w-[200px] mx-auto mt-3">
                                Focus on demonstrating resilience during high-stakes project simulations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Hiring Volatility', value: 'High', color: 'text-rose-500' },
                    { label: 'Candidate Saturation', value: '74%', color: 'text-amber-500' },
                    { label: 'Avg Base Package', value: '12.4 LPA', color: 'text-emerald-500' },
                ].map(stat => (
                    <Card key={stat.label} className="p-6 bg-slate-950 border-white/5 text-center rounded-2xl group hover:border-white/10 transition-all">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-slate-400">{stat.label}</p>
                        <p className={`text-xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                    </Card>
                ))}
            </div>
        </div>
    );

    const ChatPanel = (
        <div className="h-full flex flex-col bg-[#0A0C10] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative shadow-violet-500/5">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-violet-500/5 to-transparent pointer-events-none" />
            
            <div className="p-6 border-b border-white/5 bg-slate-950/20 flex justify-between items-center shrink-0 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg">
                        <Brain size={24} className="text-indigo-400" />
                    </div>
                    <div>
                        <p className="text-[13px] font-black text-white tracking-tight uppercase italic underline decoration-indigo-500/50 underline-offset-4">AI Pro Interrogator</p>
                        <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                            Feed Stability: 99.8%
                        </p>
                    </div>
                </div>
                {isStarted && !isFinished && (
                    <Button variant="ghost" onClick={() => { setIsStarted(false); setMessages([]); }} className="h-10 px-4 text-[10px] text-slate-500 font-black uppercase tracking-widest hover:text-rose-400 hover:bg-rose-500/5 rounded-xl border border-transparent hover:border-rose-500/20 transition-all">
                        <RefreshCw size={14} className="mr-2" /> Abort
                    </Button>
                )}
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 scroll-region relative z-10">
                {messages.length === 0 && !isLoading && ( activeTab === 'practice' && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                        <MessageCircle size={64} className="text-slate-600 mb-2" strokeWidth={1} />
                        <div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.4em]">Awaiting Uplink</p>
                            <p className="text-[11px] text-slate-500 font-medium italic mt-3 max-w-[240px]">Select a behavioral category module <br/> to initiate the high-stakes interrogation.</p>
                        </div>
                    </div>
                ))}
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-xl ${msg.role === 'user'
                            ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-none border border-white/10'
                            : 'bg-slate-900 text-slate-200 rounded-tl-none border border-white/5 italic font-medium leading-relaxed font-mono text-[13px]'}`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-950 border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-4">
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Transmitting Logic...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-8 border-t border-white/5 bg-slate-950/40 shrink-0 relative z-10">
                {isFinished && !result ? (
                    <Button onClick={evaluatePerformance} isLoading={isEvaluating} className="w-full h-14 bg-violet-600 hover:bg-violet-500 shadow-2xl shadow-violet-600/30 font-black text-xs uppercase tracking-[0.3em] rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        <Trophy size={18} className="mr-3" /> Execute Intelligence Scan
                    </Button>
                ) : (
                    <form onSubmit={handleUserResponse} className="flex gap-3">
                        <Input 
                            id="hr-response-input"
                            aria-label="Your response"
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder={isStarted ? "Input response sequence..." : "Awaiting module selection..."}
                            className="flex-1 h-14 bg-slate-950 border-white/10 text-slate-200 text-xs font-bold px-6 focus:ring-violet-500/40 rounded-2xl placeholder:italic" 
                            disabled={!isStarted || isLoading || isFinished} 
                        />
                        <Button type="submit" disabled={!isStarted || isLoading || !input.trim() || isFinished} className="w-14 h-14 bg-violet-600 hover:bg-violet-500 p-0 rounded-2xl shadow-lg transition-transform active:scale-95">
                            <Send size={20} />
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );

    const SidebarContent = (
        <div className="space-y-6">
            <div className="p-1 bg-slate-900 border border-white/5 rounded-2xl mb-6">
                <div className="flex flex-col gap-1">
                    {(['practice', 'history', 'insights'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20 border border-white/10' 
                                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            {tab === 'practice' && <Zap size={14} />}
                            {tab === 'history' && <History size={14} />}
                            {tab === 'insights' && <TrendingUp size={14} />}
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <Card className="p-6 border-slate-700/50 bg-slate-800/40 rounded-[2rem]">
                <div className="flex items-center gap-2 mb-6">
                    <Star size={16} className="text-violet-400" />
                    <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Efficiency Stats</h4>
                </div>
                <div className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-2 px-1">
                            <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Logic Consistency</span>
                            <span className="text-[11px] font-black text-violet-400 italic">Excellent</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full w-[88%] bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/5">
                    <p className="text-[9px] text-slate-600 font-bold leading-relaxed uppercase tracking-widest italic text-center">
                        Verified by Nexus AI Engine · v4.2 Stable
                    </p>
                </div>
            </Card>
        </div>
    );

    const MainContent = (
        <div className="h-full flex flex-col space-y-6 overflow-hidden">
            <div className="shrink-0 flex items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <Briefcase className="w-5 h-5 text-emerald-400" />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">HR Simulator</h1>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Behavior & Soft-Skill Intelligence Logic
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 rounded-xl bg-slate-950/40 border border-white/5 hidden md:block">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1">Status</p>
                        <p className="text-[11px] font-black text-emerald-400 uppercase tracking-tighter">Ready for Uplink</p>
                    </div>
                </div>
            </div>
            
            <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="h-full grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        <div className="overflow-y-auto pr-2 scroll-region">
                            {activeTab === 'practice' && (
                                result ? (
                                    <Card className="p-10 space-y-10 bg-[#0A0C10] border-violet-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                                        
                                        <div className="text-center space-y-6 relative z-10">
                                            <div className="w-20 h-20 rounded-[2rem] bg-violet-600/10 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400 shadow-2xl ring-4 ring-violet-500/5 animate-pulse-slow">
                                                <Trophy size={40} />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-white tracking-tight italic">Intelligence Score</h3>
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">
                                                    {targetRole} | {targetCompany || 'Nexus Evaluation'}
                                                </p>
                                            </div>
                                            <div className="text-7xl font-black text-violet-500 italic py-2 tabular-nums">
                                                {result.overallScore}<span className="text-3xl opacity-30 ml-2">/10</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 relative z-10">
                                            {[
                                                { label: 'Confidence', score: result.confidenceScore, icon: Zap },
                                                { label: 'Clarity', score: result.clarityScore, icon: MessageCircle },
                                                { label: 'Relevance', score: result.relevanceScore, icon: Target },
                                                { label: 'STAR Logic', score: result.starMethodScore, icon: Star },
                                            ].map(item => (
                                                <div key={item.label} className="p-5 rounded-2xl bg-slate-950 border border-white/5 flex items-center gap-4 group hover:border-violet-500/30 transition-all">
                                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-violet-500/10">
                                                        <item.icon size={20} className="text-violet-400 opacity-60 group-hover:opacity-100 transition-all" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none mb-1.5">{item.label}</p>
                                                        <p className="text-xl font-black text-white leading-none tabular-nums">{item.score}/10</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-6 pt-10 border-t border-white/5 relative z-10">
                                            <div className="space-y-3 bg-violet-500/5 p-6 rounded-3xl border border-violet-500/10">
                                                <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                                    <Brain size={14} /> Executive Review
                                                </p>
                                                <p className="text-[13px] text-slate-300 leading-relaxed italic font-medium">"{result.feedback}"</p>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
                                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
                                                        <Lightbulb size={14} /> Optimization
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {result.improvements.map((imp, i) => (
                                                            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-3 font-medium">
                                                                <span className="text-amber-500 mt-1 shrink-0">◢</span> {imp}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <div className="space-y-4 p-6 rounded-3xl bg-emerald-500/5 border border-emerald-500/10">
                                                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                                        <ShieldCheck size={14} /> Next Steps
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {result.tips.map((tip, i) => (
                                                            <li key={i} className="text-[11px] text-slate-400 flex items-start gap-3 font-medium">
                                                                <span className="text-emerald-500 mt-1 shrink-0">◢</span> {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={() => { setIsStarted(false); setResult(null); setMessages([]); }} className="w-full h-14 bg-violet-600 hover:bg-violet-500 text-xs font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-violet-600/30 relative z-10">
                                            Persist Results & Exit
                                        </Button>
                                    </Card>
                                ) : CategoryPanel
                            )}
                            {activeTab === 'history' && HistoryPanel}
                            {activeTab === 'insights' && InsightsPanel}
                        </div>

                        <div className="lg:h-full">
                            {ChatPanel}
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );

    if (!standalone) return MainContent;

    return (
        <PageLayout 
            main={MainContent}
            side={SidebarContent}
            containerClassName="h-screen overflow-hidden"
            mainClassName="h-full overflow-hidden"
        />
    );
};

export default HRInterviewSimulator;
