import React, { useState } from 'react';

const FeedbackForm = ({ candidateData, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    technicalSkills: '',
    communicationSkills: '',
    problemSolving: '',
    overallFeedback: '',
    tags: [],
    rating: '',
    recommendation: '',
    strengths: '',
    improvements: '',
    notes: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const addTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.overallFeedback.trim()) {
      newErrors.overallFeedback = 'Overall feedback is required';
    }
    
    if (!formData.rating) {
      newErrors.rating = 'Rating is required';
    }
    
    if (!formData.recommendation) {
      newErrors.recommendation = 'Recommendation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const ratingOptions = [
    { value: '5', label: '5 - Excellent (Strongly Recommend)' },
    { value: '4', label: '4 - Good (Recommend)' },
    { value: '3', label: '3 - Average (Consider)' },
    { value: '2', label: '2 - Below Average (Not Recommended)' },
    { value: '1', label: '1 - Poor (Reject)' }
  ];

  const recommendationOptions = [
    { value: 'hire', label: 'Hire' },
    { value: 'maybe', label: 'Maybe (Second Interview)' },
    { value: 'no_hire', label: 'Do Not Hire' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-black font-['Open_Sans']">Interview Feedback</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Candidate Snapshot */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-black font-['Open_Sans'] mb-3">Candidate Snapshot</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700 font-['Roboto']">Name</p>
                <p className="text-sm text-black font-['Roboto']">{candidateData?.name || 'John Smith'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 font-['Roboto']">Position</p>
                <p className="text-sm text-black font-['Roboto']">{candidateData?.position || 'Software Engineer'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 font-['Roboto']">Interview Date</p>
                <p className="text-sm text-black font-['Roboto']">{candidateData?.date || new Date().toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 font-['Roboto']">Duration</p>
                <p className="text-sm text-black font-['Roboto']">{candidateData?.duration || '60 minutes'}</p>
              </div>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.rating}
              onChange={(e) => handleInputChange('rating', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm ${
                errors.rating ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a rating</option>
              {ratingOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.rating && (
              <p className="text-red-500 text-xs mt-1 font-['Roboto']">{errors.rating}</p>
            )}
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
              Recommendation <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.recommendation}
              onChange={(e) => handleInputChange('recommendation', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm ${
                errors.recommendation ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select recommendation</option>
              {recommendationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.recommendation && (
              <p className="text-red-500 text-xs mt-1 font-['Roboto']">{errors.recommendation}</p>
            )}
          </div>

          {/* Overall Feedback */}
          <div>
            <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
              Overall Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.overallFeedback}
              onChange={(e) => handleInputChange('overallFeedback', e.target.value)}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm ${
                errors.overallFeedback ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide detailed feedback about the candidate's performance..."
            />
            {errors.overallFeedback && (
              <p className="text-red-500 text-xs mt-1 font-['Roboto']">{errors.overallFeedback}</p>
            )}
          </div>

          {/* Skills Assessment Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Technical Skills */}
            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Technical Skills
              </label>
              <textarea
                value={formData.technicalSkills}
                onChange={(e) => handleInputChange('technicalSkills', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="Assess coding ability, technical knowledge, problem-solving approach..."
              />
            </div>

            {/* Communication Skills */}
            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Communication Skills
              </label>
              <textarea
                value={formData.communicationSkills}
                onChange={(e) => handleInputChange('communicationSkills', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="Evaluate clarity, articulation, ability to explain concepts..."
              />
            </div>

            {/* Problem Solving */}
            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Problem Solving
              </label>
              <textarea
                value={formData.problemSolving}
                onChange={(e) => handleInputChange('problemSolving', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="Assess analytical thinking, approach to challenges..."
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="Any other observations or comments..."
              />
            </div>
          </div>

          {/* Strengths and Areas for Improvement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Key Strengths
              </label>
              <textarea
                value={formData.strengths}
                onChange={(e) => handleInputChange('strengths', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="What did the candidate do particularly well?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
                Areas for Improvement
              </label>
              <textarea
                value={formData.improvements}
                onChange={(e) => handleInputChange('improvements', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="What areas could the candidate work on?"
              />
            </div>
          </div>

          {/* Tags/Keywords */}
          <div>
            <label className="block text-sm font-medium text-black mb-2 font-['Open_Sans']">
              Tags/Keywords
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-black font-['Roboto']"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent font-['Roboto'] text-sm"
                placeholder="e.g., Java, Problem-solving, Team player"
                onKeyPress={(e) => e.key === 'Enter' && addTag(e)}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-gray-100 text-black border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors font-['Roboto'] text-sm"
              >
                Add Tag
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-['Roboto']">
              Add relevant skills, technologies, or characteristics observed during the interview
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white text-black border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-['Roboto'] font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-['Roboto'] font-medium"
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;