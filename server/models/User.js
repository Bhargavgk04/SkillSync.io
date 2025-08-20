import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User Schema
 * Stores user profile, GitHub data, extracted skills, and preferences
 */
const userSchema = new mongoose.Schema({
  // Basic user info
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: String,
  name: String,
  avatar: String,
  bio: String,
  location: String,
  blog: String,
  company: String,
  
  // GitHub stats
  githubData: {
    publicRepos: Number,
    followers: Number,
    following: Number,
    createdAt: Date,
    updatedAt: Date
  },
  
  // AI-extracted skills and experience
  skills: [{
    name: String,
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    source: {
      type: String,
      enum: ['repository', 'contribution', 'manual']
    }
  }],
  
  // Languages and frameworks
  languages: [{
    name: String,
    percentage: Number,
    linesOfCode: Number
  }],
  
  // User preferences
  preferences: {
    difficultLevels: [{
      type: String,
      enum: ['good-first-issue', 'beginner', 'intermediate', 'advanced']
    }],
    languages: [String],
    topics: [String],
    excludeRepositories: [String],
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      newMatches: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true }
    }
  },
  
  // User activity
  savedIssues: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue'
  }],
  solvedIssues: [{
    issue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue'
    },
    solvedAt: Date,
    pullRequestUrl: String
  }],
  
  // Last profile analysis
  lastAnalyzed: {
    type: Date,
    default: Date.now
  },
  
  // Authentication
  accessToken: String,
  refreshToken: String,
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries (only for fields that don't already have unique constraints)
userSchema.index({ 'skills.name': 1 });
userSchema.index({ 'languages.name': 1 });

// Instance method to get skill level
userSchema.methods.getSkillLevel = function(skillName) {
  const skill = this.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  return skill ? skill.level : 'beginner';
};

// Instance method to check if user has skill
userSchema.methods.hasSkill = function(skillName, minLevel = 'beginner') {
  const skill = this.skills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
  if (!skill) return false;
  
  const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
  const userLevel = levels.indexOf(skill.level);
  const requiredLevel = levels.indexOf(minLevel);
  
  return userLevel >= requiredLevel;
};

// Pre-save middleware to update lastAnalyzed when skills change
userSchema.pre('save', function(next) {
  if (this.isModified('skills') || this.isModified('languages')) {
    this.lastAnalyzed = new Date();
  }
  next();
});

// Method to manually update lastAnalyzed
userSchema.methods.updateAnalysisTimestamp = async function() {
  this.lastAnalyzed = new Date();
  return this.save();
};

// Static method to find users needing analysis
userSchema.statics.findUsersNeedingAnalysis = async function(daysThreshold = 7) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);
  
  return this.find({
    $or: [
      { lastAnalyzed: { $lt: cutoffDate } },
      { lastAnalyzed: null }
    ]
  });
};


export default mongoose.model('User', userSchema);