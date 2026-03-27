import mongoose from 'mongoose';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

// Manually define the schema since I can't easily import the model file if it's CJS
// Wait, backend/models/Curriculum.js is CJS if it uses require.
// Let's use a dynamic import or just re-define the minimal schema.

const Curriculum = mongoose.model('Curriculum', new mongoose.Schema({
    branch: String,
    semesters: [{
        semesterNumber: Number,
        subjects: [{ name: String, subjectCode: String }]
    }]
}));

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
