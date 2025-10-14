import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import aiFeedbackIllustration from '../../assets/images/ai-feedback-illustration.svg';

const FeaturesPage = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('animate-in'); });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    const els = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .scale-in');
    els.forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .fade-up{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-up.animate-in{opacity:1;transform:translateY(0)}
        .fade-left{opacity:0;transform:translateX(-24px);transition:opacity .6s ease,transform .6s ease}
        .fade-left.animate-in{opacity:1;transform:translateX(0)}
        .fade-right{opacity:0;transform:translateX(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-right.animate-in{opacity:1;transform:translateX(0)}
        .scale-in{opacity:0;transform:scale(.96);transition:opacity .5s ease,transform .5s ease}
        .scale-in.animate-in{opacity:1;transform:scale(1)}
      `}</style>

      {/* Hero */}
      <section className="px-6 pt-14 pb-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center fade-up">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Features</h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 font-['Roboto']">Everything you need to manage hiring for candidates and companies — with AI currently applied to feedback analysis.</p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Note</span>
            <span className="text-xs text-gray-600 dark:text-gray-300">AI is presently used only for interview feedback analysis.</span>
          </div>
        </div>
      </section>

      {/* Core features grid */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Hiring made simple</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">Streamlined workflows for both companies and candidates.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[ 
              { title:'Job Posting', desc:'Create detailed job posts with role, skills, and requirements in minutes.' },
              { title:'Applications & Tracking', desc:'Track applicants, statuses, and notes in a structured, filterable view.' },
              { title:'Interview Scheduling', desc:'Plan interviews and coordinate with interviewers and candidates easily.' },
              { title:'Candidate Portal', desc:'Candidates can apply, track status, and manage profiles from a single place.' },
              { title:'Notifications', desc:'Stay informed with timely updates for interviews, status changes, and more.' },
              { title:'Feedback Management', desc:'Capture structured feedback from interviewers with consistent criteria.' },
            ].map((f, i) => (
              <div key={i} className="scale-in bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">{f.title}</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI feedback analysis */}
      <section className="px-6 py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="fade-left order-2 lg:order-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">AI-Powered (Current)</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">AI Interview Feedback Analysis</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-['Roboto']">Use AI to turn raw interviewer notes into clear summaries and actionable insights — helping HR teams make faster, fairer decisions.</p>
            <ul className="mt-6 space-y-3 text-gray-700 dark:text-gray-200 font-['Roboto']">
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" /> Summarizes key points and highlights strengths/concerns.</li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" /> Extracts skill signals and themes across multiple interviews.</li>
              <li className="flex items-start gap-3"><span className="mt-1 w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500" /> Suggests next steps (e.g., additional round, assignment, reference check).</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/hr/interviews" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Try in Interviews</Link>
              <Link to="/how-it-works" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">See the flow</Link>
            </div>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">Privacy-first: only interviewer-submitted feedback is analyzed.</div>
          </div>
          <div className="fade-right order-1 lg:order-2">
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-800">
              <img
                src={aiFeedbackIllustration}
                alt="Stylized dashboard showing AI feedback summary, highlights, and charts"
                className="w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                loading="lazy"
              />
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 font-['Roboto'] text-center">The AI surfaces themes and suggested next steps to support decisions.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap (non-AI or future AI) */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center fade-up">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">What’s next</h3>
          <p className="mt-2 text-gray-600 dark:text-gray-300 font-['Roboto']">We’re actively improving workflows. Future AI enhancements like automated screening and ranking are under evaluation and not live yet.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center fade-up">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Start hiring better today</h3>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 font-['Roboto']">Set up your company and run interviews with AI‑assisted feedback analysis.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/company/signup" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Register Company</Link>
            <Link to="/signup" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Find Jobs</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturesPage;
