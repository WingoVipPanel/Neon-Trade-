import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, RefreshCw, Copy, X, Wallet, CreditCard, ScanLine, Landmark, ChevronRight, FileText, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth, onAuthStateChanged } from '../lib/firebase';
import { doc, serverTimestamp, addDoc, collection, getDoc, query, where, orderBy, onSnapshot, updateDoc } from 'firebase/firestore';
import SupportChat from './SupportChat';

interface WithdrawScreenProps {
  onClose: () => void;
  balance: number;
  onRefresh: () => void;
  onAddNotification?: (notif: { titleEn: string, titleHi: string, contentEn: string, contentHi: string, type: string }) => void;
  selectedLang?: 'en' | 'hi';
}

export default function WithdrawScreen({ onClose, balance, onRefresh, onAddNotification, selectedLang = 'en' }: WithdrawScreenProps) {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  const [showBindModal, setShowBindModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'UPI' | 'Bank'>('UPI');
  const [showToast, setShowToast] = useState(false);
  const [totalDeposits, setTotalDeposits] = useState<number>(0);
  const [hasWonOver4000, setHasWonOver4000] = useState<boolean>(false);
  const [showHighWinWarning, setShowHighWinWarning] = useState(false);

  // Real-time withdrawals history list
  const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);

  // Ref for scrolling down to history section
  const historyRef = useRef<HTMLDivElement>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    
    const unsub = onSnapshot(doc(db, 'users', currentUser.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setPaymentMethod(data.paymentMethod || null);
        setTotalDeposits(parseFloat(data.totalDeposits || '0'));
        const wonOver = data.hasWonOver4000 === true;
        setHasWonOver4000(wonOver);
        
        // Auto flag hasWonOver4000 if balance is currently > 4000
        const currentBal = parseFloat(data.balance || '0');
        if (currentBal > 4000 && !wonOver) {
          updateDoc(doc(db, 'users', currentUser.uid), {
            hasWonOver4000: true
          }).catch(err => console.warn("Failed to set hasWonOver4000 flag:", err));
        }
      }
    });

    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const phone = localStorage.getItem('userPhone');
    const targetUserId = currentUser?.uid || phone;
    if (!targetUserId) return;

    // Fetch user's withdraw requests in real time
    const q = query(
      collection(db, 'withdrawRequests'),
      where('userId', '==', targetUserId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyList: any[] = [];
      snapshot.forEach((doc) => {
        historyList.push({ id: doc.id, ...doc.data() });
      });
      setWithdrawHistory(historyList);
    }, (err) => {
      console.warn("Error fetching, falling back...", err);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const scrollToHistory = () => {
    historyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleRefreshClick = () => {
    onRefresh();
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 1500);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    if (val === '') {
      setError('');
    } else if (num < 110) {
      setError('Min withdrawal is ₹110');
    } else if (num > balance) {
      setError('Insufficient balance');
    } else if (hasWonOver4000 || ((balance > 4000 || num > 4000) && totalDeposits < 2000)) {
      setError(selectedLang === 'en' 
        ? '⚠️ High Win Restriction: Winning amount is too high, and deposit is too low! Please deposit ₹2,000 first.' 
        : '⚠️ निकासी सीमा: आपका विनिंग अमाउंट बहुत ज्यादा है और डिपॉजिट बहुत कम है! कृपया पहले ₹2,000 डिपॉजिट करें।'
      );
    } else {
      setError('');
    }
  };

  const handleWithdrawSubmit = async () => {
    const withdrawNum = parseFloat(amount || '0');
    if (isNaN(withdrawNum) || withdrawNum < 110 || withdrawNum > balance) {
        setError('Invalid amount');
        return;
    }

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const currentBal = parseFloat(data.balance || '0');
          const hasWonOver4000 = data.hasWonOver4000 || false;
          const userTotalDeps = parseFloat(data.totalDeposits || '0');
          
          if (hasWonOver4000 || ((currentBal > 4000 || withdrawNum > 4000) && userTotalDeps < 2000)) {
            setShowHighWinWarning(true);
            setError(selectedLang === 'en' 
              ? '⚠️ High Win Restriction: Winning amount is too high, and deposit is too low! Please deposit ₹2,000 first.' 
              : '⚠️ निकासी सीमा: आपका विनिंग अमाउंट बहुत ज्यादा है और डिपॉजिट बहुत कम है! कृपया पहले ₹2,000 डिपॉजिट करें।'
            );
            return;
          }
        }
      } catch (e) {
        console.error("High win verification check failed:", e);
      }
    }

    if (!paymentMethod) {
       alert("Please bind a payment method first");
       setShowBindModal(true);
       return;
    }
    
    // Create pending withdraw request
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      try {
        let nickname = 'User';
        let avatar = '';
        let uid = '';
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            nickname = userDoc.data().nickname || 'User';
            avatar = userDoc.data().avatar || '';
            uid = userDoc.data().uid || '';
            
            const currentBalance = parseFloat(userDoc.data().balance || '0');
            if (currentBalance < withdrawNum) {
              setError(selectedLang === 'en' ? 'Insufficient balance' : 'अपर्याप्त शेष राशि');
              return;
            }
            
            await updateDoc(userDocRef, {
              balance: Math.max(0, currentBalance - withdrawNum),
              updatedAt: serverTimestamp()
            });
          }
        }

        await addDoc(collection(db, 'withdrawRequests'), {
          userId: user?.uid || savedPhone,
          phone: savedPhone,
          nickname: nickname,
          avatar: avatar,
          uid: uid || savedPhone,
          amount: withdrawNum,
          methodType: paymentMethod.type,
          methodDetails: paymentMethod.type === 'UPI' ? paymentMethod.upiId : paymentMethod.cardNumber,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        // Add local balance history record
        const identifier = user?.uid || savedPhone;
        if (identifier) {
          const existingStr = localStorage.getItem('balance_records_' + identifier);
          let records: any[] = [];
          if (existingStr) {
            try {
              records = JSON.parse(existingStr);
            } catch (_) {}
          }

          const d = new Date();
          const displayTimestamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

          const newRecord = {
            id: 'rec_' + Date.now() + '_' + Math.random().toString(36).substring(4),
            type: 'withdraw',
            titleEn: `Withdrawal request of ₹ ${withdrawNum.toFixed(2)} pending audit`,
            titleHi: `₹ ${withdrawNum.toFixed(2)} निकासी अनुरोध समीक्षा के अधीन`,
            amount: withdrawNum,
            status: 'success',
            date: displayTimestamp
          };

          records.unshift(newRecord);
          localStorage.setItem('balance_records_' + identifier, JSON.stringify(records.slice(0, 100)));
        }
        
        onRefresh(); // Trigger parent refresh
        
        if (onAddNotification) {
          onAddNotification({
            titleEn: 'WITHDRAWAL REQUEST',
            titleHi: 'निकासी अनुरोध',
            contentEn: `Your withdrawal request of ₹ ${withdrawNum.toFixed(2)} has been sent. Please wait for audit.`,
            contentHi: `आपका ₹ ${withdrawNum.toFixed(2)} का निकासी अनुरोध भेज दिया गया है। कृपया ऑडिट की प्रतीक्षा करें।`,
            type: 'withdraw_request'
          });
        }

        alert('Withdrawal request submitted! Please wait for admin approval.');
        setAmount('');
      } catch (e) {
        console.error('Withdrawal request error:', e);
        alert('Failed to submit withdrawal request.');
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    let date: Date;
    if (typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const isHighWinRestricted = hasWonOver4000 || ((balance > 4000 || parseFloat(amount || '0') > 4000) && totalDeposits < 2000);
  const isButtonDisabled = !amount || parseFloat(amount) < 110 || (!!error && !isHighWinRestricted);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto w-full min-h-screen font-sans flex flex-col mx-auto max-w-[410px] bg-[#2c1012]">
      
      {/* Header */}
      <div className="sticky top-0 w-full h-[48px] bg-[#3d0f10] border-b border-white/5 flex items-center px-3 z-20 shadow-md">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-start text-white cursor-pointer active:scale-90 transition-transform">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center text-white font-medium text-[16px] tracking-wide ml-2">Withdraw</div>
        <button onClick={scrollToHistory} className="text-white/90 text-[13px] font-medium whitespace-nowrap active:scale-95 transition-transform hover:text-white">
          Withdrawal history
        </button>
      </div>

      <div className="px-4 py-4 flex-1">
        
        {/* Balance Card */}
        <div className="rounded-[12px] px-3.5 py-3 mb-4 shadow-sm relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #FFCB15 0%, #FF9700 100%)' }}>
          {/* Subtle background decoration curves */}
          <div className="absolute top-[-40%] right-[-10%] w-[200px] h-[200px] rounded-full border-[20px] border-white/10 pointer-events-none"></div>
          <div className="absolute top-[-10%] right-[-25%] w-[250px] h-[250px] rounded-full border-[24px] border-[#FF8A00]/10 pointer-events-none"></div>
          
          <div className="flex justify-between items-center z-10 relative">
            <div className="flex items-center text-[#4A1500] text-[14px] font-medium gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="5" width="20" height="14" rx="3" fill="#FF7043"/>
                <path d="M2 8C2 6.34315 3.34315 5 5 5H10V19H5C3.34315 19 2 17.6569 2 16V8Z" fill="#FF5722"/>
                <rect x="16" y="9" width="7" height="6" rx="2" fill="#FFC107"/>
                <circle cx="19.5" cy="12" r="1.5" fill="#FFF3E0"/>
              </svg>
              Available balance
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-2 z-10 relative">
            <span className="text-[#331100] text-[30px] font-bold leading-none tracking-tight flex items-center">
              ₹{balance.toFixed(2)}
            </span>
            <button onClick={handleRefreshClick} className="p-1 hover:bg-black/10 rounded-full transition-colors active:scale-90">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/90">
                <path d="M19 8.5H9C7.34315 8.5 6 9.84315 6 11.5M6 15.5H16C17.6569 15.5 19 14.1569 19 12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M15.5 5L19 8.5L15.5 12M8.5 19L5 15.5L8.5 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <div className="flex items-center justify-between mt-5 z-10 relative text-[#331100]">
             <svg width="34" height="24" viewBox="0 0 34 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-90 drop-shadow-sm">
                <rect width="34" height="24" rx="4" fill="#FFEBB7"/>
                <path d="M11 0V24" stroke="#DCAE46" strokeWidth="1"/>
                <path d="M23 0V24" stroke="#DCAE46" strokeWidth="1"/>
                <path d="M0 7H11" stroke="#DCAE46" strokeWidth="1"/>
                <path d="M0 16H11" stroke="#DCAE46" strokeWidth="1"/>
                <path d="M23 7H34" stroke="#DCAE46" strokeWidth="1"/>
                <path d="M23 16H34" stroke="#DCAE46" strokeWidth="1"/>
                <rect x="14" y="6" width="6" height="12" rx="1.5" stroke="#DCAE46" strokeWidth="1"/>
             </svg>
            <span className="font-mono text-[16px] tracking-[0.2em] font-bold opacity-90 mt-1">**** ****</span>
          </div>
        </div>

        {/* Withdrawal Method Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            onClick={() => setActiveTab('UPI')} 
            className={`flex flex-col items-center justify-center py-3 rounded-[10px] cursor-pointer shadow-sm transition-all active:scale-95 ${
              activeTab === 'UPI' 
                ? 'bg-[#FFD700] text-[#2c1012] scale-[1.02]' 
                : 'bg-[#3d0f10] border border-[#FFD700]/10 text-[#FFD700]/60 hover:bg-[#4a1315]/80'
            }`}
          >
             <ScanLine className="h-6 w-6 mb-1.5 stroke-[1.5]" />
             <span className="font-bold text-[13px]">UPI</span>
          </div>
          <div 
            onClick={() => setActiveTab('Bank')} 
            className={`flex flex-col items-center justify-center py-3 rounded-[10px] cursor-pointer shadow-sm transition-all active:scale-95 ${
              activeTab === 'Bank' 
                ? 'bg-[#FFD700] text-[#2c1012] scale-[1.02]' 
                : 'bg-[#3d0f10] border border-[#FFD700]/10 text-[#FFD700]/60 hover:bg-[#4a1315]/80'
            }`}
          >
             <Landmark className="h-6 w-6 mb-1.5 stroke-[1.5]" />
             <span className="font-bold text-[13px]">BANK CARD</span>
          </div>
        </div>

        {/* Account Selection Box */}
        <div 
          onClick={() => setShowBindModal(true)} 
          className="flex items-center justify-between bg-[#3d0f10] border border-[#FFD700]/10 py-3 px-4 rounded-[10px] mb-4 shadow-sm cursor-pointer hover:bg-[#4a1315] transition-colors active:scale-95"
        >
          <div className="flex items-center gap-3 border-r border-[#FFD700]/20 pr-3 h-[24px]">
            {activeTab === 'Bank' ? (
              <Landmark className="text-[#FFD700] h-5 w-5" />
            ) : (
              <ScanLine className="text-[#FFD700] h-5 w-5" />
            )}
            <span className="text-white/70 text-[12px] font-medium min-w-[60px]">
              {paymentMethod && paymentMethod.type === activeTab 
                ? (activeTab === 'Bank' ? 'Bank Card' : 'UPI')
                : (activeTab === 'Bank' ? 'Bank Card' : 'UPI')
              }
            </span>
          </div>
          <div className="flex-1 px-3 text-white font-mono text-[13px] truncate">
            {paymentMethod && paymentMethod.type === activeTab 
              ? (activeTab === 'Bank' ? paymentMethod.cardNumber : paymentMethod.upiId) 
              : <span className="text-white/40 italic font-sans text-[12px]">Add {activeTab} Account</span>
            }
          </div>
          <ChevronRight className="h-4 w-4 text-white/40 shrink-0" />
        </div>
        
        {/* Withdrawal Form Card */}
        <div className="bg-[#3d0f10] border border-[#FFD700]/5 rounded-[12px] p-4 mb-4 shadow-md">
          {/* Amount Input */}
          <div className="flex items-center bg-[#2c1012] border border-[#FFD700]/10 rounded-[10px] px-3 py-2 h-[46px] mb-3">
            <span className="text-[#FFD700] text-[18px] font-black mr-2 shadow-sm drop-shadow">₹</span>
            <input 
              type="number"
              placeholder="Please enter the amount"
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/30 font-medium text-[14px]"
              value={amount}
              onChange={e => handleAmountChange(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-[12px] mb-2">
            <span className="text-white/60">Withdrawable balance <span className="text-[#FFD700] font-bold ml-1">₹{balance.toFixed(2)}</span></span>
            <button onClick={() => { setAmount(balance.toString()); setError(''); }} className="border border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-[#2c1012] transition-colors rounded-full px-3 py-0.5 font-semibold text-[11px] active:scale-95 cursor-pointer">
              All
            </button>
          </div>
          <div className="flex items-center justify-between text-[12px] mb-4">
            <span className="text-white/60">Withdrawal amount received</span>
            <span className="text-[#FFD700] font-bold text-[13px]">₹{(amount ? Math.max(0, parseFloat(amount)) : 0).toFixed(2)}</span>
          </div>
          
          {error && !isHighWinRestricted && <div className="text-[#FF4148] text-[11px] -mt-2 mb-3 font-medium text-center">{error}</div>}

          {/* High Win & Low Deposit Warning Alert Banner */}
          {isHighWinRestricted && (
            <div className="bg-[#FF4148]/10 border border-[#FF4148]/30 rounded-[12px] p-3.5 mb-4 text-left">
              <div className="flex items-start gap-2">
                <span className="text-rose-500 text-lg mt-0.5">⚠️</span>
                <div>
                  <h4 className="text-rose-400 font-extrabold text-[12px] uppercase tracking-wide">
                    Security Notice / महत्वपूर्ण सूचना
                  </h4>
                  <p className="text-white/95 text-[11.5px] mt-1 leading-relaxed font-semibold">
                    Dear user, your winning amount is too high but your deposit is very low. You cannot process this withdrawal. Please complete a deposit of ₹2,000 first to verify your account and release your winnings.
                  </p>
                  <p className="text-[#FFD700] text-[11.5px] mt-1.5 leading-relaxed font-bold font-sans">
                    प्रिय उपयोगकर्ता, आपका विनिंग अमाउंट बहुत ज्यादा है लेकिन डिपॉजिट बहुत कम है। आप इस पैसे को अभी विथड्रॉ नहीं कर सकते। कृपया विथड्रॉवल को चालू करने के लिए पहले ₹2,000 डिपाजिट करें।
                  </p>
                </div>
              </div>
            </div>
          )}

          <button 
            onClick={handleWithdrawSubmit} 
            disabled={isButtonDisabled}
            className={`w-full py-3 rounded-full font-bold text-[14px] tracking-wide shadow-md transition-all active:scale-95 cursor-pointer ${
              !isButtonDisabled
                ? 'bg-gradient-to-r from-[#FFC107] to-[#FFD700] text-[#2c1012] shadow-[0_3px_10px_rgba(255,215,0,0.3)] hover:brightness-110' 
                : 'bg-[#2c1012] text-white/30 cursor-not-allowed'
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Withdrawal Rules */}
        <div className="bg-[#3d0f10] rounded-[12px] p-4 mb-6 border border-white/[0.03] shadow-sm">
          <ul className="space-y-2.5 text-[11.5px] text-white/60 leading-snug">
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>Need to bet <span className="text-[#FF4148] font-bold">₹0.00</span> to be able to withdraw</span>
            </li>
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>Withdraw time <span className="text-[#FF4148] font-bold">00:00-23:59</span></span>
            </li>
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>Inday Remaining Withdrawal Times <span className="text-[#FF4148] font-bold">3</span></span>
            </li>
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>Withdrawal amount range <span className="text-[#FF4148] font-bold">₹110.00-₹50,000.00</span></span>
            </li>
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>Please confirm your beneficial account information before withdrawing. If your information is incorrect, our company will not be liable for the amount of loss</span>
            </li>
            <li className="flex items-start gap-2.5">
               <span className="text-[#FFD700] text-[10px] mt-1 shrink-0">◆</span>
               <span>If your beneficial information is incorrect, please contact customer service</span>
            </li>
          </ul>
        </div>

        {/* Withdrawal history Section */}
        <div ref={historyRef} className="flex items-center gap-3 mb-6 relative z-10">
          <div className="bg-[#FFD700] rounded p-1 shadow-sm">
            <FileText className="w-5 h-5 text-[#2c1012]" />
          </div>
          <h3 className="text-white font-bold text-[17px] tracking-wide">Withdrawal history</h3>
        </div>

        {withdrawHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 opacity-70">
             <div className="w-32 h-32 mb-4 bg-white/5 rounded-full flex items-center justify-center relative inner-shadow">
               <FileText className="h-12 w-12 text-white/20" />
             </div>
             <span className="text-white/50 font-medium text-[13px] tracking-wide">No data</span>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawHistory.slice(0, 5).map((item) => {
              const isPending = item.status === 'pending';
              const isRejected = item.status === 'rejected';
              let statusText = isPending ? 'Processing' : (isRejected ? 'Rejected' : 'Completed');
              let statusColor = isPending ? 'text-[#FFD700]' : (isRejected ? 'text-[#FF4148]' : 'text-emerald-400');

              return (
                <div key={item.id} className="relative bg-[#3d0f10] rounded-[16px] p-5 shadow-md flex flex-col space-y-3.5 text-left border border-white/[0.02]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#FFD700]/10">
                    <span className="inline-flex items-center px-3 py-1 text-[11px] font-black tracking-wider uppercase bg-[#FF4148] text-white rounded-md shadow-sm">
                      Withdraw
                    </span>
                    <span className={`text-[13.5px] font-bold tracking-wider ${statusColor}`}>{statusText}</span>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/60 font-medium tracking-wide">Balance</span>
                      <span className="text-[#FFD700] font-black text-[15px] drop-shadow-sm">₹{Number(item.amount).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/60 font-medium tracking-wide">Type</span>
                      <span className="text-white/90 font-medium">{item.methodType || 'UPI'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/60 font-medium tracking-wide">Time</span>
                      <span className="text-white/80 font-mono text-[12px]">{formatDate(item.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[13px]">
                      <span className="text-white/60 font-medium tracking-wide">Order number</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-white/80 font-mono text-[11.5px]">{'WD' + item.id.slice(0, 16).toUpperCase()}</span>
                        <Copy className="h-[14px] w-[14px] text-white/50 cursor-pointer hover:text-white transition-colors" onClick={() => copyToClipboard('WD' + item.id.slice(0, 16).toUpperCase())} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-6 mb-16">
           <button 
             onClick={() => { /* Navigate to a full history screen if it existed */ }} 
             className="w-full h-[40px] border border-[#FFD700] rounded-full flex items-center justify-center text-[#FFD700] font-medium text-[15px] active:scale-95 transition-all cursor-pointer"
           >
             All history
           </button>
        </div>

      </div>

      {/* Floating Chat Icon mapped to screenshot design */}
      <div className="fixed bottom-24 right-5 z-40">
        <button 
          onClick={() => setShowChat(true)} 
          className="bg-white rounded-full p-2.5 shadow-xl shadow-black/40 border-[3px] border-[#FFC107] active:scale-90 transition-transform cursor-pointer relative"
        >
           <MessageCircle className="h-9 w-9 text-[#FFC107] fill-current" />
           <span className="absolute top-0 right-0 w-3 h-3 bg-[#FF4148] border-2 border-white rounded-full"></span>
        </button>
      </div>

      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] bg-black/80 backdrop-blur-md rounded-[12px] p-5 flex flex-col items-center justify-center shadow-lg z-[100]"
          >
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <span className="text-white font-medium text-[14px] text-center leading-snug">Refresh<br/>successfully</span>
          </motion.div>
        )}
        {showChat && (
          <SupportChat onClose={() => setShowChat(false)} />
        )}
        {showBindModal && (
          <BindMethodModal 
            onClose={() => setShowBindModal(false)}
            initialMethod={paymentMethod}
            requestedTab={activeTab}
          />
        )}
        {showHighWinWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[999]"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#2c1012] border border-[#FFD700]/30 rounded-[20px] p-6 max-w-[340px] w-full text-center shadow-2xl relative"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setShowHighWinWarning(false)} 
                  className="text-white/40 hover:text-white transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Icon */}
              <div className="w-16 h-16 bg-[#FF4148]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF4148]/30">
                <span className="text-3xl animate-bounce">⚠️</span>
              </div>

              <h3 className="text-[#FF4148] font-black text-[17px] tracking-tight mb-2.5">
                ⚠️ Security Notice / सुरक्षा नोटिस
              </h3>

              <div className="space-y-3.5 text-left bg-black/25 p-4 rounded-xl border border-white/5 mb-5">
                <p className="text-white/95 text-[11.5px] font-semibold leading-relaxed">
                  Dear user, your winning amount is too high but your deposit is very low. You cannot process this withdrawal. Please complete a deposit of ₹2,000 first to verify your account and release your winnings.
                </p>
                <div className="border-t border-white/10 my-1 pt-1"></div>
                <p className="text-[#FFD700] text-[11.5px] font-bold leading-relaxed">
                  प्रिय उपयोगकर्ता, आपका विनिंग अमाउंट बहुत ज्यादा है लेकिन डिपॉजिट बहुत कम है। आप इस पैसे को अभी विथड्रॉ नहीं कर सकते। कृपया विथड्रॉवल को चालू करने के लिए पहले ₹2,000 डिपाजिट करें।
                </p>
                
                <div className="border-t border-white/10 pt-2.5 flex justify-between text-[11px] font-bold">
                  <span className="text-white/50">Current Balance:</span>
                  <span className="text-[#FFD700]">₹{balance.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-white/50">Your Total Deposit:</span>
                  <span className="text-[#FF4148]">₹{totalDeposits.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[11px] font-bold border-t border-white/5 pt-2.5">
                  <span className="text-white/50">Required Total Deposit:</span>
                  <span className="text-emerald-400">₹2,000.00</span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setShowHighWinWarning(false);
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-[#FFC107] to-[#FFD700] hover:brightness-110 active:scale-95 transition-all text-[#2c1012] py-3 rounded-full font-black text-[12px] shadow-[0_4px_12px_rgba(255,215,0,0.25)] cursor-pointer"
                >
                  Deposit ₹2,000 Now / अभी ₹2,000 डिपॉजिट करें
                </button>
                
                <button
                  onClick={() => setShowHighWinWarning(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white/70 py-2.5 rounded-full font-bold text-[11px] active:scale-95 transition-all cursor-pointer"
                >
                  Cancel / रद्द करें
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BindMethodModal({ onClose, initialMethod, requestedTab }: any) {
  const [methodType, setMethodType] = useState(requestedTab || 'Bank');
  const [upiId, setUpiId] = useState(initialMethod?.type === 'UPI' ? initialMethod?.upiId : '');
  const [bankName, setBankName] = useState(initialMethod?.type === 'Bank' ? initialMethod?.bankName : '');
  const [recipientName, setRecipientName] = useState(initialMethod?.recipientName || '');
  const [accountNumber, setAccountNumber] = useState(initialMethod?.type === 'Bank' ? initialMethod?.cardNumber : '');
  const [phone, setPhone] = useState(initialMethod?.phone || '');
  const [ifsc, setIfsc] = useState(initialMethod?.ifsc || '');

  const [isSelectingBank, setIsSelectingBank] = useState(false);
  const [searchBank, setSearchBank] = useState('');

  const banks = [
    "State Bank of India", "Punjab National Bank", "Bank of Baroda", "Canara Bank", 
    "Union Bank of India", "Indian Bank", "Bank of India", "Central Bank of India", 
    "Indian Overseas Bank", "UCO Bank", "Bank of Maharashtra", "Punjab & Sind Bank", 
    "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "IndusInd Bank", 
    "Yes Bank", "IDFC FIRST Bank", "Federal Bank", "South Indian Bank", "Karnataka Bank", 
    "Karur Vysya Bank", "City Union Bank", "Tamilnad Mercantile Bank", "RBL Bank", 
    "DCB Bank", "CSB Bank", "Bandhan Bank", "Dhanlaxmi Bank", "Jammu & Kashmir Bank", 
    "Nainital Bank", "IDBI Bank", "AU Small Finance Bank", "Ujjivan Small Finance Bank", 
    "Equitas Small Finance Bank", "Jana Small Finance Bank", "ESAF Small Finance Bank", 
    "Suryoday Small Finance Bank", "Utkarsh Small Finance Bank", "Capital Small Finance Bank", 
    "North East Small Finance Bank", "Unity Small Finance Bank", "Shivalik Small Finance Bank", 
    "India Post Payments Bank", "Airtel Payments Bank", "Fino Payments Bank", "Jio Payments Bank", 
    "NSDL Payments Bank", "Paytm Payments Bank", "HSBC", "Standard Chartered Bank", 
    "Citibank", "Deutsche Bank", "Barclays Bank", "Bank of America", "JPMorgan Chase Bank", 
    "BNP Paribas", "Credit Agricole", "DBS Bank India", "Mizuho Bank", "MUFG Bank", 
    "Sumitomo Mitsui Banking Corporation", "Bank of Ceylon", "Bank of Bahrain & Kuwait", 
    "Doha Bank", "First Abu Dhabi Bank", "Mashreq Bank", "Emirates NBD", "Qatar National Bank", 
    "Industrial and Commercial Bank of China", "China Construction Bank", "Krung Thai Bank", 
    "Shinhan Bank", "Woori Bank", "KEB Hana Bank", "CTBC Bank", "Taiwan Cooperative Bank", 
    "United Overseas Bank", "OCBC Bank", "ANZ Bank", "Commonwealth Bank of Australia", 
    "Societe Generale", "NatWest Markets", "Credit Suisse", "UBS", "American Express Banking Corp", 
    "State Bank of Mauritius", "Sonali Bank", "Habib Bank AG Zurich", "Andhra Pradesh Grameena Vikas Bank", 
    "Andhra Pragathi Grameena Bank", "Arunachal Pradesh Rural Bank", "Assam Gramin Vikash Bank", 
    "Bangiya Gramin Vikash Bank", "Baroda UP Bank", "Baroda Rajasthan Kshetriya Gramin Bank", 
    "Chaitanya Godavari Grameena Bank", "Dakshin Bihar Gramin Bank", "Ellaquai Dehati Bank", 
    "Himachal Pradesh Gramin Bank", "J&K Grameen Bank", "Jharkhand Rajya Gramin Bank", 
    "Karnataka Gramin Bank", "Karnataka Vikas Grameena Bank", "Kerala Gramin Bank", 
    "Madhya Pradesh Gramin Bank", "Madhyanchal Gramin Bank", "Maharashtra Gramin Bank", 
    "Manipur Rural Bank", "Meghalaya Rural Bank", "Mizoram Rural Bank", "Nagaland Rural Bank", 
    "Odisha Gramya Bank", "Paschim Banga Gramin Bank", "Punjab Gramin Bank", "Rajasthan Marudhara Gramin Bank", 
    "Saptagiri Grameena Bank", "Sarva Haryana Gramin Bank", "Tamil Nadu Grama Bank", 
    "Telangana Grameena Bank", "Tripura Gramin Bank", "Utkal Grameen Bank", "Uttarbanga Kshetriya Gramin Bank", 
    "Uttarakhand Gramin Bank", "Uttar Bihar Gramin Bank", "Vidharbha Konkan Gramin Bank", 
    "Chhattisgarh Rajya Gramin Bank", "Saraswat Co-operative Bank", "Cosmos Co-operative Bank", 
    "Shamrao Vithal Co-operative Bank", "Abhyudaya Co-operative Bank", "Bharat Co-operative Bank", 
    "Janata Sahakari Bank", "NKGSB Co-operative Bank", "TJSB Sahakari Bank", "Kalupur Commercial Co-operative Bank", 
    "Mehsana Urban Co-operative Bank", "Rajkot Nagarik Sahakari Bank", "Ahmedabad Mercantile Co-operative Bank", 
    "Thane Bharat Sahakari Bank", "Apna Sahakari Bank", "Citizen Credit Co-operative Bank", 
    "Punjab State Cooperative Bank", "Haryana State Cooperative Apex Bank", "Gujarat State Cooperative Bank", 
    "Maharashtra State Cooperative Bank", "Kerala State Cooperative Bank", "Odisha State Cooperative Bank", 
    "Karnataka State Cooperative Apex Bank", "Tamil Nadu State Apex Cooperative Bank", 
    "Uttar Pradesh Cooperative Bank", "Rajasthan State Cooperative Bank", "Bihar State Cooperative Bank", 
    "Madhya Pradesh Rajya Sahakari Bank"
  ];

  const filteredBanks = banks.filter(b => b.toLowerCase().includes(searchBank.toLowerCase()));

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const data = methodType === 'UPI' 
        ? { type: 'UPI', upiId, recipientName, phone }
        : { type: 'Bank', bankName, cardNumber: accountNumber, recipientName, phone, ifsc };
        
      await updateDoc(doc(db, 'users', user.uid), {
        paymentMethod: data
      });
      alert('Method saved');
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to save');
    }
  };

  if (isSelectingBank) {
    return (
      <div className="fixed inset-0 z-[70] bg-[#3d0f10] font-sans flex flex-col mx-auto max-w-[410px]">
        <div className="sticky top-0 w-full h-[48px] bg-[#3d0f10] flex items-center px-3 z-20">
          <button onClick={() => setIsSelectingBank(false)} className="h-10 w-10 flex items-center justify-start text-white cursor-pointer active:scale-90 transition-transform">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 text-center text-white font-medium text-[16px] tracking-wide -ml-2">Choose a bank</div>
        </div>
        
        <div className="px-4 py-2 border-b border-[#3d0f10]">
          <div className="flex items-center gap-2 text-white/50 mb-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFC107" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search bank" 
              value={searchBank}
              onChange={(e) => setSearchBank(e.target.value)}
              className="bg-transparent border-none outline-none text-[#FFD700] placeholder:text-white/40 text-[14px] font-medium w-full"
            />
          </div>
          <div className="text-white/60 text-[13px]">Choose a bank</div>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {filteredBanks.map((bank, i) => (
            <div 
              key={i} 
              onClick={() => { setBankName(bank); setIsSelectingBank(false); }}
              className="py-3 border-b border-white/5 text-white/80 font-medium text-[14px] active:bg-white/5 cursor-pointer"
            >
              {bank}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-0 z-[60] bg-[#3d0f10] font-sans flex flex-col mx-auto max-w-[410px]">
      <div className="sticky top-0 w-full h-[48px] bg-[#3d0f10] flex items-center px-3 z-20">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-start text-white cursor-pointer active:scale-90 transition-transform">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 text-center text-white font-medium text-[16px] tracking-wide -ml-2">
          {methodType === 'Bank' ? 'Add a bank account number' : 'Add UPI method'}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="bg-[#3d0f10] rounded-[8px] py-2 px-2.5 flex items-center gap-1.5 border border-[#FF4148]/20 mb-4 overflow-hidden">
          <svg className="w-3.5 h-3.5 text-[#FF4148] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          <span className="text-[#FF4148]/90 text-[10.5px] whitespace-nowrap font-medium tracking-tight">To ensure the safety of your funds, please bind your bank account</span>
        </div>

        {methodType === 'Bank' ? (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <Landmark className="w-4 h-4 text-[#FFD700]" />
                <span className="text-[13px] font-bold">Choose a bank</span>
              </div>
              <div 
                onClick={() => setIsSelectingBank(true)}
                className="w-full bg-[#FFC107] rounded-[8px] p-3 flex items-center justify-between shadow-sm cursor-pointer active:scale-[0.98] transition-transform text-[#2c1012]"
              >
                <span className="font-bold text-[14px]">{bankName || 'Please select a bank'}</span>
                <ChevronRight className="w-4 h-4 opacity-80" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <svg className="w-4 h-4 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span className="text-[13px] font-bold">Full recipient's name</span>
              </div>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Please enter the recipient's name" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <CreditCard className="w-4 h-4 text-[#FFD700]" />
                <span className="text-[13px] font-bold">Bank account number</span>
              </div>
              <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Please enter your bank account number" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <svg className="w-4 h-4 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                <span className="text-[13px] font-bold">Phone number</span>
              </div>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Please enter your phone number" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <svg className="w-4 h-4 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M21 10h-8.35A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H14v2h4v-2h3v-4zm-14 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg>
                <span className="text-[13px] font-bold">IFSC code</span>
              </div>
              <input type="text" value={ifsc} onChange={e => setIfsc(e.target.value)} placeholder="Please enter IFSC code" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <CreditCard className="w-4 h-4 text-[#FFD700]" />
                <span className="text-[13px] font-bold">UPI ID</span>
              </div>
              <input type="text" value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="Please enter your UPI ID" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <svg className="w-4 h-4 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                <span className="text-[13px] font-bold">Full recipient's name</span>
              </div>
              <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)} placeholder="Please enter the recipient's name" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5 text-white">
                <svg className="w-4 h-4 text-[#FFD700]" viewBox="0 0 24 24" fill="currentColor"><path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/></svg>
                <span className="text-[13px] font-bold">Phone number</span>
              </div>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Please enter your phone number" className="w-full bg-[#2c0808] border-none text-white rounded-[8px] p-3 text-[14px] placeholder:text-white/30 focus:outline-none" />
            </div>
          </div>
        )}

        <div className="mt-6 mb-4">
          <button 
            onClick={handleSave} 
            disabled={methodType === 'UPI' ? !upiId : !accountNumber || !bankName}
            className={`w-full py-3.5 rounded-[24px] font-bold tracking-wider text-[15px] transition-all active:scale-95 ${
              (methodType === 'UPI' ? upiId : (accountNumber && bankName)) 
                ? 'bg-[#2c0808] text-white cursor-pointer hover:bg-[#1a0505]' 
                : 'bg-[#2c0808]/50 text-white/30 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}
