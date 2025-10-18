import { type Course } from '../types';
import { db, auth } from '../firebase';
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

const generateColor = (existingColors: string[] = []): string => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const availableColors = colors.filter(c => !existingColors.includes(c));
    return availableColors.length > 0 ? availableColors[0] : colors[Math.floor(Math.random() * colors.length)];
}

const getCoursesCollection = () => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("User not authenticated");
    return collection(db, `users/${userId}/courses`);
}

export const getCourses = async (): Promise<Course[]> => {
    if (!auth.currentUser || !db) return [];
    try {
        const coursesCollection = getCoursesCollection();
        const snapshot = await getDocs(coursesCollection);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    } catch (error) {
        console.error("Error getting courses: ", error);
        return [];
    }
};

export const addCourse = async (name: string): Promise<Course | null> => {
    if (!auth.currentUser || !db) return null;
    try {
        const existingCourses = await getCourses();
        const existingColors = existingCourses.map(c => c.color);
        const newCourseData = {
            name,
            color: generateColor(existingColors),
            createdAt: Timestamp.now(),
        };
        const coursesCollection = getCoursesCollection();
        const docRef = await addDoc(coursesCollection, newCourseData);
        return { id: docRef.id, ...newCourseData } as Course;
    } catch (error) {
        console.error("Error adding course: ", error);
        return null;
    }
};

export const deleteCourse = async (id: string): Promise<void> => {
    if (!auth.currentUser || !db) return;
    try {
        const courseDoc = doc(getCoursesCollection(), id);
        await deleteDoc(courseDoc);
    } catch (error) {
        console.error("Error deleting course: ", error);
    }
};
