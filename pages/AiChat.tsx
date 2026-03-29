import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Input, Button } from '../components/ui';
import CourseSelector from '../components/CourseSelector';
import { type ChatMessage } from '../types';
import { streamChat, streamStudyBuddyChat, extractTextFromFile, generateQuizQuestion } from '../services/geminiService';
import { trackToolUsage } from '../services/personalizationService';
import { startSession, endSession, recordQuizResult, getProductivityReport } from '../services/analyticsService';
import { createChatSession, addMessageToSession } from '../services/aiChatService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Bot, User, Send, Mic, Volume2, VolumeX, Lightbulb, Sparkles, Calendar, Image as ImageIcon, X, Paperclip, Target, Library, Brain } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';

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
const UPLOADED_QUIZ_CONTEXT_MAX_CHARS = parsePositiveInt(import.meta.env.VITE_AI_DOC_QUIZ_CONTEXT_MAX_CHARS, 12000);
const UPLOAD_MAX_FILE_MB = parsePositiveInt(import.meta.env.VITE_AI_DOC_MAX_FILE_MB, 10);

const ChatItem: React.FC<{ message: ChatMessage; onSpeak: (text: string) => void }> = ({ message, onSpeak }) => {
    const isModel = message.role === 'model';
    const text = message.parts.map(part => part.text).join('');

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}
        >
            {isModel && (
                <div className="flex-shrink-0 relative">
                    <div className="w-11 h-11 rounded-3xl bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center shadow-xl shadow-violet-500/30 ring-2 ring-white/10 overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <Brain className="w-6 h-6 text-white relative z-10" />
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3] 
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="absolute inset-0 bg-white/30 blur-md rounded-full"
                        />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
                        <Sparkles className="w-2.5 h-2.5 text-white animate-pulse" />
                    </div>
                </div>
            )}
            <div className={`flex flex-col gap-2 max-w-[85%] lg:max-w-xl`}>
                <div className={`p-4 rounded-2xl shadow-sm ${isModel ? 'bg-slate-800 rounded-tl-none border border-slate-700/50' : 'bg-sky-600 text-white rounded-br-none shadow-sky-500/10'}`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                </div>
                {isModel && text && (
                    <button onClick={() => onSpeak(text)} className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors self-start ml-2 mt-1">
                        <Volume2 size={12} /> Listen
                    </button>
                )}
            </div>
            {!isModel && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-slate-600 shadow-lg shadow-black/20">
                    <User className="w-5 h-5 text-slate-300" />
                </div>
            )}
        </motion.div>
    );
};

const getLocalizedMessage = (type: 'default' | 'weakness' | 'activeRecall' | 'feynman' | 'spacedRepetition' | 'notes', lang: string, params?: any) => {
    const isMr = lang === 'mr';
    const isHi = lang === 'hi';

    switch (type) {
        case 'default':
            if (isMr) return "नमस्कार! मी तुमचा AI ट्यूटर आहे. तुमच्या अलीकडील कामगिरीचे विश्लेषण करत आहे...";
            if (isHi) return "नमस्ते! मैं आपका AI ट्यूटर हूँ। आपके हालिया प्रदर्शन का विश्लेषण कर रहा हूँ...";
            return "Hello! I'm your AI Tutor. Analyzing your recent performance...";

        case 'weakness':
            if (isMr) return `नमस्कार! मी तुमचा AI ट्यूटर आहे. मला आढळले की '${params.topic}' मध्ये तुमची क्विझ अचूकता ${params.accuracy}% आहे. तुम्हाला याचे पुनरावलोकन करायचे आहे का? आपण फेनमन तंत्र वापरू शकतो किंवा मी तुमची चाचणी घेऊ शकतो.`;
            if (isHi) return `नमस्ते! मैं आपका AI ट्यूटर हूँ। मैंने देखा कि '${params.topic}' में आपकी क्विज़ सटीकता ${params.accuracy}% है। क्या आप इसकी समीक्षा करना चाहेंगे? हम फेनमैन तकनीक का उपयोग कर सकते हैं या मैं आपकी परीक्षा ले सकता हूँ।`;
            return `Hello! I'm your AI Tutor. I noticed your quiz accuracy in '${params.topic}' is around ${params.accuracy}%. Would you like to review it? We could try the Feynman Technique, or I can quiz you to practice active recall.`;

        case 'activeRecall':
            if (isMr) return `नमस्कार! मी "${params.topic}" वर ॲक्टिव्ह रिकॉलसाठी तयार आहे. मी तुम्हाला कठीण प्रश्न विचारेन. तयार आहात?`;
            if (isHi) return `नमस्ते! मैं "${params.topic}" पर एक्टिव रिकॉल के लिए तैयार हूँ। मैं आपसे कठिन प्रश्न पूछूंगा। तैयार हैं?`;
            return `Hello! I'm ready to help you with Active Recall on "${params.topic}". I'll ask you challenging questions to test your core understanding. Ready?`;

        case 'feynman':
            if (isMr) return `चला "${params.topic}" साठी फेनमन तंत्र वापरूया. मला हे सोप्या भाषेत समजावून सांगा—जसे मी १० वर्षांचा मुलगा आहे.`;
            if (isHi) return `आइए "${params.topic}" के लिए फेनमैन तकनीक का उपयोग करें। मुझे इसे सरल भाषा में समझाएं—जैसे कि मैं १० साल का बच्चा हूँ।`;
            return `Let's use the Feynman Technique for "${params.topic}". Start by explaining it to me in the simplest way you can—as if I'm 10 years old. I'll look for gaps in your explanation.`;

        case 'spacedRepetition':
            if (isMr) return `चला "${params.topic}" साठी स्पaced रिपिटेशन योजना बनवूया. मुख्य संकल्पना सुचवा, आणि मी वेळापत्रक बनवेन. पहिली संकल्पना काय आहे?`;
            if (isHi) return `आइए "${params.topic}" के लिए स्पaced रिपिटेशन योजना बनाएं। मुख्य अवधारणाओं का सुझाव दें, और मैं एक शेड्यूल बनाऊंगा। पहली अवधारणा क्या है?`;
            return `Let's set up a Spaced Repetition plan for "${params.topic}". List the core concepts you want to memorize, and I'll generate a quiz and review schedule. What's the first concept?`;

        case 'notes':
            if (isMr) return `मला दिसते की तुम्हाला या नोट्सचा अभ्यास करायचा आहे:\n\n---\n${params.noteContent}\n---\n\nतुम्हाला काय करायला आवडेल? आपण सारांश काढू शकतो किंवा मी तुमची परीक्षा घेऊ शकतो.`;
            if (isHi) return `मुझे दिख रहा है कि आप इन नोट्स का अध्ययन करना चाहते हैं:\n\n---\n${params.noteContent}\n---\n\nआप क्या करना चाहेंगे? हम सारांश निकाल सकते हैं या मैं आपकी परीक्षा ले सकता हूँ।`;
            return `I see you want to study this note:\n\n---\n${params.noteContent}\n---\n\nWhat would you like to do? We can summarize it, I can quiz you on it, or you can ask me questions.`;

        default:
            return "Hello! How can I help you?";
    }
};

const AiTutor: React.FC = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [studyMode, setStudyMode] = useState<'Normal' | 'Feynman Technique' | 'Spaced Repetition' | 'Active Recall'>('Normal');
    const [isAutoSpeaking, setIsAutoSpeaking] = useState(() => {
        try {
            return localStorage.getItem('nexusAutoSpeak') === 'true';
        } catch {
            return false;
        }
    });

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedDocument, setSelectedDocument] = useState<{ name: string; type: string; size: number } | null>(null);
    const [uploadedContext, setUploadedContext] = useState('');
    const [uploadedContextMeta, setUploadedContextMeta] = useState<{ name: string; truncated: boolean } | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const proactiveMessageSent = useRef(false);

    const getUserContext = () => {
        if (!user) return '';
        const parts = [
            `User: ${user.displayName || 'Student'}`,
            `Context: ${user.branch || 'Engineering'} ${user.year ? user.year + ' Year' : ''}`,
            `Subject: ${selectedCourse || 'General Study'}`
        ];
        if (user.learningGoals?.length) parts.push(`Goals: ${user.learningGoals.join(', ')}`);
        if (user.learningStyle) parts.push(`Learning Style: ${user.learningStyle}`);
        if (user.targetExam) parts.push(`Preparing for: ${user.targetExam}`);
        return `[SYSTEM_CONTEXT: ${parts.join(' | ')}]`;
    };

    const getInitialGreeting = () => {
        const isMr = language === 'mr';
        const isHi = language === 'hi';
        if (isMr) return "नमस्कार! मी तुमचा AI ट्यूटर आहे. आज आपण कोणता विषय शिकणार आहोत?";
        if (isHi) return "नमस्ते! मैं आपका AI ट्यूटर हूँ। आज हम कौन सा विषय सीखेंगे?";
        return `Hello! I'm your AI Tutor. I'm ready to help you with **${selectedCourse || 'your studies'}**. What's on your mind?`;
    };

    // Auto-scroll logic
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, quiz, isLoading]);

    // Analytics and Usage Tracking
    useEffect(() => {
        if (selectedCourse) {
            trackToolUsage('tutor');
            let analyticsSessionId: string | null = null;
            const start = async () => {
                analyticsSessionId = await startSession('tutor', selectedCourse);
            }
            start();
            return () => {
                if (analyticsSessionId) endSession(analyticsSessionId);
            }
        }
    }, [selectedCourse]);

    // Proactive Messages and Route State handling
    useEffect(() => {
        if (!selectedCourse) return;
        
        const checkForProactiveMessage = async () => {
            if (proactiveMessageSent.current) return;

            const report = await getProductivityReport();
            let initialPrompt = getInitialGreeting();

            if (report && report.weaknesses && report.weaknesses.length > 0) {
                const weakestTopic = report.weaknesses.find(w => w.topic.toLowerCase().includes(selectedCourse.toLowerCase())) || report.weaknesses[0];
                initialPrompt = getLocalizedMessage('weakness', language, { topic: weakestTopic.topic, accuracy: weakestTopic.accuracy });
            }

            setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
            proactiveMessageSent.current = true;
        };

        if (location.state?.technique && location.state?.topic) {
            const { technique, topic } = location.state;
            let initialPrompt = '';
            switch (technique) {
                case 'Active Recall': setStudyMode('Active Recall'); initialPrompt = getLocalizedMessage('activeRecall', language, { topic }); break;
                case 'Feynman Technique': setStudyMode('Feynman Technique'); initialPrompt = getLocalizedMessage('feynman', language, { topic }); break;
                case 'Spaced Repetition': setStudyMode('Spaced Repetition'); initialPrompt = getLocalizedMessage('spacedRepetition', language, { topic }); break;
            }
            if (initialPrompt) {
                setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
                navigate(location.pathname, { replace: true, state: {} });
                proactiveMessageSent.current = true;
            }
        } else if (location.state?.noteContent) {
            const { noteContent } = location.state;
            const initialPrompt = getLocalizedMessage('notes', language, { noteContent });
            setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
            navigate(location.pathname, { replace: true, state: {} });
            proactiveMessageSent.current = true;
        } else {
            checkForProactiveMessage();
        }
    }, [selectedCourse, location.state, language]);

    const handleSend = useCallback(async (messageToSend?: string, isVoiceInput = false) => {
        const currentMessage = messageToSend || input;
        if (!currentMessage.trim() || isLoading || isExtracting || !selectedCourse) return;

        speechSynthesis.cancel();

        const newUserMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: currentMessage }],
            attachment: selectedDocument ? { ...selectedDocument } : undefined
        };
        const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        
        setMessages(prev => [...prev, newUserMessage, newModelMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);
        setQuiz(null);

        if (sessionId) {
            addMessageToSession(sessionId, [newUserMessage]).catch(e => console.error(e));
        } else {
            createChatSession(`Tutor: ${selectedCourse}`, [newUserMessage]).then(s => setSessionId(s._id));
        }

        try {
            let contextPrompt = currentMessage;
            if (studyMode === 'Feynman Technique') contextPrompt = `[MODE: FEYNMAN] ${currentMessage}`;
            else if (studyMode === 'Spaced Repetition') contextPrompt = `[MODE: SPACED REPETITION] ${currentMessage}`;
            else if (studyMode === 'Active Recall') contextPrompt = `[MODE: ACTIVE RECALL] ${currentMessage}`;

            if (!uploadedContext.trim()) {
                const userContext = getUserContext();
                contextPrompt = `${userContext}\n\n${contextPrompt}`;
            }

            const stream = uploadedContext.trim()
                ? await streamStudyBuddyChat(contextPrompt, uploadedContext, language)
                : await streamChat(contextPrompt, undefined, undefined, language);

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

            if (sessionId && modelResponse) {
                addMessageToSession(sessionId, [{ role: 'model', parts: [{ text: modelResponse }] }]);
            }
            if (modelResponse && (isAutoSpeaking || isVoiceInput)) handleSpeak(modelResponse);
        } catch (err: any) {
            const msg = err.message?.includes('429') ? 'AI Quota limit reached. Wait 60s.' : 'Failed to connect to AI.';
            setError(msg);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: msg }] }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, isExtracting, selectedCourse, studyMode, uploadedContext, language, sessionId, selectedDocument, isAutoSpeaking]);

    const handleAnswerQuiz = async (selectedIndex: number) => {
        if (!quiz) return;
        const isCorrect = selectedIndex === quiz.correctOptionIndex;
        await recordQuizResult(quiz.topic, isCorrect, selectedCourse, quiz.question, quiz.options[selectedIndex], quiz.options[quiz.correctOptionIndex]);
        const feedback = isCorrect ? "✅ Correct! Great job." : `❌ Not quite. Correct: "${quiz.options[quiz.correctOptionIndex]}"`;
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: feedback }] }]);
        setQuiz(prev => prev ? { ...prev, userAnswerIndex: selectedIndex } : null);
        setTimeout(() => setQuiz(null), 3500);
    };

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
            const base64 = dataUrl.split(',')[1];
            const text = await extractTextFromFile(base64, file.type);
            setUploadedContext(text.slice(0, UPLOADED_CONTEXT_MAX_CHARS));
            setUploadedContextMeta({ name: file.name, truncated: text.length > UPLOADED_CONTEXT_MAX_CHARS });
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `📄 Loaded **${file.name}**. I'll study this with you.` }] }]);
        } catch { setError("Failed to read file."); }
        finally { setIsExtracting(false); }
    };

    const handleListen = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setInput(transcript);
            handleSend(transcript, true);
        };
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

    return (
        <div className="h-full flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-2">
                <div className="flex items-center gap-4">
                    <PageHeader title="AI Tutor" subtitle="Master any subject with personalized AI guidance." />
                    {studyMode !== 'Normal' && (
                        <div className="bg-violet-600/20 text-violet-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ring-violet-500/50 flex items-center gap-1 animate-pulse">
                            <Sparkles size={12} /> {studyMode}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => navigate('/topic-predictor')} className="text-amber-400 hover:bg-amber-400/10"><Target size={14} className="mr-1" /> Trends</Button>
                    <CourseSelector selectedCourse={selectedCourse} onCourseChange={setSelectedCourse} />
                </div>
            </div>

            <div className="flex-1 bg-slate-900/40 border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden relative">
                <AnimatePresence>
                    {!selectedCourse && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                        >
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-24 h-24 bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/20 ring-4 ring-white/5"
                            >
                                <Library className="w-12 h-12 text-white" />
                            </motion.div>
                            <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Initialize Your Session</h3>
                            <p className="max-w-xs text-slate-400 text-sm mb-10 leading-relaxed font-medium">
                                Select a subject to unlock personalized tutoring, MU-specific insights, and deep-dive explanations.
                            </p>
                            <div className="w-full max-w-sm transform scale-125">
                                <CourseSelector 
                                    selectedCourse={selectedCourse} 
                                    onCourseChange={(c) => {
                                        if (c) {
                                            setSelectedCourse(c);
                                            setMessages([{ role: 'model', parts: [{ text: `Session initialized for **${c.toUpperCase()}**. How can I help you today?` }] }]);
                                        }
                                    }} 
                                />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {messages.map((msg, idx) => <ChatItem key={idx} message={msg} onSpeak={handleSpeak} />)}
                    {isLoading && !quiz && (
                        <div className="flex items-start gap-4 my-6 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><Bot size={20} className="text-slate-500" /></div>
                            <div className="bg-slate-800/50 h-12 w-32 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    {quiz && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="my-6 p-6 bg-slate-800 border border-violet-500/30 rounded-2xl shadow-xl shadow-black/40"
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded border border-violet-500/20">Active Recall</span>
                                <span className="text-slate-500 text-xs font-bold uppercase tracking-tighter">{quiz.topic}</span>
                            </div>
                            <h4 className="text-lg font-bold text-slate-100 mb-6 leading-snug">{quiz.question}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {quiz.options.map((option, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleAnswerQuiz(i)}
                                        disabled={quiz.userAnswerIndex !== undefined}
                                        className={`p-4 text-left text-sm rounded-xl font-medium transition-all ${
                                            quiz.userAnswerIndex === undefined 
                                            ? 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                                            : i === quiz.correctOptionIndex 
                                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-lg shadow-emerald-500/10'
                                                : i === quiz.userAnswerIndex 
                                                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                                                    : 'bg-slate-900/50 border-slate-800 opacity-50'
                                        }`}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-slate-900 border-t border-slate-700/50">
                    {uploadedContextMeta && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-slate-800/80 rounded-lg border border-slate-700 w-fit">
                            <ImageIcon size={14} className="text-sky-400" />
                            <span className="text-[11px] font-bold text-slate-300">{uploadedContextMeta.name}</span>
                            <button onClick={() => { setUploadedContext(''); setUploadedContextMeta(null); }} className="text-slate-500 hover:text-white ml-2"><X size={14} /></button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <label className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl border border-slate-700 transition-colors cursor-pointer group">
                            <input type="file" onChange={handleImageUpload} className="hidden" />
                            <Paperclip size={20} className="text-slate-400 group-hover:text-white" />
                        </label>
                        <div className="flex-1 relative">
                            <Input 
                                value={input}
                                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type your doubt or paste notes..."
                                className="w-full bg-slate-800 border-slate-700 focus:border-violet-500/50 py-6 pr-20 text-sm font-medium"
                                disabled={isLoading || !selectedCourse}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <span className={`text-[9px] font-black ${input.length > 1800 ? 'text-amber-500' : 'text-slate-500'}`}>
                                    {input.length}/2000
                                </span>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleSend()} 
                                    disabled={!input.trim() || isLoading}
                                    className="bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20 p-2 h-9 w-9 rounded-lg"
                                >
                                    <Send size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleListen} className={`p-3 rounded-xl border border-slate-700 transition-all ${isListening ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                <Mic size={20} />
                            </button>
                            <button 
                                onClick={() => setIsAutoSpeaking(!isAutoSpeaking)}
                                className={`p-3 rounded-xl border border-slate-700 transition-all ${isAutoSpeaking ? 'bg-sky-500/20 border-sky-500/50 text-sky-500' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                            >
                                {isAutoSpeaking ? <Volume2 size={20} /> : <VolumeX size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {error && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-full shadow-2xl animate-in fade-in slide-in-from-top-4">
                    {error}
                </div>
            )}
        </div>
    );
};

export default AiTutor;
