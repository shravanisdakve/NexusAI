import React, { useState, useRef, useEffect } from 'react';
import { PageHeader, Button, Input } from '../components/ui';
import { Users, Send, RefreshCw, ArrowLeft, Terminal, AlertCircle } from 'lucide-react';
import { streamVivaChat } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
    role: 'user' | 'model';
    text: string;
}

const VivaSimulator: React.FC = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [subject, setSubject] = useState('');
    const [branch, setBranch] = useState(user?.branch || '');
    const [persona, setPersona] = useState('Standard');
    const [isStarted, setIsStarted] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleStart = async () => {
        if (!subject) return;
        setIsStarted(true);
        setIsLoading(true);
        const initialPrompt = `Hello Examiner. I am ready for my viva for the subject ${subject}. Please start the session.`;

        setMessages([{ role: 'user', text: initialPrompt }]);

        try {
            const stream = await streamVivaChat(initialPrompt, subject, branch, persona, language);
            if (stream) {
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = '';

                setMessages(prev => [...prev, { role: 'model', text: '' }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                assistantMessage += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1].text = assistantMessage;
                                    return newMessages;
                                });
                            } catch (e) {
                                console.error("Error parsing stream chunk", e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Viva stream error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsLoading(true);

        try {
            const stream = await streamVivaChat(userMsg, subject, branch, persona, language);
            if (stream) {
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                let assistantMessage = '';

                setMessages(prev => [...prev, { role: 'model', text: '' }]);

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));
                                assistantMessage += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    newMessages[newMessages.length - 1].text = assistantMessage;
                                    return newMessages;
                                });
                            } catch (e) {
                                console.error("Error parsing stream chunk", e);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Viva stream error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-[calc(100vh-120px)] flex flex-col space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate('/')} className="p-2 text-slate-400">
                    <ArrowLeft size={20} />
                </Button>
                <PageHeader title="Viva Voce Simulator" subtitle="Face the external examiner with confidence." />
            </div>

            {!isStarted ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="max-w-md w-full bg-slate-800 rounded-3xl p-8 ring-1 ring-slate-700 shadow-2xl">
                        <div className="bg-emerald-500/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                            <Users className="text-emerald-400 w-8 h-8" />
                        </div>
                        <h3 className="text-2xl font-bold text-center text-white mb-2">Ready for the Viva?</h3>
                        <p className="text-slate-400 text-center text-sm mb-6 leading-relaxed">
                            Our AI External will prepare you for the real deal. Choose your examiner's persona:
                        </p>

                        <div className="flex bg-slate-900/50 p-1 rounded-xl mb-8 border border-white/5">
                            {[
                                { id: 'The Guide', label: 'Easy', color: 'text-emerald-400' },
                                { id: 'Standard', label: 'Medium', color: 'text-sky-400' },
                                { id: 'The Griller', label: 'Hard', color: 'text-rose-400' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPersona(p.id)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${persona === p.id ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    <span className={persona === p.id ? p.color : ''}>{p.id}</span>
                                    <div className="text-[10px] opacity-60 font-medium">{p.label}</div>
                                </button>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Subject Name</label>
                                <Input
                                    id="viva-subject"
                                    name="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Data Structures & Algorithms"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Branch</label>
                                <Input
                                    id="viva-branch"
                                    name="branch"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    placeholder="e.g. Computer Engineering"
                                />
                            </div>
                            <Button onClick={handleStart} className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 mt-4 text-lg font-bold">
                                Start Examination
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-hidden flex flex-col bg-slate-800 rounded-3xl ring-1 ring-slate-700 shadow-xl">
                    {/* Header */}
                    <div className="p-4 bg-slate-900/50 border-b border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-emerald-500/50">
                                <Users size={20} className="text-emerald-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-200">External Examiner</h4>
                                <span className="text-[10px] uppercase text-emerald-400 font-black tracking-widest flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live Session
                                </span>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setIsStarted(false)} className="text-slate-400 hover:text-white">
                            <RefreshCw size={16} className="mr-2" /> Restart
                        </Button>
                    </div>

                    {/* Chat Area */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/10">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user'
                                    ? 'bg-violet-600 text-white rounded-tr-sm shadow-lg shadow-violet-900/20'
                                    : 'bg-slate-700 text-slate-100 rounded-tl-sm border border-slate-600'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text || (isLoading && idx === messages.length - 1 ? '...' : '')}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-slate-800 border-t border-slate-700">
                        <form onSubmit={handleSend} className="flex gap-3">
                            <Input
                                id="viva-chat-input"
                                name="vivaAnswer"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="State your answer clearly..."
                                className="flex-1 h-12 bg-slate-900/50"
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading || !input.trim()} className="px-6 bg-emerald-600 hover:bg-emerald-500 h-12">
                                <Send size={20} />
                            </Button>
                        </form>
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-500 font-medium">
                            <AlertCircle size={10} />
                            <span>Keep your answers technical and concise for better evaluation.</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VivaSimulator;
