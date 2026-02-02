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
                title: 'Applied Mathematics I - Graphic Era University',
                description: 'Complete notes and syllabus for Applied Mathematics I.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Applied Mathematics I',
                link: 'https://geu.ac.in/content/dam/geu/Syllabus/M.Tech/Math/App_Math_I.pdf', // Found GEU link as proxy
                uploadedBy: user._id
            },
            {
                title: 'Maths I Previous Year Question Papers',
                description: 'Mumbai University PYQs from 2019-2023.',
                type: 'Paper',
                branch: 'Common',
                year: 1,
                subject: 'Applied Mathematics I',
                link: 'https://www.mu.ac.in/student-corner/question-papers', // Official MU link
                uploadedBy: user._id
            },
            // Engineering Physics I
            {
                title: 'Engineering Physics I - OpenStax',
                description: 'University Physics Volume 1 content on Mechanics, Sound, Oscillations.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Physics I',
                link: 'https://openstax.org/details/books/university-physics-volume-1',
                uploadedBy: user._id
            },
            // Engineering Chemistry I
            {
                title: 'Engineering Chemistry - NPTEL',
                description: 'NPTEL Course material for Engineering Chemistry.',
                type: 'Notes',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Chemistry I',
                link: 'https://nptel.ac.in/courses/104106121', // NPTEL Chemistry
                uploadedBy: user._id
            },
            // Engineering Mechanics
            {
                title: 'Engineering Mechanics - Dynamics',
                description: 'MIT OpenCourseWare for Engineering Dynamics.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Mechanics',
                link: 'https://ocw.mit.edu/courses/16-07-dynamics-fall-2009/',
                uploadedBy: user._id
            },
            {
                title: 'Mechanics Solved Problems Video Playlist',
                description: 'Video tutorials for solving truss and beam problems.',
                type: 'Video',
                branch: 'Common',
                year: 1,
                subject: 'Engineering Mechanics',
                link: 'https://www.youtube.com/watch?v=1F_s8f_V5gE&list=PL9RcWoqXmzaLTYUdnz-xp8UhChm_g_YW_', // Example playlist
                uploadedBy: user._id
            },
            // BEE
            {
                title: 'Basic Electrical Engineering - NPTEL',
                description: 'Basic Electrical Technology Web Course.',
                type: 'Book',
                branch: 'Common',
                year: 1,
                subject: 'Basic Electrical Engineering',
                link: 'https://nptel.ac.in/courses/108108076',
                uploadedBy: user._id
            },
            // 2nd Year Computer Engineering
            {
                title: 'Data Structures and Algorithms - GeeksforGeeks',
                description: 'Comprehensive tutorials and notes for Data Structures.',
                type: 'Notes',
                branch: 'Computer Engineering',
                year: 2,
                subject: 'Data Structures',
                link: 'https://www.geeksforgeeks.org/data-structures/',
                uploadedBy: user._id
            },
            {
                title: 'Introduction to Algorithms - CLRS (MIT)',
                description: 'MIT Course based on the CLRS book.',
                type: 'Notes',
                branch: 'Computer Engineering',
                year: 2,
                subject: 'Analysis of Algorithms',
                link: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
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
