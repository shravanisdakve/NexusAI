import { type Note } from '../types';
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
