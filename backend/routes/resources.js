const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for File Uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/resources';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|docx|doc|jpg|jpeg|png|txt/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only documents and images are allowed!'));
  }
});

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
    if (subject) {
      filter.$or = [
        { subject: new RegExp(subject, 'i') },
        { title: new RegExp(subject, 'i') }
      ];
    }

    const resources = await Resource.find(filter)
      .populate('uploadedBy', 'displayName')
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/resources
// @desc    Create a new resource (link or file)
// @access  Private
router.post('/', [authMiddleware, upload.single('file')], async (req, res) => {
  try {
    const { title, description, type, branch, year, subject, link } = req.body;

    let finalLink = link;

    // If file was uploaded, use the local path (served via static)
    if (req.file) {
      const baseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:5000';
      finalLink = `${baseUrl}/uploads/resources/${req.file.filename}`;
    }

    // Validation
    if (!title || !type || !branch || !year || !subject || !finalLink) {
      return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    const newResource = new Resource({
      title,
      description,
      type,
      branch,
      year,
      subject,
      link: finalLink,
      uploadedBy: req.user.id || req.user.userId,
    });

    const resource = await newResource.save();
    res.status(201).json(resource);
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: error.message || 'Server Error' });
  }
});

module.exports = router;
