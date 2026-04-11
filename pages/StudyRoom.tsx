import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type ChatMessage, type StudyRoom as StudyRoomType, type Quiz as SharedQuiz, type TechniqueState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
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
import { Bot, User, Send, MessageSquare, Users, Brain, UploadCloud, Lightbulb, FileText, Paperclip, FolderOpen, AlertTriangle, Info, Palette, Briefcase, X, Play, Pause, SkipForward, RotateCcw, Plus, Target } from 'lucide-react';
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
    // ... (State, Refs, Handlers, Effects all remain the same) ...
    const { id: roomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const { language } = useLanguage();
    const { showToast } = useToast();
    const [room, setRoom] = useState<StudyRoomType | null>(null);
    const [participants, setParticipants] = useState<{ id?: string; email: string; displayName: string }[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [mediaError, setMediaError] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const [isMuted, setIsMuted] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('ai'); // Default to AI Buddy for active context
    const [showPdfUpload, setShowPdfUpload] = useState(false);
    const [isGeneratingCustomQuiz, setIsGeneratingCustomQuiz] = useState(false);
    const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);
    const [isSavingSharedNote, setIsSavingSharedNote] = useState(false); // NEW: Loading state for saving shared note
    const [resources, setResources] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [memberActionState, setMemberActionState] = useState<{ email: string; action: string } | null>(null);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [techniqueName, setTechniqueName] = useState<string>('Pomodoro Technique');
    const [techniqueState, setTechniqueState] = useState<TechniqueState | null>(null);
    const [techniqueRemainingSec, setTechniqueRemainingSec] = useState<number>(0);
    const [isTechniqueSyncing, setIsTechniqueSyncing] = useState(false);
    const [knowledgeGaps, setKnowledgeGaps] = useState<string[]>([]);
    const [trackedConcepts, setTrackedConcepts] = useState<string[]>([]);
    const [sessionGoal, setSessionGoal] = useState<string>('');
    const [isGoalActive, setIsGoalActive] = useState(false);
    const [lastBreakTime, setLastBreakTime] = useState<number>(Date.now());
    
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [chatInput, setChatInput] = useState('');
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([{ role: 'model', parts: [{ text: "..." }] }]);
    const [aiInput, setAiInput] = useState('');
    
    // Track connection status
    useEffect(() => {
        const unsub = subscribeToConnectionStatus((connected) => {
            setIsConnected(connected);
            console.log(`[StudyRoom] Socket Status: ${connected ? 'CONNECTED' : 'OFFLINE'}`);
        });
        return unsub;
    }, []);

    // Derived context
    const neuralContextStatus: 'OFFLINE' | 'ACTIVE' | 'MAPPING' = (room?.id && isConnected) ? 'ACTIVE' : (room?.id ? 'MAPPING' : 'OFFLINE');

    // Localized Strings Helper for Study Room
    const getLocalizedMessage = (type: 'default' | 'welcome', lang: string, params?: any) => {
        const isMr = lang === 'mr';
        const isHi = lang === 'hi';

        switch (type) {
            case 'default':
                if (isMr) return "नमस्कार! अभ्यासविषयक काहीही विचारा किंवा अधिक अचूक उत्तरांसाठी काही नोट्स अपलोड करा.";
                if (isHi) return "नमस्ते! अध्ययन से संबंधित कुछ भी पूछें या अधिक सटीक उत्तरों के लिए कुछ नोट्स अपलोड करें।";
                return "Hello! Ask me anything about your studies or upload notes for more specific help.";

            case 'welcome':
                if (isMr) return `स्वागत आहे! ही खोली "${params.topic}" विषयावर "${params.technique}" तंत्राचा वापर करून "लक्ष्यित शिक्षण" सत्रासाठी तयार केली आहे. चला सुरुवात करूया!`;
                if (isHi) return `स्वागत है! यह कमरा "${params.topic}" विषय पर "${params.technique}" तकनीक का उपयोग करके "लक्षित शिक्षण" सत्र के लिए स्थापित किया गया है। चलिए शुरू करते हैं!`;
                return `Welcome! This room is set up for a "Targeted Learning" session using the ${params.technique} technique on the topic: "${params.topic}". Let's get started!`;

            default:
                return "";
        }
    };

    // Update initial AI message based on language
    useEffect(() => {
        if (aiMessages.length === 1 && aiMessages[0].role === 'model') {
            setAiMessages([{ role: 'model', parts: [{ text: getLocalizedMessage('default', language) }] }]);
        }
    }, [language]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1280) {
                setIsMobilePanelOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    const [notes, setNotes] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [sharedQuiz, setSharedQuiz] = useState<SharedQuiz | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    const [elapsedTime, setElapsedTime] = useState(0); // Time in seconds
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const startTimeRef = useRef<number | null>(null);

    const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const notesFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const aiChatEndRef = useRef<HTMLDivElement>(null);
    const prevParticipantsRef = useRef<StudyRoomType['users']>([]);
    const welcomeMessageSent = useRef(false);
    const autoModeratorTriggered = useRef(false);
    const autoModeratorTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isAdvancingTechniqueRef = useRef(false);

    // --- Session tracking ---
    const sessionIdRef = useRef<string | null>(null);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false);

    const participantChatMessages = useMemo(() => {
        const filtered = allMessages.filter(msg => {
            const isUserRole = msg.role === 'user';
            const isNotSystem = msg.user?.email !== SYSTEM_EMAIL;
            return isUserRole && isNotSystem;
        });
        return filtered;
    }, [allMessages]);

    const isTechniqueRunning = !!techniqueState?.isRunning;
    const effectiveTechniqueLabel = room?.technique || techniqueName || 'Pomodoro Technique';
    
    const isCurrentUserHost = useMemo(() => {
        if (!room || !currentUser) return false;
        if (room.createdById && currentUser.id) {
            return room.createdById === currentUser.id;
        }
        if (room.createdByEmail && currentUser.email) {
            return room.createdByEmail.toLowerCase() === currentUser.email.toLowerCase();
        }
        return room.createdBy === currentUser.displayName;
    }, [room, currentUser]);
    
    const mutedEmailSet = useMemo(() => {
        return new Set((room?.mutedUserEmails || []).map((email) => email.toLowerCase()));
    }, [room?.mutedUserEmails]);

    // --- Chat Handlers ---
    const handleSendChatMessage = useCallback(async (messageText: string) => {
        if (!messageText.trim() || !roomId) {
            return;
        }
        if (!currentUser) {
            console.error('handleSendChatMessage: Aborting - user not logged in.');
            return;
        }

        const newMessage: ChatMessage = {
            id: 'temp-' + Date.now(),
            role: 'user',
            parts: [{ text: messageText }],
            user: { email: currentUser.email, displayName: currentUser.displayName },
            timestamp: Date.now()
        };

        setAllMessages(prev => [...prev, newMessage]);
        setChatInput('');

        try {
            await sendChatMessage(roomId, {
                ...newMessage,
                text: newMessage.parts[0].text,
                sender: currentUser.displayName,
                userId: currentUser.id,
                email: currentUser.email
            });
            setTypingUsers(prev => prev.filter(u => u !== currentUser.displayName));
        } catch (error) {
            console.error("handleSendChatMessage: Error saving message:", error);
            setAllMessages(prev => prev.filter(m => m.id !== newMessage.id));
        }
    }, [roomId, currentUser]);

    const postSystemMessage = useCallback(async (text: string) => {
        if (!roomId) return;
        const systemMessage: ChatMessage = {
            role: 'model',
            parts: [{ text }],
            user: { displayName: 'Focus Bot', email: SYSTEM_EMAIL },
            timestamp: Date.now()
        };
        await sendChatMessage(roomId, { ...systemMessage, text: text, sender: 'System' });
    }, [roomId]);

    // --- Effects for Setup and Teardown ---
    useEffect(() => {
        if (room) {
            const prevEmails = prevParticipantsRef.current.map(p => p.email);
            const currentEmails = room.users.map(p => p.email);
            const leftUsers = prevParticipantsRef.current.filter(p => !currentEmails.includes(p.email));

            if (leftUsers.length > 0) {
                leftUsers.forEach(user => {
                    postSystemMessage(`${user.displayName} has left the room.`);
                });
            }

            prevParticipantsRef.current = room.users;
        }
    }, [room, currentUser, postSystemMessage]);

    const getMedia = useCallback(async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            cameraVideoTrackRef.current = stream.getVideoTracks()[0];
            
            // Default to OFF as per production refinements
            stream.getAudioTracks().forEach(track => track.enabled = false);
            stream.getVideoTracks().forEach(track => track.enabled = false);
            
            setLocalStream(stream);
            setMediaError(null);
            setIsMuted(true);
            setIsCameraOn(false);
        } catch (err: any) {
            console.error("Error accessing media devices.", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setMediaError({
                    message: "Permissions denied. Grant camera/mic access in your browser settings to share video.",
                    type: 'info'
                });
            } else {
                let errorMessage = "Could not access camera/microphone. Video features are disabled.";
                if (err.name === 'NotFoundError') {
                    errorMessage = "No camera or microphone found. Video features are unavailable.";
                }
                setMediaError({ message: errorMessage, type: 'error' });
            }
            setLocalStream(null);
            localStreamRef.current = null;
        }
    }, []);

    useEffect(() => {
        getMedia();
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [getMedia]);

    useEffect(() => {
        if (!roomId || !currentUser) return;
        setInitialMessagesLoaded(false);
        autoModeratorTriggered.current = false;
        if (autoModeratorTimerRef.current) {
            clearTimeout(autoModeratorTimerRef.current);
            autoModeratorTimerRef.current = null;
        }

        joinRoom(roomId, currentUser);
        startSession('study-room', roomId).then(id => {
            sessionIdRef.current = id;
            console.log("Study session started:", id);
        });

        setElapsedTime(0);
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                const now = Date.now();
                const elapsed = Math.floor((now - startTimeRef.current) / 1000);
                setElapsedTime(elapsed);
            }
        }, 1000);

        const unsubRoom = onRoomUpdate(roomId, (updatedRoom) => {
            if (!updatedRoom) {
                navigate('/study-lobby');
                return;
            }
            setRoom(updatedRoom);
            setParticipants(updatedRoom.users);
            if (updatedRoom.technique) setTechniqueName(updatedRoom.technique);
            if (updatedRoom.techniqueState) setTechniqueState(updatedRoom.techniqueState);
            if (updatedRoom.knowledgeGaps) setKnowledgeGaps(updatedRoom.knowledgeGaps);
        });

        const unsubTechnique = onTechniqueUpdate(roomId, (payload) => {
            setTechniqueName(payload.technique || 'Pomodoro Technique');
            setTechniqueState(payload.techniqueState || null);
        });

        getRoomMessages(roomId).then(msgs => {
            setAllMessages(msgs);
        }).finally(() => {
            setInitialMessagesLoaded(true);
        });

        const unsubTyping = onTyping((data: any) => {
            if (data.roomId === roomId && data.userName !== currentUser?.displayName) {
                setTypingUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName]);
                if (typingTimeoutRef.current[data.userName]) clearTimeout(typingTimeoutRef.current[data.userName]);
                typingTimeoutRef.current[data.userName] = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u !== data.userName));
                }, 3000);
            }
        });

        const unsubMessages = subscribeToMessages((rawMsg) => {
            const serverEmail = rawMsg.email || rawMsg.userId || 'unknown';
            const serverText = rawMsg.text || '';
            const serverMsg: ChatMessage = {
                id: rawMsg.id || Date.now().toString(),
                role: 'user',
                parts: [{ text: serverText }],
                user: { displayName: rawMsg.sender || 'Unknown', email: serverEmail },
                timestamp: rawMsg.timestamp ? new Date(rawMsg.timestamp).getTime() : Date.now()
            };

            setAllMessages(prev => {
                if (prev.some(m => m.id === serverMsg.id)) return prev;
                const tempIdx = prev.findIndex(m => m.id?.startsWith('temp-') && m.user?.email === serverEmail && m.parts[0]?.text === serverText);
                if (tempIdx !== -1) {
                    const updated = [...prev];
                    updated[tempIdx] = serverMsg;
                    return updated;
                }
                return [...prev, serverMsg];
            });
        });

        const unsubNotes = onNotesUpdate(roomId, setNotes);
        const unsubResources = onResourcesUpdate(roomId, setResources);
        const unsubQuiz = onQuizUpdate(roomId, (quiz) => {
            setSharedQuiz(quiz);
            if (quiz && quiz.answers.length > 0 && quiz.answers.length === participants.length) {
                setShowLeaderboard(true);
            }
        });
        const unsubKnowledgeGaps = onKnowledgeGapsUpdate(roomId, setKnowledgeGaps);
        const unsubTrackedConcepts = onTrackedConceptsUpdate(roomId, setTrackedConcepts);
        const unsubReaction = onReaction(({ roomId: reactionRoomId, emoji }) => {
            if (reactionRoomId === roomId) {
                setReactions(prev => [...prev, { id: Date.now(), emoji }]);
            }
        });

        triggerKnowledgeGapAnalysis(roomId).catch(console.error);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            unsubRoom();
            unsubTechnique();
            unsubMessages();
            unsubTyping();
            unsubNotes();
            unsubResources();
            unsubQuiz();
            unsubKnowledgeGaps();
            unsubTrackedConcepts();
            unsubReaction();
            if (currentUser) leaveRoom(roomId);
            if (sessionIdRef.current) {
                endSession(sessionIdRef.current);
                sessionIdRef.current = null;
            }
            if (autoModeratorTimerRef.current) clearTimeout(autoModeratorTimerRef.current);
        };
    }, [roomId, currentUser, navigate]);

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

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [participantChatMessages]);
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

    const handleToggleMute = useCallback(() => {
        localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMuted(prev => !prev);
    }, [localStream]);

    const handleToggleCamera = useCallback(() => {
        if (isScreenSharing) return;
        localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsCameraOn(prev => !prev);
    }, [localStream, isScreenSharing]);

    const handleHangUp = useCallback(async () => {
        if (sessionIdRef.current) {
            await endSession(sessionIdRef.current);
            sessionIdRef.current = null;
        }
        if (roomId && currentUser) await leaveRoom(roomId);
        localStream?.getTracks().forEach(track => track.stop());
        navigate('/study-lobby');
    }, [roomId, currentUser, localStream, navigate]);

    const handleToggleScreenShare = async () => {
        if (isScreenSharing) {
            localStream?.getVideoTracks().forEach(t => { if(t.label.startsWith('screen')) t.stop(); });
            await getMedia();
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                if (localStreamRef.current) {
                    const original = localStreamRef.current.getVideoTracks()[0];
                    if (original) localStreamRef.current.removeTrack(original);
                    localStreamRef.current.addTrack(screenTrack);
                }
                setIsScreenSharing(true);
            } catch (err) { console.error(err); }
        }
    };

    const handleReaction = (emoji: string) => {
        setReactions(prev => [...prev, { id: Date.now(), emoji }]);
        if (roomId) sendReaction(roomId, emoji);
    };

    const handleMentionMember = (name: string) => { setActiveTab('chat'); setChatInput(`@${name} `); };
    const handleWaveMember = (name: string) => { handleReaction('👋'); handleSendChatMessage(`👋 @${name}`); };

    const handleSaveSharedNote = async (content: string) => {
        if (!roomId) return;
        setIsSavingSharedNote(true);
        try { await saveRoomAINotes(roomId, content); } 
        finally { setIsSavingSharedNote(false); }
    };

    const handleUploadResource = async (file: File) => {
        if (!roomId || !currentUser) return;
        setIsUploading(true);
        await uploadResource(roomId, file, { displayName: currentUser.displayName });
        setIsUploading(false);
    };

    const handleDeleteResource = async (fileName: string) => { if (roomId) await deleteResource(roomId, fileName); };

    const handleSendAiMessage = useCallback(async () => {
        if (!aiInput.trim() || isAiLoading) return;
        const text = aiInput;
        setAiMessages(prev => [...prev, { role: 'user', parts: [{ text }] }]);
        setAiInput('');
        setIsAiLoading(true);
        try {
            const stream = await streamStudyBuddyChat(text, notes, language);
            const reader = stream.getReader();
            let responseText = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.text) {
                            responseText += data.text;
                            setAiMessages(prev => {
                                const newMsg = [...prev];
                                if (newMsg[newMsg.length - 1].role === 'model') {
                                    newMsg[newMsg.length - 1].parts = [{ text: responseText }];
                                } else {
                                    newMsg.push({ role: 'model', parts: [{ text: responseText }] });
                                }
                                return newMsg;
                            });
                        }
                    }
                }
            }
        } finally { setIsAiLoading(false); }
    }, [aiInput, isAiLoading, notes, language]);

    const handleGenerateQuiz = async () => {
        if (!roomId) return;
        setIsAiLoading(true);
        try {
            const quizJson = await generateQuizQuestion(notes || room?.topic || 'General Studies', language);
            await saveQuiz(roomId, JSON.parse(quizJson));
        } finally { setIsAiLoading(true); }
    };

    const handleSummarizeNotes = async () => {
        if (!notes) return;
        setIsAiLoading(true);
        try {
            const summary = await summarizeText(notes);
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: summary }] }]);
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
                            <h2 className="text-[9px] font-black text-white uppercase tracking-[0.25em] truncate max-w-[180px] opacity-80">{room?.name || 'STUDY ROOM'}</h2>
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
                            <button onClick={handleTechniqueToggle} className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${isTechniqueRunning ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20' : 'bg-indigo-500 text-white hover:bg-indigo-400 shadow-lg shadow-indigo-500/20'}`}>
                                {isTechniqueRunning ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
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
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                    <VideoTile stream={localStream} displayName={currentUser?.displayName || 'You'} isMuted={isMuted} isLocal={true} isScreenSharing={isScreenSharing} />
                                    {participants.filter(p => p.email !== currentUser?.email).slice(0, 3).map(p => (
                                        <VideoTile key={p.email} displayName={p.displayName} isMuted={false} />
                                    ))}
                                    {participants.length > 4 && (
                                        <div className="bg-slate-900/40 rounded-2xl border border-dashed border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                                            +{participants.length - 4} Members
                                        </div>
                                    )}
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
                            {activeTab === 'ai' && <AiPanel messages={aiMessages} input={aiInput} setInput={setAiInput} onSend={handleSendAiMessage} notes={notes} isExtracting={isExtracting} onUploadClick={() => notesFileInputRef.current?.click()} onQuizMe={handleGenerateQuiz} onSummarize={handleSummarizeNotes} isLoading={isAiLoading} neuralStatus={neuralContextStatus} activeTechnique={effectiveTechniqueLabel} onTrackConcept={handleTrackConcept} />}
                            {activeTab === 'chat' && <ChatPanel messages={participantChatMessages} input={chatInput} setInput={setChatInput} onSend={handleSendChatMessage} currentUser={currentUser} chatEndRef={chatEndRef} typingUsers={typingUsers} />}
                            {activeTab === 'notes' && <StudyRoomNotesPanel sharedNoteContent={notes} resources={resources} onSaveSharedNote={handleSaveSharedNote} onUploadResource={handleUploadResource} onDeleteResource={handleDeleteResource} isSavingNote={isSavingSharedNote} isUploading={isUploading} />}
                            {activeTab === 'tools' && <StudyToolsPanel notes={notes} topic={room?.topic || 'General Study'} isActive={true} courseId={room?.courseId} knowledgeGaps={knowledgeGaps} onTriggerGapAnalysis={handleTriggerGapAnalysis} activeTechnique={effectiveTechniqueLabel} trackedConcepts={trackedConcepts} onTrackConcept={handleTrackConcept} />}
                        </div>
                    </aside>
                </div>

                {sharedQuiz && (
                    <div className="fixed inset-0 z-[100] bg-slate-950/90 flex items-center justify-center p-6 backdrop-blur-md">
                        {showLeaderboard ? <Leaderboard quiz={sharedQuiz} participants={participants} onClear={handleClearQuiz} /> : <QuizDisplay quiz={sharedQuiz} onAnswer={handleAnswerQuiz} currentUser={currentUser} />}
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
    <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex flex-col ${msg.user?.email === currentUser?.email ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{msg.user?.displayName}</span>
                    <div className={`px-3 py-2 rounded-2xl text-xs max-w-[90%] ${msg.user?.email === currentUser?.email ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>{msg.parts[0].text}</div>
                </div>
            ))}
            <div ref={chatEndRef}></div>
        </div>
        <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
                <Input id="room-chat-input" name="roomChatInput" aria-label="Message room" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend(input)} placeholder="Message room..." className="h-9 bg-slate-800/50 border-white/5 text-xs" />
                <Button onClick={() => onSend(input)} size="sm" className="bg-violet-600"><Send size={14} /></Button>
            </div>
        </div>
    </div>
));

const AiPanel: React.FC<any> = React.memo(({ messages, input, setInput, onSend, notes, isExtracting, onUploadClick, onQuizMe, onSummarize, isLoading, neuralStatus, activeTechnique, onTrackConcept }) => (
    <div className="flex flex-col h-full bg-slate-900/40">
        <div className="px-4 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Neural Mode: {neuralStatus}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
            {messages.map((msg: any, i: number) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                    {msg.role === 'model' && <div className="w-7 h-7 rounded bg-violet-600 flex items-center justify-center shrink-0"><Bot size={14} className="text-white" /></div>}
                    <div className={`p-3 rounded-xl text-xs max-w-[85%] ${msg.role === 'model' ? 'bg-slate-800/80 text-slate-200' : 'bg-indigo-600 text-white'}`}>{msg.parts[0].text}</div>
                </div>
            ))}
            {isLoading && <div className="text-[10px] text-violet-400 font-black uppercase animate-pulse ml-10">Thinking...</div>}
        </div>
        <div className="p-4 bg-slate-900 border-t border-white/5">
            <div className="flex gap-2 mb-2">
                <Input id="ai-buddy-input" name="aiBuddyInput" aria-label="Ask AI Buddy" value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend()} placeholder="Ask Buddy..." className="h-9 bg-slate-800/50 border-white/5 text-xs flex-1" />
                <Button onClick={onSend} size="sm" className="bg-violet-600"><Send size={14} /></Button>
            </div>
            <div className="flex gap-2 overflow-x-auto">
                <Button onClick={onUploadClick} size="sm" variant="ghost" className="h-7 text-[8px] uppercase bg-white/5 border border-white/5"><Paperclip size={10} className="mr-1" /> Context</Button>
                <Button onClick={onQuizMe} size="sm" variant="ghost" className="h-7 text-[8px] uppercase bg-white/5 border border-white/5"><Lightbulb size={10} className="mr-1" /> Quiz</Button>
            </div>
        </div>
    </div>
));

const QuizDisplay: React.FC<{ quiz: any, onAnswer: any, currentUser: any }> = React.memo(({ quiz, onAnswer, currentUser }) => {
    const userAnswer = quiz.answers.find((a: any) => a.userId === currentUser?.email);
    return (
        <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-xl shadow-2xl">
            <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">{quiz.question}</h3>
            <div className="grid gap-3">
                {quiz.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => onAnswer(i)} disabled={!!userAnswer} className={`p-4 text-left text-sm rounded-xl border transition-all ${userAnswer?.answerIndex === i ? 'bg-violet-600 border-violet-500' : 'bg-slate-800 border-white/5 hover:border-violet-500'}`}>{opt}</button>
                ))}
            </div>
        </div>
    );
});

const Leaderboard: React.FC<{ quiz: any, participants: any[], onClear: any }> = React.memo(({ quiz, participants, onClear }) => (
    <div className="bg-slate-900 border border-white/10 p-8 rounded-2xl w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-black text-white mb-6 uppercase tracking-widest">Session Results</h3>
        <div className="space-y-3">
            {participants.map(p => {
                const isCorrect = quiz.answers.find((a: any) => a.userId === p.email)?.answerIndex === quiz.correctOptionIndex;
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
));

export default StudyRoom;
