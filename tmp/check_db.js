const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const Curriculum = require('../backend/models/Curriculum');

async function check() {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) {
            console.error("MONGO_URI not found");
            process.exit(1);
        }
        await mongoose.connect(uri);
        console.log("Connected");
        const curriculum = await Curriculum.findOne({ branch: /computer engineering/i });
        if (curriculum) {
            console.log("Found Computer Engineering curriculum");
            console.log("Semesters available:", curriculum.semesters.map(s => s.semesterNumber));
        } else {
            console.log("Computer Engineering curriculum NOT FOUND in DB");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}
check();
