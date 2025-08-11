import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { issuesService, userService } from '../services/api';
import { IssueMatch, UserStats } from '../types';
import { 
  Target,
  BookmarkIcon, 
  Award,
  RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import IssueCard from '../components/issues/IssueCard';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser, loading } = useAuth();
  const [recommendations, setRecommendations] = useState<IssueMatch[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Handle token from URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        if (token) {
          localStorage.setItem('token', token);
          window.history.replaceState({}, document.title, '/dashboard');
          await refreshUser();
        }

        // Verify authentication
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
          navigate('/login', { replace: true });
          return;
        }

        await loadDashboardData();
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        if (error instanceof Error && error.message.includes('authentication')) {
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      }
    };

    if (!loading) {
      init();
    }
  }, [loading, navigate, refreshUser]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Load data in parallel
      const [recommendationsRes, statsRes] = await Promise.all([
        issuesService.getRecommendations(1, 6),
        userService.getStats()
      ]);

      if (recommendationsRes.success && recommendationsRes.issues) {
        setRecommendations(recommendationsRes.issues);
      }

      if (statsRes.success) {
        setStats(statsRes.stats);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
      setIsLoadingRecommendations(false);
      setIsLoadingStats(false);
    }
  };

  const handleRefreshSkills = async () => {
    setIsRefreshing(true);
    try {
      // This would trigger skill analysis refresh
      await refreshUser();
      await loadDashboardData();
    } catch (error) {
      console.error('Failed to refresh skills:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Show loading state with better UI
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            Error: {error}
          </div>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while auth is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Initializing...
          </p>
        </div>
      </div>
    );
  }

  // Redirect if no user
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.name || user.username}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here are your personalized open source recommendations
              </p>
            </div>
            
            <button
              onClick={handleRefreshSkills}
              disabled={isRefreshing}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Skills</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {isLoadingStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={Target}
              title="Skills Identified"
              value={stats.totalSkills}
              subtitle={`${stats.topSkills.length} top skills`}
              color="blue"
            />
            <StatCard
              icon={BookmarkIcon}
              title="Saved Issues"
              value={stats.savedIssuesCount}
              subtitle="Bookmarked for later"
              color="green"
            />
            {/* Removed Solved Issues card */}
            <StatCard
              icon={Award}
              title="Achievements"
              value={stats.achievements.length}
              subtitle="Badges earned"
              color="yellow"
            />
          </div>
        ) : null}

        {/* Top Skills */}
        {stats && stats.topSkills.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Top Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {stats.topSkills.map((skill, index) => (
                <div
                  key={index}
                  className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${skill.level === 'expert' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      skill.level === 'advanced' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      skill.level === 'intermediate' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }
                  `}
                >
                  {skill.name} ({skill.level})
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Issues */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Recommended Issues
            </h2>
            <a
              href="/issues"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              View all →
            </a>
          </div>

          {isLoadingRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((match) => (
                <IssueCard
                  key={match.issue._id}
                  issue={match.issue}
                  matchScore={match.score}
                  reasons={match.reasons}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No recommendations yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're analyzing your GitHub profile to find the best issues for you. 
                This usually takes a few minutes.
              </p>
              <button
                onClick={handleRefreshSkills}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Analyze Profile
              </button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements */}
          {stats && stats.achievements.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Recent Achievements
              </h3>
              <div className="space-y-3">
                {stats.achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GitHub Stats */}
          {stats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                GitHub Profile
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Public Repositories</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.githubStats.publicRepos}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Followers</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.githubStats.followers}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Following</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.githubStats.following}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Analysis</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(stats.lastAnalyzed).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'yellow';
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;