import AnalyzerClient from '../components/analyzer-client';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between font-sans">
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-12 flex flex-col items-center gap-10">
        
        {/* Hero Header */}
        <header className="text-center flex flex-col gap-3 max-w-2xl mt-6">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-200 bg-clip-text text-transparent">
            CodeMelt Sanitize
          </h1>
          <p className="text-zinc-400 text-base md:text-lg">
            Instantly clean development noise from your code files before publishing, committing, or sharing with AI.
          </p>
        </header>

        {/* Analyzer Client Component */}
        <section className="w-full flex justify-center">
          <AnalyzerClient />
        </section>

        {/* Roadmap & Feature Placeholder Cards */}
        <section className="w-full grid md:grid-cols-2 gap-6 items-stretch mt-6">
          
          {/* Upcoming Features */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col gap-4 shadow-lg">
            <h2 className="text-lg font-bold text-white tracking-wide border-b border-zinc-800 pb-2">
              Upcoming Features
            </h2>
            <ul className="flex flex-col gap-2.5 text-zinc-400 text-sm">
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                Folder Upload
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                ZIP Repository Upload
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                Repository Analysis Dashboard
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                Clean Repository Download
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                AI-Ready Export Package
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-block w-4 h-4 border border-zinc-700 rounded-md bg-zinc-950 flex-shrink-0 flex items-center justify-center"></span>
                CodeMelt Integration
              </li>
            </ul>
          </div>

          {/* CodeMelt Ecosystem Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between gap-6 shadow-lg">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-0.5 border-b border-zinc-800 pb-2">
                <h2 className="text-lg font-bold text-white tracking-wide">
                  Part of the CodeMelt Ecosystem
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Built for developers working with large codebases
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">CodeMelt Sanitize</h3>
                  <ul className="text-xs text-zinc-400 leading-relaxed mt-1 list-disc pl-4 flex flex-col gap-0.5">
                    <li>Remove development noise</li>
                    <li>Clean repositories</li>
                    <li>Prepare code for AI tools</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">CodeMelt</h3>
                  <ul className="text-xs text-zinc-400 leading-relaxed mt-1 list-disc pl-4 flex flex-col gap-0.5">
                    <li>Repository understanding</li>
                    <li>Architecture exploration</li>
                    <li>Documentation generation</li>
                    <li>AI-assisted codebase navigation</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                disabled
                className="w-full text-center px-4 py-2 bg-zinc-800/40 hover:bg-zinc-800 text-zinc-500 border border-zinc-800 rounded-lg text-xs font-semibold tracking-wider cursor-not-allowed transition-colors"
              >
                Explore CodeMelt →
              </button>
              <div className="text-center text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
                Currently in Development
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-900 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        &copy; {new Date().getFullYear()} CodeMelt. All rights reserved.
      </footer>
    </div>
  );
}
