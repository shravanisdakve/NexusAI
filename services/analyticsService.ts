import { type LeaderboardEntry, type Course } from '../types';
import { db, auth } from '../firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    Timestamp,
    serverTimestamp,
    collectionGroup,
    orderBy,
    limit,
    getDoc,
    setDoc
} from 'firebase/firestore';

export type ToolKey = 'tutor' | 'visualizer' | 'summarizer' | 'code-helper' | 'study-room';

const getUserId = () => auth.currentUser?.uid;

// --- Session Tracking ---
export const startSession = async (tool: ToolKey, courseId: string | null = null): Promise<string | null> => {
    const userId = getUserId();
    if (!userId || !db) return null;

    try {
        const sessionsCollection = collection(db, `users/${userId}/sessions`);
        const docRef = await addDoc(sessionsCollection, {
            tool,
            courseId,
            startTime: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error starting session: ", error);
        return null;
    }
};

export const endSession = async (sessionId: string | null) => {
    const userId = getUserId();
    if (!sessionId || !userId || !db) return;

    try {
        const sessionDoc = doc(db, `users/${userId}/sessions`, sessionId);
        const sessionSnap = await getDoc(sessionDoc);
        if (sessionSnap.exists()) {
            const startTime = (sessionSnap.data().startTime as Timestamp).toDate();
            const endTime = new Date();
            const duration = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

            if (duration < 5) {
                // Optional: delete very short sessions if they are considered noise
                // await deleteDoc(sessionDoc);
            } else {
                await updateDoc(sessionDoc, {
                    endTime: Timestamp.fromDate(endTime),
                    duration: duration
                });
            }
        }
    } catch (error) {
        console.error("Error ending session: ", error);
    }
};

// --- Pomodoro Tracking ---
export const recordPomodoroCycle = async () => {
    const userId = getUserId();
    if (!userId || !db) return;

    try {
        const pomodoroCollection = collection(db, `users/${userId}/pomodoroCycles`);
        await addDoc(pomodoroCollection, {
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error recording pomodoro cycle: ", error);
    }
};

// --- Quiz Tracking ---
export const recordQuizResult = async (topic: string, correct: boolean, courseId: string | null = null) => {
    const userId = getUserId();
    if (!userId || !db) return;

    try {
        const quizResultsCollection = collection(db, `users/${userId}/quizResults`);
        await addDoc(quizResultsCollection, {
            topic,
            correct,
            courseId,
            timestamp: serverTimestamp(),
            user: {
                email: auth.currentUser?.email,
                displayName: auth.currentUser?.displayName
            }
        });
    } catch (error) {
        console.error("Error recording quiz result: ", error);
    }
};

// --- Data Retrieval for UI ---
export const getProductivityReport = async (courseId: string | null = null) => {
    const userId = getUserId();
    if (!userId || !db) return {
        totalStudyTime: 0, quizAccuracy: 0, totalQuizzes: 0, correctQuizzes: 0,
        strengths: [], weaknesses: [], completedPomodoros: 0, sessions: []
    };

    const oneWeekAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const sessionsQuery = query(
        collection(db, `users/${userId}/sessions`),
        where('startTime', '>=', oneWeekAgo),
        ...(courseId ? [where('courseId', '==', courseId)] : [])
    );

    const quizzesQuery = query(
        collection(db, `users/${userId}/quizResults`),
        where('timestamp', '>=', oneWeekAgo),
        ...(courseId ? [where('courseId', '==', courseId)] : [])
    );
    
    const pomodorosQuery = query(
        collection(db, `users/${userId}/pomodoroCycles`),
        where('timestamp', '>=', oneWeekAgo)
    );

    try {
        const [sessionsSnap, quizzesSnap, pomodorosSnap] = await Promise.all([
            getDocs(sessionsQuery),
            getDocs(quizzesQuery),
            getDocs(pomodorosQuery)
        ]);

        const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalStudyTime = sessions.reduce((acc, s) => acc + (s.duration || 0), 0);

        const quizResults = quizzesSnap.docs.map(doc => doc.data());
        const totalQuizzes = quizResults.length;
        const correctQuizzes = quizResults.filter(q => q.correct).length;
        const quizAccuracy = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 0;

        const topicStats: { [topic: string]: { correct: number, total: number } } = {};
        quizResults.forEach(quiz => {
            const normalizedTopic = quiz.topic.trim().toLowerCase();
            if (!topicStats[normalizedTopic]) topicStats[normalizedTopic] = { correct: 0, total: 0 };
            topicStats[normalizedTopic].total++;
            if (quiz.correct) topicStats[normalizedTopic].correct++;
        });

        const topicPerformance = Object.entries(topicStats).map(([topic, stats]) => ({
            topic,
            accuracy: Math.round((stats.correct / stats.total) * 100),
            count: stats.total,
        }));

        const strengths = topicPerformance.filter(t => t.accuracy >= 80 && t.count > 1).sort((a, b) => b.accuracy - a.accuracy).slice(0, 3);
        const weaknesses = topicPerformance.filter(t => t.accuracy < 60 && t.count > 1).sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);

        return {
            totalStudyTime,
            quizAccuracy,
            totalQuizzes,
            correctQuizzes,
            strengths,
            weaknesses,
            completedPomodoros: pomodorosSnap.size,
            sessions,
        };
    } catch (error) {
        console.error("Error getting productivity report: ", error);
        return {
            totalStudyTime: 0, quizAccuracy: 0, totalQuizzes: 0, correctQuizzes: 0,
            strengths: [], weaknesses: [], completedPomodoros: 0, sessions: []
        };
    }
};

// NOTE: This is not a scalable way to do leaderboards in Firestore.
// For a real app, you would use a Cloud Function to aggregate this data
// into a separate 'leaderboard' collection.
export const getLeaderboardData = async (): Promise<LeaderboardEntry[]> => {
    if (!db) return [];
    try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const leaderboardData: LeaderboardEntry[] = [];

        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            const userData = userDoc.data();

            const sessionsQuery = query(collection(db, `users/${userId}/sessions`));
            const quizzesQuery = query(collection(db, `users/${userId}/quizResults`));

            const [sessionsSnap, quizzesSnap] = await Promise.all([
                getDocs(sessionsQuery),
                getDocs(quizzesQuery)
            ]);

            const totalStudyTime = sessionsSnap.docs.reduce((acc, s) => acc + (s.data().duration || 0), 0);
            const quizResults = quizzesSnap.docs.map(doc => doc.data());
            const totalQuizzes = quizResults.length;
            const correctQuizzes = quizResults.filter(q => q.correct).length;
            const quizScore = totalQuizzes > 0 ? Math.round((correctQuizzes / totalQuizzes) * 100) : 0;

            leaderboardData.push({
                email: userData.email,
                displayName: userData.displayName,
                studyTime: totalStudyTime,
                quizScore: quizScore,
                quizCount: totalQuizzes,
            });
        }

        return leaderboardData.sort((a, b) => b.studyTime - a.studyTime).slice(0, 20);
    } catch (error) {
        console.error("Error getting leaderboard data: ", error);
        return [];
    }
};