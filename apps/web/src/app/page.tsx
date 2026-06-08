import React from 'react';
import AnalyzerClient from '../components/analyzer-client';
import { completedFeatures, upcomingFeatures } from '../data/roadmap';
import {
  PRODUCT_NAME,
  PRODUCT_DESCRIPTION,
  PRODUCT_VERSION,
  ECOSYSTEM_DESCRIPTION
} from '../lib/branding';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans scroll-smooth">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-center gap-10">
        
        {/* Hero Header */}
        <header className="text-center flex flex-col items-center gap-4 max-w-2xl mt-6" id="hero">
          
          {/* Badge Bar */}
          <div className="flex flex-wrap justify-center items-center gap-2">
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full select-none">
              CodeMelt Ecosystem
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 hidden sm:block"></div>
            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full select-none">
              Developer Preview
            </span>
          </div>

          <div className="relative mt-2">
            {/* Background Blur Glow */}
            <div className="absolute -inset-x-12 -top-6 h-36 bg-blue-500/10 blur-3xl rounded-full pointer-events-none"></div>
            <h1 className="relative text-4xl md:text-5xl font-black tracking-tight text-white">
              {PRODUCT_NAME}
            </h1>
          </div>

          <p className="text-zinc-400 text-base md:text-lg max-w-lg">
            {PRODUCT_DESCRIPTION}
          </p>

          <p className="text-zinc-500 text-xs tracking-wide uppercase font-semibold">
            Detect comments, TODOs, FIXMEs, and console logs in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 mt-2">
            <a
              href="#analyzer"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md shadow-blue-900/10"
            >
              Analyze Code
            </a>
            <a
              href="#roadmap"
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 active:bg-zinc-950 text-zinc-300 border border-zinc-800 rounded-lg text-sm font-semibold transition-all"
            >
              View Roadmap
            </a>
          </div>
        </header>

        {/* Analyzer Client Component */}
        <section className="w-full flex justify-center pt-4">
          <AnalyzerClient />
        </section>

        {/* Roadmap & Feature Placeholder Cards */}
        <section className="w-full grid md:grid-cols-2 gap-6 items-stretch mt-6">
          
          {/* Visual Roadmap */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-lg" id="roadmap">
            <h2 className="text-base font-bold text-white tracking-wide border-b border-zinc-800 pb-2.5 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="17"/></svg>
              Product Roadmap
            </h2>
            <div className="flex flex-col gap-4">
              
              {/* Completed list */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Completed</h3>
                <ul className="flex flex-col gap-2 text-zinc-300 text-xs">
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
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-2">Upcoming</h3>
                <ul className="flex flex-col gap-2 text-zinc-400 text-xs">
                  {upcomingFeatures.map((feat) => (
                    <li key={feat.id} className="flex items-center gap-2.5">
                      <span className="w-3.5 h-3.5 border-2 border-zinc-700 rounded-full bg-zinc-950 flex-shrink-0"></span>
                      {feat.label}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* CodeMelt Ecosystem Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between gap-6 shadow-lg" id="ecosystem">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-zinc-800 pb-2.5">
                <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-blue-500"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                  CodeMelt Ecosystem
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  {ECOSYSTEM_DESCRIPTION}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">CodeMelt Sanitize</h3>
                  <ul className="text-xs text-zinc-400 leading-relaxed mt-1 list-disc pl-4 flex flex-col gap-0.5">
                    <li>Remove development noise</li>
                    <li>Clean repositories</li>
                    <li>Prepare code for AI tools</li>
                  </ul>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-1.5">
                    CodeMelt
                    <span className="bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded">Soon</span>
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed pl-1">
                    Repository understanding, architecture exploration, and AI-ready documentation.
                  </p>
                </div>
              </div>
            </div>

            {/* Informational Non-clickable CTA Block */}
            <div className="flex flex-col items-center justify-center p-3 bg-zinc-950/40 border border-zinc-800 rounded-lg text-center gap-0.5">
              <div className="text-xs font-bold text-zinc-300">Explore CodeMelt</div>
              <div className="text-[9px] font-black text-zinc-500 tracking-wider uppercase">Available Soon</div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2">
        <span>&copy; {new Date().getFullYear()} CodeMelt. All rights reserved.</span>
        <span className="hidden sm:inline text-zinc-800">|</span>
        <span className="text-zinc-600">v{PRODUCT_VERSION}</span>
      </footer>
    </div>
  );
}
