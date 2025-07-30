import { User, Issue, IssueMatch, UserStats, SearchFilters, PaginatedResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    // Add detailed logging
    console.log('[API REQUEST]', { url, config });

    try {
      const response = await fetch(url, config);
      console.log('[API RESPONSE]', { url, status: response.status });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Network error' }));
        console.error('[API ERROR RESPONSE]', { url, status: response.status, data: errorData });
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`[API request failed for ${endpoint}]`, { url, config, error });
      throw error;
    }
  }

  // Auth endpoints
  auth = {
    getCurrentUser: (): Promise<{ success: boolean; user: User }> =>
      this.request('/auth/me'),

    logout: (): Promise<{ success: boolean }> =>
      this.request('/auth/logout', { method: 'POST' }),

    refreshSkills: (): Promise<{ success: boolean; user: User }> =>
      this.request('/auth/refresh-skills', { method: 'POST' }),
  };

  // Issue endpoints
  issues = {
    getRecommendations: (page = 1, limit = 20): Promise<PaginatedResponse<IssueMatch>> =>
      this.request(`/issues/recommendations?page=${page}&limit=${limit}`),

    search: (filters: SearchFilters): Promise<PaginatedResponse<IssueMatch | Issue>> => {
      console.log('[API] Searching issues with filters:', filters);
      const params = new URLSearchParams();
      
      if (filters.query) params.append('q', filters.query);
      if (filters.language) params.append('language', filters.language);
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.labels && Array.isArray(filters.labels) && filters.labels.length > 0) {
        params.append('labels', filters.labels.join(','));
      }
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());

      const url = `/issues/search?${params.toString()}`;
      console.log('[API] Search URL:', url);
      return this.request(url);
    },

    getById: (id: string): Promise<{ success: boolean; issue: Issue; score?: number; reasons?: string[] }> =>
      this.request(`/issues/${id}`),

    save: (id: string): Promise<{ success: boolean }> =>
      this.request(`/issues/${id}/save`, { method: 'POST' }),

    unsave: (id: string): Promise<{ success: boolean }> =>
      this.request(`/issues/${id}/save`, { method: 'DELETE' }),

    markSolved: (id: string, pullRequestUrl?: string): Promise<{ success: boolean }> =>
      this.request(`/issues/${id}/solved`, {
        method: 'POST',
        body: JSON.stringify({ pullRequestUrl }),
      }),

    getSaved: (page = 1, limit = 20): Promise<PaginatedResponse<Issue>> =>
      this.request(`/issues/user/saved?page=${page}&limit=${limit}`),

    getSolved: (page = 1, limit = 20): Promise<PaginatedResponse<Issue>> =>
      this.request(`/issues/user/solved?page=${page}&limit=${limit}`),
  };

  // User endpoints
  user = {
    getStats: (): Promise<{ success: boolean; stats: UserStats }> =>
      this.request('/user/stats'),

    updatePreferences: (preferences: Partial<User['preferences']>): Promise<{ success: boolean; user: User }> =>
      this.request('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(preferences),
      }),

    addSkill: (name: string, level: string): Promise<{ success: boolean; skills: unknown[] }> => {
      console.log('[API] Adding skill:', { name, level });
      return this.request('/user/skills', {
        method: 'POST',
        body: JSON.stringify({ name, level }),
      });
    },

    removeSkill: (skillName: string): Promise<{ success: boolean }> =>
      this.request(`/user/skills/${encodeURIComponent(skillName)}`, {
        method: 'DELETE',
      }),
  };
}

export const apiService = new ApiService();
export const authService = apiService.auth;
export const issuesService = apiService.issues;
export const userService = apiService.user;