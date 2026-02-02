const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');

// Helper function to generate colors
const generateColor = (existingColors = []) => {
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const availableColors = colors.filter(c => !existingColors.includes(c));
    return availableColors.length > 0
        ? availableColors[0]
        : colors[Math.floor(Math.random() * colors.length)];
};

// @route   GET /api/courses
// @desc    Get all courses for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const courses = await Course.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            courses: courses.map(course => ({
                id: course._id.toString(),
                name: course.name,
                color: course.color,
                createdAt: course.createdAt
            }))
        });
    } catch (error) {
        console.error('[Courses API] Error fetching courses:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch courses'
        });
    }
});

// @route   GET /api/courses/:id
// @desc    Get a single course by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        res.json({
            success: true,
            course: {
                id: course._id.toString(),
                name: course.name,
                color: course.color,
                createdAt: course.createdAt
            }
        });
    } catch (error) {
        console.error('[Courses API] Error fetching course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch course'
        });
    }
});

// @route   POST /api/courses
// @desc    Create a new course
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Course name is required'
            });
        }

        // Get existing colors for this user
        const userCourses = await Course.find({ userId: req.user.id });
        const existingColors = userCourses.map(c => c.color);

        const course = new Course({
            name: name.trim(),
            color: generateColor(existingColors),
            userId: req.user.id
        });

        await course.save();

        console.log(`[Courses API] Created course ${course._id} for user ${req.user.id}`);

        res.status(201).json({
            success: true,
            course: {
                id: course._id.toString(),
                name: course.name,
                color: course.color,
                createdAt: course.createdAt
            }
        });
    } catch (error) {
        console.error('[Courses API] Error creating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create course'
        });
    }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, color } = req.body;

        const course = await Course.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        if (name) course.name = name.trim();
        if (color) course.color = color;

        await course.save();

        res.json({
            success: true,
            course: {
                id: course._id.toString(),
                name: course.name,
                color: course.color,
                createdAt: course.createdAt
            }
        });
    } catch (error) {
        console.error('[Courses API] Error updating course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update course'
        });
    }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const course = await Course.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // TODO: Also delete associated notes and flashcards
        // For now, we'll keep them to avoid data loss

        res.json({
            success: true,
            message: 'Course deleted successfully'
        });
    } catch (error) {
        console.error('[Courses API] Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete course'
        });
    }
});

module.exports = router;
