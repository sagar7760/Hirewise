import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const HomePage = () => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-black font-bold text-lg">H</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">HireWise</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans']">How it Works</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans']">Features</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans']">Pricing</a>
            <a href="#" className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans']">About</a>
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <button className="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-['Open_Sans']">Log in</button>
            <button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-4 py-2 rounded-lg font-['Open_Sans'] transition-colors">Get Started</button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight font-['Open_Sans']">
              Smarter Hiring with AI.{' '}
              <span className="block">Faster. Fairer.</span>
              <span className="block">Better.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-['Roboto']">
              Transform your recruitment process with AI-powered tools that help you find, evaluate, and hire the best candidates efficiently.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
                Get Started
              </button>
              <button className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
              <div className="h-80 bg-gray-700 dark:bg-gray-600 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white dark:bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-700 dark:text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                    </svg>
                  </div>
                  <p className="text-white dark:text-gray-200 font-['Roboto']">AI-Powered Hiring Dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">How it Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-['Roboto']">Simple steps to revolutionize your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black dark:text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Upload Resume</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Upload candidate resumes and let our AI analyze qualifications, skills, and experience automatically.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black dark:text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">AI Screening</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Our advanced AI screens candidates based on job requirements and provides detailed compatibility scores.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black dark:text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Intelligent Ranking</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Get ranked candidate lists with detailed insights to make informed hiring decisions quickly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Why Choose HireWise?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-['Roboto']">Powerful features that transform your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Resume Parsing</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Automatically extract and structure information from resumes with 99% accuracy.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">AI Screening</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Intelligent candidate screening based on job requirements and company culture fit.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Candidate Scoring</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Comprehensive scoring system that ranks candidates based on multiple criteria.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Smart HR Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Get detailed analytics and insights to improve your hiring process continuously.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Interview Scheduler</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">Automated interview scheduling with calendar integration and smart reminders.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Bias Detection</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">AI-powered bias detection ensures fair and equitable hiring decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Sections */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For HR and Recruiters */}
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">For HR And Recruiters.</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto']">Streamline your hiring process with AI-powered tools that help you find, evaluate, and hire the best candidates.</p>
            <button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">
              Learn More
            </button>
          </div>

          {/* For Job Seekers */}
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">For Job Seekers.</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto']">Get discovered by top companies. Receive personalized job recommendations and stand out with AI-optimized profiles.</p>
            <button className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">
              Join Now
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans']">Testimonials</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-['Roboto']">What our customers say about us</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">JS</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white font-['Open_Sans']">John Smith</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-['Roboto']">HR Director at TechCorp</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">"HireWise has transformed our hiring process. We've reduced time-to-hire by 60% and improved candidate quality significantly."</p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">SK</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Sarah Kim</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-['Roboto']">Talent Acquisition Lead</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">"The AI screening feature is incredibly accurate. It helps us identify the best candidates without bias and saves countless hours."</p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 dark:text-gray-300 font-semibold">MW</span>
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white font-['Open_Sans']">Michael Wong</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm font-['Roboto']">Startup Founder</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">"As a startup, we needed an efficient hiring solution. HireWise gave us enterprise-level capabilities at an affordable price."</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-20 bg-black dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6 font-['Open_Sans']">Ready to hire smarter?</h2>
          <p className="text-xl text-gray-300 mb-8 font-['Roboto']">Join thousands of companies that trust HireWise for their recruitment needs.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-white text-black hover:bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
              Get Started Free
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-black px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
              Request Demo - Candidates
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 dark:bg-black border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-black font-bold text-lg">H</span>
                </div>
                <span className="text-xl font-bold text-white font-['Open_Sans']">HireWise</span>
              </div>
              <p className="text-gray-400 font-['Roboto']">Smarter hiring with AI. Faster, fairer, better.</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 font-['Open_Sans']">Product</h3>
              <ul className="space-y-2 text-gray-400 font-['Roboto']">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 font-['Open_Sans']">Company</h3>
              <ul className="space-y-2 text-gray-400 font-['Roboto']">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 font-['Open_Sans']">Support</h3>
              <ul className="space-y-2 text-gray-400 font-['Roboto']">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 font-['Roboto']">© 2025 HireWise. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z" clipRule="evenodd"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84"/>
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
