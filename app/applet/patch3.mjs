import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const initialContent = content;
  content = content.replace(/\{([a-zA-Z0-9_.\?\(\)]*?)\.toLocaleString\(/g, (match, p1) => {
    // skip if it looks already handled or is a function call like reduce()
    if (p1.includes('||')) return match; 
    return `{(${p1} || 0).toLocaleString(`;
  });
  content = content.replace(/\{([a-zA-Z0-9_.\?\(\)]*?)\.toLocaleString\(\)\}/g, (match, p1) => {
    if (p1.includes('||')) return match;
    return `{(${p1} || 0).toLocaleString()}`;
  });
  if (content !== initialContent) {
    fs.writeFileSync(filePath, content);
    console.log('Updated ' + filePath);
  }
}

let filesToCheck = [
  'src/components/AdminPanelView.tsx',
  'src/components/DepositScreen.tsx',
  'src/components/InvitationBonusView.tsx',
  'src/components/InvitationRecordView.tsx',
  'src/components/MinesGameView.tsx',
  'src/components/WingoWinningsModal.tsx',
  'src/App.tsx'
];

filesToCheck.forEach(replaceInFile);
