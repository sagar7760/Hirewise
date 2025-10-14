import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Step = ({ index, title, desc }) => (
  <div className="flex items-start space-x-4 p-5 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-black dark:text-white font-semibold">
      {index}
    </div>
    <div>
      <h4 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">{title}</h4>
      <p className="mt-1 text-gray-600 dark:text-gray-300 font-['Roboto']">{desc}</p>
    </div>
  </div>
);

const Flow = ({ steps }) => (
  <div className="hidden lg:grid grid-cols-[1fr_40px_1fr] gap-x-6 gap-y-8 items-center">
    {steps.map((s, i) => {
      const isLeft = i % 2 === 0;
      return (
        <React.Fragment key={i}>
          {/* Left column */}
          <div className="col-start-1">
            {isLeft ? (
              <div className="flex justify-end">
                <div className="w-full max-w-xl">
                  <Step index={i + 1} title={s.title} desc={s.desc} />
                </div>
              </div>
            ) : null}
          </div>

          {/* Center arrow */}
          <div className="col-start-2" />

          {/* Right column */}
          <div className="col-start-3">
            {!isLeft ? (
              <div className="flex justify-start">
                <div className="w-full max-w-xl">
                  <Step index={i + 1} title={s.title} desc={s.desc} />
                </div>
              </div>
            ) : null}
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

const MobileFlow = ({ steps }) => (
  <div className="lg:hidden space-y-6">
    {steps.map((s, i) => (
      <div key={i} className="relative">
        <div className="w-full max-w-xl mx-auto">
          <Step index={i + 1} title={s.title} desc={s.desc} />
        </div>
      </div>
    ))}
  </div>
);

const HowItWorksPage = () => {
  const observerRef = useRef(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('animate-in');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
    const els = document.querySelectorAll('.fade-up, .fade-left, .fade-right');
    els.forEach(el => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const candidateSteps = [
    { title: 'Create your account', desc: 'Sign up in seconds and set your job preferences.' },
    { title: 'Complete your profile', desc: 'Upload your resume. Our AI parses skills, experience, and achievements automatically.' },
    { title: 'Discover relevant jobs', desc: 'Personalized recommendations appear based on your profile and preferences.' },
    { title: 'Apply in one click', desc: 'Answer a few role-specific questions and submit smart applications instantly.' },
    { title: 'Track status & notifications', desc: 'Get real-time updates for screenings, interviews, and offers.' },
    { title: 'Interview & get hired', desc: 'Join scheduled interviews, receive structured feedback, and land the role.' },
  ];

  const companySteps = [
    { title: 'Register company', desc: 'Create your organization account and complete quick verification.' },
    { title: 'Post a job', desc: 'Define requirements, skills, experience, and must-have criteria.' },
    { title: 'AI screening & ranking', desc: 'Our AI scores candidates on fit and highlights top matches instantly.' },
    { title: 'Collaborate & shortlist', desc: 'Review profiles with the team, add notes, and build your shortlist.' },
    { title: 'Schedule interviews', desc: 'Automated scheduling with email reminders and interviewer workflows.' },
    { title: 'Decide & hire faster', desc: 'Collect structured feedback, compare candidates, send offers confidently.' },
  ];

  return (
    <>
      <style>{`
        .fade-up{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-up.animate-in{opacity:1;transform:translateY(0)}
        .fade-left{opacity:0;transform:translateX(-24px);transition:opacity .6s ease,transform .6s ease}
        .fade-left.animate-in{opacity:1;transform:translateX(0)}
        .fade-right{opacity:0;transform:translateX(24px);transition:opacity .6s ease,transform .6s ease}
        .fade-right.animate-in{opacity:1;transform:translateX(0)}
      `}</style>

      {/* Page header */}
      <section className="px-6 pt-14 pb-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center">
          <div className="fade-up">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">How HireWise Works</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 font-['Roboto']">A clear, guided journey whether you’re applying for roles or building your dream team. Explore the step‑by‑step flow for candidates and companies.</p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <a href="#candidates" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">For Candidates</a>
              <a href="#companies" className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">For Companies</a>
            </div>
          </div>
        </div>
      </section>

      {/* Candidates flow */}
      <section id="candidates" className="px-6 py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 fade-up text-center">
            <span className="text-sm tracking-wider uppercase text-gray-500 dark:text-gray-400">Candidates</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Your path to the right job</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-['Roboto']">We remove friction so you can focus on showcasing your strengths.</p>
          </div>

          <div className="fade-up">
            <Flow steps={candidateSteps} />
            <MobileFlow steps={candidateSteps} />
          </div>

          <div className="mt-10 flex flex-wrap gap-4 fade-up justify-center">
            <Link to="/signup" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Create free candidate account</Link>
            <Link to="/login" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Companies flow */}
      <section id="companies" className="px-6 py-16 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 fade-up text-center">
            <span className="text-sm tracking-wider uppercase text-gray-500 dark:text-gray-400">Companies</span>
            <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Hire faster with confidence</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-['Roboto']">From posting to offer, AI streamlines every step with structure and insight.</p>
          </div>

          <div className="fade-up">
            <Flow steps={companySteps} />
            <MobileFlow steps={companySteps} />
          </div>

          <div className="mt-10 flex flex-wrap gap-4 fade-up justify-center">
            <Link to="/company/signup" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Register your company</Link>
            <Link to="/login" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Sign in</Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-16 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto text-center fade-up">
          <h3 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Ready to see it in action?</h3>
          <p className="mt-3 text-lg text-gray-600 dark:text-gray-300 font-['Roboto']">Join HireWise today and experience a smoother, smarter hiring journey.</p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link to="/company/signup" className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Start Hiring</Link>
            <Link to="/signup" className="border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black px-6 py-3 rounded-lg font-semibold font-['Open_Sans'] transition-colors">Find Jobs</Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HowItWorksPage;
