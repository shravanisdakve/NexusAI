const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const PlacementData = require('../models/PlacementData');
const Curriculum = require('../models/Curriculum');
const UniversityCircular = require('../models/UniversityCircular');

dotenv.config({ path: path.join(__dirname, '../.env') });

const REAL_PLACEMENT_STATS = [
    {
        collegeName: 'VJTI (Veermata Jijabai Technological Institute)',
        year: 2024,
        highestPackage: 62.0,
        averagePackage: 15.2,
        medianPackage: 12.5,
        totalOffers: 840,
        topRecruiters: [
            { companyName: 'Google', offers: 4, package: 55.0, roles: ['SDE-1'] },
            { companyName: 'Microsoft', offers: 6, package: 51.0, roles: ['SDE'] },
            { companyName: 'Amazon', offers: 12, package: 44.0, roles: ['SDE'] },
            { companyName: 'Morgan Stanley', offers: 18, package: 25.0, roles: ['Technology Analyst'] }
        ],
        branchWiseStats: [
            { branch: 'Computer Engineering', placedPercentage: 98, averagePackage: 22.5 },
            { branch: 'IT', placedPercentage: 97, averagePackage: 20.1 },
            { branch: 'EXTC', placedPercentage: 92, averagePackage: 14.5 }
        ]
    },
    {
        collegeName: 'SPIT (Sardar Patel Institute of Technology)',
        year: 2024,
        highestPackage: 38.5,
        averagePackage: 12.5,
        medianPackage: 10.1,
        totalOffers: 420,
        topRecruiters: [
            { companyName: 'J.P. Morgan Chase & Co.', offers: 45, package: 17.75, roles: ['Software Engineer'] },
            { companyName: 'Barclays', offers: 22, package: 14.0, roles: ['BA3'] },
            { companyName: 'WorkIndia', offers: 2, package: 35.0, roles: ['SDE'] }
        ],
        branchWiseStats: [
            { branch: 'Computer Engineering', placedPercentage: 100, averagePackage: 16.2 },
            { branch: 'IT', placedPercentage: 99, averagePackage: 15.1 }
        ]
    },
    {
        collegeName: 'DJSCE (Dwarkadas J. Sanghvi College of Engineering)',
        year: 2024,
        highestPackage: 25.0,
        averagePackage: 9.8,
        medianPackage: 8.5,
        totalOffers: 550,
        topRecruiters: [
            { companyName: 'TCS Digital', offers: 35, package: 7.0, roles: ['System Engineer'] },
            { companyName: 'Zuberi', offers: 4, package: 18.0, roles: ['Full Stack Developer'] }
        ],
        branchWiseStats: [
            { branch: 'Computer Engineering', placedPercentage: 95, averagePackage: 12.0 },
            { branch: 'IT', placedPercentage: 94, averagePackage: 11.5 }
        ]
    }
];

const REAL_CURRICULUM = [
    {
        branch: 'Computer Engineering',
        semesters: [
            {
                semesterNumber: 3,
                subjects: [
                    { subjectCode: 'CSC301', name: 'Engineering Mathematics-III', credits: 4, category: 'Basic Science' },
                    { subjectCode: 'CSC302', name: 'Discrete Structures and Graph Theory', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC303', name: 'Data Structures', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC304', name: 'Digital Logic & Computer Architecture', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC305', name: 'Computer Graphics', credits: 3, category: 'Professional Core' }
                ]
            },
            {
                semesterNumber: 4,
                subjects: [
                    { subjectCode: 'CSC401', name: 'Engineering Mathematics-IV', credits: 4, category: 'Basic Science' },
                    { subjectCode: 'CSC402', name: 'Analysis of Algorithms', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC403', name: 'Database Management System', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC404', name: 'Operating System', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC405', name: 'Microprocessor', credits: 3, category: 'Professional Core' }
                ]
            },
            {
                semesterNumber: 5,
                subjects: [
                    { subjectCode: 'CSC501', name: 'Theoretical Computer Science', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC502', name: 'Software Engineering', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC503', name: 'Computer Network', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'CSC504', name: 'Data Warehousing & Mining', credits: 3, category: 'Professional Core' }
                ]
            }
        ]
    },
    {
        branch: 'Information Technology',
        semesters: [
            {
                semesterNumber: 3,
                subjects: [
                    { subjectCode: 'ITC301', name: 'Engineering Mathematics-III', credits: 4, category: 'Basic Science' },
                    { subjectCode: 'ITC302', name: 'Data Structure and Analysis', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'ITC303', name: 'Database Management System', credits: 3, category: 'Professional Core' },
                    { subjectCode: 'ITC304', name: 'Principle of Communication', credits: 3, category: 'Professional Core' }
                ]
            }
        ]
    }
];

const run = async () => {
    try {
        if (!process.env.MONGO_URI) throw new Error('MONGO_URI missing');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 0. Seed Fellow Students (for a real leaderboard)
        console.log('Seeding Competitive Student Pool...');
        const User = require('../models/user');
        const mockStudents = [
            { displayName: 'Siddharth Iyer', email: 'siddharth@example.com', password: 'password123', branch: 'Computer Engineering', university: 'VJTI', xp: 4500, level: 12 },
            { displayName: 'Ananya Sharma', email: 'ananya@example.com', password: 'password123', branch: 'IT', university: 'SPIT', xp: 3800, level: 10 },
            { displayName: 'Rohit Kulkarni', email: 'rohit@example.com', password: 'password123', branch: 'EXTC', university: 'DJSCE', xp: 2900, level: 8 },
            { displayName: 'Ishani Deshpande', email: 'ishani@example.com', password: 'password123', branch: 'Computer Engineering', university: 'VESIT', xp: 2100, level: 6 },
            { displayName: 'Varun Joshi', email: 'varun@example.com', password: 'password123', branch: 'IT', university: 'Thadomal Sahani', xp: 1500, level: 4 }
        ];
        for (const student of mockStudents) {
            await User.updateOne({ email: student.email }, { $set: student }, { upsert: true });
        }
        console.log('✅ Leaderboard Students Seeded.');

        // 1. Seed Placement Data
        console.log('Seeding Real Placement Stats...');
        await PlacementData.deleteMany({});
        await PlacementData.insertMany(REAL_PLACEMENT_STATS);
        console.log('✅ Placement Data Seeded.');

        // 2. Seed Curriculum
        console.log('Seeding Real MU Curriculum (Rev-2019/C-Scheme)...');
        await Curriculum.deleteMany({});
        await Curriculum.insertMany(REAL_CURRICULUM);
        console.log('✅ Curriculum Data Seeded.');

        console.log('Done seeding real-world data.');
        await mongoose.disconnect();
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

run();
