import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Update user preferences
 */
router.put('/preferences', [
  authenticate,
  body('difficultLevels').optional().isArray(),
  body('difficultLevels.*').isIn(['good-first-issue', 'beginner', 'intermediate', 'advanced']),
  body('languages').optional().isArray(),
  body('topics').optional().isArray(),
  body('excludeRepositories').optional().isArray(),
  body('notificationSettings').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences data',
        errors: errors.array()
      });
    }
    
    console.log('[USER] Updating preferences for user:', req.user.username);
    console.log('[USER] Request body:', req.body);
    
    const updateData = {};
    const allowedFields = [
      'difficultLevels',
      'languages', 
      'topics',
      'excludeRepositories',
      'notificationSettings'
    ];
    
    // Build update object
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[`preferences.${field}`] = req.body[field];
      }
    }
    
    console.log('[USER] Update data:', updateData);
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-accessToken -refreshToken');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log('[USER] Preferences updated successfully for user:', user.username);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

/**
 * Get user statistics
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('savedIssues')
      .populate('solvedIssues.issue');
    
    const stats = {
      totalSkills: user.skills.length,
      topSkills: user.skills
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5),
      
      totalLanguages: user.languages.length,
      topLanguages: user.languages
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5),
      
      savedIssuesCount: user.savedIssues.length,
      solvedIssuesCount: user.solvedIssues.length,
      
      // Activity stats
      joinedDate: user.createdAt,
      lastActive: user.updatedAt,
      lastAnalyzed: user.lastAnalyzed,
      
      // GitHub stats
      githubStats: user.githubData,
      
      // Achievement-like stats
      achievements: generateAchievements(user)
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics'
    });
  }
});

/**
 * Generate user achievements/badges
 */
function generateAchievements(user) {
  const achievements = [];
  
  // Skill achievements
  if (user.skills.length >= 10) {
    achievements.push({
      name: 'Polyglot',
      description: 'Has 10+ identified skills',
      icon: '🎯',
      earnedAt: user.updatedAt
    });
  }
  
  if (user.skills.some(s => s.level === 'expert')) {
    achievements.push({
      name: 'Expert',
      description: 'Has expert-level skills',
      icon: '🏆',
      earnedAt: user.updatedAt
    });
  }
  
  // Contribution achievements
  if (user.solvedIssues.length >= 5) {
    achievements.push({
      name: 'Problem Solver',
      description: 'Solved 5+ issues',
      icon: '💡',
      earnedAt: user.updatedAt
    });
  }
  
  if (user.solvedIssues.length >= 20) {
    achievements.push({
      name: 'Open Source Hero',
      description: 'Solved 20+ issues',
      icon: '🦸',
      earnedAt: user.updatedAt
    });
  }
  
  // Activity achievements
  const daysSinceJoined = (new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
  if (daysSinceJoined >= 30) {
    achievements.push({
      name: 'Dedicated Contributor',
      description: '30+ days on the platform',
      icon: '🔥',
      earnedAt: user.updatedAt
    });
  }
  
  return achievements;
}

/**
 * Add manual skill
 */
router.post('/skills', [
  authenticate,
  body('name').isString().trim().isLength({ min: 1, max: 50 }),
  body('level').isIn(['beginner', 'intermediate', 'advanced', 'expert'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid skill data',
        errors: errors.array()
      });
    }
    
    const { name, level } = req.body;
    
    // Find user and update skills
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if skill already exists
    const existingSkillIndex = user.skills.findIndex(s => 
      s.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingSkillIndex !== -1) {
      // Update existing skill
      user.skills[existingSkillIndex] = {
        ...user.skills[existingSkillIndex],
        level,
        source: 'manual',
        confidence: 1.0
      };
    } else {
      // Add new skill
      user.skills.push({
        name: name.trim().toLowerCase(),
        level,
        confidence: 1.0,
        source: 'manual'
      });
    }
    
    await user.save();
    
    console.log(`[USER] Skill ${name} added/updated for user ${user.username}`);
    
    res.json({
      success: true,
      message: 'Skill added successfully',
      skills: user.skills
    });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add skill'
    });
  }
});

/**
 * Remove skill
 */
router.delete('/skills/:skillName', authenticate, async (req, res) => {
  try {
    const { skillName } = req.params;
    
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { skills: { name: { $regex: new RegExp(`^${skillName}$`, 'i') } } }
    });
    
    res.json({
      success: true,
      message: 'Skill removed successfully'
    });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove skill'
    });
  }
});

export default router;