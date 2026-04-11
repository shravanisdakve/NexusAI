const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    required: true,
    enum: ['Notes', 'Paper', 'Book', 'Video'],
  },
  branch: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    required: true,
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Resource', ResourceSchema);
