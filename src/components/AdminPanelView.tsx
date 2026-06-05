import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Sliders, 
  Users, 
  Coins, 
  Wallet, 
  Gift, 
  QrCode, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Check, 
  X, 
  Search, 
  Pencil, 
  Trash2, 
  Copy, 
  AlertTriangle, 
  ShieldAlert, 
  Upload, 
  Info, 
  Calendar, 
  LogOut, 
  Menu,
  Sparkles,
  Lock,
  Unlock,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// ==========================================
// DATA STRUCTURES & SCHEMAS
// ==========================================

export interface UserAccount {
  id: string; // USR-102 etc
  name: string;
  phone: string;
  balance: number;
  joinedDate: string;
  isBanned: boolean;
}

export interface DepositWithdrawalTx {
  id: string;
  user: string;
  phone: string;
  type: 'Deposit' | 'Withdraw';
  amount: number;
  upiOrRef: string; // UTR or Bank IFSC
  time: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

export interface LatestDrawResult {
  period: string;
  number: number;
  color: string; // Red, Green, Violet, Violet+Red etc.
  size: 'Big' | 'Small';
  totalBets: number;
  payout: number;
}

export interface ClaimCode {
  code: string;
  amount: number;
  used: number;
  limit: number;
  expiry: string;
}

export interface UpiQrConfig {
  upiId: string;
  accountName: string;
  qrDataUrl: string; // Base64 encoded or preset representation
}

// Default Seed Records
const SEED_USERS: UserAccount[] = [
  { id: 'USR-101', name: 'Rahul Chaurasia', phone: '9845720193', balance: 5740, joinedDate: '2026-05-12', isBanned: false },
  { id: 'USR-102', name: 'Priya Rathore', phone: '8129482910', balance: 14250, joinedDate: '2026-05-18', isBanned: false },
  { id: 'USR-103', name: 'Amit Kumar Meena', phone: '7014829381', balance: 840, joinedDate: '2026-05-24', isBanned: false },
  { id: 'USR-104', name: 'Siddharth Patel', phone: '9112938192', balance: 92050, joinedDate: '2026-06-01', isBanned: false },
  { id: 'USR-105', name: 'Anjali Sharma', phone: '7928391024', balance: 350, joinedDate: '2026-06-03', isBanned: true }
];

const SEED_TRANSACTIONS: DepositWithdrawalTx[] = [
  { id: 'TX-802', user: 'Rahul Chaurasia', phone: '9845720193', type: 'Deposit', amount: 2000, upiOrRef: '619283948192', time: '2026-06-04 15:30', status: 'Pending' },
  { id: 'TX-803', user: 'Priya Rathore', phone: '8129482910', type: 'Withdraw', amount: 5000, upiOrRef: 'SBIN0001048_91283921021', time: '2026-06-04 16:10', status: 'Pending' },
  { id: 'TX-804', user: 'Amit Kumar Meena', phone: '7014829381', type: 'Deposit', amount: 500, upiOrRef: '938210382912', time: '2026-06-04 16:45', status: 'Approved' },
  { id: 'TX-805', user: 'Siddharth Patel', phone: '9112938192', type: 'Deposit', amount: 25000, upiOrRef: '320193820192', time: '2026-06-04 17:02', status: 'Approved' },
  { id: 'TX-806', user: 'Anjali Sharma', phone: '7928391024', type: 'Withdraw', amount: 1500, upiOrRef: 'HDFC0000210_88291028', time: '2026-06-04 17:15', status: 'Rejected' }
];

const SEED_DRAWS: LatestDrawResult[] = [
  { period: '202606041124', number: 3, color: 'Red', size: 'Small', totalBets: 4500, payout: 9000 },
  { period: '202606041123', number: 0, color: 'Violet + Red', size: 'Small', totalBets: 12400, payout: 24800 },
  { period: '202606041122', number: 8, color: 'Green', size: 'Small', totalBets: 8200, payout: 16400 },
  { period: '202606041121', number: 5, color: 'Violet + Green', size: 'Big', totalBets: 21500, payout: 32250 },
  { period: '202606041120', number: 9, color: 'Red', size: 'Big', totalBets: 7600, payout: 15200 },
  { period: '202606041119', number: 2, color: 'Green', size: 'Small', totalBets: 6100, payout: 12200 },
  { period: '202606041118', number: 4, color: 'Green', size: 'Big', totalBets: 9400, payout: 18800 },
  { period: '202606041117', number: 1, color: 'Red', size: 'Big', totalBets: 18400, payout: 36800 },
  { period: '202606041116', number: 6, color: 'Green', size: 'Big', totalBets: 13200, payout: 26400 },
  { period: '202606041115', number: 7, color: 'Red', size: 'Small', totalBets: 11000, payout: 22000 }
];

const SEED_GIFT_CODES: ClaimCode[] = [
  { code: 'WIN-7392-1084', amount: 200, used: 14, limit: 50, expiry: '2026-08-30' },
  { code: 'WIN-9952-4410', amount: 500, used: 5, limit: 10, expiry: '2026-07-15' },
  { code: 'WIN-1203-8842', amount: 100, used: 40, limit: 40, expiry: '2026-06-01' }
];

// Mapped styling color rules as requested
// 0 = Violet + Red, 5 = Violet + Green, 1,3,7,9 = Red, 2,4,6,8 = Green
const getNumberColorText = (num: number): string => {
  if (num === 0) return 'Violet + Red';
  if (num === 5) return 'Violet + Green';
  if ([1, 3, 7, 9].includes(num)) return 'Red';
  return 'Green';
};

const getNumberColorGradient = (num: number): string => {
  if (num === 0) return 'from-purple-600 to-red-600';
  if (num === 5) return 'from-purple-600 to-green-600';
  if ([1, 3, 7, 9].includes(num)) return 'from-red-600 to-red-500';
  return 'from-green-600 to-green-500';
};

// Size helper: Big (1,4,5,6,9), Small (0,2,3,7,8)
const getNumberSize = (num: number): 'Big' | 'Small' => {
  return [1, 4, 5, 6, 9].includes(num) ? 'Big' : 'Small';
};

interface AdminPanelViewProps {
  onLogout: () => void;
  onToggleView?: () => void;
}

const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onLogout, onToggleView }) => {
  // Navigation Sidebar
  const [activeTab, setActiveTab] = useState<'wingo' | 'tx' | 'users' | 'gifts' | 'qr' | 'dashboard'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Core Persistent State Pools
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [transactions, setTransactions] = useState<DepositWithdrawalTx[]>([]);
  const [draws, setDraws] = useState<LatestDrawResult[]>([]);
  const [giftCodes, setGiftCodes] = useState<ClaimCode[]>([]);
  const [upiQr, setUpiQr] = useState<UpiQrConfig>({
    upiId: 'colorofficial@ybl',
    accountName: 'WINTRADE TRADING PVT LTD',
    qrDataUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=colorofficial@ybl%26pn=WINTRADE%20TRADING%26am=100'
  });

  // Wingo Room Countdown Controller State
  const [secondsLeft, setSecondsLeft] = useState(180); // Default: 3 min (180s)
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState('202606041125');
  const [selectedNextResult, setSelectedNextResult] = useState<number | null>(null);

  // Filters and Search parameters
  const [txFilter, setTxFilter] = useState<'All' | 'Deposit' | 'Withdraw' | 'Pending'>('All');
  const [userSearch, setUserSearch] = useState('');

  // UI state overlays handles
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserBalance, setEditUserBalance] = useState<number>(0);

  // Gift code generator state
  const [genAmount, setGenAmount] = useState('100');
  const [genMaxLimit, setGenMaxLimit] = useState('50');
  const [genExpiry, setGenExpiry] = useState('2026-12-31');
  const [latestGeneratedCode, setLatestGeneratedCode] = useState<string | null>(null);

  // UPI configuration edit state
  const [editUpiId, setEditUpiId] = useState('');
  const [editUpiName, setEditUpiName] = useState('');
  const [qrUploadPreview, setQrUploadPreview] = useState<string | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // -------------------------------------------------------------
  // INITIALIZATIONS & SERIALIZER LIFECYCLE
  // -------------------------------------------------------------
  useEffect(() => {
    // Check screen size to toggle initial state on mobile devices
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // Users Serializer
    const localUsers = localStorage.getItem('wt_admin_users');
    if (localUsers) {
      setUsers(JSON.parse(localUsers));
    } else {
      setUsers(SEED_USERS);
      localStorage.setItem('wt_admin_users', JSON.stringify(SEED_USERS));
    }

    // Transactions Serializer
    const localTx = localStorage.getItem('wt_admin_transactions');
    if (localTx) {
      setTransactions(JSON.parse(localTx));
    } else {
      setTransactions(SEED_TRANSACTIONS);
      localStorage.setItem('wt_admin_transactions', JSON.stringify(SEED_TRANSACTIONS));
    }

    // Historical Draw Results Serializer
    const localDraws = localStorage.getItem('wt_admin_draws');
    if (localDraws) {
      setDraws(JSON.parse(localDraws));
    } else {
      setDraws(SEED_DRAWS);
      localStorage.setItem('wt_admin_draws', JSON.stringify(SEED_DRAWS));
    }

    // Gift Voucher Codes Serializer
    const localGifts = localStorage.getItem('wt_admin_gifts');
    if (localGifts) {
      setGiftCodes(JSON.parse(localGifts));
    } else {
      setGiftCodes(SEED_GIFT_CODES);
      localStorage.setItem('wt_admin_gifts', JSON.stringify(SEED_GIFT_CODES));
    }

    // QR Configuration Serializer
    const localQr = localStorage.getItem('wt_admin_qr_config');
    if (localQr) {
      const q = JSON.parse(localQr);
      setUpiQr(q);
      setEditUpiId(q.upiId);
      setEditUpiName(q.accountName);
    } else {
      setEditUpiId(upiQr.upiId);
      setEditUpiName(upiQr.accountName);
    }

    // Timer status
    const savedPeriod = localStorage.getItem('wt_admin_current_period');
    if (savedPeriod) setCurrentPeriod(savedPeriod);

    const savedSeconds = localStorage.getItem('wt_admin_timer_secs');
    if (savedSeconds) setSecondsLeft(parseInt(savedSeconds));
  }, []);

  // Sync to database triggers helper
  const syncLocal = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const notifyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // -------------------------------------------------------------
  // COUNTDOWN CLOCK TICK LOGIC
  // -------------------------------------------------------------
  useEffect(() => {
    let timerInterval: any = null;
    if (isTimerActive && secondsLeft > 0) {
      timerInterval = setInterval(() => {
        setSecondsLeft((prev) => {
          const nextVal = prev - 1;
          localStorage.setItem('wt_admin_timer_secs', String(nextVal));
          return nextVal;
        });
      }, 1000);
    } else if (secondsLeft === 0) {
      // Periodic trigger: settle the Wingo Draw!
      triggerDrawSettle();
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [secondsLeft, isTimerActive]);

  // Settle Round Event Output
  const triggerDrawSettle = () => {
    // 1. Resolve selected choice or fallback to pseudo-random distribution
    const drawNumber = selectedNextResult !== null ? selectedNextResult : Math.floor(Math.random() * 10);
    
    // Standard bets simulated figure calculations
    const totalBets = Math.floor(5000 + Math.random() * 18000);
    const payout = Math.floor(totalBets * ([0, 5].includes(drawNumber) ? 1.5 : 2.0));

    const resultRecord: LatestDrawResult = {
      period: currentPeriod,
      number: drawNumber,
      color: getNumberColorText(drawNumber),
      size: getNumberSize(drawNumber),
      totalBets: totalBets,
      payout: payout
    };

    // Prepend resulting record & truncate at 10 items limit
    const nextDraws = [resultRecord, ...draws].slice(0, 10);
    setDraws(nextDraws);
    syncLocal('wt_admin_draws', nextDraws);

    // Auto increment period sequence ID
    const nextPrdVal = String(parseInt(currentPeriod) + 1);
    setCurrentPeriod(nextPrdVal);
    localStorage.setItem('wt_admin_current_period', nextPrdVal);

    // Reset clock back to 3 mins (180s)
    setSecondsLeft(180);
    localStorage.setItem('wt_admin_timer_secs', '180');

    // Deselect overrides
    setSelectedNextResult(null);
    notifyToast(`Period ${currentPeriod} draw settled: Mapped Number ${drawNumber}!`);
  };

  // Timer controls handles
  const handleResetTimer = () => {
    setSecondsLeft(180);
    localStorage.setItem('wt_admin_timer_secs', '180');
    notifyToast("Timer has been reset to 3 minutes.");
  };

  const handleToggleTimer = () => {
    setIsTimerActive(!isTimerActive);
    notifyToast(isTimerActive ? "Timer counts Paused." : "Timer counts Resumed.");
  };

  // Lock target number
  const handleConfirmNextResult = () => {
    if (selectedNextResult === null) {
      notifyToast("Please select a number from 0-9 before confirming next result.");
      return;
    }
    notifyToast(`Success: Draw outcome for Period ${currentPeriod} locked on Number ${selectedNextResult}!`);
  };

  // -------------------------------------------------------------
  // DEPOSITS AND WITHDRAWALS MANAGEMENT
  // -------------------------------------------------------------
  const pendingTx = transactions.filter(t => t.status === 'Pending');
  const approvedTx = transactions.filter(t => t.status === 'Approved');
  const rejectedTx = transactions.filter(t => t.status === 'Rejected');

  const filteredTx = transactions.filter(t => {
    if (txFilter === 'Deposit') return t.type === 'Deposit';
    if (txFilter === 'Withdraw') return t.type === 'Withdraw';
    if (txFilter === 'Pending') return t.status === 'Pending';
    return true;
  });

  const handleApproveTx = (txId: string) => {
    const updated = transactions.map(t => {
      if (t.id === txId) {
        // Find owner and credit/validate assets instantly
        if (t.type === 'Deposit') {
          // Add deposit amt to user
          setUsers(curUsers => {
            const nextList = curUsers.map(u => {
              if (u.name === t.user || u.phone === t.phone) {
                return { ...u, balance: u.balance + t.amount };
              }
              return u;
            });
            syncLocal('wt_admin_users', nextList);
            return nextList;
          });
        }
        notifyToast(`Success: Approved transaction of ₹${t.amount}`);
        return { ...t, status: 'Approved' as const };
      }
      return t;
    });
    setTransactions(updated);
    syncLocal('wt_admin_transactions', updated);
  };

  const handleRejectTx = (txId: string) => {
    const updated = transactions.map(t => {
      if (t.id === txId) {
        // If withdrawal is rejected, restore user assets instantly
        if (t.type === 'Withdraw') {
          setUsers(curUsers => {
            const nextList = curUsers.map(u => {
              if (u.name === t.user || u.phone === t.phone) {
                return { ...u, balance: u.balance + t.amount };
              }
              return u;
            });
            syncLocal('wt_admin_users', nextList);
            return nextList;
          });
        }
        notifyToast(`Success: Rejected transaction of ₹${t.amount}`);
        return { ...t, status: 'Rejected' as const };
      }
      return t;
    });
    setTransactions(updated);
    syncLocal('wt_admin_transactions', updated);
  };

  // -------------------------------------------------------------
  // USER DIRECTORY MANAGEMENT
  // -------------------------------------------------------------
  const bannedUsersCount = users.filter(u => u.isBanned).length;
  const cumulativeBalances = users.reduce((acc, curr) => acc + curr.balance, 0);

  const searchedUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone.includes(userSearch) ||
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const toggleBanStatus = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        const nextState = !u.isBanned;
        notifyToast(`User ${u.name} is now ${nextState ? 'Banned' : 'Unbanned'}`);
        return { ...u, isBanned: nextState };
      }
      return u;
    });
    setUsers(updated);
    syncLocal('wt_admin_users', updated);
  };

  const handleOpenEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserBalance(u.balance);
  };

  const handleSaveUserEdit = () => {
    if (!editingUser) return;
    const updatedUsers = users.map(u => {
      if (u.id === editingUser.id) {
        return { ...u, name: editUserName, balance: editUserBalance };
      }
      return u;
    });
    setUsers(updatedUsers);
    syncLocal('wt_admin_users', updatedUsers);
    setEditingUser(null);
    notifyToast("Player modifications saved successfully.");
  };

  // -------------------------------------------------------------
  // GIFT CODE GENERATION CODE
  // -------------------------------------------------------------
  const generateRandomGiftVoucher = () => {
    const parts: string[] = [];
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < 2; i++) {
      let segment = '';
      for (let j = 0; j < 4; j++) {
        segment += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      parts.push(segment);
    }
    const generated = `WIN-${parts[0]}-${parts[1]}`;
    
    const newCode: ClaimCode = {
      code: generated,
      amount: parseFloat(genAmount) || 100,
      used: 0,
      limit: parseInt(genMaxLimit) || 10,
      expiry: genExpiry
    };

    const nextList = [newCode, ...giftCodes];
    setGiftCodes(nextList);
    syncLocal('wt_admin_gifts', nextList);
    setLatestGeneratedCode(generated);
    notifyToast(`Code ${generated} has been generated successfully.`);
  };

  const handleDeleteGiftCode = (codeStr: string) => {
    const nextList = giftCodes.filter(c => c.code !== codeStr);
    setGiftCodes(nextList);
    syncLocal('wt_admin_gifts', nextList);
    notifyToast("Gift Code has been deleted.");
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifyToast("Voucher copied to clipboard!");
  };

  // -------------------------------------------------------------
  // UPI QR INTERACTIVE MANAGER
  // -------------------------------------------------------------
  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setQrUploadPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveQrConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUpiId.trim()) {
      notifyToast("Please input a valid UPI ID Address");
      return;
    }

    const updatedConf: UpiQrConfig = {
      upiId: editUpiId,
      accountName: editUpiName || 'OFFICIAL WALLET',
      qrDataUrl: qrUploadPreview || upiQr.qrDataUrl
    };

    setUpiQr(updatedConf);
    syncLocal('wt_admin_qr_config', updatedConf);
    notifyToast("Success: UPI QR & Merchant account updated.");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 flex font-sans antialiased overflow-x-hidden">
      
      {/* GLOWING NOTIFICATION TOAST POPUP */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#12121e] border-2 border-[#f0c040] text-[#f0c040] font-dmmono text-xs px-5 py-4 rounded-xl shadow-[0_0_20px_rgba(240,192,64,0.35)] flex items-center gap-3"
          >
            <Sparkles size={16} className="text-[#f0c040] animate-pulse" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE BACKDROP OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden cursor-pointer"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ADMIN COLLAPSIBLE SIDEBAR NAIL */}
      <aside className={`fixed inset-y-0 left-0 z-50 bg-[#0e0e18] border-r border-[#f0c040]/10 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} transition-transform duration-300 flex flex-col justify-between`}>
        <div>
          {/* Brand header */}
          <div className="p-6 border-b border-[#f0c040]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#f0c040] to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-600/25">
                <Sliders size={16} className="text-black" />
              </div>
              <div>
                <h2 className="font-syne font-extrabold text-sm tracking-wider uppercase text-[#f0c040]">Wingo Core</h2>
                <span className="text-[9px] tracking-widest font-dmmono text-slate-500">ADMIN CONTROL</span>
              </div>
            </div>
            <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="p-4">
            <span className="block text-[10px] uppercase font-bold tracking-widest text-[#f0c040]/40 pl-3 mb-3">Navigation Map</span>

            {/* Nav list representing exactly the 6 sections */}
            <div className="space-y-1.5">
              {[
                { id: 'dashboard', label: 'Overall Dashboard', icon: <LayoutDashboard size={18} /> },
                { id: 'wingo', label: 'Wingo Control Room', icon: <Clock size={18} /> },
                { id: 'tx', label: 'Deposit & Withdraw', icon: <Coins size={18} />, count: pendingTx.length },
                { id: 'users', label: 'User Directory', icon: <Users size={18} /> },
                { id: 'gifts', label: 'Gift Code Generator', icon: <Gift size={18} /> },
                { id: 'qr', label: 'UPI QR Settings', icon: <QrCode size={18} /> }
              ].map((item) => {
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      if (window.innerWidth < 768) setIsSidebarOpen(false);
                    }}
                    className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-between transition-all duration-200 cursor-pointer text-xs font-syne uppercase tracking-wider ${isSelected ? 'bg-gradient-to-r from-[#f0c040]/15 to-transparent text-[#f0c040] border-l-2 border-[#f0c040]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    {item.count && item.count > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-red-600/30 border border-red-500 text-red-400 font-dmmono text-[10px] font-bold">
                        {item.count}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t border-[#f0c040]/10 flex flex-col gap-3">
          <div className="flex items-center gap-3 pl-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold tracking-widest text-[#f0c040]/60 uppercase font-mono">OPERATIONAL GREEN</span>
          </div>

          <button 
            onClick={onLogout}
            className="w-full py-3 bg-[#e11d48]/10 hover:bg-[#e11d48]/20 text-[#f43f5e] font-bold text-xs font-syne uppercase tracking-widest rounded-xl transition flex items-center justify-center gap-2 cursor-pointer border border-[#e11d48]/25"
          >
            <LogOut size={14} />
            Terminal Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER WINDOW WORKSPACE */}
      <div className="flex-1 min-h-screen flex flex-col md:pl-64 max-w-full overflow-x-hidden min-w-0">
        
        {/* TOP STATUS HEADER BAR */}
        <header className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-[#f0c040]/10 px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <button className="md:hidden text-[#f0c040] p-1.5 hover:bg-[#12121e] rounded-lg" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-sm md:text-md font-syne font-extrabold uppercase tracking-wide text-slate-100 flex items-center gap-1.5">
              <span className="text-[#f0c040]">/</span> PANEL CORE
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {onToggleView && (
              <button 
                onClick={onToggleView}
                className="px-3 py-1.5 md:px-4 md:py-2 bg-[#f0c040] hover:bg-yellow-500 text-black font-extrabold rounded-xl text-[10px] md:text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <span className="hidden sm:inline">Back To </span>Game View
              </button>
            )}
            <div className="hidden sm:block bg-[#12121e] border border-[#f0c040]/10 px-3 py-1 md:px-4 md:py-1.5 rounded-xl text-[10px] md:text-[11px] font-dmmono text-amber-500 whitespace-nowrap">
              UTC: 2026-06-04 20:38
            </div>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <main className="p-4 md:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6 min-w-0">

          {/* SECTION 1: OVERALL DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* Header block */}
              <div>
                <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider">Overall Dashboard</h2>
                <p className="text-xs text-slate-400 mt-1">Global financial metrics, game distribution strategy & user system logs.</p>
              </div>

              {/* 4 Golden Stats blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[
                  { label: 'Cumulative Reserves', value: `₹${cumulativeBalances.toLocaleString()}`, icon: <Wallet size={20} className="text-amber-400" />, desc: 'Combined player balance' },
                  { label: 'Total Verified Recharges', value: `₹${transactions.filter(t => t.type === 'Deposit' && t.status === 'Approved').reduce((a,c) => a+c.amount, 0).toLocaleString()}`, icon: <TrendingUp size={20} className="text-emerald-400" />, desc: 'Deposit ledger cumulative' },
                  { label: 'Released Cash Cashouts', value: `₹${transactions.filter(t => t.type === 'Withdraw' && t.status === 'Approved').reduce((a,c) => a+c.amount, 0).toLocaleString()}`, icon: <Coins size={20} className="text-rose-400" />, desc: 'Approved withdrawal outlays' },
                  { label: 'Total Player directory', value: users.length, icon: <Users size={20} className="text-blue-400" />, desc: 'Registered accounts' }
                ].map((stat, i) => (
                  <div key={i} className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 relative overflow-hidden group hover:border-[#f0c040]/30 transition-all duration-300">
                    <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
                      {stat.icon}
                    </div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] tracking-widest font-syne font-black uppercase text-slate-400">{stat.label}</span>
                      <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                        {stat.icon}
                      </div>
                    </div>
                    <div className="text-xl md:text-2xl font-dmmono font-black text-[#f0c040] tracking-tight">{stat.value}</div>
                    <p className="text-[10px] text-slate-500 mt-1">{stat.desc}</p>
                  </div>
                ))}
              </div>

              {/* Advanced interactive analytics visualization chart */}
              <div className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#f0c040]" />
                      Deposit vs Withdrawal Outflow Chart
                    </h3>
                    <p className="text-[11px] text-slate-400">Chronological transaction flow diagram reflecting operational liquidity ratios.</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <span className="text-slate-400">Deposits</span></div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> <span className="text-slate-400">Withdrawals</span></div>
                  </div>
                </div>

                {/* Highly custom scalable SVG analytics line chart graph to bypass bulky chart imports */}
                <div className="h-48 w-full bg-[#0a0a0f] rounded-xl flex items-end relative px-4 pb-2 border border-slate-800">
                  <div className="absolute top-2 left-4 text-[10px] font-dmmono text-slate-600">₹25,000 Volume Maximum</div>
                  <svg className="w-full h-36" viewBox="0 0 500 150" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="glow-green" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="glow-red" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Deposits SVG glowing path */}
                    <path d="M0,130 Q100,50 200,90 T400,20 T500,60 L500,150 L0,150 Z" fill="url(#glow-green)" />
                    <path d="M0,130 Q100,50 200,90 T400,20 T500,60" fill="none" stroke="#10b981" strokeWidth="3" />

                    {/* Withdrawals SVG glowing path */}
                    <path d="M0,120 Q80,110 180,60 T350,110 T500,90 L500,150 L0,150 Z" fill="url(#glow-red)" />
                    <path d="M0,120 Q80,110 180,60 T350,110 T500,90" fill="none" stroke="#ef4444" strokeWidth="3" />
                  </svg>
                  <div className="absolute bottom-2 left-0 right-0 px-4 justify-between flex font-dmmono text-[9px] text-slate-500">
                    <span>12:00</span>
                    <span>13:00</span>
                    <span>14:00</span>
                    <span>15:00</span>
                    <span>16:00</span>
                    <span>17:00</span>
                    <span>Current</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: WINGO CONTROL */}
          {activeTab === 'wingo' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header block */}
              <div>
                <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider text-left">Wingo Control Cabinet</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time clock trigger cabinet to pause, resume, reset periods or enforce custom outcomes.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Timer Clock Circle Panel */}
                <div className="lg:col-span-5 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 flex flex-col items-center justify-center space-y-6">
                  <span className="text-[10px] tracking-widest font-syne font-black uppercase text-slate-400">Live Area Timer</span>
                  
                  {/* Circle SVG Progress tracker */}
                  <div className="relative w-44 h-44 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                      <circle cx="88" cy="88" r="76" stroke="#1c1c2d" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="88" cy="88" r="76" 
                        stroke="#f0c040" strokeWidth="8" fill="transparent" 
                        strokeDasharray={2 * Math.PI * 76} 
                        strokeDashoffset={2 * Math.PI * 76 * (1 - secondsLeft / 180)}
                        className="transition-all duration-1000 ease-linear"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-center z-10">
                      <span className="block text-[11px] tracking-widest uppercase font-syne font-extrabold text-slate-400">PERIOD {currentPeriod}</span>
                      <span className="text-4xl font-dmmono font-black text-white inline-block mt-1">
                        {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                      </span>
                      <span className={`block text-[9px] tracking-widest uppercase font-bold mt-2 ${isTimerActive ? 'text-emerald-500 shadow-sm' : 'text-rose-500 animate-pulse'}`}>
                        {isTimerActive ? 'COUNTING' : 'PAUSED'}
                      </span>
                    </div>
                  </div>

                  {/* Operational Timer triggers */}
                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={handleToggleTimer}
                      className="flex-1 py-3 bg-[#f0c040]/10 hover:bg-[#f0c040]/20 border border-[#f0c040]/30 text-[#f0c040] rounded-xl font-syne text-xs uppercase font-extrabold tracking-widest transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      {isTimerActive ? <Pause size={14} /> : <Play size={14} />}
                      {isTimerActive ? 'Pause' : 'Resume'}
                    </button>
                    <button 
                      onClick={handleResetTimer}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-slate-700 text-slate-300 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      title="Reset Timer to 3m"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      onClick={triggerDrawSettle}
                      className="py-3 px-4 bg-emerald-500 hover:bg-emerald-600 text-black rounded-xl font-syne text-xs uppercase font-black tracking-wider transition active:scale-95 cursor-pointer"
                    >
                      Force Draw
                    </button>
                  </div>
                </div>

                {/* NEXT RESULT CHOICE LOCK PANEL */}
                <div className="lg:col-span-7 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[#f0c040]/10 pb-4">
                      <div>
                        <h4 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider">Set Next Period Result</h4>
                        <p className="text-[10px] text-slate-400">Manipulate draw criteria manually or default to zero payout profit mode.</p>
                      </div>
                      <span className="px-3 py-1 font-dmmono text-[11px] font-bold bg-[#f0c040]/10 text-[#f0c040] border border-[#f0c040]/20 rounded-full">
                        Lock Result
                      </span>
                    </div>

                    {/* Numeric Selector Grid */}
                    <div>
                      <span className="block text-[10px] tracking-widest font-syne font-black uppercase text-slate-400 mb-3 text-left">Choose Winner Block Number (0 - 9)</span>
                      <div className="grid grid-cols-5 gap-2.5">
                        {Array.from({ length: 10 }).map((_, num) => {
                          const isSelected = selectedNextResult === num;
                          return (
                            <button
                              key={num}
                              onClick={() => setSelectedNextResult(isSelected ? null : num)}
                              className={`py-3 rounded-xl font-dmmono font-black text-sm relative transition-all duration-200 cursor-pointer active:scale-90 border-2 ${isSelected ? 'border-[#f0c040] shadow-[0_0_15px_rgba(240,192,64,0.3)]' : 'border-slate-800'} bg-gradient-to-tr ${getNumberColorGradient(num)} text-white`}
                            >
                              <span className="text-lg block">{num}</span>
                              <span className="text-[8px] uppercase block opacity-80 mt-0.5">{getNumberSize(num)}</span>
                              {isSelected && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full flex items-center justify-center p-0.5">
                                  <Check size={8} className="text-black font-black" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* MAPPED FORMULA TRUTH RULES */}
                    <div className="bg-[#0a0a0f] p-4 rounded-xl border border-[#f0c040]/5 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 border-b border-white/5 pb-1 mb-2 font-syne font-bold uppercase tracking-wider">
                        <Info size={12} className="text-[#f0c040]" />
                        <span>Game Logic Rules Matrix</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-dmmono text-[11px] text-slate-400">
                        <div className="flex justify-between"><span>Number 0:</span> <span className="text-purple-400 font-bold">Violet + Red (Small)</span></div>
                        <div className="flex justify-between"><span>Number 5:</span> <span className="text-teal-400 font-bold">Violet + Green (Big)</span></div>
                        <div className="flex justify-between"><span>Odds [1,3,7,9]:</span> <span className="text-red-400 font-bold">Red</span></div>
                        <div className="flex justify-between"><span>Evens [2,4,6,8]:</span> <span className="text-green-400 font-bold">Green</span></div>
                        <div className="flex justify-between"><span>Big Size:</span> <span className="text-[#f0c040]">1, 4, 5, 6, 9</span></div>
                        <div className="flex justify-between"><span>Small Size:</span> <span className="text-blue-400">0, 2, 3, 7, 8</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f0c040]/10 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleConfirmNextResult}
                      disabled={selectedNextResult === null}
                      className={`flex-1 py-3 text-center font-syne text-xs uppercase font-extrabold tracking-widest rounded-xl transition cursor-pointer active:scale-98 ${selectedNextResult !== null ? 'bg-gradient-to-r from-[#f0c040] to-yellow-500 text-black font-black shadow-lg shadow-yellow-600/25' : 'bg-white/5 text-slate-500 border border-slate-800'}`}
                    >
                      Confirm Next Result {selectedNextResult !== null ? `(Enforce: ${selectedNextResult})` : ''}
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: PREPENDED LAST 10 DRAWN RESULTS RESULTS */}
              <div className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider">Historial Draw Results Ledger (Last 10 Rounds)</h4>
                    <p className="text-[11px] text-slate-400">Verification archive showing historical payout logs and total aggregated bets.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-syne text-slate-400 font-black tracking-widest bg-[#0a0a0f]/50">
                        <th className="p-3">Period Sequence ID</th>
                        <th className="p-3">Winner Number</th>
                        <th className="p-3">Winner Color Mapped</th>
                        <th className="p-3">Winner Size</th>
                        <th className="p-3">Simulated Bets Value</th>
                        <th className="p-3 text-right">Aggregated Payout</th>
                      </tr>
                    </thead>
                    <tbody className="font-dmmono text-slate-300">
                      {draws.map((dr, index) => (
                        <tr key={dr.period} className={`border-b border-slate-800/50 hover:bg-white/5 transition ${index === 0 ? 'bg-gradient-to-r from-[#f0c040]/5 to-transparent' : ''}`}>
                          <td className="p-3 font-bold text-amber-500">{dr.period}</td>
                          <td className="p-3">
                            <span className={`inline-block w-7 h-7 rounded-full text-center leading-7 font-black text-white bg-gradient-to-tr ${getNumberColorGradient(dr.number)}`}>
                              {dr.number}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">{dr.color}</td>
                          <td className="p-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${dr.size === 'Big' ? 'bg-[#f0c040]/10 text-[#f0c040] border border-[#f0c040]/20' : 'bg-slate-800 text-slate-400'}`}>
                              {dr.size}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">₹{dr.totalBets.toLocaleString()}</td>
                          <td className="p-3 text-right text-[#f0c040] font-bold">₹{dr.payout.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: DEPOSIT & WITHDRAWAL GATEWAY QUEUES */}
          {activeTab === 'tx' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider">Deposit & Withdrawal Queue Desk</h2>
                  <p className="text-xs text-slate-400 mt-1">Pending payments approval controller ledger with fast status updates updates.</p>
                </div>
                
                {/* 4 Multi-state tabs filters */}
                <div className="flex bg-[#12121e] border border-slate-800 p-1 rounded-xl">
                  {['All', 'Deposit', 'Withdraw', 'Pending'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setTxFilter(opt as any)}
                      className={`px-3 py-1.5 text-[10px] font-syne font-black uppercase tracking-wider rounded-lg transition-all duration-200 cursor-pointer ${txFilter === opt ? 'bg-[#f0c040] text-black' : 'text-slate-400 hover:text-white'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Top 3 Counter indicators */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Pending Authorizations', val: pendingTx.length, bg: 'border-yellow-500/10 bg-yellow-500/5', txt: 'text-yellow-400' },
                  { label: 'Settled Approvals', val: approvedTx.length, bg: 'border-emerald-500/10 bg-emerald-500/5', txt: 'text-emerald-400' },
                  { label: 'Rejected Exceptions', val: rejectedTx.length, bg: 'border-rose-500/10 bg-rose-500/5', txt: 'text-rose-400' }
                ].map((st, idx) => (
                  <div key={idx} className={`border ${st.bg} rounded-2xl p-5 flex items-center justify-between`}>
                    <div>
                      <span className="block text-[9px] tracking-widest font-syne font-black uppercase text-slate-400">{st.label}</span>
                      <span className={`text-2xl font-dmmono font-black mt-2 inline-block ${st.txt}`}>{st.val} Records</span>
                    </div>
                    <div className={`p-2 rounded-xl bg-white/5`}>
                      <Coins size={16} className={st.txt} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Transactions Ledger Database Tabular format */}
              <div className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-syne text-slate-400 font-extrabold tracking-widest bg-[#0a0a0f]/50">
                        <th className="p-3">User Details</th>
                        <th className="p-3">Payment Model</th>
                        <th className="p-3">Transaction Figures</th>
                        <th className="p-3">UPI UPI ID / Ref UTR ID</th>
                        <th className="p-3">Request Creation Time</th>
                        <th className="p-3">Settle State</th>
                        <th className="p-3 text-right">Control Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-dmmono text-slate-300">
                      {filteredTx.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">No payment records filtered with current parameters.</td>
                        </tr>
                      ) : (
                        filteredTx.map(tx => (
                          <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-white/5 transition-all">
                            <td className="p-3">
                              <span className="font-sans font-bold text-white block">{tx.user}</span>
                              <span className="text-[10px] text-slate-400 block">{tx.phone}</span>
                            </td>
                            <td className="p-3 font-semibold">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-100 text-sm">
                              ₹{tx.amount.toLocaleString()}
                            </td>
                            <td className="p-3 text-[#f0c040] select-all font-bold tracking-wider">{tx.upiOrRef}</td>
                            <td className="p-3 text-slate-400">{tx.time}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${tx.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400' : 'bg-yellow-500/10 text-yellow-400 animate-pulse'}`}>
                                {tx.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {tx.status === 'Pending' ? (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => handleApproveTx(tx.id)}
                                    className="p-1 px-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95"
                                  >
                                    <Check size={11} /> Approve
                                  </button>
                                  <button
                                    onClick={() => handleRejectTx(tx.id)}
                                    className="p-1 px-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 cursor-pointer transition active:scale-95"
                                  >
                                    <X size={11} /> Reject
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] uppercase tracking-widest text-[#f0c040]/40 font-bold">SETTLED TRANSACTION</span>
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

          {/* SECTION 4: USER DIRECTORY LIST */}
          {activeTab === 'users' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header block */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider">User Management Directory</h2>
                  <p className="text-xs text-slate-400 mt-1">Audit active profiles, modify custom player wallet assets or issue bans.</p>
                </div>
                
                {/* Search Bar Input */}
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name, phone, or ID..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-[#12121e] border border-[#f0c040]/25 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-1 focus:ring-[#f0c040] text-slate-100 outline-none placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* 3 User Stats counter blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {[
                  { label: 'Total Registered Players', val: users.length, icon: <Users size={16} className="text-amber-500" /> },
                  { label: 'Aggregated Live Balances Potential', val: `₹${cumulativeBalances.toLocaleString()}`, icon: <Wallet size={16} className="text-emerald-500" /> },
                  { label: 'Banned Accounts Restricted', val: bannedUsersCount, icon: <ShieldAlert size={16} className="text-rose-500" /> }
                ].map((usStat, index) => (
                  <div key={index} className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-5 flex items-center justify-between">
                    <div>
                      <span className="block text-[9px] tracking-widest font-syne font-black uppercase text-slate-400">{usStat.label}</span>
                      <span className="text-2xl font-dmmono font-black mt-1.5 inline-block text-[#f0c040]">{usStat.val}</span>
                    </div>
                    <div className="p-2 bg-white/5 border border-white/10 rounded-xl">
                      {usStat.icon}
                    </div>
                  </div>
                ))}
              </div>

              {/* Directory Listing Table */}
              <div className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-syne text-slate-400 font-extrabold tracking-widest bg-[#0a0a0f]/50">
                        <th className="p-3">Player ID</th>
                        <th className="p-3">Display Name</th>
                        <th className="p-3">Phone Line</th>
                        <th className="p-3">Wallet Balance</th>
                        <th className="p-3">Date Joined</th>
                        <th className="p-3">Account Security</th>
                        <th className="p-3 text-right">Controller Actions</th>
                      </tr>
                    </thead>
                    <tbody className="font-dmmono text-slate-300">
                      {searchedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-500">No profile matches found under typed parameters.</td>
                        </tr>
                      ) : (
                        searchedUsers.map(u => (
                          <tr key={u.id} className={`border-b border-slate-800/50 hover:bg-white/5 transition-all ${u.isBanned ? 'bg-red-950/10' : ''}`}>
                            <td className="p-3 font-semibold text-amber-500">{u.id}</td>
                            <td className="p-3 font-sans font-bold text-white text-sm">{u.name}</td>
                            <td className="p-3 text-slate-400">{u.phone}</td>
                            <td className="p-3 font-bold text-slate-100">₹{u.balance.toLocaleString()}</td>
                            <td className="p-3 text-slate-400 text-[10px]">{u.joinedDate}</td>
                            <td className="p-3">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.isBanned ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                {u.isBanned ? 'Banned' : 'Active'}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1 px-2 bg-white/5 hover:bg-white/10 text-[#f0c040] rounded border border-[#f0c040]/25 text-[10px] uppercase font-bold tracking-widest cursor-pointer transition active:scale-95 flex items-center gap-1"
                                >
                                  <Pencil size={11} /> Modify
                                </button>
                                <button
                                  onClick={() => toggleBanStatus(u.id)}
                                  className={`p-1 px-2 rounded text-[10px] uppercase font-bold tracking-widest cursor-pointer transition active:scale-95 flex items-center gap-1 ${u.isBanned ? 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/25'}`}
                                >
                                  {u.isBanned ? <Unlock size={11} /> : <Lock size={11} />}
                                  {u.isBanned ? 'Unlock' : 'Ban'}
                                </button>
                              </div>
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

          {/* SECTION 5: GIFT CODE GENERATE */}
          {activeTab === 'gifts' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header block */}
              <div>
                <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider">Gift Code Generation Cabinet</h2>
                <p className="text-xs text-slate-400 mt-1">Formulate exclusive credit-multiplier claim codes for event marketing vouchers.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Generation form panel */}
                <div className="lg:col-span-5 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                  <h3 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider mb-4 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Award size={16} className="text-[#f0c040]" />
                    Voucher Parameters
                  </h3>

                  <div className="space-y-4 font-syne">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Rupee Amount (₹ Value)</label>
                      <input
                        type="number"
                        value={genAmount}
                        onChange={(e) => setGenAmount(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none font-dmmono focus:border-[#f0c040]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Allowed Claim Limit</label>
                      <input
                        type="number"
                        value={genMaxLimit}
                        onChange={(e) => setGenMaxLimit(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none font-dmmono focus:border-[#f0c040]"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Voucher Expiration Date</label>
                      <input
                        type="date"
                        value={genExpiry}
                        onChange={(e) => setGenExpiry(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 outline-none font-dmmono focus:border-[#f0c040]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={generateRandomGiftVoucher}
                      className="w-full py-3.5 bg-gradient-to-r from-[#f0c040] to-yellow-600 text-black font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-yellow-600/20 active:scale-95 cursor-pointer"
                    >
                      Generate Reward Voucher
                    </button>
                  </div>
                </div>

                {/* Display newly generated code block panel */}
                <div className="lg:col-span-7 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider mb-3">Live Voucher Code Output</h3>
                    <p className="text-[11px] text-slate-400 mb-4 leading-relaxed">Ensure generated claim keys are copied correctly. Distribute code string securely to active player circles.</p>
                    
                    {latestGeneratedCode ? (
                      <div className="bg-[#0a0a0f] border-2 border-dashed border-[#f0c040]/40 p-8 rounded-2xl text-center space-y-4">
                        <span className="block text-[9px] tracking-widest text-slate-500 uppercase font-black">WINNING BONUS ID</span>
                        <div className="font-dmmono text-2xl font-black text-[#f0c040] tracking-wider tracking-widest">{latestGeneratedCode}</div>
                        
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(latestGeneratedCode)}
                            className="py-2 px-5 bg-[#f0c040] text-black font-bold font-syne text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition"
                          >
                            <Copy size={12} /> Copy Code
                          </button>
                          <span className="text-[10px] block text-green-400 font-bold flex items-center gap-1"><Check size={12}/> Vested Voucher Live</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0a0a0f] border border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs py-14">
                        No code generated yet this session. Modify parameters on the left and hit generate button.
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#f0c040]/10 text-xs text-slate-500 flex items-center gap-2">
                    <Info size={14} className="text-[#f0c040]" />
                    <span>Generated promotional keys instantly credited to client reserves upon user checkout.</span>
                  </div>
                </div>
              </div>

              {/* Code database overview directory table */}
              <div className="bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6">
                <h4 className="text-xs font-syne font-extrabold uppercase text-slate-300 tracking-wider mb-4">Active System codes ledger</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] uppercase font-syne text-slate-400 font-extrabold tracking-widest bg-[#0a0a0f]/50">
                        <th className="p-3">Promotion Code Key</th>
                        <th className="p-3">Claim Credit value</th>
                        <th className="p-3">Distribution Used / Limit Ratio</th>
                        <th className="p-3">Expiration Threshold</th>
                        <th className="p-3 text-right">Delete Voucher</th>
                      </tr>
                    </thead>
                    <tbody className="font-dmmono text-slate-300">
                      {giftCodes.map(gc => (
                        <tr key={gc.code} className="border-b border-slate-800/50 hover:bg-white/5 transition">
                          <td className="p-3 font-bold text-amber-500 flex items-center gap-2">
                            <span>{gc.code}</span>
                            <button onClick={() => handleCopyToClipboard(gc.code)} className="p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white" title="Copy code">
                              <Copy size={11} />
                            </button>
                          </td>
                          <td className="p-3 text-slate-100 font-semibold">₹{gc.amount}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-300">{gc.used} / {gc.limit} claims</span>
                              <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#f0c040] h-full" style={{ width: `${(gc.used / gc.limit)*100}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-slate-400 text-[10px]">{gc.expiry}</td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDeleteGiftCode(gc.code)}
                              className="p-1 px-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/25 rounded-md text-[10px] font-bold uppercase cursor-pointer"
                            >
                              <Trash2 size={11} className="inline mr-1" /> Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 6: UPI QR CHANGE */}
          {activeTab === 'qr' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header block */}
              <div>
                <h2 className="text-xl md:text-2xl font-syne font-extrabold text-[#f0c040] uppercase tracking-wider">UPI merchant Gateway settings</h2>
                <p className="text-xs text-slate-400 mt-1">Configure active Merchant UPI payments address and upload official QR images shown to clients.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Configuration form block */}
                <form onSubmit={handleSaveQrConfig} className="lg:col-span-7 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 space-y-6">
                  <h3 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider mb-2 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <QrCode size={16} className="text-[#f0c040]" />
                    UPI Endpoint Parameter
                  </h3>

                  <div className="space-y-4 font-syne">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[#f0c040] mb-1.5">UPI/VPA Address (Merchant endpoint)*</label>
                      <input
                        type="text"
                        placeholder="e.g. securepay@gpay"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none font-dmmono focus:border-[#f0c040]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Merchant Account Name*</label>
                      <input
                        type="text"
                        placeholder="e.g. S.K. TRADING CORP"
                        value={editUpiName}
                        onChange={(e) => setEditUpiName(e.target.value)}
                        className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-[#f0c040]"
                        required
                      />
                    </div>

                    {/* QR Image Selection Box drag and drop */}
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Drag/Upload QR Payment Image</label>
                      <div className="border-2 border-dashed border-slate-800 hover:border-[#f0c040]/50 rounded-2xl p-6 bg-[#0a0a0f] transition text-center space-y-2 relative">
                        <Upload size={24} className="text-[#f0c040] mx-auto opacity-75" />
                        <div className="text-xs text-slate-400">
                          <span className="font-extrabold text-amber-500 hover:underline cursor-pointer">Click here to choose file</span> or drag image here
                        </div>
                        <span className="block text-[9px] text-slate-600">Supports JPEG, JPG or PNG formats only</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hindi warning notice box */}
                  <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-xl flex gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="block text-amber-400 text-xs font-bold font-syne uppercase tracking-wider">High Risk warning directive!</span>
                      <p className="text-[11px] text-slate-400 font-sans leading-relaxed mt-1">
                        "QR save karne ke baad turat live ho jayega" - Merchant credentials synchronized in state will immediately reflect visually across active checking-out simulated user devices client-side. Protect transaction VPA addresses accurately.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#f0c040] hover:bg-yellow-500 text-black font-black font-syne text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-yellow-600/20 active:scale-95 cursor-pointer"
                  >
                    Confirm & Save UPI Configuration
                  </button>
                </form>

                {/* Preview window panel on right */}
                <div className="lg:col-span-5 bg-[#12121e] border border-[#f0c040]/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-syne font-extrabold text-white uppercase tracking-wider mb-4">Client Checkout Preview Live</h3>
                    
                    <div className="bg-[#0a0a0f] rounded-2xl p-5 border border-slate-800 text-center space-y-5">
                      <span className="text-[9px] tracking-widest uppercase font-black text-slate-500 block">Scan QR Code To Pay</span>
                      
                      {/* Interactive preview image from file upload */}
                      <div className="aspect-square max-w-[200px] bg-[#12121e] border-2 border-slate-800 rounded-2xl p-3 mx-auto flex items-center justify-center">
                        {qrUploadPreview || upiQr.qrDataUrl ? (
                          <img 
                            src={qrUploadPreview || upiQr.qrDataUrl} 
                            alt="Preview merchant QR Code" 
                            className="w-full h-full object-contain rounded-lg"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <QrCode size={40} className="text-slate-600 animate-pulse" />
                        )}
                      </div>

                      <div className="space-y-1 text-center font-mono text-xs">
                        <div className="text-slate-300 font-sans font-bold uppercase">{editUpiName || upiQr.accountName}</div>
                        <div className="text-slate-500 text-[11px] select-all">{editUpiId || upiQr.upiId}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800 text-slate-500 font-syne text-[10px] leading-relaxed">
                    Client applications dynamically generate deep UPI links mapping payment configurations saved above to automate quick mobile wallets payments flows.
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODAL WINDOW OVERLAY FOR UPDATING MEMBER RECORD CARDS */}
      <AnimatePresence>
        {editingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#000]/70 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-[#12121e] border border-[#f0c040]/30 rounded-2xl p-6 max-w-md w-full relative space-y-5 shadow-2xl"
            >
              <button 
                onClick={() => setEditingUser(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg transition"
              >
                <X size={16} />
              </button>

              <div className="font-syne">
                <h3 className="text-base font-extrabold text-[#f0c040] uppercase tracking-wider flex items-center gap-2">
                  <Pencil size={15} /> Modify Player Wallet & Details
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Player ID reference code: {editingUser.id}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-syne">Registered Name</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 pr-4 py-2.5 text-xs text-slate-100 outline-none focus:border-[#f0c040]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 font-syne">Direct Wallet Balance (₹)</label>
                  <input
                    type="number"
                    value={editUserBalance}
                    onChange={(e) => setEditUserBalance(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0a0a0f] border border-slate-800 rounded-xl px-4 pr-4 py-2.5 text-xs text-slate-100 outline-none font-dmmono focus:border-[#f0c040]"
                  />
                </div>
              </div>

              <div className="flex gap-3 font-syne text-xs uppercase tracking-widest font-black pt-2">
                <button
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-3 text-center border border-slate-700 text-slate-300 rounded-xl hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  className="flex-1 py-3 text-center bg-gradient-to-r from-[#f0c040] to-yellow-600 text-black rounded-xl hover:brightness-110 transition active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanelView;
