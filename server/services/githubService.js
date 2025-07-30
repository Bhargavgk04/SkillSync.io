import { Octokit } from '@octokit/rest';
import axios from 'axios';
import dotenv from 'dotenv';

/**
 * GitHub API Service
 * Handles all interactions with GitHub's REST API
 */
class GitHubService {
  constructor() {
    dotenv.config();
    this.apiToken = process.env.GITHUB_API_TOKEN;
    console.log('[GITHUB SERVICE] Initializing with token:', this.apiToken ? 'Present' : 'Missing');
    
    if (!this.apiToken) {
      throw new Error('[GITHUB SERVICE] GitHub API token not configured');
    }

    this.octokit = new Octokit({
      auth: this.apiToken,
      userAgent: 'OS-Match-App',
      baseUrl: 'https://api.github.com',
      previews: ['mercy-preview'],
      timeZone: 'UTC',
      request: {
        timeout: 5000
      }
    });
  }

  /**
   * Get access token from authorization code
   */
  async getAccessToken(code) {
    try {
      console.log('[GITHUB SERVICE] Exchanging code for access token');
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL
      }, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.data.access_token) {
        throw new Error('No access token received from GitHub');
      }

      // Update the service token
      this.apiToken = response.data.access_token;
      
      // Reinitialize Octokit with new token
      this.octokit = new Octokit({
        auth: this.apiToken,
        userAgent: 'OS-Match-App',
        baseUrl: 'https://api.github.com',
        previews: ['mercy-preview']
      });

      console.log('[GITHUB SERVICE] Successfully obtained new access token');
      return response.data;
    } catch (error) {
      console.error('[GITHUB SERVICE] Error getting access token:', error.message);
      throw new Error('Failed to get access token');
    }
  }

  /**
   * Get the currently authenticated user
   */
  async getCurrentUser() {
    try {
      const { data } = await this.octokit.users.getAuthenticated();
      console.log('[GITHUB SERVICE] Authenticated as:', data.login);
      return data;
    } catch (error) {
      console.error('[GITHUB SERVICE] Authentication error:', error.message);
      throw new Error('Failed to get authenticated user');
    }
  }

  /**
   * Get repositories for a specific user
   */
  async getUserRepositories(username, options = {}) {
    try {
      if (!username) {
        throw new Error('Username is required');
      }

      console.log(`[GITHUB SERVICE] Fetching repositories for user: ${username}`);
      await this.handleRateLimit();

      // Get current authenticated user
      const currentUser = await this.getCurrentUser();
      
      // Check if requesting authenticated user's repos
      if (currentUser.login.toLowerCase() === username.toLowerCase()) {
        console.log('[GITHUB SERVICE] Fetching authenticated user repos');
        const response = await this.octokit.repos.listForAuthenticatedUser({
          type: options.type || 'all',
          sort: options.sort || 'updated',
          direction: options.direction || 'desc',
          per_page: options.perPage || 100,
          page: options.page || 1
        });
        return this.processRepositories(response.data, username);
      }

      // Fetch public repositories for other users
      console.log('[GITHUB SERVICE] Fetching public repos for:', username);
      const response = await this.octokit.repos.listForUser({
        username,
        type: 'public',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.perPage || 100,
        page: options.page || 1
      });

      return this.processRepositories(response.data, username);

    } catch (error) {
      if (error.status === 404) {
        console.error(`[GITHUB SERVICE] User not found: ${username}`);
        return [];
      }
      throw error;
    }
  }

  /**
   * Get repository issues
   */
  async getRepositoryIssues(owner, repo, options = {}) {
    try {
      await this.handleRateLimit();
      const response = await this.octokit.issues.listForRepo({
        owner,
        repo,
        state: options.state || 'open',
        labels: options.labels?.join(','),
        sort: 'updated',
        direction: 'desc',
        per_page: options.perPage || 100
      });

      return response.data.filter(issue => !issue.pull_request);
    } catch (error) {
      console.error(`[GITHUB SERVICE] Error fetching issues for ${owner}/${repo}:`, error.message);
      return [];
    }
  }

  /**
   * Search issues across GitHub
   */
  async searchIssues(query, options = {}) {
    try {
      await this.handleRateLimit();
      const response = await this.octokit.search.issuesAndPullRequests({
        q: `${query} is:issue is:open`,
        sort: options.sort || 'updated',
        order: options.order || 'desc',
        per_page: options.perPage || 100,
        page: options.page || 1
      });

      return {
        items: response.data.items.filter(item => !item.pull_request),
        total_count: response.data.total_count
      };
    } catch (error) {
      console.error('[GITHUB SERVICE] Error searching issues:', error.message);
      throw new Error('Failed to search issues');
    }
  }

  /**
   * Get user contributions
   */
  async getUserContributions(username) {
    try {
      const response = await this.octokit.activity.listPublicEventsForUser({
        username,
        per_page: 100
      });

      return response.data;
    } catch (error) {
      console.error(`[GITHUB SERVICE] Error fetching contributions for ${username}:`, error.message);
      return [];
    }
  }

  /**
   * Get trending repositories
   */
  async getTrendingRepositories(options = {}) {
    try {
      const date = new Date();
      date.setDate(date.getDate() - 7); // Last 7 days
      const query = `created:>${date.toISOString().split('T')[0]} stars:>10`;

      const response = await this.octokit.search.repos({
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: options.perPage || 100
      });

      return response.data.items;
    } catch (error) {
      console.error('[GITHUB SERVICE] Error fetching trending repositories:', error.message);
      throw error;
    }
  }

  /**
   * Process repositories to add additional data
   */
  async processRepositories(repos, username) {
    console.log(`[GITHUB SERVICE] Processing ${repos.length} repositories for ${username}`);
    
    const processedRepos = await Promise.all(repos.map(async (repo) => {
      try {
        if (repo.language) {
          const languageData = await this.octokit.repos.listLanguages({
            owner: repo.owner.login,
            repo: repo.name
          });
          repo.languages = languageData.data;
        }
        return repo;
      } catch (error) {
        console.error(`[GITHUB SERVICE] Error processing repo ${repo.full_name}:`, error.message);
        return repo;
      }
    }));

    return processedRepos;
  }

  /**
   * Handle rate limiting
   */
  async handleRateLimit() {
    try {
      const { data } = await this.octokit.rateLimit.get();
      if (data.rate.remaining < 10) {
        const resetTime = new Date(data.rate.reset * 1000);
        const waitTime = resetTime - new Date();
        console.log(`[GITHUB SERVICE] Rate limit low. Waiting ${Math.ceil(waitTime / 1000)} seconds`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      console.error('[GITHUB SERVICE] Error checking rate limit:', error.message);
    }
  }
}

// Export a singleton instance
export default new GitHubService();