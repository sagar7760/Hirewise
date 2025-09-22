import React from 'react';

const Skeleton = ({ className = '', variant = 'rectangular', animation = 'pulse' }) => {
  const baseClasses = 'bg-gray-200';
  
  const variantClasses = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4',
    avatar: 'rounded-full w-10 h-10',
    card: 'rounded-lg'
  };
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: ''
  };
  
  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant] || variantClasses.rectangular}
        ${animationClasses[animation]}
        ${className}
      `}
    />
  );
};

// Skeleton components for common use cases
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton 
        key={index}
        variant="text" 
        className={index === lines - 1 ? 'w-3/4' : 'w-full'}
      />
    ))}
  </div>
);

export const SkeletonAvatar = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };
  
  return (
    <Skeleton 
      variant="circular" 
      className={`${sizeClasses[size]} ${className}`}
    />
  );
};

export const SkeletonCard = ({ className = '' }) => (
  <div className={`p-4 border border-gray-200 rounded-lg space-y-3 ${className}`}>
    <div className="flex items-center space-x-3">
      <SkeletonAvatar />
      <div className="flex-1">
        <SkeletonText lines={2} />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
);

export const SkeletonForm = ({ fields = 4, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    ))}
  </div>
);

export const SkeletonProfile = ({ className = '' }) => (
  <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse ${className}`}>
    {/* Page Header */}
    <div className="mb-8">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-24"></div>
      </div>
    </div>

    {/* Profile Content */}
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      {/* Personal Information */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
        
        {/* Profile Picture */}
        <div className="flex items-start space-x-6 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
          <div className="flex-grow space-y-3">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="mt-6 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>

      {/* Resume Section */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Education Section */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Work Experience Section */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Skills Section */}
      <div className="mb-8">
        <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded w-full"></div>
      </div>

      {/* Projects Section */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-20 mb-4"></div>
        <div className="h-16 bg-gray-200 rounded w-full"></div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="mt-8 flex space-x-3">
      <div className="h-10 bg-gray-200 rounded w-24"></div>
      <div className="h-10 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
);

export default Skeleton;