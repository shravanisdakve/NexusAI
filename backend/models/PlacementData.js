const mongoose = require('mongoose');

const CompanyStatSchema = new mongoose.Schema({
    companyName: String,
    offers: Number,
    package: Number, // in LPA
    roles: [String]
});

const CollegePlacementSchema = new mongoose.Schema({
    collegeName: { type: String, required: true }, // VJTI, SPIT, etc.
    year: { type: Number, required: true },
    highestPackage: Number,
    averagePackage: Number,
    medianPackage: Number,
    totalOffers: Number,
    topRecruiters: [CompanyStatSchema],
    branchWiseStats: [{
        branch: String,
        placedPercentage: Number,
        averagePackage: Number
    }]
});

module.exports = mongoose.model('PlacementData', CollegePlacementSchema);
