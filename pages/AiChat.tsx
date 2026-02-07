import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Input, Button } from '../components/ui';
import CourseSelector from '../components/CourseSelector';
import { type ChatMessage } from '../types';
import { streamChat, generateQuizQuestion } from '../services/geminiService';
import { trackToolUsage } from '../services/personalizationService';
import { startSession, endSession, recordQuizResult, getProductivityReport } from '../services/analyticsService';
import { createChatSession, addMessageToSession } from '../services/aiChatService'; // Added import
import { useLanguage } from '../contexts/LanguageContext';
import { Bot, User, Send, Mic, Volume2, VolumeX, Lightbulb, Sparkles, Calendar, Image as ImageIcon, X, Paperclip } from 'lucide-react';

interface Quiz {
    topic: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    userAnswerIndex?: number;
}

const ChatItem: React.FC<{ message: ChatMessage; onSpeak: (text: string) => void }> = ({ message, onSpeak }) => {
    const isModel = message.role === 'model';
    const text = message.parts.map(part => part.text).join('');

    return (
        <div className={`flex items-start gap-4 my-4 ${isModel ? '' : 'justify-end'}`}>
            {isModel && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-white" />
                </div>
            )}
            <div className={`flex flex-col gap-2 max-w-xl`}>
                <div className={`p-4 rounded-2xl ${isModel ? 'bg-slate-800 rounded-tl-none' : 'bg-sky-600 text-white rounded-br-none'}`}>
                    <div className="prose prose-invert prose-sm" style={{ whiteSpace: 'pre-wrap' }}>{text}</div>
                </div>
                {isModel && text && (
                    <button onClick={() => onSpeak(text)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-violet-400 transition-colors self-start ml-2">
                        <Volume2 size={14} /> Listen
                    </button>
                )}
            </div>
            {!isModel && (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                    <User className="w-6 h-6 text-slate-300" />
                </div>
            )}
        </div>
    );
};


// Localized Strings Helper
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

    const getInitialGreeting = () => {
        const isMr = language === 'mr';
        const isHi = language === 'hi';
        if (isMr) return "नमस्कार! मी तुमचा AI ट्यूटर आहे. आज आपण कोणता विषय शिकणार आहोत?";
        if (isHi) return "नमस्ते! मैं आपका AI ट्यूटर हूँ। आज हम कौन सा विषय सीखेंगे?";
        return "Hello! I'm your AI Tutor. What subject are we diving into today?";
    };

    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', parts: [{ text: "..." }] } // Placeholder, will update in useEffect
    ]);

    // Update initial message when language changes or on mount
    useEffect(() => {
        // Only update if it's the very first message and still the default placeholder or previous default
        if (messages.length === 1 && messages[0].role === 'model') {
            setMessages([{
                role: 'model',
                parts: [{ text: getLocalizedMessage('default', language) }]
            }]);
        }
    }, [language]);


    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [studyMode, setStudyMode] = useState<'Normal' | 'Feynman Technique' | 'Spaced Repetition' | 'Active Recall'>('Normal');
    const [isAutoSpeaking, setIsAutoSpeaking] = useState(() => {
        try {
            return localStorage.getItem('nexusAutoSpeak') === 'true';
        } catch {
            return false;
        }
    });

    const [sessionId, setSessionId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<{ base64: string, type: string, name: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const recognitionRef = useRef<any | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const proactiveMessageSent = useRef(false);

    // Initialize Chat Session on Mount
    useEffect(() => {
        const initSession = async () => {
            try {
                // If we don't have a session ID yet, creation one.
                // In a future update, we could check for an existing recent session here.
                if (!sessionId && proactiveMessageSent.current) {
                    // We wait for the proactive message logic to fire first so we save the right greeting
                    const initialMsg = messages[0];
                    if (initialMsg) {
                        const session = await createChatSession("AI Tutor Session", [initialMsg]);
                        setSessionId(session._id);
                        console.log("Created AI Chat Session:", session._id);
                    }
                }
            } catch (err) {
                console.error("Failed to initialize chat session:", err);
            }
        };

        // Very basic debouncing/check to ensure messages state is settled
        if (messages.length > 0 && !sessionId) {
            initSession();
        }
    }, [messages, sessionId]);

    useEffect(() => {
        trackToolUsage('tutor');
        let analyticsSessionId: string | null = null;
        const start = async () => {
            analyticsSessionId = await startSession('tutor', selectedCourse);
        }
        start();

        return () => {
            if (analyticsSessionId) {
                endSession(analyticsSessionId);
            }
        }
    }, [selectedCourse]);

    useEffect(() => {
        const checkForProactiveMessage = async () => {
            if (proactiveMessageSent.current) return;

            const report = await getProductivityReport();
            let initialPrompt = getInitialGreeting();

            if (report && report.weaknesses && report.weaknesses.length > 0) {
                const weakestTopic = report.weaknesses[0];
                initialPrompt = getLocalizedMessage('weakness', language, { topic: weakestTopic.topic, accuracy: weakestTopic.accuracy });
            }

            setMessages([{ role: 'model', parts: [{ text: initialPrompt }] }]);
            proactiveMessageSent.current = true;
        };

        if (location.state?.technique && location.state?.topic) {
            const { technique, topic } = location.state;
            let initialPrompt = '';

            switch (technique) {
                case 'Active Recall':
                    setStudyMode('Active Recall');
                    initialPrompt = getLocalizedMessage('activeRecall', language, { topic });
                    break;
                case 'Feynman Technique':
                    setStudyMode('Feynman Technique');
                    initialPrompt = getLocalizedMessage('feynman', language, { topic });
                    break;
                case 'Spaced Repetition':
                    setStudyMode('Spaced Repetition');
                    initialPrompt = getLocalizedMessage('spacedRepetition', language, { topic });
                    break;
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
    }, [location.state, navigate, language]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, quiz]);

    useEffect(() => {
        try {
            localStorage.setItem('nexusAutoSpeak', String(isAutoSpeaking));
        } catch (error) {
            console.error("Failed to save auto-speak setting to localStorage", error);
        }
        if (!isAutoSpeaking) {
            speechSynthesis.cancel();
        }
    }, [isAutoSpeaking]);

    const handleSpeak = (text: string) => {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        speechSynthesis.speak(utterance);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setSelectedImage({
                base64: reader.result as string,
                type: file.type,
                name: file.name
            });
        };
        reader.readAsDataURL(file);
    };

    const handleSend = useCallback(async (messageToSend?: string, isVoiceInput = false) => {
        const currentMessage = messageToSend || input;
        if (!currentMessage.trim() || isLoading) return;

        speechSynthesis.cancel();

        const newUserMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: currentMessage }],
            attachment: selectedImage ? { name: selectedImage.name, type: selectedImage.type, size: 0 } : undefined
        };
        const newModelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        setMessages(prev => [...prev, newUserMessage, newModelMessage]);

        const imgData = selectedImage;
        setSelectedImage(null); // Clear after sending

        setInput('');
        setIsLoading(true);
        setError(null);
        setQuiz(null);

        // --- Save User Message ---
        if (sessionId) {
            addMessageToSession(sessionId, [newUserMessage]).catch(e => console.error("Failed to save user message", e));
        }

        try {
            let contextPrompt = currentMessage;
            if (studyMode === 'Feynman Technique') {
                contextPrompt = `[MODE: FEYNMAN TECHNIQUE - Explain like I'm 10. Identify gaps.] User says: ${currentMessage}`;
            } else if (studyMode === 'Spaced Repetition') {
                contextPrompt = `[MODE: SPACED REPETITION - Focus on creating memorization cards and scheduling.] User says: ${currentMessage}`;
            } else if (studyMode === 'Active Recall') {
                contextPrompt = `[MODE: ACTIVE RECALL - Ask tough questions to probe understanding.] User says: ${currentMessage}`;
            }

            const stream = await streamChat(
                contextPrompt,
                imgData?.base64.split(',')[1], // Just the base64 part
                imgData?.type,
                language
            );

            if (!stream) throw new Error("Failed to start stream");

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
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmedLine.slice(6));
                            if (data.text) {
                                modelResponse += data.text;
                                setMessages(prev => {
                                    const newMessages = [...prev];
                                    const lastMessage = newMessages[newMessages.length - 1];
                                    if (lastMessage && lastMessage.role === 'model') {
                                        lastMessage.parts = [{ text: modelResponse }];
                                    }
                                    return newMessages;
                                });
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e);
                        }
                    }
                }
            }

            setIsLoading(false); // Hide loading indicator once streaming is complete

            // --- Save Model Response ---
            if (sessionId && modelResponse) {
                const finalModelMsg: ChatMessage = { role: 'model', parts: [{ text: modelResponse }] };
                addMessageToSession(sessionId, [finalModelMsg]).catch(e => console.error("Failed to save model message", e));
            }

            if (modelResponse && (isAutoSpeaking || isVoiceInput)) {
                handleSpeak(modelResponse);
            }
        } catch (err: any) {
            console.error("AI Tutor Error:", err);

            let userFriendlyMsg = 'Sorry, something went wrong. Please try again.';
            const rawError = err.message || '';

            if (rawError.includes('429') || rawError.toLowerCase().includes('quota')) {
                userFriendlyMsg = 'The AI is currently at its limit (free tier). Please wait about a minute and try again.';
            } else if (rawError.includes('404')) {
                userFriendlyMsg = 'The AI model is currently unavailable. I am looking into it.';
            }

            setError(userFriendlyMsg);
            setMessages(prev => [...prev, { role: 'model', parts: [{ text: userFriendlyMsg }] }]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, isAutoSpeaking, studyMode, sessionId, language]);

    const handleQuizMe = async () => {
        if (isLoading) return;
        setError(null);
        setIsLoading(true);
        setQuiz(null);

        const context = messages.map(m => `${m.role}: ${m.parts.map(p => p.text).join('')}`).join('\n');
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: "Of course! Here's a question for you..." }] }]);

        try {
            const quizJsonString = await generateQuizQuestion(context, language);
            const parsedQuiz = JSON.parse(quizJsonString);
            setQuiz(parsedQuiz);

            // Note: We're not saving the quiz interaction to chat history explicitly here for simplicity, 
            // but normally you might want to save the question/answer text.
        } catch (err) {
            console.error("Failed to generate quiz", err);
            setError("Sorry, I couldn't generate a quiz question right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswerQuiz = async (selectedIndex: number) => {
        if (!quiz) return;

        const isCorrect = selectedIndex === quiz.correctOptionIndex;
        await recordQuizResult(quiz.topic, isCorrect, selectedCourse);

        let feedbackMessage = '';
        if (isCorrect) {
            feedbackMessage = `Correct! Well done.`;
        } else {
            feedbackMessage = `Not quite. The correct answer was: "${quiz.options[quiz.correctOptionIndex]}"`;
        }

        setMessages(prev => [...prev, { role: 'model', parts: [{ text: feedbackMessage }] }]);

        // Save quiz feedback
        if (sessionId) {
            addMessageToSession(sessionId, [{ role: 'model', parts: [{ text: feedbackMessage }] }]);
        }

        setQuiz(prev => prev ? { ...prev, userAnswerIndex: selectedIndex } : null);
        setTimeout(() => setQuiz(null), 3000); // Hide quiz after 3 seconds
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition not supported in this browser.");
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;
    }, []);

    const handleListen = () => {
        const recognition = recognitionRef.current;
        if (!recognition) {
            setError("Speech recognition is not available in your browser.");
            return;
        }

        if (isListening) {
            recognition.stop();
            return;
        }

        setError(null);

        let finalTranscript = '';
        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + ' ';
                } else {
                    interimTranscript += transcript;
                }
            }
            setInput(finalTranscript + interimTranscript);
        };

        recognition.onend = () => {
            setIsListening(false);
            if (finalTranscript.trim()) {
                handleSend(finalTranscript.trim(), true);
            }
        };

        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
                // User was silent, this is not a fatal error. Just stop listening.
            } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                console.error("Speech recognition permission error", event.error);
                setError("Microphone access denied. Please enable it in your browser settings to use voice input.");
            } else {
                console.error("Speech recognition error", event.error);
                setError(`Speech recognition error: ${event.error}. Please try again.`);
            }
            setIsListening(false);
        };

        setInput('');
        recognition.start();
        setIsListening(true);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <PageHeader title="AI Tutor" subtitle="Your personal AI guide for any subject." />
                    {studyMode !== 'Normal' && (
                        <div className="bg-violet-600/20 text-violet-400 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-violet-500/50 flex items-center gap-1 animate-pulse">
                            <Sparkles size={12} /> {studyMode} Mode
                        </div>
                    )}
                </div>
                <CourseSelector selectedCourse={selectedCourse} onCourseChange={setSelectedCourse} />
            </div>
            <div className="flex-1 bg-slate-800/50 rounded-xl p-4 flex flex-col overflow-hidden ring-1 ring-slate-700">
                <div className="flex-1 overflow-y-auto pr-2">
                    {messages.map((msg, index) => <ChatItem key={index} message={msg} onSpeak={handleSpeak} />)}
                    {isLoading && !quiz && (
                        <div className="flex items-start gap-4 my-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="max-w-xl p-4 rounded-2xl bg-slate-800 rounded-tl-none">
                                <div className="loading-dot">
                                    <span className="inline-block w-2 h-2 bg-slate-400 rounded-full"></span>
                                    <span className="inline-block w-2 h-2 bg-slate-400 rounded-full ml-1"></span>
                                    <span className="inline-block w-2 h-2 bg-slate-400 rounded-full ml-1"></span>
                                </div>
                            </div>
                        </div>
                    )}
                    {quiz && (
                        <div className="my-4 p-4 bg-slate-900/50 rounded-xl ring-1 ring-violet-600/50 animate-in fade-in-50">
                            <p className="font-semibold text-slate-200 text-base mb-1">Topic: <span className="capitalize font-light">{quiz.topic}</span></p>
                            <p className="font-bold text-slate-100 text-lg">{quiz.question}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                                {quiz.options.map((option, index) => {
                                    const isSelected = quiz.userAnswerIndex === index;
                                    const isCorrect = quiz.correctOptionIndex === index;
                                    let buttonClass = 'bg-slate-700 hover:bg-slate-600';
                                    if (quiz.userAnswerIndex !== undefined) {
                                        if (isCorrect) buttonClass = 'bg-green-500/80 ring-2 ring-green-400';
                                        else if (isSelected && !isCorrect) buttonClass = 'bg-red-500/80';
                                        else buttonClass = 'bg-slate-800/50 opacity-60';
                                    }
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerQuiz(index)}
                                            disabled={quiz.userAnswerIndex !== undefined}
                                            className={`p-3 text-left text-sm rounded-lg transition-all duration-200 ${buttonClass}`}
                                        >
                                            {option}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                {error && <p className="text-red-400 text-sm text-center my-2">{error}</p>}
                <div className="mt-4 flex flex-col gap-2">
                    {selectedImage && (
                        <div className="flex items-center gap-2 p-2 bg-slate-900/80 rounded-lg border border-slate-700 w-fit animate-in slide-in-from-bottom-2">
                            <ImageIcon size={16} className="text-sky-400" />
                            <span className="text-xs text-slate-300 max-w-[200px] truncate">{selectedImage.name}</span>
                            <button onClick={() => setSelectedImage(null)} className="text-slate-500 hover:text-rose-400">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading || !!quiz}
                            className="px-4 py-3 bg-slate-700 hover:bg-slate-600"
                            aria-label="Upload image"
                        >
                            <Paperclip className="w-5 h-5" />
                        </Button>
                        <Input
                            id="chat-input"
                            name="chatInput"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                            placeholder="Ask a question or share a diagram..."
                            disabled={isLoading || !!quiz}
                            className="flex-1"
                            autoComplete="off"
                        />
                        <Button
                            onClick={handleQuizMe}
                            disabled={isLoading || !!quiz}
                            className="px-4 py-3 bg-slate-700 hover:bg-slate-600"
                            aria-label="Quiz me"
                        >
                            <Lightbulb className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={handleListen}
                            disabled={isLoading || !!quiz}
                            className={`px-4 py-3 ${isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                            aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        >
                            <Mic className="w-5 h-5" />
                        </Button>
                        <Button
                            onClick={() => {
                                speechSynthesis.cancel();
                                setIsAutoSpeaking(prev => !prev);
                            }}
                            className={`px-4 py-3 ${isAutoSpeaking ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                            aria-label={isAutoSpeaking ? 'Disable automatic speaking' : 'Enable automatic speaking'}
                        >
                            {isAutoSpeaking ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                        </Button>
                        <Button onClick={() => handleSend()} isLoading={isLoading} disabled={!input.trim() || !!quiz} className="px-4 py-3">
                            {!isLoading && <Send className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiTutor;
