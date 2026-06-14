import fs from 'fs';
let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

content = content.replace(
  "const [upiData, setUpiData] = useState<{ upiId: string; qrUrl: string; enabled: boolean }[]>([]);",
  "const [upiQr, setUpiQr] = useState<any>({ activeId: '', list: [] });"
);

content = content.replace(
  `      const u = localStorage.getItem('wt_admin_qr_config');
      if (u) {
        const parsed = JSON.parse(u);
        setUpiData(parsed.upiOptions || [{ upiId: parsed.upiId, enabled: true, qrUrl: '' }]);
      }`,
  `      const u = localStorage.getItem('wt_admin_qr_config');
      if (u) {
        try {
          const q = JSON.parse(u);
          if (q && q.list) {
            setUpiQr(q);
          }
        } catch(e) {}
      }`
);

content = content.replace(/const handleAddUpi[\s\S]*?const handleSaveUpi[\s\S]*?\};/ms, `  const handleAddUpi = () => {
    if (!newUpiId.trim()) return;
    const newId = 'upi_' + Date.now();
    const nextList = [...(upiQr.list || []), { id: newId, upiId: newUpiId.trim(), qrUrl: '' }];
    const nextConfig = { ...upiQr, list: nextList };
    if (!nextConfig.activeId) nextConfig.activeId = newId;
    setUpiQr(nextConfig);
    setNewUpiId('');
    syncLocal('wt_admin_qr_config', nextConfig);
    notifyToast('UPI Added');
  };

  const handleDeleteUpi = (id: string) => {
    const nextList = upiQr.list.filter((u: any) => u.id !== id);
    const nextConfig = { ...upiQr, list: nextList };
    if (upiQr.activeId === id) {
      nextConfig.activeId = nextList[0]?.id || '';
    }
    setUpiQr(nextConfig);
    syncLocal('wt_admin_qr_config', nextConfig);
    notifyToast('UPI Deleted');
  };

  const handleSetActiveUpi = (id: string) => {
    const nextConfig = { ...upiQr, activeId: id };
    setUpiQr(nextConfig);
    syncLocal('wt_admin_qr_config', nextConfig);
    notifyToast('Active UPI Updated');
  };

  const handleSaveUpi = (id: string, newVal: string) => {
    const nextList = upiQr.list.map((u: any) => u.id === id ? { ...u, upiId: newVal } : u);
    const nextConfig = { ...upiQr, list: nextList };
    setUpiQr(nextConfig);
    setEditingUpiId(null);
    syncLocal('wt_admin_qr_config', nextConfig);
    notifyToast('UPI Edited');
  };`);

content = content.replace(/\{upiData\.map\(\(u, i\) => \([\s\S]*?\{upiData\.length === 0 && \(/ms, `{upiQr.list?.map((u: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-3 text-center">
                      <input 
                        type="radio" 
                        name="activeUpi" 
                        checked={upiQr.activeId === u.id} 
                        onChange={() => handleSetActiveUpi(u.id)} 
                        className="w-4 h-4 text-[#dfa510] focus:ring-[#dfa510]"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {editingUpiId === u.id ? (
                        <input 
                          type="text"
                          className="border border-amber-400 rounded px-2 py-1 w-full text-sm focus:outline-none"
                          value={editingUpiValue}
                          onChange={e => setEditingUpiValue(e.target.value)}
                        />
                      ) : (
                        u.upiId
                      )}
                    </td>
                    <td className="py-2 px-3 flex gap-1 justify-end items-center">
                      {editingUpiId === u.id ? (
                         <button onClick={() => handleSaveUpi(u.id, editingUpiValue)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Save</button>
                      ) : (
                         <button onClick={() => { setEditingUpiId(u.id); setEditingUpiValue(u.upiId); }} className="bg-[#dfa510] text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Edit size={12}/> Edit</button>
                      )}
                      
                      <button onClick={() => handleDeleteUpi(u.id)} className="bg-red-500 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </td>
                  </tr>
                ))}
                {(!upiQr.list || upiQr.list.length === 0) && (`);

content = content.replace("upiData.filter(u=>u.enabled).length", "upiQr.activeId ? 1 : 0");

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
