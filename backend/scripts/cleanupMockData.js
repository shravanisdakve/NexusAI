const mongoose = require('mongoose');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = mongoose.model('User', new mongoose.Schema({ email: String }));
        const mockEmails = [
            'siddharth@example.com', 'ananya@example.com', 
            'rohit@example.com', 'ishani@example.com', 'varun@example.com'
        ];
        const res = await User.deleteMany({ email: { $in: mockEmails } });
        console.log(`Cleaned up ${res.deletedCount} mock students.`);

        // 1. Purge Seeded Placement Data
        const PlacementData = mongoose.model('PlacementData', new mongoose.Schema({}));
        const pRes = await PlacementData.deleteMany({});
        console.log(`Cleaned up ${pRes.deletedCount} placement records.`);

        // 2. Purge Seeded Curriculum
        const Curriculum = mongoose.model('Curriculum', new mongoose.Schema({}));
        const cRes = await Curriculum.deleteMany({});
        console.log(`Cleaned up ${cRes.deletedCount} curriculum records.`);

        // 3. Purge Seeded Resources (PYQs)
        const Resource = mongoose.model('Resource', new mongoose.Schema({}));
        const rRes = await Resource.deleteMany({});
        console.log(`Cleaned up ${rRes.deletedCount} resources (PYQs).`);

        // 4. Purge Live Scraped Circulars
        const UniversityCircular = mongoose.model('UniversityCircular', new mongoose.Schema({}));
        const ucRes = await UniversityCircular.deleteMany({});
        console.log(`Cleaned up ${ucRes.deletedCount} university circulars.`);

        // 5. Purge Ingested Past Paper Data
        const MUPastQuestion = mongoose.model('MUPastQuestion', new mongoose.Schema({}));
        const pqRes = await MUPastQuestion.deleteMany({});
        console.log(`Cleaned up ${pqRes.deletedCount} past paper questions.`);

        console.log('✅ Platform is now a PRISTINE BLANK SLATE. Ready for REAL USE ONLY.');
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};
run();
