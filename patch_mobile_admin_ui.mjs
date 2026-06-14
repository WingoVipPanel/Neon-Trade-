import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

content = content.replace(
  '<div className="text-xs text-slate-500 mt-1">{new Date(t.timestamp).toLocaleString()}</div>',
  \`{t.type === 'Deposit' && t.utr && <div className="font-bold text-sm text-slate-600">UTR: <span className="font-medium text-slate-500">{t.utr}</span></div>}
  {t.type === 'Withdraw' && t.methodDetails && <div className="font-bold text-sm text-slate-600">{t.methodType}: <span className="font-medium text-slate-500">{t.methodDetails}</span></div>}
  <div className="text-xs text-slate-500 mt-1">{new Date(t.timestamp).toLocaleString()}</div>\`
);

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
