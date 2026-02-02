const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// @route   GET /api/goals
// @desc    Get all goals for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            goals: goals.map(goal => ({
                id: goal._id.toString(),
                title: goal.title,
                status: goal.status,
                createdAt: goal.createdAt
            }))
        });
    } catch (error) {
        console.error('[Goals API] Error fetching goals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch goals'
        });
    }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { title, status } = req.body;

        if (!title || title.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Goal title is required'
            });
        }

        const goal = new Goal({
            title: title.trim(),
            status: status || 'In Progress',
            userId: req.user.id
        });

        await goal.save();

        res.status(201).json({
            success: true,
            goal: {
                id: goal._id.toString(),
                title: goal.title,
                status: goal.status,
                createdAt: goal.createdAt
            }
        });
    } catch (error) {
        console.error('[Goals API] Error creating goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create goal'
        });
    }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal's status
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const { status } = req.body;

        const goal = await Goal.findOne({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }
        
        if (status) {
            goal.status = status;
        }

        await goal.save();

        res.json({
            success: true,
            goal: {
                id: goal._id.toString(),
                title: goal.title,
                status: goal.status,
                createdAt: goal.createdAt
            }
        });
    } catch (error) {
        console.error('[Goals API] Error updating goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update goal'
        });
    }
});

// @route   DELETE /api/goals/:id
// @desc    Delete a goal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const goal = await Goal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!goal) {
            return res.status(404).json({
                success: false,
                message: 'Goal not found'
            });
        }

        res.json({
            success: true,
            message: 'Goal deleted successfully'
        });
    } catch (error) {
        console.error('[Goals API] Error deleting goal:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete goal'
        });
    }
});

module.exports = router;
