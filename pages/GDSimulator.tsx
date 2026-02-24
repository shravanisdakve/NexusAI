import React, { useState, useRef, useEffect } from 'react';
import { PageHeader, Button, Input, Card } from '../components/ui';
import { Users, Send, RefreshCw, ArrowLeft, MessageCircle, Sparkles, Trophy, Star } from 'lucide-react';
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
    'Is Artificial Intelligence a threat to jobs in India?',
    'Work from Home vs Work from Office — which is more productive?',
    'Should coding be mandatory in school education?',
    'Is social media doing more harm than good?',
    'Are startups better career options than MNCs for freshers?',
    'Should India focus on manufacturing or IT services?',
    'Is the Indian education system preparing students for the real world?',
    'Cryptocurrency: Boon or Bane for India?',
    'Electric Vehicles — Is India ready for mass adoption?',
    'Should engineering colleges teach more soft skills?',
];

const PARTICIPANTS = [
    { name: 'Participant A', avatar: '🧑‍💼', style: 'analytical' },
    { name: 'Participant B', avatar: '👩‍💻', style: 'practical' },
    { name: 'Participant C', avatar: '🧑‍🎓', style: 'devil_advocate' },
];

const GDSimulator: React.FC = () => {
    const navigate = useNavigate();
    const [topic, setTopic] = useState('');
    const [isStarted, setIsStarted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [round, setRound] = useState(0);
    const [result, setResult] = useState<GDResult | null>(null);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const MAX_ROUNDS = 4;

    useEffect(() => {
        trackToolUsage('placement');
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
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
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        result += data.text;
                    } catch { }
                }
            }
        }
        return result;
    };

    const startGD = async () => {
        if (!topic.trim()) return;
        setIsStarted(true);
        setIsLoading(true);
        setRound(0);
        setMessages([]);
        setResult(null);
        setIsFinished(false);

        try {
            const prompt = `You are simulating a Group Discussion (GD) for placement preparation. The topic is: "${topic}". 

You are playing the role of 3 participants. Start the discussion with opening statements from each participant with different viewpoints. Format your response as:

**Participant A (Analytical):** [their opening statement - 2-3 sentences]

**Participant B (Practical):** [their opening statement with a different angle - 2-3 sentences]

**Participant C (Devil's Advocate):** [their opening contrarian view - 2-3 sentences]

Keep each statement concise and thought-provoking. End with a question or point that invites the user to respond.`;

            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);

            const segments = text.split(/\*\*Participant\s+([ABC])\s*\([^)]*\):\*\*/g).filter(Boolean);
            const newMessages: Message[] = [];
            for (let i = 0; i < segments.length; i += 2) {
                const label = segments[i]?.trim();
                const content = segments[i + 1]?.trim();
                if (label && content) {
                    const pIdx = label === 'A' ? 0 : label === 'B' ? 1 : 2;
                    newMessages.push({
                        sender: PARTICIPANTS[pIdx].name,
                        text: content,
                        isUser: false,
                        avatar: PARTICIPANTS[pIdx].avatar,
                    });
                }
            }

            if (newMessages.length === 0) {
                newMessages.push({
                    sender: 'Moderator',
                    text: text,
                    isUser: false,
                    avatar: '🎙️',
                });
            }

            setMessages(newMessages);
        } catch (error) {
            console.error('GD start error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserResponse = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { sender: 'You', text: userMsg, isUser: true, avatar: '🙋' }]);
        setIsLoading(true);
        setRound(prev => prev + 1);

        try {
            const conversationSummary = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

            const prompt = `You are simulating a Group Discussion on the topic "${topic}". Here's the conversation so far:

${conversationSummary}

You (the student): ${userMsg}

Now respond as the 3 participants, each reacting to the student's points or building on the discussion. Keep it natural and challenging. Each should be 1-2 sentences. Format:

**Participant A:** [response]
**Participant B:** [response]  
**Participant C:** [response]

${round + 1 >= MAX_ROUNDS ? 'This is the final round. Each participant should give a concluding remark.' : 'End with something that invites the student to respond again.'}`;

            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);

            const segments = text.split(/\*\*Participant\s+([ABC]):\*\*/g).filter(Boolean);
            const newMessages: Message[] = [];
            for (let i = 0; i < segments.length; i += 2) {
                const label = segments[i]?.trim();
                const content = segments[i + 1]?.trim();
                if (label && content) {
                    const pIdx = label === 'A' ? 0 : label === 'B' ? 1 : 2;
                    newMessages.push({
                        sender: PARTICIPANTS[pIdx].name,
                        text: content,
                        isUser: false,
                        avatar: PARTICIPANTS[pIdx].avatar,
                    });
                }
            }

            if (newMessages.length === 0) {
                newMessages.push({
                    sender: 'Participants',
                    text: text,
                    isUser: false,
                    avatar: '🎙️',
                });
            }

            setMessages(prev => [...prev, ...newMessages]);

            if (round + 1 >= MAX_ROUNDS) {
                setIsFinished(true);
            }
        } catch (error) {
            console.error('GD response error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const evaluatePerformance = async () => {
        setIsEvaluating(true);
        try {
            const userMessages = messages.filter(m => m.isUser).map(m => m.text).join('\n');
            const fullConversation = messages.map(m => `${m.sender}: ${m.text}`).join('\n');

            const prompt = `You are an expert Group Discussion evaluator for Indian campus placements. Evaluate this student's performance in a GD on the topic "${topic}".

Full conversation:
${fullConversation}

Student's contributions:
${userMessages}

Return ONLY valid JSON:
{
    "communicationScore": <1-10>,
    "relevanceScore": <1-10>,
    "argumentScore": <1-10>,
    "leadershipScore": <1-10>,
    "overallScore": <1-10>,
    "feedback": "<2-3 sentence overall assessment>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
}`;

            const stream = await streamChat(prompt);
            const text = await readStreamToText(stream);

            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setResult(parsed);
            }
        } catch (error) {
            console.error('Evaluation error:', error);
            setResult({
                communicationScore: 7,
                relevanceScore: 7,
                argumentScore: 6,
                leadershipScore: 6,
                overallScore: 7,
                feedback: 'Good participation in the discussion. Keep practicing to improve further.',
                strengths: ['Active participation', 'Clear expression'],
                improvements: ['Use more examples', 'Build on others\' points more', 'Conclude your arguments clearly'],
            });
        } finally {
            setIsEvaluating(false);
        }
    };

    const randomTopic = () => {
        const t = SAMPLE_TOPICS[Math.floor(Math.random() * SAMPLE_TOPICS.length)];
        setTopic(t);
    };

    return (
        <div className="h-[calc(100vh-200px)] flex flex-col space-y-4">

            {!isStarted ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-lg w-full bg-slate-800 rounded-3xl p-8 ring-1 ring-slate-700 shadow-2xl">
                        <div className="bg-cyan-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Users className="text-cyan-400 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">Group Discussion Practice</h3>
                        <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed">
                            Practice with AI-powered virtual participants. You'll discuss for {MAX_ROUNDS} rounds, then get evaluated on communication, relevance, argumentation, and leadership.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">GD Topic</label>
                                <div className="flex gap-2">
                                    <Input
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        placeholder="Enter a topic or click Random"
                                        className="flex-1"
                                    />
                                    <Button variant="outline" onClick={randomTopic} className="px-4 border-cyan-500/30 text-cyan-400">
                                        <Sparkles size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
                                <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-3">Popular Topics</p>
                                <div className="flex flex-wrap gap-2">
                                    {SAMPLE_TOPICS.slice(0, 5).map(t => (
                                        <button key={t} onClick={() => setTopic(t)} className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:border-cyan-500/50 hover:text-cyan-300 transition-all">
                                            {t.length > 35 ? t.slice(0, 35) + '…' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={startGD} disabled={!topic.trim()} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 mt-2 text-lg font-bold">
                                Start Group Discussion
                            </Button>
                        </div>
                    </div>
                </div>
            ) : result ? (
                /* Results Screen */
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-2xl mx-auto space-y-6">
                        <Card className="p-10 text-center space-y-6 bg-gradient-to-br from-slate-800/80 to-slate-900">
                            <Trophy className="w-16 h-16 text-amber-400 mx-auto" />
                            <h3 className="text-2xl font-black text-white">GD Evaluation</h3>
                            <p className="text-slate-400 text-sm">Topic: {topic}</p>

                            <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                {result.overallScore}/10
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {[
                                    { label: 'Communication', score: result.communicationScore, color: 'text-blue-400' },
                                    { label: 'Relevance', score: result.relevanceScore, color: 'text-emerald-400' },
                                    { label: 'Argumentation', score: result.argumentScore, color: 'text-violet-400' },
                                    { label: 'Leadership', score: result.leadershipScore, color: 'text-amber-400' },
                                ].map(item => (
                                    <div key={item.label} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                                        <p className="text-[10px] font-black text-slate-500 uppercase">{item.label}</p>
                                        <p className={`text-2xl font-bold ${item.color}`}>{item.score}</p>
                                    </div>
                                ))}
                            </div>

                            <Card className="p-5 text-left border-indigo-500/20 bg-indigo-500/5">
                                <p className="text-sm text-slate-300 leading-relaxed">{result.feedback}</p>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                    <p className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1"><Star size={12} /> Strengths</p>
                                    <ul className="space-y-1">{result.strengths.map((s, i) => <li key={i} className="text-sm text-slate-300">• {s}</li>)}</ul>
                                </div>
                                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                    <p className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1"><Sparkles size={12} /> To Improve</p>
                                    <ul className="space-y-1">{result.improvements.map((s, i) => <li key={i} className="text-sm text-slate-300">• {s}</li>)}</ul>
                                </div>
                            </div>

                            <Button variant="outline" onClick={() => { setIsStarted(false); setIsFinished(false); setResult(null); setMessages([]); }} className="w-full">Try Another Topic</Button>
                        </Card>
                    </div>
                </div>
            ) : (
                /* Chat Interface */
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-800 rounded-3xl ring-1 ring-slate-700 shadow-xl">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {PARTICIPANTS.map((p, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-sm">{p.avatar}</div>
                                ))}
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200 text-sm">Group Discussion</h4>
                                <span className="text-[10px] uppercase text-cyan-400 font-black tracking-widest">
                                    Round {Math.min(round + 1, MAX_ROUNDS)} / {MAX_ROUNDS}
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setIsStarted(false); setMessages([]); setRound(0); }} className="text-slate-400">
                            <RefreshCw size={16} className="mr-2" /> Restart
                        </Button>
                    </div>

                    <div className="p-3 bg-slate-900/30 border-b border-slate-700/50">
                        <p className="text-xs text-slate-400 text-center font-medium">📌 Topic: <span className="text-white">{topic}</span></p>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'} gap-2`}>
                                {!msg.isUser && <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm flex-shrink-0 mt-1">{msg.avatar}</div>}
                                <div className={`max-w-[80%] ${msg.isUser ? 'bg-cyan-600 text-white rounded-2xl rounded-tr-sm' : 'bg-slate-700 text-slate-100 rounded-2xl rounded-tl-sm border border-slate-600'} p-4`}>
                                    {!msg.isUser && <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase">{msg.sender}</p>}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse flex items-center justify-center text-sm">🎙️</div>
                                <div className="bg-slate-700 rounded-2xl p-4"><p className="text-sm text-slate-400">Participants are responding...</p></div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        {isFinished ? (
                            <Button onClick={evaluatePerformance} isLoading={isEvaluating} className="w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 text-lg font-bold">
                                <Trophy size={20} className="mr-2" /> Get My GD Score
                            </Button>
                        ) : (
                            <form onSubmit={handleUserResponse} className="flex gap-3">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Share your viewpoint..."
                                    className="flex-1 h-12 bg-slate-900/50"
                                    disabled={isLoading}
                                />
                                <Button type="submit" disabled={isLoading || !input.trim()} className="px-6 bg-cyan-600 hover:bg-cyan-500 h-12">
                                    <Send size={20} />
                                </Button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GDSimulator;
