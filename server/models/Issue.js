import mongoose from 'mongoose';

/**
 * GitHub Issue Schema
 * Stores cached GitHub issues with extracted metadata for matching
 */
const issueSchema = new mongoose.Schema({
  // GitHub issue data
  githubId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  body: String,
  state: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open'
  },
  number: Number,
  repository: {
    name: String,
    fullName: String,
    description: String,
    language: String,
    stars: Number,
    url: String
  },
  labels: [{
    name: String,
    color: String
  }],
  difficulty: {
    type: String,
    enum: ['good-first-issue', 'beginner', 'intermediate', 'advanced']
  },
  requiredSkills: [String],
  url: String,
  htmlUrl: String,
  createdAt: Date,
  updatedAt: Date,
  lastActivity: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Add indexes
issueSchema.index({ githubId: 1 });
issueSchema.index({ state: 1, isActive: 1 });
issueSchema.index({ 'repository.language': 1 });
issueSchema.index({ difficulty: 1 });
issueSchema.index({ popularity: -1 });
issueSchema.index({ lastActivity: -1 });

// Add text search index
issueSchema.index({ 
  title: 'text', 
  body: 'text',
  'repository.name': 'text',
  'repository.description': 'text'
});

export default mongoose.model('Issue', issueSchema);