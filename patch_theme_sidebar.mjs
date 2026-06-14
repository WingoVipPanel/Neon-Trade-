import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

content = content.replace(
  'className="absolute inset-y-0 left-0 w-[260px] bg-[#12121e] border-r border-[#f0c040]/30 text-white z-50 flex flex-col shadow-[10px_0_30px_rgba(0,0,0,0.5)]"',
  'className="absolute inset-y-0 left-0 w-[260px] bg-white text-black z-50 flex flex-col shadow-2xl"'
);

content = content.replace(/bg-\[\#12121e\]/g, 'bg-white');
content = content.replace(/text-\[\#f0c040\]/g, 'text-[#dfa510]');
content = content.replace(/border-\[\#f0c040\]/g, 'border-[#dfa510]');
content = content.replace(/bg-amber-100\/50 text-\[\#dfa510\] border-r-4 border-\[\#f0c040\]/g, 'bg-amber-100/50 text-[#dfa510] border-r-4 border-[#dfa510]');

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
