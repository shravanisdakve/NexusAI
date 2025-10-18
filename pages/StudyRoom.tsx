import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { type ChatMessage, type StudyRoom as StudyRoomType, type PomodoroState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import {
    onRoomUpdate,
    onMessagesUpdate,
    onNotesUpdate,
    saveRoomMessages,
    joinRoom,
    leaveRoom,
    saveRoomAINotes,
    updateRoomPomodoroState,
    saveUserNotes,
    onUserNotesUpdate,
    uploadResource,
    deleteResource,
    onResourcesUpdate,
} from '../services/communityService';
import { streamStudyBuddyChat, generateQuizQuestion, extractTextFromFile } from '../services/geminiService';
import { startSession, endSession, recordQuizResult } from '../services/analyticsService';
import { Bot, User, Send, MessageSquare, Users, Brain, UploadCloud, Lightbulb, FileText, Paperclip, Smile, FolderOpen, AlertTriangle, Info, Timer, Play, Pause, RefreshCw } from 'lucide-react';
import { Input, Button, Textarea, Spinner } from '../components/ui';
import RoomControls from '../components/RoomControls';
import VideoTile from '../components/VideoTile';
import Reactions, { type Reaction } from '../components/Reactions';
import MusicPlayer from '../components/MusicPlayer';
import ShareModal from '../components/ShareModal';
import EditableNotes from '../components/EditableNotes';
import FlashcardGenerator from '../components/FlashcardGenerator';
import ResourcePanel from '../components/ResourcePanel';

// --- Helper Types & Constants ---
type ActiveTab = 'chat' | 'participants' | 'ai' | 'timer' | 'notes' | 'resources';
const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

interface Quiz {
    topic: string;
    question: string;
    options: string[];
    correctOptionIndex: number;
    userAnswerIndex?: number;
}

const EMOJIS = ['👍', '❤️', '😂', '🎉', '🤔', '🙏'];

// --- Main Component ---
const StudyRoom: React.FC = () => {
    const { id: roomId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const [room, setRoom] = useState<StudyRoomType | null>(null);
    const [participants, setParticipants] = useState<{ email: string; displayName: string }[]>([]);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [mediaError, setMediaError] = useState<{ message: string; type: 'error' | 'info' } | null>(null);
    const cameraVideoTrackRef = useRef<MediaStreamTrack | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [activeTab, setActiveTab] = useState<ActiveTab>('chat');
    const [userNotes, setUserNotes] = useState('');
    const [isSavingUserNotes, setIsSavingUserNotes] = useState(false);
    const [resources, setResources] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    
    // Feature states
    const [reactions, setReactions] = useState<Reaction[]>([]);
    const [showMusicPlayer, setShowMusicPlayer] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    // Group Chat State
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');

    // AI Buddy State
    const [aiMessages, setAiMessages] = useState<ChatMessage[]>([{ role: 'model', parts: [{ text: "Hello! Upload some notes and I'll help you study." }] }]);
    const [aiInput, setAiInput] = useState('');
    const [notes, setNotes] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);

    // Pomodoro Timer State
    const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
    
    const notesFileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const aiChatEndRef = useRef<HTMLDivElement>(null);
    const welcomeMessageSent = useRef(false);

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

        let sessionId: string | null = null;

        joinRoom(roomId, currentUser);
        startSession('study-room', roomId).then(id => sessionId = id);

        const unsubRoom = onRoomUpdate(roomId, (updatedRoom) => {
            if (!updatedRoom) {
                navigate('/study-lobby');
                return;
            }
            setRoom(updatedRoom);
            setParticipants(updatedRoom.users);
        });

        const unsubMessages = onMessagesUpdate(roomId, setChatMessages);
        const unsubNotes = onNotesUpdate(roomId, setNotes);
        const unsubUserNotes = onUserNotesUpdate(roomId, setUserNotes);
        const unsubResources = onResourcesUpdate(roomId, setResources);

        return () => {
            unsubRoom();
            unsubMessages();
            unsubNotes();
            unsubUserNotes();
            unsubResources();
            if (currentUser) {
                leaveRoom(roomId, currentUser);
            }
            if (sessionId) {
                endSession(sessionId);
            }
        };
    }, [roomId, currentUser, navigate]);
    
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
    useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, quiz]);

    useEffect(() => {
        if (room && room.technique && room.topic && !welcomeMessageSent.current) {
            const welcomeMessage = `Welcome! This room is set up for a "Targeted Learning" session using the ${room.technique} technique on the topic: "${room.topic}". Let's get started!`
            postSystemMessage(welcomeMessage);
            welcomeMessageSent.current = true;
        }
    }, [room]);

    // --- Pomodoro Timer Effect ---
    useEffect(() => {
        const pomodoro = room?.pomodoro;
        if (!pomodoro || pomodoro.state !== 'running') {
            const duration = pomodoro?.mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
            setTimeLeft(duration);
            return;
        }

        const duration = pomodoro.mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;

        const calculateTimeLeft = () => {
            const elapsed = Math.floor((Date.now() - (pomodoro.startTime as any).toDate().getTime()) / 1000);
            return Math.max(0, duration - elapsed);
        };

        const timerInterval = setInterval(() => {
            const newTimeLeft = calculateTimeLeft();
            setTimeLeft(newTimeLeft);

            if (newTimeLeft <= 0) {
                clearInterval(timerInterval);
                if (room?.createdBy === currentUser?.email) {
                    handleTimerEnd();
                }
            }
        }, 1000);

        return () => clearInterval(timerInterval);
    }, [room?.pomodoro, room?.createdBy, currentUser?.email]);

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

    const handleHangUp = () => {
        localStream?.getTracks().forEach(track => track.stop());
        navigate('/study-lobby');
    };

    const handleToggleScreenShare = async () => {
        if (!localStreamRef.current && !isScreenSharing) {
             setMediaError({ message: "Cannot share screen without media permissions. Please grant access and retry.", type: 'error' });
             return;
        }
        
        if (isScreenSharing) {
            localStream?.getVideoTracks()[0].stop();
            if (cameraVideoTrackRef.current) {
                localStream?.removeTrack(localStream.getVideoTracks()[0]);
                localStream?.addTrack(cameraVideoTrackRef.current);
            }
            setIsScreenSharing(false);
        } else {
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                
                screenTrack.onended = () => {
                    if (localStream && cameraVideoTrackRef.current) {
                       localStream.removeTrack(screenTrack);
                       localStream.addTrack(cameraVideoTrackRef.current);
                       setIsScreenSharing(false);
                    }
                };

                if (localStream) {
                    localStream.removeTrack(localStream.getVideoTracks()[0]);
                    localStream.addTrack(screenTrack);
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

    const handleSaveUserNotes = async (notes: string) => {
        if (!roomId) return;
        setIsSavingUserNotes(true);
        await saveUserNotes(roomId, notes);
        setIsSavingUserNotes(false);
    };

    const handleUploadResource = async (file: File) => {
        if (!roomId || !currentUser) return;
        setIsUploading(true);
        await uploadResource(roomId, file, { displayName: currentUser.displayName });
        setIsUploading(false);
    };

    const handleDeleteResource = async (fileName: string) => {
        if (!roomId) return;
        await deleteResource(roomId, fileName);
    };

    // --- Chat Handlers ---
    const handleSendChatMessage = async (messageText: string) => {
        if (!messageText.trim() || !roomId || !currentUser) return;
        
        const newMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: messageText }],
            user: { email: currentUser.email, displayName: currentUser.displayName },
        };
        await saveRoomMessages(roomId, [newMessage]);
        setChatInput('');
    };

     const postSystemMessage = async (text: string) => {
        if (!roomId) return;
        const systemMessage: ChatMessage = {
            role: 'model',
            parts: [{ text }],
            user: { displayName: 'Focus Bot', email: 'system@nexus.ai' },
        };
        await saveRoomMessages(roomId, [systemMessage]);
    };

    // --- Pomodoro Handlers ---
    const handleStartTimer = async () => {
        if (!roomId || !room?.pomodoro) return;
        const newState: PomodoroState = {
            ...room.pomodoro,
            state: 'running',
            startTime: Date.now(),
        };
        await updateRoomPomodoroState(roomId, newState);
    };

    const handleStopTimer = async () => {
        if (!roomId || !room?.pomodoro) return;
        const newState: PomodoroState = {
            ...room.pomodoro,
            state: 'stopped',
            startTime: 0,
        };
        await updateRoomPomodoroState(roomId, newState);
    };
    
    const handleResetTimer = async () => {
        if (!roomId || !room) return;
        const newState: PomodoroState = {
            state: 'stopped',
            mode: 'focus',
            startTime: 0,
        };
        await updateRoomPomodoroState(roomId, newState);
        await postSystemMessage("Timer has been reset to a new focus session.");
    };

    const handleTimerEnd = async () => {
        if (!roomId || !room?.pomodoro) return;
        const { mode } = room.pomodoro;
        const nextMode = mode === 'focus' ? 'break' : 'focus';
        const message = mode === 'focus'
            ? `Focus session complete! Time for a ${BREAK_DURATION / 60}-minute break.`
            : "Break's over! Time for a new focus session.";
        
        await postSystemMessage(message);

        const newState: PomodoroState = {
            state: 'stopped',
            mode: nextMode,
            startTime: 0,
        };
        await updateRoomPomodoroState(roomId, newState);
    };

    // --- AI Buddy Handlers ---
     const handleSendAiMessage = useCallback(async () => {
        if (!aiInput.trim() || isAiLoading) return;
        
        const newUserMessage: ChatMessage = { role: 'user', parts: [{ text: aiInput }] };
        setAiMessages(prev => [...prev, newUserMessage]);
        setAiInput('');
        setIsAiLoading(true);
        setQuiz(null);

        try {
            const stream = await streamStudyBuddyChat(aiInput, notes);
            let modelResponse = '';
            let streamedMessageStarted = false;

            for await (const chunk of stream) {
                modelResponse += chunk.text;
                if (!streamedMessageStarted) {
                    streamedMessageStarted = true;
                    setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: modelResponse }] }]);
                } else {
                    setAiMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].parts = [{ text: modelResponse }];
                        return newMessages;
                    });
                }
            }
        } catch (err) {
            console.error(err);
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: "Sorry, an error occurred." }] }]);
        } finally {
            setIsAiLoading(false);
        }
    }, [aiInput, isAiLoading, notes]);
    
     const handleQuizMe = async () => {
        if (isAiLoading || !notes.trim()) return;
        setIsAiLoading(true);
        setQuiz(null);
        setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: "Generating a quiz..." }] }]);

        try {
            const quizJsonString = await generateQuizQuestion(notes);
            const parsedQuiz = JSON.parse(quizJsonString);
            setQuiz(parsedQuiz);
        } catch (err) {
            setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: "Couldn't generate a quiz. Try adding more notes." }] }]);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleAnswerQuiz = async (selectedIndex: number) => {
        if (!quiz) return;
        const isCorrect = selectedIndex === quiz.correctOptionIndex;
        await recordQuizResult(quiz.topic, isCorrect, room?.courseId);
        
        const feedbackMessage = isCorrect ? `Correct! Well done.` : `Not quite. The correct answer was: "${quiz.options[quiz.correctOptionIndex]}"`;
        setAiMessages(prev => [...prev, { role: 'model', parts: [{ text: feedbackMessage }] }]);
        setQuiz(prev => prev ? { ...prev, userAnswerIndex: selectedIndex } : null);
        setTimeout(() => setQuiz(null), 4000);
    };

    const handleNotesFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !roomId) return;
        event.target.value = '';

        const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB
        if (file.size > MAX_FILE_SIZE) {
            setAiMessages([{ role: 'model', parts: [{ text: `File is too large. Please upload a file smaller than ${MAX_FILE_SIZE / 1024 / 1024}MB.` }] }]);
            return;
        }
        
        setIsExtracting(true);
        setNotes(`Extracting text from ${file.name}...`);
        setAiMessages([{ role: 'model', parts: [{ text: "Analyzing your document..." }] }]);

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64Data = (e.target?.result as string).split(',')[1];
                    const extracted = await extractTextFromFile(base64Data, file.type);
                    
                    await saveRoomAINotes(roomId, extracted);

                    setAiMessages([{ role: 'model', parts: [{ text: "Great, I've reviewed the notes. The AI context is now updated for everyone in the room." }] }]);

                    await postSystemMessage(`${currentUser?.displayName} updated the study notes with the file: ${file.name}`);

                } catch (err) { 
                    await saveRoomAINotes(roomId, '');
                    setAiMessages([{ role: 'model', parts: [{ text: "Sorry, I couldn't read that file. It might be an unsupported format or corrupted. Please try another one." }] }]);
                } 
                finally { setIsExtracting(false); }
            };
            reader.readAsDataURL(file);
        } catch (error) {
             await saveRoomAINotes(roomId, '');
             setAiMessages([{ role: 'model', parts: [{ text: "Sorry, I couldn't read that file. Please try another one." }] }]);
             setIsExtracting(false);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-200 p-0 m-[-2rem] relative">
            <Reactions reactions={reactions} />
            {showMusicPlayer && <MusicPlayer onClose={() => setShowMusicPlayer(false)} />}
            {showShareModal && <ShareModal roomId={roomId || ''} onClose={() => setShowShareModal(false)} />}
            
            <div className="flex-1 flex overflow-hidden">
                {/* Main Video Grid */}
                <main className="flex-1 flex flex-col p-4">
                     {mediaError && (
                        <div className={`
                            p-3 rounded-lg text-sm mb-4 ring-1 flex justify-between items-center animate-in fade-in-50
                            ${mediaError.type === 'error'
                                ? 'bg-red-900/50 text-red-300 ring-red-700'
                                : 'bg-sky-900/50 text-sky-300 ring-sky-700'
                            }
                        `}>
                            <div className="flex items-center gap-2">
                                {mediaError.type === 'error' ? <AlertTriangle size={18}/> : <Info size={18}/>}
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
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <VideoTile stream={localStream} displayName={currentUser?.displayName || 'You'} isMuted={isMuted} isLocal={true} isScreenSharing={isScreenSharing} />
                        {participants.filter(p => p.email !== currentUser?.email).map(p => (
                             <VideoTile key={p.email} displayName={p.displayName} isMuted={false} />
                        ))}
                    </div>
                </main>

                {/* Side Panel */}
                <aside className="w-96 bg-slate-800/70 flex flex-col h-full">
                    <div className="flex border-b border-slate-700">
                        <TabButton id="chat" activeTab={activeTab} setActiveTab={setActiveTab} icon={MessageSquare} label="Chat" />
                        <TabButton id="participants" activeTab={activeTab} setActiveTab={setActiveTab} icon={Users} label="Participants" count={participants.length} />
                        <TabButton id="ai" activeTab={activeTab} setActiveTab={setActiveTab} icon={Brain} label="AI Buddy" />
                        <TabButton id="timer" activeTab={activeTab} setActiveTab={setActiveTab} icon={Timer} label="Timer" />
                        <TabButton id="notes" activeTab={activeTab} setActiveTab={setActiveTab} icon={FileText} label="Notes & Cards" />
                        <TabButton id="resources" activeTab={activeTab} setActiveTab={setActiveTab} icon={FolderOpen} label="Resources" />
                    </div>
                    
                    {activeTab === 'chat' && (
                        <ChatPanel
                            messages={chatMessages}
                            input={chatInput}
                            setInput={setChatInput}
                            onSend={handleSendChatMessage}
                            currentUser={currentUser}
                            chatEndRef={chatEndRef}
                        />
                    )}
                    {activeTab === 'participants' && <ParticipantsPanel participants={participants} />}
                    {activeTab === 'ai' && (
                        <AiPanel
                            messages={aiMessages}
                            input={aiInput}
                            setInput={setAiInput}
                            onSend={handleSendAiMessage}
                            notes={notes}
                            isExtracting={isExtracting}
                            onUploadClick={() => notesFileInputRef.current?.click()}
                            quiz={quiz}
                            onAnswerQuiz={handleAnswerQuiz}
                            onQuizMe={handleQuizMe}
                            chatEndRef={aiChatEndRef}
                            isLoading={isAiLoading}
                        />
                    )}
                    {activeTab === 'timer' && (
                        <FocusTimerPanel
                            pomodoro={room?.pomodoro}
                            timeLeft={timeLeft}
                            onStart={handleStartTimer}
                            onStop={handleStopTimer}
                            onReset={handleResetTimer}
                        />
                    )}
                    {activeTab === 'notes' && (
                        <div className="p-4 space-y-4">
                            <EditableNotes 
                                initialNotes={userNotes}
                                onSave={handleSaveUserNotes}
                                isSaving={isSavingUserNotes}
                            />
                            <FlashcardGenerator notes={userNotes} />
                        </div>
                    )}
                    {activeTab === 'resources' && (
                        <ResourcePanel 
                            resources={resources}
                            onUpload={handleUploadResource}
                            onDelete={handleDeleteResource}
                            isUploading={isUploading}
                        />
                    )}
                </aside>
            </div>
            
             <input type="file" ref={notesFileInputRef} onChange={handleNotesFileUpload} accept=".txt,.md,.pdf,.pptx" style={{ display: 'none' }} />

            {/* Bottom Controls */}
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
                onShare={() => setShowShareModal(true)}
                roomId={roomId || ''}
            />
        </div>
    );
};

// --- Sub-Components for Panels ---

const TabButton: React.FC<{id: ActiveTab, activeTab: ActiveTab, setActiveTab: (tab: ActiveTab) => void, icon: React.ElementType, label: string, count?: number}> = ({ id, activeTab, setActiveTab, icon: Icon, label, count }) => (
    <button onClick={() => setActiveTab(id)} className={`flex-1 flex justify-center items-center gap-2 py-3 text-sm font-medium transition-colors ${activeTab === id ? 'bg-slate-700 text-violet-400' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
        <Icon size={16} /> {label} {count !== undefined && <span className="text-xs bg-slate-600 rounded-full px-1.5">{count}</span>}
    </button>
);

const ChatPanel: React.FC<any> = ({ messages, input, setInput, onSend, currentUser, chatEndRef }) => {
    const [showEmojis, setShowEmojis] = useState(false);
    
    const handleEmojiSelect = (emoji: string) => {
        setInput(input + emoji);
        setShowEmojis(false);
    };

    return (
        <div className="flex flex-col flex-1 overflow-hidden p-4">
            <div className="flex-1 overflow-y-auto pr-2">
                {messages.map((msg: ChatMessage, i: number) => (
                    <div key={i} className={`flex items-start gap-2.5 my-3 ${msg.user?.email === currentUser?.email ? 'flex-row-reverse' : ''}`}>
                         <img src={`https://ui-avatars.com/api/?name=${msg.user?.displayName || '?'}&background=random`} alt="avatar" className="w-8 h-8 rounded-full" />
                         <div className={`flex flex-col max-w-[80%] ${msg.user?.email === currentUser?.email ? 'items-end' : 'items-start'}`}>
                            <span className="text-xs text-slate-400 mb-1 px-1">{msg.user?.displayName} {msg.user?.email === 'system@nexus.ai' && '🤖'}</span>
                            <div className={`p-3 rounded-xl text-sm ${msg.user?.email === currentUser?.email ? 'bg-sky-600 text-white rounded-br-none' : 'bg-slate-700 rounded-bl-none'} ${msg.user?.email === 'system@nexus.ai' && 'bg-violet-900/50 italic'}`}>
                                {msg.parts[0].text}
                            </div>
                        </div>
                    </div>
                ))}
                 <div ref={chatEndRef}></div>
            </div>
            <div className="mt-auto flex gap-2 relative">
                {showEmojis && (
                    <div className="absolute bottom-14 left-0 bg-slate-900 p-2 rounded-lg grid grid-cols-3 gap-2">
                        {EMOJIS.map(emoji => (
                            <button key={emoji} onClick={() => handleEmojiSelect(emoji)} className="text-2xl p-1 hover:bg-slate-700 rounded">{emoji}</button>
                        ))}
                    </div>
                )}
                <Button onClick={() => setShowEmojis(p => !p)} className="px-3 bg-slate-700 hover:bg-slate-600"><Smile size={16}/></Button>
                <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend()} placeholder="Type a message..." className="flex-1"/>
                <Button onClick={() => onSend()} disabled={!input.trim()} className="px-3"><Send size={16}/></Button>
            </div>
        </div>
    );
}

const ParticipantsPanel: React.FC<{participants: { email: string; displayName: string }[]}> = ({ participants }) => (
    <div className="p-4 space-y-3 overflow-y-auto">
        {participants.map(p => (
            <div key={p.email} className="flex items-center gap-3 bg-slate-700/50 p-2 rounded-lg">
                <img src={`https://ui-avatars.com/api/?name=${p.displayName}&background=random`} alt="avatar" className="w-9 h-9 rounded-full"/>
                <span className="font-medium text-slate-200">{p.displayName}</span>
            </div>
        ))}
    </div>
);

const AiPanel: React.FC<any> = ({ messages, input, setInput, onSend, notes, isExtracting, onUploadClick, quiz, onAnswerQuiz, onQuizMe, chatEndRef, isLoading }) => (
    <div className="flex flex-col flex-1 overflow-hidden p-4">
        <div className="relative">
            <Textarea value={notes} placeholder="Upload a file to set the AI context for everyone..." rows={6} className="resize-none bg-slate-700/80" readOnly />
            <Button onClick={onUploadClick} disabled={isExtracting} className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-slate-600 hover:bg-slate-500"><UploadCloud size={14} className="mr-1"/> Upload</Button>
            {isExtracting && <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center rounded-md"><Spinner /></div>}
        </div>
        <div className="flex-1 overflow-y-auto pr-2 my-4 space-y-3">
             {messages.map((msg: ChatMessage, i: number) => (
                <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'model' ? '' : 'justify-end'}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0"><Bot size={18}/></div>}
                     <div className={`p-3 rounded-xl text-sm max-w-[85%] ${msg.role === 'model' ? 'bg-slate-700 rounded-bl-none' : 'bg-sky-600 rounded-br-none text-white'}`} style={{ whiteSpace: 'pre-wrap' }}>{msg.parts[0].text}</div>
                </div>
             ))}
              {isLoading && <div className="flex justify-center"><Spinner /></div>}
              {quiz && (
                    <div className="my-2 p-3 bg-slate-900/50 rounded-xl ring-1 ring-violet-600/50">
                        <p className="font-bold text-slate-100 text-sm">{quiz.question}</p>
                        <div className="grid grid-cols-1 gap-1.5 mt-3">
                            {quiz.options.map((option: string, index: number) => {
                                const isSelected = quiz.userAnswerIndex === index, isCorrect = quiz.correctOptionIndex === index;
                                let btnClass = 'bg-slate-700 hover:bg-slate-600';
                                if (quiz.userAnswerIndex !== undefined) {
                                    if (isCorrect) btnClass = 'bg-green-500/80 ring-1 ring-green-400';
                                    else if (isSelected) btnClass = 'bg-red-500/80';
                                    else btnClass = 'bg-slate-800/50 opacity-60';
                                }
                                return <button key={index} onClick={() => onAnswerQuiz(index)} disabled={quiz.userAnswerIndex !== undefined} className={`p-2 text-left text-xs rounded-lg transition-all ${btnClass}`}>{option}</button>
                            })}
                        </div>
                    </div>
                )}
             <div ref={chatEndRef}></div>
        </div>
        <div className="mt-auto flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && onSend()} placeholder="Ask the AI..." className="flex-1" disabled={isExtracting || !!quiz}/>
            <Button onClick={onQuizMe} disabled={isExtracting || !!quiz || !notes.trim()} className="px-3" title="Quiz Me"><Lightbulb size={16}/></Button>
            <Button onClick={onSend} disabled={!input.trim() || isExtracting || !!quiz} className="px-3"><Send size={16}/></Button>
        </div>
    </div>
);

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const FocusTimerPanel: React.FC<{pomodoro: PomodoroState | undefined, timeLeft: number, onStart: () => void, onStop: () => void, onReset: () => void}> = ({ pomodoro, timeLeft, onStart, onStop, onReset }) => {
    if (!pomodoro) return null;

    const duration = pomodoro.mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    const progress = (duration - timeLeft) / duration * 100;

    return (
         <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle className="text-slate-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                    <circle
                        className={pomodoro.mode === 'focus' ? "text-violet-500" : "text-sky-500"}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 45}
                        strokeDashoffset={(2 * Math.PI * 45) * (1 - progress / 100)}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r="45"
                        cx="50"
                        cy="50"
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                    />
                </svg>
                <div className="absolute flex flex-col">
                     <span className="text-4xl font-bold font-mono text-white">{formatTime(timeLeft)}</span>
                     <span className={`text-sm font-semibold uppercase tracking-wider ${pomodoro.mode === 'focus' ? 'text-violet-400' : 'text-sky-400'}`}>
                        {pomodoro.mode}
                    </span>
                </div>
            </div>

             <div className="flex items-center gap-4 mt-8">
                <Button onClick={onReset} className="px-4 py-2 bg-slate-700 hover:bg-slate-600" title="Reset Timer">
                    <RefreshCw size={20}/>
                </Button>
                {pomodoro.state === 'running' ? (
                     <Button onClick={onStop} className="px-6 py-4 text-lg bg-amber-600 hover:bg-amber-700" title="Pause Timer">
                        <Pause size={24}/>
                    </Button>
                ) : (
                    <Button onClick={onStart} className="px-6 py-4 text-lg" title="Start Timer">
                        <Play size={24}/>
                    </Button>
                )}
                 <div className="w-[52px]"></div> {/* Spacer */}
             </div>
        </div>
    )
};


export default StudyRoom;