import React, { useState } from 'react';
import { Issue } from '../../types';
import { 
  ExternalLink, 
  Star, 
  GitFork, 
  Clock, 
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { issuesService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface IssueCardProps {
  issue: Issue;
  matchScore?: number;
  reasons?: string[];
  showSaveButton?: boolean;
  showSolvedButton?: boolean;
}

const IssueCard: React.FC<IssueCardProps> = ({ 
  issue, 
  matchScore, 
  reasons, 
  showSaveButton = true,
  showSolvedButton = true 
}) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(
    user?.savedIssues.includes(issue._id) || false
  );
  const [isSolved, setIsSolved] = useState(
    user?.solvedIssues.some(solved => solved.issue === issue._id) || false
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user || isLoading) return;
    
    setIsLoading(true);
    try {
      if (isSaved) {
        await issuesService.unsave(issue._id);
        setIsSaved(false);
      } else {
        await issuesService.save(issue._id);
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Failed to save/unsave issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkSolved = async () => {
    if (!user || isLoading) return;
    
    const pullRequestUrl = prompt('Enter the URL of your pull request (optional):');
    
    setIsLoading(true);
    try {
      await issuesService.markSolved(issue._id, pullRequestUrl || undefined);
      setIsSolved(true);
    } catch (error) {
      console.error('Failed to mark issue as solved:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'good-first-issue':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'beginner':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {issue.repository.owner}/{issue.repository.name}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              #{issue.number}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
            {issue.title}
          </h3>
        </div>
        
        {matchScore && (
          <div className="ml-4 flex-shrink-0">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm font-medium">
              {Math.round(matchScore * 100)}% match
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      {issue.body && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
          {issue.body.replace(/[#*`]/g, '').substring(0, 150)}...
        </p>
      )}

      {/* Tags and Labels */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(issue.difficulty)}`}>
          {issue.difficulty}
        </span>
        
        {issue.repository.language && (
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
            {issue.repository.language}
          </span>
        )}
        
        {issue.labels.slice(0, 2).map((label) => (
          <span
            key={label.name}
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: `#${label.color}20`,
              color: `#${label.color}`,
            }}
          >
            {label.name}
          </span>
        ))}
        
        {issue.labels.length > 2 && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{issue.labels.length - 2} more
          </span>
        )}
      </div>

      {/* Match Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Why this matches you:
          </p>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {reasons.slice(0, 2).map((reason, index) => (
              <li key={index} className="flex items-center space-x-1">
                <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Repository Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4" />
            <span>{issue.repository.stars}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <GitFork className="w-4 h-4" />
            <span>{issue.repository.forks}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{formatTimeAgo(issue.lastActivity)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <span>{issue.estimatedHours}h</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          <span>View on GitHub</span>
          <ExternalLink className="w-4 h-4" />
        </a>
        
        <div className="flex items-center space-x-2">
          {showSolvedButton && !isSolved && (
            <button
              onClick={handleMarkSolved}
              disabled={isLoading}
              className="flex items-center space-x-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm"
              title="Mark as solved"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          
          {showSaveButton && (
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                isSaved
                  ? 'text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300'
                  : 'text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              title={isSaved ? 'Remove from saved' : 'Save for later'}
            >
              {isSaved ? (
                <BookmarkCheck className="w-4 h-4" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {isSolved && (
        <div className="mt-3 flex items-center space-x-2 text-green-600 dark:text-green-400 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Marked as solved</span>
        </div>
      )}
    </div>
  );
};

export default IssueCard;