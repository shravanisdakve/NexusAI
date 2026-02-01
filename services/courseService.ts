import { type Course } from '../types';
import { db } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    deleteDoc,
    serverTimestamp,
} from 'firebase/firestore';

const generateColor = (existingColors: string[] = []): string => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const availableColors = colors.filter(c => !existingColors.includes(c));
    return availableColors.length > 0 ? availableColors[0] : colors[Math.floor(Math.random() * colors.length)];
};

export const getCourses = async (): Promise<Course[]> => {
    if (!db) return [];
    console.log("Fetching courses from Firestore...");
    try {
        const coursesCollection = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesCollection);
        const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
        return courseList;
    } catch (error) {
        console.error("Error fetching courses from Firestore:", error);
        return [];
    }
};

export const getCourse = async (id: string): Promise<Course | null> => {
    if (!db) return null;
    console.log("Fetching course from Firestore:", id);
    try {
        const courseDoc = doc(db, 'courses', id);
        const courseSnapshot = await getDoc(courseDoc);
        if (courseSnapshot.exists()) {
            return { id: courseSnapshot.id, ...courseSnapshot.data() } as Course;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching course ${id} from Firestore:`, error);
        return null;
    }
};

export const addCourse = async (name: string): Promise<Course | null> => {
    if (!db) return null;
    console.log("Adding course to Firestore:", name);
    try {
        // To generate a new color, we should get existing colors first
        const currentCourses = await getCourses();
        const existingColors = currentCourses.map(c => c.color);

        const newCourseData = {
            name,
            color: generateColor(existingColors),
            createdAt: serverTimestamp(),
        };

        const coursesCollection = collection(db, 'courses');
        const docRef = await addDoc(coursesCollection, newCourseData);
        
        return { id: docRef.id, ...newCourseData, createdAt: new Date().toISOString() } as Course;
    } catch (error) {
        console.error("Error adding course to Firestore:", error);
        return null;
    }
};

export const deleteCourse = async (id: string): Promise<void> => {
    if (!db) return;
    console.log("Deleting course from Firestore:", id);
    try {
        const courseDoc = doc(db, 'courses', id);
        await deleteDoc(courseDoc);
    } catch (error) {
        console.error(`Error deleting course ${id} from Firestore:`, error);
    }
};
