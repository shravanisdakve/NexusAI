const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  displayName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  branch: {
    type: String,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  college: {
    type: String,
    required: true,
  },
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  contributions: {
    type: Number,
    default: 0,
  },
  avatar: {
    type: String, // URL to profile picture
    default: null,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  // Gamification Fields
  xp: {
    type: Number,
    default: 0
  },
  coins: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  badges: [{
    type: String
  }],
  // End Gamification Fields
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
}, {
  // Add toJSON and toObject options
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password; // Also remove password from the output
    }
  },
  toObject: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
    }
  }
});
// Add method to award XP and handle leveling
UserSchema.methods.addXP = async function (amount) {
  this.xp = (this.xp || 0) + amount;

  // Dynamic Level Logic: Total XP for Level L = 500 * L * (L - 1)
  // Inverse: L = (1 + sqrt(1 + 8*XP/1000)) / 2
  const calculatedLevel = Math.floor((1 + Math.sqrt(1 + (8 * this.xp) / 1000)) / 2);
  const newLevel = Math.max(1, calculatedLevel);

  let leveledUp = false;
  if (newLevel > this.level) {
    this.level = newLevel;
    this.coins = (this.coins || 0) + (newLevel * 10);
    leveledUp = true;
  }

  await this.save();
  return { leveledUp, level: this.level, xp: this.xp };
};

module.exports = mongoose.model("User", UserSchema);
