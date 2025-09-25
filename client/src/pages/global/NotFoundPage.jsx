import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // In a real application, you would navigate to a search results page
    // For example: navigate(`/search?query=${searchQuery}`);
    console.log('Searching for:', searchQuery);
  };

  const handleReportLink = () => {
    const subject = encodeURIComponent(`Broken Link Report: ${window.location.href}`);
    const body = encodeURIComponent(`I found a broken link at the following URL:\n\n${window.location.href}\n\nPlease fix it. Thank you!`);
    window.location.href = `mailto:support@yourcompany.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-700 transition-colors duration-300 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-600 dark:text-gray-300 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m-3-16a9 9 0 11-9 9c0-5.523 4.477-10 10-10z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white transition-colors duration-300 font-['Open_Sans']">
          Oops! Page Not Found 😟
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-gray-300 transition-colors duration-300 font-['Roboto'] leading-relaxed max-w-lg mx-auto">
          We're sorry, but the page you were looking for doesn't seem to exist. It might have been moved, deleted, or the link may be broken. Please check the URL or use the navigation below to find your way.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-center gap-4 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Search for a topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-grow w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-colors font-['Roboto']"
          />
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 bg-black text-white dark:bg-white dark:text-black rounded-lg font-semibold font-['Open_Sans'] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            Go to Homepage
          </Link>
          <button
            onClick={handleReportLink}
            className="w-full sm:w-auto border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-100 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          >
            Report Broken Link
          </button>
        </div>

        {/* Quick Links */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-300 font-['Open_Sans'] mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Roboto'] transition-colors">
              How it Works
            </Link>
            <Link to="/features" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Roboto'] transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Roboto'] transition-colors">
              Pricing
            </Link>
            <Link to="/contact" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Roboto'] transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;