import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);

  // Mock job data - in real app, this would be fetched based on jobId
  const job = {
    id: jobId,
    title: 'Senior Software Engineer',
    company: 'Tech Co',
    location: 'Remote',
    description: 'We are seeking a highly motivated and experienced Senior Software Engineer to join our growing team. As a Senior Software Engineer, you will play a key role in designing, developing, and maintaining our core products and services. You will work closely with product managers, designers, and other engineers to deliver high-quality software solutions that meet the needs of our customers.',
    responsibilities: [
      'Design, develop, and maintain high-quality software solutions',
      'Collaborate with product managers and designers to define product requirements',
      'Participate in code reviews and ensure code quality',
      'Mentor junior engineers and provide technical guidance'
    ],
    qualifications: [
      "Bachelor's degree in Computer Science or related field",
      "5+ years of experience in software engineering",
      "Strong proficiency in Java, Python, or similar programming languages",
      "Experience with cloud platforms such as AWS, Azure, or GCP"
    ],
    benefits: [
      'Competitive salary and benefits package',
      'Health, dental, and vision insurance',
      '401(k) with company match',
      'Paid time off and holidays'
    ]
  };

  const handleApply = () => {
    navigate(`/jobs/${jobId}/apply`);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    console.log(isSaved ? 'Unsaved job:' : 'Saved job:', jobId);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/jobs" className="text-gray-500 hover:text-gray-700 font-['Roboto'] text-sm">
                  Jobs
                </Link>
              </li>
              <li>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </li>
              <li>
                <span className="text-gray-900 font-['Roboto'] text-sm font-medium">
                  {job.title}
                </span>
              </li>
            </ol>
          </nav>
        </div>

        {/* Job Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">
            {job.title}
          </h1>
          <p className="text-lg text-gray-600 font-['Roboto'] mb-6">
            {job.company} • {job.location}
          </p>
        </div>

        {/* Job Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8 mb-8">
          {/* About the job */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              About the job
            </h2>
            <p className="text-gray-700 font-['Roboto'] leading-relaxed text-base">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              Responsibilities
            </h2>
            <ul className="space-y-3">
              {job.responsibilities.map((responsibility, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2.5 mr-4"></div>
                  <span className="text-gray-700 font-['Roboto'] text-base leading-relaxed">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Qualifications */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              Qualifications
            </h2>
            <ul className="space-y-3">
              {job.qualifications.map((qualification, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2.5 mr-4"></div>
                  <span className="text-gray-700 font-['Roboto'] text-base leading-relaxed">{qualification}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 font-['Open_Sans'] mb-4">
              Benefits
            </h2>
            <ul className="space-y-3">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-2 h-2 bg-black rounded-full mt-2.5 mr-4"></div>
                  <span className="text-gray-700 font-['Roboto'] text-base leading-relaxed">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-8 flex space-x-4">
          <button
            onClick={handleApply}
            className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors"
          >
            Apply Now
          </button>
          <button
            onClick={handleSave}
            className={`border px-6 py-3 rounded-lg font-medium font-['Roboto'] transition-colors ${
              isSaved
                ? 'border-black text-black bg-gray-50'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetailsPage;
