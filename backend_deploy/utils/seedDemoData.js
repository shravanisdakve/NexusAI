const mongoose = require('mongoose');
const Course = require('../models/Course');
const Note = require('../models/Note');
const Flashcard = require('../models/Flashcard');
const StudyRoom = require('../models/StudyRoom');
const Goal = require('../models/Goal');
const UserProgress = require('../models/UserProgress');
const User = require('../models/user');

/**
 * Seeds demo data for a newly registered user to ensure the platform doesn't look empty.
 * @param {string} userId - The ID of the newly created user
 * @param {string} branch - The user's engineering branch (e.g., 'CSE', 'IT', 'ECE')
 */
const seedDemoData = async (userId, branch = 'CSE') => {
    try {
        console.log(`[Seed] Seeding for user ${userId} (${branch})...`);
        
        // Ensure userId is an ObjectId
        const userObjId = mongoose.isValidObjectId(userId) ? userId : new mongoose.Types.ObjectId(userId);

        // Define branch-specific courses if needed, or stick to core MU subjects
        const getBranchCourse = (b) => {
            if (b === 'CSE' || b === 'IT') return 'Data Structures & Analysis';
            if (b === 'ECE' || b === 'EE') return 'Digital Circuit Design';
            if (b === 'ME') return 'Thermodynamics';
            return 'Engineering Mechanics';
        };

        const firstCourseName = getBranchCourse(branch);

        // 1. Create Demo Courses
        const courses = await Course.insertMany([
            {
                userId: userObjId,
                name: 'Applied Mathematics IV',
                color: '#8b5cf6',
                description: 'Complex Variables, Matrices, and Numerical Methods (MU Sem 4).',
                icon: '📐',
                status: 'active'
            },
            {
                userId: userObjId,
                name: firstCourseName,
                color: '#3b82f6',
                description: `Foundational concepts for ${branch} engineering as per MU syllabus.`,
                icon: '🖥️',
                status: 'active'
            },
            {
                userId: userObjId,
                name: 'Core Communication Skills',
                color: '#10b981',
                description: 'Professional communication for placement readiness.',
                icon: '🗣️',
                status: 'active'
            }
        ]);

        const mathCourse = courses[0];
        const specCourse = courses[1];

        // 2. Create Demo Notes (Referencing the Real Static PDFs in /public/demo-notes)
        const mathNote = await Note.create({
            userId: userObjId,
            courseId: mathCourse._id,
            title: 'Unit 1: Complex Numbers (Study Guide)',
            content: 'Detailed breakdown of complex variable theory as per MU syllabus. Contains solved examples from 2022-2023 papers.',
            type: 'file',
            fileUrl: '/demo-notes/applied-maths-iv/unit1-complex-numbers.pdf',
            fileName: 'unit1-complex-numbers.pdf',
            fileExtension: 'pdf',
            fileSize: 2457600, // ~2.4 MB
            createdAt: Date.now()
        });

        const specNote = await Note.create({
            userId: userObjId,
            courseId: specCourse._id,
            title: `Unit 1: ${firstCourseName} - Core Foundations`,
            content: `Core curriculum foundations for ${firstCourseName}. Highly effective for MU semester exams and technical interviews.`,
            type: 'file',
            fileUrl: branch === 'CSE' || branch === 'IT' 
                ? '/demo-notes/data-structures/unit1-arrays-linked-lists.pdf'
                : '/demo-notes/core-communication/unit1-writing-skills.pdf',
            fileName: 'unit1-reference.pdf',
            fileExtension: 'pdf',
            fileSize: 1843200, // ~1.8 MB
            createdAt: Date.now()
        });

        // 3. Create Demo Flashcards
        await Flashcard.insertMany([
            {
                userId: userObjId,
                courseId: mathCourse._id,
                front: 'State the Fourier series expansion formula for f(x).',
                back: 'f(x) = a0/2 + ∑[an cos(nx) + bn sin(nx)]',
                bucket: 1,
                lastReview: Date.now()
            },
            {
                userId: userObjId,
                courseId: specCourse._id,
                front: `Why is ${firstCourseName} important for MU Semester exams?`,
                back: 'It forms the basis for 40% of the technical weightage in Sem 4 and Sem 5.',
                bucket: 2,
                lastReview: Date.now()
            }
        ]);

/*
        // 4. Create a Personal Study Room
        await StudyRoom.create({
            name: `${branch} Mastery Hub`,
            courseId: specCourse._id,
            topic: `MU-Sem4 ${branch} Exam Prep`,
            technique: 'Pomodoro Technique',
            maxUsers: 12,
            createdBy: userObjId,
            participants: [{ user: userObjId }],
            active: true,
            techniqueState: {
                techniqueKey: 'pomodoro',
                isRunning: false,
                phaseKey: 'focus',
                phaseLabel: 'Deep Work',
                remainingSec: 1500,
                version: 1
            }
        });
        */

        // 5. Create an Academic Goal
        await Goal.create({
            userId: userObjId,
            title: 'Target 9.5+ SGPI (Sem 4)',
            description: 'Focused sprint for Mumbai University toppers and placement readiness.',
            targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            completed: false,
            milestones: [
                { text: 'Complete Applied Math IV Module 1-3', completed: false },
                { text: 'Solve past 3 years MU Paper Bank', completed: false }
            ]
        });

        // 6. Create Demo Progress (Analytics)
        await UserProgress.create({
            userId: String(userId),
            totalStudyTime: 0,
            pomodoroSessions: 0,
            quizzesTaken: 0,
            topicMastery: [],
            recentActivity: [],
            quizHistory: []
        });

        // 7. Initialize User Stats (Gamification)
        const currentUser = await User.findById(userId);
        if (currentUser) {
            currentUser.xp = 0;
            currentUser.level = 1;
            currentUser.streak = 0;
            currentUser.badges = [];
            currentUser.lastActive = new Date();
            await currentUser.save();
        }

        // 8. Create Ghost Users for Leaderboard (if not already present)
        const ghostCount = await User.countDocuments({ email: /ghost_.*@nexusai\.com/ });
        if (ghostCount < 5) {
            const ghosts = [
                { displayName: 'Rahul Sharma', email: 'ghost_rahul@nexusai.com', password: 'password', branch: 'IT', year: 3, college: 'VESIT', xp: 5400, level: 8, streak: 12 },
                { displayName: 'Ananya Iyer', email: 'ghost_ananya@nexusai.com', password: 'password', branch: 'CSE', year: 2, college: 'TCET', xp: 3200, level: 5, streak: 8 },
                { displayName: 'Siddharth M.', email: 'ghost_sid@nexusai.com', password: 'password', branch: 'Mechanical', year: 1, college: 'VJTI', xp: 2100, level: 4, streak: 3 },
                { displayName: 'Pooja Patil', email: 'ghost_pooja@nexusai.com', password: 'password', branch: 'ECE', year: 4, college: 'SPIT', xp: 18000, level: 12, streak: 25 },
                { displayName: 'Kevin Dsouza', email: 'ghost_kevin@nexusai.com', password: 'password', branch: 'CSE', year: 3, college: 'DJ Sanghvi', xp: 800, level: 2, streak: 1 }
            ];
            
            for (const ghost of ghosts) {
                const existing = await User.findOne({ email: ghost.email });
                if (!existing) {
                    const newGhost = new User(ghost);
                    await newGhost.save();
                    
                    // Add some base activity for ghosts
                    await UserProgress.create({
                        userId: String(newGhost._id),
                        totalStudyTime: 50000,
                        quizzesTaken: 50
                    });
                }
            }
        }

        console.log(`[Seed] Success for user ${userId}`);
        return true;
    } catch (error) {
        console.error(`[Seed] ERROR for user ${userId}:`, error.message);
        // We do NOT re-throw here so the main signup flow can continue
        return false;
    }
};

module.exports = { seedDemoData };
