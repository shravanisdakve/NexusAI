import { type StudyRoom, type ChatMessage, type PomodoroState, type Quiz } from '../types';
import { db, auth, storage } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    deleteDoc,
    query,
    orderBy,
    limit,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    Timestamp,
    onSnapshot,
    setDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, listAll, deleteObject, getMetadata } from 'firebase/storage';

// --- Room Management (LocalStorage Fallback) ---

const LOCAL_STORAGE_KEY = 'nexusai_rooms';

const getLocalRooms = (): StudyRoom[] => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

const saveLocalRooms = (rooms: StudyRoom[]) => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(rooms));
};

export const getRooms = async (): Promise<StudyRoom[]> => {
    console.log("Using LocalStorage for Rooms");
    console.log("Fetching rooms from LocalStorage...");
    // Simulate network delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    return getLocalRooms();
};

export const getRoom = async (id: string): Promise<StudyRoom | null> => {
    console.log(`Fetching room ${id} from LocalStorage...`);
    const rooms = getLocalRooms();
    return rooms.find(r => r.id === id) || null;
};

export const addRoom = async (name: string, courseId: string, maxUsers: number, createdBy: { email: string, displayName: string | null }, university: string | undefined, selectedTechnique: string, topic: string): Promise<StudyRoom | null> => {
    console.log("Creating LocalStorage room for:", name);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const safeCreatedBy = {
        email: createdBy.email,
        displayName: createdBy.displayName || 'Guest'
    };

    const newRoom: StudyRoom = {
        id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || "Untitled Room",
        courseId: courseId || "general",
        maxUsers: maxUsers || 5,
        users: [safeCreatedBy],
        createdBy: safeCreatedBy.email,
        university: university, // Optional
        technique: selectedTechnique || undefined,
        topic: topic || undefined,
    };

    const rooms = getLocalRooms();
    rooms.push(newRoom);
    saveLocalRooms(rooms);

    console.log("LocalStorage room added:", newRoom);
    return newRoom;
};


export const joinRoom = async (id: string, user: { email: string | null; displayName: string | null; }) => {
    if (!user.email) return;
    const rooms = getLocalRooms();
    const roomIndex = rooms.findIndex(r => r.id === id);

    if (roomIndex !== -1) {
        const room = rooms[roomIndex];
        if (!room.users.some(u => u.email === user.email)) {
            room.users.push({ email: user.email, displayName: user.displayName || 'Guest' });
            rooms[roomIndex] = room;
            saveLocalRooms(rooms);
            console.log(`User ${user.email} joined room ${id} in LocalStorage.`);
        }
    }
};

export const leaveRoom = async (id: string, user: { email: string | null; displayName: string | null; }) => {
    if (!user.email) return;
    let rooms = getLocalRooms();
    const roomIndex = rooms.findIndex(r => r.id === id);

    if (roomIndex !== -1) {
        rooms[roomIndex].users = rooms[roomIndex].users.filter(u => u.email !== user.email);

        // If empty, delete room
        if (rooms[roomIndex].users.length === 0) {
            rooms = rooms.filter(r => r.id !== id);
            console.log(`Room ${id} deleted from LocalStorage (empty).`);
        }

        saveLocalRooms(rooms);
        console.log(`User ${user.email} left room ${id} in LocalStorage.`);
    }
};



// --- Message Management (using a subcollection) ---

const mockChatMessages: Record<string, ChatMessage[]> = {};

export const getRoomMessages = async (roomId: string): Promise<ChatMessage[]> => {
    // if (!db) return []; // Firebase disabled, use mock
    // This function is problematic for community chat. Let's fix CourseCommunity.tsx's call.
    // For StudyRoom (which uses onMessagesUpdate), this isn't the primary method.
    return Promise.resolve(mockChatMessages[roomId] || []);
};

export const saveRoomMessages = async (roomId: string, messages: ChatMessage[]) => {
    // if (!db) return; // Firebase disabled, use mock
    if (!mockChatMessages[roomId]) {
        mockChatMessages[roomId] = [];
    }
    // Add timestamp if missing (shouldn't be needed with recent changes but good safety check)
    const messagesWithTimestamp = messages.map(msg => ({ ...msg, timestamp: msg.timestamp || Date.now() }));
    mockChatMessages[roomId].push(...messagesWithTimestamp);
    console.log(`Mock saveRoomMessages: Messages added to room ${roomId}. Current count: ${mockChatMessages[roomId].length}`); // Add log
};

export const sendChatMessage = async (roomId: string, message: Omit<ChatMessage, 'timestamp'>) => {
    if (!db) return;
    try {
        const messagesCollection = collection(db, `rooms/${roomId}/messages`);
        await addDoc(messagesCollection, {
            ...message,
            timestamp: serverTimestamp() // Use server timestamp for consistency
        });
    } catch (error) {
        console.error(`Error sending chat message to room ${roomId}:`, error);
    }
};

// --- Shared AI Notes Management (using a subcollection with a single document) ---

// Mock notes per room
const mockAiNotes: Record<string, string> = {};
const mockUserNotes: Record<string, string> = {};

const getNotesDoc = (roomId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return doc(db, `rooms/${roomId}/notes`, 'shared_notes');
}

export const getRoomAINotes = async (roomId: string): Promise<string> => {
    // if (!db) return ''; // Firebase disabled, use mock
    return Promise.resolve(mockAiNotes[roomId] || '');
};

export const saveRoomAINotes = async (roomId: string, notes: string) => {
    // if (!db) return; // Firebase disabled, use mock
    mockAiNotes[roomId] = notes;
    console.log(`Mock AI notes saved for room ${roomId}`);
    return Promise.resolve();
};

// --- Real-time listeners ---

export const onRoomUpdate = (roomId: string, callback: (room: StudyRoom | null) => void) => {
    if (!db) return () => { };
    const roomDoc = doc(db, 'rooms', roomId);

    const unsubscribe = onSnapshot(roomDoc, (doc) => {
        if (doc.exists()) {
            callback({ id: doc.id, ...doc.data() } as StudyRoom);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error(`Error in onRoomUpdate listener for room ${roomId}:`, error);
        callback(null);
    });

    return unsubscribe; // Return the unsubscribe function provided by onSnapshot
};

export const onMessagesUpdate = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    if (!db) return () => { };
    const messagesCollection = collection(db, `rooms/${roomId}/messages`);
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages: ChatMessage[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to JS Date number if necessary
            const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toMillis() : data.timestamp;
            messages.push({ ...data, timestamp } as ChatMessage);
        });
        callback(messages);
    }, (error) => {
        console.error(`Error in onMessagesUpdate listener for room ${roomId}:`, error);
        callback([]);
    });

    return unsubscribe;
};

export const onNotesUpdate = (roomId: string, callback: (notes: string) => void) => {
    // if (!db) return () => {}; // Firebase disabled, use mock

    // Simulate initial load
    callback(mockAiNotes[roomId] || '');

    // Simulate real-time updates
    const interval = setInterval(() => {
        callback(mockAiNotes[roomId] || '');
    }, 2000);

    console.log(`Mock onNotesUpdate attached for ${roomId}`);

    return () => {
        clearInterval(interval);
        console.log(`Mock onNotesUpdate detached for ${roomId}`);
    };
};

// --- User Notes Management ---

const getUserNotesDoc = (roomId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return doc(db, `rooms/${roomId}/notes`, 'user_notes');
}

export const saveUserNotes = async (roomId: string, notes: string) => {
    // if (!db) return; // Firebase disabled, use mock
    mockUserNotes[roomId] = notes;
    console.log(`Mock user notes saved for room ${roomId}`);
    return Promise.resolve();
};

export const onUserNotesUpdate = (roomId: string, callback: (notes: string) => void) => {
    // if (!db) return () => {}; // Firebase disabled, use mock

    // Simulate initial load
    callback(mockUserNotes[roomId] || '');

    // Simulate real-time updates
    const interval = setInterval(() => {
        callback(mockUserNotes[roomId] || '');
    }, 2000);

    console.log(`Mock onUserNotesUpdate attached for ${roomId}`);

    return () => {
        clearInterval(interval);
        console.log(`Mock onUserNotesUpdate detached for ${roomId}`);
    };
};

// --- Resource Management ---
// Mock resources
const mockResources: Record<string, any[]> = {};

const getResourcesRef = (roomId: string) => {
    if (!storage) throw new Error("Firebase Storage not initialized");
    return ref(storage, `rooms/${roomId}/resources`);
}

export const uploadResource = async (roomId: string, file: File, user: { displayName: string | null }) => {
    // if (!storage) return; // Firebase disabled, use mock

    if (!mockResources[roomId]) {
        mockResources[roomId] = [];
    }

    const newResource = {
        name: file.name,
        url: URL.createObjectURL(file), // Create a blob URL for local access
        uploader: user.displayName || 'Unknown',
        timeCreated: new Date().toISOString(),
    };

    mockResources[roomId].push(newResource);
    console.log(`Mock resource uploaded to room ${roomId}:`, newResource);
    return Promise.resolve();
};

export const getRoomResources = async (roomId: string) => {
    // if (!storage) return []; // Firebase disabled, use mock
    return Promise.resolve(mockResources[roomId] || []);
};

export const deleteResource = async (roomId: string, fileName: string) => {
    // if (!storage) return; // Firebase disabled, use mock
    if (mockResources[roomId]) {
        mockResources[roomId] = mockResources[roomId].filter(r => r.name !== fileName);
        console.log(`Mock resource deleted from room ${roomId}:`, fileName);
    }
    return Promise.resolve();
};

export const onResourcesUpdate = (roomId: string, callback: (resources: any[]) => void) => {
    // This is a workaround for the lack of a native `onSnapshot` for Storage.
    // In a real app, you'd use Firestore to store metadata and listen to that.

    // Initial call
    callback(mockResources[roomId] || []);

    const interval = setInterval(async () => {
        callback(mockResources[roomId] || []);
    }, 2000); // Poll every 2 seconds

    console.log(`Mock onResourcesUpdate attached for ${roomId}`);

    return () => {
        clearInterval(interval);
        console.log(`Mock onResourcesUpdate detached for ${roomId}`);
    };
};

// --- Shared Quiz Management ---
const mockQuizzes: Record<string, Quiz | null> = {};

const getQuizDoc = (roomId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return doc(db, `rooms/${roomId}/quiz`, 'current_quiz');
}

export const onQuizUpdate = (roomId: string, callback: (quiz: Quiz | null) => void) => {
    // if (!db) return () => {}; // Firebase disabled, use mock

    // Initial call
    callback(mockQuizzes[roomId] || null);

    const interval = setInterval(() => {
        callback(mockQuizzes[roomId] || null);
    }, 1000); // Poll every second

    console.log(`Mock onQuizUpdate attached for ${roomId}`);

    return () => {
        clearInterval(interval);
        console.log(`Mock onQuizUpdate detached for ${roomId}`);
    };
};

export const saveQuiz = async (roomId: string, quizData: Omit<Quiz, 'id' | 'answers'>) => {
    // if (!db) return; // Firebase disabled, use mock
    const quiz: Quiz = {
        ...quizData,
        id: `quiz_${Date.now()}`,
        answers: [],
    };
    mockQuizzes[roomId] = quiz;
    console.log(`Mock quiz saved for room ${roomId}:`, quiz);
    return Promise.resolve();
};

export const saveQuizAnswer = async (roomId: string, userId: string, displayName: string, answerIndex: number) => {
    // if (!db) return; // Firebase disabled, use mock
    const quiz = mockQuizzes[roomId];
    if (quiz && !quiz.answers.some(a => a.userId === userId)) {
        const answer = { userId, displayName, answerIndex, timestamp: Date.now() };
        quiz.answers.push(answer);
        console.log(`Mock quiz answer saved for room ${roomId}:`, answer);
    }
    return Promise.resolve();
};

export const clearQuiz = async (roomId: string) => {
    // if (!db) return; // Firebase disabled, use mock
    mockQuizzes[roomId] = null;
    console.log(`Mock quiz cleared for room ${roomId}`);
    return Promise.resolve();
};
