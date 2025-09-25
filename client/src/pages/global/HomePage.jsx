import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import officeHero from '../../assets/images/office-hero.png';

const HomePage = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    // Create intersection observer for animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    // Observe all elements with animation classes
    const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in, .slide-up');
    animatedElements.forEach((el) => {
      observerRef.current.observe(el);
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <>
      {/* Animation Styles */}
      <style>{`
        .fade-up {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .fade-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .fade-left {
          opacity: 0;
          transform: translateX(-30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-left.animate-in {
          opacity: 1;
          transform: translateX(0);
        }
        .fade-right {
          opacity: 0;
          transform: translateX(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-right.animate-in {
          opacity: 1;
          transform: translateX(0);
        }
        .scale-in {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .scale-in.animate-in {
          opacity: 1;
          transform: scale(1);
        }
        .slide-up {
          opacity: 0;
          transform: translateY(40px);
          transition: opacity 0.7s ease-out, transform 0.7s ease-out;
        }
        .slide-up.animate-in {
          opacity: 1;
          transform: translateY(0);
        }
        .delay-100 { transition-delay: 0.1s; }
        .delay-200 { transition-delay: 0.2s; }
        .delay-300 { transition-delay: 0.3s; }
        .delay-400 { transition-delay: 0.4s; }

        /* Hover Animations */
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
        
        .hover-glow {
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .hover-glow:hover {
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
          transform: translateY(-2px);
        }
        
        .hover-slide {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease;
        }
        .hover-slide:hover {
          transform: translateX(5px);
        }
        .hover-slide::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          transition: left 0.5s;
        }
        .hover-slide:hover::before {
          left: 100%;
        }
        
        .hover-bounce {
          transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        .hover-bounce:hover {
          transform: scale(1.1);
        }
        
        .hover-rotate {
          transition: transform 0.3s ease;
        }
        .hover-rotate:hover {
          transform: rotate(5deg) scale(1.02);
        }
        
        .hover-gradient {
          background: linear-gradient(45deg, #000000, #333333);
          background-size: 200% 200%;
          transition: background-position 0.3s ease, transform 0.2s ease;
        }
        .hover-gradient:hover {
          background-position: 100% 100%;
          transform: translateY(-2px);
        }
        
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
      {/* Hero Section */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight font-['Open_Sans'] fade-up transition-colors duration-300">
              Smarter Hiring with AI.{' '}
              <span className="block">Faster. Fairer.</span>
              <span className="block">Better.</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-['Roboto'] fade-up delay-200 transition-colors duration-300">
              Transform your recruitment process with AI-powered tools that help you find, evaluate, and hire the best candidates efficiently.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 fade-up delay-300">
              <Link 
                to="/company/signup"
                className="bg-black dark:bg-white text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors hover-gradient hover-glow cursor-pointer text-center"
              >
                Start Hiring
              </Link>
              <Link 
                to="/signup"
                className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors hover-slide cursor-pointer text-center"
              >
                Find Jobs
              </Link>
            </div>
          </div>
          
          <div className="relative fade-right">
            <div className="hover-scale cursor-pointer">
              <img 
                src={officeHero} 
                alt="AI-Powered Hiring Platform - Modern office with professionals collaborating" 
                className="w-full h-80 object-cover rounded-xl hover-glow"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-up">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">How it Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Simple steps to revolutionize your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-6 fade-up delay-100 hover-lift cursor-pointer p-6 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center hover-bounce transition-colors duration-300">
                <span className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">Upload Resume</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Upload candidate resumes and let our AI analyze qualifications, skills, and experience automatically.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6 fade-up delay-200 hover-lift cursor-pointer p-6 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center hover-bounce transition-colors duration-300">
                <span className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">AI Screening</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Our advanced AI screens candidates based on job requirements and provides detailed compatibility scores.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6 fade-up delay-300 hover-lift cursor-pointer p-6 rounded-xl">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto flex items-center justify-center hover-bounce transition-colors duration-300">
                <span className="text-2xl font-bold text-black dark:text-white transition-colors duration-300">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white font-['Open_Sans'] transition-colors duration-300">Intelligent Ranking</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Get ranked candidate lists with detailed insights to make informed hiring decisions quickly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 fade-up">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Why Choose HireWise?</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Powerful features that transform your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Resume Parsing</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Automatically extract and structure information from resumes with 99% accuracy.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in delay-100 hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">AI Screening</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Intelligent candidate screening based on job requirements and company culture fit.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in delay-200 hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Candidate Scoring</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Comprehensive scoring system that ranks candidates based on multiple criteria.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in delay-300 hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Smart HR Insights</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Get detailed analytics and insights to improve your hiring process continuously.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in delay-400 hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Interview Scheduler</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">Automated interview scheduling with calendar integration and smart reminders.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 scale-in hover-lift cursor-pointer transition-colors duration-300">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-6 hover-rotate transition-colors duration-300">
                <svg className="w-6 h-6 text-black dark:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">Bias Detection</h3>
              <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] transition-colors duration-300">AI-powered bias detection ensures fair and equitable hiring decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Sections */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For HR and Recruiters */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 fade-left hover-lift cursor-pointer transition-colors duration-300">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">For HR And Recruiters.</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto'] transition-colors duration-300">Streamline your hiring process with AI-powered tools that help you find, evaluate, and hire the best candidates.</p>
            <Link 
              to="/company/signup"
              className="bg-black dark:bg-white text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors hover-gradient hover-glow cursor-pointer inline-block text-center"
            >
              Register Company
            </Link>
          </div>

          {/* For Job Seekers */}
          <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 fade-right hover-lift cursor-pointer transition-colors duration-300">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 font-['Open_Sans'] transition-colors duration-300">For Job Seekers.</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 font-['Roboto'] transition-colors duration-300">Get discovered by top companies. Receive personalized job recommendations and stand out with AI-optimized profiles.</p>
            <Link 
              to="/signup"
              className="bg-black dark:bg-white text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors hover-gradient hover-glow cursor-pointer inline-block text-center"
            >
              Join Now
            </Link>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center slide-up">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 font-['Open_Sans'] transition-colors duration-300">Ready to hire smarter?</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-['Roboto'] transition-colors duration-300">Join thousands of companies that trust HireWise for their recruitment needs.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link 
              to="/login"
              className="bg-black dark:bg-white text-white dark:text-white hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors hover-gradient hover-glow cursor-pointer text-center"
            >
              Sign in
            </Link>
            <Link 
              to="/company/signup"
              className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors hover-slide cursor-pointer text-center"
            >
              Register Company
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;