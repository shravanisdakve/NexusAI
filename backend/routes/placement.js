const express = require('express');
const router = express.Router();
const PlacementData = require('../models/PlacementData');

// Get placement stats for a college
router.get('/:college', async (req, res) => {
    try {
        const { college } = req.params;
        const stats = await PlacementData.find({ collegeName: new RegExp(college, 'i') }).sort({ year: -1 });
        res.json({ success: true, stats });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get overall placement trends
router.get('/trends/overall', async (req, res) => {
    try {
        const trends = await PlacementData.aggregate([
            {
                $group: {
                    _id: "$collegeName",
                    avgPackage: { $avg: "$averagePackage" },
                    highestPackage: { $max: "$highestPackage" }
                }
            },
            { $sort: { avgPackage: -1 } }
        ]);
        res.json({ success: true, trends });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
