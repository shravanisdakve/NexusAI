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
    getRoomMessages, // Added
    sendChatMessage, // Added
    subscribeToMessages, // Added
    sendTyping,
    onTyping,
    onTechniqueUpdate,
    updateTechniqueState,
    advanceTechniquePhase,
    moderateRoomMember
} from '../services/communityService';
import { streamStudyBuddyChat, generateQuizQuestion, extractTextFromFile, summarizeText } from '../services/geminiService';
import { startSession, endSession, recordQuizResult } from '../services/analyticsService';
// --- REMOVED Clock import here ---
import { Bot, User, Send, MessageSquare, Users, Brain, UploadCloud, Lightbulb, FileText, Paperclip, FolderOpen, AlertTriangle, Info, Palette, Briefcase, X, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';
import { Input, Button, Textarea, Spinner } from '../components/ui';
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
    const [room, setRoom] = useState<StudyRoomType | null>(null);
    const [participants, setParticipants] = useState<{ id?: string; email: string; displayName: string }[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [mediaError, setMediaError] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
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
    // Localized Strings Helper for Study Room
    const getLocalizedMessage = (type: 'default' | 'welcome', lang: string, params?: any) => {
        const isMr = lang === 'mr';
        const isHi = lang === 'hi';

        switch (type) {
            case 'default':
                if (isMr) return "नमस्कार! काही नोट्स अपलोड करा आणि मी तुम्हाला अभ्यास करण्यास मदत करेन.";
                if (isHi) return "नमस्ते! कुछ नोट्स अपलोड करें और मैं आपको अध्ययन करने में मदद करूँगा।";
                return "Hello! Upload some notes and I'll help you study.";

            case 'welcome':
                if (isMr) return `स्वागत आहे! ही खोली "${params.topic}" विषयावर "${params.technique}" तंत्राचा वापर करून "लक्ष्यित शिक्षण" सत्रासाठी तयार केली आहे. चला सुरुवात करूया!`;
                if (isHi) return `स्वागत है! यह कमरा "${params.topic}" विषय पर "${params.technique}" तकनीक का उपयोग करके "लक्षित शिक्षण" सत्र के लिए स्थापित किया गया है। चलिए शुरू करते हैं!`;
                return `Welcome! This room is set up for a "Targeted Learning" session using the ${params.technique} technique on the topic: "${params.topic}". Let's get started!`;

            default:
                return "";
        }
    };

    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    // Initial placeholder, updated in useEffect
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([{ role: 'model', parts: [{ text: "..." }] }]);
    const [aiInput, setAiInput] = useState('');

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

    // --- FIX 1: Add a ref for the session ID ---
    const sessionIdRef = useRef<string | null>(null);
    const [initialMessagesLoaded, setInitialMessagesLoaded] = useState(false);
    // --- END FIX ---

    const participantChatMessages = useMemo(() => {
        const filtered = allMessages.filter(msg => {
            const isUserRole = msg.role === 'user';
            const isNotSystem = msg.user?.email !== SYSTEM_EMAIL;
            // console.log("Filtering:", msg, "Keep?", isUserRole && isNotSystem);
            return isUserRole && isNotSystem;
        });
        return filtered;
    }, [allMessages]);

    const isTechniqueRunning = !!techniqueState?.isRunning;
    const effectiveTechniqueLabel = room?.technique || techniqueName || 'Pomodoro Technique';
    const techniqueCycleLabel = techniqueState ? `Cycle ${Math.max(1, techniqueState.cycleCount || 1)}` : 'Not started';
    const activeTabLabel = useMemo(() => {
        const labels: Record<ActiveTab, string> = {
            chat: 'Chat',
            participants: 'Members',
            ai: 'AI Assistant',
            notes: 'Shared Notes',
            tools: 'Study Tools'
        };
        return labels[activeTab];
    }, [activeTab]);
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
    const handleSendChatMessage = async (messageText: string) => {
        if (!messageText.trim() || !roomId) {
            console.log("handleSendChatMessage: Aborting - missing data", { messageText, roomId, currentUser });
            return;
        }
        if (!currentUser) {
            console.error('handleSendChatMessage: Aborting - missing data. User might not be fully logged in.', { messageText: chatInput, roomId, currentUser });
            // Optional: You could show a toast here "Please wait for login..." or similar.
            // For now, let's try to fetch it if possible or just return.
            return;
        }

        const newMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: messageText }],
            user: { email: currentUser.email, displayName: currentUser.displayName },
            timestamp: Date.now()
        };
        console.log("handleSendChatMessage: Sending message:", newMessage);

        try {
            await sendChatMessage(roomId, {
                ...newMessage,
                text: newMessage.parts[0].text,
                sender: currentUser.displayName,
                userId: currentUser.id, // Pass ObjectId for DB
                email: currentUser.email // Pass email for UI mapping
            }); // USE REAL SOCKET
            setChatInput(''); // Clear input AFTER successful send
            // Force clear typing for self
            setTypingUsers(prev => prev.filter(u => u !== currentUser.displayName));
            console.log("handleSendChatMessage: Message sent via socket, input cleared.");
        } catch (error) {
            console.error("handleSendChatMessage: Error saving message:", error);
        }
    };

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


    useEffect(() => {
        if (room) {
            const prevEmails = prevParticipantsRef.current.map(p => p.email);
            const currentEmails = room.users.map(p => p.email);

            const newUsers = room.users.filter(p => !prevEmails.includes(p.email) && p.email !== currentUser?.email);
            const leftUsers = prevParticipantsRef.current.filter(p => !currentEmails.includes(p.email));
            if (leftUsers.length > 0) {
                leftUsers.forEach(user => {
                    postSystemMessage(`${user.displayName} has left the room.`);
                });
            }

            prevParticipantsRef.current = room.users;
        }
    }, [room, currentUser, postSystemMessage]);

    // --- Effects for Setup and Teardown ---
    const getMedia = useCallback(async () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            cameraVideoTrackRef.current = stream.getVideoTracks()[0];
            setLocalStream(stream);
            setMediaError(null);
            setIsMuted(false);
            setIsCameraOn(true);
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

        // --- REMOVED: let sessionId: string | null = null; ---

        joinRoom(roomId, currentUser);

        // --- FIX 2: Use the sessionIdRef ---
        startSession('study-room', roomId).then(id => {
            sessionIdRef.current = id; // Assign the ID to the ref
            console.log("Study session started:", id);
        });
        // --- END FIX ---

        // --- Start Timer ---
        setElapsedTime(0); // Reset timer on join
        startTimeRef.current = Date.now();
        intervalRef.current = setInterval(() => {
            if (startTimeRef.current) {
                const now = Date.now();
                const elapsed = Math.floor((now - startTimeRef.current) / 1000); // Elapsed seconds
                setElapsedTime(elapsed);
            }
        }, 1000);
        // --- End Start Timer ---

        const unsubRoom = onRoomUpdate(roomId, (updatedRoom) => {
            if (!updatedRoom) {
                console.log("Room not found or deleted, navigating away.");
                navigate('/study-lobby');
                return;
            }
            console.log("Room updated:", updatedRoom);
            setRoom(updatedRoom);
            setParticipants(updatedRoom.users);
            if (updatedRoom.technique) {
                setTechniqueName(updatedRoom.technique);
            }
            if (updatedRoom.techniqueState) {
                setTechniqueState(updatedRoom.techniqueState);
            }
        });

        const unsubTechnique = onTechniqueUpdate(roomId, (payload) => {
            setTechniqueName(payload.technique || 'Pomodoro Technique');
            setTechniqueState(payload.techniqueState || null);
        });

        // Initialize messages from history
        getRoomMessages(roomId).then(msgs => {
            setAllMessages(msgs);
        }).finally(() => {
            setInitialMessagesLoaded(true);
        });

        const unsubTyping = onTyping((data: any) => {
            if (data.roomId === roomId && data.userName !== currentUser?.displayName) {
                setTypingUsers(prev => prev.includes(data.userName) ? prev : [...prev, data.userName]);

                if (typingTimeoutRef.current[data.userName]) {
                    clearTimeout(typingTimeoutRef.current[data.userName]);
                }

                typingTimeoutRef.current[data.userName] = setTimeout(() => {
                    setTypingUsers(prev => prev.filter(u => u !== data.userName));
                }, 3000);
            }
        });

        const unsubMessages = subscribeToMessages((rawMsg) => {
            console.log("Received socket message:", rawMsg);
            const newMessage: ChatMessage = {
                id: rawMsg.id || Date.now().toString(),
                role: 'user',
                parts: [{ text: rawMsg.text || '' }],
                user: {
                    displayName: rawMsg.sender || 'Unknown',
                    email: rawMsg.email || rawMsg.userId || 'unknown'
                },
                timestamp: rawMsg.timestamp ? new Date(rawMsg.timestamp).getTime() : Date.now()
            };

            setAllMessages(prev => {
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        });
        const unsubNotes = onNotesUpdate(roomId, setNotes);

        const unsubResources = onResourcesUpdate(roomId, setResources);
        const unsubQuiz = onQuizUpdate(roomId, (quiz) => {
            setSharedQuiz(quiz);
            setParticipants(currentParticipants => {
                if (quiz && quiz.answers.length > 0 && quiz.answers.length === currentParticipants.length) {
                    setShowLeaderboard(true);
                }
                return currentParticipants;
            });

        });

        return () => {
            // --- Stop Timer ---
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            startTimeRef.current = null;
            intervalRef.current = null;
            // --- End Stop Timer ---

            unsubRoom();
            unsubTechnique();
            unsubMessages();
            unsubTyping();
            unsubNotes();

            unsubResources();
            unsubQuiz();
            if (currentUser) {
                leaveRoom(roomId);
            }

            // --- FIX 2 (cleanup): Use the ref here as well ---
            // This now acts as a fallback if the user closes the tab
            if (sessionIdRef.current) {
                console.log("Ending session from cleanup:", sessionIdRef.current);
                endSession(sessionIdRef.current);
                sessionIdRef.current = null;
            }
            if (autoModeratorTimerRef.current) {
                clearTimeout(autoModeratorTimerRef.current);
                autoModeratorTimerRef.current = null;
            }
            // --- END FIX ---
        };
    }, [roomId, currentUser, navigate]);

    useEffect(() => {
        if (!roomId || !currentUser || !initialMessagesLoaded || autoModeratorTriggered.current) {
            return;
        }

        const hasParticipantMessages = allMessages.some(msg => {
            const email = msg.user?.email;
            const displayName = msg.user?.displayName || '';
            const isSystem = email === SYSTEM_EMAIL;
            const isModerator = email === 'system-moderator' || displayName.includes('Moderator');
            return !isSystem && !isModerator;
        });

        if (hasParticipantMessages) {
            return;
        }

        autoModeratorTriggered.current = true;
        autoModeratorTimerRef.current = setTimeout(() => {
            requestModeration(roomId);
            autoModeratorTimerRef.current = null;
        }, 700);

        return () => {
            if (autoModeratorTimerRef.current) {
                clearTimeout(autoModeratorTimerRef.current);
                autoModeratorTimerRef.current = null;
            }
        };
    }, [roomId, currentUser, initialMessagesLoaded, allMessages]);

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
            const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
            setTechniqueRemainingSec(remaining);
        };

        computeRemaining();
        const interval = setInterval(computeRemaining, 1000);
        return () => clearInterval(interval);
    }, [techniqueState]);

    useEffect(() => {
        const shouldAutoAdvance = !!roomId
            && !!techniqueState
            && techniqueState.isRunning
            && techniqueRemainingSec <= 0;

        if (!shouldAutoAdvance || isAdvancingTechniqueRef.current) return;

        isAdvancingTechniqueRef.current = true;
        advanceTechniquePhase(roomId!, techniqueState!.version)
            .then((response) => {
                setTechniqueName(response.technique);
                setTechniqueState(response.techniqueState);
            })
            .catch((error) => {
                console.error('Failed to auto-advance technique phase:', error);
            })
            .finally(() => {
                isAdvancingTechniqueRef.current = false;
            });
    }, [techniqueRemainingSec, techniqueState, roomId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 0);

        return () => clearTimeout(timer);
    }, [participantChatMessages]);

    useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, sharedQuiz])

    useEffect(() => {
        if (room && room.technique && room.topic && !welcomeMessageSent.current) {
            const welcomeMessage = getLocalizedMessage('welcome', language, { technique: room.technique, topic: room.topic });
            postSystemMessage(welcomeMessage);
            welcomeMessageSent.current = true;
        }
    }, [room, postSystemMessage, language]);

    const handleTechniqueToggle = async () => {
        if (!roomId || !techniqueState) return;
        setIsTechniqueSyncing(true);
        try {
            const action = techniqueState.isRunning ? 'pause' : 'start';
            const response = await updateTechniqueState(roomId, action, techniqueState.version);
            setTechniqueName(response.technique);
            setTechniqueState(response.techniqueState);
        } catch (error) {
            console.error('Failed to toggle technique state:', error);
        } finally {
            setIsTechniqueSyncing(false);
        }
    };

    const handleTechniqueReset = async () => {
        if (!roomId) return;
        setIsTechniqueSyncing(true);
        try {
            const response = await updateTechniqueState(roomId, 'reset', techniqueState?.version);
            setTechniqueName(response.technique);
            setTechniqueState(response.techniqueState);
        } catch (error) {
            console.error('Failed to reset technique state:', error);
        } finally {
            setIsTechniqueSyncing(false);
        }
    };

    const handleTechniqueSkip = async () => {
        if (!roomId || !techniqueState) return;
        if (isAdvancingTechniqueRef.current) return;
        isAdvancingTechniqueRef.current = true;
        setIsTechniqueSyncing(true);
        try {
            const response = await advanceTechniquePhase(roomId, techniqueState.version);
            setTechniqueName(response.technique);
            setTechniqueState(response.techniqueState);
        } catch (error) {
            console.error('Failed to advance technique phase:', error);
        } finally {
            isAdvancingTechniqueRef.current = false;
            setIsTechniqueSyncing(false);
        }
    };

    // --- Control Handlers ---
    const handleToggleMute = () => {
        localStream?.getAudioTracks().forEach(track => track.enabled = !track.enabled);
        setIsMuted(prev => !prev);
    };

    const handleToggleCamera = () => {
        if (isScreenSharing) return;
        localStream?.getVideoTracks().forEach(track => track.enabled = !track.enabled);
        setIsCameraOn(prev => !prev);
    };

    const handleHangUp = async () => {
        // --- FIX 3: Explicitly end the session on "Leave" button click ---
        if (sessionIdRef.current) {
            console.log("Ending session from HangUp:", sessionIdRef.current);
            await endSession(sessionIdRef.current);
            sessionIdRef.current = null; // Clear ref so cleanup doesn't run it again
        }
        // --- END FIX ---

        if (roomId && currentUser) {
            await leaveRoom(roomId);
        }
        localStream?.getTracks().forEach(track => track.stop());
        navigate('/study-lobby');
    };

    const handleToggleScreenShare = async () => {
        if (!localStreamRef.current && !isScreenSharing) {
            setMediaError({ message: "Cannot share screen without media permissions. Please grant access and retry.", type: 'error' });
            return;
        }

        if (isScreenSharing) {
            const screenTrack = localStreamRef.current?.getVideoTracks().find(track => track.label.startsWith('screen'));
            if (screenTrack) {
                screenTrack.stop();
                localStreamRef.current?.removeTrack(screenTrack);
            }

            if (cameraVideoTrackRef.current) {
                try {
                    cameraVideoTrackRef.current.enabled = true;
                    localStreamRef.current?.addTrack(cameraVideoTrackRef.current);
                    setIsCameraOn(true);
                } catch (addTrackError) {
                    console.error("Error re-adding camera track:", addTrackError);
                    await getMedia();
                }
            } else {
                await getMedia();
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
                const screenTrack = screenStream.getVideoTracks()[0];

                screenTrack.onended = () => {
                    if (localStreamRef.current && cameraVideoTrackRef.current) {
                        localStreamRef.current.removeTrack(screenTrack);
                        localStreamRef.current.addTrack(cameraVideoTrackRef.current);
                        setIsScreenSharing(false);
                        setIsCameraOn(true);
                    } else if (localStreamRef.current) {
                        localStreamRef.current.removeTrack(screenTrack);
                        setIsScreenSharing(false);
                    }
                };

                if (localStreamRef.current) {
                    const currentVideoTrack = localStreamRef.current.getVideoTracks()[0];
                    if (currentVideoTrack) {
                        localStreamRef.current.removeTrack(currentVideoTrack);
                    }
                    localStreamRef.current.addTrack(screenTrack);
                    setIsScreenSharing(true);
                    setIsCameraOn(true);
                } else {
                    localStreamRef.current = new MediaStream([screenTrack]);
                    setLocalStream(localStreamRef.current);
                    setIsScreenSharing(true);
                    setIsCameraOn(true);
                }
            } catch (err: any) {
                console.error("Screen sharing failed:", err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setMediaError({
                        message: "Screen sharing permission was denied. You can grant it from the browser's address bar.",
                        type: 'info'
                    });
                } else {
                    setMediaError({
                        message: "Could not start screen sharing due to an error.",
                        type: 'error'
                    });
                }
            }
        }
    };

    const handleReaction = (emoji: string) => {
        setReactions(prev => [...prev, { id: Date.now(), emoji }]);
    };

    const handleMentionMember = (member: { email: string; displayName: string }) => {
        setActiveTab('chat');
        setIsMobilePanelOpen(false);
        setChatInput(`@${member.displayName} `);
    };

    const handleAskMember = (member: { email: string; displayName: string }) => {
        setActiveTab('chat');
        setIsMobilePanelOpen(false);
        setChatInput(`@${member.displayName} can you explain your approach for this section?`);
    };

    const handleWaveMember = (member: { email: string; displayName: string }) => {
        const waveEmoji = '\u{1F44B}';
        handleReaction(waveEmoji);
        setActiveTab('chat');
        setIsMobilePanelOpen(false);
        void handleSendChatMessage(`${waveEmoji} @${member.displayName}`);
    };

    const handleFocusPromptToGroup = () => {
        setActiveTab('chat');
        setIsMobilePanelOpen(false);
        setChatInput('Team check-in: share one concept you understand and one part you want help with.');
    };

    const handleInviteFromMembers = () => {
        setIsMobilePanelOpen(false);
        setShowShareModal(true);
    };

    const handleModerateMember = async (
        member: { email: string; displayName: string },
        action: 'mute_chat' | 'unmute_chat' | 'remove' | 'transfer_host'
    ) => {
        if (!roomId || !isCurrentUserHost) return;

        const actionLabel: Record<typeof action, string> = {
            mute_chat: 'Mute',
            unmute_chat: 'Unmute',
            remove: 'Remove',
            transfer_host: 'Transfer Host'
        };

        setMemberActionState({ email: member.email, action });
        try {
            const result = await moderateRoomMember(roomId, {
                action,
                targetUserEmail: member.email
            });
            const message = result?.message || `${actionLabel[action]} action completed for ${member.displayName}.`;
            await postSystemMessage(message);
        } catch (error: any) {
            const details = error?.response?.data?.message || error?.message || 'Action failed';
            setAiMessages(prev => [...prev, {
                role: 'model',
                parts: [{ text: `Member action failed: ${details}` }]
            }]);
        } finally {
            setMemberActionState(null);
        }
    };

    const handleMuteMember = async (member: { email: string; displayName: string }) => {
        await handleModerateMember(member, 'mute_chat');
    };

    const handleUnmuteMember = async (member: { email: string; displayName: string }) => {
        await handleModerateMember(member, 'unmute_chat');
    };

    const handleRemoveMember = async (member: { email: string; displayName: string }) => {
        const confirmed = window.confirm(`Remove ${member.displayName} from this room?`);
        if (!confirmed) return;
        await handleModerateMember(member, 'remove');
    };

    const handleTransferHost = async (member: { email: string; displayName: string }) => {
        const confirmed = window.confirm(`Transfer room host privileges to ${member.displayName}?`);
        if (!confirmed) return;
        await handleModerateMember(member, 'transfer_host');
    };

    const handleSaveSharedNote = async (content: string) => {
        if (!roomId) return;
        setIsSavingSharedNote(true);
        try {
            await saveRoomAINotes(roomId, content); // Use the service function for shared AI notes
            console.log("Shared note saved.");
        } catch (error) {
            console.error("Failed to save shared note:", error);
            // Optionally show error to user
        } finally {
            setIsSavingSharedNote(false);
        }
    };

    const handleUploadResource = async (file: File) => {
        if (!roomId || !currentUser) return;
        setIsUploading(true);
        await uploadResource(roomId, file, { displayName: currentUser.displayName });
        postSystemMessage(`${currentUser.displayName} uploaded a new resource: ${file.name}`);
        setIsUploading(false);
    };

    const handleDeleteResource = async (fileName: string) => {
        if (!roomId) return;
        await deleteResource(roomId, fileName);
    };

    // --- AI Buddy & Quiz Handlers ---
    const handleSendAiMessage = useCallback(async () => {
        if (!notes || notes.trim() === '' || notes.startsWith("Extracting text from")) {
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: "Please upload some notes first using the button above so I have context!" }] }]);
            setAiInput('');
            return;
        }

        if (!aiInput.trim() || isAiLoading) return;

        const currentMessageText = aiInput;
        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: currentMessageText }] };
        setAiMessages(prev => [...prev, newUserMessage]);
        setAiInput('');
        setIsAiLoading(true);

        console.log("Sending AI message with notes context (length):", notes.length);

        try {
            const stream = await streamStudyBuddyChat(currentMessageText, notes, language);
            if (!stream) throw new Error("Failed to start stream");

            const reader = stream.getReader();
            const decoder = new TextDecoder();
            let modelResponse = '';
            let buffer = '';
            let streamedMessageStarted = false;

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
                                if (!streamedMessageStarted) {
                                    streamedMessageStarted = true;
                                    setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: modelResponse }] }]);
                                } else {
                                    setAiMessages(prev => {
                                        const newMessages = [...prev];
                                        if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === 'model') {
                                            newMessages[newMessages.length - 1].parts = [{ text: modelResponse }];
                                        } else {
                                            return [...prev, { role: 'model', parts: [{ text: modelResponse }] }];
                                        }
                                        return newMessages;
                                    });
                                }
                            }
                        } catch (e) {
                            console.error("Error parsing stream chunk", e);
                        }
                    }
                }
            }
            if (!streamedMessageStarted) {
                console.warn("AI stream finished without generating content.");
            }

        } catch (err) {
            console.error("Error calling streamStudyBuddyChat:", err);
            const errorText = err instanceof Error ? err.message : "Sorry, an unexpected error occurred while contacting the AI.";
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${errorText}` }] }]);
        } finally {
            setIsAiLoading(false);
        }
    }, [aiInput, isAiLoading, notes, language]);

    const handleGenerateQuiz = async () => {
        if (isAiLoading || !notes.trim() || !roomId) return;
        setIsAiLoading(true);
        postSystemMessage(`${currentUser?.displayName} is generating a quiz for the group!`);

        try {
            const quizJsonString = await generateQuizQuestion(notes, language);
            const parsedQuiz = JSON.parse(quizJsonString);
            await saveQuiz(roomId, parsedQuiz);
        } catch (err) {
            postSystemMessage("Sorry, I couldn't generate a quiz. Please try again.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleSummarizeNotes = async () => {
        if (!notes || notes.trim() === '' || notes.startsWith("Extracting text from")) {
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: "Please upload notes first so I can summarize them." }] }]);
            return;
        }

        if (isAiLoading) return;
        setIsAiLoading(true);

        try {
            const summary = await summarizeText(notes);
            const cleanedSummary = String(summary || '').trim();
            if (!cleanedSummary) {
                throw new Error("Summary came back empty. Please try again.");
            }

            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: cleanedSummary }] }]);
        } catch (err) {
            const errorText = err instanceof Error ? err.message : "Sorry, I couldn't summarize these notes right now.";
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: `Error: ${errorText}` }] }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAnswerQuiz = async (selectedIndex: number) => {
        if (!sharedQuiz || !roomId || !currentUser?.email || !currentUser.displayName) return;
        await saveQuizAnswer(roomId, currentUser.email, currentUser.displayName, selectedIndex);
    };

    const handleClearQuiz = async () => {
        if (!roomId) return;
        setShowLeaderboard(false);
        await clearQuiz(roomId);
    };


    const handleNotesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !roomId) return;
        const previousNotesSnapshot = notes;

        event.target.value = '';

        const MAX_FILE_SIZE = 4 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setAiMessages([{ role: 'model', parts: [{ text: `File is too large. Please upload a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` }] }]);
            return;
        }

        setIsExtracting(true);
        setNotes(`Extracting text from ${file.name}...`);
        setAiMessages([{ role: 'model', parts: [{ text: "Analyzing your document..." }] }]);

        try {
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    if (!result || !result.includes(',')) {
                        return reject(new Error("Invalid file data"));
                    }
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(file);
            });

            let mimeType = file.type;
            if (!mimeType) {
                const extension = file.name.split('.').pop()?.toLowerCase();
                const mimeMap: { [key: string]: string } = {
                    'pdf': 'application/pdf',
                    'txt': 'text/plain',
                    'md': 'text/plain',
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    'ppt': 'application/vnd.ms-powerpoint'
                };
                mimeType = mimeMap[extension || ''] || 'application/octet-stream';
            }

            let extracted = '';
            if (mimeType.startsWith('text/')) {
                const binary = atob(base64Data);
                const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
                extracted = new TextDecoder().decode(bytes);
            } else {
                extracted = await extractTextFromFile(base64Data, mimeType);
            }

            if (!extracted.trim()) {
                throw new Error("No readable text found in the uploaded file.");
            }

            await saveRoomAINotes(roomId, extracted);

            setAiMessages([{ role: 'model', parts: [{ text: "Great, I've reviewed the notes. The AI context is now updated for everyone in the room." }] }]);

            await postSystemMessage(`${currentUser?.displayName} updated the study notes with the file: ${file.name}`);

        } catch (err: any) {
            const errorMessage = String(err?.message || "Sorry, I couldn't read that file.");
            const retryAfterSec = typeof err?.retryAfterSec === 'number' ? err.retryAfterSec : undefined;
            const isQuotaError = err?.code === 'AI_QUOTA_EXCEEDED'
                || err?.status === 429
                || /quota|too many requests|rate limit|429/i.test(errorMessage);
            if (isQuotaError) {
                console.warn('File extraction rate limited; preserving previous notes.');
            } else {
                console.error("File upload and processing failed:", err);
            }
            setNotes(previousNotesSnapshot);

            if (isQuotaError) {
                const retryHint = retryAfterSec ? ` Please retry in about ${retryAfterSec}s.` : ' Please retry in a short while.';
                setAiMessages([{
                    role: 'model',
                    parts: [{
                        text: `AI extraction is temporarily rate limited.${retryHint} Your previous shared notes were kept unchanged.`
                    }]
                }]);
            } else {
                setAiMessages([{
                    role: 'model',
                    parts: [{
                        text: `${errorMessage} Please ensure the file is a supported format (PDF, PPTX, Image, or Text) and not corrupted.`
                    }]
                }]);
            }
        } finally {
            setIsExtracting(false);
        }
    };

    // --- Component Return ---
    return (
        <div className="h-full flex flex-col text-slate-200 p-0 m-[-2rem] relative overflow-hidden bg-slate-950">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_10%,rgba(99,102,241,0.22),transparent_40%),radial-gradient(circle_at_92%_12%,rgba(16,185,129,0.18),transparent_35%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.18),transparent_45%)]" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:36px_36px] opacity-20" />
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-0" />
            <div className="relative z-10 flex flex-col h-full min-h-0">
                <Reactions reactions={reactions} />
                {showShareModal && <ShareModal roomId={roomId || ''} onClose={() => setShowShareModal(false)} />}
                {isMobilePanelOpen && (
                    <button
                        type="button"
                        onClick={() => setIsMobilePanelOpen(false)}
                        aria-label="Close study panel"
                        className="xl:hidden fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm"
                    />
                )}

                <header className="px-3 md:px-4 py-3 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-[0.25em] text-cyan-300/80 font-semibold">Focus Room</p>
                            <h2 className="text-sm md:text-base font-semibold text-slate-100 truncate">{room?.name || 'Study Room'}</h2>
                            <p className="text-[11px] text-slate-400 truncate">Topic: {room?.topic || 'General study'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                                <Users size={12} />
                                {participants.length} online
                            </span>
                            <span className="hidden sm:inline-flex items-center rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-200">
                                {activeTabLabel}
                            </span>
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => setIsMobilePanelOpen(prev => !prev)}
                                className="xl:hidden h-8 px-3 text-xs bg-violet-600/80 hover:bg-violet-500 text-white border-violet-400/30"
                            >
                                {isMobilePanelOpen ? 'Close Panel' : 'Study Panel'}
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden flex-col xl:flex-row relative min-h-0">
                    {/* Main Video Grid */}
                    <main className="flex-1 flex flex-col p-3 md:p-4 relative min-h-0">
                        {/* Technique Orchestrator */}
                        <div className="mb-4 rounded-xl border border-violet-500/20 bg-slate-900/70 backdrop-blur-md p-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-violet-300/80 font-semibold">Technique Orchestrator</p>
                                    <h3 className="text-sm font-semibold text-slate-100">{effectiveTechniqueLabel}</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] px-2 py-1 rounded-full border ${isTechniqueRunning ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' : 'text-amber-300 border-amber-500/40 bg-amber-500/10'}`}>
                                        {isTechniqueRunning ? 'Running' : 'Paused'}
                                    </span>
                                    <span className="text-xs text-slate-300 font-mono bg-slate-800/70 px-2 py-1 rounded-md border border-slate-700">
                                        {formatPhaseTime(techniqueRemainingSec)}
                                    </span>
                                    <span className="text-[11px] text-slate-400">{techniqueCycleLabel}</span>
                                </div>
                            </div>

                            <div className="mt-2 flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-violet-200 font-medium">
                                        {techniqueState?.phaseLabel || 'Initializing...'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                        {techniqueState?.phasePrompt || 'Preparing your shared session flow...'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={handleTechniqueToggle}
                                        disabled={!techniqueState || isTechniqueSyncing}
                                        className="h-8 px-3 text-xs"
                                    >
                                        {isTechniqueRunning ? <Pause size={12} className="mr-1.5" /> : <Play size={12} className="mr-1.5" />}
                                        {isTechniqueRunning ? 'Pause' : 'Resume'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleTechniqueSkip}
                                        disabled={!techniqueState || isTechniqueSyncing}
                                        className="h-8 px-3 text-xs"
                                    >
                                        <SkipForward size={12} className="mr-1.5" /> Skip
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleTechniqueReset}
                                        disabled={isTechniqueSyncing}
                                        className="h-8 px-3 text-xs"
                                    >
                                        <RotateCcw size={12} className="mr-1.5" /> Reset
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {mediaError && (
                            // ... (media error display) ...
                            <div className={`
                            p-3 rounded-lg text-sm mb-4 ring-1 flex justify-between items-center animate-in fade-in-50
                            ${mediaError.type === 'error'
                                    ? 'bg-red-900/50 text-red-300 ring-red-700'
                                    : 'bg-sky-900/50 text-sky-300 ring-sky-700'
                                }
                        `}>
                                <div className="flex items-center gap-2">
                                    {mediaError.type === 'error' ? <AlertTriangle size={18} /> : <Info size={18} />}
                                    <span className="font-medium">{mediaError.message}</span>
                                </div>
                                <button onClick={getMedia} className={`
                                font-semibold text-white rounded-md py-1 px-3 text-xs transition-colors
                                ${mediaError.type === 'error'
                                        ? 'bg-red-600/50 hover:bg-red-600/80'
                                        : 'bg-sky-600/50 hover:bg-sky-600/80'
                                    }
                            `}>
                                    Retry Access
                                </button>
                            </div>
                        )}
                        <div className="flex-1 min-h-0 relative">
                            {showWhiteboard ? (
                                <div className="absolute inset-0 flex flex-col bg-slate-800/50 rounded-2xl border border-white/5 overflow-hidden animate-in fade-in-50 zoom-in-95">
                                    <div className="flex items-center justify-between p-3 bg-black/40 border-b border-white/5">
                                        <div className="flex items-center gap-2">
                                            <Palette size={16} className="text-violet-400" />
                                            <span className="text-sm font-medium">Shared Whiteboard</span>
                                        </div>
                                        <button onClick={() => setShowWhiteboard(false)} className="text-slate-400 hover:text-white">
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <div className="flex-1 relative">
                                        <Whiteboard roomId={roomId || ''} />
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
                                    <VideoTile stream={localStream} displayName={currentUser?.displayName || 'You'} isMuted={isMuted} isLocal={true} isScreenSharing={isScreenSharing} />
                                    {participants.filter(p => p.email !== currentUser?.email).map(p => (
                                        <VideoTile key={p.email} displayName={p.displayName} isMuted={false} />
                                    ))}
                                </div>
                            )}
                        </div>

                    </main>

                    {/* Side Panel */}
                    {/* ... (Side Panel Tabs and Content remain the same) ... */}
                    {/* Side Panel */}
                    <aside className={`fixed inset-x-3 top-[5.5rem] bottom-24 z-50 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-white/10 flex flex-col min-h-0 shadow-2xl transition-all duration-300 xl:relative xl:inset-auto xl:top-auto xl:bottom-auto xl:z-20 xl:w-[24rem] 2xl:w-[26rem] xl:h-full xl:rounded-none xl:bg-slate-900/40 xl:border-l xl:border-t-0 xl:border-r-0 xl:border-b-0 xl:border-white/5 ${isMobilePanelOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-[105%] pointer-events-none xl:opacity-100 xl:translate-y-0 xl:pointer-events-auto'}`}>
                        <div className="flex border-b border-white/5 p-2 gap-1 bg-black/20 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <TabButton id="chat" activeTab={activeTab} setActiveTab={setActiveTab} icon={MessageSquare} label="Chat" />
                            <TabButton id="ai" activeTab={activeTab} setActiveTab={setActiveTab} icon={Brain} label="AI" />
                            <TabButton id="notes" activeTab={activeTab} setActiveTab={setActiveTab} icon={FileText} label="Notes" />
                            <TabButton id="tools" activeTab={activeTab} setActiveTab={setActiveTab} icon={Briefcase} label="Tools" />
                            <TabButton id="participants" activeTab={activeTab} setActiveTab={setActiveTab} icon={Users} label="Members" count={participants.length} />
                        </div>

                        {activeTab === 'chat' && (
                            <ChatPanel
                                messages={participantChatMessages}
                                input={chatInput}
                                setInput={setChatInput}
                                onSend={handleSendChatMessage}
                                currentUser={currentUser}
                                chatEndRef={chatEndRef}
                                typingUsers={typingUsers}
                                roomId={roomId}
                            />
                        )}
                        {activeTab === 'participants' && (
                            <ParticipantsPanel
                                participants={participants}
                                currentUserId={currentUser?.id}
                                currentUserEmail={currentUser?.email}
                                roomOwnerId={room?.createdById}
                                roomOwnerEmail={room?.createdByEmail}
                                maxUsers={room?.maxUsers}
                                isCurrentUserHost={isCurrentUserHost}
                                mutedEmailSet={mutedEmailSet}
                                memberActionState={memberActionState}
                                onMentionMember={handleMentionMember}
                                onAskMember={handleAskMember}
                                onWaveMember={handleWaveMember}
                                onFocusPrompt={handleFocusPromptToGroup}
                                onInvitePeople={handleInviteFromMembers}
                                onMuteMember={handleMuteMember}
                                onUnmuteMember={handleUnmuteMember}
                                onRemoveMember={handleRemoveMember}
                                onTransferHost={handleTransferHost}
                            />
                        )}
                        {activeTab === 'ai' && (
                            <AiPanel
                                messages={aiMessages}
                                input={aiInput}
                                setInput={setAiInput}
                                onSend={handleSendAiMessage}
                                notes={notes}
                                isExtracting={isExtracting}
                                onUploadClick={() => notesFileInputRef.current?.click()}
                                onQuizMe={handleGenerateQuiz}
                                onSummarize={handleSummarizeNotes}
                                sharedQuiz={sharedQuiz}
                                chatEndRef={aiChatEndRef}
                                isLoading={isAiLoading}
                            />
                        )}
                        {activeTab === 'notes' && (
                            <StudyRoomNotesPanel
                                sharedNoteContent={notes} // Pass the shared text content
                                resources={resources} // Pass the list of shared files
                                onSaveSharedNote={handleSaveSharedNote} // Pass the save handler for text
                                onUploadResource={handleUploadResource} // Pass the file upload handler
                                onDeleteResource={handleDeleteResource} // Pass the file delete handler
                                isSavingNote={isSavingSharedNote} // Pass loading state for saving text
                                isUploading={isUploading} // Pass loading state for file upload
                            />
                        )}
                        {activeTab === 'tools' && (
                            <StudyToolsPanel
                                notes={notes}
                                topic={room?.topic || 'General Study'}
                                isActive={true}
                                courseId={room?.courseId}
                            />
                        )}
                    </aside>

                </div>

                {sharedQuiz && (
                    <div className="fixed inset-0 z-[70] bg-slate-950/85 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
                        {showLeaderboard ?
                            <Leaderboard quiz={sharedQuiz} participants={participants} onClear={handleClearQuiz} /> :
                            <QuizDisplay quiz={sharedQuiz} onAnswer={handleAnswerQuiz} currentUser={currentUser} />
                        }
                    </div>
                )}

                <input
                    type="file"
                    ref={notesFileInputRef}
                    onChange={handleNotesFileUpload}
                    accept=".txt,.md,.pdf,.pptx,.ppt,.png,.jpg,.jpeg"
                    style={{ display: 'none' }}
                />

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
                    formattedSessionTime={formatElapsedTime(elapsedTime)} // Pass formatted time
                    showMusicPlayer={showMusicPlayer} // Pass showMusicPlayer state
                    showWhiteboard={showWhiteboard} // Pass showWhiteboard state
                >
                    <MusicPlayer visible={showMusicPlayer} onClose={() => setShowMusicPlayer(false)} />
                </RoomControls>
                {/* --- END FIX --- */}
            </div>
        </div>
    );
};

// ... (Sub-Components remain the same) ...
// --- QuizDisplay Component ---
const QuizDisplay: React.FC<{ quiz: SharedQuiz, onAnswer: (index: number) => void, currentUser: any }> = ({ quiz, onAnswer, currentUser }) => {
    const userAnswer = quiz.answers.find(a => a.userId === currentUser?.email);

    return (
        <div className="bg-slate-800 p-6 rounded-lg w-full max-w-2xl animate-in fade-in-50">
            <p className="font-semibold text-slate-200 text-base mb-1">Group Quiz: <span className="capitalize font-light">{quiz.topic}</span></p>
            <p className="font-bold text-slate-100 text-lg mb-4">{quiz.question}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quiz.options.map((option, index) => {
                    const isSelected = userAnswer?.answerIndex === index;
                    const isCorrect = quiz.correctOptionIndex === index;
                    let buttonClass = 'bg-slate-700 hover:bg-slate-600';
                    if (userAnswer !== undefined) {
                        if (isSelected) buttonClass = 'bg-sky-700 ring-2 ring-sky-500';
                        else buttonClass = 'bg-slate-800/50 opacity-60';
                    }

                    return (
                        <button
                            key={index}
                            onClick={() => onAnswer(index)}
                            disabled={userAnswer !== undefined}
                            className={`p-3 text-left text-sm rounded-lg transition-all duration-200 ${buttonClass}`}
                        >
                            {option}
                        </button>
                    )
                })}
            </div>
            {userAnswer !== undefined && <p className="text-center text-slate-400 mt-4 text-sm">Waiting for others to answer...</p>}
        </div>
    );
};

// --- Leaderboard Component ---
const Leaderboard: React.FC<{ quiz: SharedQuiz, participants: { email: string; displayName: string }[], onClear: () => void }> = ({ quiz, participants, onClear }) => {
    const scores = participants.map(p => {
        const answer = quiz.answers.find(a => a.userId === p.email);
        const isCorrect = answer?.answerIndex === quiz.correctOptionIndex;
        return {
            displayName: p.displayName,
            score: isCorrect ? 1 : 0,
            answered: !!answer,
        };
    }).sort((a, b) => b.score - a.score);

    return (
        <div className="bg-slate-800 p-6 rounded-lg w-full max-w-md animate-in fade-in-50">
            <h3 className="text-xl font-bold text-center text-white mb-2">Quiz Results!</h3>
            <p className="text-center text-slate-300 mb-1 text-sm">{quiz.question}</p>
            <p className="text-center text-emerald-400 mb-4 text-sm font-medium">Correct Answer: {quiz.options[quiz.correctOptionIndex]}</p>
            <div className="space-y-2">
                {scores.map((player, index) => (
                    <div key={player.displayName} className="flex justify-between items-center bg-slate-700 p-3 rounded-lg">
                        <span className="font-medium">{index + 1}. {player.displayName}</span>
                        <span className={`font-bold ${player.score > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {player.answered ? (player.score > 0 ? '+1 Point' : '+0 Points') : 'Did not answer'}
                        </span>
                    </div>
                ))}
            </div>
            <Button onClick={onClear} className="w-full mt-6">Close Results</Button>
        </div>
    );
};

const TabButton: React.FC<{ id: ActiveTab, activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void, icon: React.ElementType, label: string, count?: number }> = ({ id, activeTab, setActiveTab, icon: Icon, label, count }) => (
    <button
        onClick={() => setActiveTab(id)}
        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 min-w-[84px] md:min-w-0 md:flex-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 ${activeTab === id
            ? 'bg-violet-600/20 text-violet-300 shadow-[0_0_10px_rgba(124,58,237,0.2)]'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
            }`}
        title={label || 'Members'}
    >
        <Icon size={15} />
        {label && <span>{label}</span>}
        {count !== undefined && count > 0 && <span className="text-[10px] bg-slate-800 text-slate-300 rounded-full px-1.5 min-w-[1.2em]">{count}</span>}
    </button>
);

const ChatPanel: React.FC<any> = ({ messages, input, setInput, onSend, currentUser, chatEndRef, typingUsers, roomId }) => {

    const handleSend = () => {
        if (!input.trim()) return;
        onSend(input);
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden p-4">
            <div className="flex-1 overflow-y-auto pr-2">
                {messages.map((msg: ChatMessage, i: number) => {
                    const isMe = msg.user?.email === currentUser?.email;
                    const isMod = msg.user?.email === 'system-moderator' || msg.user?.displayName?.includes('Moderator');

                    return (
                        <div key={msg.id || i} className={`flex items-start gap-3 my-4 ${isMe ? 'flex-row-reverse' : ''} ${isMod ? 'justify-center w-full' : ''} group`}>
                            {!isMod && (
                                <img
                                    src={`https://ui-avatars.com/api/?name=${msg.user?.displayName || '?'}&background=random&color=fff`}
                                    alt="avatar"
                                    className="w-8 h-8 rounded-full shadow-lg ring-2 ring-white/10"
                                />
                            )}
                            <div className={`flex flex-col ${isMod ? 'max-w-[95%] w-full items-center' : `max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}`}>
                                {!isMod && (
                                    <div className="flex items-center gap-2 mb-1 opacity-70">
                                        <span className="text-xs font-medium text-slate-300">{msg.user?.displayName}</span>
                                        {msg.timestamp && <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </div>
                                )}
                                <div className={`p-3.5 text-sm shadow-md backdrop-blur-sm relative ${isMod
                                    ? 'bg-indigo-900/40 border border-indigo-500/50 text-indigo-100 rounded-xl text-center w-full py-2 px-6'
                                    : isMe
                                        ? 'bg-violet-600/90 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-2xl rounded-tl-sm'
                                    }`}>
                                    {isMod && (
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <Bot size={14} className="text-indigo-400" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">NexusAI Guardian</span>
                                        </div>
                                    )}
                                    {msg.parts[0].text}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 italic px-2 mb-2 animate-pulse">
                        <div className="flex gap-1">
                            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </div>
                )}
                <div ref={chatEndRef}></div>
            </div>
            <div className="mt-auto flex gap-2 relative">
                <Input
                    name="chat-message"
                    value={input}
                    onChange={e => {
                        setInput(e.target.value);
                        if (roomId && currentUser) {
                            sendTyping(roomId, currentUser.displayName);
                        }
                    }}
                    onKeyPress={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                    placeholder="Type a message..."
                    className="flex-1"
                />
                <Button onClick={handleSend} disabled={!input.trim()} className="px-3"><Send size={16} /></Button>
            </div>
        </div>
    );
}

const ParticipantsPanel: React.FC<{
    participants: { id?: string; email: string; displayName: string }[];
    currentUserId?: string;
    currentUserEmail?: string;
    roomOwnerId?: string;
    roomOwnerEmail?: string;
    maxUsers?: number;
    isCurrentUserHost: boolean;
    mutedEmailSet: Set<string>;
    memberActionState: { email: string; action: string } | null;
    onMentionMember: (member: { email: string; displayName: string }) => void;
    onAskMember: (member: { email: string; displayName: string }) => void;
    onWaveMember: (member: { email: string; displayName: string }) => void;
    onFocusPrompt: () => void;
    onInvitePeople: () => void;
    onMuteMember: (member: { email: string; displayName: string }) => void;
    onUnmuteMember: (member: { email: string; displayName: string }) => void;
    onRemoveMember: (member: { email: string; displayName: string }) => void;
    onTransferHost: (member: { email: string; displayName: string }) => void;
}> = ({
    participants,
    currentUserId,
    currentUserEmail,
    roomOwnerId,
    roomOwnerEmail,
    maxUsers,
    isCurrentUserHost,
    mutedEmailSet,
    memberActionState,
    onMentionMember,
    onAskMember,
    onWaveMember,
    onFocusPrompt,
    onInvitePeople,
    onMuteMember,
    onUnmuteMember,
    onRemoveMember,
    onTransferHost
}) => {
        const [search, setSearch] = useState('');
        const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

        const visibleParticipants = useMemo(() => {
            const query = search.trim().toLowerCase();
            const sorted = [...participants].sort((a, b) => {
                const aEmail = (a.email || '').toLowerCase();
                const bEmail = (b.email || '').toLowerCase();
                const meEmail = (currentUserEmail || '').toLowerCase();
                const aIsMe = aEmail === meEmail ? 1 : 0;
                const bIsMe = bEmail === meEmail ? 1 : 0;
                if (aIsMe !== bIsMe) return bIsMe - aIsMe;

                const aIsOwnerById = roomOwnerId && a.id && a.id === roomOwnerId ? 1 : 0;
                const bIsOwnerById = roomOwnerId && b.id && b.id === roomOwnerId ? 1 : 0;
                const aIsOwnerByEmail = roomOwnerEmail && aEmail === roomOwnerEmail.toLowerCase() ? 1 : 0;
                const bIsOwnerByEmail = roomOwnerEmail && bEmail === roomOwnerEmail.toLowerCase() ? 1 : 0;
                const aIsOwner = Math.max(aIsOwnerById, aIsOwnerByEmail);
                const bIsOwner = Math.max(bIsOwnerById, bIsOwnerByEmail);
                if (aIsOwner !== bIsOwner) return bIsOwner - aIsOwner;

                return a.displayName.localeCompare(b.displayName);
            });

            if (!query) return sorted;

            return sorted.filter(member => (
                member.displayName.toLowerCase().includes(query)
                || member.email.toLowerCase().includes(query)
            ));
        }, [participants, search, currentUserEmail, roomOwnerEmail]);

        const openSeats = Math.max(0, (maxUsers || participants.length) - participants.length);
        const isRoomFull = openSeats === 0;

        const handleCopyEmail = async (email: string) => {
            try {
                if (!navigator.clipboard?.writeText) return;
                await navigator.clipboard.writeText(email);
                setCopiedEmail(email);
                setTimeout(() => {
                    setCopiedEmail(prev => prev === email ? null : prev);
                }, 1400);
            } catch (error) {
                console.error('Failed to copy member email', error);
            }
        };

        return (
            <div className="p-4 space-y-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Members</p>
                        <p className="text-base font-semibold text-slate-100">{participants.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Capacity</p>
                        <p className="text-base font-semibold text-slate-100">{maxUsers || participants.length}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-slate-800/60 p-2.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Open Seats</p>
                        <p className={`text-base font-semibold ${isRoomFull ? 'text-rose-300' : 'text-emerald-300'}`}>{openSeats}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onFocusPrompt}
                        className="flex-1 h-8 text-[11px] bg-violet-600/20 text-violet-200 border border-violet-500/30 hover:bg-violet-600/30"
                    >
                        Focus Prompt
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onInvitePeople}
                        className="flex-1 h-8 text-[11px] bg-cyan-600/20 text-cyan-200 border border-cyan-500/30 hover:bg-cyan-600/30"
                    >
                        Invite
                    </Button>
                </div>

                {isCurrentUserHost ? (
                    <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-3 py-2 text-[11px] text-emerald-200">
                        Host controls enabled: you can mute chat, remove members, and transfer host.
                    </div>
                ) : (
                    <div className="rounded-xl border border-white/10 bg-slate-800/50 px-3 py-2 text-[11px] text-slate-400">
                        Host controls are available only to the room host.
                    </div>
                )}

                <Input
                    name="member-search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members by name or email..."
                    className="h-9 text-xs"
                />

                <div className="space-y-2">
                    {visibleParticipants.length === 0 && (
                        <div className="text-center text-xs text-slate-500 py-6 border border-dashed border-slate-700 rounded-xl">
                            No members match your search.
                        </div>
                    )}

                    {visibleParticipants.map(member => {
                        const emailLower = (member.email || '').toLowerCase();
                        const meEmail = (currentUserEmail || '').toLowerCase();
                        const isMeById = !!(currentUserId && member.id && currentUserId === member.id);
                        const isMe = isMeById || emailLower === meEmail;
                        const isOwnerById = !!(roomOwnerId && member.id && roomOwnerId === member.id);
                        const isOwnerByEmail = !!(roomOwnerEmail && emailLower === roomOwnerEmail.toLowerCase());
                        const isOwner = isOwnerById || isOwnerByEmail;
                        const isMuted = mutedEmailSet.has(emailLower);
                        const actionOnThisMember = !!(memberActionState && memberActionState.email.toLowerCase() === emailLower);
                        const memberDescriptor = { email: member.email, displayName: member.displayName };

                        return (
                            <div
                                key={member.email}
                                className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors border border-white/10"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="relative">
                                        <img
                                            src={`https://ui-avatars.com/api/?name=${member.displayName}&background=random`}
                                            alt="avatar"
                                            className="w-10 h-10 rounded-full ring-2 ring-violet-500/25"
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-medium text-slate-100 text-sm truncate">{member.displayName}</span>
                                            {isMe && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-violet-400/30 bg-violet-500/10 text-violet-200">You</span>
                                            )}
                                            {isOwner && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-200">Host</span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-400 truncate">{member.email}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onMentionMember(memberDescriptor)}
                                        disabled={isMe}
                                        className="h-7 px-2 text-[10px] border border-white/10"
                                    >
                                        Mention
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onAskMember(memberDescriptor)}
                                        disabled={isMe}
                                        className="h-7 px-2 text-[10px] border border-white/10"
                                    >
                                        Ask
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onWaveMember(memberDescriptor)}
                                        disabled={isMe}
                                        className="h-7 px-2 text-[10px] border border-white/10"
                                    >
                                        Wave
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleCopyEmail(member.email)}
                                        className="h-7 px-2 text-[10px] border border-white/10"
                                    >
                                        {copiedEmail === member.email ? 'Copied' : 'Copy Email'}
                                    </Button>
                                </div>

                                {isCurrentUserHost && !isMe && (
                                    <div className="mt-2 flex flex-wrap gap-2 border-t border-white/10 pt-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => (isMuted ? onUnmuteMember(memberDescriptor) : onMuteMember(memberDescriptor))}
                                            disabled={actionOnThisMember}
                                            className={`h-7 px-2 text-[10px] ${isMuted ? 'bg-emerald-600/20 text-emerald-200 border border-emerald-500/30' : 'bg-amber-600/20 text-amber-200 border border-amber-500/30'}`}
                                        >
                                            {actionOnThisMember && (memberActionState?.action === 'mute_chat' || memberActionState?.action === 'unmute_chat')
                                                ? 'Updating...'
                                                : (isMuted ? 'Unmute Chat' : 'Mute Chat')}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onRemoveMember(memberDescriptor)}
                                            disabled={actionOnThisMember || isOwner}
                                            className="h-7 px-2 text-[10px] bg-rose-600/20 text-rose-200 border border-rose-500/30"
                                        >
                                            {actionOnThisMember && memberActionState?.action === 'remove' ? 'Removing...' : 'Remove'}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => onTransferHost(memberDescriptor)}
                                            disabled={actionOnThisMember || isOwner}
                                            className="h-7 px-2 text-[10px] bg-cyan-600/20 text-cyan-200 border border-cyan-500/30"
                                        >
                                            {actionOnThisMember && memberActionState?.action === 'transfer_host' ? 'Transferring...' : 'Make Host'}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

const AiPanel: React.FC<any> = ({ messages, input, setInput, onSend, notes, isExtracting, onUploadClick, onQuizMe, onSummarize, chatEndRef, isLoading, sharedQuiz }) => (
    <div className="flex flex-col flex-1 overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20 scrollbar-thin scrollbar-thumb-slate-700">
            {!notes && (
                <div className="text-center p-6 border-2 border-dashed border-slate-700 rounded-xl bg-slate-800/30 mx-4 mt-4">
                    <UploadCloud size={32} className="mx-auto text-slate-500 mb-2" />
                    <p className="text-sm text-slate-300 font-medium">No Context Loaded</p>
                    <p className="text-xs text-slate-500 mb-4">Upload study material to get better AI help.</p>
                    <Button onClick={onUploadClick} disabled={isExtracting || isLoading} className="text-xs bg-slate-700 hover:bg-slate-600 w-full justify-center">
                        Upload Notes Provided By Class
                    </Button>
                </div>
            )}

            {messages.map((msg: ChatMessage, i: number) => (
                <div key={i} className={`flex items-start gap-3 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                    {msg.role === 'model' && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg ring-1 ring-white/10">
                            <Bot size={16} className="text-white" />
                        </div>
                    )}
                    <div className={`p-4 rounded-2xl text-sm max-w-[85%] shadow-md backdrop-blur-sm leading-relaxed ${msg.role === 'model'
                        ? 'bg-slate-800/90 border border-slate-700/50 text-slate-200 rounded-tl-none'
                        : 'bg-indigo-600 text-white rounded-tr-none'
                        }`}>
                        {msg.parts[0].text}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-center gap-2 text-slate-400 text-xs ml-12">
                    <Spinner size="sm" />
                    <span>Thinking...</span>
                </div>
            )}
            <div ref={chatEndRef}></div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-900/60 backdrop-blur-md border-t border-white/5">
            <div className="flex gap-2">
                <div className="flex-1 relative">
                    <Input
                        name="ai-message"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && onSend()}
                        placeholder={notes ? "Ask a question about your notes..." : "Upload notes to start..."}
                        className="w-full pl-4 pr-10 py-3 bg-slate-800/50 border-slate-700/50 focus:ring-violet-500/50 rounded-xl transition-all"
                        disabled={isExtracting || !!sharedQuiz || isLoading}
                    />
                    {notes && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full" title="Context Active"></div>}
                </div>
                <Button onClick={onSend} disabled={!input.trim() || isExtracting || !!sharedQuiz || isLoading} className="px-4 rounded-xl bg-violet-600 hover:bg-violet-500 shadow-lg shadow-violet-500/20"><Send size={18} /></Button>
            </div>

            <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                <Button onClick={onUploadClick} size="sm" variant="secondary" className="text-xs whitespace-nowrap bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700"><Paperclip size={12} className="mr-1.5" /> Context</Button>
                <Button onClick={onQuizMe} size="sm" variant="secondary" className="text-xs whitespace-nowrap bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700"><Lightbulb size={12} className="mr-1.5" /> Generate Quiz</Button>
                <Button onClick={onSummarize} disabled={isExtracting || !!sharedQuiz || isLoading || !notes?.trim()} size="sm" variant="secondary" className="text-xs whitespace-nowrap bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700 disabled:opacity-60"><Info size={12} className="mr-1.5" /> Summarize</Button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-2">AI can make mistakes. Double check important info.</p>
        </div>
    </div>
);



export default StudyRoom;
