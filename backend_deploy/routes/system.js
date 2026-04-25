const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');

/**
 * @route   GET /api/system/settings
 * @desc    Public endpoint to get maintenance mode and announcements
 * @access  Public
 */
router.get('/settings', async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings();
      await settings.save();
    }
    
    // Return only non-sensitive data for public consumption
    res.json({ 
      success: true, 
      settings: {
        isMaintenanceMode: settings.isMaintenanceMode,
        maintenanceMessage: settings.maintenanceMessage,
        globalAnnouncement: settings.globalAnnouncement,
        activeAIProvider: settings.activeAIProvider
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
