import React, { useEffect, useState, useCallback, useMemo } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useToast } from '../../contexts/ToastContext';
import FeedbackForm from '../../components/interviewer/FeedbackForm';

const PendingFeedback = () => {
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [pending, setPending] = useState({ loading: true, error: null, items: [], page: 1, totalPages: 1, total: 0 });
  // Local submitting state is not required; FeedbackForm manages submission
  const { makeJsonRequest } = useApiRequest();
  const toast = useToast();
  // Deprecated local form state replaced by shared FeedbackForm
  const [sort, setSort] = useState({ field: 'daysPending', dir: 'desc' });
  const [priorityFilter, setPriorityFilter] = useState('all');

  const fetchPending = useCallback(async (page = 1, options = {}) => {
    setPending(prev => ({ ...prev, loading: true, error: null }));
    try {
      const res = await makeJsonRequest(`/api/interviewer/feedback/pending?page=${page}&limit=10`, { signal: options.signal });
      // If backend responded 304 (cached in makeJsonRequest), do not overwrite items
      if (res?.cached) {
        setPending(prev => ({ ...prev, loading: false }));
        return;
      }
      if (res?.success) {
        setPending({
          loading: false,
            error: null,
            items: res.data.interviews,
            page: res.data.pagination.currentPage,
            totalPages: res.data.pagination.totalPages,
            total: res.data.pagination.total
        });
      } else {
        throw new Error(res?.message || 'Failed to load pending feedback');
      }
    } catch (err) {
      // Ignore aborts (e.g., StrictMode double-invoke cleanup or quick route changes)
      const isAbort = err?.name === 'AbortError' || err?.code === 'ABORT_ERR' || (typeof err?.message === 'string' && err.message.toLowerCase().includes('aborted'));
      if (isAbort) {
        // Silently end loading without surfacing an error
        setPending(prev => ({ ...prev, loading: false }));
        return;
      }
      console.error('Fetch pending feedback error', err);
      toast.error(err.message || 'Failed to load pending feedback');
      setPending(prev => ({ ...prev, loading: false, error: err.message }));
    }
  }, [makeJsonRequest, toast]);

  // Initial fetch with abort on unmount; StrictMode will run this twice in dev.
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPending(1, { signal: ctrl.signal });
    return () => ctrl.abort();
  }, [fetchPending]);

  const resetForm = () => {};

  const handleSubmitSuccess = (id) => {
    // Optimistic removal from list
    setPending(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) }));
    toast.success('Feedback submitted');
    setSelectedCandidate(null);
    if (pending.items.length === 1 && pending.page < pending.totalPages) {
      fetchPending(pending.page + 1);
    }
  };

  const openFeedbackForm = (interview) => {
    if (interview.hoursRemaining && interview.hoursRemaining <= 6) {
      toast.warning(`Edit window closes in ${interview.hoursRemaining.toFixed(1)}h`);
    }
    setSelectedCandidate(interview);
  };

  const closeFeedbackForm = () => {
    setSelectedCandidate(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const getPriorityColor = (priority, days) => {
    // Invert colors for dark mode priority badges
    if (days >= 4 || priority === 'high') return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (days >= 2 || priority === 'medium') return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
  };

  const filteredSorted = useMemo(() => {
    let items = [...pending.items];
    if (priorityFilter !== 'all') {
      items = items.filter(i => i.priority === priorityFilter);
    }
    items.sort((a,b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      if (sort.field === 'candidate') return a.candidateName.localeCompare(b.candidateName) * dir;
      if (sort.field === 'priority') return a.priority.localeCompare(b.priority) * dir;
      if (sort.field === 'daysPending') return (a.daysPending - b.daysPending) * dir;
      return 0;
    });
    return items;
  }, [pending.items, sort, priorityFilter]);

  const stats = useMemo(() => {
    const items = filteredSorted;
    return {
      total: pending.total,
      high: items.filter(i => i.priority === 'high' || i.daysPending >= 4).length,
      overdue: items.filter(i => i.daysPending >= 3).length,
      avgResponse: items.length ? (items.reduce((a,i)=>a+i.daysPending,0)/items.length).toFixed(1) + 'd' : '—'
    };
  }, [filteredSorted, pending.total]);

  // Removed local StarRating; shared FeedbackForm handles rating UI

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Text inversion */}
          <h1 className="text-3xl font-bold text-black dark:text-white font-['Open_Sans']">Pending Feedback</h1>
          <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] mt-2">
            Complete feedback for interviews awaiting your evaluation
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Card inversion: bg-white -> dark:bg-gray-800, border-gray-200 -> dark:border-gray-700 */}
          {[
            { label: "Total Pending", value: stats.total, icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
            { label: "High Priority", value: stats.high, icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg> },
            { label: "Overdue (3+ days)", value: stats.overdue, icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
            { label: "Avg. Response Time", value: stats.avgResponse, icon: (props) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> }
          ].map((item, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center">
                {/* Icon wrapper inversion: bg-gray-100 -> dark:bg-gray-700, icon color -> dark:text-gray-200 */}
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  {item.icon({ className: "w-6 h-6 text-gray-700 dark:text-gray-200" })}
                </div>
                <div className="ml-4">
                  {/* Text inversion */}
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 font-['Roboto']">{item.label}</p>
                  <p className="text-2xl font-bold text-black dark:text-white font-['Open_Sans']">{item.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="flex gap-2 items-center">
            {/* Label text inversion */}
            <label className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">Priority:</label>
            {/* Select inversion: border-gray-300 -> dark:border-gray-600, text-black -> dark:text-white, bg-white -> dark:bg-gray-800 */}
            <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-['Roboto'] bg-white dark:bg-gray-800 dark:text-white">
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2 items-center">
            <label className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">Sort By:</label>
            <select value={sort.field} onChange={e=>setSort(s=>({...s, field:e.target.value}))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-['Roboto'] bg-white dark:bg-gray-800 dark:text-white">
              <option value="daysPending">Days Pending</option>
              <option value="candidate">Candidate</option>
              <option value="priority">Priority</option>
            </select>
            <button onClick={()=>setSort(s=>({...s, dir: s.dir==='asc'?'desc':'asc'}))} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-['Roboto'] bg-white dark:bg-gray-800 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              {sort.dir==='asc' ? 'Asc' : 'Desc'}
            </button>
          </div>
        </div>

        {/* Pending Interviews Table */}
        {/* Container inversion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Header inversion */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-black dark:text-white font-['Open_Sans']">Interviews Awaiting Feedback</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">Complete your evaluation for these candidates</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Table header inversion: bg-gray-50 -> dark:bg-gray-900, text-gray-500 -> dark:text-gray-400 */}
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Job Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Interview Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Days Pending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider font-['Roboto']">
                    Actions
                  </th>
                </tr>
              </thead>
              {/* Table body inversion: bg-white -> dark:bg-gray-800, divide-gray-200 -> dark:divide-gray-700 */}
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pending.loading && (
                  <PendingTableSkeleton rows={4} />
                )}
                {!pending.loading && pending.error && (
                  <tr>
                    <td colSpan={6} className="px-6 py-6">
                      {/* Error State inversion: bg-red-50 -> dark:bg-red-900, border-red-200 -> dark:border-red-700, text-red-700 -> dark:text-red-300, button colors inverted */}
                      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 p-4 rounded-lg flex items-center justify-between">
                        <span className="text-sm font-['Roboto']">{pending.error}</span>
                        <button onClick={() => fetchPending(pending.page)} className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600">Retry</button>
                      </div>
                    </td>
                  </tr>
                )}
                {!pending.loading && !pending.error && filteredSorted.map((interview) => (
                  <tr key={interview.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {/* Avatar inversion: bg-gray-200 -> dark:bg-gray-700, text-gray-700 -> dark:text-gray-200 */}
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                              {interview.candidateName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          {/* Text inversion */}
                          <div className="text-sm font-medium text-black dark:text-white font-['Open_Sans']">
                            {interview.candidateName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                            {interview.department}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white font-['Roboto']">
                      {interview.jobTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white font-['Roboto']">
                      <div>{formatDate(interview.interviewDate)}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{interview.interviewTime || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black dark:text-white font-['Roboto']">
                      {interview.interviewType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Priority badge inversion done via getPriorityColor */}
                      {interview.status === 'cancelled' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                          Cancelled
                        </span>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getPriorityColor(interview.priority, interview.daysPending)}`}>
                          {interview.daysPending} days
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {interview.status === 'cancelled' ? (
                        <span className="text-xs text-red-600 dark:text-red-400 font-['Roboto'] italic">
                          Cannot submit feedback
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => openFeedbackForm(interview)}
                            // Primary button inversion: bg-black -> dark:bg-indigo-600
                            className="bg-black text-white px-4 py-2 rounded-lg text-xs font-medium dark:bg-white dark:text-gray-900 transition-colors font-['Roboto'] cursor-pointer"
                          >
                            {interview.hasFeedback ? (interview.editable ? 'Edit Feedback' : 'View Feedback') : 'Submit Feedback'}
                          </button>
                          {interview.hasFeedback && (
                            // Secondary badge inversion
                            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-['Roboto'] font-medium border ${
                              interview.editable 
                                ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700' 
                                : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600'
                            }`}>
                              {interview.editable ? `${interview.hoursRemaining.toFixed(1)}h left` : 'Locked'}
                            </span>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!pending.loading && !pending.error && filteredSorted.length === 0 && (
            <div className="text-center py-12">
              {/* Empty State inversion */}
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white font-['Open_Sans']">All caught up!</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 font-['Roboto']">
                You don't have any pending feedback to complete.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
  {!pending.loading && pending.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            {/* Pagination button inversion */}
            <button
              disabled={pending.page <= 1}
              onClick={() => pending.page > 1 && fetchPending(pending.page - 1)}
              className={`px-4 py-2 rounded-lg text-sm font-['Roboto'] border ${pending.page <=1 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600' 
                : 'bg-white text-black hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700'}`}
            >Previous</button>
            <span className="text-sm font-['Roboto'] text-gray-600 dark:text-gray-300">Page {pending.page} of {pending.totalPages}</span>
            <button
              disabled={pending.page >= pending.totalPages}
              onClick={() => pending.page < pending.totalPages && fetchPending(pending.page + 1)}
              className={`px-4 py-2 rounded-lg text-sm font-['Roboto'] border ${pending.page >= pending.totalPages 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500 dark:border-gray-600' 
                : 'bg-white text-black hover:bg-gray-50 dark:bg-gray-800 dark:text-white dark:border-gray-700 dark:hover:bg-gray-700'}`}
            >Next</button>
          </div>
        )}

        {/* Feedback Modal */}
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {/* Modal inversion: bg-white -> dark:bg-gray-800 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header inversion: border-gray-200 -> dark:border-gray-700, sticky bg-white -> dark:bg-gray-800 */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <div>
                  {/* Text inversion */}
                  <h2 className="text-xl font-semibold text-black dark:text-white font-['Open_Sans']">
                    Interview Feedback - {selectedCandidate.candidateName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-['Roboto']">
                    {selectedCandidate.jobTitle} • {formatDate(selectedCandidate.interviewDate)}
                  </p>
                </div>
                {/* Close button inversion */}
                <button
                  onClick={closeFeedbackForm}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                  <FeedbackForm
                    interviewId={selectedCandidate.id}
                    defaultValues={selectedCandidate.existingFeedback}
                    onCancel={closeFeedbackForm}
                    onSuccess={() => handleSubmitSuccess(selectedCandidate.id)}
                  />
                </div>
              </div>

              {/* Modal Footer inversion: border-gray-200 -> dark:border-gray-700, sticky bg-white -> dark:bg-gray-800 */}
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3 sticky bottom-0 bg-white dark:bg-gray-800">
                <button
                  onClick={closeFeedbackForm}
                  // Secondary button inversion
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-['Roboto'] disabled:opacity-50 disabled:cursor-not-allowed"
                >Cancel</button>
                {/* Submit handled inside FeedbackForm */}
              </div>
            </div>
          </div>
        )}
      </div>
    </InterviewerLayout>
  );
};

// Table skeleton rows
const PendingTableSkeleton = ({ rows = 4 }) => (
  <>
    {/* Skeleton inversion: bg-gray-200 -> dark:bg-gray-700 */}
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            </div>
          </div>
        </td>
        <td className="px-6 py-4"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-40" /></td>
        <td className="px-6 py-4"><div className="space-y-2"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" /><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" /></div></td>
        <td className="px-6 py-4"><div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" /></td>
        <td className="px-6 py-4"><div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" /></td>
        <td className="px-6 py-4"><div className="flex gap-2"><div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" /><div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" /></div></td>
      </tr>
    ))}
  </>
);

export default PendingFeedback;