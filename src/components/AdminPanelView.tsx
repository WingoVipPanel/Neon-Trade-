import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Settings, 
  Gamepad2, 
  Coins, 
  LogOut, 
  Menu,
  ChevronRight,
  Activity,
  MessageSquare,
  Users,
  Wallet,
  Gift
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp, runTransaction, collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
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
}

const AdminPanelView: React.FC<AdminPanelViewProps> = ({ onLogout, onToggleView }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [activeRoom, setActiveRoom] = useState('1m');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDepositsToday: 0,
    totalWithdrawalsToday: 0,
    activeUsers: 0,
  });
  const [pendingDeposits, setPendingDeposits] = useState<DepositRequest[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      let activeCount = 0;
      usersSnap.forEach((doc) => {
        const data = doc.data();
        if (data.lastLogin && data.lastLogin.toDate() > new Date(now.getTime() - 5 * 60 * 1000)) {
          activeCount++;
        }
      });
      
      const depositsSnap = await getDocs(query(collection(db, 'depositRequests'), where('status', '==', 'approved')));
      let depositsToday = 0;
      depositsSnap.forEach(doc => {
          const data = doc.data();
          if (data.updatedAt?.toDate() >= today) depositsToday += data.totalAmount;
      });

      setStats({
        totalUsers: usersSnap.size,
        totalDepositsToday: depositsToday,
        totalWithdrawalsToday: 0,
        activeUsers: activeCount
      });
    };
    fetchStats();

    // Subscribe to pending deposits
    const q = query(collection(db, 'depositRequests'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DepositRequest));
        setPendingDeposits(reqs);
    });
    return () => unsubscribe();
  }, [activeMenu]);

  const [processing, setProcessing] = useState<string | null>(null);

  const handleApproveDeposit = async (request: DepositRequest) => {
      setProcessing(request.id);
      try {
        await runTransaction(db, async (transaction) => {
            const depositReqRef = doc(db, 'depositRequests', request.id);
            const depositReq = await transaction.get(depositReqRef);
            if (!depositReq.exists() || depositReq.data().status !== 'pending') {
                throw "Request no longer pending";
            }
            
            const userDocRef = doc(db, 'users', request.userId);
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) throw "User does not exist";
            
            const currentBalance = userDoc.data().balance || 0;
            const totalCredit = request.amount * 1.19;
            transaction.update(userDocRef, { balance: currentBalance + totalCredit });
            transaction.update(depositReqRef, { status: 'approved', updatedAt: serverTimestamp() });
        });
        alert('Deposit approved successfully!');
      } catch (e) {
          console.error("Approval error:", e);
          alert('Failed to approve deposit: ' + (e as string));
      } finally {
          setProcessing(null);
      }
  };

  const handleRejectDeposit = async (request: DepositRequest) => {
      const reason = prompt('Reason for rejection:');
      if (!reason) return;
      await updateDoc(doc(db, 'depositRequests', request.id), { status: 'rejected', rejectionReason: reason, updatedAt: serverTimestamp() });
      alert('Deposit rejected!');
  };

  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { name: 'Users', icon: <Users size={20} /> },
    { name: 'Deposits', icon: <Wallet size={20} /> },
    { name: 'Withdrawals', icon: <Coins size={20} /> },
    { name: 'WinGo', icon: <Gamepad2 size={20} />, subItems: ROOMS.map(r => `WinGo ${r}`) },
    { name: 'Gifts', icon: <Gift size={20} /> },
    { name: 'Support', icon: <MessageSquare size={20} /> },
    { name: 'Settings', icon: <Settings size={20} /> },
  ];

  const dashboardContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
            <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
            <p className="text-3xl font-bold tracking-tight">{stats.totalUsers}</p>
        </div>
        <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
            <h3 className="text-gray-400 text-sm mb-1">Today Deposit</h3>
            <p className="text-3xl font-bold tracking-tight text-emerald-400">₹{stats.totalDepositsToday.toFixed(2)}</p>
        </div>
        <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
            <h3 className="text-gray-400 text-sm mb-1">Today Withdrawal</h3>
            <p className="text-3xl font-bold tracking-tight text-red-400">₹{stats.totalWithdrawalsToday.toFixed(2)}</p>
        </div>
        <div className="bg-[#121212]/50 backdrop-blur-md p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all">
            <h3 className="text-gray-400 text-sm mb-1">Active Users</h3>
            <p className="text-3xl font-bold tracking-tight text-blue-400">{stats.activeUsers}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col md:flex-row">
      <header className="md:hidden sticky top-0 z-50 bg-[#121212]/80 backdrop-blur-md border-b border-white/10 p-4 flex items-center justify-between">
        <h1 className="font-bold text-lg tracking-tight">Admin<span className="text-blue-500">Panel</span></h1>
        <div className="flex items-center gap-2">
          {onToggleView && (
            <button 
              onClick={onToggleView}
              className="px-3 py-1.5 bg-emerald-600/20 text-emerald-400 rounded-lg border border-emerald-500/30 text-xs font-bold transition hover:bg-emerald-600/30"
            >
              Go to Game
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-white/5 rounded-lg border border-white/10">
            <Menu size={20} />
          </button>
        </div>
      </header>

      <aside className={`fixed inset-y-0 left-0 z-40 bg-[#121212]/90 backdrop-blur-xl border-r border-white/10 w-64 p-6 transition-transform md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static`}>
        <div className="mb-8 p-4 bg-blue-600/10 rounded-2xl border border-blue-500/20">
          <p className="font-bold">Super Admin</p>
          <p className="text-xs text-blue-400">Control Center</p>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
               key={item.name}
               onClick={() => { setActiveMenu(item.name); setIsSidebarOpen(false); }}
               className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeMenu === item.name ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              {item.icon}
              <span className="font-medium text-sm">{item.name}</span>
            </button>
          ))}
        </nav>

        {onToggleView && (
          <button 
            onClick={onToggleView}
            className="absolute bottom-24 left-6 right-6 flex items-center gap-4 px-4 py-3 text-emerald-400 hover:bg-emerald-950/30 border border-emerald-500/20 rounded-xl transition-all"
          >
            <Gamepad2 size={18} />
            <span className="font-medium text-sm">Go to Game/User View</span>
          </button>
        )}

        <button 
          onClick={onLogout}
          className="absolute bottom-10 left-6 right-6 flex items-center gap-4 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-all"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Exit Admin</span>
        </button>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="mb-8">
            <h2 className="text-2xl font-bold">{activeMenu}</h2>
            <p className="text-gray-500 text-sm">Overview of {activeMenu.toLowerCase()} activity.</p>
        </div>

        {activeMenu === 'Dashboard' && dashboardContent}
        {activeMenu === 'Deposits' && (
          <div className="bg-[#121212]/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
            <div className="p-6 border-b border-white/10">
                <h3 className="font-bold text-lg">Pending Deposits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 text-xs uppercase border-b border-white/10">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">UTR</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendingDeposits.map(req => (
                    <tr key={req.id} className="border-b border-white/5">
                      <td className="p-4">{req.userId}</td>
                      <td className="p-4 text-emerald-400">₹{req.totalAmount.toFixed(2)}</td>
                      <td className="p-4 font-mono">{req.utr}</td>
                      <td className="p-4 flex gap-2">
                        <button 
                            disabled={processing === req.id}
                            onClick={() => handleApproveDeposit(req)} 
                            className={`px-3 py-1 rounded text-xs ${processing === req.id ? 'bg-gray-600' : 'bg-emerald-600'}`}
                        >
                            {processing === req.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button onClick={() => handleRejectDeposit(req)} className="bg-red-600 px-3 py-1 rounded text-xs">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelView;
