import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

// Replace main container
content = content.replace(
  'bg-[#f4f6fc] text-slate-800 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-2xl',
  'bg-[#0a0a0f] text-slate-100 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-[0_0_40px_rgba(240,192,64,0.15)]'
);

content = content.replace(
  '<div className="flex-1 flex flex-col h-full bg-[#f4f6fc]">',
  '<div className="flex-1 flex flex-col h-full bg-[#0a0a0f]">'
);

// Header
content = content.replace(
  '<header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">',
  '<header className="h-[60px] bg-[#12121e] border-b border-b-[#f0c040]/20 flex items-center justify-between px-2 shrink-0 z-30 relative">'
);
content = content.replace(
  'className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition"',
  'className="p-3 text-[#f0c040] active:bg-[#f0c040]/10 rounded-full transition"'
);
content = content.replace(
  'className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition"',
  'className="p-3 text-slate-400 active:bg-[#f0c040]/10 rounded-full transition"'
);
content = content.replace(
  '<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-slate-800 font-bold tracking-tight">',
  '<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-[#f0c040] font-bold tracking-tight">'
);


// Replace Cards
content = content.replace(/bg-white rounded-xl shadow p-4 text-slate-800/g, 'bg-[#12121e] rounded-xl border border-[#2a2a36] shadow-lg p-4 text-slate-100');
content = content.replace(/bg-white rounded-xl shadow/g, 'bg-[#12121e] rounded-xl shadow-lg border border-[#2a2a36]');
content = content.replace(/bg-white p-4 rounded-xl shadow/g, 'bg-[#12121e] p-4 rounded-xl shadow border border-[#2a2a36]');


// Replace Wingo Manager elements
content = content.replace(/text-\[\#dfa510\]/g, 'text-[#f0c040]');
content = content.replace(/border-slate-200/g, 'border-[#2a2a36]');
content = content.replace(/border-slate-100/g, 'border-[#2a2a36]');
content = content.replace(/bg-slate-50/g, 'bg-[#1a1a24]');
content = content.replace(/bg-slate-100/g, 'bg-[#1a1a24]');
content = content.replace(/bg-slate-200/g, 'bg-[#2a2a36]');
content = content.replace(/text-slate-500/g, 'text-slate-400');
content = content.replace(/text-slate-600/g, 'text-slate-300');
content = content.replace(/text-slate-700/g, 'text-slate-300');
content = content.replace(/text-slate-800/g, 'text-slate-200');

// Replace Wingo table elements
content = content.replace(/border-b border-\[\#2a2a36\] last:border-0 hover:bg-\[\#1a1a24\]/g, 'border-b border-[#2a2a36] last:border-0 hover:bg-[#1a1a2e]');

// Sidebar
content = content.replace(
  'className="absolute inset-y-0 left-0 w-[260px] bg-white text-black z-50 flex flex-col shadow-2xl"',
  'className="absolute inset-y-0 left-0 w-[260px] bg-[#12121e] border-r border-[#f0c040]/30 text-white z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]"'
);
content = content.replace(
  'className="p-5 flex items-center justify-between border-b border-[#2a2a36] bg-amber-50"',
  'className="p-5 flex items-center justify-between border-b border-[#2a2a36] bg-[#0a0a0f]"'
);
content = content.replace(
  "active ? 'bg-amber-100/50 text-[#f0c040] border-r-4 border-[#f0c040]' : 'text-slate-300 hover:bg-[#1a1a24]'",
  "active ? 'bg-[#f0c040]/10 text-[#f0c040] border-l-4 border-[#f0c040]' : 'text-slate-400 hover:bg-[#1a1a2e]'"
);

// Buttons
content = content.replace(/bg-\[\#2b1f42\]/g, 'bg-[#2b1f42] border border-[#f0c040]/30');
content = content.replace(/border-slate-300/g, 'border-[#2a2a36] bg-[#0a0a0f] text-slate-100');

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
