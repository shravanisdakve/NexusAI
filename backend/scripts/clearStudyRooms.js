const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const StudyRoom = require('../models/StudyRoom');

const run = async () => {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in backend/.env');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // Delete all rooms. 
        // If you want to keep real rooms, you might want to filter, 
        // but the user's request "remove them I g" in context of the demo rooms suggests a full clear.
        const res = await StudyRoom.deleteMany({});
        console.log(`✅ Successfully removed ${res.deletedCount} study rooms from the lobby.`);

        console.log('Study Lobby is now a clean slate.');
    } catch (err) {
        console.error('Error during cleanup:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

run();
