import React from 'react';

interface AIContextPreviewProps {
  copiedPrompt: boolean;
  copiedContext: boolean;
  handleCopyPrompt: () => void;
  handleCopyContext: () => void;
  handleDownloadContext: () => void;
  prompt: string;
  content: string;
}

export default function AIContextPreview({
  copiedPrompt,
  copiedContext,
  handleCopyPrompt,
  handleCopyContext,
  handleDownloadContext,
  prompt,
  content
}: AIContextPreviewProps) {
  return (
    <div className="lg:col-span-7 flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <label htmlFor="ai-preview" className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 font-bold">Preview</label>
        
        <div className="flex gap-2">
          <button
            onClick={handleCopyPrompt}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-850 dark:text-zinc-250 transition-all cursor-pointer"
          >
            {copiedPrompt ? '✓ Copied Prompt' : 'Copy Prompt'}
          </button>
          <button
            onClick={handleCopyContext}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-850 dark:text-zinc-250 transition-all cursor-pointer"
          >
            {copiedContext ? '✓ Copied Context' : 'Copy Context'}
          </button>
          <button
            onClick={handleDownloadContext}
            className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer border border-blue-600"
          >
            Download Context
          </button>
        </div>
      </div>

      <textarea
        id="ai-preview"
        readOnly
        value={`${prompt}\n${content}`}
        className="w-full h-80 font-mono text-[10px] p-4 rounded-xl border border-zinc-200 dark:border-zinc-855 bg-zinc-50 dark:bg-zinc-950/40 text-zinc-700 dark:text-zinc-400 focus:outline-none resize-none flex-1"
      />
    </div>
  );
}
