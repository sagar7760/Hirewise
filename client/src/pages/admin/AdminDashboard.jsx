import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/AdminLayout';
import { useApiRequest } from '../../hooks/useApiRequest';
import { smartCacheSet, isStorageAvailable } from '../../utils/cacheManager';

// Clean rebuilt Admin Dashboard implementing accepted features only.
// Accepted features: funnel below chart, multi-series chart (applications, shortlisted, hired, selected),
// caching (30s), auto-refresh toggle (60s), secondary stats, reports action card.

const CACHE_KEY = 'hirewise_admin_dashboard_overview';
const CACHE_FRESH_MS = 30_000;
const AUTO_REFRESH_MS = 60_000;

const AdminDashboard = () => {
  const { makeJsonRequest } = useApiRequest();
  const navigate = useNavigate();

  // Data state
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // UI state
  const [months, setMonths] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShortlisted, setShowShortlisted] = useState(true);
  const [showHired, setShowHired] = useState(true);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const intervalRef = useRef(null);

  const maxApplications = useMemo(() => trend.reduce((m,t)=>Math.max(m, t.applications||0),0)||1,[trend]);
  const maxSelected = useMemo(() => trend.reduce((m,t)=>Math.max(m, t.selected||0, t.shortlisted||0, t.hired||0),0)||1,[trend]);

  const formatRelative = (iso) => {
    try { const d=new Date(iso); const diff=Date.now()-d.getTime(); const m=Math.floor(diff/60000); if(m<1) return 'just now'; if(m<60) return `${m}m ago`; const h=Math.floor(m/60); if(h<24) return `${h}h ago`; const dys=Math.floor(h/24); return `${dys}d ago`; } catch { return ''; }
  };

  // Hydrate from cache + fetch
  useEffect(() => {
    let used = false;
    if (isStorageAvailable()) {
      try {
        const raw = localStorage.getItem(CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
            if (parsed && parsed.months === months && (Date.now() - parsed.timestamp) < CACHE_FRESH_MS) {
            setStats(parsed.data.stats);
            setTrend(parsed.data.trend || []);
            setRecentActivity(parsed.data.recentActivity || []);
            setLoading(false);
            used = true;
          }
        }
      } catch { /* ignore */ }
    }
    fetchOverview(used);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months]);

  // Auto refresh
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchOverview(true), AUTO_REFRESH_MS);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh]);

  const fetchOverview = async (silent=false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const data = await makeJsonRequest(`/api/admin/dashboard/overview?months=${months}`);
      if (data) {
        setStats(data.stats);
        setTrend(data.trend || []);
        setRecentActivity(data.recentActivity || []);
        if (isStorageAvailable()) smartCacheSet(CACHE_KEY, JSON.stringify({ months, data, timestamp: Date.now() }));
      }
    } catch (e) {
      setError(e?.message || 'Failed to fetch overview');
    } finally { if (!silent) setLoading(false); }
  };

  const iconWrap = (d) => (
    <div className="bg-gray-100 p-2 rounded-full">
      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
      </svg>
    </div>
  );
  const getActivityIcon = (t) => {
    switch(t){
      case 'job_posted': return iconWrap('M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6');
      case 'application_update': return iconWrap('M5 13l4 4L19 7');
      case 'candidate_selected': return iconWrap('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z');
      case 'hr_added': return iconWrap('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z');
      case 'interviewer_added': return iconWrap('M8 7a4 4 0 118 0v0M5.5 21a6.5 6.5 0 0113 0');
      case 'interview_scheduled': return iconWrap('M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z');
      default: return iconWrap('M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-['Open_Sans'] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 font-['Roboto']">Manage your organization's hiring process and team members.</p>
        </div>

        {/* Primary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {loading && !stats ? Array.from({length:4}).map((_,i)=>(
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 w-6 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
              <div className="h-6 bg-gray-300 rounded w-1/3" />
            </div>
          )) : (
            [
              {label:'Total Jobs', value:stats?.totalJobs??0, path:'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6'},
              {label:'Total Candidates', value:stats?.totalCandidates??0, path:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0 a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'},
              {label:'Total HRs', value:stats?.totalHRs??0, path:'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'},
              {label:'Total Interviewers', value:stats?.totalInterviewers??0, path:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'}
            ].map(c => (
              <div key={c.label} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="bg-gray-100 p-3 rounded-lg"><svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={c.path}/></svg></div>
                  <div className="ml-4"><p className="text-sm font-medium text-gray-600 font-['Roboto']">{c.label}</p><p className="text-2xl font-bold text-gray-900 font-['Open_Sans']">{c.value}</p></div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Secondary Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-xs tracking-wide uppercase text-gray-500 font-['Roboto'] mb-1">Shortlisted</p><p className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">{stats.shortlistedCandidates??0}</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-xs tracking-wide uppercase text-gray-500 font-['Roboto'] mb-1">Hired</p><p className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">{stats.selectedCandidates??0}</p></div>
            <div className="bg-white rounded-lg border border-gray-200 p-5"><p className="text-xs tracking-wide uppercase text-gray-500 font-['Roboto'] mb-1">Pending Apps</p><p className="text-2xl font-semibold text-gray-900 font-['Open_Sans']">{stats.pendingApplications??0}</p></div>
          </div>
        )}

        {/* Error */}
        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-['Roboto'] flex items-start justify-between"><div className="pr-4">{error}</div><button onClick={()=>fetchOverview()} className="text-red-600 underline">Retry</button></div>}

        {/* Chart + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Chart */}
            <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans']">Applications Trend</h3>
              <div className="flex items-center gap-3 flex-wrap">
                <select value={months} onChange={e=>setMonths(parseInt(e.target.value)||6)} className="px-2 py-1 border border-gray-300 rounded text-sm font-['Roboto']"><option value={3}>Last 3 months</option><option value={6}>Last 6 months</option><option value={12}>Last 12 months</option></select>
                <button onClick={()=>fetchOverview()} className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 font-['Roboto']">Refresh</button>
                <button onClick={()=>setAutoRefresh(a=>!a)} className={`px-3 py-1.5 text-sm rounded font-['Roboto'] border ${autoRefresh?'bg-white text-gray-800 hover:bg-gray-50':'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'}`}>{autoRefresh?'Pause Auto':'Resume Auto'}</button>
                <div className="hidden md:flex items-center gap-2 ml-2">
                  <label className="flex items-center gap-1 text-xs text-gray-600 font-['Roboto'] cursor-pointer"><input type="checkbox" checked={showShortlisted} onChange={()=>setShowShortlisted(s=>!s)}/> SL</label>
                  <label className="flex items-center gap-1 text-xs text-gray-600 font-['Roboto'] cursor-pointer"><input type="checkbox" checked={showHired} onChange={()=>setShowHired(s=>!s)}/> Hired</label>
                </div>
              </div>
            </div>
            <div className="h-72 relative">
              {loading && trend.length===0 ? <div className="absolute inset-0 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-gray-700 rounded-full"/></div> : (
                <svg className="w-full h-full" viewBox="0 0 800 260" preserveAspectRatio="none" onMouseLeave={()=>setHoverPoint(null)}>
                  <line x1="40" y1="10" x2="40" y2="230" stroke="#d1d5db" strokeWidth="1"/>
                  <line x1="40" y1="230" x2="790" y2="230" stroke="#d1d5db" strokeWidth="1"/>
                  {Array.from({length:5}).map((_,i)=>{const y=230-(i+1)*(220/5);return <line key={i} x1="40" y1={y} x2="790" y2={y} stroke="#f1f5f9" strokeWidth="1"/>})}
                  {trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));return <text key={t.month} x={x} y={250} textAnchor="middle" fontSize="10" fill="#475569" fontFamily="Roboto">{t.month.slice(5)}</text>})}
                  {trend.length>0 && (()=>{const pts=trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));const y=230-(t.applications/maxApplications)*200;return {x,y};});const d=['M',pts[0].x,pts[0].y,...pts.slice(1).flatMap(p=>['L',p.x,p.y]),'L',pts[pts.length-1].x,230,'L',pts[0].x,230,'Z'].join(' ');return <path d={d} fill="url(#appsGradient)" stroke="none"/>})()}
                  {showShortlisted && trend.length>0 && (()=>{const pts=trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));const y=230-((t.shortlisted||0)/maxSelected)*200;return {x,y,m:t.month};});const d=['M',pts[0].x,pts[0].y,...pts.slice(1).flatMap(p=>['L',p.x,p.y])].join(' ');return <g><path d={d} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>{pts.map(p=><circle key={p.m} cx={p.x} cy={p.y} r={3} fill="#6366f1" stroke="#fff" strokeWidth={1}/> )}</g>})()}
                  {trend.length>0 && (()=>{const pts=trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));const y=230-((t.selected||0)/maxSelected)*200;return {x,y};});const d=['M',pts[0].x,pts[0].y,...pts.slice(1).flatMap(p=>['L',p.x,p.y])].join(' ');return <path d={d} fill="none" stroke="#111827" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>})()}
                  {showHired && trend.length>0 && (()=>{const pts=trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));const y=230-((t.hired||0)/maxSelected)*200;return {x,y,m:t.month};});const d=['M',pts[0].x,pts[0].y,...pts.slice(1).flatMap(p=>['L',p.x,p.y])].join(' ');return <g><path d={d} fill="none" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 4"/>{pts.map(p=><circle key={p.m} cx={p.x} cy={p.y} r={3} fill="#10b981" stroke="#fff" strokeWidth={1}/> )}</g>})()}
                  {trend.map((t,i)=>{const x=40+i*(750/(Math.max(trend.length-1,1)));const y=230-((t.selected||0)/maxSelected)*200;return <g key={t.month} onMouseEnter={()=>setHoverPoint({x,month:t.month,applications:t.applications,shortlisted:t.shortlisted||0,hired:t.hired||0,selected:t.selected||0})}><circle cx={x} cy={y} r={4} fill="#111827" stroke="#fff" strokeWidth={1.5}/><rect x={x-10} y={10} width={20} height={220} fill="transparent"/></g>})}
                  <defs><linearGradient id="appsGradient" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#374151" stopOpacity="0.35"/><stop offset="80%" stopColor="#374151" stopOpacity="0.05"/></linearGradient></defs>
                </svg>
              )}
              {hoverPoint && <div className="absolute pointer-events-none bg-white border border-gray-200 shadow-sm rounded-md px-3 py-2 text-xs font-['Roboto']" style={{left:Math.min(Math.max(hoverPoint.x-60,0),740),top:8}}><div className="font-semibold text-gray-800 mb-1">{hoverPoint.month}</div><div className="text-gray-600">Applications: <span className="font-medium text-gray-900">{hoverPoint.applications}</span></div>{showShortlisted && <div className="text-gray-600">Shortlisted: <span className="font-medium text-indigo-600">{hoverPoint.shortlisted}</span></div>}{showHired && <div className="text-gray-600">Hired: <span className="font-medium text-emerald-600">{hoverPoint.hired}</span></div>}<div className="text-gray-600">Selected Combo: <span className="font-medium text-gray-900">{hoverPoint.selected}</span></div></div>}
              <div className="absolute top-2 right-2 flex flex-wrap gap-4 bg-white/70 backdrop-blur px-3 py-1 rounded text-xs text-gray-600 font-['Roboto']"><span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-700 inline-block"/> Apps</span>{showShortlisted && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-500 inline-block"/> Shortlisted</span>}{showHired && <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"/> Hired</span>}<span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-900 inline-block"/> Selected</span></div>
            </div>
            {stats && stats.totalCandidates>0 && (()=>{const total=stats.totalCandidates||0;const sl=stats.shortlistedCandidates||0;const hired=stats.selectedCandidates||0;const slR=total?Math.round((sl/total)*100):0;const hR=total?Math.round((hired/total)*100):0;return <div className="mt-8 bg-white/95 border border-gray-100 rounded-lg p-5"><div className="flex items-center justify-between mb-4 flex-wrap gap-4"><h3 className="text-sm font-semibold text-gray-900 font-['Open_Sans'] tracking-wide uppercase">Conversion Funnel</h3><div className="flex gap-4 text-[11px] font-['Roboto']"><span className="flex items-center gap-1 text-gray-600"><span className="w-2 h-2 rounded-full bg-indigo-500"/> Shortlist: <strong className="text-gray-900">{slR}%</strong></span><span className="flex items-center gap-1 text-gray-600"><span className="w-2 h-2 rounded-full bg-emerald-500"/> Hire: <strong className="text-gray-900">{hR}%</strong></span></div></div><div className="space-y-3"><div><div className="flex justify-between text-[11px] font-['Roboto'] mb-1 text-gray-600"><span>Applicants</span><span>{total}</span></div><div className="w-full h-2.5 bg-gray-100 rounded overflow-hidden"><div className="h-2.5 bg-gray-700" style={{width:'100%'}}/></div></div><div><div className="flex justify-between text-[11px] font-['Roboto'] mb-1 text-gray-600"><span>Shortlisted</span><span>{sl} ({slR}%)</span></div><div className="w-full h-2.5 bg-gray-100 rounded overflow-hidden"><div className="h-2.5 bg-indigo-500 transition-all" style={{width:`${Math.min(slR,100)}%`}}/></div></div><div><div className="flex justify-between text-[11px] font-['Roboto'] mb-1 text-gray-600"><span>Hired</span><span>{hired} ({hR}%)</span></div><div className="w-full h-2.5 bg-gray-100 rounded overflow-hidden"><div className="h-2.5 bg-emerald-500 transition-all" style={{width:`${Math.min(hR,100)}%`}}/></div></div></div></div>})()}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg border border-gray-200 p-6"><h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-6">Recent Activity</h3><div className="space-y-4 min-h-[200px]">{loading && recentActivity.length===0 && <div className="space-y-3">{Array.from({length:5}).map((_,i)=><div key={i} className="h-10 bg-gray-100 rounded animate-pulse"/>)}</div>}{!loading && recentActivity.length===0 && <p className="text-sm text-gray-500 font-['Roboto']">No recent activity.</p>}{recentActivity.map((a,i)=><div key={i} className="flex items-start space-x-3">{getActivityIcon(a.type)}<div className="flex-1 min-w-0"><p className="text-sm text-gray-900 font-['Roboto']">{a.message}</p><p className="text-xs text-gray-500 font-['Roboto'] mt-1">{formatRelative(a.time)}</p></div></div>)}</div><button className="w-full mt-4 text-sm text-gray-900 hover:text-black font-medium font-['Roboto'] transition-colors">View all activity</button></div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{[
          // Updated to existing route since /admin/hr/add doesn't exist; directs to HR management where add happens.
          {label:'Add HR', path:'M12 6v6m0 0v6m0-6h6m-6 0H6', desc:'Invite new HR to join your organization', to:'/admin/hr-management'},
          {label:'Manage Users', path:'M3 7h18M3 12h18M9 17h6', desc:'View and manage HR & Interviewer accounts', to:'/admin/hr-management'},
          // Org settings adjusted to existing /admin/organization route.
          {label:'Org Settings', path:'M9.75 3a1 1 0 00-1 .89l-.28 2.24a6 6 0 00-.72 1.24L5.4 8.3a1 1 0 00-.25 1.09l.9 2.08a6 6 0 000 2.06l-.9 2.08a1 1 0 00.25 1.09l2.35 1.93c.21.18.45.34.7.48l.72 1.24.28 2.24a1 1 0 001 .89h4.5a1 1 0 001-.89l.28-2.24.72-1.24c.25-.14.49-.3.7-.48l2.35-1.93a1 1 0 00.25-1.09l-.9-2.08a6 6 0 000-2.06l.9-2.08a1 1 0 00-.25-1.09L16.6 7.37a6 6 0 00-.72-1.24L15.6 3.89a1 1 0 00-1-.89h-4.85z', desc:'Configure organization details & branding', to:'/admin/organization'},
          // Reports left as-is (page not created yet); user asked to ignore for now.
          {label:'View Reports', path:'M9 17v-6h13M9 11L4 16m5-5l5 5', desc:'Generate and export organization reports', to:'/admin/reports'}
        ].map(a=>(<button key={a.label} onClick={()=>navigate(a.to)} className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all text-left focus:outline-none focus:ring-2 focus:ring-gray-800"><div className="flex items-center mb-4"><div className="bg-gray-100 p-3 rounded-lg group-hover:bg-gray-900 group-hover:text-white transition-colors"><svg className="w-6 h-6 text-gray-700 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={a.path}/></svg></div></div><h3 className="text-lg font-semibold text-gray-900 font-['Open_Sans'] mb-2">{a.label}</h3><p className="text-sm text-gray-600 font-['Roboto']">{a.desc}</p></button>))}</div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
