import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const CompanyVerificationPage = () => {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            Company Registered Successfully!
          </h1>
          <p className="text-gray-600 font-['Roboto']">
            We've sent a verification email to help secure your account.
          </p>
        </div>

        {/* Email Info */}
        <div className="bg-gray-50 p-6 rounded-lg border">
          <div className="flex items-start space-x-3">
            <svg className="h-6 w-6 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="flex-1 text-left">
              <h3 className="text-sm font-medium text-gray-900 font-['Open_Sans'] mb-1">
                Verification Email Sent
              </h3>
              <p className="text-sm text-gray-600 font-['Roboto'] mb-2">
                Check your inbox at <span className="font-medium text-gray-900">{email}</span> for a verification link.
              </p>
              <p className="text-xs text-gray-500 font-['Roboto']">
                Don't see it? Check your spam folder or wait a few minutes for delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="text-left bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-4">
            What's Next?
          </h3>
          <ol className="space-y-3">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium font-['Open_Sans']">
                1
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                  Verify Your Email
                </p>
                <p className="text-xs text-gray-600 font-['Roboto']">
                  Click the verification link in your email to activate your account
                </p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium font-['Open_Sans']">
                2
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                  Login to Dashboard
                </p>
                <p className="text-xs text-gray-600 font-['Roboto']">
                  Access your admin dashboard with full company management features
                </p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium font-['Open_Sans']">
                3
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                  Add Your Team
                </p>
                <p className="text-xs text-gray-600 font-['Roboto']">
                  Invite HR users and interviewers to join your company
                </p>
              </div>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-medium font-['Open_Sans']">
                4
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900 font-['Open_Sans']">
                  Start Hiring
                </p>
                <p className="text-xs text-gray-600 font-['Roboto']">
                  Post jobs and begin attracting top talent to your organization
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <div className="flex space-x-4">
            <button
              onClick={() => window.open('mailto:', '_blank')}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium font-['Open_Sans'] hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2v10a2 2 0 002 2z" />
              </svg>
              <span>Open Email</span>
            </button>
            
            <Link
              to="/login"
              className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium font-['Open_Sans'] hover:bg-gray-800 transition-colors text-center"
            >
              Go to Login
            </Link>
          </div>

          {/* Resend Email */}
          <div className="text-center">
            <button
              onClick={() => {
                // TODO: Implement resend verification email
                console.log('Resend verification email');
              }}
              className="text-sm text-gray-600 hover:text-gray-900 font-['Roboto'] underline hover:no-underline transition-colors"
            >
              Didn't receive the email? Click to resend
            </button>
          </div>
        </div>

        {/* Help */}
        <div className="text-center pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 font-['Roboto']">
            Need help?{' '}
            <Link to="/contact" className="text-black font-medium hover:underline font-['Open_Sans']">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompanyVerificationPage;