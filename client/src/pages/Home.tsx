import React from 'react';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              🛡️ Kaji
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              AI-powered ChromeOS vulnerability research platform
            </p>
            <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto">
              Discover and analyze security vulnerabilities in ChromeOS versions with advanced AI technology.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/exploits"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Browse Exploits
              </Link>
              <Link
                to="/chat"
                className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                Chat with AI
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Platform Features
            </h2>
            <p className="text-lg text-gray-600">
              Everything you need for ChromeOS security research
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link
              to="/exploits"
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-4">🐛</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Exploit Database
              </h3>
              <p className="text-gray-600">
                Comprehensive database of ChromeOS vulnerabilities and exploits with detailed analysis.
              </p>
            </Link>

            <Link
              to="/chat"
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-4">🤖</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                AI Assistant
              </h3>
              <p className="text-gray-600">
                Chat with Kaji, our AI security expert, to get answers about ChromeOS vulnerabilities.
              </p>
            </Link>

            <Link
              to="/reports"
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Report Issues
              </h3>
              <p className="text-gray-600">
                Report errors, false positives, or suggest new vulnerabilities for our database.
              </p>
            </Link>

            <Link
              to="/register"
              className="p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-4">👤</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Started
              </h3>
              <p className="text-gray-600">
                Create an account to access advanced features and contribute to the platform.
              </p>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to start your security research?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join security researchers using Kaji to stay ahead of ChromeOS vulnerabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
