'use client';

import React from 'react';

interface RepositoryUploaderProps {
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  isDragging: boolean;
  onFolderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function RepositoryUploader({
  onDrop,
  onDragOver,
  onDragLeave,
  isDragging,
  onFolderUpload
}: RepositoryUploaderProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-16 text-center transition-all bg-zinc-50 dark:bg-zinc-950/20 cursor-pointer ${
        isDragging
          ? 'border-blue-600 bg-zinc-100/55 dark:border-blue-500 dark:bg-zinc-900/30'
          : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        className="w-16 h-16 text-zinc-400 dark:text-zinc-600 mb-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
        />
      </svg>

      <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">
        Select local repository folder
      </h3>
      <p className="text-sm text-zinc-550 dark:text-zinc-450 max-w-md mb-8 leading-relaxed">
        Drag and drop a folder here, or click upload to scan supported source code files client-side.
      </p>

      <label className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-lg text-base font-semibold transition-all cursor-pointer shadow-md shadow-blue-900/10 flex items-center justify-center gap-2.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="2"
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
          />
        </svg>
        Upload Folder
        <input
          type="file"
          multiple
          className="hidden"
          onChange={onFolderUpload}
          {...({
            webkitdirectory: '',
            directory: ''
          } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      </label>
    </div>
  );
}
