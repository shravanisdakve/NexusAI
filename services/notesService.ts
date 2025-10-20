import { type Note, type Flashcard } from '../types';
import { db, auth, storage } from '../firebase';
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    Timestamp,
    writeBatch,
    updateDoc,
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject,
} from 'firebase/storage';

const getNotesCollection = (courseId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    return collection(db, `users/${userId}/courses/${courseId}/notes`);
}

const getFlashcardsCollection = (courseId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    return collection(db, `users/${userId}/courses/${courseId}/flashcards`);
}

export const getNotes = async (courseId: string): Promise<Note[]> => {
    if (!auth.currentUser || !db) return [];
    try {
        const notesCollection = getNotesCollection(courseId);
        const snapshot = await getDocs(notesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
    } catch (error) {
        console.error("Error getting notes: ", error);
        return [];
    }
};

export const addTextNote = async (courseId: string, title: string, content: string): Promise<Note | null> => {
    if (!auth.currentUser || !db) return null;
    try {
        const newNoteData = {
            courseId,
            title,
            content,
            createdAt: Timestamp.now(),
        };
        const notesCollection = getNotesCollection(courseId);
        const docRef = await addDoc(notesCollection, newNoteData);
        return { id: docRef.id, ...newNoteData } as Note;
    } catch (error) {
        console.error("Error adding text note: ", error);
        return null;
    }
};

export const uploadNoteFile = async (courseId: string, title: string, file: File): Promise<Note | null> => {
    if (!auth.currentUser || !db || !storage) return null;
    try {
        const userId = auth.currentUser.uid;
        const filePath = `users/${userId}/courses/${courseId}/notes/${file.name}`;
        const fileRef = ref(storage, filePath);
        await uploadBytes(fileRef, file);
        const fileUrl = await getDownloadURL(fileRef);

        const newNoteData = {
            courseId,
            title,
            fileUrl,
            fileName: file.name,
            fileType: file.type,
            createdAt: Timestamp.now(),
        };

        const notesCollection = getNotesCollection(courseId);
        const docRef = await addDoc(notesCollection, newNoteData);
        return { id: docRef.id, ...newNoteData } as Note;
    } catch (error) {
        console.error("Error uploading note file: ", error);
        return null;
    }
};

export const deleteNote = async (courseId: string, note: Note): Promise<void> => {
    if (!auth.currentUser || !db) return;
    try {
        const noteDoc = doc(getNotesCollection(courseId), note.id);
        await deleteDoc(noteDoc);

        if (note.fileUrl && storage) {
            const fileRef = ref(storage, note.fileUrl);
            await deleteObject(fileRef);
        }
    } catch (error) {
        console.error("Error deleting note: ", error);
    }
};

// --- Flashcard Management ---

export const getFlashcards = async (courseId: string): Promise<Flashcard[]> => {
    if (!auth.currentUser || !db) return [];
    try {
        const flashcardsCollection = getFlashcardsCollection(courseId);
        const snapshot = await getDocs(flashcardsCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Flashcard));
    } catch (error) {
        console.error("Error getting flashcards: ", error);
        return [];
    }
};

export const addFlashcards = async (courseId: string, flashcards: Omit<Flashcard, 'id'>[]): Promise<void> => {
    if (!auth.currentUser || !db) return;
    try {
        const flashcardsCollection = getFlashcardsCollection(courseId);
        const batch = writeBatch(db);
        flashcards.forEach(flashcard => {
            const docRef = doc(flashcardsCollection);
            batch.set(docRef, flashcard);
        });
        await batch.commit();
    } catch (error) {
        console.error("Error adding flashcards: ", error);
    }
};

export const updateFlashcard = async (courseId: string, flashcardId: string, updates: Partial<Flashcard>): Promise<void> => {
    if (!auth.currentUser || !db) return;
    try {
        const flashcardDoc = doc(getFlashcardsCollection(courseId), flashcardId);
        await updateDoc(flashcardDoc, updates);
    } catch (error) {
        console.error("Error updating flashcard: ", error);
    }
};

export const deleteFlashcard = async (courseId: string, flashcardId: string): Promise<void> => {
    if (!auth.currentUser || !db) return;
    try {
        const flashcardDoc = doc(getFlashcardsCollection(courseId), flashcardId);
        await deleteDoc(flashcardDoc);
    } catch (error) {
        console.error("Error deleting flashcard: ", error);
    }
};
