import React from 'react';

/**
 * Shared AI Interview Feedback Summary Component
 * Props:
 *  - data: aiFeedback object { sentiment, confidence, summary, strengths, concerns, flags, suggestedDecisionNote, model, generatedAt }
 *  - loading: boolean
 *  - cached: boolean
 *  - error: string|null
 *  - onAnalyze: function to trigger analysis
 *  - variant: 'full' | 'compact' (layout density)
 */
const AIInterviewFeedbackSummary = ({ data, loading, cached, error, onAnalyze, variant = 'full' }) => {
  const sentimentBadge = (sentiment) => {
    if (!sentiment) return null;
    const base = "inline-flex px-2 py-0.5 rounded-full text-xs font-semibold font-['Roboto']";
    switch (sentiment) {
      case 'positive': return <span className={`${base} bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400`}>Positive</span>;
      case 'negative': return <span className={`${base} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400`}>Negative</span>;
      default: return <span className={`${base} bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300`}>Neutral</span>;
    }
  };

  return (
    <div className={`mt-6 ${variant === 'compact' ? '' : 'border-t border-gray-200 dark:border-gray-700 pt-6'}`}>
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={onAnalyze}
          disabled={loading}
          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium font-['Roboto'] border border-gray-300 dark:border-gray-600 transition-colors ${loading ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'}`}
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 mr-2 text-current" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3.536-3.536A8 8 0 114 12z" />
              </svg>
              Analyzing...
            </>
          ) : data ? 'Re-run AI' : 'Analyze with AI'}
        </button>
  {cached && (<span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-['Roboto']">Previously generated</span>)}
        {error && (<span className="text-xs text-red-600 dark:text-red-400 font-['Roboto']">{error}</span>)}
      </div>
      {data && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 dark:text-white font-['Open_Sans'] mb-4 flex items-center gap-3">
            AI Feedback Summary
            {sentimentBadge(data.sentiment)}
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto'] mb-4 leading-relaxed whitespace-pre-line">{data.summary || 'No summary produced.'}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Confidence</div>
              <div className="text-xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">{Math.round((data.confidence || 0) * 100)}%</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Strengths</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">{data.strengths?.length || 0}</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 font-['Roboto'] mb-2">Concerns</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">{data.concerns?.length || 0}</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Roboto'] mb-2">Key Strengths</h5>
              {data.strengths?.length ? (
                <ul className="space-y-1">
                  {data.strengths.map((s,i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto'] flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">None detected.</p>}
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Roboto'] mb-2">Potential Concerns</h5>
              {data.concerns?.length ? (
                <ul className="space-y-1">
                  {data.concerns.map((c,i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto'] flex items-start">
                      <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-gray-500 dark:text-gray-400 font-['Roboto']">None flagged.</p>}
            </div>
          </div>
          {data.flags?.length > 0 && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Roboto'] mb-2">Flags / Alerts</h5>
              <ul className="space-y-1">
                {data.flags.map((f,i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400 font-['Roboto'] flex items-start">
                    <span className="w-1.5 h-1.5 bg-red-400 dark:bg-red-500 rounded-full mt-1 mr-2 flex-shrink-0"></span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.suggestedDecisionNote && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Roboto'] mb-2">Suggested Decision Note</h5>
              <p className="text-sm text-gray-700 dark:text-gray-300 font-['Roboto']">{data.suggestedDecisionNote}</p>
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400 dark:text-gray-500 font-['Roboto']">Model: {data.model || 'unknown'} • {cached ? 'Cached • ' : ''}Generated {data.generatedAt ? new Date(data.generatedAt).toLocaleString() : 'now'}</p>
        </div>
      )}
    </div>
  );
};

export default AIInterviewFeedbackSummary;
