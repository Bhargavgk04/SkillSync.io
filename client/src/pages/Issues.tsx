import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesService } from '../services/api';
import { IssueMatch, SearchFilters, DifficultyLevel } from '../types';
import { Search, Filter } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IssueCard from '../components/issues/IssueCard';

const Issues: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadIssues();
  }, [page, filters]);

  // Add a test to check if issues exist
  useEffect(() => {
    const checkIssues = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/issues/count');
        const data = await response.json();
        console.log('[ISSUES] Total issues in database:', data.total);
      } catch (error) {
        console.error('[ISSUES] Failed to check issues count:', error);
      }
    };
    
    checkIssues();
  }, []);

  const loadIssues = async () => {
    try {
      setLoading(true);
      console.log('[ISSUES] Loading issues with filters:', filters, 'query:', searchQuery, 'page:', page);
      
      const searchFilters: SearchFilters = {
        ...filters,
        query: searchQuery,
        page,
        limit: 12
      };

      console.log('[ISSUES] Search filters:', searchFilters);
      const response = await issuesService.search(searchFilters);
      console.log('[ISSUES] Search response:', response);
      
      if (response.success && response.issues) {
        const issuesData = response.issues as IssueMatch[];
        console.log('[ISSUES] Issues data:', issuesData);
        
        if (page === 1) {
          setIssues(issuesData);
        } else {
          setIssues(prev => [...prev, ...issuesData]);
        }
        
        setHasMore(response.pagination?.hasMore || false);
      } else {
        console.error('[ISSUES] Search failed:', response);
      }
    } catch (error) {
      console.error('Failed to load issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadIssues();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (key === 'labels') {
        // Handle labels as array
        if (value.trim()) {
          newFilters.labels = value.split(',').map(label => label.trim()).filter(label => label.length > 0);
        } else {
          delete newFilters.labels;
        }
      } else if (key === 'difficulty') {
        // Handle difficulty as DifficultyLevel
        newFilters.difficulty = (value as DifficultyLevel) || undefined;
      } else {
        // Handle other string filters
        if (key === 'language' || key === 'query') {
          newFilters[key] = value || undefined;
        }
      }
      
      return newFilters;
    });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
  };

  const loadMore = () => {
    setPage(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Browse Issues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find open source issues that match your skills and interests
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search issues by title, description, or repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>

              {Object.keys(filters).length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Language
                  </label>
                  <select
                    value={filters.language || ''}
                    onChange={(e) => handleFilterChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All languages</option>
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="java">Java</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={filters.difficulty || ''}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">All difficulties</option>
                    <option value="good-first-issue">Good First Issue</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Labels
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., bug, feature, documentation"
                    value={filters.labels?.join(', ') || ''}
                    onChange={(e) => handleFilterChange('labels', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Search Issues
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="space-y-6">
          {loading && page === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : issues.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {issues.map((match) => (
                  <IssueCard
                    key={match.issue._id}
                    issue={match.issue}
                    matchScore={match.score}
                    reasons={match.reasons}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {loading ? 'Loading issues...' : 'No issues found'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {loading 
                  ? 'Please wait while we fetch issues from the database...'
                  : 'Try adjusting your search criteria or filters to find more issues. If you continue to see no results, the issue aggregator may still be running to populate the database.'
                }
              </p>
              {!loading && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Issues;