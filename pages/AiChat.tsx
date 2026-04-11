import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Input, Button } from '../components/ui';
import CourseSelector from '../components/CourseSelector';
import { type ChatMessage } from '../types';
import { streamChat, streamStudyBuddyChat, extractTextFromFile } from '../services/geminiService';
import { trackToolUsage } from '../services/personalizationService';
import { startSession, endSession, recordQuizResult, getProductivityReport } from '../services/analyticsService';
import { createChatSession, addMessageToSession } from '../services/aiChatService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getCourses } from '../services/courseService';
import { GraduationCap, User, Send, Mic, Volume2, VolumeX, Sparkles, Image as ImageIcon, X, Paperclip, Target, Library, Trash2, Save, Edit, Download, PlusCircle, MessageSquare, Lightbulb, Bot, Calendar, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { XPBar } from '../components/gamification/XPComponents';
import PageLayout from '../components/ui/PageLayout';

interface Quiz {
    topic: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    userAnswerIndex?: number;
}

const parsePositiveInt = (value: unknown, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const UPLOADED_CONTEXT_MAX_CHARS = parsePositiveInt(import.meta.env.VITE_AI_DOC_CONTEXT_MAX_CHARS, 24000);
const UPLOAD_MAX_FILE_MB = parsePositiveInt(import.meta.env.VITE_AI_DOC_MAX_FILE_MB, 10);

const ChatItem: React.FC<{ message: ChatMessage; onSpeak: (text: string) => void }> = ({ message, onSpeak }) => {
    const isModel = message.role === 'model';
    const text = message.parts.map(part => part.text).join('');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 mb-5 ${isModel ? '' : 'flex-row-reverse'}`}
        >
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-white/10 ${
                isModel ? 'bg-gradient-to-tr from-violet-600 to-sky-500' : 'bg-slate-700'
            }`}>
                {isModel ? <GraduationCap className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-slate-300" />}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[80%] lg:max-w-[720px] ${isModel ? 'items-start' : 'items-end'}`}>
                <div className={`px-4 py-3 rounded-2xl shadow-sm text-[13.5px] leading-relaxed ${
                    isModel ? 'bg-slate-800 border border-slate-700/50 text-slate-200 rounded-tl-none' 
                           : 'bg-sky-600 text-white rounded-tr-none'
                }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                </div>
                {isModel && text && (
                    <button onClick={() => onSpeak(text)} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-all hover:bg-slate-800/50">
                        <Volume2 size={11} /> Listen
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const AiTutor: React.FC = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedCourse, setSelectedCourse] = useState<string | null>(() => location.state?.courseId || null);
    const [courses, setCourses] = useState<any[]>([]);
    const [showOptions, setShowOptions] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try { setCourses(await getCourses()); }
            catch (err) { console.error("Failed to fetch courses", err); }
        };
        fetchCourses();
    }, []);

    const selectedCourseName = selectedCourse ? courses.find(c => c.id === selectedCourse)?.name || 'Course' : null;
    const [isListening, setIsListening] = useState(false);
    const [studyMode, setStudyMode] = useState<'Normal' | 'Feynman Technique' | 'Spaced Repetition' | 'Active Recall'>('Normal');
    const [isAutoSpeaking, setIsAutoSpeaking] = useState(() => localStorage.getItem('nexusAutoSpeak') === 'true');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<{ name: string; type: string; size: number } | null>(null);
    const [uploadedContext, setUploadedContext] = useState('');
    const [uploadedContextMeta, setUploadedContextMeta] = useState<{ name: string; truncated: boolean } | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

    const handleSend = useCallback(async (messageToSend?: string, isVoiceInput = false) => {
        const currentMessage = messageToSend || input;
        if (!currentMessage.trim() || isLoading || isExtracting || !selectedCourse) return;

        speechSynthesis.cancel();
        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: currentMessage }], attachment: selectedDocument ? { ...selectedDocument } : undefined };
        const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        
        setMessages(prev => [...prev, newUserMessage, newModelMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = uploadedContext.trim()
                ? await streamStudyBuddyChat(currentMessage, uploadedContext, language)
                : await streamChat(currentMessage, undefined, undefined, language);

            if (!stream) throw new Error("Stream failed");
            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let modelResponse = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.trim().startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.trim().slice(6));
                            if (data.text) {
                                modelResponse += data.text;
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'model') last.parts = [{ text: modelResponse }];
                                    return next;
                                });
                            }
                        } catch {}
                    }
                }
            }
            if (modelResponse && (isAutoSpeaking || isVoiceInput)) handleSpeak(modelResponse);
        } catch (err: any) {
            setError('Connection failed.');
        } finally { setIsLoading(false); }
    }, [input, isLoading, isExtracting, selectedCourse, uploadedContext, language, selectedDocument, isAutoSpeaking]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || file.size > UPLOAD_MAX_FILE_MB * 1024 * 1024) return;
        setSelectedDocument({ name: file.name, type: file.type, size: file.size });
        setIsExtracting(true);
        try {
            const reader = new FileReader();
            const dataUrl = await new Promise<string>((res) => {
                reader.onload = () => res(reader.result as string);
                reader.readAsDataURL(file);
            });
            const text = await extractTextFromFile(dataUrl.split(',')[1], file.type);
            setUploadedContext(text.slice(0, UPLOADED_CONTEXT_MAX_CHARS));
            setUploadedContextMeta({ name: file.name, truncated: text.length > UPLOADED_CONTEXT_MAX_CHARS });
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Loaded **${file.name}**. What's the plan?` }] }]);
        } catch { setError("Failed to read file."); } finally { setIsExtracting(false); }
    };

    const handleListen = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.onresult = (e: any) => { setInput(e.results[0][0].transcript); handleSend(e.results[0][0].transcript, true); };
        recognition.start();
        setIsListening(true);
        recognition.onend = () => setIsListening(false);
    };

    const handleSpeak = (text: string) => {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        speechSynthesis.speak(u);
    };

    // UI Structure following the user's grid logic
    const MainContent = (
        <div className="h-[calc(100vh-140px)] min-h-0 flex flex-col bg-[#0b1020] rounded-[24px] border border-white/5 overflow-hidden shadow-2xl relative">
            {/* 1. Header Area - Fixed */}
            <header className="flex-shrink-0 px-6 py-5 border-b border-white/5 bg-[#0e1428]/80 backdrop-blur-xl z-20">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20">
                        <Bot className="w-6 h-6 text-violet-400" />
                    </div>
                    <div>
                        <h2 className="text-[15px] font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                            {selectedCourseName ? `AI Tutor: ${selectedCourseName.toUpperCase()}` : "AI Mentor"}
                        </h2>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Neural Network Active
                        </p>
                    </div>
                </div>
            </header>

            {/* 2. Message Area - SCROLLABLE & BOUNDED */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-6 py-6 scroll-smooth custom-scrollbar bg-slate-900/10">
                <AnimatePresence mode="wait">
                    {!selectedCourse ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <Bot className="w-12 h-12 text-slate-700 mb-4" />
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Course context required to start learning</h3>
                            <div className="w-64 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
                                <CourseSelector selectedCourse={selectedCourse} onCourseChange={setSelectedCourse} />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col min-h-full">
                            {messages.length === 0 && !isLoading && (
                                <div className="flex flex-col items-center justify-center flex-1 opacity-20">
                                    <Sparkles size={40} className="text-violet-500 mb-2" />
                                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Locked on {selectedCourseName}</p>
                                </div>
                            )}
                            
                            {messages.map((msg, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <ChatItem message={msg} onSpeak={handleSpeak} />
                                    {msg.role === 'model' && msg.parts.map(p => p.text).join('').length > 10 && idx === messages.length - 1 && !isLoading && (
                                        <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-2 ml-14 mb-4">
                                            {['Explain simpler', 'Give example', 'Quiz me', 'Next topic'].map(cmd => (
                                                <button
                                                    key={cmd}
                                                    onClick={() => handleSend(`${cmd} about this concept`)}
                                                    className="px-3 py-1.5 bg-slate-800/80 hover:bg-violet-600 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white rounded-lg border border-white/5 transition-all shadow-sm active:scale-95"
                                                >
                                                    {cmd}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </div>
                            ))}

                            {isLoading && (
                                <div className="flex items-start gap-4 my-2 ml-1">
                                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700/50 flex items-center justify-center"><Spinner size={12} className="text-violet-500" /></div>
                                    <div className="bg-slate-800/40 h-8 w-16 rounded-2xl rounded-tl-none border border-white/5 flex items-center justify-center gap-1">
                                        <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce [animation-delay:0s]" />
                                        <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                        <span className="w-1 h-1 bg-violet-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} className="h-6 flex-shrink-0" />
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Input Zone - FIXED AT BOTTOM */}
            <div className="flex-shrink-0 p-5 bg-[#0e1428]/95 border-t border-white/5 backdrop-blur-3xl z-20">
                <AnimatePresence>
                    {showOptions && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-4">
                            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-950/40 rounded-2xl border border-white/5">
                                <div className="flex-1 min-w-[150px]">
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Active Neural Mode</p>
                                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                        {['Normal', 'Feynman Technique', 'Active Recall', 'Spaced Repetition'].map(m => (
                                            <button 
                                                key={m}
                                                onClick={() => setStudyMode(m as any)}
                                                className={`px-3 py-2 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all shrink-0 border ${studyMode === m ? 'bg-violet-600 border-violet-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-slate-300'}`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {uploadedContextMeta && (
                    <div className="flex items-center gap-2 mb-4 p-2 bg-slate-900/60 rounded-xl border border-white/5 w-fit">
                        <Paperclip size={12} className="text-violet-400" />
                        <span className="text-[10px] font-bold text-slate-300">{uploadedContextMeta.name}</span>
                        <button onClick={() => { setUploadedContext(''); setUploadedContextMeta(null); setSelectedDocument(null); }} className="p-1 hover:bg-slate-700 rounded-md transition-colors"><X size={12} /></button>
                    </div>
                )}
                
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowOptions(!showOptions)} className={`p-4 rounded-xl border transition-all ${showOptions ? 'bg-violet-600/20 border-violet-500/50 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.15)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}>
                        <Target size={20} />
                    </button>
                    
                    <div className="flex-1 relative">
                        <Input 
                            value={input}
                            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder={`Message Tutor...`}
                            className="w-full bg-slate-950/60 border-white/5 focus:border-violet-500/40 py-7 pl-6 pr-16 text-[14px] rounded-2xl shadow-inner scroll-smooth"
                            disabled={isLoading}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pr-1">
                           <Button size="sm" onClick={() => handleSend()} disabled={!input.trim() || isLoading || !selectedCourse} className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/20 p-2.5 h-11 w-11 rounded-xl transition-all active:scale-95">
                               <Send size={18} />
                           </Button>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <label className="p-4 bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-white/5 cursor-pointer transition-colors group">
                            <input type="file" onChange={handleImageUpload} className="hidden" />
                            <Paperclip size={20} className="text-slate-500 group-hover:text-white" />
                        </label>
                        <button onClick={handleListen} className={`p-4 rounded-xl border transition-all ${isListening ? 'bg-rose-500/20 border-rose-500/30 text-rose-500 animate-pulse outline outline-rose-500/10' : 'bg-slate-900 border-white/5 text-slate-500 hover:text-white'}`}>
                            <Mic size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const SideContent = (
        <div className="space-y-6 flex flex-col h-full min-h-0">
            <div className="p-5 bg-slate-900/40 rounded-[22px] border border-white/[0.04]">
                <p className="eyebrow-label mb-4">Learning Context</p>
                <CourseSelector selectedCourse={selectedCourse} onCourseChange={setSelectedCourse} />
            </div>

            <div className="p-5 bg-slate-900/40 rounded-[22px] border border-white/[0.04] flex-1 min-h-0">
                <div className="flex items-center gap-2 mb-4">
                    <Target size={14} className="text-violet-500" />
                    <p className="eyebrow-label">Progress Analytics</p>
                </div>
                <div className="space-y-4">
                    <XPBar xp={1240} level={4} nextLevelXP={2000} />
                    <div className="bg-violet-500/5 p-4 rounded-2xl border border-violet-500/10">
                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1">Current Protocol</p>
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Neural drive optimized for **{studyMode}**. Feedback will prioritize high-retention logic.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <PageLayout 
            main={MainContent}
            side={SideContent}
            containerClassName="h-[calc(100vh-80px)] min-h-0 px-8"
            mainClassName="h-full min-h-0 py-0"
            sideClassName="h-full min-h-0 py-0"
        />
    );
};

export default AiTutor;
