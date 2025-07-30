import express from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import githubService from '../services/githubService.js';
import aiService from '../services/aiService.js';

const router = express.Router();

/**
 * GitHub OAuth login - Redirect to GitHub
 */
router.get('/github', (req, res) => {
  const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_CALLBACK_URL}&scope=user:email,public_repo`;
  res.redirect(githubAuthURL);
});

/**
 * GitHub OAuth callback - Handle authorization code
 */
router.get('/github/callback', async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      throw new Error('No code received from GitHub');
    }

    // Get access token from GitHub
    const { access_token } = await githubService.getAccessToken(code);
    if (!access_token) {
      throw new Error('Failed to get access token');
    }

    // Get user data from GitHub
    const githubUser = await githubService.getCurrentUser();
    console.log('[AUTH] GitHub user data received:', githubUser.login);

    // Find or create user in database
    let user = await User.findOne({ githubId: githubUser.id });
    
    if (!user) {
      user = await User.create({
        githubId: githubUser.id,
        username: githubUser.login,
        name: githubUser.name || githubUser.login,
        email: githubUser.email,
        avatarUrl: githubUser.avatar_url,
        githubToken: access_token,
        skills: [],
        languages: [],
        preferences: {
          difficultLevels: [],
          languages: [],
          topics: [],
          excludeRepositories: [],
          notificationSettings: {
            email: true,
            push: true,
            newMatches: true,
            weeklyDigest: true
          }
        }
      });
    } else {
      // Update existing user
      user.githubToken = access_token;
      user.name = githubUser.name || user.name;
      user.email = githubUser.email || user.email;
      user.avatarUrl = githubUser.avatar_url || user.avatarUrl;
      // Ensure preferences exists
      if (!user.preferences) {
        user.preferences = {
          difficultLevels: [],
          languages: [],
          topics: [],
          excludeRepositories: [],
          notificationSettings: {
            email: true,
            push: true,
            newMatches: true,
            weeklyDigest: true
          }
        };
      }
      await user.save();
    }

    // Create JWT session token with more data
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        githubId: user.githubId,
        avatarUrl: user.avatarUrl
      }, 
      process.env.JWT_SECRET,
      { 
        expiresIn: '7d' // Increase token expiry
      }
    );

    // Set token in cookie as well as URL
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect with token in URL and state
    const redirectUrl = new URL(`${process.env.CLIENT_URL}/auth/callback`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('state', 'success');
    
    console.log('[AUTH] Redirecting to:', redirectUrl.toString());
    res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('[AUTH] GitHub callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Get current user profile
 */
router.get('/me', authenticate, async (req, res) => {
  try {
    // Always fetch latest user with preferences
    const user = await User.findById(req.user._id).select('-accessToken -refreshToken');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile'
    });
  }
});

/**
 * Logout user
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Background function to analyze user skills
 */
async function analyzeUserSkills(user) {
  try {
    console.log(`[AUTH] Starting skill analysis for user: ${user.username}`);

    // Get user repositories
    const repositories = await githubService.getUserRepositories(user.username, {
      type: 'all',
      sort: 'updated'
    });

    // Get user contributions
    const contributions = await githubService.getUserContributions(user.username);

    // Extract skills and languages
    const { skills, languages } = await aiService.extractUserSkills(
      user, 
      repositories, 
      contributions
    );

    console.log(`[AUTH] Updating user ${user.username} with:`, {
      skillCount: skills.length,
      languageCount: languages.length
    });

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          skills: skills,
          languages: languages,
          lastAnalyzed: new Date()
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user with skills');
    }

    console.log(`[AUTH] Successfully updated skills for ${user.username}`);
    return updatedUser;

  } catch (error) {
    console.error('[AUTH] Error analyzing user skills:', error);
    throw error;
  }
}

router.post('/refresh-skills', authenticate, async (req, res) => {
  try {
    console.log('[REFRESH SKILLS] Starting skill refresh for:', req.user.username);
    
    const updatedUser = await analyzeUserSkills(req.user);
    
    console.log('[REFRESH SKILLS] Skill analysis completed for:', req.user.username);
    res.json({ success: true, user: updatedUser });

  } catch (error) {
    console.error('[REFRESH SKILLS] Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to refresh skills' 
    });
  }
});

export default router;