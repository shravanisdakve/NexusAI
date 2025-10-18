import { type StudyRoom, type ChatMessage, type PomodoroState } from '../types';
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

// --- Room Management ---

export const getRooms = async (): Promise<StudyRoom[]> => {
    if (!db) return [];
    try {
        const roomsCollection = collection(db, 'rooms');
        const snapshot = await getDocs(roomsCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyRoom));
    } catch (error) {
        console.error("Error getting rooms: ", error);
        return [];
    }
};

export const getRoom = async (id: string): Promise<StudyRoom | null> => {
    if (!db) return null;
    try {
        const roomDoc = doc(db, 'rooms', id);
        const snapshot = await getDoc(roomDoc);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as StudyRoom;
        }
        return null;
    } catch (error) {
        console.error("Error getting room: ", error);
        return null;
    }
};

export const addRoom = async (name: string, courseId: string, maxUsers: number, createdBy: string, university?: string): Promise<StudyRoom | null> => {
    // Mock implementation since Firebase is disabled.
    // This simulates creating a room and returns a mock room object.
    console.log("Mocking room creation for:", name);
    
    // The user who is creating the room
    const creator = {
        email: auth.currentUser?.email || 'test@example.com',
        displayName: auth.currentUser?.displayName || 'Test User'
    };

    const mockRoom: StudyRoom = {
        id: `mock_${Date.now()}`, // Generate a unique mock ID
        name,
        courseId,
        maxUsers,
        createdBy,
        university,
        users: [creator], // Add the creator to the room
        pomodoro: {
            state: 'stopped',
            mode: 'focus',
            startTime: 0,
        },
    };
    
    // We use Promise.resolve to simulate an async operation
    return Promise.resolve(mockRoom);
};

export const joinRoom = async (id: string, user: { email: string | null; displayName: string | null; }) => {
    if (!user.email || !db) return;
    try {
        const roomDoc = doc(db, 'rooms', id);
        await updateDoc(roomDoc, {
            users: arrayUnion({ email: user.email, displayName: user.displayName || 'Student' })
        });
    } catch (error) {
        console.error("Error joining room: ", error);
    }
};

export const leaveRoom = async (id: string, user: { email: string | null; displayName: string | null; }) => {
    if (!user.email || !db) return;
    try {
        const roomDoc = doc(db, 'rooms', id);
        await updateDoc(roomDoc, {
            users: arrayRemove({ email: user.email, displayName: user.displayName || 'Student' })
        });
        // Optional: Add a Cloud Function to delete empty rooms.
    } catch (error) {
        console.error("Error leaving room: ", error);
    }
};

export const updateRoomPomodoroState = async (roomId: string, pomodoroState: PomodoroState) => {
    if (!db) return;
    try {
        const roomDoc = doc(db, 'rooms', roomId);
        await updateDoc(roomDoc, { pomodoro: pomodoroState });
    } catch (error) {
        console.error("Error updating pomodoro state: ", error);
    }
};

// --- Message Management (using a subcollection) ---

export const getRoomMessages = async (roomId: string): Promise<ChatMessage[]> => {
    if (!db) return [];
    try {
        const messagesCollection = collection(db, `rooms/${roomId}/messages`);
        const q = query(messagesCollection, orderBy("timestamp", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as ChatMessage);
    } catch (error) {
        console.error("Error getting messages: ", error);
        return [];
    }
};

export const saveRoomMessages = async (roomId: string, messages: ChatMessage[]) => {
    if (!db) return;
    try {
        const messagesCollection = collection(db, `rooms/${roomId}/messages`);
        // This is not efficient. In a real app, you would add one message at a time.
        // For this migration, we'll just add the last message.
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) {
            await addDoc(messagesCollection, { ...lastMessage, timestamp: serverTimestamp() });
        }
    } catch (error) {
        console.error("Error saving messages: ", error);
    }
};

// --- Shared AI Notes Management (using a subcollection with a single document) ---

const getNotesDoc = (roomId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return doc(db, `rooms/${roomId}/notes`, 'shared_notes');
}

export const getRoomAINotes = async (roomId: string): Promise<string> => {
    if (!db) return '';
    try {
        const notesDoc = await getDoc(getNotesDoc(roomId));
        return notesDoc.exists() ? notesDoc.data().content : '';
    } catch (error) {
        console.error("Error getting AI notes: ", error);
        return '';
    }
};

export const saveRoomAINotes = async (roomId: string, notes: string) => {
    if (!db) return;
    try {
        await setDoc(getNotesDoc(roomId), { content: notes, lastUpdated: serverTimestamp() });
    } catch (error) {
        console.error("Error saving AI notes: ", error);
    }
};

// --- Real-time listeners ---

export const onRoomUpdate = (roomId: string, callback: (room: StudyRoom | null) => void) => {
    if (!db) return () => {};
    const roomDoc = doc(db, 'rooms', roomId);
    return onSnapshot(roomDoc, (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() } as StudyRoom);
        } else {
            callback(null);
        }
    });
};

export const onMessagesUpdate = (roomId: string, callback: (messages: ChatMessage[]) => void) => {
    if (!db) return () => {};
    const messagesCollection = collection(db, `rooms/${roomId}/messages`);
    const q = query(messagesCollection, orderBy("timestamp", "asc"));
    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
        callback(messages);
    });
};

export const onNotesUpdate = (roomId: string, callback: (notes: string) => void) => {
    if (!db) return () => {};
    return onSnapshot(getNotesDoc(roomId), (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data().content || '');
        }
    });
};

// --- User Notes Management ---

const getUserNotesDoc = (roomId: string) => {
    if (!db) throw new Error("Firestore not initialized");
    return doc(db, `rooms/${roomId}/notes`, 'user_notes');
}

export const saveUserNotes = async (roomId: string, notes: string) => {
    if (!db) return;
    try {
        await setDoc(getUserNotesDoc(roomId), { content: notes, lastUpdated: serverTimestamp() });
    } catch (error) {
        console.error("Error saving user notes: ", error);
    }
};

export const onUserNotesUpdate = (roomId: string, callback: (notes: string) => void) => {
    if (!db) return () => {};
    return onSnapshot(getUserNotesDoc(roomId), (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data().content || '');
        }
    });
};

// --- Resource Management ---

const getResourcesRef = (roomId: string) => {
    if (!storage) throw new Error("Firebase Storage not initialized");
    return ref(storage, `rooms/${roomId}/resources`);
}

export const uploadResource = async (roomId: string, file: File, user: { displayName: string | null }) => {
    if (!storage) return;
    const resourceRef = ref(getResourcesRef(roomId), file.name);
    await uploadBytes(resourceRef, file, { customMetadata: { uploader: user.displayName || 'Unknown' } });
};

export const getRoomResources = async (roomId: string) => {
    if (!storage) return [];
    try {
        const resourcesRef = getResourcesRef(roomId);
        const res = await listAll(resourcesRef);
        const resources = await Promise.all(res.items.map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            const metadata = await getMetadata(itemRef);
            return { name: itemRef.name, url, uploader: metadata.customMetadata?.uploader, timeCreated: metadata.timeCreated };
        }));
        return resources;
    } catch (error) {
        console.error("Error getting resources: ", error);
        return [];
    }
};

export const deleteResource = async (roomId: string, fileName: string) => {
    if (!storage) return;
    const resourceRef = ref(getResourcesRef(roomId), fileName);
    await deleteObject(resourceRef);
};

export const onResourcesUpdate = (roomId: string, callback: (resources: any[]) => void) => {
    // This is a workaround for the lack of a native `onSnapshot` for Storage.
    // In a real app, you'd use Firestore to store metadata and listen to that.
    const interval = setInterval(async () => {
        const resources = await getRoomResources(roomId);
        callback(resources);
    }, 5000); // Poll every 5 seconds

    // Initial call
    getRoomResources(roomId).then(callback);

    return () => clearInterval(interval);
};
