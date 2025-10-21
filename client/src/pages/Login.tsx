import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Github, Target, AlertCircle } from 'lucide-react';

const Login: React.FC = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleLogin = () => {
    login();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
              <Target className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to SkillSync
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in with GitHub to find your perfect open source contributions
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Authentication Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error === 'oauth_failed' 
                    ? 'There was an error signing in with GitHub. Please try again.'
                    : 'An unexpected error occurred. Please try again.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-lg">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                Get Started in Seconds
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2 mb-6">
                <li>✓ Analyze your GitHub profile automatically</li>
                <li>✓ Get personalized issue recommendations</li>
                <li>✓ Track your open source contributions</li>
                <li>✓ Discover new technologies to learn</li>
              </ul>
            </div>

            <button
              onClick={handleLogin}
              className="w-full flex justify-center items-center space-x-3 py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span>Continue with GitHub</span>
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                By signing in, you agree to our Terms of Service and Privacy Policy.
                We only access your public GitHub information.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              How it works:
            </h4>
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <p>1. We analyze your public GitHub repositories</p>
              <p>2. Our AI extracts your skills and experience level</p>
              <p>3. You get personalized issue recommendations</p>
              <p>4. Start contributing to projects you love!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
