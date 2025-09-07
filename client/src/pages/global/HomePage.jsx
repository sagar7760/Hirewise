import React from 'react';
import officeHero from '../../assets/images/office-hero.png';

const HomePage = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight font-['Open_Sans']">
              Smarter Hiring with AI.{' '}
              <span className="block">Faster. Fairer.</span>
              <span className="block">Better.</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed font-['Roboto']">
              Transform your recruitment process with AI-powered tools that help you find, evaluate, and hire the best candidates efficiently.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button className="bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
                Get Started
              </button>
              <button className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="relative">
            <div>
              <img 
                src={officeHero} 
                alt="AI-Powered Hiring Platform - Modern office with professionals collaborating" 
                className="w-full h-80 object-cover rounded-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-['Open_Sans']">How it Works</h2>
            <p className="text-xl text-gray-600 font-['Roboto']">Simple steps to revolutionize your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black">1</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">Upload Resume</h3>
              <p className="text-gray-600 font-['Roboto']">Upload candidate resumes and let our AI analyze qualifications, skills, and experience automatically.</p>
            </div>

            {/* Step 2 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black">2</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">AI Screening</h3>
              <p className="text-gray-600 font-['Roboto']">Our advanced AI screens candidates based on job requirements and provides detailed compatibility scores.</p>
            </div>

            {/* Step 3 */}
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto flex items-center justify-center">
                <span className="text-2xl font-bold text-black">3</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 font-['Open_Sans']">Intelligent Ranking</h3>
              <p className="text-gray-600 font-['Roboto']">Get ranked candidate lists with detailed insights to make informed hiring decisions quickly.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 font-['Open_Sans']">Why Choose HireWise?</h2>
            <p className="text-xl text-gray-600 font-['Roboto']">Powerful features that transform your hiring process</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">Resume Parsing</h3>
              <p className="text-gray-600 font-['Roboto']">Automatically extract and structure information from resumes with 99% accuracy.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">AI Screening</h3>
              <p className="text-gray-600 font-['Roboto']">Intelligent candidate screening based on job requirements and company culture fit.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">Candidate Scoring</h3>
              <p className="text-gray-600 font-['Roboto']">Comprehensive scoring system that ranks candidates based on multiple criteria.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">Smart HR Insights</h3>
              <p className="text-gray-600 font-['Roboto']">Get detailed analytics and insights to improve your hiring process continuously.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">Interview Scheduler</h3>
              <p className="text-gray-600 font-['Roboto']">Automated interview scheduling with calendar integration and smart reminders.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 font-['Open_Sans']">Bias Detection</h3>
              <p className="text-gray-600 font-['Roboto']">AI-powered bias detection ensures fair and equitable hiring decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Sections */}
      <section className="px-6 py-20 bg-gray">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* For HR and Recruiters */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-['Open_Sans']">For HR And Recruiters.</h3>
            <p className="text-gray-600 mb-6 font-['Roboto']">Streamline your hiring process with AI-powered tools that help you find, evaluate, and hire the best candidates.</p>
            <button className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">
              Learn More
            </button>
          </div>

          {/* For Job Seekers */}
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 font-['Open_Sans']">For Job Seekers.</h3>
            <p className="text-gray-600 mb-6 font-['Roboto']">Get discovered by top companies. Receive personalized job recommendations and stand out with AI-optimized profiles.</p>
            <button className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">
              Join Now
            </button>
          </div>
        </div>
      </section>


      {/* Final CTA */}
      <section className="px-6 py-20 bg-gray">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 font-['Open_Sans']">Ready to hire smarter?</h2>
          <p className="text-xl text-gray-600 mb-8 font-['Roboto']">Join thousands of companies that trust HireWise for their recruitment needs.</p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
              Get Started Free
            </button>
            <button className="border-2 border-black text-black hover:bg-black hover:text-white px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors">
              Expolre Jobs - Candidates
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
