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
import { Spinner } from '../components/ui';
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
            className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}
        >
            {isModel && (
                <div className="flex-shrink-0 relative">
                    <div className="w-11 h-11 rounded-3xl bg-gradient-to-tr from-violet-600 to-sky-500 flex items-center justify-center shadow-xl shadow-violet-500/30 ring-2 ring-white/10 overflow-hidden group">
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <GraduationCap className="w-6 h-6 text-white relative z-10" />
                        <motion.div 
                            animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3] 
                            }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="absolute inset-0 bg-white/30 blur-md rounded-full"
                        />
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
                    <button onClick={() => onSpeak(text)} className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-violet-400 transition-colors self-start ml-2 mt-1">
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

function getLocalizedMessage(type: 'default' | 'courseSelected' | 'weakness' | 'activeRecall' | 'feynman' | 'spacedRepetition' | 'notes', lang: string, params?: any): string {
  const isMr = lang === 'mr';
  const isHi = lang === 'hi';

  switch (type) {
    case 'default':
      if (isMr) return "नमस्कार! मी तुमचा AI ट्यूटर आहे. कृपया आपण कशाबद्दल बोलूया हे निवडण्यासाठी एक विषय निवडा.";
      if (isHi) return "नमस्ते! मैं आपका AI ट्यूटर हूँ। कृपया हम किस बारे में बात करें, यह चुनने के लिए एक विषय चुनें।";
      return "Hello! I'm your AI Tutor. Choose a course context below to begin our session.";

    case 'courseSelected':
      if (isMr) return `छान! आपण ${params.course} वर लक्ष केंद्रित करत आहोत. मी कशात मदत करू शकतो?`;
      if (isHi) return `बढ़िया! हम ${params.course} पर ध्यान केंद्रित कर रहे हैं। मैं किस प्रकार मदद कर सकता हूँ?`;
      return `Awesome! I'm now helping you with **${params.course}** 📘. What would you like to learn today?`;

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
}

const AiTutor: React.FC = () => {
    const { language, t } = useLanguage();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedCourse, setSelectedCourse] = useState<string | null>(() => {
        return location.state?.courseId || null;
    });
    const [courses, setCourses] = useState<any[]>([]);
    const [sessionStarted, setSessionStarted] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await getCourses();
                setCourses(data);
            } catch (err) {
                console.error("Failed to fetch courses", err);
            }
        };
        fetchCourses();
    }, []);

    const selectedCourseName = selectedCourse 
        ? courses.find(c => c.id === selectedCourse)?.name || (selectedCourse.length > 20 ? 'Current Course' : selectedCourse)
        : null;
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

    const suggestions = [
        { label: 'Review weak topic', prompt: 'I want to review my weakest topics in this course.' },
        { label: 'Quiz me now', prompt: 'Give me a quick 5-question quiz on the current module.' },
        { label: 'Explain simply', prompt: 'Can you explain the core concepts of this subject like I am a beginner?' },
        { label: 'Use Feynman method', prompt: 'I want to try the Feynman Technique for a specific topic.' }
    ];

    const getUserContext = () => {
        if (!user) return '';
        const parts = [
            `User: ${user.displayName || 'Student'}`,
            `Context: ${user.branch || 'Engineering'} ${user.year ? user.year + ' Year' : ''}`,
            `Subject: ${selectedCourseName || 'General Study'}`
        ];
        if (user.learningGoals?.length) parts.push(`Goals: ${user.learningGoals.join(', ')}`);
        if (user.learningStyle) parts.push(`Learning Style: ${user.learningStyle}`);
        if (user.targetExam) parts.push(`Preparing for: ${user.targetExam}`);
        return `[SYSTEM_CONTEXT: ${parts.join(' | ')}]`;
    };

    const getInitialGreeting = () => {
        const isMr = language === 'mr';
        const isHi = language === 'hi';
        
        if (!selectedCourse) {
            if (isMr) return "नमस्कार! मी तुमचा AI ट्यूटर आहे. सुरुवात करण्यासाठी कृपया खालीलपैकी एक विषय निवडा.";
            if (isHi) return "नमस्ते! मैं आपका AI ट्यूटर हूँ। शुरू करने के लिए कृपया नीचे दिए गए विषयों में से एक चुनें।";
            return "Hello! I'm your AI Tutor. Select a course context below to unlock personalized learning tools.";
        }

        if (isMr) return `नमस्कार! आपण आता ${selectedCourseName} वर लक्ष केंद्रित करत आहोत. आपण काय सुरू करूया?`;
        if (isHi) return `नमस्ते! अब हम ${selectedCourseName} पर ध्यान केंद्रित कर रहे हैं। हम क्या शुरू करें?`;
        return `Helping you with **${selectedCourseName}** 📘. What would you like to learn today?`;
    };

    useEffect(() => {
        // Auto-start session greeting if it hasn't been sent for THIS course
        handleStartSession();
    }, [selectedCourse]);

    const handleStartSession = async () => {
        setIsLoading(true);
        let initialPrompt = getInitialGreeting();
        try {
            const report = await getProductivityReport();
            if (report && report.weaknesses && report.weaknesses.length > 0 && selectedCourse) {
                const weakestTopic = report.weaknesses.find(w => w.topic.toLowerCase().includes(selectedCourse.toLowerCase())) || report.weaknesses[0];
                initialPrompt = getLocalizedMessage('weakness', language, { topic: weakestTopic.topic, accuracy: weakestTopic.accuracy });
            }
        } catch (e) {
            console.error("Failed to fetch report for greeting:", e);
        }

        setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
        setIsLoading(false);
        proactiveMessageSent.current = true;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, quiz, isLoading]);

    useEffect(() => {
        if (selectedCourse && sessionStarted) {
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
    }, [selectedCourse, sessionStarted]);

    useEffect(() => {
        if (!selectedCourse) return;
        
        if (location.state?.technique && location.state?.topic) {
            const { technique, topic } = location.state;
            let initialPrompt = '';
            switch (technique) {
                case 'Active Recall': setStudyMode('Active Recall'); initialPrompt = getLocalizedMessage('activeRecall', language, { topic }); break;
                case 'Feynman Technique': setStudyMode('Feynman Technique'); initialPrompt = getLocalizedMessage('feynman', language, { topic }); break;
                case 'Spaced Repetition': setStudyMode('Spaced Repetition'); initialPrompt = getLocalizedMessage('spacedRepetition', language, { topic }); break;
            }
            if (initialPrompt) {
                setSessionStarted(true);
                setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
                navigate(location.pathname, { replace: true, state: {} });
                proactiveMessageSent.current = true;
            }
        } else if (location.state?.noteContent) {
            const { noteContent } = location.state;
            const initialPrompt = getLocalizedMessage('notes', language, { noteContent });
            setSessionStarted(true);
            setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
            navigate(location.pathname, { replace: true, state: {} });
            proactiveMessageSent.current = true;
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
        await recordQuizResult(quiz.topic, isCorrect, selectedCourse || 'General', quiz.question, quiz.options[selectedIndex], quiz.options[quiz.correctOptionIndex]);
        const feedback = isCorrect ? "Correct! Great job." : `Not quite. Correct: "${quiz.options[quiz.correctOptionIndex]}"`;
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
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: `Loaded **${file.name}**. I'll study this with you.` }] }]);
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

    const MainContent = (
        <div className="h-full flex flex-col bg-slate-800/30 rounded-2xl border border-white/[0.06] overflow-hidden relative">
            <div className="p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
                <PageHeader 
                    title={selectedCourseName ? `Personalized ${selectedCourseName.toUpperCase()} Tutor` : "Unified AI Study Buddy"}
                    subtitle={selectedCourseName ? `Focused active recall for your ${selectedCourseName} curriculum` : "General academic assistant for all subjects"}
                    icon={<Bot className="w-8 h-8 text-violet-400" strokeWidth={1.5} />}
                />
            </div>

            <motion.div 
                key="chat-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-1 flex flex-col overflow-hidden"
            >
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {!selectedCourse && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-white/[0.03] my-4 mx-2">
                            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl relative shadow-violet-900/10">
                                <Bot className="w-8 h-8 text-violet-400" />
                                <div className="absolute inset-0 bg-violet-600/5 blur-2xl rounded-full" />
                            </div>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4 leading-tight">Focus Context Required</h3>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-10 max-w-[280px] leading-relaxed italic">
                                Select a subject to initialize the AI engine and unlock your course profile.
                            </p>
                            
                            <div className="w-full max-w-sm bg-slate-950/40 p-5 rounded-2xl border border-white/5 mb-8">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3 text-left px-1 italic">Target Course:</p>
                                <CourseSelector 
                                    selectedCourse={selectedCourse} 
                                    onCourseChange={setSelectedCourse} 
                                />
                            </div>

                            <motion.div 
                                animate={{ x: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="flex items-center gap-3 text-violet-500/80 bg-violet-600/5 px-6 py-3 rounded-full border border-violet-500/10"
                            >
                                <ArrowRight size={14} className="rotate-180" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] italic">Or use General Mode (All Subjects)</span>
                                <ArrowRight size={14} />
                            </motion.div>
                        </div>
                    )}

                    {messages.length === 0 && selectedCourse && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-white/5 flex items-center justify-center mb-4">
                                <Bot className="w-8 h-8 text-violet-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">AI Assistant Online</h3>
                            <p className="text-xs text-slate-500 max-w-[240px]">Context established for <b>{selectedCourse}</b>. How can I facilitate your learning today?</p>
                        </div>
                    )}
                    {messages.map((msg, idx) => <ChatItem key={idx} message={msg} onSpeak={handleSpeak} />)}
                    
                    {messages.length === 1 && messages[0].role === 'model' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 ml-14"
                        >
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 italic">Quick Learning Actions:</p>
                            <div className="flex flex-wrap gap-2">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s.prompt)}
                                        className="px-5 py-3 bg-violet-600/5 hover:bg-violet-600 hover:text-white border border-violet-500/10 rounded-2xl text-[10px] font-black uppercase tracking-tight italic transition-all active:scale-95"
                                    >
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {isLoading && !quiz && (
                        <div className="flex items-start gap-4 my-6 animate-pulse">
                            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700"><GraduationCap size={20} className="text-slate-500" /></div>
                            <div className="bg-slate-800/50 h-12 w-32 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-1.5 h-1.5 bg-slate-600 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Zone - Optimized for Workspace */}
                <div className="p-4 bg-slate-900/60 border-t border-white/[0.06] backdrop-blur-md">
                    {/* Compact Options Strip */}
                    <AnimatePresence>
                        {showOptions && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden mb-4"
                            >
                                <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-950/40 rounded-2xl border border-white/5">
                                    <div className="flex-1 min-w-[150px]">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 mx-1">Study Technique</p>
                                        <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                                            {['Normal', 'Feynman Technique', 'Active Recall', 'Spaced Repetition'].map(m => (
                                                <button 
                                                    key={m}
                                                    onClick={() => setStudyMode(m as any)}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all shrink-0 ${studyMode === m ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
                                                >
                                                    {m.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="h-8 w-px bg-white/5 hidden sm:block" />
                                    <div className="w-full sm:w-auto">
                                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 mx-1">Audio Bridge</p>
                                        <button 
                                            onClick={() => setIsAutoSpeaking(!isAutoSpeaking)}
                                            className={`flex items-center gap-2 w-full sm:w-auto px-4 py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all ${
                                                isAutoSpeaking ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-slate-800 border-white/5 text-slate-500'
                                            }`}
                                        >
                                            {isAutoSpeaking ? <Volume2 size={12} /> : <VolumeX size={12} />}
                                            {isAutoSpeaking ? 'Live Speak' : 'Silent'}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {uploadedContextMeta && (
                        <div className="flex items-center gap-2 mb-4 p-2 bg-slate-800/80 rounded-lg border border-slate-700 w-fit">
                            <ImageIcon size={14} className="text-sky-400" />
                            <span className="text-xs font-bold text-slate-300">{uploadedContextMeta.name}</span>
                            <button onClick={() => { setUploadedContext(''); setUploadedContextMeta(null); }} className="text-slate-500 hover:text-white ml-2"><X size={14} /></button>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setShowOptions(!showOptions)}
                            className={`p-3.5 rounded-xl border transition-all ${showOptions ? 'bg-violet-600/20 border-violet-500/50 text-violet-400' : 'bg-slate-800/80 border-white/5 text-slate-400 hover:text-white'}`}
                            title="Session Options"
                        >
                            <Target size={18} />
                        </button>
                        
                        <div className="flex-1 relative">
                            {/* Removed hard block on chat for General Mode/No course to allow universal inquiries */}
                            <Input 
                                id="chat-input-field"
                                name="chatInput"
                                value={input}
                                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={selectedCourseName ? `Ask anything about ${selectedCourseName.toUpperCase()}...` : "Select a course or ask a general query..."}
                                className="w-full bg-slate-950/40 border-white/5 focus:border-violet-500/50 py-7 pr-24 text-[13px] font-medium placeholder:text-slate-600"
                                disabled={isLoading}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                                <span className={`text-[10px] font-black tracking-tighter ${input.length > 1800 ? 'text-amber-500' : 'text-slate-600'}`}>
                                    {input.length}/2K
                                </span>
                                <Button 
                                    size="sm" 
                                    onClick={() => handleSend()} 
                                    disabled={!input.trim() || isLoading || !selectedCourse}
                                    className="bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-600/20 p-2 h-10 w-10 rounded-xl transition-all active:scale-90"
                                >
                                    <Send size={16} />
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <label htmlFor="chat-file-input" className="p-3.5 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-white/5 transition-colors cursor-pointer group">
                                <input id="chat-file-input" name="chatFileInput" type="file" onChange={handleImageUpload} className="hidden" />
                                <Paperclip size={18} className="text-slate-400 group-hover:text-white" />
                            </label>
                            <button 
                                onClick={handleListen} 
                                aria-label="Voice input"
                                className={`p-3.5 rounded-xl border transition-all ${isListening ? 'bg-rose-500/20 border-rose-500/50 text-rose-500 animate-pulse' : 'bg-slate-800/80 border-white/5 text-slate-400 hover:text-white'}`}
                            >
                                <Mic size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );

    const SideContent = (
        <div className="space-y-6">
            {/* 1. SUBJECT COMMAND ROLL */}
            <div className="p-4 bg-slate-900/40 rounded-2xl border border-white/[0.06]">
                <p className="eyebrow-label mb-3">Active Course</p>
                <CourseSelector 
                    selectedCourse={selectedCourse} 
                    onCourseChange={setSelectedCourse} 
                />
            </div>

            {/* 3. EXPERIENCE & SYNC */}
            <div className="p-5 bg-slate-900/40 rounded-2xl border border-white/[0.06] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-[40px] rounded-full" />
                <div className="flex items-center gap-2 mb-4">
                    <Target size={14} className="text-violet-500" />
                    <p className="eyebrow-label">Neural Progress</p>
                </div>
                <div className="space-y-4">
                    <XPBar xp={1240} level={4} nextLevelXP={2000} />
                    <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Session Intelligence</p>
                        <p className="text-[10px] text-slate-400 font-medium">Your current {studyMode} drive is active. Use the option gear below to swap modes.</p>
                    </div>
                </div>
            </div>

            {/* 4. BRAINSTORM CHIPS */}
            {selectedCourse && messages.length > 2 && (
                <div className="p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                    <p className="text-[9px] font-black text-indigo-400/60 uppercase tracking-widest mb-4">Quick Study Shortcuts</p>
                    <div className="flex flex-col gap-2">
                        {suggestions.slice(0, 3).map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(s.prompt)}
                                className="text-left py-2 px-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-[10px] font-bold text-slate-400 hover:text-white transition-all truncate italic uppercase tracking-tighter"
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <PageLayout 
            main={MainContent}
            side={SideContent}
        />
    );
};

export default AiTutor;
