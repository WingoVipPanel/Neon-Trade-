import React, { useState, useEffect } from 'react';
import { ChevronLeft, Headset, History, Check, RefreshCw, Copy, Timer, Smartphone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import SupportChat from './SupportChat';

interface DepositScreenProps {
  onClose: () => void;
  balance: number;
  onRefresh: () => void;
  onAddNotification?: (notif: { titleEn: string, titleHi: string, contentEn: string, contentHi: string, type: string }) => void;
}

const DEPOSIT_AMOUNTS = [
  { amount: 200, bonus: 38 },
  { amount: 300, bonus: 57 },
  { amount: 500, bonus: 95 },
  { amount: 1000, bonus: 190 },
  { amount: 2000, bonus: 380 },
  { amount: 3000, bonus: 570 },
  { amount: 5000, bonus: 950 },
  { amount: 8000, bonus: 1520 },
  { amount: 10000, bonus: 1900 },
  { amount: 20000, bonus: 3800 },
  { amount: 30000, bonus: 5700 },
  { amount: 50000, bonus: 9500 }
];

const PAYMENT_METHODS = [
  { id: 'UPI-QR', name: 'UPI-QR', type: 'upi1', recommend: true },
  { id: 'UPI*QR', name: 'UPI*QR', type: 'upi2' },
  { id: 'Paytm*QR', name: 'Paytm*QR', type: 'paytm' },
  { id: 'PhonePe', name: 'PhonePe', type: 'phonepe' },
];

export default function DepositScreen({ onClose, balance, onRefresh, onAddNotification }: DepositScreenProps) {
  const [amount, setAmount] = useState<string>('200');
  const [error, setError] = useState<string>('');
  const [method, setMethod] = useState<string>('UPI-QR');
  const [showPayment, setShowPayment] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [utr, setUtr] = useState('');
  const [utrError, setUtrError] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [selectedPayMethod, setSelectedPayMethod] = useState<'paytm' | 'phonepe'>('paytm');

  useEffect(() => {
    if (!showPayment) {
      setTimeLeft(15 * 60);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [showPayment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseInt(val);
    if (val === '') {
      setError('');
    } else if (num < 200) {
      setError('Min deposit is ₹200');
    } else if (num > 50000) {
      setError('Max deposit is ₹50,000');
    } else {
      setError('');
    }
  };

  const handlePaymentSubmit = async () => {
    if (utr.length < 12) {
      setUtrError('Please enter a valid 12-digit UTR number');
      return;
    }
    
    // Create pending deposit request
    const depositNum = parseInt(amount || '0');
    const bonusNum = DEPOSIT_AMOUNTS.find(d => d.amount.toString() === amount)?.bonus || 0;
    const finalCredit = depositNum + bonusNum;
    
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone) {
      try {
        await addDoc(collection(db, 'depositRequests'), {
          userId: savedPhone,
          amount: depositNum,
          bonus: bonusNum,
          totalAmount: finalCredit,
          utr: utr,
          status: 'pending',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        onRefresh(); // Trigger parent refresh
        
        if (onAddNotification) {
          onAddNotification({
            titleEn: 'ACCOUNT RECHARGE',
            titleHi: 'खाता रिचार्ज',
            contentEn: `Your recharge request of ₹ ${depositNum.toFixed(2)} has been sent. Please wait for audit.`,
            contentHi: `आपका ₹ ${depositNum.toFixed(2)} का रिचार्ज अनुरोध भेज दिया गया है। कृपया ऑडिट की प्रतीक्षा करें।`,
            type: 'recharge_request'
          });
        }

        alert('Deposit request submitted! Please wait for admin approval.');
      } catch (e) {
        console.error('Deposit request error:', e);
        alert('Failed to submit deposit request.');
      }
    }
    
    onClose();
  };

  const selectedBonus = DEPOSIT_AMOUNTS.find(d => d.amount.toString() === amount)?.bonus || 0;
  const totalAmount = parseInt(amount || '0') + selectedBonus;

  if (showPayment) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto w-full min-h-screen bg-[#2c1012] font-sans flex flex-col mx-auto max-w-[410px] text-white">
        {/* Header */}
        <div className="sticky top-0 w-full h-[56px] bg-[#3d0f10] border-b border-white/5 flex items-center px-4 z-20 shadow-md">
          <button onClick={() => setShowPayment(false)} className="h-10 w-10 flex items-center justify-start cursor-pointer text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-white font-semibold text-[16px] flex-1 text-center font-sans tracking-tight">Payment Page</div>
          <button 
            onClick={() => setShowChat(true)}
            className="bg-[#ff4148] text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
          >
            Customer Service
          </button>
        </div>

        <div className="p-4 flex-1">
          {/* Amount Section */}
          <div className="bg-[#3d0f10] rounded-xl p-5 mb-5 shadow-lg border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[28px] font-bold text-white">₹{parseInt(amount || '0').toFixed(2)}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(amount)}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
              >
                <Copy className="h-4 w-4 text-white/50" />
              </button>
            </div>
            <div className="text-[#ff4148] font-bold text-[15px] tabular-nums tracking-tight">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-[3px] h-3 bg-[#ff4148] rounded-full"></div>
              <div className="text-[14px] font-bold text-white/90">Choose a payment method to pay</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setSelectedPayMethod('paytm')}
                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all active:scale-[0.98] relative overflow-hidden ${
                  selectedPayMethod === 'paytm' 
                  ? 'border-[#ff4148]/50 bg-[#ff4148]/10' 
                  : 'border-white/5 bg-[#3d0f10]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 z-10">
                   <img src="https://i.ibb.co/00V691G/image.png" alt="Paytm" className="w-10 h-4 object-contain" />
                   <span className="text-[13px] font-bold text-[#00baf2]">Paytm</span>
                </div>
                <div className="text-[9px] font-semibold text-white/40 z-10">Wake up support</div>
              </button>

              <button 
                onClick={() => setSelectedPayMethod('phonepe')}
                className={`flex flex-col items-center justify-center py-3 rounded-xl border transition-all active:scale-[0.98] relative overflow-hidden ${
                  selectedPayMethod === 'phonepe' 
                  ? 'border-[#ff4148]/50 bg-[#ff4148]/10' 
                  : 'border-white/5 bg-[#3d0f10]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 z-10">
                   <img src="https://i.ibb.co/DH7GQTzk/image.png" alt="PhonePe" className="w-4 h-4 object-contain" />
                   <span className="text-[13px] font-bold text-[#a259ff]">PhonePe</span>
                </div>
                <div className="text-[9px] font-semibold text-white/40 z-10">Wake up support</div>
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-[3px] h-3 bg-[#ff4148] rounded-full"></div>
              <div className="text-[14px] font-bold text-white/90">Use Mobile Scan code to pay</div>
            </div>
            
            <div className="bg-[#3d0f10] rounded-2xl p-6 border border-white/5 shadow-md text-center">
              <div className="bg-white p-4 rounded-xl shadow-inner inline-block mb-4 border border-gray-50">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`upi://pay?pa=hyysumitx@fam&am=${amount}&cu=INR`)}`}
                  alt="Payment QR Code"
                  className="w-[160px] h-[160px]"
                />
              </div>
              
              <div className="text-[12px] text-white/60 text-left space-y-1.5 max-w-[280px] mx-auto">
                <p className="flex gap-1.5">
                  <span className="font-bold">1.</span>
                  Please use another device to scan the QR code with your payment app
                </p>
                <p className="flex gap-1.5">
                  <span className="font-bold">2.</span>
                  If you scan the QR code from this device's gallery, the payment amount may be limited (≤2000).
                </p>
              </div>
            </div>
          </div>

          {/* UTR Input Section */}
          <div className="mb-6 px-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-[3px] h-3 bg-[#ff4148] rounded-full"></div>
              <div className="text-[14px] font-bold text-white/90">Input UTR/ Paste UTR</div>
            </div>
            <div className="text-[#ff4148] text-[11px] font-semibold mb-3 leading-tight">If you do not back fill UTR/ paste UTR, 100% will fail.</div>
            
            <div className="relative flex items-center">
              <input 
                type="text"
                placeholder="Input 12 digits here"
                value={utr}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setUtr(val);
                  if (val.length === 12) setUtrError('');
                }}
                className="w-full bg-[#3d0f10] rounded-full h-[44px] px-6 text-[14px] font-medium border border-white/10 focus:ring-1 focus:ring-[#ff4148]/30 transition-all text-white placeholder:text-white/20"
              />
              <button 
                onClick={async () => {
                  try {
                    const inputEl = document.querySelector('input[placeholder="Input 12 digits here"]') as HTMLInputElement;
                    if (inputEl) inputEl.focus();

                    if (!navigator.clipboard || !navigator.clipboard.readText) {
                      setUtrError('Direct paste not supported. Please long-press to paste.');
                      return;
                    }

                    const text = await navigator.clipboard.readText();
                    const cleanText = text.replace(/\D/g, '').slice(0, 12);
                    if (cleanText) {
                      setUtr(cleanText);
                      setUtrError('');
                    } else {
                      setUtrError('No valid digits found in clipboard.');
                    }
                  } catch (e: any) {
                    console.error('Failed to paste', e);
                    if (e.name === 'NotAllowedError') {
                      setUtrError('Clipboard permission denied. Please paste manually.');
                    } else {
                      setUtrError('Paste blocked. Long-press input to paste manually.');
                    }
                  }
                }}
                className="absolute right-1.5 w-[76px] h-[32px] bg-[#ff4148] text-white rounded-full font-bold text-[12px] active:scale-95 transition-transform shadow-lg"
              >
                Paste
              </button>
            </div>
            {utrError && <div className="text-[#ff4148] text-[10.5px] mt-1.5 ml-4 font-medium italic">{utrError}</div>}
          </div>

          {/* Reminder Section */}
          <div className="bg-[#3d0f10] rounded-xl p-3.5 border border-white/5 shadow-md relative mb-24 mx-1">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-[3px] h-3 bg-[#ff4148] rounded-full"></div>
              <div className="text-[12px] font-bold text-white/90 uppercase tracking-tight">Important reminder:</div>
            </div>
            <div className="text-[11px] text-white/50 space-y-0.5 font-medium leading-relaxed">
              <p>1. Do not pay for the same link repeatedly!</p>
              <p>2. Paytm is wake up support!</p>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[410px] grid grid-cols-2 gap-3 px-4 py-3 bg-[#2c1012] z-30 border-t border-white/5 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
           <button 
             onClick={() => setShowPayment(false)}
             className="bg-white/10 text-white font-bold h-[42px] rounded-full text-[13px] active:scale-95 transition-all shadow-sm"
           >
             Cancel
           </button>
           <button 
             onClick={handlePaymentSubmit}
             disabled={utr.length < 12}
             className={`font-bold h-[42px] rounded-full text-[13px] transition-all active:scale-[0.98] shadow-sm ${
               utr.length === 12 
               ? 'bg-[#ff4148] text-white' 
               : 'bg-white/5 text-white/30 cursor-not-allowed'
             }`}
           >
             Submit {utr.length < 12 ? '(UTR not entered)' : ''}
           </button>
        </div>

        <AnimatePresence>
          {showChat && (
            <SupportChat onClose={() => setShowChat(false)} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto w-full min-h-screen bg-[#2c1012] font-sans flex flex-col mx-auto max-w-[410px]">
      
      {/* Header */}
      <div className="sticky top-0 w-full h-[54px] bg-[#3d0f10] border-b border-white/5 flex items-center justify-between px-3 z-20 shadow-md">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-start cursor-pointer text-white">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="text-white font-semibold text-[17px] -ml-4">Deposit</div>
        <div className="flex items-center gap-4">
          <Headset 
            onClick={() => setShowChat(true)}
            className="h-[22px] w-[22px] text-[#ffccd1] cursor-pointer active:scale-90 transition-transform" 
          />
          <History className="h-[22px] w-[22px] text-[#ffccd1] cursor-pointer" />
        </div>
      </div>

      <div className="px-4 py-4 flex-1">
        
        {/* Balance Cards */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 rounded-[14px] bg-[#3f1618] p-3 text-white border border-white/5 shadow-md relative overflow-hidden">
            <div className="flex items-center justify-between opacity-90 text-[13px] font-medium z-10 relative">
              <span className="flex items-center gap-1">
                Cash Balance
              </span>
              <button onClick={onRefresh} className="p-1 hover:bg-white/10 rounded-full transition-colors group">
                <RefreshCw className="h-4 w-4 cursor-pointer group-active:animate-spin" />
              </button>
            </div>
            <div className="text-[#ffccd1] font-bold text-[18px] mt-1 z-10 relative flex items-center">
               <span className="text-[14px] mr-0.5">₹</span>{balance.toLocaleString('en-IN')}
            </div>
            {/* Wallet Watermark */}
            <svg className="absolute -bottom-2 -left-2 w-16 h-16 opacity-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 7V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h-3c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2h3zm-3 8h4v-6h-4v6z"/>
            </svg>
          </div>
          <div className="flex-1 rounded-[14px] bg-[#3f1618] p-3 text-white border border-white/5 shadow-md relative overflow-hidden">
            <div className="flex items-center gap-1 opacity-90 text-[13px] font-medium z-10 relative">
              Withdrawable
            </div>
            <div className="text-[#ffccd1] font-bold text-[18px] mt-1 z-10 relative flex items-center">
               <span className="text-[14px] mr-0.5">₹</span>{balance.toLocaleString('en-IN')}
            </div>
            <svg className="absolute -bottom-2 -left-2 w-16 h-16 opacity-10" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 7V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h-3c-1.1 0-2-.9-2-2v-6c0-1.1.9-2 2-2h3zm-3 8h4v-6h-4v6z"/>
            </svg>
          </div>
        </div>

        {/* Amount Input */}
        <div className="text-[#ffccd1] text-[13px] mb-2 font-medium">Deposit amount: Min: ₹200 Max: ₹50,000</div>
        
        <div className="w-full bg-[#3d0f10] rounded-[10px] h-12 flex items-center px-4 mb-3 border border-white/10">
          <span className="text-[#ffccd1] text-[16px] font-medium mr-3">₹ |</span>
          <input 
            type="number"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-[#ffccd1] text-[16px] font-medium"
          />
          {amount && (
            <button onClick={() => { setAmount(''); setError(''); }} className="h-5 w-5 rounded-full border border-white/30 flex items-center justify-center cursor-pointer text-white/50 active:scale-90">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          )}
        </div>
        {error && <div className="text-red-500 text-[12px] -mt-2 mb-3">{error}</div>}

        <div className="text-[13px] text-white/90 font-medium mb-3">
          Net Amount Received <span className="text-[#ffccd1]">₹{totalAmount > 0 ? totalAmount.toLocaleString('en-IN') : '0'}</span>
        </div>

        {/* Deposit Grid */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {DEPOSIT_AMOUNTS.map((item) => {
            const isSelected = amount === item.amount.toString();
            return (
              <div 
                key={item.amount}
                onClick={() => handleAmountChange(item.amount.toString())}
                className={`relative rounded-[8px] h-11 flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 border ${
                  isSelected 
                    ? 'border-[#ff4148]/80 text-white' 
                    : 'bg-[#3d0f10] border-transparent text-white/60'
                }`}
                style={{
                  background: isSelected ? 'linear-gradient(180deg, #ff5b61 0%, #d42a2d 100%)' : undefined
                }}
              >
                <div className="font-semibold text-[13px]">₹{item.amount.toLocaleString('en-IN')}</div>
                
                {/* Bonus Badge */}
                <div className={`absolute -top-1.5 -right-1 text-[9px] font-bold px-1 rounded-sm leading-[12px] z-10 ${
                  isSelected ? 'bg-[#ff9c5a] text-white' : 'bg-[#e24242] text-white'
                }`}>
                  +{item.bonus}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Methods */}
        <div className="text-[14px] font-semibold text-white mb-3">Payment methods <span className="text-red-500">*</span></div>
        
        <div className="grid grid-cols-2 gap-2.5 mb-8">
          {PAYMENT_METHODS.map((pay) => {
             const isSelected = method === pay.id;
             return (
              <div 
                key={pay.id}
                onClick={() => setMethod(pay.id)}
                className={`relative rounded-[8px] h-12 flex items-center px-3 cursor-pointer transition-all active:scale-95 border ${
                  isSelected 
                    ? 'border-[#ff4148]/80' 
                    : 'bg-[#3d0f10] border-transparent'
                }`}
                style={{
                  background: isSelected ? 'linear-gradient(90deg, #d42a2d 0%, #ff5b61 100%)' : undefined
                }}
              >
                {/* SVG/Custom Icon */}
                <div className={`w-[26px] h-[26px] rounded mr-2 flex items-center justify-center overflow-hidden flex-shrink-0 ${isSelected ? 'opacity-100' : 'opacity-90 grayscale-[0.2]'}`}>
                  {pay.type === 'upi1' && (
                    <div className="w-full h-full bg-white flex items-center justify-center border border-white/5 rounded overflow-hidden">
                      <img src="https://i.ibb.co/67FGmrTf/image.png" alt="UPI QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                  {pay.type === 'upi2' && (
                     <div className="w-full h-full bg-white flex items-center justify-center border border-white/5 rounded overflow-hidden">
                       <img src="https://i.ibb.co/xqhWGkSk/image.png" alt="UPI*QR" className="w-full h-full object-contain" />
                     </div>
                  )}
                  {pay.type === 'ewallet' && (
                     <div className="w-full h-full bg-[#1a1a1a] flex flex-col items-center justify-center border border-white/5 rounded relative">
                       <div className="w-[16px] h-[16px] bg-[#3ab77d] rounded-t-[7px] rounded-b-[4px] relative flex items-center justify-center overflow-hidden">
                         <div className="w-[8px] h-[10px] bg-gradient-to-br from-[#fbb533] to-[#e66c1f] rounded-[2px] transform skew-x-[-15deg] ml-[1px]"></div>
                         <div className="absolute top-[1.5px] w-[5px] h-[2.5px] bg-[#fbb533] rounded-t-full"></div>
                       </div>
                     </div>
                  )}
                  {pay.type === 'paytm' && (
                     <div className="w-full h-full bg-white flex items-center justify-center border border-white/5 rounded overflow-hidden">
                       <img src="https://i.ibb.co/00V691G/image.png" alt="Paytm" className="w-full h-full object-contain" />
                     </div>
                  )}
                  {pay.type === 'phonepe' && (
                     <div className="w-full h-full bg-white flex items-center justify-center border border-white/5 rounded overflow-hidden">
                       <img src="https://i.ibb.co/DH7GQTzk/image.png" alt="PhonePe" className="w-full h-full object-contain" />
                     </div>
                  )}
                </div>
                <span className={`text-[13px] font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>{pay.name}</span>
                
                {isSelected && (
                  <div className="absolute right-0 bottom-0 bg-[#ff9c5a] rounded-tl-[8px] rounded-br-[6px] h-5 w-5 flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
                
                {pay.recommend && (
                  <div className="absolute -top-2 -left-1 text-[16px]">
                    👍
                  </div>
                )}
              </div>
             );
          })}
        </div>

        {/* Tips section */}
        <div className="text-white/80 text-[13px] leading-[1.6]">
          <div className="font-semibold mb-2 text-[14px]">Deposit tips:</div>
          <p className="mb-3">1.Each deposit will be credited within 1-5 minutes</p>
          <p className="mb-3">2.After the payment is successful, please return to the Neon Trade deposit page to check your account balance.</p>
          <p className="mb-4">3.If your deposit does not arrive within 30 minutes, please contact customer service for help.</p>

          <div className="font-semibold mb-1 text-[14px]">Important notes:</div>
          <p>Please do not modify the payment amount. Avoid reusing saved QR codes or UPI accounts for multiple payments.</p>
        </div>

        {/* Bottom spacer */}
        <div className="h-24" />

      </div>

      {/* Sticky Bottom button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[410px] px-4 py-4 bg-[#2c1012] z-30">
         <button 
           onClick={() => !error && amount && setShowPayment(true)}
           disabled={!!error || !amount}
           className={`w-full font-bold py-3.5 rounded-full text-[15px] shadow-md transition-all active:scale-95 cursor-pointer ${
             !!error || !amount 
             ? 'bg-gray-600 text-white/50 cursor-not-allowed' 
             : 'bg-[#ff4148] hover:bg-[#d42a2d] text-white'
           }`}
         >
           Pay now
         </button>
      </div>

      <AnimatePresence>
        {showChat && (
          <SupportChat onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
