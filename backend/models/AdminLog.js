const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true
  },
  targetType: String,
  targetId: String,
  metadata: mongoose.Schema.Types.Mixed,
  reason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('AdminLog', AdminLogSchema);
