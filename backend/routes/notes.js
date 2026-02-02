const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Flashcard = require('../models/Flashcard');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/notes');
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|txt|md|pptx|mp3|wav|ogg|aac/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname || mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only documents and audio files are allowed'));
        }
    }
});

// @route   GET /api/notes/:courseId
// @desc    Get all notes for a course
// @access  Private
router.get('/:courseId', auth, async (req, res) => {
    try {
        const notes = await Note.find({
            courseId: req.params.courseId,
            userId: req.user.id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            notes: notes.map(note => ({
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                type: note.type,
                fileUrl: note.fileUrl,
                fileName: note.fileName,
                fileExtension: note.fileExtension,
                fileSize: note.fileSize,
                createdAt: note.createdAt
            }))
        });
    } catch (error) {
        console.error('[Notes API] Error fetching notes:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch notes'
        });
    }
});

// @route   POST /api/notes/:courseId/text
// @desc    Create a text note
// @access  Private
router.post('/:courseId/text', auth, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Note title is required'
            });
        }

        const note = new Note({
            title: title.trim(),
            content: content || '',
            type: 'text',
            courseId: req.params.courseId,
            userId: req.user.id
        });

        await note.save();

        res.status(201).json({
            success: true,
            note: {
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                type: note.type,
                createdAt: note.createdAt
            }
        });
    } catch (error) {
        console.error('[Notes API] Error creating text note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create note'
        });
    }
});

// @route   POST /api/notes/:courseId/file
// @desc    Upload a file note
// @access  Private
router.post('/:courseId/file', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { title } = req.body;
        const fileUrl = `/uploads/notes/${req.file.filename}`;

        const note = new Note({
            title: title || req.file.originalname,
            content: '[Text extraction pending or failed]', // Will be updated by AI extraction
            type: 'file',
            fileUrl,
            fileName: req.file.originalname,
            fileExtension: path.extname(req.file.originalname).slice(1),
            fileSize: req.file.size,
            courseId: req.params.courseId,
            userId: req.user.id
        });

        await note.save();

        res.status(201).json({
            success: true,
            note: {
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                type: note.type,
                fileUrl: note.fileUrl,
                fileName: note.fileName,
                fileExtension: note.fileExtension,
                fileSize: note.fileSize,
                createdAt: note.createdAt
            }
        });
    } catch (error) {
        console.error('[Notes API] Error uploading file:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
});

// @route   PUT /api/notes/:courseId/:noteId
// @desc    Update a note's content
// @access  Private
router.put('/:courseId/:noteId', auth, async (req, res) => {
    try {
        const { content } = req.body;

        const note = await Note.findOne({
            _id: req.params.noteId,
            courseId: req.params.courseId,
            userId: req.user.id
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        if (note.type !== 'text') {
            return res.status(400).json({
                success: false,
                message: 'Can only edit text notes'
            });
        }

        note.content = content;
        await note.save();

        res.json({
            success: true,
            note: {
                id: note._id.toString(),
                title: note.title,
                content: note.content,
                type: note.type
            }
        });
    } catch (error) {
        console.error('[Notes API] Error updating note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update note'
        });
    }
});

// @route   DELETE /api/notes/:courseId/:noteId
// @desc    Delete a note
// @access  Private
router.delete('/:courseId/:noteId', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            _id: req.params.noteId,
            courseId: req.params.courseId,
            userId: req.user.id
        });

        if (!note) {
            return res.status(404).json({
                success: false,
                message: 'Note not found'
            });
        }

        // Delete file if it exists
        if (note.fileUrl) {
            const filePath = path.join(__dirname, '..', note.fileUrl);
            try {
                await fs.unlink(filePath);
            } catch (err) {
                console.error('[Notes API] Error deleting file:', err);
            }
        }

        await Note.deleteOne({ _id: note._id });

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('[Notes API] Error deleting note:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete note'
        });
    }
});

// @route   GET /api/notes/:courseId/flashcards
// @desc    Get all flashcards for a course
// @access  Private
router.get('/:courseId/flashcards', auth, async (req, res) => {
    try {
        const flashcards = await Flashcard.find({
            courseId: req.params.courseId,
            userId: req.user.id
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            flashcards: flashcards.map(card => ({
                id: card._id.toString(),
                front: card.front,
                back: card.back,
                bucket: card.bucket,
                lastReview: card.lastReview
            }))
        });
    } catch (error) {
        console.error('[Notes API] Error fetching flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch flashcards'
        });
    }
});

// @route   POST /api/notes/:courseId/flashcards
// @desc    Add flashcards to a course
// @access  Private
router.post('/:courseId/flashcards', auth, async (req, res) => {
    try {
        const { flashcards } = req.body;

        if (!Array.isArray(flashcards) || flashcards.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Flashcards array is required'
            });
        }

        const flashcardDocs = flashcards.map(card => ({
            front: card.front,
            back: card.back,
            bucket: card.bucket || 1,
            lastReview: card.lastReview || new Date(),
            courseId: req.params.courseId,
            userId: req.user.id
        }));

        const savedFlashcards = await Flashcard.insertMany(flashcardDocs);

        res.status(201).json({
            success: true,
            flashcards: savedFlashcards.map(card => ({
                id: card._id.toString(),
                front: card.front,
                back: card.back,
                bucket: card.bucket,
                lastReview: card.lastReview
            }))
        });
    } catch (error) {
        console.error('[Notes API] Error creating flashcards:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create flashcards'
        });
    }
});

// @route   PUT /api/notes/:courseId/flashcards/:flashcardId
// @desc    Update a flashcard (for spaced repetition)
// @access  Private
router.put('/:courseId/flashcards/:flashcardId', auth, async (req, res) => {
    try {
        const { bucket, lastReview } = req.body;

        const flashcard = await Flashcard.findOne({
            _id: req.params.flashcardId,
            courseId: req.params.courseId,
            userId: req.user.id
        });

        if (!flashcard) {
            return res.status(404).json({
                success: false,
                message: 'Flashcard not found'
            });
        }

        if (bucket !== undefined) flashcard.bucket = bucket;
        if (lastReview !== undefined) flashcard.lastReview = lastReview;

        await flashcard.save();

        res.json({
            success: true,
            flashcard: {
                id: flashcard._id.toString(),
                front: flashcard.front,
                back: flashcard.back,
                bucket: flashcard.bucket,
                lastReview: flashcard.lastReview
            }
        });
    } catch (error) {
        console.error('[Notes API] Error updating flashcard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update flashcard'
        });
    }
});

module.exports = router;
