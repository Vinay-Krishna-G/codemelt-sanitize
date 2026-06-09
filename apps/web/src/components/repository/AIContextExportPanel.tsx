import React, { useState, useMemo } from 'react';
import type { 
  RepositoryIntelligence,
  AIContextPreset,
  AIContextLengthMode,
  AIContextExportFormat,
  AITarget
} from '../../types/intelligence';
import { generateAIContext } from '../../lib/repository/intelligence';
import AIContextMetricsCard from './AIContextMetricsCard';
import AIContextPreview from './AIContextPreview';

interface AIContextExportPanelProps {
  intelligence: RepositoryIntelligence;
}

export default function AIContextExportPanel({ intelligence }: AIContextExportPanelProps) {
  const [preset, setPreset] = useState<AIContextPreset>('bug-fix');
  const [lengthMode, setLengthMode] = useState<AIContextLengthMode>('standard');
  const [target, setTarget] = useState<AITarget>('chatgpt');
  const [format, setFormat] = useState<AIContextExportFormat>('markdown');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedContext, setCopiedContext] = useState(false);

  const aiContextPayload = useMemo(() => {
    return generateAIContext(intelligence, preset, lengthMode, target, format);
  }, [intelligence, preset, lengthMode, target, format]);

  const handleCopyContext = async () => {
    try {
      await navigator.clipboard.writeText(aiContextPayload.content);
      setCopiedContext(true);
      setTimeout(() => setCopiedContext(false), 2000);
    } catch (err) {
      console.error('Failed to copy context:', err);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aiContextPayload.prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleDownloadContext = () => {
    const ext = format === 'json' ? 'json' : format === 'text' ? 'txt' : 'md';
    const mime = format === 'json' ? 'application/json' : 'text/plain';
    const blob = new Blob([aiContextPayload.content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-repository-context.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-md flex flex-col gap-6">
      <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-450 dark:text-zinc-550">
          AI Context Export
        </h3>
        <p className="text-xs text-zinc-400 dark:text-zinc-555 mt-1">
          Generate target-aware repository context payloads optimized for prompting Large Language Models.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Preset Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-preset" className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Prompt Preset</label>
            <select
              id="ai-preset"
              value={preset}
              onChange={(e) => setPreset(e.target.value as AIContextPreset)}
              className="text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="bug-fix">Bug Fixing</option>
              <option value="feature-dev">Feature Development</option>
              <option value="refactor">Refactoring</option>
              <option value="code-review">Code Review</option>
              <option value="arch-review">Architecture Review</option>
              <option value="perf-opt">Performance Optimization</option>
              <option value="security-review">Security Review</option>
            </select>
          </div>

          {/* Target Selector */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ai-target" className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">AI Target LLM / Editor</label>
            <select
              id="ai-target"
              value={target}
              onChange={(e) => setTarget(e.target.value as AITarget)}
              className="text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 p-2.5 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="chatgpt">ChatGPT (Structured)</option>
              <option value="claude">Claude (Architecture-heavy)</option>
              <option value="gemini">Gemini (Concise)</option>
              <option value="cursor">Cursor (Implementation-focused)</option>
              <option value="windsurf">Windsurf (Implementation-focused)</option>
              <option value="copilot">GitHub Copilot (Generation-focused)</option>
            </select>
          </div>

          {/* Length Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Context Length Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'standard', 'detailed'] as AIContextLengthMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setLengthMode(mode)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all capitalize cursor-pointer ${
                    lengthMode === mode
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-400 dark:text-zinc-500">Serialization Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['markdown', 'text', 'json'] as AIContextExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all capitalize cursor-pointer ${
                    format === fmt
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Estimations Metrics */}
          <AIContextMetricsCard metrics={aiContextPayload.metrics} />
        </div>

        {/* Preview Panel */}
        <AIContextPreview
          copiedPrompt={copiedPrompt}
          copiedContext={copiedContext}
          handleCopyPrompt={handleCopyPrompt}
          handleCopyContext={handleCopyContext}
          handleDownloadContext={handleDownloadContext}
          prompt={aiContextPayload.prompt}
          content={aiContextPayload.content}
        />
      </div>
    </section>
  );
}
