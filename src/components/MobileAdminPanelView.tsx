import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io } from 'socket.io-client';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, runTransaction, getDocs, deleteDoc , setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Menu, X, Settings, Users, Gift, ChevronRight, CheckCircle, 
  XCircle, Trash2, Plus, Edit, CreditCard, Landmark, 
  Gamepad2, ArrowLeft, ArrowRightLeft, DollarSign, LogOut, RefreshCw, LayoutDashboard, Copy, 
  Check as CheckIcon, Info, Send
} from 'lucide-react';

interface MobileAdminPanelViewProps {
  onLogout: () => void;
  onToggleView?: () => void;
}

export default function MobileAdminPanelView({ onLogout, onToggleView }: MobileAdminPanelViewProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWingoMenuOpen, setIsWingoMenuOpen] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');
  const [subView, setSubView] = useState('30s'); // For Wingo
  const [toastMsg, setToastMsg] = useState('');
  const [userSearchQuery, setUserSearchQuery] = useState('');

  const notifyToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const [pendingAlerts, setPendingAlerts] = useState<any[]>([]);

  const playNotificationSound = (type: 'deposit' | 'withdraw') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'deposit') {
        // High-fidelity sweet double ding for successful deposit recharge alert
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc1.type = 'sine';
        osc2.type = 'sine';
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
        osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
        
        osc2.frequency.setValueAtTime(1046.50, ctx.currentTime); // C6
        osc2.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.12); // E6
        osc2.frequency.setValueAtTime(1567.98, ctx.currentTime + 0.24); // G6
        
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.6);
        osc2.stop(ctx.currentTime + 0.6);
      } else {
        // Warning dual warning chime for cashout withdraw requests
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440.00, ctx.currentTime); // A4
        osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15); // F4
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.error('Failed to play notification sound', e);
    }
  };

  const triggerRealtimeAlert = (alert: { id: string; type: 'deposit' | 'withdraw'; amount: number; user: string; timestamp: number }) => {
    playNotificationSound(alert.type);
    setPendingAlerts(prev => {
      if (prev.some(a => a.id === alert.id)) return prev;
      return [...prev, alert];
    });
    
    // Auto remove after 12 seconds to give plenty of time for response
    setTimeout(() => {
      setPendingAlerts(prev => prev.filter(a => a.id !== alert.id));
    }, 12000);
  };

  const navigateTo = (view: string, sub?: string) => {
    setCurrentView(view);
    if (sub) setSubView(sub);
    setIsSidebarOpen(false);
  };

  // -------------------------------------------------------------
  // UPI Management State
  // -------------------------------------------------------------
  const [upiQr, setUpiQr] = useState<any>({ activeId: 'upi-1', list: [{id: 'upi-1', upiId: '7973491904@ptsbi', qrUrl: ''}] });
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
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!db) return;
    
    let isInitialDepLoad = true;
    let isInitialWithLoad = true;

    // Listen to Deposit Requests
    const qDep = query(collection(db, 'depositRequests'), orderBy('createdAt', 'desc'));
    const unsubDep = onSnapshot(qDep, (snap) => {
       const deps = snap.docs.map(doc => {
           const data = doc.data();
           return {
               id: doc.id,
               type: 'Deposit',
               userId: data.userId || data.uid || 'Unknown',
               displayUid: data.uid || data.userId || 'Unknown',
               amount: data.amount || data.totalAmount || 0,
               timestamp: data.createdAt?.toDate?.()?.getTime?.() || Date.now(),
               status: data.status === 'pending' ? 'Pending' : data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status,
               utr: data.utr,
               method: data.method
           };
       });

       if (!isInitialDepLoad) {
         snap.docChanges().forEach((change) => {
           if (change.type === 'added') {
             const data = change.doc.data();
             const status = data.status || 'pending';
             if (status === 'pending') {
               const amt = data.amount || data.totalAmount || 0;
               const txId = change.doc.id;
               const userStr = data.uid || data.userId || 'User';
               triggerRealtimeAlert({
                 id: 'alert_dep_' + txId,
                 type: 'deposit',
                 amount: amt,
                 user: userStr,
                 timestamp: Date.now()
               });
             }
           }
         });
       } else {
         isInitialDepLoad = false;
       }

       setTransactions(prev => {
          const others = prev.filter(p => p.type !== 'Deposit');
          const combined = [...others, ...deps].sort((a,b)=> b.timestamp - a.timestamp);
          return combined;
       });
    });

    // Listen to Withdraw Requests
    const qWith = query(collection(db, 'withdrawRequests'), orderBy('createdAt', 'desc'));
    const unsubWith = onSnapshot(qWith, (snap) => {
       const withs = snap.docs.map(doc => {
           const data = doc.data();
           return {
               id: doc.id,
               type: 'Withdraw',
               userId: data.userId || data.uid || 'Unknown',
               displayUid: data.uid || data.userId || 'Unknown',
               amount: data.amount || 0,
               timestamp: data.createdAt?.toDate?.()?.getTime?.() || Date.now(),
               status: data.status === 'pending' ? 'Pending' : data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status,
               methodDetails: data.methodDetails,
               methodType: data.methodType
           };
       });

       if (!isInitialWithLoad) {
         snap.docChanges().forEach((change) => {
           if (change.type === 'added') {
             const data = change.doc.data();
             const status = data.status || 'pending';
             if (status === 'pending') {
               const amt = data.amount || 0;
               const txId = change.doc.id;
               const userStr = data.uid || data.userId || 'User';
               triggerRealtimeAlert({
                 id: 'alert_with_' + txId,
                 type: 'withdraw',
                 amount: amt,
                 user: userStr,
                 timestamp: Date.now()
               });
             }
           }
         });
       } else {
         isInitialWithLoad = false;
       }

       setTransactions(prev => {
          const others = prev.filter(p => p.type !== 'Withdraw');
          const combined = [...others, ...withs].sort((a,b)=> b.timestamp - a.timestamp);
          return combined;
       });
    });
    
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        const uArr = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setUsers(uArr);
    }, (err) => {
        console.error("Error listening to users in Admin:", err);
    });

    return () => {
        unsubDep();
        unsubWith();
        unsubUsers();
    };
  }, []);

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

  // ----------------------------------------------------------------------
  // Derived Data
  // ----------------------------------------------------------------------
  const activeSecondsLeft = roomTimers[activeAdminRoom] || 0;
  const activeDraws = roomData[activeAdminRoom]?.history || [];
  
  let lastPeriod = roomData[activeAdminRoom]?.lastPeriod || "20260522100012000";
  let activeCurrentPeriod = "";
  try {
     if (lastPeriod.length === 17) {
       const bp = lastPeriod.substring(0, 13);
       const seq = lastPeriod.substring(13);
       activeCurrentPeriod = bp + String(parseInt(seq) + 1).padStart(4, '0');
     } else {
       activeCurrentPeriod = (BigInt(lastPeriod) + 1n).toString();
     }
  } catch(e) {
     activeCurrentPeriod = String(parseInt(lastPeriod) + 1);
  }

  // -------------------------------------------------------------
  // Prediction Generator State
  // -------------------------------------------------------------
  const [predPeriod, setPredPeriod] = useState('');
  const [predBetOn, setPredBetOn] = useState<'BIG' | 'SMALL'>('BIG');
  const [predJackpot, setPredJackpot] = useState('7');
  const [predCopied, setPredCopied] = useState(false);

  // Sync predPeriod with current active period
  useEffect(() => {
    if (activeCurrentPeriod) {
      setPredPeriod(activeCurrentPeriod.slice(-3));
    }
  }, [activeCurrentPeriod]);

  const boldMap: Record<string, string> = {
    'B': '𝗕', 'I': '𝗜', 'G': '𝗚',
    'S': '𝗦', 'M': '𝗠', 'A': '𝗔', 'L': '𝗟',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰',
    '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
  };

  const toBold = (text: string) => {
    return text.split('').map(char => boldMap[char] || char).join('');
  };

  const generatePredictionMessage = () => {
    const formattedBet = toBold(predBetOn);
    const formattedPeriod = toBold(predPeriod);
    const formattedJackpot = toBold(predJackpot);
    const registerLink = `https://neon-trade.vercel.app?ref=451555`;

    return `🚀 𝗪𝗜𝗡𝗚𝗚𝗢 ${activeAdminRoom === '30s' ? '𝟯𝟬 𝗦𝗘𝗖' : activeAdminRoom.toUpperCase().replace('M', ' 𝗠𝗜𝗡𝗨𝗧𝗘')} 🚀

📊 𝗣𝗘𝗥𝗜𝗢𝗗 : ${formattedPeriod}

🎯 𝗕𝗘𝗧 𝗢𝗡 : ${formattedBet}

💎 𝗝𝗔𝗖𝗞𝗣𝗢𝗧 𝗡𝗨𝗠𝗕𝗘𝗥 : ${formattedJackpot}

𝗥𝗘𝗚𝗜𝗦𝗧𝗘𝗥 𝗟𝗜𝗡𝗞 :
${registerLink}`;
  };

  const handleCopyPrediction = async () => {
    try {
      await navigator.clipboard.writeText(generatePredictionMessage());
      setPredCopied(true);
      notifyToast("Message copied to clipboard!");
      setTimeout(() => setPredCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy!', err);
    }
  };

  const handleSharePrediction = () => {
    const message = encodeURIComponent(generatePredictionMessage());
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

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

      const us = localStorage.getItem('wt_admin_users');
      if (us) setUsers(JSON.parse(us));

      const u = localStorage.getItem('wt_admin_qr_config');
      if (u) {
        try {
          const q = JSON.parse(u);
          if (q && q.list) {
            setUpiQr(q);
          }
        } catch(e) {}
      }
    } catch(e) {}
  }, []);

  const activeAdminRoomRef = useRef(activeAdminRoom);
  useEffect(() => {
    activeAdminRoomRef.current = activeAdminRoom;
    // When switching rooms, update the selected result from the already synced server state
    setSelectedNextResult(serverNextPrediction[activeAdminRoom] ?? null);
  }, [activeAdminRoom, serverNextPrediction]);

  // Wingo Socket Sync
  useEffect(() => {
    let active = true;
    const socket = io({ 
      transports: ['polling', 'websocket'], 
      reconnectionAttempts: Infinity, 
      timeout: 20000, 
      autoConnect: true 
    });
    socketRef.current = socket;

    socket.on('connect', () => { if(active) setSocketConnected(true); });
    socket.on('disconnect', () => { if(active) setSocketConnected(false); });
    
    socket.on('initial_data', (rData: any) => { 
      if(active) {
        setRoomData(rData);
        // Also sync the predictions
        const preds: Record<string, number | null> = {};
        Object.keys(rData).forEach(r => {
          preds[r] = rData[r].nextManualResult ?? null;
        });
        setServerNextPrediction(preds);
        // Set initial selected result for the current active room
        const currentRoom = activeAdminRoomRef.current;
        if (preds[currentRoom] !== undefined) {
          setSelectedNextResult(preds[currentRoom]);
        }
      }
    });

    socket.on('timer_sync', ({ room, time }: any) => { 
      if (active) setRoomTimers(prev => ({ ...prev, [room]: time })); 
    });

    socket.on('prediction_updated', ({ room, nextManualResult }: any) => {
       if (active) {
         setServerNextPrediction(prev => ({ ...prev, [room]: nextManualResult ?? null }));
         if (activeAdminRoomRef.current === room) {
           setSelectedNextResult(nextManualResult ?? null);
         }
       }
    });

    socket.on('new_result', ({ room, result }: any) => {
       if (active) {
         setRoomData(prev => {
             const state = { ...prev };
             if (state[room]) {
                 const oldHistory = state[room].history || [];
                 // Deduplicate by period
                 if (!oldHistory.some((h: any) => h.period === result.period)) {
                    state[room].history = [result, ...oldHistory].slice(0, 500);
                    state[room].lastPeriod = result.period;
                 }
             }
             return state;
         });
       }
    });

    return () => { 
      active = false; 
      socket.disconnect(); 
    };
  }, []); // Run once


  // ----------------------------------------------------------------------
  // RENDER HELPERS
  // ----------------------------------------------------------------------

  const handleConfirmNextResult = async () => {
    if (socketRef.current) {
        socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: selectedNextResult });
    }
    
    // Fallback for static environments (Firebase Hosting / Vercel)
    if (db) {
        try {
            await setDoc(doc(db, 'globalResults', activeAdminRoom + '_prediction'), {
                nextManualResult: selectedNextResult,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Failed to save manual prediction to Firestore', e);
        }
    }

    notifyToast(selectedNextResult !== null ? `Number ${selectedNextResult} confirmed for next draw!` : `Unset prediction.`);
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
    notifyToast(`Created ${code}`);
  };

  const handleDeleteGift = (id: string) => {
    const nextList = gifts.filter(g => g.id !== id);
    setGifts(nextList);
    syncLocal('wt_admin_gifts', nextList);
  };

  const handleTxAction = async (id: string, newStatus: string) => {
    if (!db) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx || tx.status !== 'Pending') return;

    try {
        const collectionName = tx.type === 'Deposit' ? 'depositRequests' : 'withdrawRequests';
        const docRef = doc(db, collectionName, id);
        
        await updateDoc(docRef, { status: newStatus.toLowerCase() });
        notifyToast(newStatus);
        
        if (newStatus === 'Approved') {
            await runTransaction(db, async (t) => {
                const userRef = doc(db, 'users', tx.userId);
                const userDoc = await t.get(userRef);
                if (userDoc.exists()) {
                    const currentBal = userDoc.data().balance || 0;
                    if (tx.type === 'Deposit') {
                         t.update(userRef, { 
                             balance: currentBal + tx.amount,
                             totalDeposits: (userDoc.data().totalDeposits || 0) + tx.amount
                         });
                    } else if (tx.type === 'Withdraw') {
                         // Balance is already deducted when making the request in WithdrawScreen.tsx
                         // Do nothing here to avoid double deduction
                    }
                }
            });
        } else if (newStatus === 'Rejected') {
            if (tx.type === 'Withdraw') {
                await runTransaction(db, async (t) => {
                    const userRef = doc(db, 'users', tx.userId);
                    const userDoc = await t.get(userRef);
                    if (userDoc.exists()) {
                        const currentBal = userDoc.data().balance || 0;
                        t.update(userRef, { 
                            balance: currentBal + tx.amount 
                        });
                    }
                });
            }
        }
    } catch(e: any) {
        notifyToast("Failed: " + e.message);
    }
  };

  const handleDeleteTx = async (id: string, type: string) => {
    if (!db) return;
    try {
        const collectionName = type === 'Deposit' ? 'depositRequests' : 'withdrawRequests';
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        notifyToast("Deleted successfully");
    } catch(e: any) {
        notifyToast("Delete failed: " + e.message);
    }
  };

    const handleAddUpi = () => {
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
  };


  // ----------------------------------------------------------------------
  // SCENES
  // ----------------------------------------------------------------------

  const renderPredictionGenerator = () => {
    return (
      <div className="flex flex-col gap-4 fade-in w-full min-w-0">
        <div className="bg-white rounded-xl shadow p-6 text-slate-800 w-full min-w-0 overflow-hidden border border-slate-100">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold tracking-tight mb-1 text-[#dfa510]">Prediction Generator</h1>
            <p className="text-slate-400 text-xs">Create prediction messages instantly</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Period Number</label>
              <input
                type="text"
                value={predPeriod}
                onChange={(e) => setPredPeriod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dfa510]/50"
                placeholder="e.g. 302"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Bet On</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPredBetOn('BIG')}
                  className={`py-3 rounded-xl font-bold transition-all ${predBetOn === 'BIG' ? 'bg-[#dfa510] text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                >
                  BIG
                </button>
                <button
                  onClick={() => setPredBetOn('SMALL')}
                  className={`py-3 rounded-xl font-bold transition-all ${predBetOn === 'SMALL' ? 'bg-[#dfa510] text-white shadow-md' : 'bg-slate-100 text-slate-600'}`}
                >
                  SMALL
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1 uppercase">Jackpot Number</label>
              <input
                type="text"
                value={predJackpot}
                onChange={(e) => setPredJackpot(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#dfa510]/50"
                placeholder="e.g. 7"
              />
            </div>
          </div>

          <div className="mt-6 relative">
            <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-[13px] whitespace-pre-wrap font-mono text-slate-700 min-h-[160px] leading-relaxed">
              {generatePredictionMessage()}
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleCopyPrediction}
              className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {predCopied ? <CheckIcon size={20} /> : <Copy size={20} />}
              {predCopied ? 'Copied!' : 'Copy Message'}
            </button>
            <button
              onClick={handleSharePrediction}
              className="bg-[#25D366] text-white p-4 rounded-2xl active:scale-95 transition-transform shadow-lg shadow-green-200"
            >
              <Send size={24} />
            </button>
          </div>
          
          <button 
            onClick={() => setPredPeriod((prev) => (isNaN(parseInt(prev)) ? "1" : (parseInt(prev) + 1).toString()))}
            className="w-full mt-4 text-slate-400 text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 hover:text-[#dfa510] transition-colors"
          >
            <RefreshCw size={12} />
            Next Period
          </button>
        </div>
      </div>
    );
  };

  const renderWingoManager = () => {
    // Determine Mins/Secs representation
    const maxVal = activeAdminRoom === '30s' ? 30 : activeAdminRoom === '1m' ? 60 : activeAdminRoom === '3m' ? 180 : 300;
    const isRed = activeSecondsLeft <= 5;
    
    return (
      <div className="flex flex-col gap-4 fade-in w-full min-w-0">
        <div className="bg-white rounded-xl shadow p-4 text-slate-800 w-full min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-1 mb-4">
             <h3 className="font-bold text-lg text-[#dfa510] shrink-0">WinGo {activeAdminRoom.toUpperCase()}</h3>
             <div className="text-xs sm:text-sm font-mono text-slate-500 break-all">Period Id: {activeCurrentPeriod}</div>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
             <span className="font-medium text-sm">Count Down:</span>
             <span className={`font-mono text-xl font-bold ${isRed ? 'text-red-500 animate-pulse' : 'text-[#dfa510]'}`}>
                {Math.floor(activeSecondsLeft / 60).toString().padStart(2, '0')}:{(activeSecondsLeft % 60).toString().padStart(2, '0')}
             </span>
             {socketConnected ? <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-green-500"/> LIVE</span> : <span className="ml-auto text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0"><div className="w-1.5 h-1.5 rounded-full bg-red-500"/> OFFLINE</span>}
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
                    className={`h-10 text-lg font-bold rounded flex items-center justify-center transition-all ${selectedNextResult === n ? 'ring-2 ring-offset-1 ring-blue-500 text-white shadow-md' : 'bg-slate-50 hover:bg-slate-200'} ${color.includes('Red') ? 'bg-red-50 text-red-600' : ''} ${color.includes('Green') ? 'bg-green-50 text-green-600' : ''}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={handleConfirmNextResult} className="flex-1 bg-[#2b1f42] border border-[#dfa510]/30 text-white py-2 rounded font-medium shadow active:scale-95 transition">Confirm Prediction</button>
              <button onClick={() => { setSelectedNextResult(null); handleConfirmNextResult(); }} className="flex-1 bg-slate-200 text-slate-600 py-2 rounded font-medium shadow active:scale-95 transition">Unset Prediction</button>
            </div>
          </div>

          <div className="w-full min-w-0 overflow-hidden">
             <h4 className="font-bold text-sm mb-2 text-slate-600">Result History</h4>
             <div className="w-full pb-2">
               <table className="w-full text-left text-[13px]">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 text-xs">
                    <tr>
                      <th className="py-2 px-2 w-[50%]">Period</th>
                      <th className="py-2 px-2 text-center w-[20%]">Number</th>
                      <th className="py-2 px-2 w-[30%]">Color</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDraws.slice(0,10).map((dr: any, i: number) => (
                      <tr key={`${dr.period}-${i}`} className="border-b border-slate-200">
                         <td className="py-2 px-2 font-mono text-[11px] sm:text-[13px] tracking-tight">{dr.period}</td>
                         <td className="py-2 px-2 font-bold text-center">{dr.number}</td>
                         <td className="py-2 px-2 text-[12px] sm:text-[13px] leading-tight">{dr.color}</td>
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
               className="flex-1 border border-slate-300 bg-white text-slate-800 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#dfa510]" 
               placeholder="Add an UPI ID" 
               value={newUpiId}
               onChange={e => setNewUpiId(e.target.value)}
            />
            <button onClick={handleAddUpi} className="bg-[#2b1f42] border border-[#dfa510]/30 text-white px-4 py-2 rounded font-medium">Add</button>
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
                {upiQr.list?.map((u: any, i: number) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="py-2 px-3 text-center">
                      <input 
                        type="radio" 
                        name="activeUpi" 
                        checked={upiQr.activeId === u.id} 
                        onChange={() => handleSetActiveUpi(u.id)} 
                        className="w-4 h-4 text-[#dfa510] focus:ring-[#f0c040]"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-600 font-medium">
                      {editingUpiId === u.id ? (
                        <input 
                          type="text"
                          className="border border-[#dfa510] bg-[#0a0a0f] text-white rounded px-2 py-1 w-full text-sm focus:outline-none"
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
                {(!upiQr.list || upiQr.list.length === 0) && (
                   <tr><td colSpan={3} className="py-8 text-center text-slate-500">No UPI IDs found</td></tr>
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
               <input type="number" value={genAmount} onChange={e=>setGenAmount(e.target.value)} className="w-full border border-slate-300 bg-white text-slate-800 rounded px-3 py-2 text-sm" />
             </div>
             <div>
               <label className="text-xs text-slate-500 mb-1 block">Usage Limit</label>
               <input type="number" value={genMaxLimit} onChange={e=>setGenMaxLimit(e.target.value)} className="w-full border border-slate-300 bg-white text-slate-800 rounded px-3 py-2 text-sm" />
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
            {gifts.length === 0 && <div className="text-center text-sm text-slate-500 py-4 border border-slate-200 rounded">No active gifts</div>}
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
               {list.map(t => {
                 const uName = users.find(u => u.id === t.userId)?.name || 'Unknown User';
                 return (
                 <div key={t.id} className="border border-slate-200 rounded p-3 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                       <div>
                         <div className="font-bold text-sm text-slate-600">Name: <span className="font-medium text-slate-500">{uName}</span></div>
                         <div className="font-bold text-sm text-slate-600">UID: <span className="font-medium text-slate-500">{t.displayUid || t.userId}</span></div>
                         {t.type === 'Deposit' && t.utr && <div className="font-bold text-sm text-slate-600">UTR: <span className="font-medium text-slate-500">{t.utr}</span></div>}
                         {t.type === 'Withdraw' && t.methodDetails && <div className="font-bold text-sm text-slate-600">{t.methodType}: <span className="font-medium text-slate-500">{t.methodDetails}</span></div>}
                         <div className="text-xs text-slate-500 mt-1">{new Date(t.timestamp).toLocaleString()}</div>
                       </div>
                       <div className="flex flex-col items-end gap-2">
                           <div className={`text-xs font-bold px-2 py-1 rounded ${t.status === 'Pending' ? 'bg-amber-100 text-amber-700' : t.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                             {t.status}
                           </div>
                           <button onClick={() => handleDeleteTx(t.id, t.type)} className="text-slate-400 hover:text-red-500 p-1 bg-slate-50 rounded mt-1 transition-colors">
                             <Trash2 size={16} />
                           </button>
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
               )})}
               {list.length === 0 && <div className="text-center text-slate-500 text-sm py-8 bg-slate-50 rounded border border-slate-200">No {type.toLowerCase()}s found</div>}
            </div>
         </div>
      </div>
    );
  };

  const handleToggleRestriction = async (userId: string, currentVal: boolean) => {
    if (!db) return;
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        hasWonOver4000: !currentVal
      });
      notifyToast(`User restriction toggled successfully! / यूज़र की सीमा बदल दी गई है!`);
    } catch (e) {
      console.error(e);
      notifyToast("Error updating restriction. / सीमा बदलने में समस्या आई।");
    }
  };

  const renderUserManagement = () => {
    const filteredUsers = users.filter(u => {
      const queryStr = userSearchQuery.toLowerCase();
      const nickname = (u.nickname || u.name || '').toLowerCase();
      const phone = (u.phone || u.phoneNumber || '').toLowerCase();
      const id = (u.id || u.uid || '').toLowerCase();
      return nickname.includes(queryStr) || phone.includes(queryStr) || id.includes(queryStr);
    });

    return (
      <div className="flex flex-col gap-4 fade-in">
        <div className="bg-white rounded-xl shadow p-4 text-slate-800">
          <h3 className="font-bold text-lg mb-1 text-[#dfa510] flex items-center gap-2">
            <Users size={20} />
            User Management / यूज़र नियंत्रण
          </h3>
          <p className="text-[11px] text-slate-500 mb-4 leading-normal">
            Toggle the ₹2,000 deposit error restriction for any user's ID here. Search by nickname, phone or UID.
          </p>

          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search user name, phone or UID..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#dfa510] focus:ring-1 focus:ring-[#dfa510]"
            />
            {userSearchQuery && (
              <button
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* User List */}
          <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredUsers.map(u => {
              const uName = u.nickname || u.name || 'No Name';
              const uPhone = u.phone || u.phoneNumber || 'No Phone';
              const uId = u.id || u.uid || '';
              const uBalance = parseFloat(u.balance || '0');
              const uDeposits = parseFloat(u.totalDeposits || '0');
              const isRestricted = u.hasWonOver4000 === true;

              return (
                <div key={uId} className="border border-slate-100 bg-slate-50/50 rounded-xl p-3 flex flex-col gap-2 relative hover:border-[#dfa510]/30 transition-all">
                  {/* Badge for restriction */}
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isRestricted ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-500'}`}>
                      {isRestricted ? '🔴 Error Restricted' : '🟢 Normal'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5 max-w-[70%] truncate">
                      <span>👤 {uName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      📱 Phone: <span className="font-bold text-slate-700">{uPhone}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <span>UID: {uId.slice(0, 10)}...</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(uId);
                          notifyToast("UID copied / यूआईडी कॉपी किया गया");
                        }}
                        className="text-slate-500 hover:text-slate-800 p-0.5"
                        title="Copy UID"
                      >
                        <Copy size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Balance / Deposits Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-white/70 p-2 rounded-lg border border-slate-100 my-1 text-center">
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Balance</div>
                      <div className="text-[13px] font-black text-slate-800">₹{uBalance.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Total Deposit</div>
                      <div className="text-[13px] font-black text-slate-600">₹{uDeposits.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* One-click Toggle Button */}
                  <button
                    onClick={() => handleToggleRestriction(uId, isRestricted)}
                    className={`w-full py-2 text-center text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      isRestricted 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_2px_8px_rgba(239,68,68,0.2)]' 
                        : 'bg-[#dfa510] hover:bg-[#dfa510]/90 text-white shadow-[0_2px_8px_rgba(223,165,16,0.2)]'
                    }`}
                  >
                    <span>
                      {isRestricted 
                        ? '❌ Remove Deposit Error (नॉर्मल करें)' 
                        : '⚠️ Lock & Apply ₹2,000 Deposit Error (एरर लगायें)'}
                    </span>
                  </button>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="text-center text-slate-400 text-xs py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No users found / कोई यूज़र नहीं मिला
              </div>
            )}
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
              <div className="text-2xl font-bold text-slate-800">{users.length}</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
              <div className="text-slate-500 text-xs mb-1">Pending Deposits</div>
              <div className="text-2xl font-bold text-slate-800">{transactions.filter(t => t.type === 'Deposit' && t.status === 'Pending').length}</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-red-500">
              <div className="text-slate-500 text-xs mb-1">Pending Withdrawals</div>
              <div className="text-2xl font-bold text-slate-800">{transactions.filter(t => t.type === 'Withdraw' && t.status === 'Pending').length}</div>
           </div>
           <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
              <div className="text-slate-500 text-xs mb-1">Active UPI</div>
              <div className="text-2xl font-bold text-slate-800">{upiQr.activeId ? 1 : 0}</div>
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
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors font-medium ${active ? 'bg-amber-100/50 text-[#dfa510] border-r-4 border-[#dfa510]' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      {icon}
      <span className="text-sm">{label}</span>
      <ChevronRight size={16} className={`ml-auto transition-transform ${active ? 'text-[#dfa510] translate-x-1' : 'text-slate-600'}`} />
    </button>
  );

  return (
    <div className="min-h-[100dvh] w-full bg-[#f4f6fc] text-slate-800 font-sans relative flex select-none overflow-hidden max-w-md mx-auto shadow-2xl">
      {/* Real-time Incoming Finance Alerts */}
      <div className="absolute top-16 left-4 right-4 z-[99] flex flex-col gap-2.5 pointer-events-none">
        <AnimatePresence>
          {pendingAlerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.15 } }}
              className="pointer-events-auto w-full bg-slate-900 border border-slate-800 text-white p-4 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.35)] flex flex-col gap-1.5 relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${alert.type === 'deposit' ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              
              <div className="flex items-start justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{alert.type === 'deposit' ? '💰' : '💸'}</span>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider font-mono block">
                      New Real-time Request
                    </span>
                    <h4 className="text-[12.5px] font-black text-white tracking-tight leading-none">
                      {alert.type === 'deposit' ? 'New Deposit / नया रिचार्ज' : 'New Withdrawal / नई निकासी'}
                    </h4>
                  </div>
                </div>
                <button
                  onClick={() => setPendingAlerts(prev => prev.filter(a => a.id !== alert.id))}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-xl font-black ${alert.type === 'deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ₹{alert.amount.toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] text-slate-400">
                  User: <span className="font-mono text-white font-bold">{alert.user.slice(-6)}</span>
                </span>
              </div>

              <button
                onClick={() => {
                  navigateTo('finance', alert.type === 'deposit' ? 'Deposit' : 'Withdraw');
                  setPendingAlerts(prev => prev.filter(a => a.id !== alert.id));
                }}
                className={`w-full py-1.5 text-center text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${alert.type === 'deposit' ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}
              >
                <span>Audit & Action (चेक करें)</span>
                <ChevronRight size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
                <MenuItem icon={<Send size={18}/>} label="Prediction Generator" view="prediction" active={currentView==='prediction'} />
                
                <div 
                  className={`flex items-center justify-between px-4 py-3 mt-2 cursor-pointer transition-colors ${isWingoMenuOpen ? 'bg-amber-100/30 border-l-4 border-transparent' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
                  onClick={() => setIsWingoMenuOpen(!isWingoMenuOpen)}
                >
                  <div className="flex items-center gap-3 text-slate-600 font-medium">
                    <div className={isWingoMenuOpen ? 'text-[#dfa510]' : ''}>
                       <Gamepad2 size={18} />
                    </div>
                    <span className="text-sm">WinGo Manager</span>
                  </div>
                  <ChevronRight size={16} className={`text-slate-500 transition-transform ${isWingoMenuOpen ? 'rotate-90 text-[#dfa510]' : ''}`} />
                </div>
                
                <AnimatePresence>
                  {isWingoMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50/50"
                    >
                      <MenuItem icon={<div className="w-1.5 h-1.5 rounded border-2 border-[#dfa510] ml-1" />} label="WinGo 30 sec" view="wingo" sub="30s" active={currentView==='wingo' && subView==='30s'} />
                      <MenuItem icon={<div className="w-1.5 h-1.5 rounded border-2 border-[#dfa510] ml-1" />} label="WinGo 1 Min" view="wingo" sub="1m" active={currentView==='wingo' && subView==='1m'} />
                      <MenuItem icon={<div className="w-1.5 h-1.5 rounded border-2 border-[#dfa510] ml-1" />} label="WinGo 3 Min" view="wingo" sub="3m" active={currentView==='wingo' && subView==='3m'} />
                      <MenuItem icon={<div className="w-1.5 h-1.5 rounded border-2 border-[#dfa510] ml-1" />} label="WinGo 5 Min" view="wingo" sub="5m" active={currentView==='wingo' && subView==='5m'} />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finance</div>
                <MenuItem icon={<CreditCard size={18}/>} label="Add Upi" view="upi" active={currentView==='upi'} />
                <MenuItem icon={<ArrowRightLeft size={18}/>} label="Deposit Update" view="finance" sub="Deposit" active={currentView==='finance' && subView==='Deposit'} />
                <MenuItem icon={<CreditCard size={18}/>} label="Withdraw Apply" view="finance" sub="Withdraw" active={currentView==='finance' && subView==='Withdraw'} />
                
                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">User Control</div>
                <MenuItem icon={<Users size={18}/>} label="User Management" view="users" active={currentView==='users'} />

                <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Others</div>
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
          {currentView === 'prediction' && renderPredictionGenerator()}
          {currentView === 'upi' && renderUpiManager()}
          {currentView === 'finance' && renderFinance(subView as any)}
          {currentView === 'gift' && renderGiftCode()}
          {currentView === 'users' && renderUserManagement()}
        </main>
      </div>
    </div>
  );
}
