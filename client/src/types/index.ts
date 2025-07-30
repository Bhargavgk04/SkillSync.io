export interface User {
  _id: string;
  githubId: string;
  username: string;
  email?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  location?: string;
  blog?: string;
  company?: string;
  githubData: {
    publicRepos: number;
    followers: number;
    following: number;
    createdAt: string;
    updatedAt: string;
  };
  skills: Skill[];
  languages: Language[];
  preferences: UserPreferences;
  savedIssues: string[];
  solvedIssues: SolvedIssue[];
  lastAnalyzed: string;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  confidence: number;
  source: 'repository' | 'contribution' | 'manual';
}

export interface Language {
  name: string;
  percentage: number;
  repoCount: number;
  totalSize: number;
  linesOfCode: number;
}

export interface UserPreferences {
  difficultLevels: DifficultyLevel[];
  languages: string[];
  topics: string[];
  excludeRepositories: string[];
  notificationSettings: {
    email: boolean;
    push: boolean;
    newMatches: boolean;
    weeklyDigest: boolean;
  };
}

export interface SolvedIssue {
  issue: string;
  solvedAt: string;
  pullRequestUrl?: string;
}

export interface Issue {
  _id: string;
  githubId: number;
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  repository: Repository;
  labels: Label[];
  assignee?: string;
  milestone?: string;
  difficulty: DifficultyLevel;
  estimatedHours: number;
  requiredSkills: RequiredSkill[];
  popularity: number;
  lastActivity: string;
  commentCount: number;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string;
  stars: number;
  forks: number;
  language?: string;
  topics: string[];
}

export interface Label {
  name: string;
  color: string;
  description?: string;
}

export interface RequiredSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  importance: number;
}

export interface IssueMatch {
  issue: Issue;
  score: number;
  reasons: string[];
}

export type DifficultyLevel = 'good-first-issue' | 'beginner' | 'intermediate' | 'advanced';

export interface UserStats {
  totalSkills: number;
  topSkills: Skill[];
  totalLanguages: number;
  topLanguages: Language[];
  savedIssuesCount: number;
  solvedIssuesCount: number;
  joinedDate: string;
  lastActive: string;
  lastAnalyzed: string;
  githubStats: {
    publicRepos: number;
    followers: number;
    following: number;
  };
  achievements: Achievement[];
}

export interface Achievement {
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface SearchFilters {
  query?: string;
  language?: string;
  difficulty?: DifficultyLevel;
  labels?: string[];
  page?: number;
  limit?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  issues?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}