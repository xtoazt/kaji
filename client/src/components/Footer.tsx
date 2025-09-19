import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
              <span className="text-lg font-bold text-gray-900">Kaji</span>
            </div>
            <p className="text-gray-600 text-sm max-w-md">
              AI-powered ChromeOS vulnerability research and analysis platform. 
              Discover, analyze, and understand security vulnerabilities in ChromeOS versions.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Platform
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/exploits" className="text-gray-600 hover:text-gray-900 text-sm">
                  Exploits Database
                </Link>
              </li>
              <li>
                <Link to="/chat" className="text-gray-600 hover:text-gray-900 text-sm">
                  AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/reports" className="text-gray-600 hover:text-gray-900 text-sm">
                  Report Issues
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://docs.kaji-security.com" 
                  className="text-gray-600 hover:text-gray-900 text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/kaji-security" 
                  className="text-gray-600 hover:text-gray-900 text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a 
                  href="mailto:security@kaji.com" 
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2024 Kaji Security Research. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a 
                href="/privacy" 
                className="text-gray-500 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </a>
              <a 
                href="/terms" 
                className="text-gray-500 hover:text-gray-900 text-sm"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
