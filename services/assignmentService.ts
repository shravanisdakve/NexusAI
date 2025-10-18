import { db, auth } from '../firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, doc } from 'firebase/firestore';
import { type Assignment } from '../types';

const assignmentsCollection = collection(db, 'assignments');

export const getAssignments = async (userId: string): Promise<Assignment[]> => {
    if (!db) return [];
    const q = query(assignmentsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Assignment));
};

export const addAssignment = async (assignment: Omit<Assignment, 'id'>): Promise<Assignment | null> => {
    if (!db) return null;
    const docRef = await addDoc(assignmentsCollection, assignment);
    return { id: docRef.id, ...assignment };
};

export const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    if (!db) return;
    const assignmentDoc = doc(db, 'assignments', id);
    await updateDoc(assignmentDoc, updates);
};

export const deleteAssignment = async (id: string) => {
    if (!db) return;
    const assignmentDoc = doc(db, 'assignments', id);
    await deleteDoc(assignmentDoc);
};
