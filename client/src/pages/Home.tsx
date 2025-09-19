import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheckIcon, 
  BugAntIcon, 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useApi } from '../contexts/ApiContext';
import { useEffect, useState } from 'react';

interface Stats {
  total_exploits: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  verified_count: number;
  recent_count: number;
}

export const Home: React.FC = () => {
  const { get } = useApi();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await get('/exploits/stats/overview');
        setStats(data.overview);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [get]);

  const features = [
    {
      name: 'Exploit Database',
      description: 'Comprehensive database of ChromeOS vulnerabilities and exploits with detailed analysis.',
      icon: BugAntIcon,
      href: '/exploits',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      name: 'AI Assistant',
      description: 'Chat with Kaji, our AI security expert, to get answers about ChromeOS vulnerabilities.',
      icon: ChatBubbleLeftRightIcon,
      href: '/chat',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Report Issues',
      description: 'Report errors, false positives, or suggest new vulnerabilities for our database.',
      icon: ExclamationTriangleIcon,
      href: '/reports',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Security Analytics',
      description: 'View detailed statistics and trends in ChromeOS security vulnerabilities.',
      icon: ChartBarIcon,
      href: '/exploits',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  const severityStats = [
    { label: 'Critical', count: stats?.critical_count || 0, color: 'bg-red-500' },
    { label: 'High', count: stats?.high_count || 0, color: 'bg-orange-500' },
    { label: 'Medium', count: stats?.medium_count || 0, color: 'bg-yellow-500' },
    { label: 'Low', count: stats?.low_count || 0, color: 'bg-blue-500' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Kaji
            </h1>
            <p className="text-xl md:text-2xl text-primary-100 mb-8 max-w-3xl mx-auto">
              AI-powered ChromeOS vulnerability research and analysis platform
            </p>
            <p className="text-lg text-primary-200 mb-12 max-w-2xl mx-auto">
              Discover, analyze, and understand security vulnerabilities in ChromeOS versions 
              with the help of advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/exploits"
                className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
              >
                Browse Exploits
              </Link>
              <Link
                to="/chat"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 text-lg font-semibold"
              >
                Chat with Kaji
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {!isLoading && stats && (
        <div className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Security Statistics
              </h2>
              <p className="text-lg text-gray-600">
                Real-time data on ChromeOS vulnerabilities
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {stats.total_exploits}
                </div>
                <div className="text-gray-600">Total Exploits</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {stats.verified_count}
                </div>
                <div className="text-gray-600">Verified</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {stats.critical_count}
                </div>
                <div className="text-gray-600">Critical</div>
              </div>
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {stats.recent_count}
                </div>
                <div className="text-gray-600">Recent (30 days)</div>
              </div>
            </div>

            {/* Severity Distribution */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Severity Distribution
              </h3>
              <div className="space-y-3">
                {severityStats.map((stat) => (
                  <div key={stat.label} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{stat.label}</div>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${stat.color}`}
                          style={{
                            width: `${(stat.count / stats.total_exploits) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm text-gray-900 font-medium">
                      {stat.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for ChromeOS security research
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={feature.name}
                  to={feature.href}
                  className="card p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start your security research?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of security researchers using Kaji to stay ahead of ChromeOS vulnerabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-white text-primary-600 hover:bg-gray-50 px-8 py-3 text-lg font-semibold"
              >
                Get Started
              </Link>
              <Link
                to="/exploits"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 text-lg font-semibold"
              >
                Explore Database
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
