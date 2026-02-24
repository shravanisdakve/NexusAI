import React, { useState, useRef, useEffect } from 'react';
import { PageHeader, Button, Input, Card } from '../components/ui';
import { UserCheck, Send, RefreshCw, ArrowLeft, Sparkles, Trophy, ChevronRight, Star } from 'lucide-react';
import { streamChat } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { trackToolUsage } from '../services/personalizationService';

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

type InterviewCategory = 'behavioral' | 'situational' | 'stress' | 'general';

const CATEGORIES: { id: InterviewCategory; label: string; description: string; emoji: string; color: string }[] = [
    { id: 'behavioral', label: 'Behavioral', description: 'Tell me about a time when...', emoji: '🧠', color: 'text-violet-400' },
    { id: 'situational', label: 'Situational', description: 'What would you do if...', emoji: '🎯', color: 'text-blue-400' },
    { id: 'stress', label: 'Stress Round', description: 'Difficult & tricky questions', emoji: '🔥', color: 'text-rose-400' },
    { id: 'general', label: 'General HR', description: 'Classic HR interview questions', emoji: '💼', color: 'text-emerald-400' },
];

const COMMON_QUESTIONS: Record<InterviewCategory, string[]> = {
    behavioral: [
        'Tell me about a time you failed and what you learned',
        'Describe a situation where you had to work with a difficult team member',
        'Tell me about your biggest achievement so far',
        'Describe a time you had to meet a tight deadline',
    ],
    situational: [
        'What would you do if your manager gave you conflicting instructions?',
        'How would you handle a situation where you disagree with your team?',
        'What would you do if you realized a project was going to miss its deadline?',
    ],
    stress: [
        'Why should we hire you over other candidates?',
        'What if I say you are not fit for this role?',
        'Don\'t you think your CGPA is too low for this position?',
        'Why do you have a gap in your resume?',
    ],
    general: [
        'Tell me about yourself',
        'Where do you see yourself in 5 years?',
        'What are your strengths and weaknesses?',
        'Why do you want to join our company?',
        'What is your expected salary?',
    ],
};

const HR_TIPS = [
    '💡 Use the STAR method: Situation → Task → Action → Result',
    '💡 Be specific with examples rather than giving generic answers',
    '💡 Show enthusiasm but remain professional',
    '💡 Research the company before the interview',
    '💡 Ask thoughtful questions at the end of the interview',
];

const HRInterviewSimulator: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [category, setCategory] = useState<InterviewCategory | null>(null);
    const [targetRole, setTargetRole] = useState('Software Engineer');
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

    const startInterview = async () => {
        if (!category) return;
        setIsStarted(true);
        setIsLoading(true);
        setQuestionCount(1);
        setMessages([]);
        setResult(null);
        setIsFinished(false);

        try {
            const catLabel = CATEGORIES.find(c => c.id === category)?.label || 'General';
            const companyContext = targetCompany ? ` The candidate is applying to ${targetCompany}.` : '';

            const prompt = `You are an experienced HR interviewer at an Indian IT company conducting a ${catLabel} interview round for a ${targetRole} position.${companyContext} The candidate is a fresh engineering graduate from Mumbai University.

Start the interview with a warm greeting and ask your first ${catLabel.toLowerCase()} question. Be professional but friendly. Ask only ONE question. Keep it concise (2-3 sentences max including the greeting).`;

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
            const catLabel = CATEGORIES.find(c => c.id === category)?.label || 'General';

            const isLastQuestion = questionCount + 1 >= MAX_QUESTIONS;

            const prompt = `You are an HR interviewer conducting a ${catLabel} interview for a ${targetRole} position. Here's the conversation:

${conversationHistory}
Candidate: ${userMsg}

${isLastQuestion
                    ? 'This is the last question. Give a brief acknowledgment of their answer (1 sentence), then thank them for their time and end the interview professionally.'
                    : 'Give a brief reaction to their answer (1 sentence), then ask your next HR question. Keep it natural and conversational. Ask only ONE question.'
                }`;

            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);
            setMessages(prev => [...prev, { role: 'hr', text: text.trim() }]);

            if (isLastQuestion) {
                setIsFinished(true);
            }
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

            const prompt = `You are an expert HR interview evaluator for Indian IT placements. Evaluate this candidate's performance:

Interview Type: ${CATEGORIES.find(c => c.id === category)?.label}
Role: ${targetRole}
Conversation:
${conversation}

Return ONLY valid JSON:
{
    "overallScore": <1-10>,
    "confidenceScore": <1-10>,
    "clarityScore": <1-10>,
    "relevanceScore": <1-10>,
    "starMethodScore": <1-10>,
    "feedback": "<2-3 sentence overall assessment>",
    "bestAnswer": "<which question they answered the best and why, 1 sentence>",
    "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
    "tips": ["<actionable tip 1>", "<actionable tip 2>"]
}`;

            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                setResult(JSON.parse(jsonMatch[0]));
            }
        } catch {
            setResult({
                overallScore: 7, confidenceScore: 7, clarityScore: 7, relevanceScore: 7, starMethodScore: 6,
                feedback: 'Good interview performance. Keep practicing to build more confidence.', bestAnswer: 'Your introduction was clear and well-structured.',
                improvements: ['Use more specific examples', 'Apply STAR method consistently', 'Show more enthusiasm'],
                tips: ['Practice common HR questions daily', 'Prepare 3-4 strong stories from college/projects'],
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col space-y-4">

            {!isStarted ? (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card className="p-8 space-y-6">
                            <div className="text-center">
                                <div className="bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                                    <UserCheck className="text-emerald-400 w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">HR Interview Practice</h3>
                                <p className="text-slate-400 text-sm">Practice {MAX_QUESTIONS} questions with an AI interviewer</p>
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-300 mb-3">Interview Type</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {CATEGORIES.map(cat => (
                                        <button key={cat.id} onClick={() => setCategory(cat.id)}
                                            className={`p-4 rounded-xl text-left transition-all border ${category === cat.id ? 'bg-emerald-500/10 border-emerald-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}>
                                            <div className="text-2xl mb-2">{cat.emoji}</div>
                                            <h4 className={`font-bold ${category === cat.id ? cat.color : 'text-white'} text-sm`}>{cat.label}</h4>
                                            <p className="text-[11px] text-slate-500 mt-1">{cat.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Target Role</label>
                                    <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Software Engineer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Company (optional)</label>
                                    <Input value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} placeholder="e.g. TCS, Infosys" />
                                </div>
                            </div>

                            {category && (
                                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Common Questions in {CATEGORIES.find(c => c.id === category)?.label}</p>
                                    <ul className="space-y-1.5">
                                        {COMMON_QUESTIONS[category].slice(0, 3).map((q, i) => (
                                            <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                                                <ChevronRight size={12} className="mt-0.5 text-slate-600 flex-shrink-0" /> {q}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Button onClick={startInterview} disabled={!category} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-lg font-bold">
                                Start HR Interview
                            </Button>
                        </Card>

                        <Card className="p-5 border-amber-500/20 bg-amber-500/5">
                            <p className="text-xs font-bold text-amber-400 mb-3">💡 Quick Tips</p>
                            <ul className="space-y-2">
                                {HR_TIPS.map((tip, i) => (
                                    <li key={i} className="text-xs text-slate-400">{tip}</li>
                                ))}
                            </ul>
                        </Card>
                    </div>
                </div>
            ) : result ? (
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto">
                        <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-slate-800/80 to-slate-900">
                            <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
                            <h3 className="text-2xl font-black text-white">Interview Performance</h3>
                            <p className="text-slate-400 text-sm">{CATEGORIES.find(c => c.id === category)?.label} Round • {targetRole}</p>

                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                {result.overallScore}/10
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Confidence', score: result.confidenceScore, color: 'text-blue-400' },
                                    { label: 'Clarity', score: result.clarityScore, color: 'text-emerald-400' },
                                    { label: 'Relevance', score: result.relevanceScore, color: 'text-violet-400' },
                                    { label: 'STAR Method', score: result.starMethodScore, color: 'text-amber-400' },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">{item.label}</p>
                                        <p className={`text-2xl font-bold ${item.color}`}>{item.score}</p>
                                    </div>
                                ))}
                            </div>

                            <Card className="p-5 text-left border-indigo-500/20 bg-indigo-500/5">
                                <p className="text-sm text-slate-300 leading-relaxed">{result.feedback}</p>
                                {result.bestAnswer && <p className="text-xs text-indigo-300 mt-2">⭐ {result.bestAnswer}</p>}
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <p className="text-xs font-bold text-amber-400 mb-2"><Sparkles size={12} className="inline mr-1" />Improvements</p>
                                    <ul className="space-y-1">{result.improvements.map((s, i) => <li key={i} className="text-sm text-slate-300">• {s}</li>)}</ul>
                                </div>
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <p className="text-xs font-bold text-emerald-400 mb-2"><Star size={12} className="inline mr-1" />Pro Tips</p>
                                    <ul className="space-y-1">{result.tips.map((s, i) => <li key={i} className="text-sm text-slate-300">• {s}</li>)}</ul>
                                </div>
                            </div>

                            <Button variant="outline" onClick={() => { setIsStarted(false); setIsFinished(false); setResult(null); setMessages([]); }} className="w-full">Try Again</Button>
                        </Card>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-800 rounded-3xl ring-1 ring-slate-700 shadow-xl">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                                <UserCheck size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 text-sm">HR Interviewer</h4>
                                <span className="text-[10px] uppercase text-emerald-400 font-black tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Q{Math.min(questionCount, MAX_QUESTIONS)}/{MAX_QUESTIONS}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setIsStarted(false); setMessages([]); setQuestionCount(0); }} className="text-slate-400">
                            <RefreshCw size={16} className="mr-2" /> Restart
                        </Button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-emerald-600 text-white rounded-tr-sm shadow-lg shadow-emerald-900/20'
                                    : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'}`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text || (isLoading && idx === messages.length - 1 ? '...' : '')}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && messages.length > 0 && messages[messages.length - 1].role !== 'hr' && (
                            <div className="flex justify-start">
                                <div className="bg-slate-700 rounded-2xl p-4 border border-slate-600">
                                    <p className="text-sm text-slate-400">HR is typing...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        {isFinished ? (
                            <Button onClick={evaluatePerformance} isLoading={isEvaluating} className="w-full h-12 bg-gradient-to-r from-emerald-600 to-cyan-600 text-lg font-bold">
                                <Trophy size={20} className="mr-2" /> Get Interview Score
                            </Button>
                        ) : (
                            <form onSubmit={handleUserResponse} className="flex gap-3">
                                <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your answer..." className="flex-1 h-12 bg-slate-900/50" disabled={isLoading} />
                                <Button type="submit" disabled={isLoading || !input.trim()} className="px-6 bg-emerald-600 hover:bg-emerald-500 h-12"><Send size={20} /></Button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRInterviewSimulator;
