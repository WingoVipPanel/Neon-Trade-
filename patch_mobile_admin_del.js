const fs = require('fs');

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

const targetStr = '<div className={`text-xs font-bold px-2 py-1 rounded ${t.status === \\'Pending\\' ? \\'bg-amber-100 text-amber-700\\' : t.status === \\'Approved\\' ? \\'bg-green-100 text-green-700\\' : \\'bg-red-100 text-red-700\\'}`}>\n                          {t.status}\n                        </div>\n                     </div>';

const replaceStr = '<div className="flex flex-col items-end gap-2">\n                           <div className={`text-xs font-bold px-2 py-1 rounded ${t.status === \\'Pending\\' ? \\'bg-amber-100 text-amber-700\\' : t.status === \\'Approved\\' ? \\'bg-green-100 text-green-700\\' : \\'bg-red-100 text-red-700\\'}`}>\n                             {t.status}\n                           </div>\n                           <button onClick={() => handleDeleteTx(t.id, t.type)} className="text-slate-400 hover:text-red-500 p-1 bg-slate-50 rounded mt-1">\n                             <Trash2 size={16} />\n                           </button>\n                        </div>\n                     </div>';

content = content.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
