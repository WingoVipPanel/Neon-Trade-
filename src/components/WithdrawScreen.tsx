import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Headset, 
  History, 
  Check, 
  RefreshCw, 
  Plus, 
  CreditCard, 
  Send, 
  Search, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  Wallet, 
  ShieldCheck, 
  Coins,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import SupportChat from './SupportChat';

interface WithdrawScreenProps {
  onClose: () => void;
  balance: number;
  onRefresh: () => void;
  selectedLang: string;
  onAddNotification?: (notif: { titleEn: string, titleHi: string, contentEn: string, contentHi: string, type: string }) => void;
}

const INDIAN_BANKS = [
  // PUBLIC SECTOR
  "State Bank of India (SBI)",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Canara Bank",
  "Union Bank of India",
  "Bank of India",
  "Indian Bank",
  "Central Bank of India",
  "Indian Overseas Bank",
  "UCO Bank",
  "Bank of Maharashtra",
  "Punjab & Sind Bank",
  // PRIVATE SECTOR
  "HDFC Bank Ltd.",
  "ICICI Bank Ltd.",
  "Axis Bank Ltd.",
  "Kotak Mahindra Bank Ltd.",
  "IndusInd Bank Ltd.",
  "YES Bank Ltd.",
  "IDFC First Bank Ltd.",
  "Federal Bank Ltd.",
  "South Indian Bank Ltd.",
  "Bandhan Bank Ltd.",
  "Jammu & Kashmir Bank Ltd.",
  "Karnataka Bank Ltd.",
  "Karur Vysya Bank Ltd.",
  "RBL Bank Ltd.",
  "CSB Bank Ltd.",
  "City Union Bank Ltd.",
  "DCB Bank Ltd.",
  "Dhanlaxmi Bank Ltd.",
  "IDBI Bank Ltd.",
  "Nainital Bank Ltd.",
  "Tamilnad Mercantile Bank Ltd.",
  // SMALL FINANCE
  "AU Small Finance Bank",
  "Capital Small Finance Bank",
  "Equitas Small Finance Bank",
  "ESAF Small Finance Bank",
  "Fincare Small Finance Bank",
  "Jana Small Finance Bank",
  "North East Small Finance Bank",
  "Shivalik Small Finance Bank",
  "Suryoday Small Finance Bank",
  "Unity Small Finance Bank",
  "Utkarsh Small Finance Bank",
  // PAYMENTS BANKS
  "Airtel Payments Bank",
  "India Post Payments Bank (IPPB)",
  "Fino Payments Bank",
  "Jio Payments Bank",
  "NSDL Payments Bank",
  // FOREIGN BANKS
  "Standard Chartered Bank",
  "HSBC Bank",
  "Citibank",
  "DBS Bank",
  "Deutsche Bank",
  "Barclays Bank",
  "BNP Paribas"
];

interface SavedBankDetails {
  bankName: string;
  accountNumber: string;
  holderName: string;
  ifsc: string;
  email: string;
  phone: string;
}

interface SavedUpiDetails {
  upiId: string;
  holderName: string;
  phone: string;
}

interface WithdrawalRecord {
  id: string;
  amount: number;
  method: 'BankCard' | 'UPI';
  accountDetails: string;
  status: 'Pending' | 'Success' | 'Failed';
  time: string;
  remarks?: string;
}

export default function WithdrawScreen({ onClose, balance, onRefresh, selectedLang, onAddNotification }: WithdrawScreenProps) {
  const isEn = selectedLang === 'en';

  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'BankCard' | 'UPI' | 'USDT'>('UPI');
  
  // Modals / Overlays
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showAddUpiModal, setShowAddUpiModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [activeTab, setActiveTab] = useState<'Withdraw' | 'History'>('Withdraw');
  
  // Bank search states
  const [bankSearchQuery, setBankSearchQuery] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);

  // Form states for Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankEmail, setBankEmail] = useState('');
  const [bankPhone, setBankPhone] = useState('');
  const [bankError, setBankError] = useState('');

  // Form states for UPI
  const [upiId, setUpiId] = useState('');
  const [upiHolderName, setUpiHolderName] = useState('');
  const [upiPhone, setUpiPhone] = useState('');
  const [upiError, setUpiError] = useState('');

  // Persisted Account states
  const [savedBank, setSavedBank] = useState<SavedBankDetails | null>(null);
  const [savedUpi, setSavedUpi] = useState<SavedUpiDetails | null>(null);

  // General errors
  const [errors, setErrors] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successAmount, setSuccessAmount] = useState(0);

  // Generate user-specific storage keys
  const currentUser = auth.currentUser;
  const userIdentifier = currentUser ? currentUser.uid : (localStorage.getItem('userPhone') || 'guest');
  const bankStorageKey = `saved_withdrawal_bank_${userIdentifier}`;
  const upiStorageKey = `saved_withdrawal_upi_${userIdentifier}`;
  const historyStorageKey = `withdrawal_history_records_${userIdentifier}`;
  const dailyCountStorageKey = `withdrawal_daily_count_${userIdentifier}_${new Date().toISOString().split('T')[0]}`;

  const [dailyRemainingCount, setDailyRemainingCount] = useState<number>(() => {
    const count = localStorage.getItem(dailyCountStorageKey);
    return count ? 3 - parseInt(count) : 3;
  });

  // Load saved details
  useEffect(() => {
    const bankData = localStorage.getItem(bankStorageKey);
    const upiData = localStorage.getItem(upiStorageKey);
    if (bankData) {
      try { setSavedBank(JSON.parse(bankData)); } catch(e) {}
    }
    if (upiData) {
      try { setSavedUpi(JSON.parse(upiData)); } catch(e) {}
    }
  }, [bankStorageKey, upiStorageKey]);

  const [historyRecords, setHistoryRecords] = useState<WithdrawalRecord[]>(() => {
    const records = localStorage.getItem(historyStorageKey);
    return records ? JSON.parse(records) : [];
  });

  const saveBankDetails = () => {
    if (!bankName) return setBankError(isEn ? 'Please select a bank' : 'कृपया बैंक चुनें');
    if (!accountNumber || accountNumber.length < 8) return setBankError(isEn ? 'Please enter valid account number' : 'कृपया मान्य खाता संख्या दर्ज करें');
    if (!holderName) return setBankError(isEn ? 'Please enter holder name' : 'कृपया खाताधारक का नाम दर्ज करें');
    if (!ifsc || ifsc.length < 4) return setBankError(isEn ? 'Please enter IFSC code' : 'कृपया सही IFSC कोड दर्ज करें');
    
    const details: SavedBankDetails = { bankName, accountNumber, holderName, ifsc, email: bankEmail, phone: bankPhone };
    localStorage.setItem(bankStorageKey, JSON.stringify(details));
    setSavedBank(details);
    setShowAddBankModal(false);
    setBankError('');
  };

  const saveUpiDetails = () => {
    if (!upiId || !upiId.includes('@')) return setUpiError(isEn ? 'Please enter a valid UPI ID' : 'कृपया मान्य UPI ID दर्ज करें');
    if (!upiHolderName) return setUpiError(isEn ? 'Please enter holder name' : 'कृपया नाम दर्ज करें');
    
    const details: SavedUpiDetails = { upiId, holderName: upiHolderName, phone: upiPhone };
    localStorage.setItem(upiStorageKey, JSON.stringify(details));
    setSavedUpi(details);
    setShowAddUpiModal(false);
    setUpiError('');
  };

  const handleAllAmount = () => {
    setWithdrawAmount(balance.toFixed(2));
  };

  const handleWithdrawAction = async () => {
    setErrors('');
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrors(isEn ? 'Enter a valid amount' : 'एक मान्य राशि दर्ज करें');
      return;
    }
    if (amt < 200) {
      setErrors(isEn ? 'Minimum withdrawal amount is ₹200' : 'न्यूनतम निकासी राशि ₹200 है');
      return;
    }
    if (amt > 50000) {
      setErrors(isEn ? 'Maximum payout is ₹50,000' : 'अधिकतम निकासी ₹50,000 है');
      return;
    }
    if (amt > balance) {
      setErrors(isEn ? 'Insufficient balance' : 'अपर्याप्त शेष');
      return;
    }

    if (dailyRemainingCount <= 0) {
      setErrors(isEn ? 'Daily withdrawal limit of 3 reached' : 'दैनिक निकासी सीमा 3 पूरी हो गई है');
      return;
    }

    if (paymentMethod === 'BankCard' && !savedBank) {
      setErrors(isEn ? 'Please add a Bank Card account first' : 'कृपया पहले बैंक कार्ड खाता जोड़ें');
      return;
    }
    if (paymentMethod === 'UPI' && !savedUpi) {
      setErrors(isEn ? 'Please add a UPI account first' : 'कृपया पहले UPI खाता जोड़ें');
      return;
    }

    // Process payment simulation
    setIsProcessing(true);
    setTimeout(async () => {
      try {
        const user = auth.currentUser;
        if (!user) throw new Error("No authenticated user");

        const newBalance = balance - amt;

        // Fetch user profile info
        let userNickname = 'User';
        let userAvatar = '';
        let userShortUid = '';
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            userNickname = userDoc.data().nickname || 'User';
            userAvatar = userDoc.data().avatar || '';
            userShortUid = userDoc.data().uid || '';
          }
        } catch (err) {
          console.error("Error fetching user profile for WD write:", err);
        }

        await updateDoc(doc(db, 'users', user.uid), {
          balance: newBalance,
          updatedAt: serverTimestamp()
        });
        
        // Add record
        const maskDetails = paymentMethod === 'BankCard' 
          ? `${savedBank?.bankName} (Ac: ..${savedBank?.accountNumber.slice(-4)})`
          : savedUpi?.upiId || '';

        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const formattedDate = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

        const newRecord: WithdrawalRecord = {
          id: `WD${Date.now().toString().slice(-6)}`,
          amount: amt,
          method: paymentMethod,
          accountDetails: maskDetails,
          status: 'Pending',
          time: formattedDate
        };

        // Write to Firestore withdrawRequests for full-stack admin panel approval
        await setDoc(doc(db, 'withdrawRequests', newRecord.id), {
          id: newRecord.id,
          userId: user.uid,
          nickname: userNickname,
          avatar: userAvatar,
          uid: userShortUid || user.uid.substring(0, 8),
          amount: amt,
          method: paymentMethod,
          accountDetails: maskDetails,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        const updatedHistory = [newRecord, ...historyRecords];
        setHistoryRecords(updatedHistory);
        localStorage.setItem(historyStorageKey, JSON.stringify(updatedHistory));

        // Update daily count
        const currentUsed = 3 - dailyRemainingCount;
        const newUsed = currentUsed + 1;
        localStorage.setItem(dailyCountStorageKey, newUsed.toString());
        setDailyRemainingCount(3 - newUsed);

        if (onAddNotification) {
          onAddNotification({
            titleEn: 'APPLY FOR WITHDRAWAL',
            titleHi: 'निकासी के लिए आवेदन करें',
            contentEn: 'Your withdrawal request has been sent',
            contentHi: 'आपका निकासी अनुरोध भेज दिया गया है',
            type: 'withdraw_request'
          });
        }
        setSuccessAmount(amt);
        setShowSuccessToast(true);
        setWithdrawAmount('');
        onRefresh();
      } catch (e) {
        console.error('Withdrawal DB sync error:', e);
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  const filteredBanks = bankSearchQuery.trim() === '' 
    ? INDIAN_BANKS 
    : INDIAN_BANKS.filter(b => b.toLowerCase().includes(bankSearchQuery.toLowerCase()));

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Simple alert-less feedback could be added if needed, but keeping it minimal as requested
  };

  return (
    <div id="wd-container" className="fixed inset-0 z-50 overflow-y-auto w-full min-h-screen bg-[#30090a] font-sans flex flex-col mx-auto max-w-[410px]">
      
      {/* Header */}
      <div className="sticky top-0 w-full h-[54px] bg-[#30090a] flex items-center justify-between px-4 z-20">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-start cursor-pointer text-[#ffccd1]">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex gap-6 items-center flex-1 justify-center -ml-8">
           <button 
             onClick={() => setActiveTab('Withdraw')}
             className={`text-[17px] font-bold relative pb-1 transition-all ${activeTab === 'Withdraw' ? 'text-white' : 'text-neutral-500'}`}
           >
             {isEn ? 'Withdraw' : 'निकासी'}
             {activeTab === 'Withdraw' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#ffbb0d] rounded-full" />}
           </button>
           <button 
             onClick={() => { setActiveTab('History'); setShowHistoryModal(true); }}
             className={`text-[15px] font-medium transition-all ${activeTab === 'History' ? 'text-white' : 'text-neutral-500'}`}
           >
             {isEn ? 'Withdrawal history' : 'निकासी इतिहास'}
           </button>
        </div>
      </div>

      <div className="px-4 py-3 flex-1 overflow-y-auto space-y-4">
        
        {/* Available Balance Card - Simple Refined Version */}
        <div className="relative rounded-[20px] p-5 h-[155px] bg-gradient-to-br from-[#ffcd29] via-[#ffb900] to-[#f98200] shadow-sm overflow-hidden">
          <div className="flex items-center gap-1.5 text-[#3d1100] font-semibold text-[13px] opacity-90">
            <Wallet className="w-4 h-4 fill-[#3d1100]/20" />
            {isEn ? 'Available balance' : 'उपलब्ध शेष राशि'}
          </div>
          
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-[34px] font-bold text-[#3d1100] tracking-tight">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <button 
              onClick={onRefresh}
              className="p-1 hover:bg-black/5 rounded-full transition-all active:rotate-180"
            >
              <RefreshCw className="h-[22px] w-[22px] text-[#3d1100]" />
            </button>
          </div>
          
          {/* Bottom Card Elements */}
          <div className="absolute bottom-5 left-5">
             <div className="w-9 h-6 bg-white/20 rounded-sm border border-white/30 flex flex-col gap-0.5 p-1 relative overflow-hidden">
                <div className="w-full h-0.5 bg-black/10" />
                <div className="w-4 h-1 bg-black/5 rounded-full mt-auto" />
             </div>
          </div>

          <div className="absolute bottom-5 right-5 text-[#3d1100] font-mono text-[13px] opacity-50 font-bold tracking-[0.2em]">
             **** ****
          </div>

          {/* Subtle Texture/Wave Effect */}
          <div className="absolute -right-4 -top-4 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
        </div>

        {/* Method Selection Tiles - Exactly like reference */}
        <div className="grid grid-cols-3 gap-2.5">
          <button 
            onClick={() => setPaymentMethod('UPI')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl h-[100px] border transition-all ${paymentMethod === 'UPI' ? 'bg-[#ffbb0d] border-[#ffbb0d] text-[#3d1100]' : 'bg-[#3d1100] border-transparent text-neutral-500'}`}
          >
            <div className={`w-14 h-12 rounded-lg flex items-center justify-center overflow-hidden mb-0.5 ${paymentMethod === 'UPI' ? 'bg-white/20' : 'bg-white/5'}`}>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" 
                alt="UPI" 
                className={`w-10 h-10 object-contain p-1 ${paymentMethod === 'UPI' ? 'brightness-50' : 'opacity-40 grayscale'}`} 
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">UPI</span>
          </button>

          <button 
            onClick={() => setPaymentMethod('BankCard')}
            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl h-[100px] border transition-all ${paymentMethod === 'BankCard' ? 'bg-[#ffbb0d] border-[#ffbb0d] text-[#3d1100]' : 'bg-[#3d1100] border-transparent text-neutral-500'}`}
          >
            <div className={`w-14 h-12 rounded-lg flex items-center justify-center mb-0.5 ${paymentMethod === 'BankCard' ? 'bg-white/20' : 'bg-white/5'}`}>
              <CreditCard className={`w-7 h-7 ${paymentMethod === 'BankCard' ? 'text-[#3d1100]' : 'text-neutral-500'}`} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">{isEn ? 'Bank Card' : 'बैंक कार्ड'}</span>
          </button>

          <button 
            disabled
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl h-[100px] border bg-[#3d1100] border-transparent text-neutral-500 opacity-60 relative grayscale cursor-not-allowed"
          >
            <div className="w-14 h-12 rounded-lg flex items-center justify-center bg-white/5 mb-0.5">
              <Coins className="w-7 h-7 opacity-40" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider">USDT</span>
            <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-600 rounded-full" />
          </button>
        </div>

        {/* Saved Method Detail Area */}
        <div className="mt-1">
          <AnimatePresence mode="wait">
            {paymentMethod === 'UPI' ? (
              <motion.div key="upi-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 {savedUpi ? (
                   <div className="bg-[#3d1100] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[#ffbb0d]/10 flex items-center justify-center">
                         <Send className="w-5 h-5 text-[#ffbb0d] rotate-[-45deg]" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-white font-semibold text-sm">{savedUpi.upiId}</span>
                         <span className="text-neutral-500 text-[10px] uppercase font-bold tracking-wider">{savedUpi.holderName}</span>
                       </div>
                     </div>
                     <button onClick={() => setShowAddUpiModal(true)} className="text-[#ffbb0d] text-xs font-bold px-3.5 py-1.5 bg-[#ffbb0d]/10 rounded-full active:scale-95 transition-transform">
                       {isEn ? 'Edit' : 'बदलें'}
                     </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setShowAddUpiModal(true)}
                     className="w-full py-7 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl bg-black/10 text-neutral-500 hover:text-white transition-all active:scale-[0.98]"
                   >
                     <div className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
                       <Plus className="w-6 h-6" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-widest">{isEn ? 'Add UPI' : 'UPI जोड़ें'}</span>
                   </button>
                 )}
              </motion.div>
            ) : paymentMethod === 'BankCard' ? (
              <motion.div key="bank-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                 {savedBank ? (
                   <div className="bg-[#3d1100] p-4 rounded-xl border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-[#ffbb0d]/10 flex items-center justify-center">
                         <CreditCard className="w-5 h-5 text-[#ffbb0d]" />
                       </div>
                       <div className="flex flex-col">
                         <span className="text-white font-semibold text-sm">{savedBank.bankName}</span>
                         <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">{`•••• ${savedBank.accountNumber.slice(-4)}`}</span>
                       </div>
                     </div>
                     <button onClick={() => setShowAddBankModal(true)} className="text-[#ffbb0d] text-xs font-bold px-3.5 py-1.5 bg-[#ffbb0d]/10 rounded-full active:scale-95 transition-transform">
                       {isEn ? 'Edit' : 'बदलें'}
                     </button>
                   </div>
                 ) : (
                   <button 
                     onClick={() => setShowAddBankModal(true)}
                     className="w-full py-7 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-xl bg-black/10 text-neutral-500 hover:text-white transition-all active:scale-[0.98]"
                   >
                     <div className="w-10 h-10 rounded-lg border border-dashed border-white/20 flex items-center justify-center">
                       <Plus className="w-6 h-6" />
                     </div>
                     <span className="text-xs font-bold uppercase tracking-widest">{isEn ? 'Add Bank Card' : 'बैंक कार्ड जोड़ें'}</span>
                   </button>
                 )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Withdrawal Form Section - Matches Ref */}
        <div className="space-y-4">
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                <span className="text-[#ffbb0d] text-[18px] font-bold">₹</span>
             </div>
             <input 
               type="number"
               value={withdrawAmount}
               onChange={(e) => setWithdrawAmount(e.target.value)}
               placeholder={isEn ? 'Please enter the amount' : 'कृपया राशि दर्ज करें'}
               className="w-full h-14 pl-12 pr-16 bg-[#3d1100] rounded-xl border-none outline-none text-white text-[16px] font-semibold focus:ring-1 focus:ring-[#ffbb0d]/30 transition-all placeholder:text-neutral-600"
             />
             <button 
               onClick={handleAllAmount}
               className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 border border-[#ffbb0d]/40 text-[#ffbb0d] font-bold text-[12px] rounded-md active:scale-90 transition-all"
             >
               {isEn ? 'All' : 'सभी'}
             </button>
          </div>

          <div className="space-y-2 px-1">
             <div className="flex items-center justify-between text-[13px] font-medium">
               <span className="text-neutral-500">{isEn ? 'Withdrawable balance' : 'निकासी योग्य शेष'}</span>
               <span className="text-[#ffbb0d]">₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
             <div className="flex items-center justify-between text-[13px] font-medium">
               <span className="text-neutral-500">{isEn ? 'Withdrawal amount received' : 'प्राप्त निकासी राशि'}</span>
               <span className="text-[#ffbb0d]">₹{(parseFloat(withdrawAmount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
             </div>
          </div>

          {errors && (
            <div className="text-red-500 font-bold text-xs text-center p-2 bg-red-900/20 rounded-lg border border-red-500/20">
              {errors}
            </div>
          )}
          <button 
            disabled={isProcessing}
            onClick={handleWithdrawAction}
            className={`w-full py-4.5 rounded-full font-bold text-sm uppercase tracking-widest shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 ${withdrawAmount ? 'bg-[#ffbb0d] text-[#3d1100]' : 'bg-[#3d1100] text-neutral-600/60'}`}
          >
            {isProcessing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <span>{isEn ? 'Withdraw' : 'निकालें'}</span>
            )}
          </button>
        </div>

        {/* Tips Section - Diamond bullets like ref */}
        <div className="bg-[#1b0809] p-5 rounded-[22px] border border-white/5 space-y-4">
           <div className="flex flex-col gap-3.5">
              {[
                { en: `Need to bet ₹0.00 to be able to withdraw`, hi: `निकालने के लिए ₹0.00 का दांव लगाना होगा` },
                { en: `Withdraw time 00:00-23:59`, hi: `निकासी का समय 00:00-23:59` },
                { en: `Inday Remaining Withdrawal Times ${dailyRemainingCount}`, hi: `आज के शेष निकासी समय ${dailyRemainingCount}` },
                { en: `Withdrawal amount range ₹100.00-₹50,000.00`, hi: `निकासी राशि सीमा ₹100.00-₹50,000.00` },
                { en: `Please confirm your beneficial account information before withdrawing. If your information is incorrect, our company will not be liable for the amount of loss`, hi: `निकालने से पहले कृपया अपने लाभकारी खाते की जानकारी की पुष्टि करें। यदि आपकी जानकारी गलत है, तो हमारी कंपनी नुकसान की राशि के लिए उत्तरदायी नहीं होगी` },
                { en: `If your beneficial information is incorrect, please contact customer service`, hi: `यदि आपकी जानकारी गलत है, तो कृपया ग्राहक सेवा से संपर्क करें` }
              ].map((tip, i) => (
                <div key={i} className="flex gap-2.5 text-[11px] leading-relaxed">
                   <div className="shrink-0 w-1.5 h-1.5 rotate-45 bg-[#ffbb0d] mt-1.5" />
                   <span className="text-[#8c686a] font-medium">{isEn ? tip.en : tip.hi}</span>
                </div>
              ))}
           </div>
        </div>

        {/* History Section - Enhanced version based on ref */}
        <div className="pb-32 px-1 space-y-6">
           <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[4px] bg-[#ffbb0d] flex flex-col items-center justify-center p-1.5 shadow-lg">
                 <div className="w-full h-0.5 bg-[#3d1100] rounded-full" />
                 <div className="w-full h-0.5 bg-[#3d1100] rounded-full mt-1" />
                 <div className="w-2/3 h-0.5 bg-[#3d1100] rounded-full mt-1 self-start" />
              </div>
              <span className="text-white font-bold text-[16px]">{isEn ? 'Withdrawal history' : 'निकासी इतिहास'}</span>
           </div>

           {historyRecords.length > 0 ? (
             <div className="space-y-4">
                {historyRecords.slice(0, 5).map((record) => (
                  <div key={record.id} className="bg-[#1b0809] rounded-xl overflow-hidden shadow-lg border border-white/5">
                    <div className="p-5 space-y-4">
                      {/* Status Header */}
                      <div className="flex items-center justify-between">
                         <div className="px-3 py-1 bg-red-600/90 rounded-md text-white text-[10px] font-black uppercase tracking-widest">
                           {isEn ? 'Withdraw' : 'निकालना'}
                         </div>
                         <div className={`text-[13px] font-bold ${
                           record.status === 'Success' ? 'text-emerald-500' : 
                           record.status === 'Pending' ? 'text-[#ffbb0d]' : 
                           'text-rose-500'
                         }`}>
                           {record.status === 'Success' ? (isEn ? 'Completed' : 'सफल') : 
                            record.status === 'Pending' ? (isEn ? 'Pending' : 'लंबित') : 
                            (isEn ? 'Pending' : 'लंबित')}
                         </div>
                      </div>

                      {/* Detail Rows */}
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-500 font-medium">{isEn ? 'Balance' : 'राशि'}</span>
                          <span className="text-[#ffbb0d] font-black text-[14px]">₹{record.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-500 font-medium">{isEn ? 'Type' : 'प्रकार'}</span>
                          <span className="text-neutral-300 font-bold uppercase">{record.method === 'UPI' ? 'UPI' : 'Bank Card'}</span>
                        </div>

                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-500 font-medium">{isEn ? 'Time' : 'समय'}</span>
                          <span className="text-neutral-400 font-medium">{record.time}</span>
                        </div>

                        <div className="flex justify-between items-center text-[12px]">
                          <span className="text-neutral-500 font-medium">{isEn ? 'Order number' : 'ऑर्डर नंबर'}</span>
                          <div className="flex items-center gap-1">
                             <span className="text-neutral-400 font-medium truncate max-w-[150px]">{record.id}</span>
                             <button onClick={() => copyToClipboard(record.id)} className="p-1 hover:bg-black/5 rounded transition-colors group">
                               <Copy className="w-3.5 h-3.5 text-neutral-500 group-active:text-[#ffbb0d]" />
                             </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <div className="relative mb-6">
                   <div className="w-[100px] h-32 bg-[#3d1100] rounded-lg transform skew-x-[-1deg] border border-white/5 relative overflow-hidden flex flex-col items-center pt-4 gap-2">
                      <div className="w-[70px] h-1.5 bg-white/10 rounded-full" />
                      <div className="w-[60px] h-1.5 bg-white/10 rounded-full" />
                      <div className="w-[70px] h-1.5 bg-white/10 rounded-full mt-4" />
                      <div className="w-[50px] h-1.5 bg-white/10 rounded-full" />
                   </div>
                   {/* Floating accents */}
                   <div className="absolute -bottom-4 -left-4 w-5 h-5 bg-[#ffbb0d]/10 rounded-md rotate-12 blur-[1px]" />
                   <div className="absolute top-10 -right-6 w-8 h-8 bg-blue-500/5 rounded-full blur-md" />
                </div>
                <span className="text-[14px] font-medium text-neutral-600 tracking-wide">{isEn ? 'No data' : 'कोई डेटा नहीं'}</span>
             </div>
           )}

           <button 
             onClick={() => setShowHistoryModal(true)}
             className="w-full py-3.5 border border-[#ffbb0d]/40 rounded-full text-[#ffbb0d] font-bold text-[14px] active:scale-95 transition-all text-center tracking-wide"
           >
             {isEn ? 'All history' : 'सभी इतिहास'}
           </button>
        </div>
      </div>

      {/* Floating Support Icon */}
      <div 
        onClick={() => setShowSupportChat(true)}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#ffbb0d] rounded-full shadow-[0_8px_25px_rgba(255,185,0,0.4)] flex items-center justify-center cursor-pointer active:scale-90 transition-transform z-40 border-4 border-white/10"
      >
        <Headset className="w-7 h-7 text-[#3d1100]" />
        <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#ffbb0d]" />
      </div>

      {/* Extreme Premium Action Button footer */}
      {/* (Removed duplicate action button block that was causing syntax errors) */}

      {/* =========================================
                     ADD BANKCARD MODAL
         ========================================= */}
      <AnimatePresence>
        {showAddBankModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 210 }}
              className="bg-[#1f0709] border-t border-[#ffbb0d]/30 rounded-t-3xl max-h-[85%] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4.5 border-b border-white/5 flex items-center justify-between bg-black/25 shrink-0">
                <span className="text-[14px] font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ffbb0d]">
                  {isEn ? 'Bank Account Credentials' : 'बैंक खाता विवरण दर्ज करें'}
                </span>
                <button 
                  id="wd-add-bank-close"
                  onClick={() => setShowAddBankModal(false)}
                  className="text-[10px] font-black text-neutral-400 hover:text-white px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
                >
                  {isEn ? 'Close' : 'बंद करें'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {bankError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl">
                    {bankError}
                  </div>
                )}

                {/* Bank Name Search Input */}
                <div className="relative">
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Select Bank Name' : 'बैंक का नाम चुनें'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center justify-between shadow-inner focus-within:border-[#ffbb0d]/30 transition-all">
                    <input 
                      id="wd-bank-search"
                      type="text"
                      value={bankSearchQuery}
                      onChange={(e) => {
                        setBankSearchQuery(e.target.value);
                        setBankName(e.target.value);
                        setShowBankDropdown(true);
                      }}
                      onFocus={() => setShowBankDropdown(true)}
                      placeholder={isEn ? 'Search or type bank name' : 'बैंक का नाम खोजें या टाइप करें'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                    />
                    <Search className="w-4 h-4 text-neutral-500" />
                  </div>

                  {/* Dropdown list */}
                  <AnimatePresence>
                    {showBankDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, scaleY: 0.9 }}
                        animate={{ opacity: 1, scaleY: 1 }}
                        exit={{ opacity: 0, scaleY: 0.9 }}
                        className="absolute left-0 right-0 mt-1 max-h-[180px] overflow-y-auto bg-[#130203] border border-white/10 rounded-xl shadow-2xl z-50 divide-y divide-white/[0.04]"
                      >
                        {filteredBanks.length > 0 ? (
                          filteredBanks.map((bank, index) => (
                            <div 
                              key={`${bank}-${index}`}
                              onClick={() => {
                                setBankName(bank);
                                setBankSearchQuery(bank);
                                setShowBankDropdown(false);
                              }}
                              className="px-4 py-2.5 text-xs text-neutral-300 hover:bg-[#ffbb0d]/10 hover:text-[#ffbb0d] font-bold cursor-pointer flex items-center justify-between"
                            >
                              <span>{bank}</span>
                              {bankName === bank && <Check className="w-3.5 h-3.5 text-[#ffbb0d]" />}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-xs text-neutral-500 text-center">
                            {isEn ? 'No bank found. Press enter.' : 'कोई बैंक नहीं मिला'}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Account Number */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Bank Account Number' : 'बैंक खाता संख्या'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-bank-account"
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder={isEn ? 'Enter complete account number' : 'पूरी खाता संख्या दर्ज करें'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Holder Name */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Beneficiary Full Name' : 'लाभार्थी का पूरा नाम'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-bank-holder"
                      type="text"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      placeholder={isEn ? 'As printed in physical passbook' : 'पासबुक के अनुसार नाम दर्ज करें'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                    />
                  </div>
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'IFSC Code' : 'IFSC कोड'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-bank-ifsc"
                      type="text"
                      value={ifsc}
                      onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                      placeholder={isEn ? 'e.g., SBIN0028120' : 'उदा: SBIN0028120'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Contact Email Address' : 'संपर्क ईमेल पता'}
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-bank-email"
                      type="email"
                      value={bankEmail}
                      onChange={(e) => setBankEmail(e.target.value)}
                      placeholder={isEn ? 'For confirmation updates' : 'अपडेट की पुष्टि के लिए ईमेल'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>

                {/* Phone Mobile Number */}
                <div className="pb-8">
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Contact Phone Number' : 'संपर्क फोन नंबर'}
                  </label>
                  <div className="bg-[#120203] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-bank-phone"
                      type="tel"
                      value={bankPhone}
                      onChange={(e) => setBankPhone(e.target.value)}
                      placeholder={isEn ? '10-digit mobile number' : '10 अंकों का संख्या दर्ज करें'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button footer */}
              <div className="p-4 bg-black/60 border-t border-white/5 shrink-0 flex gap-3.5 z-10">
                <button 
                  id="wd-bank-cancel"
                  onClick={() => setShowAddBankModal(false)}
                  className="w-1/2 py-3 bg-white/5 border border-white/10 rounded-full font-extrabold text-neutral-400 text-xs uppercase tracking-widest cursor-pointer text-center hover:bg-white/10"
                >
                  {isEn ? 'Cancel' : 'रद्द करें'}
                </button>
                <button 
                  id="wd-bank-save"
                  onClick={saveBankDetails}
                  className="w-1/2 py-3 bg-gradient-to-r from-[#ffd36c] to-[#e47600] active:scale-95 transition-all rounded-full hover:brightness-110 font-black text-black text-xs uppercase tracking-widest cursor-pointer text-center shadow-lg shadow-[#ffbb0d]/10"
                >
                  {isEn ? 'Save Vault' : 'सुरक्षित सहेजें'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
                     ADD UPI MODAL
         ========================================= */}
      <AnimatePresence>
        {showAddUpiModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/85 flex flex-col justify-end"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 210 }}
              className="bg-[#0f141a] border-t border-blue-500/30 rounded-t-3xl max-h-[85%] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-5 py-4.5 border-b border-white/5 flex items-center justify-between bg-black/25 shrink-0">
                <span className="text-[14px] font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-400">
                  {isEn ? 'UPI VPA Credential' : 'यूपीआई आईडी क्रेडेंशियल'}
                </span>
                <button 
                  id="wd-add-upi-close"
                  onClick={() => setShowAddUpiModal(false)}
                  className="text-[10px] font-black text-neutral-400 hover:text-white px-3 py-1.5 bg-white/5 rounded-full border border-white/10"
                >
                  {isEn ? 'Close' : 'बंद करें'}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-12">
                {upiError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-xs rounded-xl">
                    {upiError}
                  </div>
                )}

                {/* UPI Address */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'UPI ID / VPA' : 'UPI ID / VPA'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#090d12] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-upi-address"
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder={isEn ? 'e.g., mobile@upi or name@ybl' : 'उदा: mobile@upi'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>

                {/* UPI Holder Name */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Account Holder Full Name' : 'खाताधारक का पूरा नाम'} <span className="text-red-500">*</span>
                  </label>
                  <div className="bg-[#090d12] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-upi-holder"
                      type="text"
                      value={upiHolderName}
                      onChange={(e) => setUpiHolderName(e.target.value)}
                      placeholder={isEn ? 'Enter verified registered bank name' : 'रजिस्टर बैंक का नाम दर्ज करें'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold"
                    />
                  </div>
                </div>

                {/* UPI Phone */}
                <div>
                  <label className="text-[10px] font-black text-neutral-400 tracking-wider uppercase mb-1.5 block">
                    {isEn ? 'Mobile Number (Optional)' : 'मोबाइल नंबर (वैकल्पिक)'}
                  </label>
                  <div className="bg-[#090d12] rounded-xl border border-white/5 p-3 flex items-center shadow-inner">
                    <input 
                      id="wd-upi-phone"
                      type="tel"
                      value={upiPhone}
                      onChange={(e) => setUpiPhone(e.target.value)}
                      placeholder={isEn ? '10-digit registered number' : '10 अंकों का रजिस्टर्ड नंबर'}
                      className="bg-transparent border-none outline-none text-xs text-white w-full font-bold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Button footer */}
              <div className="p-4 bg-black/60 border-t border-white/5 shrink-0 flex gap-3.5 z-10">
                <button 
                  id="wd-upi-cancel"
                  onClick={() => setShowAddUpiModal(false)}
                  className="w-1/2 py-3 bg-white/5 border border-white/10 rounded-full font-extrabold text-neutral-400 text-xs uppercase tracking-widest cursor-pointer text-center hover:bg-white/10"
                >
                  {isEn ? 'Cancel' : 'रद्द करें'}
                </button>
                <button 
                  id="wd-upi-save"
                  onClick={saveUpiDetails}
                  className="w-1/2 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 active:scale-95 transition-all rounded-full hover:brightness-110 font-black text-white text-xs uppercase tracking-widest cursor-pointer text-center shadow-lg shadow-blue-500/10"
                >
                  {isEn ? 'Save UPI' : 'सहेजें'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================
                     HISTORY MODAL
         ========================================= */}
      <AnimatePresence>
        {showHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex flex-col"
          >
            {/* Header */}
            <div className="relative h-15 border-b border-[#ffbb0d]/10 bg-gradient-to-r from-[#170304] via-[#240a0b] to-[#170304] flex items-center justify-between px-3.5 shrink-0">
              <button 
                id="wd-history-close"
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 bg-white/5 hover:bg-[#ffbb0d]/10 border border-white/5 hover:border-[#ffbb0d]/20 rounded-xl text-neutral-400 hover:text-white"
              >
                <ChevronLeft className="w-5.5 h-5.5" />
              </button>
              <span className="text-sm font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-white to-[#ffbb0d]">
                {isEn ? 'Withdrawal Audit' : 'निकासी लेखापरीक्षा'}
              </span>
              <div className="w-10" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0d0102]">
              {historyRecords.length > 0 ? (
                historyRecords.map((rec) => (
                  <div key={rec.id} className="p-4 bg-gradient-to-b from-[#1a0507] to-[#110102] rounded-2xl border border-white/[0.04] shadow-md flex justify-between items-center transition-all hover:scale-[1.01] hover:border-[#ffbb0d]/10">
                    <div className="flex flex-col gap-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#ffbb0d]/10 text-[#ffbb0d] tracking-widest border border-[#ffbb0d]/10 font-mono">
                          {rec.id}
                        </span>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{rec.method === 'BankCard' ? 'BANK CARD' : 'UPI INSTANT'}</span>
                      </div>
                      <span className="text-xs text-neutral-300 mt-1 font-mono tracking-wide">{rec.accountDetails}</span>
                      <span className="text-[9px] text-neutral-500 font-bold font-mono tracking-wider">{rec.time}</span>
                    </div>

                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-lg font-black text-white">₹{rec.amount.toFixed(2)}</span>
                      {rec.status === 'Processing' && (
                        <div className="flex items-center gap-1.5 text-orange-400 border border-orange-400/10 px-2.5 py-0.5 rounded-full text-[9px] bg-orange-400/5 font-black tracking-wider uppercase">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                          {isEn ? 'Processing' : 'प्रसंस्करण'}
                        </div>
                      )}
                      {rec.status === 'Success' && (
                        <div className="flex items-center gap-1 text-emerald-400 border border-emerald-500/15 px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-500/5 font-black tracking-wider uppercase">
                          <Check className="w-3 h-3" />
                          {isEn ? 'Success' : 'सफलता'}
                        </div>
                      )}
                      {rec.status === 'Failed' && (
                        <div className="flex items-center gap-1 text-red-400 border border-red-500/15 px-2.5 py-0.5 rounded-full text-[9px] bg-red-400/5 font-black tracking-wider uppercase">
                          {isEn ? 'Failed' : 'विफल'}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center gap-2 text-neutral-600">
                  <HelpCircle className="w-10 h-10 text-neutral-700" />
                  <span className="text-xs font-bold leading-relaxed">{isEn ? 'No historic withdrawal transactions found' : 'कोई पूर्व निकासी लेनदेन इतिहास नहीं मिला'}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFETTI SUCCESS POPUP DIALOG */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/95 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="w-full max-w-[340px] bg-gradient-to-b from-[#2b0f11] to-[#140203] border border-[#ffbb0d]/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffbb0d]/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="w-15 h-15 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_4px_15px_rgba(16,185,129,0.2)]">
                <CheckCircle2 className="w-9 h-9 animate-bounce" />
              </div>

              <h3 className="text-[14px] font-black text-[#ffbb0d] uppercase tracking-widest mb-1.5">
                {isEn ? 'Withdrawal Submitted' : 'निकासी सबमिट की गई'}
              </h3>
              
              <div className="text-3xl font-black text-white mt-1 mb-4 drop-shadow-[0_2px_15px_rgba(255,255,255,0.1)]">
                ₹{successAmount.toFixed(2)}
              </div>

              <p className="text-xs text-neutral-400 font-semibold leading-relaxed mb-6">
                {isEn 
                  ? 'Your withdrawal request has been received on the secure gateway. Audit will be updated on your audit dashboard records'
                  : 'आपका निकासी आवेदन सुरक्षित गेटवे पर प्राप्त हो गया है। लेखापरीक्षा आपके क्रेडेंशियल इतिहास में अपडेट की जाएगी!'}
              </p>

              <button 
                id="wd-success-ok"
                onClick={() => setShowSuccessToast(false)}
                className="w-full py-3.5 bg-gradient-to-b from-[#ffe5a4] via-[#ffbb0d] to-[#db9c00] text-black font-black uppercase text-xs tracking-widest rounded-full shadow-lg hover:brightness-110 cursor-pointer active:scale-95 transition-all"
              >
                {isEn ? 'Done' : 'पूर्ण'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Direct Integration with the Support Chat Component */}
      {showSupportChat && (
        <SupportChat 
          onClose={() => setShowSupportChat(false)} 
          userName={localStorage.getItem('userNickname') || 'Player'}
        />
      )}

    </div>
  );
}
