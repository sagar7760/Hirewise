import React, { useEffect, useRef } from 'react';

const values = [
  { title: 'Transparency', desc: 'Clear scoring logic and visible feedback empower trust between candidates and recruiters.' },
  { title: 'Fair Hiring', desc: 'Objective evaluation reduces noise and helps eliminate unconscious bias at every stage.' },
  { title: 'AI Responsibility', desc: 'Human oversight + explainable signals. AI augments decisions—it never blindly replaces them.' }
];

const stackItems = [
  'MongoDB', 'Express.js', 'React', 'Node.js', 'Tailwind CSS', 'JWT Auth', 'Caching Layer', 'Lazy Loading', 'Resume Parser', 'AI Feedback Analysis'
];

const milestones = [
  { date: 'Aug 2025', title: 'Resume Parser', detail: 'Implemented structured extraction pipeline for skills, experience & education.' },
  { date: 'Sep 2025', title: 'Interview Feedback AI', detail: 'Launched AI sentiment + summary generation for interviewer notes.' }
];

const AboutPage = () => {
  const observerRef = useRef(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('animate-in'); });
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

      {/* Project Hero */}
      <section className="px-6 pt-24 pb-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto fade-up">
          <div className="flex flex-col lg:flex-row gap-14 items-start">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs tracking-wide uppercase font-['Open_Sans']">Platform Overview</div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight text-gray-900 dark:text-white font-['Open_Sans']">HireWise: Intelligent, Fair & Scalable Hiring</h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 font-['Roboto'] max-w-2xl">HireWise streamlines recruitment by combining structured data extraction, transparent scoring, and interviewer feedback intelligence. Every feature is designed to reduce bias, save time, and surface truly qualified talent sooner.</p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-['Roboto']">Bias Reduction</span>
                <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-['Roboto']">Explainable Signals</span>
                <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-['Roboto']">Faster Shortlisting</span>
                <span className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-['Roboto']">Actionable Feedback</span>
              </div>
            </div>
            <div className="flex-1 grid sm:grid-cols-2 gap-6 self-stretch mt-4 lg:mt-2">
              {[{
                h:'Resume Parsing',p:'Extracts skills, roles, education & experience structure for consistent evaluation.'
              },{
                h:'Structured Scoring',p:'Creates normalized candidate profiles with comparable signals.'
              },{
                h:'Interview Insights',p:'AI sentiment + summarization helps calibrate interviewer feedback responsibly.'
              },{
                h:'Scalable Architecture',p:'MERN stack + modular services, caching & lazy loading for performance.'
              }].map((f,i)=>(
                <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                  <h3 className="text-base font-semibold tracking-wide text-gray-900 dark:text-white font-['Open_Sans']">{f.h}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300 font-['Roboto']">{f.p}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy & Mission */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid gap-20 md:gap-28 md:grid-cols-2 items-start">
          <div className="space-y-6 fade-up md:pr-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Philosophy</h2>
            <p className="text-gray-700 dark:text-gray-300 font-['Roboto'] leading-relaxed">HireWise integrates AI only where it adds clarity—not noise. Each capability (parsing, scoring, feedback analysis) is built to surface structured, human‑reviewable signals. Transparency and fairness are not afterthoughts; they are architectural requirements.</p>
          </div>
          <div className="space-y-6 fade-up md:pl-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Mission</h2>
            <p className="text-gray-700 dark:text-gray-300 font-['Roboto'] leading-relaxed">Empower hiring teams to move from intuition‑heavy screening to consistent, explainable evaluation—reducing bias, compressing time‑to‑hire, and improving candidate experience through clear feedback loops.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14 fade-up max-w-2xl">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Core Values</h2>
            <p className="mt-3 text-gray-600 dark:text-gray-300 font-['Roboto']">Guiding principles that influence product choices, data handling, and UX trade‑offs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v,i)=>(
              <div key={i} className="p-6 rounded-xl bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 fade-up">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white font-['Open_Sans'] tracking-wide">{v.title}</h3>
                <p className="mt-3 text-gray-600 dark:text-gray-300 font-['Roboto'] text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stack */}
      <section className="px-6 py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto fade-up">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Engineering Stack & Practices</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 font-['Roboto'] max-w-xl">A pragmatic toolkit emphasizing modularity, performance, and clarity in data flow and evaluation.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {stackItems.map((s,i)=>(
              <span key={i} className="px-4 py-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 font-['Roboto']">{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto fade-up">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white font-['Open_Sans'] mb-12">Milestones</h2>
          <ol className="relative border-l border-gray-200 dark:border-gray-700 pl-4">
            {milestones.map((m,i)=>(
              <li key={i} className="mb-10 ml-6">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold">{i+1}</span>
                <time className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">{m.date}</time>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-['Open_Sans']">{m.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 font-['Roboto'] text-sm leading-relaxed">{m.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Personal About Me (moved near bottom) */}
      <section className="px-6 py-20 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-20 items-start fade-up">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">About Me</h2>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">I'm <span className="font-semibold">Sagar Soradi</span>, an aspiring full‑stack developer focused on building systems that are clean, observable, and user‑centric. HireWise is my initiative to bring engineering rigor and ethical AI into talent workflows.</p>
            <p className="text-gray-600 dark:text-gray-300 font-['Roboto']">I care about performance, accessibility, and meaningful automation—leveraging patterns like caching, lazy loading, and modular service boundaries to keep the platform fast and maintainable.</p>
            <div className="flex flex-wrap gap-4 pt-1">
              <a href="https://www.linkedin.com/in/sagar-soradi" target="_blank" rel="noreferrer" className="px-5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold font-['Open_Sans'] transition-colors">LinkedIn</a>
              <a href="https://github.com/sagar7760" target="_blank" rel="noreferrer" className="px-5 py-2 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black font-semibold font-['Open_Sans'] transition-colors">GitHub</a>
            </div>
          </div>
          <div className="w-full max-w-xs mx-auto lg:mx-0 aspect-[4/5] rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <img src="/sagar.jpg" alt="Sagar Soradi portrait" className="w-full h-full object-cover object-center" loading="lazy" />
          </div>
        </div>
      </section>

      {/* CTA */}
  <section id="contact" className="px-6 py-24 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div className="max-w-3xl mx-auto text-center fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-['Open_Sans']">Let’s Connect</h2>
            <p className="mt-4 text-gray-600 dark:text-gray-300 font-['Roboto']">Have feedback, opportunities, or collaboration ideas? I’d love to hear from you. Reach out directly or connect on LinkedIn.</p>
            <div className="mt-8 flex flex-wrap gap-4 justify-center">
              <a href="mailto:sagarsoradi011@gmail.com" className="px-6 py-3 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold font-['Open_Sans'] transition-colors">Email Me</a>
              <a href="https://www.linkedin.com/in/sagar-soradi" target="_blank" rel="noreferrer" className="px-6 py-3 rounded-lg border-2 border-black dark:border-white text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black font-semibold font-['Open_Sans'] transition-colors">LinkedIn</a>
            </div>
        </div>
      </section>
    </>
  );
};

export default AboutPage;
