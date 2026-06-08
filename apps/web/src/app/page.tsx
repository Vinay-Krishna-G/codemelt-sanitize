'use client';

import React, { useState, useEffect } from 'react';
import AnalyzerClient from '../components/analyzer-client';
import { completedFeatures, upcomingFeatures } from '../data/roadmap';
import {
  PRODUCT_NAME,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  ECOSYSTEM_DESCRIPTION
} from '../lib/branding';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    let activeTheme: 'light' | 'dark' = 'dark';
    if (savedTheme === 'light' || savedTheme === 'dark') {
      activeTheme = savedTheme;
    } else {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      activeTheme = systemPrefersDark ? 'dark' : 'light';
    }
    const timer = setTimeout(() => {
      setMounted(true);
      setTheme(activeTheme);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme, mounted]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between font-sans scroll-smooth transition-colors duration-200">
      
      {/* Floating Theme Toggle Switch */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-4 right-4 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all z-50 flex items-center justify-center cursor-pointer"
        aria-label="Toggle theme"
      >
        {mounted && theme === 'dark' ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4 h-4 text-amber-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.95 4.95l1.59 1.59m10.91 10.91 1.59 1.59M3 12h2.25m13.5 0H21M4.95 19.05l1.59-1.59m10.91-10.91 1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.2" stroke="currentColor" className="w-4 h-4 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        )}
      </button>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-8">
        
        {/* Main Content Area (Split Grid on Desktop) */}
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start w-full mt-2 lg:mt-6">
          
          {/* Column 1: Compact Branding & Info */}
          <div className="w-full lg:w-[32%] flex flex-col gap-5 text-center lg:text-left">
            <header className="flex flex-col items-center lg:items-start gap-3.5" id="hero">
              
              {/* Badge Bar */}
              <div className="flex flex-wrap justify-center lg:justify-start items-center gap-2">
                <span className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full select-none uppercase tracking-wider">
                  CodeMelt ecosystem
                </span>
                <span className="bg-zinc-500/10 border border-zinc-500/20 text-zinc-650 dark:text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full select-none uppercase tracking-wider">
                  Dev preview
                </span>
              </div>

              <div className="relative mt-1">
                {/* Background Glow */}
                <div className="absolute -inset-x-6 -top-4 h-24 bg-blue-500/5 dark:bg-blue-500/10 blur-2xl rounded-full pointer-events-none"></div>
                <h1 className="relative text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                  {PRODUCT_NAME}
                </h1>
              </div>

              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed max-w-md">
                {PRODUCT_DESCRIPTION}
              </p>

              <p className="text-zinc-500 dark:text-zinc-450 text-xs font-semibold">
                Detect comments, TODOs, FIXMEs, and console logs in seconds.
              </p>

              {/* Compact CTA Buttons */}
              <div className="flex items-center justify-center lg:justify-start gap-2.5 mt-1">
                <a
                  href="#analyzer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm shadow-blue-900/10"
                >
                  Analyze Code
                </a>
                <a
                  href="#roadmap"
                  className="px-4 py-2 bg-zinc-150 hover:bg-zinc-200 text-zinc-800 border border-zinc-200 rounded-lg text-xs font-semibold transition-all dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-800"
                >
                  View Roadmap
                </a>
              </div>
            </header>
          </div>

          {/* Column 2: The Analyzer Workspace (visible above the fold) */}
          <div className="w-full lg:w-[68%] flex justify-center">
            <AnalyzerClient />
          </div>

        </div>

        {/* Roadmap & Feature Cards (Below the fold) */}
        <section className="w-full grid md:grid-cols-2 gap-6 items-stretch border-t border-zinc-200 dark:border-zinc-900 pt-8 mt-4">
          
          {/* Visual Roadmap */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-lg" id="roadmap">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide border-b border-zinc-200 dark:border-zinc-800 pb-2.5 flex items-center gap-2 uppercase">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 dark:text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="17"/></svg>
              Product Roadmap
            </h2>
            <div className="flex flex-col gap-4">
              
              {/* Completed list */}
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Completed</h3>
                <ul className="flex flex-col gap-2 text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                  {completedFeatures.map((feat) => (
                    <li key={feat.id} className="flex items-center gap-2.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                      {feat.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Upcoming list */}
              <div>
                <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">Upcoming</h3>
                <ul className="flex flex-col gap-2 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                  {upcomingFeatures.map((feat) => (
                    <li key={feat.id} className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 border-2 border-zinc-350 dark:border-zinc-700 rounded-full bg-zinc-100 dark:bg-zinc-950 flex-shrink-0"></span>
                      {feat.label}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* CodeMelt Ecosystem Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col justify-between gap-6 shadow-lg" id="ecosystem">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide flex items-center gap-2 uppercase">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-600 dark:text-blue-500"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  CodeMelt Ecosystem
                </h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-500 font-semibold mt-1">
                  {ECOSYSTEM_DESCRIPTION}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">CodeMelt Sanitize</h3>
                  <ul className="text-xs text-zinc-650 dark:text-zinc-400 leading-relaxed mt-1 list-disc pl-4 flex flex-col gap-0.5 font-medium">
                    <li>Remove development noise</li>
                    <li>Clean repositories</li>
                    <li>Prepare code for AI tools</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    CodeMelt
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[9px] font-bold px-1.5 py-0.5 rounded ml-1">SOON</span>
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pl-1 font-medium">
                    Repository understanding, architecture exploration, and AI-ready documentation.
                  </p>
                </div>
              </div>
            </div>

            {/* Informational Non-clickable CTA Block */}
            <div className="flex flex-col items-center justify-center p-3 bg-zinc-100 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center gap-0.5">
              <div className="text-xs font-bold text-zinc-750 dark:text-zinc-300">Explore CodeMelt</div>
              <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">Available soon</div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-900 bg-zinc-100 dark:bg-zinc-950 py-5 text-center text-xs text-zinc-500 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
        <span>&copy; {new Date().getFullYear()} CodeMelt. All rights reserved.</span>
        <span className="hidden sm:inline text-zinc-300 dark:text-zinc-800">|</span>
        <span className="text-zinc-450 dark:text-zinc-600">v{PRODUCT_VERSION}</span>
      </footer>
    </div>
  );
}
