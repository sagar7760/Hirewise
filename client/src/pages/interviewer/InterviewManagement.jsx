import React, { useState, useEffect, useCallback, useMemo } from 'react';
import InterviewerLayout from '../../components/layout/InterviewerLayout';
import { SkeletonCard } from '../../components/common/Skeleton';
import { useApiRequest } from '../../hooks/useApiRequest';
import { useToast } from '../../contexts/ToastContext';

/**
 * Interview Management Page (Interviewer role)
 * - Fetches interviews from backend per dateRange (today | upcoming | past)
 * - Derives summary counts client-side (per requirements)
 * - Uses skeleton loading from common components
 * - Maps backend statuses to UI (scheduled -> pending, confirmed -> confirmed)
 * - Past tab shows all interviews scheduledDate < now; indicates feedback & recommendation
 */
const InterviewManagement = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [data, setData] = useState({
    today: { loading: true, error: null, items: [] },
    upcoming: { loading: true, error: null, items: [] },
    past: { loading: true, error: null, items: [] }
  });
  // Detail modal state
  const [detail, setDetail] = useState({ open: false, loading: false, error: null, interview: null });

  const { makeJsonRequest } = useApiRequest();
  const toast = useToast();

  const fetchInterviews = useCallback(async (key, dateRange) => {
    setData(prev => ({ ...prev, [key]: { ...prev[key], loading: true, error: null } }));
    try {
      const res = await makeJsonRequest(`/api/interviewer/interviews?dateRange=${dateRange}&limit=50`);
      if (res?.success) {
        setData(prev => ({ ...prev, [key]: { loading: false, error: null, items: res.data.interviews || [] } }));
      } else {
        throw new Error(res?.message || 'Failed to load interviews');
      }
    } catch (err) {
      console.error('Fetch interviews error', err);
      toast.error(err.message || 'Failed to load interviews');
      setData(prev => ({ ...prev, [key]: { ...prev[key], loading: false, error: err.message, items: [] } }));
    }
  }, [makeJsonRequest, toast]);

  // Open details modal (attempt to fetch richer details if endpoint available)
  const openInterviewDetails = useCallback(async (interview) => {
    if (!interview) return;
    const interviewId = interview.id || interview._id;
    setDetail({ open: true, loading: true, error: null, interview });
    // Attempt network fetch for full detail (non-blocking fallback to existing data on failure)
    try {
      if (interviewId) {
        const res = await makeJsonRequest(`/api/interviewer/interviews/${interviewId}`);
        if (res?.success && res.data?.interview) {
          setDetail({ open: true, loading: false, error: null, interview: { ...interview, ...res.data.interview } });
          return;
        }
      }
      // If no id or no success just use existing object
      setDetail(prev => ({ ...prev, loading: false }));
    } catch (err) {
      console.warn('Interview detail fetch failed; using cached item', err);
      setDetail(prev => ({ ...prev, loading: false, error: 'Some details may be unavailable.' }));
    }
  }, [makeJsonRequest]);

  const closeInterviewDetails = useCallback(() => setDetail({ open: false, loading: false, error: null, interview: null }), []);

  // Initial fetch with background prefetch
  useEffect(() => {
    fetchInterviews('today', 'today');
    const t1 = setTimeout(() => fetchInterviews('upcoming', 'upcoming'), 300);
    const t2 = setTimeout(() => fetchInterviews('past', 'past'), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [fetchInterviews]);

  // Derived & mapped summary
  const summary = useMemo(() => {
    const mapStatus = s => {
      if (s === 'scheduled') return 'pending';
      if (s === 'confirmed') return 'confirmed';
      return s; // keep others
    };
    const decorate = arr => arr.map(i => ({ ...i, uiStatus: mapStatus(i.status) }));
    const todayItems = decorate(data.today.items);
    const upcomingItems = decorate(data.upcoming.items);
    const pastItems = decorate(data.past.items);
    return {
      today: {
        total: todayItems.length,
        confirmed: todayItems.filter(i => i.uiStatus === 'confirmed').length,
        pending: todayItems.filter(i => i.uiStatus === 'pending').length,
        items: todayItems
      },
      upcoming: {
        total: upcomingItems.length,
        confirmed: upcomingItems.filter(i => i.uiStatus === 'confirmed').length,
        pending: upcomingItems.filter(i => i.uiStatus === 'pending').length,
        thisWeek: upcomingItems.filter(i => {
          const now = new Date();
          const week = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          return new Date(i.scheduledDate) <= week;
        }).length,
        items: upcomingItems
      },
      past: {
        total: pastItems.length,
        recommended: pastItems.filter(i => ['strongly_recommend', 'recommend'].includes(i.feedback?.recommendation)).length,
        notRecommended: pastItems.filter(i => ['do_not_recommend', 'strongly_do_not_recommend'].includes(i.feedback?.recommendation)).length,
        avgRating: pastItems.length ? (pastItems.reduce((a, i) => a + (i.feedback?.overallRating || 0), 0) / pastItems.length).toFixed(1) : '0.0',
        items: pastItems
      }
    };
  }, [data]);

  const tabs = [
    { id: 'today', name: "Today's Interviews", icon: 'today' },
    { id: 'upcoming', name: 'Upcoming Interviews', icon: 'calendar' },
    { id: 'past', name: 'Past Interviews', icon: 'history' }
  ];

  const getTabIcon = (iconType) => {
    switch (iconType) {
      case 'today':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'calendar':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'history':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'today') {
      return <TodaysInterviewsContent section={summary.today} rawState={data.today} onRetry={() => fetchInterviews('today', 'today')} onOpenDetails={openInterviewDetails} />;
    }
    if (activeTab === 'upcoming') {
      return <UpcomingInterviewsContent section={summary.upcoming} rawState={data.upcoming} onRetry={() => fetchInterviews('upcoming', 'upcoming')} onOpenDetails={openInterviewDetails} />;
    }
    return <PastInterviewsContent section={summary.past} rawState={data.past} onRetry={() => fetchInterviews('past', 'past')} onOpenDetails={openInterviewDetails} />;
  };

  return (
    <InterviewerLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Open_Sans']">Interview Management</h1>
          <p className="text-gray-600 font-['Roboto'] mt-2">Manage your interview schedule and review completed interviews</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors font-['Roboto'] ${
                    activeTab === tab.id
                      ? 'border-black text-black'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getTabIcon(tab.icon)}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="p-0">{renderTabContent()}</div>
        </div>
      </div>
      {detail.open && (
        <InterviewDetailModal detail={detail} onClose={closeInterviewDetails} />
      )}
    </InterviewerLayout>
  );
};

// ------------------------- Today -------------------------
const TodaysInterviewsContent = ({ section, rawState, onRetry, onOpenDetails }) => {
  const { loading, error } = rawState;
  const todaysInterviews = section.items;

  const getStatusColor = (status) => {
    if (status === 'confirmed') return 'bg-gray-100 text-gray-700';
    if (status === 'pending') return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-700';
  };
  const getStatusText = (status) => status === 'confirmed' ? 'Confirmed' : status === 'pending' ? 'Pending' : status;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 px-6 pt-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <SummaryCard label="Total Today" value={section.total} icon="calendar" />
            <SummaryCard label="Confirmed" value={section.confirmed} icon="check" />
            <SummaryCard label="Pending" value={section.pending} icon="clock" />
          </>
        )}
      </div>
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">Today's Schedule ({section.total} interviews)</h2>
        {loading && <div className="space-y-4"><LoadingListSkeleton count={3} /></div>}
        {error && !loading && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && (
          <div className="space-y-4">
            {todaysInterviews.map(interview => (
              <InterviewRow
                key={interview.id || interview._id}
                interview={interview}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                onViewDetails={() => onOpenDetails(interview)}
              />
            ))}
          </div>
        )}
        {!loading && !error && todaysInterviews.length === 0 && <EmptyState title="No interviews today" message="You have a free day with no scheduled interviews." />}
      </div>
    </div>
  );
};

// ------------------------- Upcoming -------------------------
const UpcomingInterviewsContent = ({ section, rawState, onRetry, onOpenDetails }) => {
  const { loading, error } = rawState;
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const upcomingInterviews = section.items;

  const filtered = upcomingInterviews.filter(i => {
    const term = searchTerm.toLowerCase();
    const matches = (i.candidate || '').toLowerCase().includes(term) || (i.job || '').toLowerCase().includes(term);
    if (filter === 'all') return matches;
    if (filter === 'confirmed') return matches && i.uiStatus === 'confirmed';
    if (filter === 'pending') return matches && i.uiStatus === 'pending';
    return matches;
  });

  const getStatusColor = (status) => status === 'confirmed' ? 'bg-gray-100 text-gray-700' : status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700';
  const getStatusText = (status) => status === 'confirmed' ? 'Confirmed' : status === 'pending' ? 'Pending' : status;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 px-6 pt-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <SummaryCard label="Total Upcoming" value={section.total} icon="calendar" />
            <SummaryCard label="Confirmed" value={section.confirmed} icon="check" />
            <SummaryCard label="Pending" value={section.pending} icon="clock" />
            <SummaryCard label="This Week" value={section.thisWeek} icon="week" />
          </>
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by candidate name or job title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            <div className="flex gap-2">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black bg-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Interviews</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending Confirmation</option>
              </select>
            </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">Upcoming Interviews ({filtered.length})</h2>
        {loading && <div className="space-y-4"><LoadingListSkeleton count={4} /></div>}
        {error && !loading && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && (
          <div className="space-y-4">
            {filtered.map(interview => (
              <InterviewRow
                key={interview.id || interview._id}
                interview={interview}
                getStatusColor={getStatusColor}
                getStatusText={getStatusText}
                onViewDetails={() => onOpenDetails(interview)}
              />
            ))}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && <EmptyState title="No upcoming interviews found" message={searchTerm ? 'Try adjusting your search criteria.' : 'You don\'t have any upcoming interviews scheduled.'} />}
      </div>
    </div>
  );
};

// ------------------------- Past -------------------------
const PastInterviewsContent = ({ section, rawState, onRetry, onOpenDetails }) => {
  const { loading, error } = rawState;
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const pastInterviews = section.items;

  const filtered = pastInterviews.filter(i => {
    const term = searchTerm.toLowerCase();
    const matches = (i.candidate || '').toLowerCase().includes(term) || (i.job || '').toLowerCase().includes(term);
    const rec = i.feedback?.recommendation;
    if (filter === 'all') return matches;
    if (filter === 'recommended') return matches && ['strongly_recommend', 'recommend'].includes(rec);
    if (filter === 'not-recommended') return matches && ['do_not_recommend', 'strongly_do_not_recommend'].includes(rec);
    return matches;
  });

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'strongly_recommend':
      case 'recommend':
        return 'bg-gray-100 text-gray-700';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800';
      case 'do_not_recommend':
      case 'strongly_do_not_recommend':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };
  const getRecommendationText = (rec) => {
    switch (rec) {
      case 'strongly_recommend': return 'Strong Hire';
      case 'recommend': return 'Hire';
      case 'neutral': return 'Maybe';
      case 'do_not_recommend': return 'No Hire';
      case 'strongly_do_not_recommend': return 'Strong No Hire';
      default: return 'Pending';
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 px-6 pt-6">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <SummaryCard label="Total Completed" value={section.total} icon="check" />
            <SummaryCard label="Recommended" value={section.recommended} icon="thumb-up" />
            <SummaryCard label="Not Recommended" value={section.notRecommended} icon="thumb-down" />
            <SummaryCard label="Avg. Rating" value={section.avgRating} icon="star" />
          </>
        )}
      </div>

      <div className="bg-gray-50 border-t border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by candidate name or job title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent font-['Roboto'] text-black bg-white"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Interviews</option>
              <option value="recommended">Recommended</option>
              <option value="not-recommended">Not Recommended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-black font-['Open_Sans'] mb-4">Interview History ({filtered.length})</h2>
        {loading && <div className="space-y-4"><LoadingListSkeleton count={4} /></div>}
        {error && !loading && <ErrorState message={error} onRetry={onRetry} />}
        {!loading && !error && (
          <div className="space-y-4">
            {filtered.map(interview => (
              <div key={interview.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 flex-shrink-0">
                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-700">{interview.candidate?.split(' ').map(n => n[0]).join('')}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-medium text-black font-['Open_Sans']">{interview.candidate}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getRecommendationColor(interview.feedback?.recommendation)}`}>
                            {getRecommendationText(interview.feedback?.recommendation)}
                          </span>
                        </div>
                        <p className="text-gray-600 font-['Roboto'] mb-3">{interview.job}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Date:</span>
                            <p className="text-black font-['Roboto'] font-medium">{formatDisplayDate(interview.scheduledDate)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Time:</span>
                            <p className="text-black font-['Roboto'] font-medium">{formatDisplayTime(interview.scheduledDate, interview.scheduledTime)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Type:</span>
                            <p className="text-black font-['Roboto'] font-medium">{interview.type}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 font-['Roboto']">Rating:</span>
                            <StarDisplay rating={interview.feedback?.overallRating} />
                          </div>
                        </div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 font-['Roboto'] line-clamp-2"><span className="font-medium">Notes:</span> {interview.notes || interview.feedback?.additionalNotes || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 ml-4">
                    <button
                      className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors font-['Roboto']"
                      onClick={() => onOpenDetails(interview)}
                    >View Details</button>
                    <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">View Feedback</button>
                    <button className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']">Export</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && !error && filtered.length === 0 && <EmptyState title="No interviews found" message={searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t completed any interviews yet.'} />}
      </div>
    </div>
  );
};

// ------------------------- Shared Components -------------------------
const SummaryCard = ({ label, value, icon }) => {
  const iconSvg = () => {
    switch (icon) {
      case 'check':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'clock':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'calendar':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      case 'week':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M7 6h.01M7 18h.01M12 6h.01M12 18h.01M17 6h.01M17 18h.01" /></svg>;
      case 'thumb-up':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>;
      case 'thumb-down':
        return <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.737 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M17 4h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" /></svg>;
      case 'star':
        return <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>;
      default:
        return null;
    }
  };
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center">
        <div className="p-3 bg-gray-100 rounded-lg">{iconSvg()}</div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 font-['Roboto']">{label}</p>
          <p className="text-2xl font-bold text-black font-['Open_Sans']">{value}</p>
        </div>
      </div>
    </div>
  );
};

const InterviewRow = ({ interview, getStatusColor, getStatusText, onViewDetails }) => (
  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 flex-shrink-0">
            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-lg font-medium text-gray-700">{interview.candidate?.split(' ').map(n => n[0]).join('')}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-medium text-black font-['Open_Sans']">{interview.candidate}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full font-['Roboto'] ${getStatusColor(interview.uiStatus)}`}>{getStatusText(interview.uiStatus)}</span>
            </div>
            <p className="text-gray-600 font-['Roboto'] mb-2">{interview.job}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-['Roboto']">Time:</span>
                <p className="text-black font-['Roboto'] font-medium">{formatDisplayTime(interview.scheduledDate, interview.scheduledTime)}</p>
                <p className="text-gray-500 text-xs font-['Roboto']">{interview.duration} min</p>
              </div>
              <div>
                <span className="text-gray-500 font-['Roboto']">Type:</span>
                <p className="text-black font-['Roboto'] font-medium">{interview.type}</p>
              </div>
              <div>
                <span className="text-gray-500 font-['Roboto']">Department:</span>
                <p className="text-black font-['Roboto'] font-medium">{interview.jobDepartment || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2 ml-4">
        <button
          className={`px-4 py-2 rounded-lg text-sm font-medium font-['Roboto'] ${interview.meetingLink ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
          onClick={() => interview.meetingLink && window.open(interview.meetingLink, '_blank')}
          disabled={!interview.meetingLink}
        >
          Join Meeting
        </button>
        <button
          onClick={onViewDetails}
          className="bg-white text-black border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors font-['Roboto']"
        >View Details</button>
      </div>
    </div>
  </div>
);

const LoadingListSkeleton = ({ count = 3 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-40" />
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="grid grid-cols-3 gap-4">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </>
);

const ErrorState = ({ message, onRetry }) => (
  <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg text-sm font-['Roboto']">
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium mb-1">Failed to load data</p>
        <p>{message}</p>
      </div>
      <button onClick={onRetry} className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-medium hover:bg-red-700">Retry</button>
    </div>
  </div>
);

const EmptyState = ({ title, message }) => (
  <div className="text-center py-12">
    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
    <h3 className="mt-2 text-sm font-medium text-black font-['Open_Sans']">{title}</h3>
    <p className="mt-1 text-sm text-gray-500 font-['Roboto']">{message}</p>
  </div>
);

const StarDisplay = ({ rating }) => {
  const val = rating || 0;
  return (
    <div className="flex items-center">
      {[1,2,3,4,5].map(star => (
        <svg key={star} className={`w-4 h-4 ${star <= val ? 'text-gray-700' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

const formatDisplayDate = (dateString, includeYear = false) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', ...(includeYear ? { year: 'numeric' } : {}) });
};

const formatDisplayTime = (dateString, timeStr) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (timeStr && timeStr.includes(':')) {
    const [hh, mm] = timeStr.split(':');
    d.setHours(parseInt(hh, 10), parseInt(mm, 10));
  }
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// ------------------------- Detail Modal -------------------------
const InterviewDetailModal = ({ detail, onClose }) => {
  const { interview, loading, error } = detail;
  if (!interview) return null;

  const uiStatus = interview.uiStatus || (interview.status === 'scheduled' ? 'pending' : interview.status);
  const rec = interview.feedback?.recommendation;
  const recommendationMap = {
    strongly_recommend: 'Strong Hire',
    recommend: 'Hire',
    neutral: 'Maybe',
    do_not_recommend: 'No Hire',
    strongly_do_not_recommend: 'Strong No Hire'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-xl shadow-lg border border-gray-200 relative animate-fadeIn">
        <button
          onClick={onClose}
            aria-label="Close"
          className="absolute top-3 right-3 text-gray-500 hover:text-black focus:outline-none"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-black font-['Open_Sans']">Interview Details</h2>
          <p className="text-sm text-gray-500 font-['Roboto'] mt-1">Comprehensive information for this interview</p>
        </div>
        <div className="p-6 space-y-6">
          {loading && (
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-1/3" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded" />)}
              </div>
            </div>
          )}
          {!loading && (
            <>
              {error && <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-3 py-2 rounded">{error}</div>}
              <div>
                <h3 className="text-lg font-medium font-['Open_Sans'] text-black flex items-center gap-2">
                  <span>{interview.candidate}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-['Roboto'] capitalize ${uiStatus === 'confirmed' ? 'bg-gray-100 text-gray-700' : uiStatus === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-700'}`}>{uiStatus}</span>
                </h3>
                <p className="text-sm text-gray-600 font-['Roboto'] mt-1">{interview.job}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailField label="Date" value={formatDisplayDate(interview.scheduledDate, true)} />
                <DetailField label="Time" value={formatDisplayTime(interview.scheduledDate, interview.scheduledTime)} />
                <DetailField label="Duration" value={(interview.duration ? `${interview.duration} min` : '—')} />
                <DetailField label="Type" value={interview.type || '—'} />
                <DetailField label="Department" value={interview.jobDepartment || '—'} />
                <DetailField label="Meeting Link" value={interview.meetingLink ? <button onClick={() => window.open(interview.meetingLink,'_blank')} className="text-black underline hover:opacity-80">Open</button> : '—'} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-black font-['Open_Sans']">Feedback</h4>
                {interview.feedback ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-2">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <DetailMini label="Recommendation" value={recommendationMap[rec] || 'Pending'} />
                      <DetailMini label="Rating" value={interview.feedback.overallRating != null ? `${interview.feedback.overallRating}/5` : '—'} />
                      <DetailMini label="Experience" value={interview.feedback.candidateExperienceRating != null ? `${interview.feedback.candidateExperienceRating}/5` : '—'} />
                    </div>
                    {interview.feedback.additionalNotes && (
                      <p className="text-xs text-gray-700 font-['Roboto']"><span className="font-semibold">Notes: </span>{interview.feedback.additionalNotes}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 font-['Roboto']">No feedback submitted yet.</p>
                )}
              </div>
              {interview.application && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-black font-['Open_Sans']">Application Snapshot</h4>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 text-xs space-y-1 font-['Roboto']">
                    <p><span className="font-medium">Job ID:</span> {interview.application.job || '—'}</p>
                    <p><span className="font-medium">Stage:</span> {interview.application.stage || '—'}</p>
                    {interview.application.resumeScore && <p><span className="font-medium">Resume Score:</span> {interview.application.resumeScore}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          {interview.meetingLink && (
            <button
              onClick={() => window.open(interview.meetingLink, '_blank')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-black text-white hover:bg-gray-800 font-['Roboto']"
            >Join Meeting</button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-black hover:bg-gray-100 font-['Roboto']"
          >Close</button>
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }) => (
  <div className="text-sm font-['Roboto']">
    <p className="text-gray-500">{label}</p>
    <p className="text-black font-medium break-words">{value || '—'}</p>
  </div>
);

const DetailMini = ({ label, value }) => (
  <div className="text-xs font-['Roboto']">
    <p className="text-gray-500">{label}</p>
    <p className="text-black font-medium">{value || '—'}</p>
  </div>
);

export default InterviewManagement;
