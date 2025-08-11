import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesService } from '../services/api';
import { IssueMatch } from '../types';
import { Search } from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IssueCard from '../components/issues/IssueCard';

const Issues: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<IssueMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  

  useEffect(() => {
    loadAllIssues();
  }, [page]);

  // Initial load handled by useEffect on page (page starts at 1)

  const loadAllIssues = async () => {
    try {
      setLoading(true);
      console.log('[ISSUES] Loading all issues, page:', page);
      
      const response = await issuesService.getAllIssues(page, 12);
      console.log('[ISSUES] All issues response:', response);
      
      if (response.success && response.issues) {
        const issuesData = response.issues as IssueMatch[];
        console.log('[ISSUES] Issues data:', issuesData);
        console.log('Fetched issues for rendering:', issuesData);
        
        if (page === 1) {
          setIssues(issuesData);
        } else {
          setIssues(prev => [...prev, ...issuesData]);
        }
        
        setHasMore(response.pagination?.hasMore || false);
      } else {
        console.error('[ISSUES] Failed to load all issues:', response);
      }
    } catch (error) {
      console.error('Failed to load all issues:', error);
    } finally {
      setLoading(false);
    }
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
            All Issues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Showing all fetched open source issues.
          </p>
        </div>
        
        {/* Results Summary */}
        {!loading && issues.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              Showing {issues.length} issue(s){hasMore && ' (scroll down to load more)'}
            </p>
          </div>
        )}

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
                {loading ? 'Loading issues...' : 'No issues available'}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {loading 
                  ? 'Please wait while we fetch issues from the database...'
                  : 'There are currently no issues in the database. The issue aggregator may still be running to populate the database.'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Issues;