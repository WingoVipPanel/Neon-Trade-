import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Gamepad2, 
  Coins, 
  LogOut, 
  Menu,
  X,
  ChevronRight,
  Activity,
  MessageSquare,
  Users,
  Wallet,
  Gift,
  Plus,
  Trash2,
  Check,
  Percent,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Sliders,
  DollarSign
} from 'lucide-react';
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  runTransaction, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  limit, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { io } from 'socket.io-client';

const socket = io();

interface AdminPanelViewProps {
  onLogout: () => void;
  onToggleView?: () => void;
}

const ROOMS = ['30s', '1m', '3m', '5m'];

interface DepositRequest {
  id: string;
  userId: string;
  amount: number;
  bonus: number;
  totalAmount: number;
  utr: string;
  status: string;
  nickname?: string;
  avatar?: string;
  uid?: string;
  createdAt?: any;
}

interface WithdrawRequest {
  id: string;
  userId: string; // auth uid
  amount: number;
  method: string;
  accountDetails: string;
  status: string;
  nickname?: string;
  avatar?: string;
  uid?: string;
  createdAt?: any;
}

interface UserProfile {
  id: string; // firebase user uid
  uid: string; // short numeric uid
  phoneNumber: string;
  nickname: string;
  avatar: string;
  balance: number;
  totalDeposits?: number;
  level?: number;
  registeredAt?: string;
}

interface GiftCode {
  id: string; // code string uppercase
  amount: number;
  type: 'standard' | 'deposit_lock';
  minDeposit: number;
  createdAt: string;
}

interface GiftClaim {
  id: string;
  giftCode: string;
  userId: string;
  userUid: string;
  amount: number;
  claimedAt: string;
}

const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onLogout, onToggleView }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeWingoRoom, setActiveWingoRoom] = useState('1m');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Real-time states
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);
  const [approvedDepositsHistory, setApprovedDepositsHistory] = useState<DepositRequest[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawRequest[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawRequest[]>([]);
  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [giftClaims, setGiftClaims] = useState<GiftClaim[]>([]);
  
  // manual prediction overrides
  const [manualPredictions, setManualPredictions] = useState<Record<string, number | null>>({});
  
  // Gifts creation state
  const [gCode, setGCode] = useState('');
  const [gAmount, setGAmount] = useState('');
  const [gType, setGType] = useState<'standard' | 'deposit_lock'>('standard');
  const [gMinDeposit, setGMinDeposit] = useState('');
  
  // Users list search & edit states
  const [userSearchText, setUserSearchText] = useState('');
  const [editingBalanceUser, setEditingBalanceUser] = useState<string | null>(null);
  const [balanceChangeAmount, setBalanceChangeAmount] = useState('');
  const [balanceMode, setBalanceMode] = useState<'add' | 'subtract'>('add');

  // custom rejection modal state
  const [rejectModal, setRejectModal] = useState<{
    type: 'deposit' | 'withdrawal';
    request: any;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [processing, setProcessing] = useState<string | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalDepositsAll: 0,
    totalWithdrawalsAll: 0,
    activeUsers: 0
  });

  // Socket prediction listener
  useEffect(() => {
    socket.on('prediction_updated', ({ room, nextManualResult }) => {
      setManualPredictions(prev => ({ ...prev, [room]: nextManualResult }));
    });
    return () => {
      socket.off('prediction_updated');
    };
  }, []);

  // Set Wingo prediction
  const handleSetWingoPrediction = (room: string, num: number | null) => {
    socket.emit('set_prediction', { room, number: num });
    setManualPredictions(prev => ({ ...prev, [room]: num }));
  };

  // Real-time subscriptions
  useEffect(() => {
    // 1. Users live listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uDocs: UserProfile[] = [];
      snapshot.forEach(doc => {
        const d = doc.data();
        uDocs.push({
          id: doc.id,
          uid: d.uid || d.userId?.substring(0, 6) || '000000',
          phoneNumber: d.phoneNumber || '',
          nickname: d.nickname || 'GuestMember',
          avatar: d.avatar || d.avatarURL || 'https://api.dicebear.com/7.x/lorelei/svg?seed=Olivia',
          balance: parseFloat(d.balance || '0'),
          totalDeposits: parseFloat(d.totalDeposits || '0'),
          level: d.level || 0,
          registeredAt: d.registeredAt || d.createdAt || ''
        });
      });
      setUsersList(uDocs);
    });

    // 2. Pending Deposits live listener
    const qPendingDep = query(collection(db, 'depositRequests'), where('status', '==', 'pending'));
    const unsubPendingDep = onSnapshot(qPendingDep, (snapshot) => {
      const dep: DepositRequest[] = [];
      snapshot.forEach(docSnap => {
        dep.push({ id: docSnap.id, ...docSnap.data() } as DepositRequest);
      });
      setPendingDeposits(dep);
    });

    // 3. Approved Deposits history live listener
    const qApprovedDep = query(collection(db, 'depositRequests'), where('status', '==', 'approved'), limit(20));
    const unsubApprovedDep = onSnapshot(qApprovedDep, (snapshot) => {
      const dep: DepositRequest[] = [];
      snapshot.forEach(docSnap => {
        dep.push({ id: docSnap.id, ...docSnap.data() } as DepositRequest);
      });
      setApprovedDepositsHistory(dep);
    });

    // 4. Pending Withdrawals live listener
    const qPendingWith = query(collection(db, 'withdrawRequests'), where('status', '==', 'pending'));
    const unsubPendingWith = onSnapshot(qPendingWith, (snapshot) => {
      const wit: WithdrawRequest[] = [];
      snapshot.forEach(docSnap => {
        wit.push({ id: docSnap.id, ...docSnap.data() } as WithdrawRequest);
      });
      setPendingWithdrawals(wit);
    });

    // 5. Withdrawal history live listener
    const qHistoryWith = query(collection(db, 'withdrawRequests'), where('status', 'in', ['approved', 'rejected']), limit(25));
    const unsubHistoryWith = onSnapshot(qHistoryWith, (snapshot) => {
      const wit: WithdrawRequest[] = [];
      snapshot.forEach(docSnap => {
        wit.push({ id: docSnap.id, ...docSnap.data() } as WithdrawRequest);
      });
      setWithdrawalHistory(wit);
    });

    // 6. Gift Codes live listener
    const unsubGifts = onSnapshot(collection(db, 'giftCodes'), (snapshot) => {
      const codes: GiftCode[] = [];
      snapshot.forEach(docSnap => {
        codes.push({ id: docSnap.id, ...docSnap.data() } as GiftCode);
      });
      setGiftCodes(codes);
    });

    // 7. Gift Claims live listener
    const unsubClaims = onSnapshot(collection(db, 'giftClaims'), (snapshot) => {
      const cl: GiftClaim[] = [];
      snapshot.forEach(docSnap => {
        cl.push({ id: docSnap.id, ...docSnap.data() } as GiftClaim);
      });
      setGiftClaims(cl);
    });

    return () => {
      unsubUsers();
      unsubPendingDep();
      unsubApprovedDep();
      unsubPendingWith();
      unsubHistoryWith();
      unsubGifts();
      unsubClaims();
    };
  }, []);

  // Compute dynamic stats over subscribed collections
  useEffect(() => {
    const totalDeposits = approvedDepositsHistory.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalWithdrawals = withdrawalHistory.filter(w => w.status === 'approved').reduce((acc, curr) => acc + (curr.amount || 0), 0);
    
    // Simulate active users count (users with balances > 0 or leveled)
    const activeCount = usersList.filter(u => u.balance > 10).length;

    setDashboardStats({
      totalUsers: usersList.length,
      totalDepositsAll: totalDeposits,
      totalWithdrawalsAll: totalWithdrawals,
      activeUsers: activeCount || 1
    });
  }, [usersList, approvedDepositsHistory, withdrawalHistory]);

  // Approve Deposit Request
  const handleApproveDeposit = async (request: DepositRequest) => {
    setProcessing(request.id);
    try {
      await runTransaction(db, async (transaction) => {
        const depositRef = doc(db, 'depositRequests', request.id);
        const depSnap = await transaction.get(depositRef);
        if (!depSnap.exists() || depSnap.data().status !== 'pending') {
          throw new Error("Request already resolved or missing");
        }

        // Try to look up by request.userId (Auth UID) or phone helper
        let userRef = doc(db, 'users', request.userId);
        let userSnap = await transaction.get(userRef);

        if (!userSnap.exists()) {
          // Fallback lookup if userId was phone
          const usersRef = collection(db, 'users');
          const phoneQuery = query(usersRef, where('phoneNumber', '==', request.userId));
          const querySnap = await getDocs(phoneQuery);
          if (!querySnap.empty) {
            userRef = doc(db, 'users', querySnap.docs[0].id);
            userSnap = await transaction.get(userRef);
          } else {
            throw new Error(`User profile not found in directory under UID ${request.userId}`);
          }
        }

        const prevBalance = Number(userSnap.data().balance || 0);
        const prevTotalDeposits = Number(userSnap.data().totalDeposits || 0);
        
        // Use totalAmount which holds principal + promo bonus credit automatically
        const creditAmt = Number(request.totalAmount || request.amount);

        // Update user values
        transaction.update(userRef, {
          balance: prevBalance + creditAmt,
          totalDeposits: prevTotalDeposits + request.amount, // accumulate raw amount for VIP unlocks
          updatedAt: serverTimestamp()
        });

        // Set deposit as approved
        transaction.update(depositRef, {
          status: 'approved',
          updatedAt: serverTimestamp()
        });
      });

      alert(`Successfully approved ₹${request.totalAmount} recharge!`);
    } catch (err: any) {
      console.error(err);
      alert('Error during approval: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Reject Deposit Request Trigger (Opens Custom Modal)
  const handleRejectDeposit = (request: DepositRequest) => {
    setRejectModal({ type: 'deposit', request });
    setRejectionReason('UTR mismatch or fake receipt');
  };

  // Approve Withdrawal Request
  const handleApproveWithdrawal = async (request: WithdrawRequest) => {
    setProcessing(request.id);
    try {
      const withRef = doc(db, 'withdrawRequests', request.id);
      await updateDoc(withRef, {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      alert(`Withdrawal request ₹${request.amount} approved!`);
    } catch (err: any) {
      alert("Approval error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Reject Withdrawal Request Trigger (Opens Custom Modal)
  const handleRejectWithdrawal = (request: WithdrawRequest) => {
    setRejectModal({ type: 'withdrawal', request });
    setRejectionReason('Invalid bank details / UPI ID incorrect');
  };

  // Process Custom Rejection Submission
  const handleSubmitRejection = async () => {
    if (!rejectModal) return;
    const { type, request } = rejectModal;
    const finalReason = rejectionReason.trim() || 'Rejected by Admin';

    setProcessing(request.id);
    setRejectModal(null); // immediately close UI

    try {
      if (type === 'deposit') {
        const depositRef = doc(db, 'depositRequests', request.id);
        await updateDoc(depositRef, {
          status: 'rejected',
          rejectionReason: finalReason,
          updatedAt: serverTimestamp()
        });
        alert('Deposit successfully rejected!');
      } else {
        await runTransaction(db, async (transaction) => {
          const withRef = doc(db, 'withdrawRequests', request.id);
          const wSnap = await transaction.get(withRef);
          if (!wSnap.exists() || wSnap.data().status !== 'pending') {
            throw new Error("Withdrawal request already processed.");
          }

          const userRef = doc(db, 'users', request.userId);
          const uSnap = await transaction.get(userRef);
          if (!uSnap.exists()) throw new Error("User document missing");

          const currentBalance = Number(uSnap.data().balance || 0);
          const refundAmt = Number(request.amount);

          // Refund balance to player
          transaction.update(userRef, {
            balance: currentBalance + refundAmt,
            updatedAt: serverTimestamp()
          });

          // Set withdrawal request as Rejected
          transaction.update(withRef, {
            status: 'rejected',
            rejectionReason: finalReason,
            updatedAt: serverTimestamp()
          });
        });

        alert(`Withdrawal request of ₹${request.amount} rejected! Balance refunded to player.`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error processing rejection: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Create/Generate Gift Code
  const handleCreateGiftCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeStr = gCode.trim().toUpperCase();
    const amountVal = parseFloat(gAmount);

    if (!codeStr || codeStr.length < 3) {
      alert('Please enter a valid gift code (at least 3 characters)');
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      alert('Please enter a valid claimable bonus reward amount');
      return;
    }

    const minDepLimit = gType === 'deposit_lock' ? parseFloat(gMinDeposit || '0') : 0;

    try {
      setProcessing('create_gift');
      const giftRef = doc(db, 'giftCodes', codeStr);
      await setDoc(giftRef, {
        amount: amountVal,
        type: gType,
        minDeposit: isNaN(minDepLimit) ? 0 : minDepLimit,
        createdAt: new Date().toISOString()
      });

      alert(`Success! Generated code: ${codeStr} valued ₹${amountVal.toFixed(2)} (${gType})`);
      setGCode('');
      setGAmount('');
      setGMinDeposit('');
    } catch (err: any) {
      alert('Error creating gift: ' + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Delete Gift Code
  const handleDeleteGiftCode = async (codeId: string) => {
    if (!confirm(`Are you sure you want to permanently delete the gift code "${codeId}"?`)) return;
    try {
      await deleteDoc(doc(db, 'giftCodes', codeId));
      alert('Gift code deleted successfully!');
    } catch (e: any) {
      alert('Delete error: ' + e.message);
    }
  };

  // Adjust User balance
  const handleUpdateUserBalance = async (userId: string) => {
    const val = parseFloat(balanceChangeAmount);
    if (isNaN(val) || val <= 0) {
      alert('Please input a valid numeric amount to adjust.');
      return;
    }

    const signedModifier = balanceMode === 'add' ? val : -val;

    try {
      setProcessing('adj_' + userId);
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userId);
        const uSnap = await transaction.get(userRef);
        if (!uSnap.exists()) throw new Error("Player document not found");

        const previousBalance = Number(uSnap.data().balance || 0);
        const newBalance = Math.max(0, previousBalance + signedModifier);

        transaction.update(userRef, {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });
      });

      alert(`Balance modified by ₹${signedModifier.toFixed(2)} successfully!`);
      setEditingBalanceUser(null);
      setBalanceChangeAmount('');
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setProcessing(null);
    }
  };

  // Generate automated random safe gift code
  const handleGenerateRandomCode = () => {
    const prefix = "GIFT";
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let rand = "";
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGCode(prefix + rand);
  };

  // Filter users based on search
  const filteredUsers = usersList.filter(user => {
    const term = userSearchText.trim().toLowerCase();
    if (!term) return true;
    return (
      user.nickname.toLowerCase().includes(term) ||
      user.uid.toLowerCase().includes(term) ||
      user.phoneNumber.includes(term)
    );
  });

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { name: 'Users', icon: <Users size={18} /> },
    { name: 'Deposits', icon: <Wallet size={18} /> },
    { name: 'Withdrawals', icon: <Coins size={18} /> },
    { name: 'WinGo Control', icon: <Gamepad2 size={18} /> },
    { name: 'Gifts Platform', icon: <Gift size={18} /> },
  ];

  return (
    <div id="admin-main-container" className="min-h-screen bg-[#070709] text-gray-100 font-sans flex flex-col md:flex-row antialiased">
      
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-50 bg-[#0d0d11]/90 backdrop-blur-md border-b border-white/5 px-4 py-3.5 flex items-center justify-between">
        <h1 className="font-extrabold text-[#e53e3e] tracking-widest text-[16px] uppercase">
          SUPER <span className="text-white font-light">PANEL</span>
        </h1>
        <div className="flex items-center gap-2">
          {onToggleView && (
            <button 
              onClick={onToggleView}
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider rounded border border-emerald-500/30"
            >
              Play lobby
            </button>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 bg-white/5 text-white/80 rounded border border-white/10 active:scale-95"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* Sidebar navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-[#0d0d11] border-r border-white/5 w-64 p-6 flex flex-col transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static`}>
        
        {/* Brand */}
        <div className="mb-8 hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <h1 className="font-extrabold text-red-500 text-[18px] tracking-wider uppercase">
              SUPER <span className="text-white font-normal">CONTROL</span>
            </h1>
          </div>
          <p className="text-[10px] text-zinc-500 tracking-widest uppercase">Admin Terminal v2.1</p>
        </div>

        {/* Level badge */}
        <div className="mb-6 bg-gradient-to-r from-red-950/40 to-zinc-900 border border-red-500/20 p-4 rounded-xl">
          <p className="text-[12px] font-bold text-red-400 flex items-zinc-center gap-1">
            <Sliders size={12} className="mt-0.5" /> Core Administrator
          </p>
          <p className="text-[10px] text-zinc-500 flex items-center mt-1">Live DB state active</p>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 flex-1">
          {menuItems.map((item) => (
            <button
              id={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              key={item.name}
              onClick={() => { setActiveMenu(item.name); setIsSidebarOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${activeMenu === item.name ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-900/10' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-semibold text-[13px]">{item.name}</span>
              </div>
              <ChevronRight size={14} className={`opacity-40 transition-transform ${activeMenu === item.name ? 'rotate-90' : ''}`} />
            </button>
          ))}
        </nav>

        {/* Bottom Options */}
        <div className="mt-auto space-y-2 pt-6 border-t border-white/5">
          {onToggleView && (
            <button 
              id="btn-goto-game"
              onClick={onToggleView}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-emerald-400 hover:bg-emerald-950/10 border border-emerald-500/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider justify-center"
            >
              <Gamepad2 size={14} />
              Return to Game
            </button>
          )}

          <button 
            id="btn-admin-logout"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-950/20 border border-red-950/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider justify-center"
          >
            <LogOut size={14} />
            Exit Panel
          </button>
        </div>
      </aside>

      {/* Main Panel Content Column */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto space-y-8 pointer-events-auto">
        
        {/* Active Route Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-5">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase text-white tracking-wide">{activeMenu}</h2>
            <p className="text-xs text-zinc-500 mt-1">Reflects live Firestore parameters securely with real transactions.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[11px] font-mono tracking-widest text-[#00ff66] uppercase bg-emerald-500/5 px-2.5 py-1 rounded-full border border-emerald-500/20">
              SOCKET OK
            </span>
          </div>
        </div>

        {/* 1. DASHBOARD OVERVIEW VIEW */}
        {activeMenu === 'Dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Bento statistics grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111115] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-red-500/20 transition duration-300">
                <div>
                  <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-zinc-400 mb-4">
                    <Users size={18} />
                  </div>
                  <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Total Users</h3>
                </div>
                <p className="text-3xl font-black tracking-tight text-white mt-3">{dashboardStats.totalUsers}</p>
              </div>

              <div className="bg-[#111115] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-red-500/20 transition duration-300">
                <div>
                  <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-emerald-400 mb-4">
                    <Wallet size={18} />
                  </div>
                  <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Total Deposits</h3>
                </div>
                <p className="text-3xl font-black tracking-tight text-emerald-400 mt-3">₹{dashboardStats.totalDepositsAll.toFixed(2)}</p>
              </div>

              <div className="bg-[#111115] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-red-500/20 transition duration-300">
                <div>
                  <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-blue-400 mb-4">
                    <Coins size={18} />
                  </div>
                  <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Total Withdrawals</h3>
                </div>
                <p className="text-3xl font-black tracking-tight text-blue-400 mt-3">₹{dashboardStats.totalWithdrawalsAll.toFixed(2)}</p>
              </div>

              <div className="bg-[#111115] border border-white/5 p-6 rounded-2xl shadow-xl flex flex-col justify-between hover:border-red-500/20 transition duration-300">
                <div>
                  <div className="w-10 h-10 bg-zinc-900 border border-white/10 rounded-xl flex items-center justify-center text-red-500 mb-4">
                    <Activity size={18} />
                  </div>
                  <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Active Players</h3>
                </div>
                <p className="text-3xl font-black tracking-tight text-red-500 mt-3">{dashboardStats.activeUsers}</p>
              </div>
            </div>

            {/* Live activity split section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick pending warnings */}
              <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-black text-[13px] uppercase tracking-widest text-[#9e9ea7] flex items-zinc-center gap-2">
                  <Wallet size={14} /> Pending Deposits Queue ({pendingDeposits.length})
                </h3>
                {pendingDeposits.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6">All deposits caught up! No pending audits.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {pendingDeposits.map(req => (
                      <div key={req.id} className="flex justify-between items-center bg-zinc-900/60 p-3.5 rounded-xl border border-white/5 hover:bg-zinc-900 transition">
                        <div className="flex items-center gap-3">
                          <img src={req.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Lucky"} className="w-7 h-7 rounded-full bg-white/5 border border-white/10" alt="Av" />
                          <div className="text-left">
                            <p className="text-xs font-black text-white">{req.nickname || 'Unknown Player'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">UID: {req.uid || req.userId?.substring(0,8)}</p>
                          </div>
                        </div>
                        <span className="text-emerald-400 font-bold text-xs uppercase font-mono">₹{req.totalAmount || req.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Withdrawals Queue */}
              <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                <h3 className="font-black text-[13px] uppercase tracking-widest text-[#9e9ea7] flex items-zinc-center gap-2">
                  <Coins size={14} /> Pending Cashouts Queue ({pendingWithdrawals.length})
                </h3>
                {pendingWithdrawals.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-6">All withdrawals processed! No pending audits.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {pendingWithdrawals.map(req => (
                      <div key={req.id} className="flex justify-between items-center bg-zinc-900/60 p-3.5 rounded-xl border border-white/5 hover:bg-zinc-900 transition">
                        <div className="flex items-center gap-3">
                          <img src={req.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Lucky"} className="w-7 h-7 rounded-full bg-white/5 border border-white/10" alt="Av" />
                          <div className="text-left">
                            <p className="text-xs font-black text-white">{req.nickname || 'Unknown Player'}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">UID: {req.uid || req.userId?.substring(0,8)}</p>
                          </div>
                        </div>
                        <span className="text-red-400 font-bold text-xs uppercase font-mono">₹{req.amount}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. REGISTERED USERS MANAGEMENT & BALANCE MANAGER */}
        {activeMenu === 'Users' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-md font-bold uppercase tracking-wider">Registered Player Accounts ({usersList.length})</h3>
                  <p className="text-xs text-zinc-500">View, search, and customized balances of registered players instantly.</p>
                </div>

                <div className="relative w-full md:w-80">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input 
                    type="text" 
                    placeholder="Search by nickname, phone, UID..."
                    className="w-full bg-zinc-900 text-xs text-white pl-9 pr-4 py-2.5 rounded-xl border border-white/5 focus:border-red-500/20 focus:outline-none transition font-medium"
                    value={userSearchText}
                    onChange={(e) => setUserSearchText(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="text-[10px] uppercase text-zinc-500 border-b border-white/5 tracking-wider bg-zinc-950/40">
                    <tr>
                      <th className="p-4">Profile Icon & Nickname</th>
                      <th className="p-4">Short UID</th>
                      <th className="p-4">Phone / Account</th>
                      <th className="p-4">Total Deposits</th>
                      <th className="p-4">Current Balance</th>
                      <th className="p-4 text-right">Balance Adjuster</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">No core player documents match searching.</td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img src={u.avatar} className="w-8 h-8 rounded-full bg-white/5 border border-white/10" alt="Avatar" />
                            <div className="text-left">
                              <span className="font-extrabold text-white block text-[13px]">{u.nickname}</span>
                              <span className="text-[9px] text-[#00ff66] uppercase bg-green-500/5 px-1.5 py-0.5 rounded border border-green-500/10 inline-block mt-0.5">LVL {u.level}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-zinc-300">{u.uid}</td>
                          <td className="p-4 font-mono text-zinc-500">{u.phoneNumber || 'firebase-auth'}</td>
                          <td className="p-4 font-mono text-zinc-400">₹{(u.totalDeposits || 0).toFixed(2)}</td>
                          <td className="p-4 font-mono font-extrabold text-[#00ff66] text-[13px]">₹{(u.balance || 0).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            {editingBalanceUser === u.id ? (
                              <div className="inline-flex items-center gap-2 bg-zinc-900 border border-white/10 p-1.5 rounded-xl">
                                <select 
                                  className="bg-black text-[10px] font-bold text-white px-1.5 py-1 rounded"
                                  value={balanceMode}
                                  onChange={(e) => setBalanceMode(e.target.value as 'add' | 'subtract')}
                                >
                                  <option value="add">Add (+)</option>
                                  <option value="subtract">Sub (-)</option>
                                </select>
                                <input 
                                  type="number"
                                  placeholder="Amount"
                                  className="w-16 bg-black text-[10px] text-white px-2 py-1 rounded font-mono border border-white/10"
                                  value={balanceChangeAmount}
                                  onChange={(e) => setBalanceChangeAmount(e.target.value)}
                                  autoFocus
                                />
                                <button 
                                  onClick={() => handleUpdateUserBalance(u.id)}
                                  disabled={processing === 'adj_' + u.id}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition active:scale-90"
                                >
                                  <Check size={12} />
                                </button>
                                <button 
                                  onClick={() => { setEditingBalanceUser(null); setBalanceChangeAmount(''); }}
                                  className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded cursor-pointer transition active:scale-90"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => { setEditingBalanceUser(u.id); setBalanceMode('add'); }}
                                className="inline-flex items-center gap-1.5 bg-red-600/10 hover:bg-red-500 border border-red-500/25 text-red-400 hover:text-white px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition cursor-pointer"
                              >
                                <Plus size={12} /> Edit Wallet
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. DEPOSITS AUDIT GATEWAY */}
        {activeMenu === 'Deposits' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Live Pending Deposites list */}
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-md font-bold uppercase tracking-wider text-white">Pending Deposits Audit ({pendingDeposits.length})</h3>
              <p className="text-xs text-zinc-500">Every recharge features exact dynamic player profiles (ID, name, and profile icon).</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[650px]">
                  <thead className="text-[10px] uppercase text-zinc-500 border-b border-white/5 tracking-wider bg-zinc-950/40">
                    <tr>
                      <th className="p-4">Profile Icon / Nickname</th>
                      <th className="p-4">Short UID</th>
                      <th className="p-4">UTR Number</th>
                      <th className="p-4">Recharge Value</th>
                      <th className="p-4 text-right">Audit Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300 text-xs">
                    {pendingDeposits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-zinc-500">No deposits currently awaiting auditing. Perfect workflow!</td>
                      </tr>
                    ) : (
                      pendingDeposits.map(req => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img src={req.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Lucky"} className="w-8 h-8 rounded-full bg-white/5 border border-white/10" alt="Avatar" />
                            <div className="text-left">
                              <span className="font-extrabold text-white block">{req.nickname || 'Unknown Nickname'}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{req.userId}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-zinc-400">{req.uid || 'N/A'}</td>
                          <td className="p-4 font-mono font-black text-white px-2.5 py-1 bg-zinc-900 border border-white/5 rounded-lg inline-block my-2.5 tracking-wider">{req.utr}</td>
                          <td className="p-4 text-[#00ff66] font-extrabold text-[13px]">
                            ₹{req.totalAmount ? Number(req.totalAmount).toFixed(2) : Number(req.amount).toFixed(2)}
                            {req.bonus > 0 && <span className="text-[9px] text-zinc-500 ml-1 block">(₹{req.amount} + ₹{req.bonus} Bonus)</span>}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button 
                              disabled={processing === req.id}
                              onClick={() => handleApproveDeposit(req)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-50"
                            >
                              {processing === req.id ? 'Processing...' : 'Approve'}
                            </button>
                            <button 
                              disabled={processing === req.id}
                              onClick={() => handleRejectDeposit(req)}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approved Deposits History Logger */}
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Recharge Audits History (Recent 20)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-zinc-400 text-xs">
                  <thead className="text-[10px] uppercase text-zinc-600 border-b border-white/5 tracking-wider bg-zinc-950/30">
                    <tr>
                      <th className="p-4">Profile & Nickname</th>
                      <th className="p-4">UTR</th>
                      <th className="p-4">Total Amount Credited</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedDepositsHistory.map((h, i) => (
                      <tr key={h.id || i} className="border-b border-white/5">
                        <td className="p-4 flex items-center gap-2">
                          <img src={h.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Micky"} className="w-6 h-6 rounded-full" alt="Av" />
                          <span>{h.nickname || h.userId}</span>
                        </td>
                        <td className="p-4 font-mono text-[11px]">{h.utr}</td>
                        <td className="p-4 font-mono text-emerald-400">₹{(h.totalAmount || h.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className="text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">APPROVED</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. WITHDRAWALS CASH-OUT AUDIT */}
        {activeMenu === 'Withdrawals' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-md font-bold uppercase tracking-wider text-white">Pending Cashouts Requests ({pendingWithdrawals.length})</h3>
              <p className="text-xs text-zinc-500">Approving claims clears payout ledger. Rejections issue an automatic audit balance refund to players.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="text-[10px] uppercase text-zinc-500 border-b border-white/5 tracking-wider bg-zinc-950/40">
                    <tr>
                      <th className="p-4">Profile / Nickname</th>
                      <th className="p-4">Short UID</th>
                      <th className="p-4">Payment Method</th>
                      <th className="p-4">Account Details (Bank/UPI ID)</th>
                      <th className="p-4">Withdraw Amount</th>
                      <th className="p-4 text-right">Audit Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs">
                    {pendingWithdrawals.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-zinc-500">No withdrawals currently awaiting audits. Great!</td>
                      </tr>
                    ) : (
                      pendingWithdrawals.map(req => (
                        <tr key={req.id} className="border-b border-white/5 hover:bg-white/5 transition">
                          <td className="p-4 flex items-center gap-3">
                            <img src={req.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Lucky"} className="w-8 h-8 rounded-full bg-white/5 border border-white/10" alt="Avatar" />
                            <div className="text-left">
                              <span className="font-extrabold text-white block">{req.nickname || 'Unknown Player'}</span>
                              <span className="text-[9px] text-zinc-500 font-mono">{req.userId}</span>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-zinc-400">{req.uid || 'N/A'}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${req.method === 'UPI' ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'bg-pink-600/10 text-pink-400 border border-pink-500/20'}`}>
                              {req.method}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-zinc-300 font-bold max-w-xs truncate">{req.accountDetails}</td>
                          <td className="p-4 text-red-400 font-extrabold text-[13px]">₹{Number(req.amount).toFixed(2)}</td>
                          <td className="p-4 text-right space-x-2">
                            <button 
                              disabled={processing === req.id}
                              onClick={() => handleApproveWithdrawal(req)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button 
                              disabled={processing === req.id}
                              onClick={() => handleRejectWithdrawal(req)}
                              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-[11px] transition cursor-pointer disabled:opacity-50"
                            >
                              Reject & Refund
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Withdrawal records audit history */}
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-[12px] uppercase tracking-widest font-bold text-zinc-400">Cashout History Audits Logs</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-zinc-400 text-left text-xs">
                  <thead className="text-[10px] uppercase text-zinc-600 border-b border-white/5 tracking-wider bg-zinc-950/20">
                    <tr>
                      <th className="p-4">Nickname</th>
                      <th className="p-4">Cashout Value</th>
                      <th className="p-4">Status Outcome</th>
                      <th className="p-4">Details/Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawalHistory.map((h, i) => (
                      <tr key={h.id || i} className="border-b border-white/5">
                        <td className="p-4 flex items-center gap-2">
                          <img src={h.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Olivia"} className="w-6 h-6 rounded-full" alt="Av" />
                          <span>{h.nickname || 'Member'}</span>
                        </td>
                        <td className="p-4 font-mono font-bold text-zinc-300">₹{Number(h.amount).toFixed(2)}</td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded border ${h.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="p-4 text-[11px] text-zinc-500 italic max-w-xs truncate">
                          {h.status === 'rejected' ? (h as any).rejectionReason || 'No feedback left' : h.accountDetails}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. WinGo PRESETS OVERRIDES */}
        {activeMenu === 'WinGo Control' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-6">
              <div>
                <h3 className="text-md font-bold uppercase tracking-wider text-white">Wingo Result Pre-Settings Prediction override</h3>
                <p className="text-xs text-zinc-500 mt-1">Preset the exact output number (0-9) to manipulate the next game loop draw instantly.</p>
              </div>

              {/* Room tabs */}
              <div className="flex gap-2 border-b border-white/5 pb-4">
                {ROOMS.map(room => (
                  <button 
                    key={room}
                    onClick={() => setActiveWingoRoom(room)}
                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${activeWingoRoom === room ? 'bg-red-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
                  >
                    WinGo {room}
                  </button>
                ))}
              </div>

              {/* Manipulation Core Console */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/60 p-6 rounded-2xl border border-white/5">
                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Active Prediction Override:</h4>
                  
                  <div className="flex items-center gap-4 bg-zinc-900 p-4 rounded-xl border border-white/5">
                    <div className="space-y-1 text-left">
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Room</p>
                      <p className="text-white font-extrabold text-sm uppercase">WinGo {activeWingoRoom}</p>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="space-y-1 text-left">
                      <p className="text-zinc-500 text-[10px] uppercase font-bold">Next preset</p>
                      <p className="font-mono text-lg font-black uppercase tracking-widest">
                        {manualPredictions[activeWingoRoom] !== null && manualPredictions[activeWingoRoom] !== undefined ? (
                          <span className="text-[#00ff66]">NUMBER: {manualPredictions[activeWingoRoom]}</span>
                        ) : (
                          <span className="text-zinc-500">AUTO / RANDOM</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleSetWingoPrediction(activeWingoRoom, null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-4 py-3 rounded-xl text-xs uppercase cursor-pointer transition active:scale-95"
                    >
                      Clear / Reset to Auto
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs uppercase font-extrabold text-zinc-400 tracking-wider">Preset Number Bubble Selector (0 - 9)</h4>
                  <div className="grid grid-cols-5 gap-2.5">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                      // Determine button color standard matching Wingo colors
                      let bgGrad = "from-zinc-800 to-zinc-900";
                      let colorText = "text-white";
                      if (num === 0) bgGrad = "from-[#9c27b0] via-[#f44336] to-[#9c27b0]"; // Red-Violet
                      else if (num === 5) bgGrad = "from-[#9c27b0] via-[#4caf50] to-[#9c27b0]"; // Violet-Green
                      else if (num % 2 === 0) bgGrad = "from-red-600 to-red-800"; // Red
                      else bgGrad = "from-emerald-600 to-emerald-800"; // Green

                      const isSelected = manualPredictions[activeWingoRoom] === num;

                      return (
                        <button
                          key={num}
                          onClick={() => handleSetWingoPrediction(activeWingoRoom, num)}
                          className={`w-12 h-12 rounded-full cursor-pointer bg-gradient-to-br ${bgGrad} ${colorText} flex items-center justify-center font-black text-sm relative transition duration-200 shadow-md ${isSelected ? 'ring-4 ring-white scale-110 shadow-lg shadow-white/10 border-2 border-zinc-950' : 'opacity-80 hover:opacity-100 hover:scale-105 active:scale-95'}`}
                        >
                          {num}
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-white text-zinc-950 rounded-full flex items-center justify-center text-[8px] font-black">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. TWO TYPES OF GIFT CODE GENERATOR & CLAIM TRACKING */}
        {activeMenu === 'Gifts Platform' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              
              {/* Left Column: Creator of codes */}
              <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl lg:col-span-2 space-y-6">
                <div>
                  <h3 className="text-md font-bold uppercase tracking-wider text-white">Generate Code</h3>
                  <p className="text-xs text-zinc-500 mt-1">Deploy automated claimable voucher rewards to player system.</p>
                </div>

                <form onSubmit={handleCreateGiftCode} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Code String</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="e.g. WELCOME100"
                        className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500/20 font-mono font-bold uppercase"
                        value={gCode}
                        onChange={(e) => setGCode(e.target.value)}
                        required
                      />
                      <button 
                        type="button"
                        onClick={handleGenerateRandomCode}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-3 rounded-xl text-xs/tight cursor-pointer focus:outline-none"
                      >
                        Auto-Gen
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Bonus Amount (₹ Payout)</label>
                    <input 
                      type="number"
                      placeholder="e.g. 50"
                      className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-red-500/20 font-bold"
                      value={gAmount}
                      onChange={(e) => setGAmount(e.target.value)}
                      required
                      min={1}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide block">Voucher Type Selector</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        type="button"
                        onClick={() => setGType('standard')}
                        className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${gType === 'standard' ? 'bg-red-600/10 text-red-500 border-red-500/30' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'}`}
                      >
                        <Gift size={14} />
                        <span>Standard</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setGType('deposit_lock')}
                        className={`py-3 rounded-xl border text-xs font-bold transition cursor-pointer flex flex-col items-center justify-center gap-1 ${gType === 'deposit_lock' ? 'bg-[#ff9f0a]/10 text-[#ff9f0a] border-[#ff9f0a]/30' : 'bg-zinc-950 border-white/5 text-zinc-400 hover:text-white'}`}
                      >
                        <Wallet size={14} />
                        <span>Deposit-Lock</span>
                      </button>
                    </div>
                  </div>

                  {gType === 'deposit_lock' && (
                    <div className="space-y-2 bg-[#ff9f0a]/5 p-4 rounded-xl border border-[#ff9f0a]/20 animate-slide">
                      <label className="text-[10px] font-bold text-[#ff9f0a] uppercase tracking-wide block">Accumulated Deposit Requirement (₹)</label>
                      <input 
                        type="number"
                        placeholder="e.g. 500"
                        className="w-full bg-zinc-900 border border-[#ff9f0a]/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#ff9f0a]/40 font-bold"
                        value={gMinDeposit}
                        onChange={(e) => setGMinDeposit(e.target.value)}
                        required={gType === 'deposit_lock'}
                        min={1}
                      />
                      <p className="text-[10px] text-zinc-500 mt-1">This voucher claims ONLY if user's cumulative registered deposit exceeds this setting.</p>
                    </div>
                  )}

                  <button 
                    type="submit"
                    disabled={processing === 'create_gift'}
                    className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md hover:brightness-110 active:scale-98 transition duration-200 disabled:opacity-50"
                  >
                    {processing === 'create_gift' ? 'Generating...' : 'Create Voucher Code'}
                  </button>
                </form>
              </div>

              {/* Right Column: Active codes & Claims history list */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Active Gift list */}
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-zinc-400">Deployed Codes ({giftCodes.length})</h3>
                  <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                    {giftCodes.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-6 text-center">No gift codes created yet.</p>
                    ) : (
                      giftCodes.map((codeObj, i) => (
                        <div key={codeObj.id || i} className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-xl border border-white/5">
                          <div className="text-left space-y-1">
                            <span className="font-mono text-zinc-100 font-extrabold text-sm">{codeObj.id}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${codeObj.type === 'deposit_lock' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' : 'bg-zinc-850 text-zinc-400 border-white/5'}`}>
                                {codeObj.type === 'deposit_lock' ? `DEPOSIT ≥ ₹${codeObj.minDeposit}` : 'STANDARD'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-emerald-400 font-extrabold font-mono text-sm">₹{Number(codeObj.amount).toFixed(2)}</span>
                            <button 
                              onClick={() => handleDeleteGiftCode(codeObj.id)}
                              className="p-2 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition active:scale-90"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Claim tracker logger list */}
                <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-widest text-zinc-400">Claims Log Feed ({giftClaims.length})</h3>
                  <div className="max-h-[320px] overflow-y-auto pr-1 space-y-3">
                    {giftClaims.length === 0 ? (
                      <p className="text-xs text-zinc-500 py-6 text-center">No voucher claims yet.</p>
                    ) : (
                      giftClaims.map((claim, idx) => {
                        // Find claiming user if subscribed
                        const userObj = usersList.find(u => u.id === claim.userId);
                        return (
                          <div key={claim.id || idx} className="flex justify-between items-center bg-zinc-950/60 p-3.5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-3">
                              <img src={userObj?.avatar || "https://api.dicebear.com/7.x/lorelei/svg?seed=Lucky"} className="w-8 h-8 rounded-full bg-white/5" alt="Av" />
                              <div className="text-left">
                                <p className="text-xs font-black text-white">{userObj?.nickname || 'Unknown Avatar'}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">UID: {claim.userUid || 'N/A'}</p>
                              </div>
                            </div>
                            
                            <div className="text-right space-y-0.5">
                              <p className="text-zinc-200 font-extrabold text-xs">VOUCHER: <span className="font-mono">{claim.giftCode}</span></p>
                              <p className="text-emerald-400 font-bold text-xs">+₹{Number(claim.amount).toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Custom Rejection Dialog Modal */}
        {rejectModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative text-left">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-red-500 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> Reject {rejectModal.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">Please specify why you are rejecting this request</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setRejectModal(null)}
                  className="p-1 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="bg-zinc-950/45 p-3 rounded-xl border border-white/5 text-[11.5px] space-y-1.5 font-medium text-zinc-300">
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Player Phone/UID:</span>
                    <span className="font-mono text-white font-bold">{rejectModal.request.phone || rejectModal.request.uid || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500 font-sans">Requested Amount:</span>
                    <span className="text-[#00ff66] font-black">₹{Number(rejectModal.request.amount || 0).toFixed(2)}</span>
                  </div>
                  {rejectModal.type === 'deposit' ? (
                    <div className="flex justify-between">
                      <span className="text-zinc-500 font-sans">UTR / Reference:</span>
                      <span className="font-mono text-yellow-500 font-bold">{rejectModal.request.utr}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="text-zinc-500 font-sans">Account Details:</span>
                      <span className="font-mono text-white break-all bg-black/30 p-1.5 rounded border border-white/5 mt-1 block text-[10px] leading-relaxed">
                        {rejectModal.request.accountDetails || 'N/A'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#ff9c5a] block font-sans">Quick Presets:</label>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    {rejectModal.type === 'deposit' ? (
                      <>
                        <button 
                          onClick={() => setRejectionReason('UTR mismatch or fake receipt')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          UTR mismatch / Fake receipt
                        </button>
                        <button 
                          onClick={() => setRejectionReason('Incorrect amount transferred')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Incorrect amount sent
                        </button>
                        <button 
                          onClick={() => setRejectionReason('No money received in bank')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          No bank credit received
                        </button>
                        <button 
                          onClick={() => setRejectionReason('Please contact VIP Support')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Contact VIP Support
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setRejectionReason('Incorrect UPI ID or Account No')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Details incorrect / Invalid UPI
                        </button>
                        <button 
                          onClick={() => setRejectionReason('Multiple accounts detected')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Multiple accounts detected
                        </button>
                        <button 
                          onClick={() => setRejectionReason('Wager criteria not met')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Wager criteria not met
                        </button>
                        <button 
                          onClick={() => setRejectionReason('Under minimum withdrawal rules')}
                          type="button"
                          className="p-2 text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-lg text-zinc-300 hover:text-white transition truncate cursor-pointer active:scale-95"
                        >
                          Min withdrawal error
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 text-left font-sans">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 block">Or write a custom rejection reason:</label>
                  <textarea 
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason details..."
                    rows={3}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500 transition font-sans"
                  />
                </div>
              </div>

              <div className="p-4 bg-zinc-950/40 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => setRejectModal(null)}
                  type="button"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-white/5 transition cursor-pointer active:scale-95 text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitRejection}
                  type="button"
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg transition duration-150 cursor-pointer active:scale-95 text-center"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default AdminPanelView;
