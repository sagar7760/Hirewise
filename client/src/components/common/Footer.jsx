import React from 'react';
import { Link } from 'react-router-dom';
import hirewiseLogo from '../../assets/hirewise.svg';

const Footer = () => {
  return (
    <footer className="px-6 py-12 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-start">
          {/* Brand Section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src={hirewiseLogo} alt="HireWise" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">HireWise</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Smarter hiring with AI. Faster, fairer, better.</p>
          </div>

          {/* Product Links (Only used routes) */}
          <div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-4 font-['Open_Sans'] transition-colors duration-300">Product</h3>
            <ul className="space-y-2 text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">
              <li><Link to="/how-it-works" className="hover:text-gray-900 dark:hover:text-white transition-colors">How it Works</Link></li>
              <li><Link to="/features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/about" className="hover:text-gray-900 dark:hover:text-white transition-colors">About</Link></li>
            </ul>
          </div>

          {/* Support links removed per request */}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">© 2025 HireWise. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* GitHub */}
            <a href="https://github.com/sagar7760" target="_blank" rel="noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="sr-only">GitHub</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.486 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.749 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.486 17.523 2 12 2Z" clipRule="evenodd"/></svg>
            </a>
            {/* LinkedIn */}
            <a href="https://www.linkedin.com/in/sagar-soradi" target="_blank" rel="noreferrer" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="sr-only">LinkedIn</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.983 3.5a2.5 2.5 0 1 0 0 5.001 2.5 2.5 0 0 0 0-5ZM3 9.75h3.967v10.5H3V9.75Zm7.837 0H15.6v1.43h.051c.38-.722 1.31-1.482 2.698-1.482 2.887 0 3.42 1.937 3.42 4.457v5.095h-3.964v-4.51c0-1.076-.02-2.46-1.498-2.46-1.5 0-1.73 1.17-1.73 2.382v4.588h-3.94V9.75Z"/></svg>
            </a>
            {/* Email */}
            <a href="mailto:sagarsoradi011@gmail.com" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              <span className="sr-only">Email</span>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h15A2.5 2.5 0 0 1 22 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17.5v-11Zm2.5-.5a.5.5 0 0 0-.5.5v.217l8 4.8 8-4.8V6.5a.5.5 0 0 0-.5-.5h-15Zm15.5 3.383-6.93 4.158a1 1 0 0 1-1.04 0L5.1 9.383V17.5a.5.5 0 0 0 .5.5h15a.5.5 0 0 0 .5-.5V9.383Z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
