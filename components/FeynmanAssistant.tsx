import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, User, Bot, Sparkles, MessageSquare, CheckCircle, AlertCircle, RefreshCcw } from 'lucide-react';
import { Button, Spinner } from './ui';
import { streamFeynmanChat, getFeynmanFeedback } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface FeynmanAssistantProps {
    topic: string;
    notes: string;
}

interface Feedback {
    clarityScore: number;
    jargon: string[];
    gaps: string[];
    analogySuggestions: string[];
    verdict: string;
    improvement: string;
}

const FeynmanAssistant: React.FC<FeynmanAssistantProps> = ({ topic, notes }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const { language } = useLanguage();

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const stream = await streamFeynmanChat(userMessage, topic, notes, language);
            if (!stream) throw new Error('Failed to get stream');

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let assistantText = '';

            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            assistantText += data.text;
                            setMessages(prev => {
                                const newMessages = [...prev];
                                newMessages[newMessages.length - 1].text = assistantText;
                                return newMessages;
                            });
                        } catch (e) {
                            console.error('Error parsing chunk', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Feynman Chat Error:', error);
            setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I got confused. Can you try saying that again?' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIdentifyGaps = async () => {
        if (messages.length < 2) return;

        setIsGeneratingFeedback(true);
        setShowFeedback(true);

        // Combine all user explanations
        const fullExplanation = messages
            .filter(m => m.role === 'user')
            .map(m => m.text)
            .join(' ');

        try {
            const data = await getFeynmanFeedback(topic, fullExplanation, notes);
            setFeedback(data);
        } catch (error) {
            console.error('Feedback Error:', error);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const resetSession = () => {
        setMessages([]);
        setFeedback(null);
        setShowFeedback(false);
        setInput('');
    };

    return (
        <div className="flex flex-col h-[500px] bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-violet-600/20 text-violet-400">
                        <Brain size={18} />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Feynman Assistant</h3>
                        <p className="text-[10px] text-slate-400">Teaching: <span className="text-violet-300">{topic}</span></p>
                    </div>
                </div>
                <button
                    onClick={resetSession}
                    className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                    title="Reset Session"
                >
                    <RefreshCcw size={16} />
                </button>
            </div>

            {/* Chat Area */}
            {!showFeedback ? (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
                                <div className="w-16 h-16 rounded-full bg-violet-600/10 flex items-center justify-center border border-violet-600/20">
                                    <Sparkles size={32} className="text-violet-400" />
                                </div>
                                <div>
                                    <h4 className="text-slate-200 font-medium">Ready to teach?</h4>
                                    <p className="text-xs text-slate-500 max-w-[250px] mt-1">
                                        Explain <span className="text-violet-300 font-semibold">{topic}</span> like I'm 10 years old. I'll ask questions if I get confused!
                                    </p>
                                </div>
                            </div>
                        )}

                        {messages.map((m, i) => (
                            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`flex gap-2 max-w-[85%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-violet-600' : 'bg-slate-700 border border-slate-600'}`}>
                                        {m.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-violet-400" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl text-xs leading-relaxed ${m.role === 'user' ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'}`}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer Controls */}
                    <div className="p-4 border-t border-slate-700/50 bg-slate-800/20">
                        {messages.length >= 2 && !isLoading && (
                            <Button
                                onClick={handleIdentifyGaps}
                                variant="outline"
                                size="sm"
                                className="w-full mb-3 border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all text-[11px] h-8"
                            >
                                <CheckCircle size={14} className="mr-2" /> Finish & Identify Knowledge Gaps
                            </Button>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Teach me something..."
                                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                            <Button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="rounded-xl w-10 h-10 p-0 bg-violet-600 hover:bg-violet-500"
                            >
                                {isLoading ? <Spinner size="sm" /> : <Send size={16} />}
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                /* Feedback View */
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-white flex items-center gap-2">
                            <Sparkles size={20} className="text-yellow-400" /> Gap Analysis
                        </h4>
                        <Button variant="ghost" size="sm" onClick={() => setShowFeedback(false)} className="text-slate-400 h-8">
                            Back to Chat
                        </Button>
                    </div>

                    {isGeneratingFeedback ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <Spinner size="lg" />
                            <p className="text-sm text-slate-400 animate-pulse">Analyzing pedagogical efficiency...</p>
                        </div>
                    ) : feedback ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Score Card */}
                            <div className="bg-gradient-to-br from-violet-600/20 to-fuchsia-600/20 rounded-2xl p-4 border border-violet-500/20 text-center">
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">{feedback.clarityScore}/10</div>
                                <div className="text-xs text-violet-300 font-medium uppercase tracking-widest mt-1">Clarity Score</div>
                            </div>

                            {/* Gaps Section */}
                            <div className="space-y-3">
                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                    <AlertCircle size={14} className="text-red-400" /> Knowledge Gaps
                                </h5>
                                <div className="grid gap-2">
                                    {feedback.gaps.map((gap, i) => (
                                        <div key={i} className="bg-red-400/5 border border-red-500/10 p-3 rounded-xl text-xs text-red-200/80 leading-relaxed">
                                            {gap}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Jargon Section */}
                            {feedback.jargon.length > 0 && (
                                <div className="space-y-3">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-2">
                                        <MessageSquare size={14} className="text-yellow-400" /> Jargon Alerts
                                    </h5>
                                    <div className="flex flex-wrap gap-2">
                                        {feedback.jargon.map((word, i) => (
                                            <span key={i} className="px-2 py-1 bg-yellow-400/10 text-yellow-300 border border-yellow-400/20 rounded-md text-[10px] font-mono">
                                                {word}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Analogies & Improvements */}
                            <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-4">
                                <div>
                                    <h6 className="text-[11px] font-bold text-slate-200 mb-2">Verdict</h6>
                                    <p className="text-xs text-slate-400 italic">"{feedback.verdict}"</p>
                                </div>
                                <div>
                                    <h6 className="text-[11px] font-bold text-emerald-400 mb-2">Pro-tip for next time</h6>
                                    <p className="text-xs text-slate-300">{feedback.improvement}</p>
                                </div>
                            </div>

                            <Button onClick={resetSession} className="w-full bg-slate-800 hover:bg-slate-700 border-slate-700">
                                Try Another Topic
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">
                            Analysis failed. Please try again.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeynmanAssistant;
