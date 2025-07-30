/**
 * AI Service for Skill Extraction and Issue Matching
 * Implements machine learning algorithms for intelligent matching
 */
class AIService {
  
  /**
   * Extract skills from user's GitHub profile and repositories
   */
  async extractUserSkills(user, repositories, contributions) {
    try {
      console.log(`[AI SERVICE] Extracting skills for user: ${user.username}`);
      console.log(`[AI SERVICE] Found ${repositories.length} repositories`);

      const skills = new Map();
      const languages = new Map();

      // Handle empty repositories
      if (!repositories || repositories.length === 0) {
        console.log('[AI SERVICE] No repositories found, using profile information');
        // Extract skills from user bio and profile
        if (user.bio) {
          const bioSkills = this.extractFrameworksFromText(user.bio);
          bioSkills.forEach(skill => 
            this.addSkill(skills, skill, 'beginner', 0.6, 'profile')
          );
        }
      }

      // Process repositories
      for (const repo of repositories) {
        if (!repo) continue;

        // Process language
        if (repo.language) {
          const lang = repo.language.toLowerCase();
          const currentLang = languages.get(lang) || { 
            name: repo.language, 
            repoCount: 0, 
            totalSize: 0,
            linesOfCode: 0
          };
          
          currentLang.repoCount++;
          currentLang.totalSize += repo.size || 0;
          languages.set(lang, currentLang);
          
          this.addSkill(skills, repo.language, 
            this.calculateLanguageLevel(currentLang), 0.8, 'repository');
        }

        // Process topics and description
        if (repo.topics && Array.isArray(repo.topics)) {
          repo.topics.forEach(topic => 
            this.addSkill(skills, topic, 'intermediate', 0.6, 'repository')
          );
        }

        // Extract from name and description
        const text = `${repo.name} ${repo.description || ''}`;
        const frameworks = this.extractFrameworksFromText(text);
        frameworks.forEach(framework => 
          this.addSkill(skills, framework, 'intermediate', 0.7, 'repository')
        );
      }

      // Process contributions if available
      if (contributions && contributions.length > 0) {
        const contributionSkills = this.analyzeContributions(contributions);
        for (const [skillName, skillData] of contributionSkills) {
          this.addSkill(skills, skillName, skillData.level, skillData.confidence, 'contribution');
        }
      }

      // Ensure we have at least some basic skills
      if (skills.size === 0) {
        console.log('[AI SERVICE] No skills detected, adding default skills');
        this.addDefaultSkills(skills);
      }

      // Calculate final skills and languages
      const finalSkills = Array.from(skills.values()).map(skill => ({
        ...skill,
        level: this.normalizeSkillLevel(skill),
        confidence: Math.min(skill.confidence, 1.0)
      }));

      const totalLanguageSize = Array.from(languages.values())
        .reduce((sum, lang) => sum + lang.totalSize, 0);

      const finalLanguages = Array.from(languages.values()).map(lang => ({
        ...lang,
        percentage: totalLanguageSize > 0 ? (lang.totalSize / totalLanguageSize) * 100 : 0
      }));

      console.log(`[AI SERVICE] Extracted ${finalSkills.length} skills and ${finalLanguages.length} languages`);
      return { skills: finalSkills, languages: finalLanguages };

    } catch (error) {
      console.error('[AI SERVICE] Error extracting skills:', error);
      // Return default skills if extraction fails
      return this.getDefaultSkillset();
    }
  }

  /**
   * Add default skills when none are detected
   */
  addDefaultSkills(skillsMap) {
    const defaults = [
      { name: 'javascript', level: 'beginner', confidence: 0.5 },
      { name: 'html', level: 'beginner', confidence: 0.5 },
      { name: 'css', level: 'beginner', confidence: 0.5 },
      { name: 'git', level: 'beginner', confidence: 0.5 }
    ];

    defaults.forEach(skill => 
      this.addSkill(skillsMap, skill.name, skill.level, skill.confidence, 'default')
    );
  }

  /**
   * Get default skillset for new users
   */
  getDefaultSkillset() {
    return {
      skills: [
        { name: 'javascript', level: 'beginner', confidence: 0.5, source: 'default' },
        { name: 'html', level: 'beginner', confidence: 0.5, source: 'default' },
        { name: 'css', level: 'beginner', confidence: 0.5, source: 'default' },
        { name: 'git', level: 'beginner', confidence: 0.5, source: 'default' }
      ],
      languages: [
        { name: 'JavaScript', percentage: 40, linesOfCode: 0 },
        { name: 'HTML', percentage: 30, linesOfCode: 0 },
        { name: 'CSS', percentage: 30, linesOfCode: 0 }
      ]
    };
  }

  /**
   * Add skill to skills map with confidence weighting
   */
  addSkill(skillsMap, name, level, confidence, source) {
    const normalizedName = this.normalizeSkillName(name);
    if (!normalizedName) return;
    
    const existing = skillsMap.get(normalizedName);
    if (existing) {
      // Weighted average of confidence scores
      const totalWeight = existing.confidence + confidence;
      existing.confidence = totalWeight / 2;
      
      // Take higher skill level
      const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
      if (levels.indexOf(level) > levels.indexOf(existing.level)) {
        existing.level = level;
      }
    } else {
      skillsMap.set(normalizedName, {
        name: normalizedName,
        level,
        confidence,
        source
      });
    }
  }
  
  /**
   * Calculate skill level based on language usage
   */
  calculateLanguageLevel(languageData) {
    const { repoCount, totalSize } = languageData;
    
    if (repoCount >= 10 && totalSize > 10000) return 'expert';
    if (repoCount >= 5 && totalSize > 5000) return 'advanced';
    if (repoCount >= 3 && totalSize > 1000) return 'intermediate';
    return 'beginner';
  }
  
  /**
   * Extract frameworks and technologies from text
   */
  extractFrameworksFromText(text) {
    const frameworks = [
      'react', 'vue', 'angular', 'svelte', 'nodejs', 'express', 'fastapi',
      'django', 'flask', 'rails', 'spring', 'laravel', 'symfony',
      'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
      'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'mongodb',
      'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql',
      'nextjs', 'nuxtjs', 'gatsby', 'webpack', 'vite', 'tailwindcss',
      'typescript', 'javascript', 'java', 'csharp', 'c++', 'go', 'rust',
      'php', 'ruby', 'swift', 'objective-c', 'scala', 'haskell', 'matlab',
      'jupyter', 'notebook', 'firebase', 'supabase', 'rabbitmq', 'celery',
      'airflow', 'spark', 'hadoop', 'bigquery', 'redshift', 'snowflake',
      'heroku', 'vercel', 'netlify', 'digitalocean', 'linode', 'openai',
      'huggingface', 'langchain', 'llama', 'transformers', 'grpc', 'protobuf',
      'eslint', 'prettier', 'storybook', 'jest', 'mocha', 'chai', 'cypress',
      'playwright', 'puppeteer', 'selenium', 'circleci', 'github actions',
      'travis', 'jenkins', 'ansible', 'terraform', 'pulumi', 'prometheus',
      'grafana', 'sentry', 'datadog', 'newrelic', 'rollbar', 'logrocket'
    ];
    
    const found = [];
    const lowerText = text.toLowerCase();
    
    for (const framework of frameworks) {
      if (lowerText.includes(framework)) {
        found.push(framework);
      }
    }
    
    return found;
  }
  
  /**
   * Analyze user contributions for skill extraction
   */
  analyzeContributions(contributions) {
    const skills = new Map();
    
    for (const event of contributions) {
      // Analyze commit messages and PR descriptions
      if (event.type === 'PushEvent' && event.payload.commits) {
        for (const commit of event.payload.commits) {
          const extractedSkills = this.extractSkillsFromCommitMessage(commit.message);
          for (const skill of extractedSkills) {
            this.addSkill(skills, skill, 'intermediate', 0.5, 'contribution');
          }
        }
      }
      
      // Analyze repository languages from events
      if (event.repo && event.repo.name) {
        // This would typically make another API call, but for demo purposes
        // we'll infer from repository names
        const inferredSkills = this.inferSkillsFromRepoName(event.repo.name);
        for (const skill of inferredSkills) {
          this.addSkill(skills, skill, 'beginner', 0.4, 'contribution');
        }
      }
    }
    
    return skills;
  }
  
  /**
   * Extract skills from commit messages
   */
  extractSkillsFromCommitMessage(message) {
    const skills = [];
    const lowerMessage = message.toLowerCase();
    
    // Look for technology mentions in commit messages
    const techKeywords = [
      'api', 'database', 'frontend', 'backend', 'ui', 'testing',
      'deployment', 'security', 'performance', 'bug', 'feature'
    ];
    
    for (const keyword of techKeywords) {
      if (lowerMessage.includes(keyword)) {
        skills.push(keyword);
      }
    }
    
    return skills;
  }
  
  /**
   * Infer skills from repository names
   */
  inferSkillsFromRepoName(repoName) {
    const skills = [];
    const lowerName = repoName.toLowerCase();
    
    const patterns = {
      'web': ['html', 'css', 'javascript'],
      'api': ['backend', 'api'],
      'mobile': ['mobile development'],
      'data': ['data analysis', 'python'],
      'ml': ['machine learning', 'python'],
      'bot': ['automation', 'scripting']
    };
    
    for (const [pattern, relatedSkills] of Object.entries(patterns)) {
      if (lowerName.includes(pattern)) {
        skills.push(...relatedSkills);
      }
    }
    
    return skills;
  }
  
  /**
   * Normalize skill names for consistency
   */
  normalizeSkillName(name) {
    if (!name || typeof name !== 'string') return null;
    
    let normalized = name.toLowerCase().trim();
    // Remove common punctuation and whitespace
    normalized = normalized.replace(/[^a-z0-9\+\-\.]/g, '');
    // Skill aliases mapping
    const aliases = {
      'js': 'javascript',
      'ts': 'typescript',
      'py': 'python',
      'nodejs': 'node.js',
      'reactjs': 'react',
      'vuejs': 'vue',
      'angularjs': 'angular',
      'csharp': 'c#',
      'cpp': 'c++',
      'py3': 'python',
      'jupyternotebook': 'jupyter',
      'postgres': 'postgresql',
      'mongo': 'mongodb',
      'tf': 'tensorflow',
      'pt': 'pytorch',
      'ghactions': 'github actions',
      'ci': 'continuous integration',
      'cd': 'continuous deployment'
    };
    return aliases[normalized] || normalized;
  }
  
  /**
   * Normalize skill level based on confidence and other factors
   */
  normalizeSkillLevel(skill) {
    const { confidence, level } = skill;
    const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
    let idx = levels.indexOf(level);
    if (confidence < 0.3) idx = 0;
    else if (confidence < 0.6) idx = Math.min(1, idx);
    else if (confidence > 0.9) idx = Math.max(idx, 2);
    return levels[idx] || 'beginner';
  }
  
  /**
   * Find matching issues for user based on skills
   */
  async findMatchingIssues(user, issues, limit = 20) {
    try {
      if (!user.skills || user.skills.length === 0) {
        throw new Error('No skills found for user');
      }

      // 1. Create skill map for faster lookup
      const userSkills = new Map(
        user.skills.map(skill => [skill.name.toLowerCase(), skill])
      );

      // 2. Match and score issues
      const matchedIssues = issues.map(issue => {
        const score = this.calculateMatchScore(user, issue);
        const reasons = this.getMatchReasons(user, issue);
        
        return {
          issue,
          score,
          reasons
        };
      });

      // 3. Filter out low-scoring matches
      const validMatches = matchedIssues.filter(match => match.score > 0.2);

      // 4. Sort by score and limit results
      const sortedMatches = validMatches.sort((a, b) => b.score - a.score);
      
      return sortedMatches.slice(0, limit);
    } catch (error) {
      console.error('Error finding matching issues:', error);
      return [];
    }
  }

  /**
   * Calculate match score between user and issue
   */
  calculateMatchScore(user, issue) {
    let totalScore = 0;
    let maxScore = 0;

    // 1. Check language match (40% weight)
    if (issue.repository?.language) {
      const languageScore = this.calculateLanguageMatchScore(
        user.languages,
        issue.repository.language
      );
      totalScore += languageScore * 0.4;
      maxScore += 0.4;
    }

    // 2. Check skill match (30% weight)
    if (issue.requiredSkills?.length > 0) {
      const skillScore = this.calculateSkillMatchScore(
        user.skills,
        issue.requiredSkills
      );
      totalScore += skillScore * 0.3;
      maxScore += 0.3;
    }

    // 3. Check difficulty match (20% weight)
    if (issue.difficulty) {
      const difficultyScore = this.calculateDifficultyMatchScore(
        user.preferences?.difficultLevels || [],
        issue.difficulty
      );
      totalScore += difficultyScore * 0.2;
      maxScore += 0.2;
    }

    // 4. Add freshness bonus (10% weight)
    const freshnessScore = this.calculateFreshnessScore(issue.createdAt);
    totalScore += freshnessScore * 0.1;
    maxScore += 0.1;

    return maxScore > 0 ? totalScore / maxScore : 0;
  }

  /**
   * Calculate language match score
   */
  calculateLanguageMatchScore(userLanguages, issueLanguage) {
    if (!userLanguages || !issueLanguage) return 0;

    const matchingLang = userLanguages.find(
      lang => lang.name.toLowerCase() === issueLanguage.toLowerCase()
    );

    if (!matchingLang) return 0;
    return Math.min(matchingLang.percentage / 100, 1);
  }

  /**
   * Calculate skill match score
   */
  calculateSkillMatchScore(userSkills, requiredSkills) {
    if (!userSkills || !requiredSkills) return 0;

    const userSkillMap = new Map(
      userSkills.map(skill => [skill.name.toLowerCase(), skill])
    );

    let matchCount = 0;
    for (const required of requiredSkills) {
      const userSkill = userSkillMap.get(required.toLowerCase());
      if (userSkill) matchCount++;
    }

    return requiredSkills.length > 0 ? matchCount / requiredSkills.length : 0;
  }

  /**
   * Calculate difficulty match score
   */
  calculateDifficultyMatchScore(userLevels, issueDifficulty) {
    if (!userLevels || !issueDifficulty) return 0;
    return userLevels.includes(issueDifficulty) ? 1 : 0;
  }

  /**
   * Calculate freshness score based on issue age
   */
  calculateFreshnessScore(createdAt) {
    if (!createdAt) return 0;
    
    const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (ageInDays / 30)); // Linear decay over 30 days
  }

  /**
   * Get reasons for match
   */
  getMatchReasons(user, issue) {
    const reasons = [];

    // Check language match
    if (issue.repository?.language) {
      const langMatch = user.languages?.find(
        l => l.name.toLowerCase() === issue.repository.language.toLowerCase()
      );
      if (langMatch) {
        reasons.push(`Matches your ${langMatch.name} experience`);
      }
    }

    // Check skill matches
    if (issue.requiredSkills) {
      const matchedSkills = issue.requiredSkills.filter(required =>
        user.skills?.some(skill => 
          skill.name.toLowerCase() === required.toLowerCase()
        )
      );
      if (matchedSkills.length > 0) {
        reasons.push(`Matches your skills: ${matchedSkills.join(', ')}`);
      }
    }

    // Check difficulty preference
    if (issue.difficulty && user.preferences?.difficultLevels?.includes(issue.difficulty)) {
      reasons.push(`Matches your preferred difficulty level`);
    }

    return reasons;
  }

  /**
   * Analyze issue content to determine difficulty and required skills
   */
  async analyzeIssueContent(issue, repoInfo) {
    try {
      // Extract text content
      const textContent = `${issue.title} ${issue.body || ''}`;
      const labels = issue.labels.map(l => l.name.toLowerCase());

      // Determine difficulty
      const difficulty = this.determineDifficulty(textContent, labels);

      // Extract required skills
      const requiredSkills = this.extractRequiredSkills(textContent, labels, repoInfo.language);

      // Estimate hours
      const estimatedHours = this.estimateHours(difficulty, textContent, labels);

      return {
        difficulty,
        requiredSkills,
        estimatedHours
      };
    } catch (error) {
      console.error('[AI SERVICE] Error analyzing issue:', error);
      return {
        difficulty: 'intermediate',
        requiredSkills: [],
        estimatedHours: 4
      };
    }
  }

  determineDifficulty(text, labels) {
    // Check labels first
    if (labels.includes('good first issue') || labels.includes('good-first-issue')) {
      return 'beginner';
    }
    
    if (labels.includes('help wanted')) {
      return 'intermediate';
    }

    // Check text content
    const lowercaseText = text.toLowerCase();
    if (lowercaseText.includes('easy') || lowercaseText.includes('simple') || lowercaseText.includes('beginner')) {
      return 'beginner';
    }
    
    if (lowercaseText.includes('advanced') || lowercaseText.includes('complex')) {
      return 'advanced';
    }

    return 'intermediate';
  }

  /**
   * Extract required skills from issue content and labels
   */
  extractRequiredSkills(text, labels, repoLanguage) {
    const skills = new Set();

    // Extract from text using keyword matching
    const keywordPatterns = [
      { pattern: /react|vue|angular|svelte/i, skill: 'frontend' },
      { pattern: /node|express|django|flask/i, skill: 'backend' },
      { pattern: /mongodb|mysql|postgresql|sqlite/i, skill: 'database' },
      { pattern: /tensorflow|pytorch|scikit-learn|keras/i, skill: 'machine learning' },
      { pattern: /docker|kubernetes|aws|azure|gcp/i, skill: 'cloud' },
      { pattern: /git|github|gitlab/i, skill: 'version control' },
      { pattern: /scrum|kanban|agile/i, skill: 'project management' },
      { pattern: /photoshop|illustrator|figma/i, skill: 'design' },
      { pattern: /excel|csv|data analysis/i, skill: 'data analysis' }
    ];

    for (const { pattern, skill } of keywordPatterns) {
      if (pattern.test(text)) {
        skills.add(skill);
      }
    }

    // Extract from labels
    for (const label of labels) {
      const normalizedLabel = this.normalizeSkillName(label.name);
      if (normalizedLabel) {
        skills.add(normalizedLabel);
      }
    }

    // Infer language-specific skills
    if (repoLanguage) {
      const langSkill = this.normalizeSkillName(repoLanguage);
      if (langSkill) {
        skills.add(langSkill);
      }
    }

    return Array.from(skills);
  }

  /**
   * Estimate completion hours for an issue based on difficulty and content
   */
  estimateHours(difficulty, text, labels) {
    let baseHours = 4;

    // Adjust based on difficulty level
    if (difficulty === 'beginner') {
      baseHours = 2;
    } else if (difficulty === 'advanced') {
      baseHours = 6;
    } else if (difficulty === 'expert') {
      baseHours = 8;
    }

    // Further adjust based on content analysis (e.g., complexity, length)
    const textLength = text.split(' ').length;
    if (textLength > 300) {
      baseHours += 2; // Longer texts may require more time
    } else if (textLength < 50) {
      baseHours -= 1; // Very short texts may require less time
    }

    // Cap minimum and maximum hours
    return Math.max(1, Math.min(baseHours, 24));
  }
}

export default new AIService();