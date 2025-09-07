import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import hirewiseLogo from '../../assets/hirewise.svg';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="px-6 py-4 border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <img src={hirewiseLogo} alt="HireWise" className="w-8 h-8" />
            <span className="text-xl font-bold text-gray-900 font-['Open_Sans']">HireWise</span>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#how-it-works" className="text-gray-800 hover:text-black font-['Open_Sans'] transition-colors">How it Works</a>
          <a href="#features" className="text-gray-800 hover:text-black font-['Open_Sans'] transition-colors">Features</a>
          <a href="#pricing" className="text-gray-800 hover:text-black font-['Open_Sans'] transition-colors">Pricing</a>
          <a href="#about" className="text-gray-800 hover:text-black font-['Open_Sans'] transition-colors">About</a>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link 
            to="/login" 
            className="text-gray-800 hover:text-black font-['Open_Sans'] transition-colors"
          >
            Log in
          </Link>
          <Link 
            to="/signup" 
            className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-['Open_Sans'] transition-colors"
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
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-6 py-4 space-y-4">
            <nav className="flex flex-col space-y-4">
              <a href="#how-it-works" className="text-gray-600 hover:text-black font-['Open_Sans'] transition-colors">How it Works</a>
              <a href="#features" className="text-gray-600 hover:text-black font-['Open_Sans'] transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-black font-['Open_Sans'] transition-colors">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-black font-['Open_Sans'] transition-colors">About</a>
            </nav>
            <div className="flex flex-col space-y-2 pt-4 border-t border-gray-200">
              <Link 
                to="/login" 
                className="text-gray-600 hover:text-black font-['Open_Sans'] transition-colors text-left"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-lg font-['Open_Sans'] transition-colors text-center"
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
