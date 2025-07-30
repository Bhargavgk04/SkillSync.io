import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Issue from '../models/Issue.js';
import User from '../models/User.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import githubService from '../services/githubService.js';
import aiService from '../services/aiService.js';

const router = express.Router();

/**
 * Get personalized issue recommendations
 */
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 6 } = req.query;
    const skip = (page - 1) * limit;

    // Ensure user has skills
    if (!req.user.skills || req.user.skills.length === 0) {
      console.log('[RECOMMENDATIONS] No skills found, triggering skill analysis');
      const { default: githubService } = await import('../services/githubService.js');
      const repos = await githubService.getUserRepositories(req.user.username);
      const contributions = await githubService.getUserContributions(req.user.username);
      const { skills, languages } = await aiService.extractUserSkills(req.user, repos, contributions);
      
      // Update user with new skills
      await User.findByIdAndUpdate(req.user._id, { skills, languages });
      req.user.skills = skills;
      req.user.languages = languages;
    }

    // Get active issues
    let issues = await Issue.find({
      state: 'open',
      isActive: true,
      $or: [
        { 'repository.language': { $in: req.user.languages?.map(l => l.name) || [] } },
        { requiredSkills: { $in: req.user.skills?.map(s => s.name.toLowerCase()) || [] } }
      ]
    })
    .sort({ popularity: -1, lastActivity: -1 })
    .limit(1000);

    if (issues.length === 0) {
      console.log('[RECOMMENDATIONS] No matching issues found, triggering aggregation');
      const { default: issueAggregator } = await import('../jobs/issueAggregator.js');
      await issueAggregator.aggregateIssues();

      // Try fetching issues again
      issues = await Issue.find({
        state: 'open',
        isActive: true
      })
      .sort({ popularity: -1, lastActivity: -1 })
      .limit(1000);
    }

    // Match and score issues
    const matches = issues
      .map(issue => ({
        issue,
        score: aiService.calculateMatchScore(req.user, issue),
        reasons: aiService.getMatchReasons(req.user, issue)
      }))
      .filter(match => match.score > 0.2)
      .sort((a, b) => b.score - a.score);

    // Apply pagination
    const paginatedMatches = matches.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      issues: paginatedMatches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: matches.length,
        hasMore: skip + parseInt(limit) < matches.length
      }
    });

  } catch (error) {
    console.error('[RECOMMENDATIONS] Error:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
});

/**
 * Get total issues count (for debugging)
 */
router.get('/count', async (req, res) => {
  try {
    const total = await Issue.countDocuments({ state: 'open', isActive: true });
    res.json({
      success: true,
      total
    });
  } catch (error) {
    console.error('Count issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to count issues'
    });
  }
});

/**
 * Search issues with filters
 */
router.get('/search', [
  optionalAuth,
  query('q').optional().isString().trim(),
  query('language').optional().isString(),
  query('difficulty').optional().isIn(['good-first-issue', 'beginner', 'intermediate', 'advanced']),
  query('labels').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid search parameters',
        errors: errors.array()
      });
    }
    
    const {
      q = '',
      language,
      difficulty,
      labels,
      page = 1,
      limit = 20
    } = req.query;
    
    console.log('[SEARCH] Search request:', { q, language, difficulty, labels, page, limit });
    
    // Build search query
    const searchQuery = { state: 'open', isActive: true };
    
    if (language) {
      searchQuery['repository.language'] = new RegExp(language, 'i');
    }
    
    if (difficulty) {
      searchQuery.difficulty = difficulty;
    }
    
    if (labels) {
      const labelArray = labels.split(',').map(l => l.trim());
      searchQuery['labels.name'] = { $in: labelArray };
    }
    
    // Text search
    if (q) {
      // Use regex search as it's more reliable
      searchQuery.$or = [
        { title: { $regex: q, $options: 'i' } },
        { body: { $regex: q, $options: 'i' } },
        { 'repository.name': { $regex: q, $options: 'i' } }
      ];
    }
    
    console.log('[SEARCH] Final search query:', JSON.stringify(searchQuery, null, 2));
    
    // Execute search
    const skip = (page - 1) * limit;
    const [issues, total] = await Promise.all([
      Issue.find(searchQuery)
        .sort({ lastActivity: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Issue.countDocuments(searchQuery)
    ]);
    
    console.log('[SEARCH] Found issues:', issues.length, 'Total:', total);
    
    // If user is authenticated, calculate match scores
    let results = issues;
    if (req.user) {
      results = issues.map(issue => ({
        issue,
        score: aiService.calculateAdvancedMatchScore(req.user, issue),
        reasons: aiService.getMatchReasons(req.user, issue)
      }));
    }
    
    res.json({
      success: true,
      issues: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        hasMore: skip + parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error('Search issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search issues'
    });
  }
});

/**
 * Get issue details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    let result = { issue };
    
    // Add match score if user is authenticated
    if (req.user) {
      result.score = aiService.calculateAdvancedMatchScore(req.user, issue);
      result.reasons = aiService.getMatchReasons(req.user, issue);
    }
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get issue'
    });
  }
});

/**
 * Save/bookmark an issue
 */
router.post('/:id/save', authenticate, async (req, res) => {
  try {
    const issueId = req.params.id;
    const issue = await Issue.findById(issueId);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Check if already saved
    if (req.user.savedIssues.includes(issueId)) {
      return res.status(400).json({
        success: false,
        message: 'Issue already saved'
      });
    }
    
    // Add to saved issues
    await User.findByIdAndUpdate(req.user._id, {
      $push: { savedIssues: issueId }
    });
    
    res.json({
      success: true,
      message: 'Issue saved successfully'
    });
  } catch (error) {
    console.error('Save issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save issue'
    });
  }
});

/**
 * Remove saved issue
 */
router.delete('/:id/save', authenticate, async (req, res) => {
  try {
    const issueId = req.params.id;
    
    // Remove from saved issues
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { savedIssues: issueId }
    });
    
    res.json({
      success: true,
      message: 'Issue removed from saved'
    });
  } catch (error) {
    console.error('Remove saved issue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove saved issue'
    });
  }
});

/**
 * Mark issue as solved
 */
router.post('/:id/solved', [
  authenticate,
  body('pullRequestUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: errors.array()
      });
    }
    
    const issueId = req.params.id;
    const { pullRequestUrl } = req.body;
    
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Check if already marked as solved
    const alreadySolved = req.user.solvedIssues.some(
      solved => solved.issue.toString() === issueId
    );
    
    if (alreadySolved) {
      return res.status(400).json({
        success: false,
        message: 'Issue already marked as solved'
      });
    }
    
    // Add to solved issues
    await User.findByIdAndUpdate(req.user._id, {
      $push: {
        solvedIssues: {
          issue: issueId,
          solvedAt: new Date(),
          pullRequestUrl
        }
      }
    });
    
    res.json({
      success: true,
      message: 'Issue marked as solved'
    });
  } catch (error) {
    console.error('Mark solved error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark issue as solved'
    });
  }
});

/**
 * Get user's saved issues
 */
router.get('/user/saved', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'savedIssues',
        options: {
          skip,
          limit: parseInt(limit),
          sort: { createdAt: -1 }
        }
      });
    
    res.json({
      success: true,
      issues: user.savedIssues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.savedIssues.length
      }
    });
  } catch (error) {
    console.error('Get saved issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved issues'
    });
  }
});

/**
 * Get user's solved issues
 */
router.get('/user/solved', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(req.user._id)
      .populate({
        path: 'solvedIssues.issue',
        options: {
          skip,
          limit: parseInt(limit),
          sort: { 'solvedIssues.solvedAt': -1 }
        }
      });
    
    res.json({
      success: true,
      issues: user.solvedIssues,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.solvedIssues.length
      }
    });
  } catch (error) {
    console.error('Get solved issues error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get solved issues'
    });
  }
});

export default router;