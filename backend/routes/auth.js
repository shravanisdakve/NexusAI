const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const sendEmail = require('../services/emailService');

const validatePassword = (password) => {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character';
  return null;
};

const sanitizeQuickAccessTools = (tools) => {
  if (!Array.isArray(tools)) return [];
  return [...new Set(tools.filter((item) => typeof item === 'string'))].slice(0, 8);
};

// --- SIGNUP ENDPOINT ---
router.post("/signup", async (req, res) => {
  try {
    const { email, password, displayName, branch, year, college, avatar, learningGoals, learningStyle, studyTime, targetExam, minorDegree, backlogs, preferredLanguage, quickAccessTools } = req.body;
    if (!email || !password || !displayName || !branch || !year || !college) return res.status(400).json({ success: false, message: "All fields are required" });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ success: false, message: passwordError });
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) return res.status(400).json({ success: false, message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ email: email.toLowerCase(), password: hashedPassword, displayName, branch, year, college, avatar, learningGoals, learningStyle, studyTime, targetExam, minorDegree, backlogs, preferredLanguage, quickAccessTools: sanitizeQuickAccessTools(quickAccessTools), lastActive: Date.now() });
    await newUser.save();
    try {
      const { seedDemoData } = require('../utils/seedDemoData');
      seedDemoData(newUser._id, newUser.branch).catch(err => console.error(err));
    } catch (e) {}
    const token = jwt.sign({ userId: newUser._id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: newUser });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Server error', 
      errors: error.errors, // Mongoose validation errors
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// --- LOGIN ENDPOINT ---
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    user.lastActive = Date.now();
    await user.save();
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- VERIFY ---
router.get('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- UPDATE PROFILE ---
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { displayName, branch, year, college, avatar, preferredLanguage, quickAccessTools } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (displayName) user.displayName = displayName;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (college) user.college = college;
    if (avatar) user.avatar = avatar;
    if (preferredLanguage) user.preferredLanguage = preferredLanguage;
    if (quickAccessTools) user.quickAccessTools = sanitizeQuickAccessTools(quickAccessTools);
    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- UPDATE MOOD ---
router.post('/mood', authMiddleware, async (req, res) => {
  try {
    const { mood } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.currentMood = mood;
    user.lastMoodUpdate = new Date();
    await user.save();
    res.json({ success: true, mood: user.currentMood, lastMoodUpdate: user.lastMoodUpdate });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- FORGOT PASSWORD ---
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/#/reset-password/${resetToken}`;
    await sendEmail({
      email: user.email,
      subject: 'Password Reset',
      html: `<p>Reset link: <a href="${resetUrl}">${resetUrl}</a></p>`
    });
    res.json({ success: true, message: 'Email sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// --- RESET PASSWORD ---
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' });
    const error = validatePassword(password);
    if (error) return res.status(400).json({ success: false, message: error });
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.json({ success: true, message: 'Reset successful' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
