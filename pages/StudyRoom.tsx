import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type ChatMessage, type StudyRoom as StudyRoomType, type Quiz as SharedQuiz, type TechniqueState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useStudyRoomSocket } from '../hooks/useStudyRoomSocket';
import { useMediaStream } from '../hooks/useMediaStream';
import {
    onRoomUpdate,
    onNotesUpdate,
    joinRoom,
    leaveRoom,
    saveRoomAINotes,
    uploadResource,
    deleteResource,
    onResourcesUpdate,
    onQuizUpdate,
    saveQuiz,
    saveQuizAnswer,
    clearQuiz,
    requestModeration,
    getRoomMessages,
    sendChatMessage,
    subscribeToMessages,
    subscribeToConnectionStatus,
    sendTyping,
    onTyping,
    onKnowledgeGapsUpdate,
    triggerKnowledgeGapAnalysis,
    onTechniqueUpdate,
    updateTechniqueState,
    advanceTechniquePhase,
    moderateRoomMember,
    onTrackedConceptsUpdate,
    saveTrackedConcept,
    onReaction,
    sendReaction
} from '../services/communityService';
import { streamStudyBuddyChat, generateQuizQuestion, extractTextFromFile, summarizeText, generateQuizSet } from '../services/geminiService';
import { startSession, endSession, recordQuizResult } from '../services/analyticsService';
// --- REMOVED Clock import here ---
import { Bot, User, Send, MessageSquare, Users, Brain, UploadCloud, Lightbulb, FileText, Paperclip, FolderOpen, AlertTriangle, Info, Palette, Briefcase, X, Play, Pause, SkipForward, RotateCcw, Plus, Target, Clock } from 'lucide-react';
import { Input, Button, Textarea, Spinner, Modal } from '../components/ui';
import { useToast } from '../contexts/ToastContext';
import PdfUpload from '../components/quiz/PdfUpload';
import RoomControls from '../components/RoomControls'; //
import VideoTile from '../components/VideoTile';
import Reactions, { type Reaction } from '../components/Reactions';
import MusicPlayer from '../components/MusicPlayer';
import ShareModal from '../components/ShareModal';
import StudyRoomNotesPanel from '../components/StudyRoomNotesPanel';
import StudyToolsPanel from '../components/StudyToolsPanel';
import Whiteboard from '../components/Whiteboard';
// --- REMOVED PomodoroTimer (moved to ToolsPanel) ---

// --- Helper Types & Constants ---
type ActiveTab = 'chat' | 'participants' | 'ai' | 'notes' | 'tools';


// --- System Email ---


const SYSTEM_EMAIL = 'system@nexus.ai';

const formatElapsedTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const paddedSeconds = seconds.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');

    if (hours > 0) {
        const paddedHours = hours.toString().padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
};

const formatPhaseTime = (totalSeconds: number): string => {
    const safe = Math.max(0, totalSeconds);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


// --- Main Component ---
const StudyRoom: React.FC = () => {
    const { id: roomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { language } = useLanguage();
    const { showToast } = useToast();

    // --- Modular Hooks ---
    const {
        room, participants, allMessages, setAllMessages,
        notes, setNotes, notesVersion, setNotesVersion,
        notesLock, setNotesLock, techniqueState, setTechniqueState,
        sharedQuiz, setSharedQuiz, isReconnecting, isSyncing,
        typingUsers, reactions, setReactions
    } = useStudyRoomSocket(roomId, currentUser);

    const {
        localStream, isMuted, isCameraOn, isScreenSharing, mediaError,
        toggleMute, toggleCamera, toggleScreenShare
    } = useMediaStream();

    // --- Local UI State ---
    const [activeTab, setActiveTab] = useState<ActiveTab>('ai');
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const [isSavingSharedNote, setIsSavingSharedNote] = useState(false);
    const [resources, setResources] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [techniqueRemainingSec, setTechniqueRemainingSec] = useState<number>(0);
    const [isTechniqueSyncing, setIsTechniqueSyncing] = useState(false);
    const [knowledgeGaps, setKnowledgeGaps] = useState<string[]>([]);
    const [trackedConcepts, setTrackedConcepts] = useState<string[]>([]);
    const [sessionGoal, setSessionGoal] = useState<string>('');
    const [isGoalActive, setIsGoalActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([{ role: 'model', parts: [{ text: "Thinking..." }] }]);
    const [aiInput, setAiInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [phaseAlert, setPhaseAlert] = useState<{ title: string; subtitle: string; icon: any } | null>(null);

    const [chatInput, setChatInput] = useState('');
    const [techniqueName, setTechniqueName] = useState<string>('Pomodoro');
    const welcomeMessageSent = useRef(false);
    const effectiveTechniqueLabel = techniqueState?.phaseLabel || techniqueName || 'Study Session';

    const playZenChime = useCallback(() => {
        try {
            const audio = new Audio('/chime.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {});
        } catch (e) {}
    }, []);

    const getLocalizedMessage = useCallback((key: string, lang: string, ctx: any) => {
        return `Welcome to the ${ctx.technique || 'Focus'} session for ${ctx.topic || 'your studies'}!`;
    }, []);

    const postSystemMessage = useCallback((text: string) => {
        setAllMessages(prev => [
            ...prev,
            {
                id: Date.now().toString(),
                role: 'model' as const,
                parts: [{ text }],
                user: { displayName: 'System', email: SYSTEM_EMAIL },
                timestamp: Date.now()
            }
        ]);
    }, [setAllMessages]);

    const handleSendChatMessage = useCallback(async (msgBody?: string) => {
        const textToSend = msgBody || chatInput.trim();
        if (!textToSend || !roomId || !currentUser) return;
        
        await sendChatMessage(roomId, {
            userId: currentUser.id || (currentUser as any)._id,
            email: currentUser.email,
            sender: currentUser.displayName,
            text: textToSend
        });
        if (!msgBody) setChatInput('');
    }, [chatInput, roomId, currentUser]);

    const sessionIdRef = useRef<string | null>(null);
    const startTimeRef = useRef<number>(Date.now());
    const prevPhaseLabelRef = useRef<string | null>(null);
    const isAdvancingTechniqueRef = useRef(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const aiChatEndRef = useRef<HTMLDivElement>(null);
    const notesFileInputRef = useRef<HTMLInputElement>(null);

    // --- Logic Blocks ---
    // Reset AI History on room/topic change to prevent context leakage
    useEffect(() => {
        setAiMessages([{ 
            role: 'model', 
            parts: [{ text: `Hello ${currentUser?.displayName || 'there'}! I'm your Nexus Mentor for ${room?.topic || 'this session'}. How can we tackle this subject together?` }] 
        }]);
    }, [roomId, room?.topic]);

    useEffect(() => {
        startSession('study-room', roomId || 'unknown').then(id => sessionIdRef.current = id);
        return () => { if (sessionIdRef.current) endSession(sessionIdRef.current); };
    }, [roomId]);

    useEffect(() => {
        const interval = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const shouldAutoAdvance = !!roomId && !!techniqueState && techniqueState.isRunning && techniqueRemainingSec <= 0;
        if (!shouldAutoAdvance || isAdvancingTechniqueRef.current) return;

        isAdvancingTechniqueRef.current = true;
        advanceTechniquePhase(roomId!, techniqueState!.version).then((response) => {
            setTechniqueName(response.technique);
            setTechniqueState(response.techniqueState);
        }).finally(() => {
            isAdvancingTechniqueRef.current = false;
        });
    }, [techniqueRemainingSec, techniqueState, roomId]);

    useEffect(() => {
        if (!techniqueState) {
            setTechniqueRemainingSec(0);
            return;
        }
        const computeRemaining = () => {
            if (!techniqueState.isRunning) {
                setTechniqueRemainingSec(Math.max(0, Math.floor(techniqueState.remainingSec || 0)));
                return;
            }
            const endTime = new Date(techniqueState.phaseEndsAt).getTime();
            const now = Date.now();
            setTechniqueRemainingSec(Math.max(0, Math.ceil((endTime - now) / 1000)));
        };
        computeRemaining();
        const interval = setInterval(computeRemaining, 1000);
        return () => clearInterval(interval);
    }, [techniqueState]);

    useEffect(() => {
        if (room && room.technique && room.topic && !welcomeMessageSent.current) {
            postSystemMessage(getLocalizedMessage('welcome', language, { technique: room.technique, topic: room.topic }));
            welcomeMessageSent.current = true;
        }
    }, [room, postSystemMessage, language]);

    useEffect(() => {
        if (techniqueState?.phaseLabel && techniqueState.phaseLabel !== prevPhaseLabelRef.current) {
            if (prevPhaseLabelRef.current !== null) {
                playZenChime();
                setPhaseAlert({
                    title: techniqueState.phaseLabel,
                    subtitle: techniqueState.phasePrompt || 'Time for the next stage of your study session.',
                    icon: techniqueState.phaseLabel.includes('Break') ? Clock : Brain
                });
                setTimeout(() => setPhaseAlert(null), 5000);
            }
            prevPhaseLabelRef.current = techniqueState.phaseLabel;
        }
    }, [techniqueState?.phaseLabel, techniqueState?.phasePrompt, playZenChime]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [allMessages]);
    useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, sharedQuiz]);

    // --- Handlers ---
    const handleTechniqueToggle = async () => {
        if (!roomId || !techniqueState) return;
        setIsTechniqueSyncing(true);
        try {
            const action = techniqueState.isRunning ? 'pause' : 'start';
            const response = await updateTechniqueState(roomId, action, techniqueState.version);
            setTechniqueName(response.technique);
            setTechniqueState(response.techniqueState);
        } finally {
            setIsTechniqueSyncing(false);
        }
    };

    const handleToggleMute = toggleMute;
    const handleToggleCamera = toggleCamera;
    const handleToggleScreenShare = toggleScreenShare;

    const handleHangUp = useCallback(async () => {
        if (sessionIdRef.current) {
            await endSession(sessionIdRef.current);
            sessionIdRef.current = null;
        }
        if (roomId && currentUser) await leaveRoom(roomId);
        localStream?.getTracks().forEach(track => track.stop());
        navigate('/study-lobby');
    }, [roomId, currentUser, localStream, navigate]);

    const handleReaction = (emoji: string) => {
        setReactions(prev => [...prev, { id: Date.now(), emoji }]);
        if (roomId) sendReaction(roomId, emoji);
    };

    const handleMentionMember = (name: string) => { setActiveTab('chat'); setChatInput(`@${name} `); };
    const handleWaveMember = (name: string) => { handleReaction('👋'); handleSendChatMessage(`👋 @${name}`); };

    const handleSaveSharedNote = async (content: string, version?: number) => {
        if (!roomId) return;
        setIsSavingSharedNote(true);
        try { 
            await saveRoomAINotes(roomId, content, version || notesVersion); 
        } finally { 
            setIsSavingSharedNote(false); 
        }
    };

    const handleUploadResource = async (file: File) => {
        if (!roomId || !currentUser) return;
        setIsUploading(true);
        await uploadResource(roomId, file, { displayName: currentUser.displayName });
        setIsUploading(false);
    };

    const handleDeleteResource = async (fileName: string) => { if (roomId) await deleteResource(roomId, fileName); };

    const aiAbortControllerRef = useRef<AbortController | null>(null);

    const handleSendAiMessage = useCallback(async () => {
        if (!aiInput.trim() || isAiLoading) return;
        
        // 1. Cancel any existing stream to prevent race conditions
        if (aiAbortControllerRef.current) aiAbortControllerRef.current.abort();
        aiAbortControllerRef.current = new AbortController();
        
        const text = aiInput;
        const userMsgId = Date.now().toString();
        const modelMsgId = (Date.now() + 1).toString();

        setAiMessages(prev => [...prev, { id: userMsgId, role: 'user', parts: [{ text }] }]);
        setAiInput('');
        setIsAiLoading(true);

        try {
            const historyForAi = aiMessages.slice(-10);
            const stream = await streamStudyBuddyChat(
                text, 
                notes, 
                historyForAi, 
                language, 
                aiAbortControllerRef.current.signal,
                room?.topic
            );
            
            if (!stream) throw new Error("Stream failed to initialize");
            const reader = stream.getReader();
            let responseText = '';

            // 2. Optimistically add the model bubble with an ID
            setAiMessages(prev => [...prev, { id: modelMsgId, role: 'model', parts: [{ text: '' }] }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.text) {
                                responseText += data.text;
                                // 3. STATED HARDENING: Only update the message with matching ID
                                setAiMessages(prev => prev.map(msg => 
                                    msg.id === modelMsgId 
                                        ? { ...msg, parts: [{ text: responseText }] } 
                                        : msg
                                ));
                            }
                        } catch (e) { console.warn("Partial JSON chunk:", line); }
                    }
                }
            }
        } catch (err: any) {
            if (err.name === 'AbortError') {
                console.log('AI Request Aborted');
            } else {
                console.error("AI Chat Error:", err);
                showToast("Connection stutter. Try again.", "error");
            }
        } finally { 
            setIsAiLoading(false); 
            aiAbortControllerRef.current = null;
        }
    }, [aiInput, isAiLoading, aiMessages, notes, language]);

    const handleGenerateQuiz = async () => {
        if (!roomId) return;
        setIsAiLoading(true);
        const toastId = showToast("Crafting a unique challenge for the room...", "info");
        try {
            const quizJson = await generateQuizQuestion(notes || room?.topic || 'General Studies', language);
            
            // Robust parsing for potentially wrapped JSON
            let cleanJson = quizJson;
            if (quizJson.includes('```json')) {
                cleanJson = quizJson.split('```json')[1].split('```')[0].trim();
            } else if (quizJson.includes('```')) {
                cleanJson = quizJson.split('```')[1].split('```')[0].trim();
            }

            const parsed = JSON.parse(cleanJson);
            await saveQuiz(roomId, parsed);
            showToast("Quiz live! Everyone can see it now.", "success");
            setActiveTab('tools'); // Switch to tools tab where quiz is usually managed
        } catch (error) {
            console.error("Quiz generation failed:", error);
            showToast("Quiz engine reached a limit. Try adding more notes for context.", "error");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSummarizeNotes = async () => {
        if (!notes || !roomId) return;
        setIsAiLoading(true);
        try {
            const summary = await summarizeText(notes);
            // Public Bot Message
            postSystemMessage(`🤖 **AI SUMMARY of current notes:**\n\n${summary}`);
        } finally { setIsAiLoading(false); }
    };

    const handleAnswerQuiz = async (idx: number) => {
        if (!sharedQuiz || !roomId || !currentUser) return;
        await saveQuizAnswer(roomId, currentUser.email, currentUser.displayName, idx);
    };

    const handleClearQuiz = async () => { if (roomId) { setShowLeaderboard(false); await clearQuiz(roomId); } };

    const handleNotesFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !roomId) return;
        setIsExtracting(true);
        try {
            const reader = new FileReader();
            const text = await new Promise<string>((res) => {
                reader.onload = () => res(reader.result as string);
                reader.readAsText(file);
            });
            await saveRoomAINotes(roomId, text);
            setAiMessages([{ role: 'model', parts: [{ text: "Context updated." }] }]);
        } finally { setIsExtracting(false); }
    };

    const handleTriggerGapAnalysis = async () => { if (roomId) await triggerKnowledgeGapAnalysis(roomId); };
    const handleTrackConcept = async (concept: string) => { if (roomId) await saveTrackedConcept(roomId, concept); };

    return (
        <div className="h-full flex flex-col text-slate-200 p-0 relative overflow-hidden bg-slate-950 pb-safe">

            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(99,102,241,0.22),transparent_40%),radial-gradient(circle_at_92%_12%,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.18),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
            
            <div className="relative z-10 flex flex-col h-full min-h-0">
                {/* 1. Primary Focus Bar */}
                <header className="h-12 px-6 bg-slate-950/40 backdrop-blur-xl flex items-center justify-between shrink-0 z-30 transition-all border-b border-white/[0.03]">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Target className="w-3.5 h-3.5 text-indigo-400" />
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                                {isReconnecting ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" className="text-amber-500" />
                                        <span className="text-sm font-bold text-amber-500 animate-pulse">RECONNECTING...</span>
                                    </div>
                                ) : isSyncing ? (
                                    <div className="flex items-center gap-2">
                                        <Spinner size="sm" className="text-sky-500" />
                                        <span className="text-sm font-bold text-sky-500">SYNCING ROOM STATE...</span>
                                    </div>
                                ) : (
                                    <>
                                        <h1 className="text-lg font-bold text-white truncate">{room?.name || 'Study Room'}</h1>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span className="px-1.5 py-0.5 bg-slate-700/50 rounded flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {effectiveTechniqueLabel}
                                            </span>
                                            <span className="truncate max-w-[150px]">{room?.topic || 'General Session'}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="h-4 w-[1px] bg-white/10 shrink-0"></div>

                        <div className="flex-1 min-w-0 max-w-2xl">
                            {isGoalActive ? (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 overflow-hidden">
                                    <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap">MISSION ACTIVE</div>
                                    <h3 className="text-xs font-bold text-slate-300 truncate italic">{sessionGoal}</h3>
                                    <button onClick={() => setIsGoalActive(false)} className="text-[9px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-colors ml-1 shrink-0">Clear</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Input 
                                        id="focal-objective-input"
                                        name="focalObjective"
                                        aria-label="Set focal objective"
                                        value={sessionGoal}
                                        onChange={(e) => setSessionGoal(e.target.value)}
                                        placeholder="Set your current focus objective..."
                                        className="h-8 bg-transparent border-none text-xs font-medium placeholder:text-slate-600 focus:ring-0 px-0 max-w-md"
                                        onKeyPress={(e) => e.key === 'Enter' && sessionGoal.trim() && setIsGoalActive(true)}
                                    />
                                    {sessionGoal.trim() && (
                                        <button onClick={() => setIsGoalActive(true)} className="text-[9px] font-black text-violet-400 hover:text-white uppercase tracking-widest px-2 py-1 rounded border border-violet-500/30 hover:bg-violet-600 transition-all scale-95 hover:scale-100">Lock</button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                        <div className="flex items-center gap-3 bg-white/[0.02] rounded-full pl-3.5 pr-1 py-1 border border-white/5">
                            <div className="flex flex-col items-end">
                                <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">{effectiveTechniqueLabel}</span>
                                <span className="text-xs font-mono font-black text-white tabular-nums leading-none mt-0.5">{formatPhaseTime(techniqueRemainingSec)}</span>
                            </div>
                            <button onClick={handleTechniqueToggle} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${techniqueState?.isRunning ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20'}`}>
                                {techniqueState?.isRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                            </button>
                        </div>

                        <div className="hidden md:flex -space-x-1.5">
                            {participants.slice(0, 3).map((p, i) => (
                                <div key={i} className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-black text-white uppercase ring-1 ring-white/5" title={p.displayName}>
                                    {p.displayName[0]}
                                </div>
                            ))}
                            {participants.length > 3 && (
                                <div className="w-6 h-6 rounded-full border-2 border-slate-950 bg-slate-700 flex items-center justify-center text-[8px] font-black text-white ring-1 ring-white/5">
                                    +{participants.length - 3}
                                </div>
                            )}
                        </div>

                        <Button type="button" variant="ghost" onClick={() => setIsMobilePanelOpen(prev => !prev)} className="xl:hidden h-8 px-3 text-[9px] font-black uppercase tracking-widest border border-white/5">
                            <Users size={14} className="mr-2" /> Members
                        </Button>
                    </div>
                </header>

                {/* 2. Secondary Workspace Split */}
                <div className="flex-1 flex overflow-hidden flex-col xl:flex-row relative min-h-0">
                    <main className="flex-[7] flex flex-col min-h-0 relative">
                        <div className="flex-1 p-6 relative min-h-0">
                            {showWhiteboard ? (
                                <div className="absolute inset-6 flex flex-col bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in-0 duration-300">
                                    <div className="h-10 flex items-center justify-between px-4 bg-black/40 border-b border-white/5 shrink-0">
                                        <div className="flex items-center gap-2">
                                            <Palette size={14} className="text-violet-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Shared Canvas</span>
                                        </div>
                                        <button onClick={() => setShowWhiteboard(false)} className="text-slate-400 hover:text-white transition-all"><X size={16} /></button>
                                    </div>
                                    <div className="flex-1 relative bg-white/[0.01]">
                                        <Whiteboard roomId={roomId || ''} />
                                    </div>
                                </div>
                            ) : isScreenSharing ? (
                                <div className="flex flex-col h-full gap-4 animate-in fade-in duration-500">
                                    {/* Main Stage: Screen Share */}
                                    <div className="flex-1 min-h-0 bg-slate-900 rounded-3xl border border-white/10 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group/stage">
                                        <VideoTile 
                                            stream={localStream} 
                                            displayName={currentUser?.displayName || 'You'} 
                                            isMuted={isMuted} 
                                            isLocal={true} 
                                            isScreenSharing={true} 
                                            className="w-full h-full aspect-auto" 
                                        />
                                        <div className="absolute top-4 left-4 z-40 bg-sky-500/20 backdrop-blur-md border border-sky-500/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                                            <div className="w-2 h-2 bg-sky-400 rounded-full animate-pulse" />
                                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Live Presentation</span>
                                        </div>
                                    </div>

                                    {/* Participant Strip */}
                                    <div className="h-28 flex gap-4 overflow-x-auto pb-2 scrollbar-hide shrink-0 bg-white/[0.02] border-b border-white/[0.05] p-4">
                                        <div className="w-48 shrink-0 relative group">
                                            <VideoTile 
                                                stream={localStream} 
                                                displayName="My Camera" 
                                                isMuted={isMuted} 
                                                isLocal={true} 
                                                className="h-28 border border-white/5 opacity-80 hover:opacity-100 transition-opacity" 
                                            />
                                        </div>
                                        {participants.filter(p => p.email !== currentUser?.email).map(p => (
                                            <div key={p.email} className="w-24 shrink-0 flex flex-col items-center justify-center bg-slate-800/40 rounded-xl border border-white/[0.05] p-3 gap-2">
                                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-white/5">
                                                    <span className="text-xs font-black text-slate-300">{(p.displayName?.[0] || 'U').toUpperCase()}</span>
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 truncate w-full text-center uppercase tracking-tighter">{p.displayName}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
                                    <div className="w-full max-w-2xl px-4">
                                        <VideoTile 
                                            stream={localStream} 
                                            displayName={`${currentUser?.displayName || 'You'} (Mirror)`} 
                                            isMuted={isMuted} 
                                            isLocal={true} 
                                            isScreenSharing={false} 
                                            className="shadow-2xl shadow-violet-500/10 border border-white/10"
                                        />
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
                                        {participants.filter(p => p.email !== currentUser?.email).slice(0, 10).map(p => (
                                            <div key={p.email} className="group relative">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/5 flex items-center justify-center hover:bg-slate-700 transition-colors cursor-help shadow-lg" title={`${p.displayName} is in the room`}>
                                                    <span className="text-sm font-black text-slate-400">{(p.displayName?.[0] || 'U').toUpperCase()}</span>
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
                                            </div>
                                        ))}
                                        {participants.length > 11 && (
                                            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase border border-dashed border-white/10">
                                                +{participants.length - 11}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/10">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Collective Presence Mode</span>
                                        </div>
                                        <p className="text-xs text-slate-500 italic max-w-sm">Video feeds are disabled to save bandwidth. Collaborative tools (Notes, Whiteboard) remain in real-time sync.</p>
                                    </div>
                                </div>
                            )}
                            <Reactions reactions={reactions} />
                        </div>
                    </main>

                    <aside className={`fixed inset-x-3 top-[4rem] bottom-[5rem] z-50 rounded-2xl bg-slate-900/95 backdrop-blur-3xl border border-white/10 flex flex-col min-h-0 shadow-2xl transition-all duration-300 xl:relative xl:inset-auto xl:top-auto xl:bottom-auto xl:z-20 xl:flex-[3] xl:h-full xl:rounded-none xl:bg-slate-950/40 xl:border-l xl:border-white/[0.03] ${isMobilePanelOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[105%] xl:opacity-100 xl:translate-y-0'}`}>

                        <div className="flex border-b border-white/[0.03] p-1.5 gap-1 bg-white/[0.01] shrink-0">
                            <TabButton id="ai" activeTab={activeTab} setActiveTab={setActiveTab} icon={Bot} label="AI Buddy" />
                            <TabButton id="chat" activeTab={activeTab} setActiveTab={setActiveTab} icon={MessageSquare} label="Chat" />
                            <TabButton id="notes" activeTab={activeTab} setActiveTab={setActiveTab} icon={FileText} label="Notes" />
                            <TabButton id="tools" activeTab={activeTab} setActiveTab={setActiveTab} icon={Briefcase} label="Tools" />
                        </div>

                        <div className="flex-1 overflow-hidden">
                            {activeTab === 'ai' && <AiPanel messages={aiMessages} input={aiInput} setInput={setAiInput} onSend={handleSendAiMessage} notes={notes} isExtracting={isExtracting} onUploadClick={() => notesFileInputRef.current?.click()} onQuizMe={handleGenerateQuiz} onSummarize={handleSummarizeNotes} isLoading={isAiLoading} neuralStatus={notes ? 'Active' : 'Idle'} activeTechnique={effectiveTechniqueLabel} onTrackConcept={handleTrackConcept} chatEndRef={aiChatEndRef} />}
                            {activeTab === 'chat' && <ChatPanel messages={allMessages} input={chatInput} setInput={setChatInput} onSend={handleSendChatMessage} currentUser={currentUser} chatEndRef={chatEndRef} typingUsers={typingUsers} />}
                            {activeTab === 'notes' && (
                                <StudyRoomNotesPanel 
                                    sharedNoteContent={notes} 
                                    resources={resources} 
                                    onSaveSharedNote={handleSaveSharedNote} 
                                    onUploadResource={handleUploadResource} 
                                    onDeleteResource={handleDeleteResource} 
                                    isSavingNote={isSavingSharedNote} 
                                    isUploading={isUploading} 
                                    lockedBy={notesLock}
                                    currentUserId={currentUser?.id}
                                    notesVersion={notesVersion}
                                    onAcquireLock={() => Promise.resolve()}
                                />
                            )}
                            {activeTab === 'tools' && <StudyToolsPanel notes={notes} topic={room?.topic || 'General Study'} isActive={true} courseId={room?.courseId} knowledgeGaps={knowledgeGaps} onTriggerGapAnalysis={handleTriggerGapAnalysis} activeTechnique={effectiveTechniqueLabel} trackedConcepts={trackedConcepts} onTrackConcept={handleTrackConcept} />}
                        </div>
                    </aside>
                </div>

                {sharedQuiz && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200]">
                        {showLeaderboard ? <Leaderboard quiz={sharedQuiz} participants={participants} onClear={handleClearQuiz} /> : <QuizDisplay quiz={sharedQuiz} onAnswer={handleAnswerQuiz} currentUser={currentUser} />}
                    </div>
                )}

                {phaseAlert && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/20 pointer-events-none">
                        <div className="bg-slate-900/90 backdrop-blur-2xl border border-violet-500/30 p-8 rounded-[40px] shadow-[0_0_80px_rgba(139,92,246,0.3)] flex flex-col items-center text-center max-w-md animate-in zoom-in-95 fade-in duration-500 fill-mode-forwards relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-transparent pointer-none" />
                            <div className="w-20 h-20 rounded-3xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-6 relative">
                                <div className="absolute inset-0 rounded-3xl bg-violet-500/20 animate-ping opacity-40" />
                                <phaseAlert.icon size={40} className="text-violet-400 relative z-10" />
                            </div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] mb-3">{phaseAlert.title}</h2>
                            <p className="text-slate-400 font-medium leading-relaxed italic opacity-80">{phaseAlert.subtitle}</p>
                            <div className="mt-8 flex items-center gap-4">
                                <div className="h-[1px] w-12 bg-white/10" />
                                <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Phase Advanced</span>
                                <div className="h-[1px] w-12 bg-white/10" />
                            </div>
                        </div>
                    </div>
                )}

                <input id="room-notes-file-input" name="roomNotesFile" type="file" ref={notesFileInputRef} onChange={handleNotesFileUpload} accept=".txt,.md,.pdf,.pptx,.ppt,.png,.jpg,.jpeg" className="hidden" />

                <RoomControls
                    mediaReady={!!localStream}
                    isMuted={isMuted}
                    isCameraOn={isCameraOn}
                    isScreenSharing={isScreenSharing}
                    onToggleMute={handleToggleMute}
                    onToggleCamera={handleToggleCamera}
                    onToggleScreenShare={handleToggleScreenShare}
                    onHangUp={handleHangUp}
                    onReact={handleReaction}
                    onToggleMusic={() => setShowMusicPlayer(p => !p)}
                    onToggleWhiteboard={() => setShowWhiteboard(p => !p)}
                    onShare={() => setShowShareModal(true)}
                    roomId={roomId || ''}
                    formattedSessionTime={formatElapsedTime(elapsedTime)}
                    showMusicPlayer={showMusicPlayer}
                    showWhiteboard={showWhiteboard}
                >
                    <MusicPlayer visible={showMusicPlayer} onClose={() => setShowMusicPlayer(false)} />
                </RoomControls>

                {showShareModal && (
                    <ShareModal 
                        roomId={roomId || ''} 
                        onClose={() => setShowShareModal(false)} 
                    />
                )}
            </div>
        </div>
    );
};

// --- Sub-Components ---

const TabButton: React.FC<{ id: string, activeTab: string, setActiveTab: (id: any) => void, icon: any, label: string }> = React.memo(({ id, activeTab, setActiveTab, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg transition-all ${activeTab === id ? 'bg-violet-600/20 text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}>
        <Icon size={16} className="mb-1" />
        <span className="text-[8px] font-black uppercase tracking-tighter">{label}</span>
    </button>
));

const ChatPanel: React.FC<any> = React.memo(({ messages, input, setInput, onSend, currentUser, chatEndRef, typingUsers }) => (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/40">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex flex-col ${msg.user?.email === currentUser?.email ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{msg.user?.displayName}</span>
                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] ${msg.user?.email === currentUser?.email ? 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10' : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'}`}>{msg.parts[0].text}</div>
                </div>
            ))}
            <div ref={chatEndRef}></div>
        </div>
        <div className="p-4 bg-slate-900 border-t border-white/5 shrink-0">
            <div className="flex gap-2">
                <Input id="room-chat-input" name="roomChatInput" aria-label="Message room" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend(input)} placeholder="Message room..." className="h-9 bg-slate-800/50 border-white/5 text-xs" />
                <Button onClick={() => onSend(input)} size="sm" className="bg-violet-600"><Send size={14} /></Button>
            </div>
        </div>
    </div>
));

const AiPanel: React.FC<any> = React.memo(({ messages, input, setInput, onSend, notes, isExtracting, onUploadClick, onQuizMe, onSummarize, isLoading, neuralStatus, activeTechnique, onTrackConcept, chatEndRef }) => (
    <div className="flex flex-col h-full min-h-0 bg-slate-900/40">
        <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Mode: {neuralStatus}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scroll-smooth">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                    {msg.role === 'model' && <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20"><Bot size={14} className="text-white" /></div>}
                    <div className={`p-3 rounded-2xl text-xs max-w-[85%] leading-relaxed ${msg.role === 'model' ? 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5' : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10'}`}>
                        {msg.parts[0].text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-3 animate-in fade-in duration-300">
                    <div className="w-7 h-7 rounded-lg bg-violet-600/50 flex items-center justify-center shrink-0"><Bot size={14} className="text-white/50" /></div>
                    <div className="p-3 bg-slate-800/40 rounded-2xl rounded-tl-none border border-white/5 flex gap-1 items-center">
                        <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}
            <div ref={chatEndRef} />
        </div>
        <div className="p-4 bg-slate-900 border-t border-white/5 shrink-0">
            <div className="flex gap-2 mb-3">
                <Input id="ai-buddy-input" name="aiBuddyInput" aria-label="Ask AI Buddy" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend()} placeholder="Ask Buddy..." className="h-10 bg-slate-800/50 border-white/10 text-xs flex-1 rounded-xl" />
                <Button onClick={onSend} size="sm" className="h-10 w-10 bg-violet-600 rounded-xl hover:bg-violet-500 shadow-lg shadow-violet-500/20"><Send size={16} /></Button>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                <Button onClick={onUploadClick} size="sm" variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg shrink-0"><Paperclip size={12} className="mr-2" /> {isExtracting ? 'Mapping...' : 'Context'}</Button>
                <Button onClick={onQuizMe} size="sm" variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg shrink-0"><Lightbulb size={12} className="mr-2" /> Quiz Me</Button>
                <Button onClick={onSummarize} size="sm" variant="ghost" className="h-8 text-[9px] font-black uppercase tracking-widest bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg shrink-0"><Bot size={12} className="mr-2" /> Summarize</Button>
            </div>
        </div>
    </div>
));

const QuizDisplay: React.FC<{ quiz: any, onAnswer: any, currentUser: any }> = React.memo(({ quiz, onAnswer, currentUser }) => {
    const answers = Array.isArray(quiz?.answers) ? quiz.answers : [];
    const options = Array.isArray(quiz?.options) ? quiz.options : [];
    const userAnswer = answers.find((a: any) => a.userId === currentUser?.email);
    
    return (
        <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">{quiz?.question || "Session Quiz"}</h3>
            <div className="grid gap-3">
                {options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => onAnswer(i)} disabled={!!userAnswer} className={`p-4 text-left text-sm rounded-xl border transition-all ${userAnswer?.answerIndex === i ? 'bg-violet-600 border-violet-500' : 'bg-slate-800 border-white/5 hover:border-violet-500'}`}>{opt}</button>
                ))}
            </div>
            {!options.length && <p className="text-white/40 text-xs italic">Loading options...</p>}
        </div>
    );
});

const Leaderboard: React.FC<{ quiz: any, participants: any[], onClear: any }> = React.memo(({ quiz, participants, onClear }) => {
    const answers = Array.isArray(quiz?.answers) ? quiz.answers : [];
    return (
        <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest">Session Results</h3>
            <div className="space-y-3">
                {participants.map(p => {
                    const isCorrect = answers.find((a: any) => a.userId === p.email)?.answerIndex === quiz?.correctOptionIndex;
                    return (
                        <div key={p.email} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                            <span className="text-xs font-bold">{p.displayName}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>{isCorrect ? 'Success' : 'Recall needed'}</span>
                        </div>
                    );
                })}
            </div>
            <Button onClick={onClear} className="w-full mt-8 bg-violet-600 uppercase font-black text-xs">Return to Focus</Button>
        </div>
    );
});

export default StudyRoom;
