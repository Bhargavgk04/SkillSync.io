import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/api';
import { DifficultyLevel } from '../types';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Globe, 
  Target,
  Save,
  Check
} from 'lucide-react';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preferences, setPreferences] = useState({
    difficultLevels: [] as DifficultyLevel[],
    languages: [] as string[],
    topics: [] as string[],
    excludeRepositories: [] as string[],
    notificationSettings: {
      email: true,
      push: true,
      newMatches: true,
      weeklyDigest: true
    }
  });

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences);
    }
  }, [user]);

  const handlePreferenceChange = (key: string, value: unknown) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [key]: value
      }
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving preferences:', preferences);
      const response = await userService.updatePreferences(preferences);
      console.log('Save response:', response);
      
      if (response.success) {
        setSaved(true);
        await refreshUser(); // Refresh user context after saving
        setTimeout(() => setSaved(false), 2000);
      } else {
        console.error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  const difficultyLevels = [
    { value: 'good-first-issue', label: 'Good First Issue' },
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' }
  ];

  const programmingLanguages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
    'PHP', 'Ruby', 'C++', 'C#', 'Swift', 'Kotlin', 'Scala',
    'Dart', 'Elixir', 'Clojure', 'Haskell', 'F#', 'OCaml'
  ];

  const popularTopics = [
    'web-development', 'mobile-development', 'machine-learning',
    'data-science', 'devops', 'cybersecurity', 'blockchain',
    'game-development', 'ui-ux', 'testing', 'documentation',
    'api-design', 'database', 'cloud-computing', 'iot'
  ];

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
                Customize your preferences and notification settings
          </p>
        </div>

              <button
                onClick={handleSave}
              disabled={saving || saved}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
              {saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>

        <div className="space-y-8">
          {/* Difficulty Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Target className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Difficulty Preferences
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select the difficulty levels you're comfortable with:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {difficultyLevels.map((level) => (
                <label key={level.value} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                                        checked={preferences.difficultLevels.includes(level.value as DifficultyLevel)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handlePreferenceChange('difficultLevels', [...preferences.difficultLevels, level.value as DifficultyLevel]);
                      } else {
                        handlePreferenceChange('difficultLevels', preferences.difficultLevels.filter(l => l !== level.value));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

          {/* Language Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Globe className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Programming Languages
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select the programming languages you're interested in:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {programmingLanguages.map((language) => (
                <label key={language} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.languages.includes(language)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handlePreferenceChange('languages', [...preferences.languages, language]);
                      } else {
                        handlePreferenceChange('languages', preferences.languages.filter(l => l !== language));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{language}</span>
                  </label>
                ))}
              </div>
            </div>

          {/* Topic Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <SettingsIcon className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Topic Interests
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Select topics that interest you:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {popularTopics.map((topic) => (
                <label key={topic} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={preferences.topics.includes(topic)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handlePreferenceChange('topics', [...preferences.topics, topic]);
                      } else {
                        handlePreferenceChange('topics', preferences.topics.filter(t => t !== topic));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {topic.replace('-', ' ')}
                    </span>
                  </label>
                ))}
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Bell className="w-5 h-5 text-yellow-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Notification Settings
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Choose how you want to be notified:
            </p>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Email Notifications</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive updates via email</p>
                </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationSettings.email}
                    onChange={(e) => handleNotificationChange('email', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Push Notifications</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive browser notifications</p>
              </div>
                <input
                  type="checkbox"
                  checked={preferences.notificationSettings.push}
                  onChange={(e) => handleNotificationChange('push', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
              </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">New Matches</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get notified when new issues match your skills</p>
                </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationSettings.newMatches}
                    onChange={(e) => handleNotificationChange('newMatches', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>

              <label className="flex items-center justify-between">
                <div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Weekly Digest</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Receive a weekly summary of your activity</p>
                </div>
                  <input
                    type="checkbox"
                    checked={preferences.notificationSettings.weeklyDigest}
                    onChange={(e) => handleNotificationChange('weeklyDigest', e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                </label>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Account Information
              </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Username</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.username}</span>
            </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Email</span>
                <span className="font-medium text-gray-900 dark:text-white">{user.email || 'Not provided'}</span>
                </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Last Analysis</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(user.lastAnalyzed).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;