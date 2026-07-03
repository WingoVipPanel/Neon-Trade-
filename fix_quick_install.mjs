import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace('{* <QuickInstall selectedLang={selectedLang} currentTab={currentTab} /> *}', '{/* <QuickInstall selectedLang={selectedLang} currentTab={currentTab} /> */}');
fs.writeFileSync('src/App.tsx', code);
console.log("Fixed!");
