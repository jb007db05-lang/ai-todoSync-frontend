const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const replacements = [
  // Explicit borders -> replaced by shadow-sm/shadow-md or empty
  { from: /border border-slate-100\/80/g, to: 'shadow-xs' },
  { from: /border border-slate-150/g, to: 'shadow-sm' },
  { from: /border border-slate-100/g, to: 'shadow-sm' },
  { from: /border border-slate-200/g, to: 'shadow-md' },
  { from: /border border-slate-300/g, to: 'shadow-md' },
  { from: /border border-slate-400/g, to: 'shadow-md' },
  { from: /border border-slate-50/g, to: 'shadow-xs' },
  
  // borders with alpha / borders with specific components
  { from: /border border-slate-100\/50/g, to: 'shadow-xs' },
  { from: /border border-slate-200\/60/g, to: 'shadow-xs' },
  { from: /border-b border-slate-200\/60/g, to: 'shadow-xs' },
  { from: /border-t border-slate-100/g, to: 'shadow-xs' },
  { from: /border-b border-slate-100/g, to: 'shadow-xs' },
  { from: /border-l border-slate-100/g, to: 'shadow-xs' },
  { from: /border-r border-slate-100/g, to: 'shadow-xs' },
  { from: /border-t border-slate-200/g, to: 'shadow-xs' },
  { from: /border-b border-slate-200/g, to: 'shadow-xs' },
  { from: /border-l border-slate-200/g, to: 'shadow-xs' },
  { from: /border-r border-slate-200/g, to: 'shadow-xs' },

  // colored button borders -> shadows
  { from: /border border-emerald-250/g, to: 'shadow-sm' },
  { from: /border border-amber-250/g, to: 'shadow-sm' },
  { from: /border border-rose-200/g, to: 'shadow-sm' },
  { from: /border border-emerald-500\/35/g, to: 'shadow-sm' },
  { from: /border border-emerald-100\/40/g, to: 'shadow-sm' },

  // focus border -> focus ring
  { from: /focus:border-slate-300/g, to: 'focus:ring-2 focus:ring-slate-500/10' },
  { from: /focus:border-slate-500/g, to: 'focus:ring-2 focus:ring-slate-500/10' },

  // General borders remaining
  { from: /\bborder-slate-100\b/g, to: '' },
  { from: /\bborder-slate-200\b/g, to: '' },
  { from: /\bborder-slate-150\b/g, to: '' },
  { from: /\bborder-slate-50\b/g, to: '' },
  { from: /\bborder\b/g, to: '' } // Remove stand-alone 'border' class
];

function processFile(filePath) {
  if (filePath.endsWith('Sidebar.tsx')) {
    console.log(`Skipping sidebar file: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Perform standard replacements
  for (const rep of replacements) {
    content = content.replace(rep.from, rep.to);
  }

  // If this is globals.css, perform specific edits to remove border from card/input-base/bento-item
  if (filePath.endsWith('globals.css')) {
    content = content.replace(/border-radius: var\(--radius-xl\);\s*border: 1px solid rgba\(241, 245, 243, 0.6\);/g, 'border-radius: var(--radius-xl);');
    content = content.replace(/border: 1px solid rgba\(241, 245, 243, 0.6\);/g, '');
    content = content.replace(/border-color: rgba\(226, 232, 229, 0.4\);/g, '');
    content = content.replace(/border border-slate-100\/50/g, 'shadow-sm');
    content = content.replace(/border border-slate-100/g, 'shadow-xs');
    content = content.replace(/border border-slate-100\/80/g, 'shadow-xs');
  }

  // Clean up duplicate/multi shadow classes (e.g. "shadow-xs shadow-sm", "shadow-sm shadow-md", "shadow-sm shadow-sm")
  content = content.replace(/shadow-xs\s+shadow-xs/g, 'shadow-xs');
  content = content.replace(/shadow-sm\s+shadow-sm/g, 'shadow-sm');
  content = content.replace(/shadow-md\s+shadow-md/g, 'shadow-md');
  content = content.replace(/shadow-xs\s+shadow-sm/g, 'shadow-sm');
  content = content.replace(/shadow-sm\s+shadow-xs/g, 'shadow-sm');
  content = content.replace(/shadow-sm\s+shadow-md/g, 'shadow-md');
  content = content.replace(/shadow-md\s+shadow-sm/g, 'shadow-md');
  content = content.replace(/shadow-xs\s+shadow-md/g, 'shadow-md');
  content = content.replace(/shadow-md\s+shadow-xs/g, 'shadow-md');
  content = content.replace(/shadow-md\s+shadow-lg/g, 'shadow-lg');
  content = content.replace(/shadow-lg\s+shadow-md/g, 'shadow-lg');

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
console.log('Done border-to-shadow refactoring!');
