import React from 'react';

export function getFileIcon(path: string): React.ReactNode {
  const dotIndex = path.lastIndexOf('.');
  const ext = dotIndex !== -1 ? path.substring(dotIndex).toLowerCase() : '';

  switch (ext) {
    case '.js':
    case '.jsx':
    case '.mjs':
    case '.cjs':
      // Yellow JS Icon
      return React.createElement('svg', { className: 'w-4 h-4 text-yellow-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M3 3h18v18H3V3zm10.7 13.9c.4.7 1 1.2 1.8 1.2.7 0 1.2-.4 1.2-1.3v-4.8h1.7v4.8c0 1.9-1.2 2.9-2.9 2.9-1.6 0-2.6-1-3.2-2.1l1.4-.7zm-4.7-2.3c.3.5.7.8 1.2.8.5 0 .8-.3.8-.7V14c0-.7-.6-.9-1.3-1.2-.8-.4-1.7-.8-1.7-2.1 0-1.2 1-2.1 2.3-2.1 1.2 0 1.9.6 2.3 1.5l-1.3.8c-.3-.5-.6-.7-1-.7-.4 0-.7.2-.7.6s.3.5.9.8c1 .4 2.1.8 2.1 2.4 0 1.5-1.1 2.3-2.5 2.3-1.6 0-2.5-1.1-2.9-2.2l1.5-.7z' })
      );
    case '.ts':
    case '.tsx':
    case '.mts':
    case '.cts':
      // Blue TS Icon
      return React.createElement('svg', { className: 'w-4 h-4 text-blue-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M3 3h18v18H3V3zm11.1 15.2V7.7H9.2v1.7h1.9v8.8h1.8v-.2zm3.3-6c0-.9-.6-1.1-1.3-1.4-.8-.4-1.7-.8-1.7-2.1 0-1.2 1-2.1 2.3-2.1 1.2 0 1.9.6 2.3 1.5l-1.3.8c-.3-.5-.6-.7-1-.7-.4 0-.7.2-.7.6s.3.5.9.8c1 .4 2.1.8 2.1 2.4 0 1.5-1.1 2.3-2.5 2.3-1.6 0-2.5-1.1-2.9-2.2l1.5-.7c.3.5.7.8 1.2.8.5 0 .8-.3.8-.7v-.1z' })
      );
    case '.py':
      // Yellow/Blue Python Icon
      return React.createElement('svg', { className: 'w-4 h-4 text-sky-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2a10 10 0 0 0-10 10 10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm1 14.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-3a1.5 1.5 0 0 1-1.5-1.5v-3a1.5 1.5 0 0 1 3 0v3a1.5 1.5 0 0 1-1.5 1.5z' })
      );
    case '.go':
      // Go Icon (Cyan)
      return React.createElement('svg', { className: 'w-4 h-4 text-cyan-500 flex-shrink-0', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M16 18a4 4 0 1 1-8 0M8 6h8v6H8z' })
      );
    case '.rb':
      // Ruby Icon (Red)
      return React.createElement('svg', { className: 'w-4 h-4 text-rose-600 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2L2 9l10 13 10-13L12 2zm0 3.3L18.4 9 12 17.5 5.6 9 12 5.3z' })
      );
    case '.rs':
      // Rust Icon (Orange/Brown)
      return React.createElement('svg', { className: 'w-4 h-4 text-amber-750 flex-shrink-0', fill: 'none', stroke: 'currentColor', strokeWidth: '2', viewBox: '0 0 24 24' },
        React.createElement('circle', { cx: '12', cy: '12', r: '9' }),
        React.createElement('path', { d: 'M12 8v8M8 12h8' })
      );
    case '.java':
      // Java Icon (Orange/Red)
      return React.createElement('svg', { className: 'w-4 h-4 text-orange-600 flex-shrink-0', fill: 'none', stroke: 'currentColor', strokeWidth: '2', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2v14M8 5c0 4.5 8 4.5 8 9M6 19h12' })
      );
    case '.cpp':
    case '.h':
    case '.c':
      // C++ Icon (Indigo/Blue)
      return React.createElement('svg', { className: 'w-4 h-4 text-indigo-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2A10 10 0 1 0 22 12 10 10 0 0 0 12 2zm1 11h3v2h-3v3h-2v-3H8v-2h3V8h2v5z' })
      );
    case '.cs':
      // C# Icon (Purple)
      return React.createElement('svg', { className: 'w-4 h-4 text-purple-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm-1 14H8V8h3v8zm5-4h-3V8h3v4zm0 4h-3v-2h3v2z' })
      );
    case '.sh':
      // Shell (Green Terminal)
      return React.createElement('svg', { className: 'w-4 h-4 text-emerald-500 flex-shrink-0', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5', strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' },
        React.createElement('polyline', { points: '4 17 10 11 4 5' }),
        React.createElement('line', { x1: '12', y1: '19', x2: '20', y2: '19' })
      );
    case '.php':
      // PHP Icon (Violet)
      return React.createElement('svg', { className: 'w-4 h-4 text-violet-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm4 11h-3V8h3v5zm-5-3H8V8h3v2z' })
      );
    case '.css':
      // CSS Icon (Teal)
      return React.createElement('svg', { className: 'w-4 h-4 text-teal-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M5 2l1.5 17L12 22l5.5-3L19 2H5zm11.5 6.5H8.7l.2 2h7.4l-.5 4.5-3.8 1.5-3.8-1.5-.2-2.5h2l.1 1 1.9.8 1.9-.8.2-2H8.3l-.4-4h8.9l-.3 3z' })
      );
    case '.html':
      // HTML Icon (Orange)
      return React.createElement('svg', { className: 'w-4 h-4 text-orange-500 flex-shrink-0', fill: 'currentColor', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M5 2l1.5 17L12 22l5.5-3L19 2H5zm12 5H7.3l.4 4h9.1l-.5 5.5-4.3 1.5-4.3-1.5L7.2 12h2l.2 2.5 2.6.9 2.6-.9.3-3.5H7.7l-.4-4h10z' })
      );
    default:
      // Generic code file (Zinc/Gray)
      return React.createElement('svg', { className: 'w-4 h-4 text-zinc-400 dark:text-zinc-555 flex-shrink-0', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24' },
        React.createElement('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
        React.createElement('polyline', { points: '14 2 14 8 20 8' }),
        React.createElement('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
        React.createElement('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
        React.createElement('polyline', { points: '10 9 9 9 8 9' })
      );
  }
}
