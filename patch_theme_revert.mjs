import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

// Reverse replacements done by patch_theme.mjs

// Main container
content = content.replace(
  'bg-[#0a0a0f] text-slate-100 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-[0_0_40px_rgba(240,192,64,0.15)]',
  'bg-[#f4f6fc] text-slate-800 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-2xl'
);
content = content.replace(
  '<div className="flex-1 flex flex-col h-full bg-[#0a0a0f]">',
  '<div className="flex-1 flex flex-col h-full bg-[#f4f6fc]">'
);

// Header
content = content.replace(
  '<header className="h-[60px] bg-[#12121e] border-b border-b-[#f0c040]/20 flex items-center justify-between px-2 shrink-0 z-30 relative">',
  '<header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">'
);
content = content.replace(
  'className="p-3 text-[#f0c040] active:bg-[#f0c040]/10 rounded-full transition"',
  'className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition"'
);
content = content.replace(
  'className="p-3 text-slate-400 active:bg-[#f0c040]/10 rounded-full transition"',
  'className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition"'
);
content = content.replace(
  '<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-[#f0c040] font-bold tracking-tight">',
  '<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-slate-800 font-bold tracking-tight">'
);

// Reverse Cards
content = content.replace(/bg-\[\#12121e\] rounded-xl border border-\[\#2a2a36\] shadow-lg p-4 text-slate-100/g, 'bg-white rounded-xl shadow p-4 text-slate-800');
content = content.replace(/bg-\[\#12121e\] rounded-xl shadow-lg border border-\[\#2a2a36\]/g, 'bg-white rounded-xl shadow');
content = content.replace(/bg-\[\#12121e\] p-4 rounded-xl shadow border border-\[\#2a2a36\]/g, 'bg-white p-4 rounded-xl shadow');

// Text and border colors
content = content.replace(/text-\[\#f0c040\]/g, 'text-[#dfa510]');
content = content.replace(/bg-\[\#f0c040\]/g, 'bg-[#dfa510]');
content = content.replace(/border-\[\#2a2a36\]/g, 'border-slate-200');
content = content.replace(/bg-\[\#1a1a24\]/g, 'bg-slate-50');
content = content.replace(/bg-\[\#2a2a36\]/g, 'bg-slate-200');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/text-slate-300/g, 'text-slate-600');
content = content.replace(/text-slate-200/g, 'text-slate-800');

// Wingo table elements
content = content.replace(/border-b border-slate-200 last:border-0 hover:bg-\[\#1a1a2e\]/g, 'border-b border-slate-100 last:border-0 hover:bg-slate-50');

// Sidebar
content = content.replace(
  'className="absolute inset-y-0 left-0 w-[260px] bg-[#12121e] border-r border-[#dfa510]/30 text-white z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]"',
  'className="absolute inset-y-0 left-0 w-[260px] bg-white text-black z-50 flex flex-col shadow-2xl"'
);
content = content.replace(
  'className="p-5 flex items-center justify-between border-b border-slate-200 bg-[#0a0a0f]"',
  'className="p-5 flex items-center justify-between border-b border-slate-100 bg-amber-50"'
);

// Fix the active item style
content = content.replace(
  "active ? 'bg-[#dfa510]/10 text-[#dfa510] border-l-4 border-[#dfa510]' : 'text-slate-500 hover:bg-[#1a1a2e]'",
  "active ? 'bg-amber-100/50 text-[#dfa510] border-r-4 border-[#dfa510]' : 'text-slate-700 hover:bg-slate-50'"
);

// Buttons
content = content.replace(/bg-\[\#2b1f42\] border border-\[\#dfa510\]\/30/g, 'bg-[#2b1f42]');
content = content.replace(/border-slate-200 bg-\[\#0a0a0f\] text-slate-100/g, 'border-slate-300 bg-white text-slate-800');
content = content.replace(/border-\[\#dfa510\] bg-\[\#0a0a0f\] text-white/g, 'border-amber-400 bg-white text-slate-700');

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
