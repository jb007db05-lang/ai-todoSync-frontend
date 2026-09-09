const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const replacements = [
  // border-olive
  { from: /border-olive-950/g, to: 'border-slate-950' },
  { from: /border-olive-900/g, to: 'border-slate-900' },
  { from: /border-olive-800/g, to: 'border-slate-800' },
  { from: /border-olive-700/g, to: 'border-slate-700' },
  { from: /border-olive-600/g, to: 'border-slate-650' },
  { from: /border-olive-500/g, to: 'border-slate-500' },
  { from: /border-olive-400/g, to: 'border-slate-400' },
  { from: /border-olive-300/g, to: 'border-slate-300' },
  { from: /border-olive-200/g, to: 'border-slate-200' },
  { from: /border-olive-100/g, to: 'border-slate-100' },
  { from: /border-olive-50/g, to: 'border-slate-50' },

  // borders with alpha
  { from: /border-olive-200\/60/g, to: 'border-slate-200/60' },
  { from: /border-olive-100\/50/g, to: 'border-slate-100/50' },
  { from: /border-olive-100\/65/g, to: 'border-slate-200' },

  // bg-olive
  { from: /bg-olive-950/g, to: 'bg-slate-950' },
  { from: /bg-olive-900/g, to: 'bg-slate-900' },
  { from: /bg-olive-800/g, to: 'bg-slate-800' },
  { from: /bg-olive-750/g, to: 'bg-slate-850' },
  { from: /bg-olive-700/g, to: 'bg-slate-900' },
  { from: /bg-olive-600/g, to: 'bg-slate-600' },
  { from: /bg-olive-500/g, to: 'bg-slate-500' },
  { from: /bg-olive-400/g, to: 'bg-slate-400' },
  { from: /bg-olive-300/g, to: 'bg-slate-300' },
  { from: /bg-olive-200/g, to: 'bg-slate-200' },
  { from: /bg-olive-100/g, to: 'bg-slate-100' },
  { from: /bg-olive-50/g, to: 'bg-slate-50' },

  // bg-olive with alpha
  { from: /bg-olive-900\/20/g, to: 'bg-slate-900/20' },
  { from: /bg-olive-50\/50/g, to: 'bg-slate-50/50' },
  { from: /bg-olive-50\/40/g, to: 'bg-slate-50/40' },
  { from: /bg-olive-50\/30/g, to: 'bg-slate-50/30' },
  { from: /bg-olive-100\/50/g, to: 'bg-slate-100/50' },

  // text-olive
  { from: /text-olive-950/g, to: 'text-slate-900' },
  { from: /text-olive-900/g, to: 'text-slate-800' },
  { from: /text-olive-850/g, to: 'text-slate-800' },
  { from: /text-olive-800/g, to: 'text-slate-700' },
  { from: /text-olive-750/g, to: 'text-slate-700' },
  { from: /text-olive-700/g, to: 'text-slate-700' },
  { from: /text-olive-650/g, to: 'text-slate-650' },
  { from: /text-olive-600/g, to: 'text-slate-600' },
  { from: /text-olive-500/g, to: 'text-slate-500' },
  { from: /text-olive-400/g, to: 'text-slate-400' },
  { from: /text-olive-300/g, to: 'text-slate-300' },

  // hover states
  { from: /hover:bg-olive-900/g, to: 'hover:bg-slate-800' },
  { from: /hover:bg-olive-800/g, to: 'hover:bg-slate-800' },
  { from: /hover:bg-olive-100/g, to: 'hover:bg-slate-100' },
  { from: /hover:bg-olive-50/g, to: 'hover:bg-slate-50' },
  { from: /hover:text-olive-900/g, to: 'hover:text-slate-900' },
  { from: /hover:text-olive-600/g, to: 'hover:text-slate-700' },
  { from: /hover:border-olive-400/g, to: 'hover:border-slate-300' },
  { from: /hover:border-olive-300/g, to: 'hover:border-slate-200' },

  // focus states
  { from: /focus:ring-olive-500\/10/g, to: 'focus:ring-slate-500/10' },
  { from: /focus:border-olive-500/g, to: 'focus:border-slate-300' },
  { from: /focus:border-olive-400/g, to: 'focus:border-slate-300' },
  { from: /focus:ring-olive-700\/5/g, to: 'focus:ring-slate-500/5' },
  { from: /ring-olive-400/g, to: 'ring-slate-300' },
  { from: /shadow-olive-900\/10/g, to: 'shadow-slate-900/10' },

  // stroke states
  { from: /stroke-olive-300/g, to: 'stroke-slate-300' },
  { from: /stroke-olive-200/g, to: 'stroke-slate-200' }
];

function processFile(filePath) {
  if (filePath.endsWith('Sidebar.tsx')) {
    console.log(`Skipping sidebar file: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverse(dir) {
  const list = fs.readdirSync(dir);
  for (const item of list) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      traverse(fullPath);
    } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css'))) {
      processFile(fullPath);
    }
  }
}

traverse(srcDir);
console.log('Done replacement!');
