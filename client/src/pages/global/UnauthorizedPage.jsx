import React from 'react';

const UnauthorizedPage = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0h.01M12 17h-.01M12 6v6" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 font-['Open_Sans']">
          Unauthorized Access
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 font-['Roboto'] leading-relaxed">
          You do not have permission to access this page. Please log in or contact support if you believe this is an error.
        </p>

        {/* Action Button */}
        <div className="space-y-4">
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-black text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-semibold font-['Open_Sans'] transition-colors w-full sm:w-auto"
          >
            Go to Homepage
          </button>
        </div>

        {/* Additional Help */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 font-['Roboto']">
            Need help? <a href="#" className="text-black hover:underline font-semibold">Contact Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
