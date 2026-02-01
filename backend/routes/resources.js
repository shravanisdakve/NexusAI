const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const authMiddleware = require('../middleware/auth');

// @route   GET api/resources
// @desc    Get all resources, with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { branch, year, type, subject } = req.query;
    const filter = {};

    if (branch) filter.branch = branch;
    if (year) filter.year = year;
    if (type) filter.type = type;
    if (subject) filter.subject = new RegExp(subject, 'i'); // Case-insensitive search

    const resources = await Resource.find(filter).populate('uploadedBy', 'displayName');
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/resources
// @desc    Create a new resource
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, type, branch, year, subject, link } = req.body;

    // Validation
    if (!title || !type || !branch || !year || !subject || !link) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    const newResource = new Resource({
      title,
      description,
      type,
      branch,
      year,
      subject,
      link,
      uploadedBy: req.user.userId,
    });

    const resource = await newResource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
