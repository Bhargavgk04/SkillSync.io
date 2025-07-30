import { BaseService } from './base';
import { IssueMatch } from '../../types';

class IssuesService extends BaseService {
  constructor() {
    super('http://localhost:8080');
  }

  async getRecommendations(page: number = 1, limit: number = 6) {
    return this.fetch<{ success: boolean; issues: IssueMatch[] }>(
      `/api/issues/recommendations?page=${page}&limit=${limit}`
    );
  }

  async save(issueId: string) {
    return this.fetch<{ success: boolean }>(`/api/issues/${issueId}/save`, {
      method: 'POST'
    });
  }

  async unsave(issueId: string) {
    return this.fetch<{ success: boolean }>(`/api/issues/${issueId}/save`, {
      method: 'DELETE'
    });
  }

  async markSolved(issueId: string, pullRequestUrl?: string) {
    return this.fetch<{ success: boolean }>(`/api/issues/${issueId}/solved`, {
      method: 'POST',
      body: JSON.stringify({ pullRequestUrl })
    });
  }
}

export const issuesService = new IssuesService();