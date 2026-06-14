import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

const oldStr = `                       <div className={\`text-xs font-bold px-2 py-1 rounded \${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                         {t.status}
                       </div>
                    </div>`;

const newStr = `                       <div className="flex flex-col items-end gap-2">
                           <div className={\`text-xs font-bold px-2 py-1 rounded \${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                             {t.status}
                           </div>
                           <button onClick={() => handleDeleteTx(t.id, t.type)} className="text-slate-400 hover:text-red-500 p-1 bg-slate-50 rounded mt-1 transition-colors">
                             <Trash2 size={16} />
                           </button>
                       </div>
                    </div>`;

if(content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
    console.log("Successfully patched transaction items!");
} else {
    console.log("Could not find the target string.");
}

const oldDash = `<div className="text-2xl font-bold text-slate-800">--</div>`;
if(content.includes(oldDash)) {
    // Only patching the first 3
    content = content.replace(
        `<div className="text-2xl font-bold text-slate-800">--</div>`,
        `<div className="text-2xl font-bold text-slate-800">{users.length}</div>`
    );
    content = content.replace(
        '<div className="text-slate-500 text-xs mb-1">Total Deposits</div>\n              <div className="text-2xl font-bold text-slate-800">--</div>',
        '<div className="text-slate-500 text-xs mb-1">Pending Deposits</div>\n              <div className="text-2xl font-bold text-slate-800">{transactions.filter(t => t.type === \'Deposit\' && t.status === \'Pending\').length}</div>'
    );
    content = content.replace(
        '<div className="text-slate-500 text-xs mb-1">Total Withdrawals</div>\n              <div className="text-2xl font-bold text-slate-800">--</div>',
        '<div className="text-slate-500 text-xs mb-1">Pending Withdrawals</div>\n              <div className="text-2xl font-bold text-slate-800">{transactions.filter(t => t.type === \'Withdraw\' && t.status === \'Pending\').length}</div>'
    );
    fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
    console.log("Dashboard patched.");
}

