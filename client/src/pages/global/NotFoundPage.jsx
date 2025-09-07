import React, { useState } from 'react';

const NotFoundPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m-3-16a9 9 0 11-9 9c0-5.523 4.477-10 10-10z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 font-['Open_Sans']">
          Oops! Page Not Found
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 font-['Roboto'] leading-relaxed max-w-lg mx-auto">
          We're sorry, but the page you were looking for doesn't seem to exist. It might have been moved, deleted, or the link may be broken. Please check the URL or use the navigation below to find your way.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors"
          >
            Go to Homepage
          </button>
          <button 
            onClick={() => console.log('Report broken link')}
            className="border-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors"
          >
            Report Broken Link
          </button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <a href="#" className="text-gray-600 hover:text-black font-['Roboto'] transition-colors">
              How it Works
            </a>
            <a href="#" className="text-gray-600 hover:text-black font-['Roboto'] transition-colors">
              Features
            </a>
            <a href="#" className="text-gray-600 hover:text-black font-['Roboto'] transition-colors">
              Pricing
            </a>
            <a href="#" className="text-gray-600 hover:text-black font-['Roboto'] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
