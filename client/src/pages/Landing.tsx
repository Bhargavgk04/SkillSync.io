import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Github, 
  Target, 
  Zap, 
  Users, 
  TrendingUp, 
  Star,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Landing: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Matching',
      description: 'Our intelligent algorithm analyzes your skills and GitHub activity to find the perfect issues for your expertise level.'
    },
    {
      icon: Zap,
      title: 'Skill Extraction',
      description: 'Automatically extract and analyze your programming skills from your repositories and contribution history.'
    },
    {
      icon: Users,
      title: 'Personalized Dashboard',
      description: 'Get a customized view of recommended issues, your saved items, and progress tracking.'
    },
    {
      icon: TrendingUp,
      title: 'Smart Recommendations',
      description: 'Discover trending repositories and issues that match your interests and skill level.'
    }
  ];

  const benefits = [
    'Find issues that match your exact skill level',
    'Discover new technologies and frameworks',
    'Build your open source portfolio',
    'Connect with amazing developer communities',
    'Track your contribution progress',
    'Get personalized difficulty recommendations'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl">
                <Target className="w-12 h-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              AI-Powered{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Open Source
              </span>{' '}
              Matching
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Find GitHub issues that perfectly match your skills and interests. 
              Our intelligent platform analyzes your profile and recommends 
              personalized contribution opportunities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/dashboard"
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                >
                  <Github className="w-5 h-5" />
                  <span>Get Started with GitHub</span>
                </Link>
              )}
              
              <a
                href="#features"
                className="flex items-center justify-center space-x-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500 dark:hover:border-blue-400 px-8 py-4 rounded-lg text-lg font-medium transition-colors"
              >
                <span>Learn More</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Intelligent Issue Matching
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Our AI analyzes your GitHub profile to understand your skills and preferences, 
              then matches you with the perfect contribution opportunities.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg w-fit mb-4">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
                Why Choose AI Matcher?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                Stop wasting time searching through thousands of issues. 
                Let our AI do the heavy lifting and present you with 
                opportunities that truly match your skills and interests.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl">
              <div className="text-center mb-8">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Ready to Contribute?
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Join thousands of developers who have found their perfect open source projects.
                </p>
              </div>
              
              {!user && (
                <Link
                  to="/login"
                  className="flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
                >
                  <Github className="w-5 h-5" />
                  <span>Sign Up Now</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Start Your Open Source Journey Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Let AI help you find the perfect issues to contribute to. 
            Build your portfolio, learn new skills, and make a difference in the open source community.
          </p>
          
          {!user && (
            <Link
              to="/login"
              className="inline-flex items-center space-x-2 bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-medium transition-colors shadow-lg hover:shadow-xl"
            >
              <Github className="w-5 h-5" />
              <span>Get Started Free</span>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;