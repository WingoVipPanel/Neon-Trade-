import fs from 'fs';
let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

content = content.replace(/dfa510/g, 'f0c040');
// Also fix text-black to text-white in sidebar if it exists
content = content.replace(/text-black/g, 'text-white');

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
