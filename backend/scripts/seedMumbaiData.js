const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Resource = require('../models/Resource');
const User = require('../models/User');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') }); // Load from backend/.env relative to script

const seedData = async () => {
    try {
        const uri = process.env.MONGO_URI;
        console.log('Connecting to MongoDB Atlas...');
        if (!uri) throw new Error('MONGO_URI is undefined');
        console.log(`URI starts with: ${uri.substring(0, 15)}...`);

        await mongoose.connect(uri);
        console.log('MongoDB Connected for Seeding');

        // Find a user to attribute resources to
        let user = await User.findOne({ email: 'admin@nexusai.com' });
        if (!user) {
            user = await User.findOne({}); // Use any existing user
        }
        if (!user) {
            console.log('No user found to attribute resources. Please create a user first.');
            process.exit(1);
        }
        console.log(`Attributing resources to user: ${user.displayName}`);

        const resources = [
            // Applied Mathematics I
            {
                title: 'Applied Mathematics I - Kumbhojkar Solutions',
                description: 'Complete solutions for GV Kumbhojkar - First Year Engineering.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Applied Mathematics I',
                link: 'https://example.com/maths1-solutions',
                uploadedBy: user._id
            },
            {
                title: 'Maths I Previous Year Question Papers',
                description: 'Mumbai University PYQs from 2019-2023.',
                type: 'Paper',
                branch: 'Common',
                year: 1,
                subject: 'Applied Mathematics I',
                link: 'https://example.com/maths1-pyq',
                uploadedBy: user._id
            },
            // Engineering Physics I
            {
                title: 'Engineering Physics I - TechMax',
                description: 'TechMax simplified notes for Physics I.',
                type: 'Notes',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Physics I',
                link: 'https://example.com/physics1-notes',
                uploadedBy: user._id
            },
            // Engineering Chemistry I
            {
                title: 'Engineering Chemistry I - Important Questions',
                description: 'List of most repeated questions in MU exams.',
                type: 'Notes',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Chemistry I',
                link: 'https://example.com/chem1-imp',
                uploadedBy: user._id
            },
            // Engineering Mechanics
            {
                title: 'Engineering Mechanics - NH Dubey PDF',
                description: 'Standard reference book for Mechanics.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Mechanics',
                link: 'https://example.com/mechanics-book',
                uploadedBy: user._id
            },
            {
                title: 'Mechanics Solved Problems Video Playlist',
                description: 'Video tutorials for solving truss and beam problems.',
                type: 'Video',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Mechanics',
                link: 'https://youtube.com/playlist?list=example',
                uploadedBy: user._id
            },
            // BEE
            {
                title: 'BEE - BR Patil TextBook',
                description: 'Textbook for Basic Electrical Engineering.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Basic Electrical Engineering',
                link: 'https://example.com/bee-book',
                uploadedBy: user._id
            },
            // 2nd Year Computer Engineering
            {
                title: 'Data Structures - Sem 3 - Notes',
                description: 'Comprehensive notes for Data Structures (MU Sem 3).',
                type: 'Notes',
                branch: 'Computer Engineering',
                year: 2,
                subject: 'Data Structures',
                link: 'https://example.com/ds-notes',
                uploadedBy: user._id
            },
            {
                title: 'Analysis of Algorithms - Cormen Summary',
                description: 'Summary of key algorithms from CLRS.',
                type: 'Notes',
                branch: 'Computer Engineering',
                year: 2,
                subject: 'Analysis of Algorithms',
                link: 'https://example.com/aoa-notes',
                uploadedBy: user._id
            }
        ];

        // Check if resources already exist to avoid duplicates (by title)
        for (const res of resources) {
            const existing = await Resource.findOne({ title: res.title });
            if (!existing) {
                await Resource.create(res);
                console.log(`Added: ${res.title}`);
            } else {
                console.log(`Skipped (Exists): ${res.title}`);
            }
        }

        console.log('Seeding Completed!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Seeding Error:', err);
        process.exit(1);
    }
};

seedData();
