import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesService } from '../services/api';
import { Issue } from '../types';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IssueCard from '../components/issues/IssueCard';
import { BookmarkIcon } from 'lucide-react';

const Saved: React.FC = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadSaved = async () => {
    try {
      setLoading(true);
      const res = await issuesService.getSaved(page, 12);
      if (res.success && res.issues) {
        const batch = res.issues as unknown as Issue[];
        setIssues(prev => (page === 1 ? batch : [...prev, ...batch]));
        setHasMore(res.pagination?.hasMore || false);
      }
    } catch (e) {
      // no-op; UI will show empty state
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => setPage(prev => prev + 1);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BookmarkIcon className="w-6 h-6" /> Saved Issues
          </h1>
          <p className="text-gray-600 dark:text-gray-400">All issues you bookmarked. They persist across logins.</p>
        </div>

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
              {issues.map((issue) => (
                <IssueCard key={issue._id} issue={issue} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-6">
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
            <BookmarkIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No saved issues yet</h3>
            <p className="text-gray-600 dark:text-gray-400">Save issues from Browse to see them here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Saved;

