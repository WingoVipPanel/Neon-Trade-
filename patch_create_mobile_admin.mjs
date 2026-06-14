import fs from 'fs';

const content = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { 
  Menu, X, Settings, Users, Gift, ChevronRight, CheckCircle, 
  XCircle, Trash2, Plus, Edit, CreditCard, Landmark, 
  Gamepad2, ArrowLeft, DollarSign, LogOut, RefreshCw, LayoutDashboard, Copy, 
  Check as CheckIcon, Info
} from 'lucide-react';

interface MobileAdminPanelViewProps {
  onLogout: () => void;
  onToggleView?: () => void;
}

export default function MobileAdminPanelView({ onLogout, onToggleView }: MobileAdminPanelViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [subView, setSubView] = useState('30s'); // For Wingo
  const [toastMsg, setToastMsg] = useState('');

  const notifyToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const navigateTo = (view: string, sub?: string) => {
    setCurrentView(view);
    if (sub) setSubView(sub);
    setIsSidebarOpen(false);
  };

  // -------------------------------------------------------------
  // UPI Management State
  // -------------------------------------------------------------
  const [upiData, setUpiData] = useState<{ upiId: string; qrUrl: string; enabled: boolean }[]>([]);
  const [newUpiId, setNewUpiId] = useState('');
  const [editingUpiId, setEditingUpiId] = useState<string | null>(null);
  const [editingUpiValue, setEditingUpiValue] = useState('');

  // -------------------------------------------------------------
  // Gift Code State
  // -------------------------------------------------------------
  const [gifts, setGifts] = useState<any[]>([]);
  const [genAmount, setGenAmount] = useState('100');
  const [genMaxLimit, setGenMaxLimit] = useState('50');

  // -------------------------------------------------------------
  // Finance (Deposit/Withdraw) State
  // -------------------------------------------------------------
  const [transactions, setTransactions] = useState<any[]>([]);

  // -------------------------------------------------------------
  // Wingo State
  // -------------------------------------------------------------
  const [activeAdminRoom, setActiveAdminRoom] = useState<'30s' | '1m' | '3m' | '5m'>('30s');
  const [roomTimers, setRoomTimers] = useState<Record<string, number>>({'30s': 0, '1m': 0, '3m': 0, '5m': 0});
  const [roomData, setRoomData] = useState<Record<string, any>>({'30s': { history:[], lastPeriod: '' }, '1m': { history:[], lastPeriod: '' }, '3m': { history:[], lastPeriod: '' }, '5m': { history:[], lastPeriod: '' }});
  const [serverNextPrediction, setServerNextPrediction] = useState<Record<string, number|null>>({'30s': null, '1m': null, '3m': null, '5m': null});
  const socketRef = useRef<any>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selectedNextResult, setSelectedNextResult] = useState<number | null>(null);

  const getNumberColorText = (num: number) => {
    if ([1, 3, 7, 9].includes(num)) return 'Green';
    if ([2, 4, 6, 8].includes(num)) return 'Red';
    if (num === 0) return 'Red+Violet';
    if (num === 5) return 'Green+Violet';
    return '-';
  };

  const syncLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  // INITIAL LOAD
  useEffect(() => {
    try {
      const g = localStorage.getItem('wt_admin_gifts');
      if (g) setGifts(JSON.parse(g));
      
      const t = localStorage.getItem('wt_admin_transactions');
      if (t) setTransactions(JSON.parse(t));

      const u = localStorage.getItem('wt_admin_qr_config');
      if (u) {
        const parsed = JSON.parse(u);
        setUpiData(parsed.upiOptions || [{ upiId: parsed.upiId, enabled: true, qrUrl: '' }]);
      }
    } catch(e) {}
  }, []);

  // Wingo Socket Sync
  useEffect(() => {
    let active = true;
    const socket = io({ reconnectionAttempts: 10, timeout: 20000, autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => { if(active) setSocketConnected(true); });
    socket.on('disconnect', () => { if(active) setSocketConnected(false); });
    socket.on('initial_data', (rData: any) => { if(active) setRoomData(rData); });
    socket.on('timer_sync', ({ room, time }: any) => { if (active) setRoomTimers(prev => ({ ...prev, [room]: time })); });
    socket.on('prediction_updated', ({ room, nextManualResult }: any) => {
       if (active) {
         setServerNextPrediction(prev => ({ ...prev, [room]: nextManualResult }));
         if (activeAdminRoom === room) setSelectedNextResult(nextManualResult ?? null);
       }
    });
    socket.on('new_result', ({ room, result }: any) => {
       if (active) {
         setRoomData(prev => {
             let state = { ...prev };
             if (state[room]) {
                 state[room].history = [result, ...(state[room].history || []).filter((h: any) => h.period !== result.period)].slice(0, 50);
                 state[room].lastPeriod = result.period;
             }
             return state;
         });
       }
    });
    return () => { active = false; socket.disconnect(); };
  }, [activeAdminRoom]);


  // ----------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------

  const activeSecondsLeft = roomTimers[activeAdminRoom] || 0;
  const activeDraws = roomData[activeAdminRoom]?.history || [];
  
  let lastPeriod = roomData[activeAdminRoom]?.lastPeriod || "20260522100012000";
  let activeCurrentPeriod = "";
  try {
     const bp = lastPeriod.substring(0, 13);
     const seq = lastPeriod.substring(13);
     activeCurrentPeriod = bp + String(parseInt(seq) + 1).padStart(4, '0');
  } catch(e) {
     activeCurrentPeriod = String(parseInt(lastPeriod) + 1);
  }

  const handleConfirmNextResult = () => {
    if (socketRef.current) socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: selectedNextResult });
    notifyToast(selectedNextResult !== null ? \`Number \${selectedNextResult} confirmed for next draw!\` : \`Unset prediction.\`);
  };

  const handleCreateGift = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    const newGift = {
      id: Date.now().toString(),
      code,
      amount: parseInt(genAmount) || 0,
      currentUsage: 0,
      maxLimit: parseInt(genMaxLimit) || 0,
      expiryTime: new Date(Date.now() + 86400000).toISOString(),
      active: true
    };
    const nextList = [newGift, ...gifts];
    setGifts(nextList);
    syncLocal('wt_admin_gifts', nextList);
    notifyToast(\`Created \${code}\`);
  };

  const handleDeleteGift = (id: string) => {
    const nextList = gifts.filter(g => g.id !== id);
    setGifts(nextList);
    syncLocal('wt_admin_gifts', nextList);
  };

  const handleTxAction = (id: string, newStatus: string) => {
    const nextList = transactions.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTransactions(nextList);
    syncLocal('wt_admin_transactions', nextList);

    // Give user balance if deposit approved
    if (newStatus === 'Approved') {
        const tx = transactions.find(t => t.id === id);
        if (tx && tx.type === 'Deposit') {
            const uStr = localStorage.getItem('wt_admin_users');
            if (uStr) {
                const users = JSON.parse(uStr);
                const updated = users.map((u: any) => u.id === tx.userId ? { ...u, balance: (u.balance || 0) + tx.amount } : u);
                syncLocal('wt_admin_users', updated);
            }
        }
    }
  };

  const handleAddUpi = () => {
    if (!newUpiId.trim()) return;
    const upd = [...upiData, { upiId: newUpiId, enabled: false, qrUrl: '' }];
    setUpiData(upd);
    setNewUpiId('');
    syncLocal('wt_admin_qr_config', { upiId: upd.find(u => u.enabled)?.upiId || '', upiOptions: upd });
  };

  const handleDeleteUpi = (id: string) => {
    const upd = upiData.filter(u => u.upiId !== id);
    setUpiData(upd);
    syncLocal('wt_admin_qr_config', { upiId: upd.find(u => u.enabled)?.upiId || '', upiOptions: upd });
  };

  const handleSetActiveUpi = (id: string) => {
    const upd = upiData.map(u => ({ ...u, enabled: u.upiId === id }));
    setUpiData(upd);
    syncLocal('wt_admin_qr_config', { upiId: id, upiOptions: upd });
  };

  const handleSaveUpi = (oldId: string, newVal: string) => {
    const upd = upiData.map(u => u.upiId === oldId ? { ...u, upiId: newVal } : u);
    setUpiData(upd);
    setEditingUpiId(null);
    syncLocal('wt_admin_qr_config', { upiId: upd.find(u => u.enabled)?.upiId || '', upiOptions: upd });
  };


  // ----------------------------------------------------------------------
  // SCENES
  // ----------------------------------------------------------------------

  const renderWingoManager = () => {
    // Determine Mins/Secs representation
    const maxVal = activeAdminRoom === '30s' ? 30 : activeAdminRoom === '1m' ? 60 : activeAdminRoom === '3m' ? 180 : 300;
    const isRed = activeSecondsLeft <= 5;
    
    return (
      <div className="flex flex-col gap-4 fade-in">
        <div className="bg-white rounded-xl shadow p-4 text-slate-800">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-lg text-[#dfa510]">WinGo {activeAdminRoom.toUpperCase()}</h3>
             <div className="text-sm font-mono text-slate-500">Period Id: {activeCurrentPeriod}</div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <span className="font-medium text-sm">Count Down:</span>
             <span className={\`font-mono text-xl font-bold \${isRed ? 'text-red-500 animate-pulse' : 'text-[#dfa510]'}\`}>
                {Math.floor(activeSecondsLeft / 60).toString().padStart(2, '0')}:{(activeSecondsLeft % 60).toString().padStart(2, '0')}
             </span>
             {socketConnected ? <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> LIVE</span> : <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> OFFLINE</span>}
          </div>

          <div className="border border-slate-200 rounded-lg p-3 mb-4 text-center">
            <div className="text-sm text-slate-500 mb-2">Next prediction : {selectedNextResult !== null ? <span className="font-bold text-lg text-[#dfa510]">{selectedNextResult}</span> : <span className="text-red-500 font-bold">NOT SET</span>}</div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[0,1,2,3,4,5,6,7,8,9].map(n => {
                const color = getNumberColorText(n);
                return (
                  <button 
                    key={n} 
                    onClick={() => setSelectedNextResult(selectedNextResult === n ? null : n)}
                    className={\`h-10 text-lg font-bold rounded flex items-center justify-center transition-all \${selectedNextResult === n ? 'ring-2 ring-offset-1 ring-blue-500 text-white shadow-md' : 'bg-slate-100 hover:bg-slate-200'} \${color.includes('Red') ? 'bg-red-50 text-red-600' : ''} \${color.includes('Green') ? 'bg-green-50 text-green-600' : ''}\`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirmNextResult} className="flex-1 bg-[#2b1f42] text-white py-2 rounded font-medium shadow active:scale-95 transition">Confirm Prediction</button>
              <button onClick={() => { setSelectedNextResult(null); handleConfirmNextResult(); }} className="flex-1 bg-slate-200 text-slate-700 py-2 rounded font-medium shadow active:scale-95 transition">Unset Prediction</button>
            </div>
          </div>

          <div>
             <h4 className="font-bold text-sm mb-2 text-slate-600">Result History</h4>
             <div className="overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Period</th>
                      <th className="py-2 px-3">Number</th>
                      <th className="py-2 px-3">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDraws.slice(0,10).map((dr: any, i: number) => (
                      <tr key={\`\${dr.period}-\${i}\`} className="border-b border-slate-100">
                         <td className="py-2 px-3 font-mono">{dr.period}</td>
                         <td className="py-2 px-3 font-bold">{dr.number}</td>
                         <td className="py-2 px-3">{dr.color}</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderUpiManager = () => (
    <div className="flex flex-col gap-4 fade-in">
       <div className="bg-white rounded-xl shadow p-4 text-slate-800">
          <h3 className="font-bold text-lg mb-4 text-[#dfa510]">UPI Management</h3>
          <div className="flex gap-2 mb-6">
            <input 
               type="text" 
               className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#dfa510]" 
               placeholder="Add an UPI ID" 
               value={newUpiId}
               onChange={e => setNewUpiId(e.target.value)}
            />
            <button onClick={handleAddUpi} className="bg-[#2b1f42] text-white px-4 py-2 rounded font-medium">Add</button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3 text-center">Active</th>
                  <th className="py-2 px-3">UPI ID</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {upiData.map((u, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-3 text-center">
                      <input 
                        type="radio" 
                        name="activeUpi" 
                        checked={u.enabled} 
                        onChange={() => handleSetActiveUpi(u.upiId)} 
                        className="w-4 h-4 text-[#dfa510] focus:ring-[#dfa510]"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-700 font-medium">
                      {editingUpiId === u.upiId ? (
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
                      {editingUpiId === u.upiId ? (
                         <button onClick={() => handleSaveUpi(u.upiId, editingUpiValue)} className="bg-green-500 text-white px-3 py-1 rounded text-xs">Save</button>
                      ) : (
                         <button onClick={() => { setEditingUpiId(u.upiId); setEditingUpiValue(u.upiId); }} className="bg-[#dfa510] text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Edit size={12}/> Edit</button>
                      )}
                      
                      <button onClick={() => handleDeleteUpi(u.upiId)} className="bg-red-500 text-white px-3 py-1 rounded text-xs flex items-center gap-1"><Trash2 size={12}/> Delete</button>
                    </td>
                  </tr>
                ))}
                {upiData.length === 0 && (
                   <tr><td colSpan={3} className="py-8 text-center text-slate-400">No UPI IDs found</td></tr>
                )}
              </tbody>
            </table>
          </div>
       </div>
    </div>
  );

  const renderGiftCode = () => (
    <div className="flex flex-col gap-4 fade-in">
       <div className="bg-white rounded-xl shadow p-4 text-slate-800">
          <h3 className="font-bold text-lg mb-4 text-[#dfa510]">Gift Code Generator</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
             <div>
               <label className="text-xs text-slate-500 mb-1 block">Value</label>
               <input type="number" value={genAmount} onChange={e=>setGenAmount(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
             </div>
             <div>
               <label className="text-xs text-slate-500 mb-1 block">Usage Limit</label>
               <input type="number" value={genMaxLimit} onChange={e=>setGenMaxLimit(e.target.value)} className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
             </div>
          </div>
          <button onClick={handleCreateGift} className="w-full bg-[#dfa510] text-white py-2 rounded shadow font-bold tracking-wide active:scale-95 transition mb-6">
             Generate Gift Code
          </button>

          <h4 className="font-bold text-sm mb-2 text-slate-600">Active Codes</h4>
          <div className="flex flex-col gap-2">
            {gifts.map(g => (
              <div key={g.id} className="border border-slate-200 rounded p-3 flex justify-between items-center bg-slate-50">
                 <div>
                    <div className="font-mono font-bold text-[#dfa510]">{g.code}</div>
                    <div className="text-xs text-slate-500">Value: ₹{g.amount} • Used: {g.currentUsage}/{g.maxLimit}</div>
                 </div>
                 <button onClick={() => handleDeleteGift(g.id)} className="p-2 text-red-500 hover:bg-red-50 rounded"><Trash2 size={18} /></button>
              </div>
            ))}
            {gifts.length === 0 && <div className="text-center text-sm text-slate-400 py-4 border border-slate-100 rounded">No active gifts</div>}
          </div>
       </div>
    </div>
  );

  const renderFinance = (type: 'Deposit' | 'Withdraw') => {
    const list = transactions.filter(t => t.type === type);
    return (
      <div className="flex flex-col gap-4 fade-in">
         <div className="bg-white rounded-xl shadow p-4 text-slate-800">
            <h3 className="font-bold text-lg mb-4 text-[#dfa510]">{type} Requests</h3>
            <div className="flex flex-col gap-3">
               {list.map(t => (
                 <div key={t.id} className="border border-slate-200 rounded p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <div>
                         <div className="font-bold text-sm text-slate-700">UID: {t.userId}</div>
                         <div className="text-xs text-slate-500">{new Date(t.timestamp).toLocaleString()}</div>
                       </div>
                       <div className={\`text-xs font-bold px-2 py-1 rounded \${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                         {t.status}
                       </div>
                    </div>
                    <div className="font-bold text-xl my-1">₹{(t.amount || 0).toLocaleString()}</div>
                    {t.status === 'Pending' && (
                       <div className="flex gap-2 mt-2">
                          <button onClick={() => handleTxAction(t.id, 'Approved')} className="flex-1 bg-green-500 text-white py-1.5 rounded text-sm font-medium">Approve</button>
                          <button onClick={() => handleTxAction(t.id, 'Rejected')} className="flex-1 bg-red-500 text-white py-1.5 rounded text-sm font-medium">Reject</button>
                       </div>
                    )}
                 </div>
               ))}
               {list.length === 0 && <div className="text-center text-slate-400 text-sm py-8 bg-slate-50 rounded border border-slate-100">No {type.toLowerCase()}s found</div>}
            </div>
         </div>
      </div>
    );
  };


  const renderDashboard = () => (
    <div className="flex flex-col gap-4 fade-in">
        <div className="grid grid-cols-2 gap-3">
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-[#dfa510]">
              <div className="text-slate-500 text-xs mb-1">Total Users</div>
              <div className="text-2xl font-bold text-slate-800">--</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
              <div className="text-slate-500 text-xs mb-1">Total Deposits</div>
              <div className="text-2xl font-bold text-slate-800">--</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
              <div className="text-slate-500 text-xs mb-1">Total Withdrawals</div>
              <div className="text-2xl font-bold text-slate-800">--</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
              <div className="text-slate-500 text-xs mb-1">Active UPI</div>
              <div className="text-2xl font-bold text-slate-800">{upiData.filter(u=>u.enabled).length}</div>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center justify-center min-h-[160px] text-center">
           <Landmark size={48} className="text-[#dfa510] opacity-20 mb-3" />
           <p className="text-slate-500 text-sm max-w-[200px]">Use the side menu to navigate through Mobile Admin features.</p>
        </div>
    </div>
  );

  const MenuItem = ({ icon, label, view, sub, active }: any) => (
    <button 
      onClick={() => {
        if (view === 'wingo') setActiveAdminRoom(sub as any);
        navigateTo(view, sub);
      }}
      className={\`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-medium \${active ? 'bg-amber-100/50 text-[#dfa510] border-r-4 border-[#dfa510]' : 'text-slate-700 hover:bg-slate-50'}\`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      <ChevronRight size={16} className={\`ml-auto transition-transform \${active ? 'text-[#dfa510] translate-x-1' : 'text-slate-300'}\`} />
    </button>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f6fc] text-slate-800 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-2xl">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-16 left-4 right-4 z-[60] bg-black/90 text-white text-sm font-medium px-4 py-3 rounded-lg shadow-xl flex items-center justify-center text-center"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 z-40"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="absolute inset-y-0 left-0 w-[260px] bg-white text-black z-50 flex flex-col shadow-2xl"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100 bg-amber-50">
                <div className="font-black text-xl text-[#dfa510] tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center text-[#dfa510]">
                    <Settings shrink={0} size={24} />
                  </div>
                  ADMIN
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-2 pb-20">
                <MenuItem icon={<LayoutDashboard size={18}/>} label="Dashboard" view="dashboard" active={currentView==='dashboard'} />
                
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">WinGo Manager</div>
                <MenuItem icon={<Gamepad2 size={18}/>} label="WinGo 30Sec" view="wingo" sub="30s" active={currentView==='wingo' && subView==='30s'} />
                <MenuItem icon={<Gamepad2 size={18}/>} label="WinGo 1Min" view="wingo" sub="1m" active={currentView==='wingo' && subView==='1m'} />
                <MenuItem icon={<Gamepad2 size={18}/>} label="WinGo 3Min" view="wingo" sub="3m" active={currentView==='wingo' && subView==='3m'} />
                <MenuItem icon={<Gamepad2 size={18}/>} label="WinGo 5Min" view="wingo" sub="5m" active={currentView==='wingo' && subView==='5m'} />
                
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Finance</div>
                <MenuItem icon={<CreditCard size={18}/>} label="Add Upi" view="upi" active={currentView==='upi'} />
                <MenuItem icon={<ArrowRightLeft size={18}/>} label="Deposit Update" view="finance" sub="Deposit" active={currentView==='finance' && subView==='Deposit'} />
                <MenuItem icon={<CreditCard size={18}/>} label="Withdraw Apply" view="finance" sub="Withdraw" active={currentView==='finance' && subView==='Withdraw'} />
                
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Others</div>
                <MenuItem icon={<Gift size={18}/>} label="Gift Code" view="gift" active={currentView==='gift'} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col h-full bg-[#f4f6fc]">
        {/* Header - White header with black text like screenshot */}
        <header className="h-[60px] bg-white border-b border-slate-100 flex items-center justify-between px-2 shrink-0 z-30 shadow-sm relative">
          <button onClick={() => setIsSidebarOpen(true)} className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition">
            <Menu size={24} />
          </button>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 text-slate-800 font-bold tracking-tight">
            Admin Panel
          </div>
          <button onClick={onToggleView || onLogout} className="p-3 text-slate-700 active:bg-slate-100 rounded-full transition">
            <Settings size={20} />
          </button>
        </header>

        {/* Desktop alert if opened on desktop (Optional info) */}
        <div className="bg-amber-100 text-amber-800 text-[11px] p-1.5 text-center hidden md:block">
           This panel is strictly optimized for Mobile screens.
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto w-full p-4 pb-12">
          {currentView === 'dashboard' && renderDashboard()}
          {currentView === 'wingo' && renderWingoManager()}
          {currentView === 'upi' && renderUpiManager()}
          {currentView === 'finance' && renderFinance(subView as any)}
          {currentView === 'gift' && renderGiftCode()}
        </main>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
