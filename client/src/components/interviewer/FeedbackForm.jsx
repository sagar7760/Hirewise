import React, { useMemo, useState } from 'react';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useToast } from '../../contexts/ToastContext';

/**
 * Shared Feedback Form (headless; no modal chrome)
 * Canonical fields aligned with Pending Feedback module.
 * Ratings scale: 1–5. Excludes communication and cultural fit per clarifications.
 * Persists to POST /api/interviewer/interviews/:id/feedback
 */
const FeedbackForm = ({ interviewId, defaultValues, onSuccess, onCancel }) => {
  const { makeJsonRequest } = useApiRequest();
  const toast = useToast();

  const [form, setForm] = useState({
    overallRating: clamp1to5(defaultValues?.overallRating ?? 3),
    technicalSkills: clamp1to5(defaultValues?.technicalSkills ?? 3),
    problemSolving: clamp1to5(defaultValues?.problemSolving ?? 3),
    candidateExperienceRating: clamp1to5(defaultValues?.candidateExperienceRating ?? 3),
    strengths: (defaultValues?.strengths ?? []).join('\n'),
    improvements: (defaultValues?.weaknesses ?? []).join('\n'),
    recommendation: toClientRecommendation(defaultValues?.recommendation) ?? 'maybe',
    detailedFeedback: defaultValues?.additionalNotes ?? ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const isValid = useMemo(() => (
    form.overallRating && form.technicalSkills && form.problemSolving && form.candidateExperienceRating && form.recommendation
  ), [form]);

  const handleStar = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const handleChange = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const submit = async (e) => {
    e?.preventDefault?.();
    if (submitting || !interviewId) return;
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = buildPayload(form);
      const res = await makeJsonRequest(`/api/interviewer/interviews/${interviewId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res?.success) throw new Error(res?.message || 'Failed to submit feedback');
      const apiFeedback = res?.data?.feedback ?? {
        overallRating: payload.overallRating,
        technicalSkills: payload.technicalSkills,
        problemSolving: payload.problemSolving,
        candidateExperienceRating: payload.candidateExperienceRating,
        recommendation: payload.recommendation,
        strengths: payload.strengths,
        weaknesses: payload.weaknesses,
        additionalNotes: payload.additionalNotes,
        submittedAt: new Date().toISOString()
      };
      setSuccess('Feedback submitted');
      toast?.success?.('Feedback submitted');
      onSuccess?.(apiFeedback);
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length) setError(apiErrors.map(e => e.message).join(', '));
      else setError(err.message || 'Failed to submit feedback');
      toast?.error?.(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <div className="mb-2 p-2 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700 text-xs">{error}</div>}
      {success && <div className="mb-2 p-2 rounded bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-700 text-xs">{success}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <StarField label="Overall Rating" value={form.overallRating} onChange={(v)=>handleStar('overallRating', v)} />
        <StarField label="Technical Skills" value={form.technicalSkills} onChange={(v)=>handleStar('technicalSkills', v)} />
        <StarField label="Problem Solving" value={form.problemSolving} onChange={(v)=>handleStar('problemSolving', v)} />
        <StarField label="Candidate Experience" value={form.candidateExperienceRating} onChange={(v)=>handleStar('candidateExperienceRating', v)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Strengths (one per line)</Label>
          <textarea rows={3} value={form.strengths} onChange={(e)=>handleChange('strengths', e.target.value)} placeholder="e.g., Strong JS fundamentals\nGreat code readability" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400" />
        </div>
        <div>
          <Label>Improvements (one per line)</Label>
          <textarea rows={3} value={form.improvements} onChange={(e)=>handleChange('improvements', e.target.value)} placeholder="e.g., Needs more testing discipline" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>Recommendation</Label>
          <select value={form.recommendation} onChange={(e)=>handleChange('recommendation', e.target.value)} className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700">
            <option value="strong-hire">Strong Hire</option>
            <option value="hire">Hire</option>
            <option value="maybe">Maybe</option>
            <option value="no-hire">No Hire</option>
            <option value="strong-no-hire">Strong No Hire</option>
          </select>
        </div>
        <div>
          <Label>Additional Notes</Label>
          <input type="text" value={form.detailedFeedback} onChange={(e)=>handleChange('detailedFeedback', e.target.value)} placeholder="Optional quick summary" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded text-sm bg-white border border-gray-300 text-black hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700">Cancel</button>
        )}
        <button type="submit" disabled={submitting || !isValid} className={`px-4 py-2 rounded text-sm text-white dark:text-black ${(!isValid || submitting) ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200'}`}>
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
};

const StarField = ({ label, value, onChange }) => {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex items-center gap-1">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            onClick={()=>onChange(n)}
            className={`p-1 ${n <= value ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
            aria-label={`${label} ${n}`}
            title={`${label} ${n}`}
          >
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
};

const Label = ({ children }) => (
  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{children}</label>
);

function buildPayload(form) {
  return {
    overallRating: clamp1to5Int(form.overallRating),
    technicalSkills: clamp1to5Int(form.technicalSkills),
    problemSolving: clamp1to5Int(form.problemSolving),
    candidateExperienceRating: clamp1to5Int(form.candidateExperienceRating),
    strengths: parseList(form.strengths),
    weaknesses: parseList(form.improvements),
    recommendation: mapRecommendation(form.recommendation),
    additionalNotes: form.detailedFeedback || undefined
  };
}

function parseList(text) {
  if (!text) return [];
  return text
    .split(/\r?\n|,/)
    .map(s => s.trim())
    .filter(Boolean);
}

function mapRecommendation(val) {
  return ({
    'strong-hire': 'strongly_recommend',
    'hire': 'recommend',
    'maybe': 'neutral',
    'no-hire': 'do_not_recommend',
    'strong-no-hire': 'strongly_do_not_recommend'
  })[val] || 'neutral';
}

function toClientRecommendation(val) {
  const map = {
    strongly_recommend: 'strong-hire',
    recommend: 'hire',
    neutral: 'maybe',
    do_not_recommend: 'no-hire',
    strongly_do_not_recommend: 'strong-no-hire'
  };
  return map[val] || 'maybe';
}

function clamp1to5(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 3;
  return Math.max(1, Math.min(5, n));
}
function clamp1to5Int(v) { return Math.round(clamp1to5(v)); }

export default FeedbackForm;