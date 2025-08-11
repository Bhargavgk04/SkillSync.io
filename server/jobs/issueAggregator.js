import Issue from '../models/Issue.js';
import githubService from '../services/githubService.js';
import aiService from '../services/aiService.js';
import cron from 'node-cron';

/**
 * Issue Aggregation Service
 * Fetches and processes GitHub issues for the platform
 */
class IssueAggregator {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
  }
  
  /**
   * Start the issue aggregation cron job
   */
  async start() {
    console.log('[ISSUE AGGREGATOR] Starting service...');
    
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      if (!this.isRunning) {
        console.log('[ISSUE AGGREGATOR] Starting scheduled aggregation...');
        await this.aggregateIssues();
      }
    });
    
    // Initial run with delay
    console.log('[ISSUE AGGREGATOR] Scheduling initial run...');
    setTimeout(async () => {
      console.log('[ISSUE AGGREGATOR] Executing initial aggregation...');
      await this.aggregateIssues();
    }, 5000);
  }
  
  /**
   * Main aggregation process
   */
  async aggregateIssues() {
    if (this.isRunning) {
      console.log('[AGGREGATOR] Already running, skipping...');
      return;
    }

    this.isRunning = true;
    let retryCount = 3;

    while (retryCount > 0) {
      try {
        console.log('[AGGREGATOR] Starting issue aggregation...');
        
        // 1. Get trending repositories
        const repos = await githubService.getTrendingRepositories();
        console.log(`[AGGREGATOR] Fetched ${repos.length} trending repositories`);

        // 2. Process each repository
        for (const repo of repos) {
          const issues = await githubService.getRepositoryIssues(repo.owner.login, repo.name);
          await this.processIssues(issues);
        }

        // 3. Get good first issues
        const goodFirstIssues = await githubService.searchIssues('is:open is:issue label:"good first issue"');
        await this.processIssues(goodFirstIssues);

        console.log('[AGGREGATOR] Issue aggregation completed successfully');
        break;

      } catch (error) {
        console.error('[AGGREGATOR] Error during aggregation:', error.message);
        retryCount--;
        if (retryCount > 0) {
          console.log(`[AGGREGATOR] Retrying... (${retryCount} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }

    this.isRunning = false;
  }
  
  /**
   * Get trending repositories
   */
  async getTrendingRepositories() {
    const languages = ['javascript', 'python', 'java', 'go', 'rust', 'typescript'];
    const allRepos = [];
    
    for (const language of languages) {
      try {
        const repos = await githubService.getTrendingRepositories(language);
        allRepos.push(...repos);
      } catch (error) {
        console.error(`Error fetching trending ${language} repos:`, error.message);
      }
    }
    
    // Also get general trending repos
    try {
      const generalRepos = await githubService.getTrendingRepositories();
      allRepos.push(...generalRepos);
    } catch (error) {
      console.error('Error fetching general trending repos:', error.message);
    }
    
    // Remove duplicates and return top 50
    const uniqueRepos = allRepos.filter((repo, index, self) => 
      index === self.findIndex(r => r.id === repo.id)
    );
    
    return uniqueRepos.slice(0, 50);
  }
  
  /**
   * Fetch issues from a specific repository
   */
  async fetchRepositoryIssues(owner, repo) {
    try {
      const searchResult = await githubService.searchIssues('', {
        repository: `${owner}/${repo}`,
        state: 'open',
        labels: ['good first issue', 'help wanted', 'beginner'],
        perPage: 20
      });
      
      return searchResult.items || [];
    } catch (error) {
      console.error(`Error fetching issues for ${owner}/${repo}:`, error.message);
      return [];
    }
  }
  
  /**
   * Fetch good first issues globally
   */
  async fetchGoodFirstIssues() {
    try {
      const searchResult = await githubService.searchIssues('', {
        labels: ['good first issue'],
        state: 'open',
        sort: 'updated',
        perPage: 100
      });
      
      return searchResult.items || [];
    } catch (error) {
      console.error('Error fetching good first issues:', error.message);
      return [];
    }
  }
  
  /**
   * Process multiple issues
   */
  async processIssues(issues) {
    try {
      // Check if issues is undefined or null
      if (!issues) {
        console.log('[AGGREGATOR] No issues to process');
        return 0;
      }

      // Ensure issues is an array
      const issuesArray = Array.isArray(issues) ? issues : (issues.items || []);
      console.log(`[AGGREGATOR] Processing ${issuesArray.length} issues...`);

      let processedCount = 0;

      for (const issue of issuesArray) {
        try {
          await this.processAndStoreIssue(issue);
          processedCount++;
          
          // Log progress every 10 issues
          if (processedCount % 10 === 0) {
            console.log(`[AGGREGATOR] Processed ${processedCount}/${issuesArray.length} issues`);
          }
        } catch (error) {
          console.error(`[AGGREGATOR] Error processing issue:`, error);
        }
      }

      console.log(`[AGGREGATOR] Successfully processed ${processedCount} issues`);
      return processedCount;

    } catch (error) {
      console.error('[AGGREGATOR] Error in processIssues:', error);
      return 0;
    }
  }

  /**
   * Process and store a single issue
   */
  async processAndStoreIssue(githubIssue) {
    try {
      // Skip if issue is invalid
      if (!githubIssue || !githubIssue.id) {
        console.log('[AGGREGATOR] Invalid issue data, skipping...');
        return;
      }

      // Skip pull requests
      if (githubIssue.pull_request) {
        return;
      }

      // Check if issue already exists
      const existingIssue = await Issue.findOne({ githubId: githubIssue.id });

      // Extract repository info
      const repoInfo = this.extractRepositoryInfo(githubIssue);

      // Analyze issue content
      const aiAnalysis = await aiService.analyzeIssueContent(githubIssue, repoInfo);

      const issueData = {
        githubId: githubIssue.id,
        title: githubIssue.title,
        body: githubIssue.body || '',
        state: githubIssue.state,
        number: githubIssue.number,
        repository: repoInfo,
        labels: githubIssue.labels?.map(label => ({
          name: label.name,
          color: label.color
        })) || [],
        difficulty: aiAnalysis.difficulty,
        requiredSkills: aiAnalysis.requiredSkills,
        url: githubIssue.url,
        htmlUrl: githubIssue.html_url,
        createdAt: new Date(githubIssue.created_at),
        updatedAt: new Date(githubIssue.updated_at),
        lastActivity: new Date(githubIssue.updated_at),
        isActive: true,
        popularity: this.calculatePopularity(githubIssue, repoInfo)
      };

      if (existingIssue) {
        await Issue.findByIdAndUpdate(existingIssue._id, issueData);
        console.log(`[AGGREGATOR] Updated issue: ${githubIssue.title}`);
      } else {
        await Issue.create(issueData);
        console.log(`[AGGREGATOR] Created new issue: ${githubIssue.title}`);
      }

    } catch (error) {
      console.error('[AGGREGATOR] Error in processAndStoreIssue:', error);
      throw error;
    }
  }

  /**
   * Extract repository information from issue
   */
  extractRepositoryInfo(githubIssue) {
    const repoUrl = githubIssue.repository_url;
    const [owner, repo] = repoUrl.split('/').slice(-2);

    return {
      name: repo,
      fullName: `${owner}/${repo}`,
      owner, // <-- Add this line
      description: githubIssue.repository?.description,
      language: githubIssue.repository?.language,
      stars: githubIssue.repository?.stargazers_count || 0,
      url: repoUrl
    };
  }

  /**
   * Calculate issue popularity score
   */
  calculatePopularity(githubIssue, repoInfo) {
    let score = 0;
    
    // Repository stars weight (40%)
    score += Math.min(repoInfo.stars / 1000, 1) * 0.4;
    
    // Comments weight (30%)
    score += Math.min(githubIssue.comments / 10, 1) * 0.3;
    
    // Reactions weight (20%)
    const reactions = githubIssue.reactions?.total_count || 0;
    score += Math.min(reactions / 5, 1) * 0.2;
    
    // Freshness weight (10%)
    const daysOld = (Date.now() - new Date(githubIssue.created_at).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 1 - (daysOld / 30)) * 0.1;
    
    return score;
  }

  /**
   * Clean up old inactive issues
   */
  async cleanupOldIssues() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Issue.updateMany(
      {
        lastActivity: { $lt: thirtyDaysAgo },
        isActive: true
      },
      {
        $set: { isActive: false }
      }
    );

    console.log(`[AGGREGATOR] Deactivated ${result.modifiedCount} old issues`);
  }
}

// Export a singleton instance
export default new IssueAggregator();