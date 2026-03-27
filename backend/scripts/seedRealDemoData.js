const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Config path depending on where script is run
dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/user');
const PlacementData = require('../models/PlacementData');
const StudyRoom = require('../models/StudyRoom');
const UniversityCircular = require('../models/UniversityCircular');
const { runUniversityScraper } = require('../services/scraperService');

const FAKE_USERS = [
    { name: "Rahul Deshmukh", email: "rahul.d@nexus.ai", college: "VJTI", branch: "Computer Engineering", xp: 14500, level: 12, streak: 14 },
    { name: "Priya Sharma", email: "priya.s@nexus.ai", college: "SPIT", branch: "IT", xp: 12000, level: 10, streak: 8 },
    { name: "Atharva Kulkarni", email: "atharva.k@nexus.ai", college: "DJSCE", branch: "Data Science", xp: 8500, level: 7, streak: 3 },
    { name: "Neha Patil", email: "neha.p@nexus.ai", college: "TSEC", branch: "Computer Engineering", xp: 9200, level: 8, streak: 5 },
    { name: "Omkar Joshi", email: "omkar.j@nexus.ai", college: "VJTI", branch: "EXTC", xp: 17500, level: 14, streak: 21 },
    { name: "Ananya Iyer", email: "ananya.i@nexus.ai", college: "SPIT", branch: "Computer Engineering", xp: 6000, level: 5, streak: 2 },
    { name: "R Rohan", email: "rohan.r@nexus.ai", college: "Fr. Agnel", branch: "IT", xp: 11000, level: 9, streak: 6 },
    { name: "Shruti Desai", email: "shruti.d@nexus.ai", college: "VESIT", branch: "Computer Engineering", xp: 18000, level: 15, streak: 30 },
    { name: "Aryan Mehta", email: "aryan.m@nexus.ai", college: "NMIMS", branch: "AI & ML", xp: 5200, level: 4, streak: 1 },
    { name: "Sneha Nair", email: "sneha.n@nexus.ai", college: "KJSCE", branch: "IT", xp: 13400, level: 11, streak: 12 }
];

const PLACEMENT_STATS = [
    { collegeName: "SPIT", year: 2025, highestPackage: 38.5, averagePackage: 10.2, totalOffers: 420 },
    { collegeName: "VJTI", year: 2025, highestPackage: 27.0, averagePackage: 8.5, totalOffers: 380 },
    { collegeName: "DJSCE", year: 2025, highestPackage: 25.0, averagePackage: 8.1, totalOffers: 450 },
    { collegeName: "TSEC", year: 2025, highestPackage: 19.0, averagePackage: 7.5, totalOffers: 310 },
    { collegeName: "VESIT", year: 2025, highestPackage: 18.0, averagePackage: 7.0, totalOffers: 290 },
    { collegeName: "KJSCE", year: 2025, highestPackage: 21.0, averagePackage: 7.6, totalOffers: 340 }
];

const STUDY_ROOMS = [
    { name: "TCS Ninja/Digital Prep", courseId: "placement", maxUsers: 20, technique: "Pomodoro Technique", topic: "Technical Interview Questions", active: true },
    { name: "MU Sem 6 DSA Refresher", courseId: "dsa", maxUsers: 15, technique: "Feynman Technique", topic: "Graphs and DP", active: true },
    { name: "SPIT Coders Hub", courseId: "general", maxUsers: 10, technique: "Spaced Repetition", topic: "Blind 75", active: true },
    { name: "Result Discussion & Reval", courseId: "general", maxUsers: 30, technique: "Pomodoro Technique", topic: "Semester 5 Results", active: true }
];

async function seedData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        // 1. Seed Users
        console.log("Seeding realistic users...");
        const passwordHash = await bcrypt.hash('password123', 10);
        
        // Remove fake users we added previously to avoid duplicates
        await User.deleteMany({ email: { $regex: /@nexus\.ai$/ } });
        
        const createdUsers = [];
        for (const u of FAKE_USERS) {
            const newUser = await User.create({
                displayName: u.name,
                email: u.email,
                password: passwordHash,
                college: u.college,
                branch: u.branch,
                year: 3,
                xp: u.xp,
                level: u.level,
                streak: u.streak,
                coins: u.xp * 0.1,
                lastActive: new Date()
            });
            createdUsers.push(newUser);
        }
        console.log(`Created ${createdUsers.length} active users.`);

        // 2. Seed Placement Data
        console.log("Seeding Placement Data...");
        await PlacementData.deleteMany({});
        await PlacementData.insertMany(PLACEMENT_STATS.map(stat => ({
            collegeName: stat.collegeName,
            year: stat.year,
            highestPackage: stat.highestPackage,
            averagePackage: stat.averagePackage,
            totalOffers: stat.totalOffers
        })));
        console.log("Inserted realistic MU placement stats.");

        // 3. Seed Study Rooms
        console.log("Seeding active Study Rooms...");
        // Clear old rooms
        await StudyRoom.deleteMany({ active: true });
        
        for (let i = 0; i < STUDY_ROOMS.length; i++) {
            const roomData = STUDY_ROOMS[i];
            const host = createdUsers[i % createdUsers.length];
            
            // Pick a random subset of 2-5 users as participants
            const numParticipants = Math.floor(Math.random() * 4) + 2; 
            const participants = [{ user: host._id }];
            
            for(let p=0; p<numParticipants; p++) {
                const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
                if(!participants.find(part => part.user.toString() === randomUser._id.toString())) {
                    participants.push({ user: randomUser._id });
                }
            }
            
            await StudyRoom.create({
                ...roomData,
                createdBy: host._id,
                participants: participants,
                techniqueState: {
                    techniqueKey: roomData.technique.toLowerCase().includes('pomodoro') ? 'pomodoro' : 'feynman',
                    isRunning: true,
                    phaseKey: 'focus',
                    phaseLabel: 'Focus Sprint',
                    phaseDurationSec: 1500,
                    remainingSec: 1500,
                    phaseStartedAt: new Date(),
                    phaseEndsAt: new Date(Date.now() + 1500 * 1000)
                }
            });
        }
        console.log(`Created ${STUDY_ROOMS.length} populated study rooms.`);

        // 4. Run live scraper & clear seed university data
        console.log("Running Live University Scraper...");
        const scrapeResult = await runUniversityScraper();
        console.log(`Scraped ${scrapeResult.upsertedCount} live MU circulars/results.`);
        
        console.log("Deleting fake seed circulars...");
        await UniversityCircular.deleteMany({ source: 'seed' });
        console.log("Fake university data removed.");

        console.log("Demo Data Seeding Complete! The architecture is now populated with realistic testing data.");
        process.exit(0);

    } catch (error) {
        console.error("Seeding error:", error);
        process.exit(1);
    }
}

seedData();
