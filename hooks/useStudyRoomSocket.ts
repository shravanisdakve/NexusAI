import { useState, useEffect, useRef } from 'react';
import { 
    onRoomUpdate, onTechniqueUpdate, onTyping, subscribeToMessages, 
    onNotesUpdate, onNotesLock, onResourcesUpdate, onQuizUpdate, 
    onKnowledgeGapsUpdate, onTrackedConceptsUpdate, onReaction,
    subscribeToConnectionStatus, subscribeToRoomState, joinRoom, leaveRoom 
} from '../services/communityService';
import { type ChatMessage, type StudyRoom, type TechniqueState } from '../types';

export const useStudyRoomSocket = (roomId: string | undefined, currentUser: any) => {
    const [room, setRoom] = useState<StudyRoom | null>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [allMessages, setAllMessages] = useState<ChatMessage[]>([]);
    const [notes, setNotes] = useState('');
    const [notesVersion, setNotesVersion] = useState(1);
    const [notesLock, setNotesLock] = useState<any>(null);
    const [techniqueState, setTechniqueState] = useState<TechniqueState | null>(null);
    const [sharedQuiz, setSharedQuiz] = useState<any>(null);
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [reactions, setReactions] = useState<any[]>([]);
    
    const typingTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

    useEffect(() => {
        if (!roomId || !currentUser) return;

        setIsSyncing(true);
        joinRoom(roomId, currentUser);

        const unsubRoom = onRoomUpdate(roomId, (updated) => {
            if (updated) {
                setRoom(updated);
                setParticipants(updated.users);
            }
        });

        const unsubTechnique = onTechniqueUpdate(roomId, (payload) => {
            setTechniqueState(payload.techniqueState);
        });

        const unsubMessages = subscribeToMessages((rawMsg) => {
            setAllMessages(prev => {
                const newMessage: ChatMessage = {
                    id: rawMsg.id || Date.now().toString(),
                    role: 'user',
                    parts: [{ text: rawMsg.text }],
                    user: { displayName: rawMsg.sender, email: rawMsg.email },
                    timestamp: rawMsg.timestamp || Date.now()
                };
                if (prev.some(m => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
            });
        });

        const unsubNotes = onNotesUpdate(roomId, (content: string, version?: number, lock?: any) => {
            setNotes(content);
            if (version) setNotesVersion(version);
            if (lock) setNotesLock(lock);
        });

        const unsubLock = onNotesLock(setNotesLock);
        const unsubQuiz = onQuizUpdate(roomId, setSharedQuiz);
        const unsubReaction = onReaction((data) => {
            if (data.roomId === roomId) {
                setReactions(prev => [...prev, { id: Date.now(), emoji: data.emoji }]);
            }
        });

        const unsubConn = subscribeToConnectionStatus((connected) => {
            setIsReconnecting(!connected);
            if (connected) setIsSyncing(true);
        });

        const unsubState = subscribeToRoomState((state) => {
            if (state.roomId !== roomId) return;
            if (typeof state.notes === 'string') setNotes(state.notes);
            if (state.notesVersion) setNotesVersion(state.notesVersion);
            if (state.techniqueState) setTechniqueState(state.techniqueState);
            if (state.presence) setParticipants(state.presence);
            setIsSyncing(false);
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

        return () => {
            unsubRoom();
            unsubTechnique();
            unsubMessages();
            unsubNotes();
            unsubLock();
            unsubQuiz();
            unsubReaction();
            unsubConn();
            unsubState();
            unsubTyping();
            leaveRoom(roomId);
        };
    }, [roomId, currentUser]);

    return {
        room, participants, allMessages, setAllMessages, 
        notes, setNotes, notesVersion, setNotesVersion,
        notesLock, setNotesLock, techniqueState, setTechniqueState,
        sharedQuiz, setSharedQuiz, isReconnecting, isSyncing,
        typingUsers, reactions, setReactions
    };
};
