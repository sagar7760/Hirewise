import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import hirewiseLogo from '../../assets/hirewise.svg';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <img src={hirewiseLogo} alt="HireWise" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">HireWise</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link to="/how-it-works" className="text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors">How it Works</Link>
          <Link to="/features" className="text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors">Features</Link>
          <Link to="/about" className="text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors">About</Link>
        </nav>

        {/* Desktop Auth Buttons and Theme Toggle */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          <Link 
            to="/login" 
            className="text-gray-800 dark:text-gray-200 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors"
          >
            Log in
          </Link>
          <Link 
            to="/signup" 
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-['Open_Sans'] transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors duration-300">
          <div className="px-6 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              <Link to="/how-it-works" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>How it Works</Link>
              <Link to="/features" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Features</Link>
              <Link to="/about" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
            </nav>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600 dark:text-gray-300 font-['Open_Sans'] text-sm">Theme</span>
                <ThemeToggle />
              </div>
              <Link 
                to="/login" 
                className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans'] transition-colors text-left"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-['Open_Sans'] transition-colors text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
