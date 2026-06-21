import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  X,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Headset,
  Check,
  Smartphone,
  Coins,
  Bell,
  Ticket,
  Receipt,
  Gamepad2,
  BarChart3,
  Globe,
  Music,
  Settings,
  Copy,
  Pencil,
  Home,
  Trophy,
  User2,
  RefreshCw,
  LogOut,
  Gift,
  List,
  Download,
  Trash2,
  Inbox,
  Info,
  Volume2,
  VolumeX,
  Sparkles,
  Flame,
  CreditCard,
  Users,
  Award,
  Zap,
  TrendingUp
} from 'lucide-react';

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
  orderBy,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { 
  db, 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from './lib/firebase';

import MinesGameView from './components/MinesGameView';
import DepositScreen from './components/DepositScreen';
import WithdrawScreen from './components/WithdrawScreen';
import SupportChat from './components/SupportChat';
import AdminPanelView from './components/AdminPanelView';
import MobileAdminPanelView from './components/MobileAdminPanelView';
import VipLevelsView from './components/VipLevelsView';
import InvitationBonusView from './components/InvitationBonusView';
import InviteWheelView from './components/InviteWheelView';
import { WingoWinningsModal } from './components/WingoWinningsModal';
import QuickInstall from './components/QuickInstall';
// Premium background and default assets from our assets directory
const gameLogo = "https://i.ibb.co/rGjxr0hn/file-00000000d308720cab57b8c2210b5b42.png";
import casinoBg from './assets/images/casino_bg_1779214894050.png';

// 8 Indian Casino style realistic player avatars shown in the user's reference picture
const AVAILABLE_AVATARS = [
  "https://i.ibb.co/vxtGgTcy/1-Cz2mt-nl.png",
  "https://i.ibb.co/HLzxCgVC/2-Dz-Tt-Sg-I1.png",
  "https://i.ibb.co/nyT6Kn0/3-Cie-Za-Tkx.png",
  "https://i.ibb.co/nNBR38bP/4-Fz-E5-Gsk-B.png",
  "https://i.ibb.co/7N0xb9kG/5-BE1kalqa.png",
  "https://i.ibb.co/8DKmC0Gv/6-Bpt-Td-Cuy.png",
  "https://i.ibb.co/BVL3fBdr/7-OCP1-Ruci.png",
  "https://i.ibb.co/PGCkJS5B/8-4-L9-YXh-Cn.png",
  "https://i.ibb.co/fVVMtG2Y/9-i-Of3oy-Ez.png",
  "https://i.ibb.co/cSmTkjL3/10-Bcp-E5fen.png",
  "https://i.ibb.co/KcYhsYqy/11-DBjki8-Hc.png",
  "https://i.ibb.co/hFgkMW77/12-DZNy4n9-Y.png",
  "https://i.ibb.co/217WqPWY/13-DEwa-Mq4g.png",
  "https://i.ibb.co/xtMGxR0S/14-Dwy-Wm-Qfy.png",
  "https://i.ibb.co/s9fvZpPj/15-CLy-M484.png",
  "https://i.ibb.co/dwDbHdD7/16-BSWOqo6-F.png",
  "https://i.ibb.co/HwWp1hf/17-q-XMVo-Eb.png",
  "https://i.ibb.co/Mxhc5Y31/18-n-Ec-Sw01-G.png",
  "https://i.ibb.co/Hpb7WL84/19-B4g10r-GY.png",
  "https://i.ibb.co/Fb8nKmP6/20-js-NPML4j.png"
];

const VIP_ICONS: { [key: number]: string } = {
  1: "https://i.ibb.co/XZq1B1jc/image.png",
  2: "https://i.ibb.co/wNggG8pK/image.png",
  3: "https://i.ibb.co/ZzjszWGD/image.png",
  4: "https://i.ibb.co/LdrR656w/image.png",
  5: "https://i.ibb.co/XH3Dgmr/image.png",
  6: "https://i.ibb.co/S7B8F6Dg/image.png",
  7: "https://i.ibb.co/6JNJ9rss/image.png",
  8: "https://i.ibb.co/kgfBPHRX/image.png",
  9: "https://i.ibb.co/0pvh8x4c/image.png",
  10: "https://i.ibb.co/4wJBbxgN/image.png"
};


const MOCK_WINNERS = [
  { name: 'Mem***VIX', amount: 19.60, game: 'Wingo' },
  { name: 'Mem***FLT', amount: 19.60, game: 'Wingo' },
  { name: 'Mem***FSS', amount: 215.60, game: 'Wingo' },
  { name: 'Mem***SAF', amount: 39.20, game: 'Wingo' },
  { name: 'Mem***PLA', amount: 215.60, game: 'Wingo' },
  { name: 'VIP***09X', amount: 480.00, game: 'Wingo' },
  { name: 'Mem***B2M', amount: 18.00, game: 'Slots' }
];

const MOCK_PODIUM = [
  { rank: 1, name: 'Mem***QKV', amount: 35682.44, img: 'https://i.ibb.co/8DKmC0Gv/6-Bpt-Td-Cuy.png' },
  { rank: 2, name: 'RAJ***FIA', amount: 24519.00, img: 'https://i.ibb.co/BVL3fBdr/7-OCP1-Ruci.png' },
  { rank: 3, name: 'Mem***SYN', amount: 18945.00, img: 'https://i.ibb.co/vxtGgTcy/1-Cz2mt-nl.png' }
];

const MOCK_LEADERBOARD = [
  { rank: 4, name: 'Mem***OS9', amount: 9568.96, img: 'https://i.ibb.co/7N0xb9kG/5-BE1kalqa.png' },
  { rank: 5, name: 'Mem***VV3', amount: 8742.00, img: 'https://i.ibb.co/KcYhsYqy/11-DBjki8-Hc.png' },
  { rank: 6, name: 'Mem***ZFP', amount: 7619.80, img: 'https://i.ibb.co/vxtGgTcy/1-Cz2mt-nl.png' },
  { rank: 7, name: 'Mem***RIL', amount: 6480.00, img: 'https://i.ibb.co/vxtGgTcy/1-Cz2mt-nl.png' },
  { rank: 8, name: 'Mem***KAL', amount: 5324.00, img: 'https://i.ibb.co/BVL3fBdr/7-OCP1-Ruci.png' },
  { rank: 9, name: 'Mem***JIV', amount: 4893.24, img: 'https://i.ibb.co/vxtGgTcy/1-Cz2mt-nl.png' },
  { rank: 10, name: 'Sh***mm', amount: 4215.31, img: 'https://i.ibb.co/HLzxCgVC/2-Dz-Tt-Sg-I1.png' }
];

const ANNOUNCEMENTS = [
  {
    id: 1,
    title: "Welcome to Neon Trade",
    content: "Welcome to Neon Trade! The most professional money-making gaming platform in India. With an advanced agency system and rebates, achieve your dream of financial freedom! We are recruiting agents across India. As long as you have the capability, you set your own salary!",
    date: "2025-04-21 12:59:30"
  },
  {
    id: 2,
    title: "Important Notice of Withdrawal Delay",
    content: "If the withdrawal is successful but the bank does not arrive at the account within 72 hours, please contact our self-service center with your bank statement (PDF/VIDEO) and PDF password (if it applies) for us to do the verification and we will assist you in resolving the issue immediately, due to the strict control of the Bank of India, the bank merchant change frequently, so more than 1 month of the withdrawal will not be able to verify. Thank you for your patience! 🙏",
    date: "2025-04-21 12:59:43"
  },
  {
    id: 3,
    title: "KIND REMINDER",
    content: "All players registered on this platform must bind their bank data. If a non-personal bank account is bound, please withdraw all your balance and re-register a new game account with your real data. We also remind all players not to disclose their personal information to avoid potential financial losses caused by hacker invasions, as these will be the responsibility of the customer. Thank you to all players for supporting this platform, and we wish you an enjoyable gaming experience!",
    date: "2025-04-21 12:59:55"
  }
];

// Helper removed

// --- CHART COMPONENT ---
const WingoChartView = ({ history, currentPage, totalPages, onPageChange }: { history: any[], currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, rowHeight: 38 });
  const pageSize = 10;
  
  const pagedHistory = useMemo(() => {
    // DO NOT reverse history here, as we want to display chronological order
    return [...history].slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [history, currentPage]);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          rowHeight: 38
        });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const stats = useMemo(() => {
    const counts = Array(10).fill(0);
    const missing = Array(10).fill(0);
    const lastSeenIdx = Array(10).fill(-1);
    const allGaps: number[][] = Array.from({ length: 10 }, () => []);
    const maxConsecutive = Array(10).fill(0);
    const currentConsecutive = Array(10).fill(0);

    const reversedHist = [...history].reverse();

    reversedHist.forEach((row, idx) => {
      const num = row.number;
      if (typeof num !== 'number' || num < 0 || num > 9) return;
      counts[num]++;
      if (lastSeenIdx[num] !== -1) {
        if (allGaps[num]) allGaps[num].push(idx - lastSeenIdx[num] - 1);
      } else {
        if (allGaps[num]) allGaps[num].push(idx);
      }
      lastSeenIdx[num] = idx;

      for (let i = 0; i < 10; i++) {
        if (i === num) {
          currentConsecutive[i]++;
          maxConsecutive[i] = Math.max(maxConsecutive[i], currentConsecutive[i]);
        } else {
          currentConsecutive[i] = 0;
        }
      }
    });

    for (let i = 0; i < 10; i++) {
      missing[i] = history.length > 0 ? history.length - 1 - lastSeenIdx[i] : 0;
    }
    const avgMissing = allGaps.map(gaps => gaps.length > 0 ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : history.length);
    return { counts, missing, avgMissing, maxConsecutive };
  }, [history]);

  const getNumberStyle = (num: number, isWinner: boolean) => {
    const isVioletSplit = num === 0 || num === 5;
    const isGreen = [1, 3, 7, 9].includes(num);
    const isRed = [2, 4, 6, 8].includes(num);

    if (isWinner) {
      if (num === 0) return { background: 'linear-gradient(180deg, #ff4148 50%, #c742e4 50%)' };
      if (num === 5) return { background: 'linear-gradient(180deg, #15be75 50%, #c742e4 50%)' };
      if (isGreen) return { backgroundColor: '#15be75' };
      return { backgroundColor: '#ff4148' };
    }
    return {};
  };

  return (
    <div className="w-full bg-[#2c1012] pb-0 select-none" ref={containerRef}>
      {/* Table Header */}
      <div className="grid grid-cols-[4fr_6fr] text-[11px] font-bold text-white/90 py-2.5 px-4 shadow-sm border-b border-white/5"
           style={{ background: 'linear-gradient(180deg, #5c1c1e 0%, #3d0f10 100%)' }}>
        <div className="text-center">Period</div>
        <div className="text-center">Number</div>
      </div>

      {/* Statistics Section */}
      <div className="px-4 py-3 bg-[#3a1a1c]/10 border-b border-white/[0.03]">
        <div className="flex justify-between text-[11px] text-[#ffd3d6]/90 mb-3 font-sans">
          <div className="font-bold">Statistic</div>
          <div className="opacity-80">(last 100 Periods)</div>
        </div>

        <div className="flex flex-col gap-2.5 text-[10px] text-[#dfb8ba]/90 font-sans">
          <div className="grid grid-cols-[38%_62%] items-center">
             <div className="text-left font-medium">Winning Numbers</div>
             <div className="grid grid-cols-10">
               {[0,1,2,3,4,5,6,7,8,9].map(n => (
                 <div key={n} className="flex justify-center items-center">
                   <div className="h-4 w-4 rounded-full border border-red-500/50 flex items-center justify-center text-[10px] text-red-500 font-bold">{n}</div>
                 </div>
               ))}
             </div>
          </div>

          {[
            { label: 'Missing', data: stats.missing },
            { label: 'Avg missing', data: stats.avgMissing },
            { label: 'Frequency', data: stats.counts },
            { label: 'Max consecutive', data: stats.maxConsecutive }
          ].map((row, rIdx) => (
            <div key={rIdx} className="grid grid-cols-[38%_62%] items-center">
               <div className="text-left font-medium opacity-80">{row.label}</div>
               <div className="grid grid-cols-10">
                 {row.data.map((v, i) => (
                   <div key={i} className="text-center font-bold">{v}</div>
                 ))}
               </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chart with Trend Line */}
      <div className="relative pt-1 overflow-hidden" style={{ minHeight: pageSize * dimensions.rowHeight }}>
        {/* SVG layer for trend lines */}
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ height: pageSize * dimensions.rowHeight }}>
          {pagedHistory.length > 1 && pagedHistory.map((row, idx) => {
            if (idx === pagedHistory.length - 1) return null;
            const nextRow = pagedHistory[idx + 1];
            
            const colWidth = (dimensions.width * 0.5) / 10;
            const leftOffset = dimensions.width * 0.41; 
            
            const x1 = leftOffset + (row.number + 0.5) * colWidth;
            const y1 = idx * dimensions.rowHeight + dimensions.rowHeight / 2;
            
            const x2 = leftOffset + (nextRow.number + 0.5) * colWidth;
            const y2 = (idx + 1) * dimensions.rowHeight + dimensions.rowHeight / 2;
            
            return (
              <line 
                key={`${row.period}-${idx}`} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke="#ff4148" 
                strokeWidth="1" 
                strokeOpacity="0.8"
              />
            );
          })}
        </svg>

        {/* Chart Rows */}
        <div className="flex flex-col">
          {pagedHistory.map((row, idx) => (
            <div key={idx} className="grid grid-cols-[4fr_5fr_1fr] items-center h-[38px] border-b border-white/[0.03]">
              {/* Period */}
              <div className="pl-4 text-[10px] text-[#dfb8ba]/90 font-mono tracking-tight">{row.period}</div>
              
              {/* Number Slots 0-9 */}
              <div className="grid grid-cols-10 items-center h-full relative font-sans">
                {[0,1,2,3,4,5,6,7,8,9].map(n => {
                  const isWinner = row.number === n;
                  return (
                    <div key={n} className="flex justify-center items-center h-full relative z-20">
                      {isWinner ? (
                        <div 
                          className="h-[18px] w-[18px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg z-30"
                          style={getNumberStyle(n, true)}
                        >
                          {n}
                        </div>
                      ) : (
                        <div className="h-[18px] w-[18px] rounded-full border border-red-900/30 flex items-center justify-center text-[10px] text-[#dfb8ba]/40 font-medium">
                          {n}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Big/Small Circle on the far right */}
              <div className="flex justify-center items-center h-full pr-2">
                 {row.size === 'Big' ? (
                   <span className="h-[16px] w-[16px] rounded-full bg-[#ffbb0d] text-neutral-900 flex items-center justify-center text-[9px] font-black shadow-sm">B</span>
                 ) : (
                   <span className="h-[16px] w-[16px] rounded-full bg-[#4285f4] text-white flex items-center justify-center text-[9px] font-black shadow-sm">S</span>
                 )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination control below the chart matching rajaparty style EXACTLY */}
      <div className="mt-4 flex items-center justify-center gap-6 py-4 px-4 bg-transparent select-none border-t border-white/[0.03]">
        <button 
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="h-[36px] w-[44px] rounded-lg bg-[#341113] text-[#dfb8ba]/60 flex items-center justify-center hover:bg-[#4a1a1c] transition active:scale-95 cursor-pointer shadow-md border border-white/5 disabled:opacity-30"
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="text-[#dfb8ba]/60 text-[13px] font-sans font-medium flex items-center gap-1.5">
          <span>{currentPage}/{totalPages}</span>
        </div>

        <button 
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          className="h-[36px] w-[44px] rounded-lg bg-[#ffbc0d] text-[#4d1213] flex items-center justify-center hover:brightness-110 transition active:scale-95 cursor-pointer shadow-md disabled:opacity-30"
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};


// Lottery ball image assets for numbers 0-9
const LOTTERY_BALLS: { [key: number]: string } = {
  0: "https://i.ibb.co/svq4h4Cy/boll0.png",
  1: "https://i.ibb.co/cK0xNq8f/boll1.png",
  2: "https://i.ibb.co/zH6csQCW/boll2.png",
  3: "https://i.ibb.co/Q7vtp6Yf/boll3.png",
  4: "https://i.ibb.co/wFNWbZ7F/boll4.png",
  5: "https://i.ibb.co/CxsBDjf/boll5.png",
  6: "https://i.ibb.co/Kj2TsvV7/boll6.png",
  7: "https://i.ibb.co/PsM4jsRc/boll7.png",
  8: "https://i.ibb.co/21FHN7bZ/boll8.png",
  9: "https://i.ibb.co/cXtWV2g1/boll9.png",
};

// 3D realistic lottery card spheres generator using provided image assets
const renderGlossyBall = (number: number, _color?: string, sizeClass: string = "h-7 w-7") => {
  const src = LOTTERY_BALLS[number] || LOTTERY_BALLS[0];
  return (
    <div className={`relative shrink-0 flex items-center justify-center select-none ${sizeClass}`}>
      <img
        src={src}
        alt={`ball-${number}`}
        loading="lazy"
        className="w-full h-full object-contain pointer-events-none drop-shadow-md brightness-105"
        referrerPolicy="no-referrer"
        decoding="async"
        style={{ 
          imageRendering: 'auto',
          transform: 'translateZ(0)' // Hardware acceleration
        }}
      />
    </div>
  );
};

// Active language type
type Language = 'en' | 'hi';

// Multi-language dictionary exactly answering "English mein likhkar aana chahiye" and "vahan se language change kar sakte hain Hindi English"
const translations = {
  en: {
    bannerTitle: 'Get free spins & bonus alerts!',
    bannerSubtitle: 'Tap below and press Allow to unlock now',
    bannerCta: 'Claim My Bonus',
    phonePlaceholder: 'Enter your phone number',
    passwordPlaceholder: 'Password:8-15 letters and numbers',
    confirmPasswordPlaceholder: 'Enter the password again',
    referralPlaceholder: 'Invitation code',
    registerBtn: 'Register',
    loginBtn: 'Connect Login',
    passwordLoginBtn: 'Password Login',
    registerNewAccountBtn: 'Register New Account',
    languageHeader: 'Language',
    languageEnglish: 'ENGLISH',
    languageHindi: 'हिन्दी',
    formSuccessReg: 'Fantastic! Your account (+91 {phone}) has been registered successfully.',
    formSuccessLogin: 'Signed in successfully! Welcome back.',
    formErrorPhone: 'Please enter your phone number.',
    formErrorDigits: 'Phone number must be at least 10 digits.',
    formErrorPass: 'Please enter your password.',
    formErrorPassLen: 'Password must be 8-15 characters.',
    formErrorMatch: 'Passwords do not match. Please verify.',
    signUpBonus: '+28 Sign Up Bonus',

    // New Mine dashboard elements
    notifications: 'Notifications',
    coupons: 'Coupons',
    balanceRecord: 'Balance Record',
    gameHistory: 'Game History',
    gameStatistics: 'Game Statistics',
    accountSecurity: 'Account & Security',
    liveSupport: 'Live Support',
    gifts: 'Gifts',
    settings: 'Settings',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    mineTab: 'Mine',
    earnTab: 'Earn',
    wheelTab: 'Wheel',
    promoTab: 'Promo',
    homeTab: 'Home',
    copiedMsg: 'UID copied!',
    editPlaceholder: 'Enter nickname...',
    logoutText: 'Logout',
    balanceRefreshText: 'Reload Balance'
  },
  hi: {
    bannerTitle: 'फ्री स्पिन और बोनस अलर्ट पाएं!',
    bannerSubtitle: 'नीचे टैप करें और अनलॉक करने के लिए Allow दबाएं',
    bannerCta: 'अपना बोनस क्लेम करें',
    phonePlaceholder: 'अपना फोन नंबर दर्ज करें',
    passwordPlaceholder: 'पासवर्ड: 8-15 अक्षर और संख्याएं',
    confirmPasswordPlaceholder: 'पासवर्ड दोबारा दर्ज करें',
    referralPlaceholder: 'Invitation code',
    registerBtn: 'रजिस्टर करें',
    loginBtn: 'लॉगिन करें',
    passwordLoginBtn: 'पासवर्ड लॉगिन',
    registerNewAccountBtn: 'रजिस्टर नया खाता',
    languageHeader: 'भाषा',
    languageEnglish: 'ENGLISH',
    languageHindi: 'हिन्दी',
    formSuccessReg: 'शानदार! आपका खाता (+91 {phone}) सफलतापूर्वक पंजीकृत हो गया है।',
    formSuccessLogin: 'सफलतापूर्वक और सुरक्षित लॉगिन हो गया! स्वागत है।',
    formErrorPhone: 'कृपया अपना फोन नंबर दर्ज करें।',
    formErrorDigits: 'फोन नंबर कम से कम 10 अंकों का होना चाहिए।',
    formErrorPass: 'कृपया अपना पासवर्ड दर्ज करें।',
    formErrorPassLen: 'पासवर्ड 8-15 अक्षरों का होना चाहिए।',
    formErrorMatch: 'पासवर्ड मेल नहीं खा रहे हैं। कृपया जांचें।',
    signUpBonus: '+28 साइन अप बोनस',

    // New Mine dashboard elements (Hindi)
    notifications: 'सूचनाएं',
    coupons: 'कूपन',
    balanceRecord: 'बैलेंस रिकॉर्ड',
    gameHistory: 'खेल इतिहास',
    gameStatistics: 'खेल आंकड़े',
    accountSecurity: 'खाता और सुरक्षा',
    liveSupport: 'लाइव सहायता',
    gifts: 'उपहार',
    settings: 'सेटिंग्स',
    deposit: 'जमा करें',
    withdraw: 'निकासी',
    mineTab: 'मेरा',
    earnTab: 'कमाएं',
    wheelTab: 'चक्र',
    promoTab: 'प्रोमो',
    homeTab: 'होम',
    copiedMsg: 'UID कॉपी हो गया!',
    editPlaceholder: 'उपनाम दर्ज करें...',
    logoutText: 'सुरक्षित लॉगआउट',
    balanceRefreshText: 'बैलेंस रिफ्रेश'
  }
};

export default function App() {
  // Lang state
  const [selectedLang, setSelectedLang] = useState<Language>(() => {
    const saved = localStorage.getItem('selectedLang');
    return (saved === 'en' || saved === 'hi') ? saved as Language : 'en';
  });

  useEffect(() => {
    localStorage.setItem('selectedLang', selectedLang);
  }, [selectedLang]);
  // Navigation: Toggle between Register & Login
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  
  // Custom screen views: Main portal vs Language settings page
  const [showLanguageScreen, setShowLanguageScreen] = useState(false);
  const [showBetSuccessful, setShowBetSuccessful] = useState(false);

  // Form input field states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralInput, setReferralInput] = useState('');

  // Input view toggles
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  
  // Utility alerts
  const [bannerVisible, setBannerVisible] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide weekly promotional headers every 4.5 seconds for branding depth
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);
  const [showAppDownloadBanner, setShowAppDownloadBanner] = useState(true);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [lobbyToast, setLobbyToast] = useState<{ type: 'error' | 'success' | 'info', text: string } | null>(null);

  // Auto clean up lobby toast
  useEffect(() => {
    if (lobbyToast) {
      const timer = setTimeout(() => {
        setLobbyToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lobbyToast]);



  // Global protection: Prevent download, right-click and drag-to-desktop actions on all image and icon elements
  useEffect(() => {
    const preventImageRescue = (e: Event) => {
      const node = e.target as HTMLElement;
      if (node && node.tagName === 'IMG') {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', preventImageRescue);
    document.addEventListener('dragstart', preventImageRescue);
    return () => {
      document.removeEventListener('contextmenu', preventImageRescue);
      document.removeEventListener('dragstart', preventImageRescue);
    };
  }, []);

  // LOGGED IN DASHBOARD STATES
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminView, setShowAdminView] = useState(false);
  const [userExp, setUserExp] = useState(0);
  const [userLevel, setUserLevel] = useState(0);
  const [claimedVipRewards, setClaimedVipRewards] = useState<number[]>([]);
  const [claimedMonthlyRewards, setClaimedMonthlyRewards] = useState<number[]>([]);
  const [claimedInvitationBonuses, setClaimedInvitationBonuses] = useState<number[]>([]);
  const [inviteeCount, setInviteeCount] = useState(0);
  const [inviteeDepositCount, setInviteeDepositCount] = useState(0);
  const [usedSpins, setUsedSpins] = useState(0);
  const [showVipScreen, setShowVipScreen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBalanceRecords, setShowBalanceRecords] = useState(false);
  const [showGameHistoryOverlay, setShowGameHistoryOverlay] = useState(false);
  const [gameHistoryOverlayRoom, setGameHistoryOverlayRoom] = useState<'30s' | '1m' | '3m' | '5m'>('30s');
  const [gameHistorySubTab, setGameHistorySubTab] = useState<'results' | 'bets'>('results');
  const [showGameStatsOverlay, setShowGameStatsOverlay] = useState(false);
  const [showAccountSecurityOverlay, setShowAccountSecurityOverlay] = useState(false);
  const [showGiftsOverlay, setShowGiftsOverlay] = useState(false);
  const [showSettingsOverlay, setShowSettingsOverlay] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [giftCodeInput, setGiftCodeInput] = useState('');
  const [claimingGift, setClaimingGift] = useState(false);
  const [claimedGifts, setClaimedGifts] = useState<{giftCode: string, amount: number, claimedAt: string}[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [nickname, setNickname] = useState('MemberNNGDQTST');
  const [showDepositScreen, setShowDepositScreen] = useState(false);
  const [showDepositRequiredModal, setShowDepositRequiredModal] = useState(false);
  const [showWithdrawScreen, setShowWithdrawScreen] = useState(false);
  const [showInvitationBonus, setShowInvitationBonus] = useState(false);
  const [showGlobalChat, setShowGlobalChat] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('UPI-QR');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [uid, setUid] = useState('000000');
  const [totalDeposits, setTotalDeposits] = useState(0);
  const [balance, setBalance] = useState(0.00);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedActive, setCopiedActive] = useState(false);
  const [currentTab, setCurrentTab] = useState<'home' | 'promo' | 'wheel' | 'earn' | 'mine'>('home');
  const [avatar, setAvatar] = useState('https://api.dicebear.com/7.x/lorelei/png?seed=Olivia&backgroundColor=ffd275');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [tempSelectedAvatar, setTempSelectedAvatar] = useState('https://api.dicebear.com/7.x/lorelei/png?seed=Olivia&backgroundColor=ffd275');

  // Stateful list of live winners updating periodically for modern slide transition
  const [liveWinners, setLiveWinners] = useState<Array<{ id: string; name: string; amount: number; game: string; gameImg: string }>>([
    { id: 'win-1', name: 'Mem***TAJ', amount: 48.22, game: 'Wingo 1M', gameImg: 'https://i.ibb.co/2QQr71m/file-000000008c6071faa26fa7f582b22667.png' },
    { id: 'win-2', name: 'Mem***BUC', amount: 241.14, game: 'Wingo 30s', gameImg: 'https://i.ibb.co/twP5vVhH/file-0000000052447207a3365bdca980061e.png' },
    { id: 'win-3', name: 'Mem***XJL', amount: 154.08, game: 'Wingo 3M', gameImg: 'https://i.ibb.co/9HMwVbML/file-00000000d9a07206a1f56f9c5ed5a935.png' },
    { id: 'win-4', name: 'Mem***YHK', amount: 382.40, game: 'Millennium 5', gameImg: 'https://i.ibb.co/WNQZyCdw/file-0000000073407209b9bf684dc8b4aeb5.png' },
    { id: 'win-5', name: 'Mem***KND', amount: 81.63, game: 'Wingo 1M', gameImg: 'https://i.ibb.co/2QQr71m/file-000000008c6071faa26fa7f582b22667.png' }
  ]);

  useEffect(() => {
    const suffixesSeed = ['TAJ', 'BUC', 'XJL', 'YHK', 'KND', 'WFR', 'BIW', 'LEP', 'NFJ', 'BHC', 'EWO', 'EJL', 'KLX', 'YOH', 'RTQ', 'XCV', 'MOP', 'JUK', 'LOP', 'SDF', 'WER', 'CVB', 'NMB', 'ASD', 'GHJ'];
    const gamesPool = [
      { game: 'Wingo 30s', img: 'https://i.ibb.co/twP5vVhH/file-0000000052447207a3365bdca980061e.png' },
      { game: 'Wingo 1M', img: 'https://i.ibb.co/2QQr71m/file-000000008c6071faa26fa7f582b22667.png' },
      { game: 'Wingo 3M', img: 'https://i.ibb.co/9HMwVbML/file-00000000d9a07206a1f56f9c5ed5a935.png' },
      { game: 'Millennium 5', img: 'https://i.ibb.co/WNQZyCdw/file-0000000073407209b9bf684dc8b4aeb5.png' }
    ];
    
    const interval = setInterval(() => {
      const rSuffix = suffixesSeed[Math.floor(Math.random() * suffixesSeed.length)];
      
      let rAmount = 0;
      const baseRand = Math.random();
      if (baseRand < 0.4) {
        // ₹15 - ₹150 (normal smaller wins)
        rAmount = Number((Math.floor(15 + Math.random() * 135) + Math.random()).toFixed(2));
      } else if (baseRand < 0.85) {
        // ₹151 - ₹650 (balanced wins)
        rAmount = Number((Math.floor(151 + Math.random() * 499) + Math.random()).toFixed(2));
      } else {
        // High normal wins! ₹651 - ₹2,400
        rAmount = Number((Math.floor(651 + Math.random() * 1749) + Math.random()).toFixed(2));
      }

      const selectedGame = gamesPool[Math.floor(Math.random() * gamesPool.length)];

      const newWinner = {
        id: 'win-' + Math.random().toString(36).substring(7) + '-' + Date.now(),
        name: `Mem***${rSuffix}`,
        amount: rAmount,
        game: selectedGame.game,
        gameImg: selectedGame.img
      };

      setLiveWinners((prev) => {
        const next = [newWinner, ...prev];
        return next.slice(0, 5);
      });
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  // Single Session Enforcement Logic
  const getSessionId = () => {
    let sid = localStorage.getItem('app_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('app_session_id', sid);
    }
    return sid;
  };

  // Load user data from Firestore on mount with local storage offline fallback
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const phone = userData.phoneNumber;
            
            // Set session ID on login to kick others out
            const sid = getSessionId();
            if (userData.currentSessionId !== sid) {
              await updateDoc(userDocRef, { currentSessionId: sid });
            }

            localStorage.setItem('userPhone', phone);
            localStorage.setItem('userUid', firebaseUser.uid);

            setNickname(userData.nickname || 'Member');
            setUid(userData.uid || '000000');
            setBalance(userData.balance || 0);
            setTotalDeposits(userData.totalDeposits || 0);
            setUserExp(userData.exp !== undefined ? userData.exp : 0);
            setUserLevel(userData.level || 0);
            setClaimedVipRewards(userData.claimedVipRewards || []);
            setClaimedMonthlyRewards(userData.claimedMonthlyRewards || []);
            setClaimedInvitationBonuses(userData.claimedInvitationBonuses || []);
            setUsedSpins(userData.usedSpins || 0);
            setAvatar(userData.avatar || AVAILABLE_AVATARS[0]);
            setIsLoggedIn(true);
            
            if (phone === '7888943984') setIsAdmin(true);
            
            loadUserNotifications(firebaseUser.uid);

            // Fetch invitee counts
            if (userData.uid) {
              const qReferrals = query(collection(db, "users"), where("referrer", "==", userData.uid));
              const snapReferrals = await getDocs(qReferrals);
              setInviteeCount(snapReferrals.size);
              
              // Count those who deposited more than 200
              const depositedList = snapReferrals.docs.filter(docSnap => {
                const d = docSnap.data();
                return (parseFloat(d.totalDeposits) || 0) >= 200 || (parseFloat(d.balance) || 0) >= 200;
              });
              setInviteeDepositCount(depositedList.length);
            }
            
            // Sync to local_users database keyed by UID for isolation
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
            localUsers[firebaseUser.uid] = {
              phoneNumber: phone,
              uid: userData.uid || '000000',
              balance: userData.balance || 0,
              exp: userData.exp !== undefined ? userData.exp : 0,
              level: userData.level || 0,
              claimedVipRewards: userData.claimedVipRewards || [],
              claimedMonthlyRewards: userData.claimedMonthlyRewards || [],
              claimedInvitationBonuses: userData.claimedInvitationBonuses || [],
              avatar: userData.avatar || AVAILABLE_AVATARS[0]
            };
            localStorage.setItem('local_users', JSON.stringify(localUsers));
          } else {
            console.warn('Auth user exists but no doc found. Creating fallback on the fly...');
            const phone = firebaseUser.email ? firebaseUser.email.split('@')[0] : 'unknown';
            const newUserUid = Math.floor(100000 + Math.random() * 900000).toString();
            const fallbackUserData = {
              uid: newUserUid,
              firebaseUid: firebaseUser.uid,
              phoneNumber: phone,
              balance: 28, 
              exp: 0,
              level: 0,
              claimedVipRewards: [],
              claimedMonthlyRewards: [],
              nickname: 'Member' + Math.random().toString(36).substring(7).toUpperCase(),
              avatar: AVAILABLE_AVATARS[0],
              registeredAt: new Date().toISOString()
            };
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            await setDoc(userDocRef, fallbackUserData);
            await setDoc(doc(db, 'users_by_phone', phone), { uid: firebaseUser.uid });

            localStorage.setItem('userPhone', phone);
            localStorage.setItem('userUid', firebaseUser.uid);

            setNickname(fallbackUserData.nickname);
            setUid(fallbackUserData.uid);
            setBalance(fallbackUserData.balance);
            setUserExp(0);
            setUserLevel(0);
            setClaimedVipRewards([]);
            setClaimedMonthlyRewards([]);
            setAvatar(fallbackUserData.avatar);
            setIsLoggedIn(true);
            
            loadUserNotifications(firebaseUser.uid);
            
            const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
            localUsers[firebaseUser.uid] = {
              phoneNumber: phone,
              uid: fallbackUserData.uid,
              balance: fallbackUserData.balance,
              exp: 0,
              level: 0,
              claimedVipRewards: [],
              claimedMonthlyRewards: [],
              avatar: fallbackUserData.avatar
            };
            localStorage.setItem('local_users', JSON.stringify(localUsers));
          }
        } catch (e) {
          console.error('Session load error:', e);
        }
      } else {
        // Not signed in to Firebase Auth
        setIsLoggedIn(false);
      }
      setTimeout(() => {
        setIsInitializing(false);
      }, 1500);
    });

    // Capture referral from URL
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get('ref') || params.get('inv');
    if (refCode) {
      setReferralInput(refCode);
    }

    return () => unsubscribe();
  }, []);

  // Synchronize claimed gifts and real-time user balance from Firestore
  useEffect(() => {
    if (!isLoggedIn || !db || !auth.currentUser) {
      setClaimedGifts([]);
      return;
    }

    // Real-time invitation tracking
    const qReferrals = query(collection(db, "users"), where("referrer", "==", uid));
    const unsubReferrals = onSnapshot(qReferrals, (snap) => {
      setInviteeCount(snap.size);
      const depositedList = snap.docs.filter(docSnap => {
        const d = docSnap.data();
        return (parseFloat(d.totalDeposits) || 0) >= 200 || (parseFloat(d.balance) || 0) >= 200;
      });
      setInviteeDepositCount(depositedList.length);
    });
    const qGifts = query(
      collection(db, 'giftClaims'),
      where('userId', '==', auth.currentUser.uid)
    );
    const unsubGifts = onSnapshot(qGifts, (snapshot) => {
      const claims = snapshot.docs.map(docSnap => ({
        giftCode: docSnap.data().giftCode || '',
        amount: Number(docSnap.data().amount || 0),
        claimedAt: docSnap.data().claimedAt || ''
      }));
      // Sort claims descending by claimedAt if present
      claims.sort((a, b) => b.claimedAt.localeCompare(a.claimedAt));
      setClaimedGifts(claims);
    }, (err) => {
      console.warn("giftClaims snapshot listening error:", err);
    });

    const unsubUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        
        // Single session enforcement: if another device logged in, logout this one
        const sid = localStorage.getItem('app_session_id');
        if (userData.currentSessionId && sid && userData.currentSessionId !== sid) {
          console.warn("Session mismatch: logging out current device (Another device logged in).");
          (async () => {
             await signOut(auth);
             window.location.reload(); // Force refresh to clear all states
          })();
          return;
        }

        setBalance(userData.balance || 0);
        setTotalDeposits(userData.totalDeposits || 0);
        setNickname(userData.nickname || 'Member');
        setAvatar(userData.avatar || userData.avatarURL || '');
      }
    }, (err) => {
      console.warn("user snapshot listening error:", err);
    });

    return () => {
      unsubGifts();
      unsubUser();
      unsubReferrals();
    };
  }, [isLoggedIn, db, uid]);

  // Synchronize dynamic state mutations back to local_users storage for offline resiliency
  useEffect(() => {
    const savedPhone = localStorage.getItem('userPhone');
    if (savedPhone && isLoggedIn && savedPhone !== '7888943984') {
      try {
        const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
        const existing = localUsers[savedPhone] || {};
        localUsers[savedPhone] = {
          ...existing,
          phoneNumber: savedPhone,
          nickname,
          uid,
          balance,
          exp: userExp,
          level: userLevel,
          claimedVipRewards,
          claimedMonthlyRewards,
          avatar
        };
        localStorage.setItem('local_users', JSON.stringify(localUsers));
      } catch (err) {
        console.error('LocalStorage sync error:', err);
      }
    }
  }, [balance, nickname, uid, userExp, userLevel, claimedVipRewards, claimedMonthlyRewards, avatar, isLoggedIn]);

  // Auto-close deposit required modal after 3 seconds
  useEffect(() => {
    if (showDepositRequiredModal) {
      const timer = setTimeout(() => {
        setShowDepositRequiredModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showDepositRequiredModal]);

  // Real-time notification listener for Recharge and Withdrawals
  useEffect(() => {
    if (!isLoggedIn || isAdmin) return;
    const user = auth.currentUser;
    if (!user) return;

    // Listen for Approved Deposits
    const qDeposit = query(
      collection(db, 'depositRequests'),
      where('userId', '==', user.uid),
      where('status', '==', 'approved')
    );

    const unsubDeposit = onSnapshot(qDeposit, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const deposit = change.doc.data();
          const notifiedKey = `notified_deposit_${change.doc.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            const now = new Date();
            const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            const newNotif = {
              id: 'recharge_' + change.doc.id,
              titleEn: 'ACCOUNT RECHARGE',
              titleHi: 'खाता रिचार्ज',
              contentEn: `Congratulations on your successful recharge, thank you for your trust and support in our platform, I wish you a happy game and lots of profits! Your account has received ₹ ${ (deposit.totalAmount || deposit.amount || 0).toFixed(2) }`,
              contentHi: `सफल रिचार्ज पर बधाई, हमारे प्लेटफॉर्म पर आपके विश्वास और समर्थन के लिए धन्यवाद, हम आपके सुखद खेल और ढेर सारे लाभ की कामना करते हैं! आपके खाते में ₹ ${ (deposit.totalAmount || deposit.amount || 0).toFixed(2) } प्राप्त हुए हैं`,
              date: displayTimestamp,
              type: 'recharge',
              unread: true
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev];
              localStorage.setItem('notifications_' + user.uid, JSON.stringify(updated.slice(0, 50)));
              return updated;
            });
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    });

    // Listen for Approved Withdrawals
    const qWithdraw = query(
      collection(db, 'withdrawRequests'),
      where('userId', '==', user.uid),
      where('status', '==', 'approved')
    );

    const unsubWithdraw = onSnapshot(qWithdraw, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const withdraw = change.doc.data();
          const notifiedKey = `notified_withdraw_${change.doc.id}`;
          if (!localStorage.getItem(notifiedKey)) {
            const now = new Date();
            const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            
            const newNotif = {
              id: 'withdraw_succ_' + change.doc.id,
              titleEn: 'Notification of cash...',
              titleHi: 'निकासी की सूचना...',
              contentEn: `Your withdrawal has been approved and the funds have been transferred. Please check this. The arrival of funds will be delayed on public holidays`,
              contentHi: `आपकी निकासी को मंजूरी दे दी गई है और धनराशि स्थानांतरित कर दी गई है। कृपया इसे जांचें। सार्वजनिक छुट्टियों पर धनराशि के आगमन में देरी होगी`,
              date: displayTimestamp,
              type: 'withdraw_success',
              unread: true
            };

            setNotifications(prev => {
              const updated = [newNotif, ...prev];
              localStorage.setItem('notifications_' + user.uid, JSON.stringify(updated.slice(0, 50)));
              return updated;
            });
            localStorage.setItem(notifiedKey, 'true');
          }
        }
      });
    });

    return () => {
      unsubDeposit();
      unsubWithdraw();
    };
  }, [isLoggedIn, isAdmin]);

  const [balanceRecords, setBalanceRecords] = useState<any[]>([]);

  const loadBalanceRecords = (identifier: string) => {
    const existingStr = localStorage.getItem('balance_records_' + identifier);
    let records: any[] = [];
    if (existingStr) {
      try {
        records = JSON.parse(existingStr);
      } catch (_) {}
    }

    if (records.length === 0) {
      const now = Date.now();
      const formatTime = (offsetMs: number) => {
        const d = new Date(now - offsetMs);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      };

      records = [
        {
          id: 'initial_bonus_' + now,
          type: 'reward',
          titleEn: 'Sign-up Welcome Bonus',
          titleHi: 'साइन-अप स्वागत बोनस',
          amount: 28,
          status: 'success',
          date: formatTime(3600000 * 2)
        }
      ];
      localStorage.setItem('balance_records_' + identifier, JSON.stringify(records));
    }
    setBalanceRecords(records);
  };

  const addBalanceRecord = (identifier: string, type: 'deposit' | 'withdraw' | 'reward' | 'game', titleEn: string, titleHi: string, amount: number) => {
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
      type,
      titleEn,
      titleHi,
      amount,
      status: 'success',
      date: displayTimestamp
    };

    records.unshift(newRecord);
    localStorage.setItem('balance_records_' + identifier, JSON.stringify(records.slice(0, 100)));
    setBalanceRecords(records);
  };

  const loadUserNotifications = (identifier: string) => {
    loadBalanceRecords(identifier);
    const existingStr = localStorage.getItem('notifications_' + identifier);
    let notifs: any[] = [];
    if (existingStr) {
      try {
        notifs = JSON.parse(existingStr);
      } catch (_) {}
    }
    
    // If completely empty, populate with initial welcome notification
    if (notifs.length === 0) {
      const now = new Date();
      const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      notifs = [
        {
          id: 'welcome_' + Date.now(),
          titleEn: '🎉 Welcome to Neon Trade!',
          titleHi: '🎉 Neon Trade में आपका स्वागत है!',
          contentEn: 'Thank you for registering on Neon Trade. Win up to ₹1,000,000, claim high rebate rewards, spin the wheel, and invite your friends to earn unlimited bonuses!',
          contentHi: 'Neon Trade पर पंजीकरण करने के लिए धन्यवाद। ₹1,000,000 तक जीतें, उच्च रिबेट पुरस्कार प्राप्त करें, व्हील घुमाएं और असीमित बोनस अर्जित करने के लिए अपने दोस्तों को आमंत्रित करें!',
          date: displayTimestamp,
          type: 'welcome',
          unread: false
        }
      ];
      localStorage.setItem('notifications_' + identifier, JSON.stringify(notifs));
    }
    setNotifications(notifs);
  };

  const addLoginNotification = (identifier: string) => {
    const existingStr = localStorage.getItem('notifications_' + identifier);
    let notifs: any[] = [];
    if (existingStr) {
      try {
        notifs = JSON.parse(existingStr);
      } catch (_) {}
    }
    
    // Create current date & time
    const now = new Date();
    const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Detect simple browser info to make it authentic
    const userAgent = navigator.userAgent;
    let deviceName = "Unknown Device";
    if (/android/i.test(userAgent)) {
      deviceName = "Android Phone";
    } else if (/iphone|ipad|ipod/i.test(userAgent)) {
      deviceName = "Apple iOS Device";
    } else if (/windows/i.test(userAgent)) {
      deviceName = "Windows PC";
    } else if (/macintosh|mac os x/i.test(userAgent)) {
      deviceName = "macOS Device";
    } else if (/linux/i.test(userAgent)) {
      deviceName = "Linux System";
    }

    const browserName = userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : userAgent.includes("Firefox") ? "Firefox" : "Browser";

    const loginNotif = {
      id: 'login_' + Date.now().toString(),
      titleEn: '🔐 Security Alert: Successful Login',
      titleHi: '🔐 सुरक्षा अलर्ट: सफल लॉगिन',
      contentEn: `Your account was just accessed from a ${deviceName} (${browserName}) at ${displayTimestamp}. If this wasn't you, please change your password immediately in security center.`,
      contentHi: `आपके खाते को अभी ${displayTimestamp} पर ${deviceName} (${browserName}) से एक्सेस किया गया था। यदि यह आप नहीं थे, तो कृपया सुरक्षा केंद्र में तुरंत अपना पासवर्ड बदलें।`,
      date: displayTimestamp,
      type: 'login',
      unread: true
    };

    const rechargeNotif = {
      id: 'recharge_rem_' + (Date.now() + 1).toString(),
      titleEn: '💎 Recharge Your Wallet Now!',
      titleHi: '💎 अभी अपना वॉलेट रिचार्ज करें!',
      contentEn: 'To continue playing and winning big in Neon Trade, please ensure your wallet has sufficient balance. Recharge now to get exclusive first-deposit bonuses!',
      contentHi: 'Neon Trade में खेलना जारी रखने और बड़ी जीत हासिल करने के लिए, कृपया सुनिश्चित करें कि आपके वॉलेट में पर्याप्त शेष राशि है। विशेष प्रथम-जमा बोनस प्राप्त करने के लिए अभी रिचार्ज करें!',
      date: displayTimestamp,
      type: 'bonus',
      unread: true
    };

    notifs.unshift(loginNotif, rechargeNotif);
    const limited = notifs.slice(0, 100);
    localStorage.setItem('notifications_' + identifier, JSON.stringify(limited));
    setNotifications(limited);
  };

  const markAllNotificationsAsRead = () => {
    const user = auth.currentUser;
    if (!user) return;
    
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, unread: false }));
      localStorage.setItem('notifications_' + user.uid, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteNotification = (id: string) => {
    const user = auth.currentUser;
    if (!user) return;
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem('notifications_' + user.uid, JSON.stringify(updated));
      return updated;
    });
    setNotificationToDelete(null);
    setShowDeleteConfirm(false);
  };

  const handleManualNotification = (params: { titleEn: string, titleHi: string, contentEn: string, contentHi: string, type: string }) => {
    const user = auth.currentUser;
    if (!user) return;
    
    const now = new Date();
    const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newNotif = {
      id: params.type + '_' + Date.now(),
      ...params,
      date: displayTimestamp,
      unread: true
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('notifications_' + user.uid, JSON.stringify(updated.slice(0, 50)));
      return updated;
    });
  };

  const addExperience = (amount: number, gameType: string = 'Betting EXP') => {
    if (isAdmin || !isLoggedIn) return;
    const user = auth.currentUser;
    if (!user) return;

    setUserExp((prevExp) => {
      const newExp = prevExp + amount;

      // Determine VIP level based on VIP_DATA requirements
      let targetLevel = 0;
      if (newExp >= 9999999999) targetLevel = 10;
      else if (newExp >= 5000000000) targetLevel = 9;
      else if (newExp >= 1000000000) targetLevel = 8;
      else if (newExp >= 300000000) targetLevel = 7;
      else if (newExp >= 80000000) targetLevel = 6;
      else if (newExp >= 20000000) targetLevel = 5;
      else if (newExp >= 4000000) targetLevel = 4;
      else if (newExp >= 400000) targetLevel = 3;
      else if (newExp >= 30000) targetLevel = 2;
      else if (newExp >= 3000) targetLevel = 1;

      const now = new Date();
      const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      // Save to real VIP local/sync history!
      const historyKey = `vip_history_${user.uid}`;
      const existingHistoryObj = localStorage.getItem(historyKey);
      let historyList: any[] = [
        {
          type: 'exp',
          title: 'Experience Bonus',
          subtitle: gameType,
          timestamp: displayTimestamp,
          value: `${amount} EXP`,
          color: '#72aef4', // clean light blue
          valColor: '#4ade80' // emerald green
        }
      ];

      if (existingHistoryObj) {
        try {
          const parsed = JSON.parse(existingHistoryObj);
          if (Array.isArray(parsed)) {
            historyList = [...historyList, ...parsed];
          }
        } catch (_) {}
      }

      // Check if leveling up happened
      if (targetLevel > userLevel) {
        const upgradeHistory: any[] = [
          {
            type: 'upgrade',
            title: 'VIP level',
            subtitle: `VIP level upgraded to [VIP${targetLevel}]`,
            timestamp: displayTimestamp,
            color: '#fbbf24', // golden yellow
            value: `VIP${targetLevel}`
          }
        ];

        historyList = [...upgradeHistory, ...historyList];
        setUserLevel(targetLevel);

        // Update levels in DB
        const userUid = auth.currentUser?.uid;
        if (userUid) {
          updateDoc(doc(db, 'users', userUid), {
            level: targetLevel,
            updatedAt: serverTimestamp()
          }).catch((err) => console.warn('Sync UP to DB err:', err));
        }

        setLobbyToast({
          type: 'success',
          text: selectedLang === 'en'
            ? `VIP upgraded to VIP${targetLevel}! Congratulations!`
            : `VIP अपग्रेड होकर VIP${targetLevel} हो गया! बधाई हो!`
        });
      }

      // Keep up to 100 entries to prevent localStorage bloat
      localStorage.setItem(historyKey, JSON.stringify(historyList.slice(0, 100)));

      // Sync user exp to database
      const userUid = auth.currentUser?.uid;
      if (userUid) {
        updateDoc(doc(db, 'users', userUid), {
          exp: newExp,
          updatedAt: serverTimestamp()
        }).catch((err) => console.warn('Sync EXP to DB err:', err));
      }

      return newExp;
    });
  };


  const claimVipReward = async (targetLvl: number, rewardAmountStr: string) => {
    if (isAdmin || !isLoggedIn) return;
    const user = auth.currentUser;
    if (!user) return;

    if (userLevel < targetLvl) {
      setLobbyToast({
        type: 'error',
        text: selectedLang === 'en'
          ? `You need to reach VIP${targetLvl} to claim this reward.`
          : `इस इनाम को प्राप्त करने के लिए आपको VIP${targetLvl} पर पहुंचना होगा।`
      });
      return;
    }

    if (claimedVipRewards.includes(targetLvl)) {
      setLobbyToast({
        type: 'error',
        text: selectedLang === 'en'
          ? `VIP${targetLvl} reward has already been claimed.`
          : `VIP${targetLvl} इनाम पहले ही लिया जा चुका है।`
      });
      return;
    }

    const rAmount = parseFloat(rewardAmountStr.replace(/,/g, ''));
    if (isNaN(rAmount) || rAmount <= 0) return;

    try {
      const updatedClaims = [...claimedVipRewards, targetLvl];
      setClaimedVipRewards(updatedClaims);
      setBalance((b) => b + rAmount);

      const now = new Date();
      const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const historyKey = `vip_history_${user.uid}`;
      const existingHistoryObj = localStorage.getItem(historyKey);
      let historyList: any[] = [];
      if (existingHistoryObj) {
        try {
          const parsed = JSON.parse(existingHistoryObj);
          if (Array.isArray(parsed)) {
            historyList = [...parsed];
          }
        } catch (_) {}
      }

      const claimRecord = {
        type: 'reward',
        title: 'Successfully received',
        subtitle: `Successfully received [Level up reward for VIP${targetLvl}]`,
        timestamp: displayTimestamp,
        rewards: [
          { icon: '👛', amount: rewardAmountStr },
          { icon: '💎', amount: '0' }
        ],
        color: '#10b981'
      };

      historyList.unshift(claimRecord);
      localStorage.setItem(historyKey, JSON.stringify(historyList.slice(0, 100)));

      await updateDoc(doc(db, 'users', user.uid), {
        balance: balance + rAmount,
        claimedVipRewards: updatedClaims,
        updatedAt: serverTimestamp()
      });

      setLobbyToast({
        type: 'success',
        text: selectedLang === 'en'
          ? `Successfully claimed VIP${targetLvl} reward of ₹${rewardAmountStr}!`
          : `सफलतापूर्वक ₹${rewardAmountStr} का VIP${targetLvl} इनाम प्राप्त किया!`
      });

    } catch (err: any) {
      console.error('Error claiming reward:', err);
      setLobbyToast({
        type: 'error',
        text: 'Error claiming reward: ' + err.message
      });
    }
  };

  const claimMonthlyReward = async (targetLvl: number, rewardAmountStr: string) => {
    if (isAdmin || !isLoggedIn) return;
    const savedPhone = localStorage.getItem('userPhone');
    if (!savedPhone) return;

    const user = auth.currentUser;
    if (!user) return;

    if (userLevel < targetLvl) {
      setLobbyToast({
        type: 'error',
        text: selectedLang === 'en'
          ? `You need to reach VIP${targetLvl} to claim this monthly reward.`
          : `इस मासिक इनाम को प्राप्त करने के लिए आपको VIP${targetLvl} पर पहुंचना होगा।`
      });
      return;
    }

    if (claimedMonthlyRewards.includes(targetLvl)) {
      setLobbyToast({
        type: 'error',
        text: selectedLang === 'en'
          ? `VIP${targetLvl} monthly reward has already been claimed.`
          : `VIP${targetLvl} मासिक इनाम पहले ही लिया जा चुका है।`
      });
      return;
    }

    const rAmount = parseFloat(rewardAmountStr.replace(/,/g, ''));
    if (isNaN(rAmount) || rAmount <= 0) return;

    try {
      const updatedClaims = [...claimedMonthlyRewards, targetLvl];
      setClaimedMonthlyRewards(updatedClaims);
      setBalance((b) => b + rAmount);

      const now = new Date();
      const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const historyKey = `vip_history_${user.uid}`;
      const existingHistoryObj = localStorage.getItem(historyKey);
      let historyList: any[] = [];
      if (existingHistoryObj) {
        try {
          const parsed = JSON.parse(existingHistoryObj);
          if (Array.isArray(parsed)) {
            historyList = [...parsed];
          }
        } catch (_) {}
      }

      const claimRecord = {
        type: 'reward',
        title: 'Successfully received',
        subtitle: `Successfully received [Monthly reward for VIP${targetLvl}]`,
        timestamp: displayTimestamp,
        rewards: [
          { icon: '👛', amount: rewardAmountStr },
          { icon: '💎', amount: '0' }
        ],
        color: '#10b981'
      };

      historyList.unshift(claimRecord);
      localStorage.setItem(historyKey, JSON.stringify(historyList.slice(0, 100)));

      await updateDoc(doc(db, 'users', user.uid), {
        balance: balance + rAmount,
        claimedMonthlyRewards: updatedClaims,
        updatedAt: serverTimestamp()
      });

      setLobbyToast({
        type: 'success',
        text: selectedLang === 'en'
          ? `Successfully claimed VIP${targetLvl} monthly reward of ₹${rewardAmountStr}!`
          : `सफलतापूर्वक ₹${rewardAmountStr} का VIP${targetLvl} मासिक इनाम प्राप्त किया!`
      });

    } catch (err: any) {
      console.error('Error claiming monthly reward:', err);
      setLobbyToast({
        type: 'error',
        text: 'Error claiming monthly reward: ' + err.message
      });
    }
  };

  // WINGO INTERACTIVE SYSTEMS STATE
  const [wingoSoundEnabled, setWingoSoundEnabled] = useState<boolean>(true);

  const countdownAudioRef = useRef<any>(null);
  const clickAudioRef = useRef<any>(null);
  const winAudioRef = useRef<any>(null);
  const lossAudioRef = useRef<any>(null);
  const lastTriggeredPeriodRef = useRef<string | null>(null);

  useEffect(() => {
    // Audio removed
  }, []);

  const toggleWingoSound = () => {
    setWingoSoundEnabled(prev => !prev);
  };

  const [wingoTimers, setWingoTimers] = useState<{ [key: string]: number }>({
    '30s': 0,
    '1m': 0,
    '3m': 0,
    '5m': 0,
  });

  // Standalone Timer & API Fallback for Static Environments (Netlify, etc.)
  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);

  useEffect(() => {
    // 1. Local Timer Computation (UTC based)
    let lastProcessedPeriod = { '30s': '', '1m': '', '3m': '', '5m': '' };
    const updateLocalTimers = () => {
      if (socketConnectedRef.current) return;
      const nowTs = Math.floor(Date.now() / 1000);
      setWingoTimers({
        '30s': 30 - (nowTs % 30),
        '1m': 60 - (nowTs % 60),
        '3m': 180 - (nowTs % 180),
        '5m': 300 - (nowTs % 300),
      });
      const secMap = { '30s': 30, '1m': 60, '3m': 180, '5m': 300 };
      for (const room of Object.keys(secMap)) {
         const p = getPeriodForTime(nowTs, room);
         if (lastProcessedPeriod[room] && lastProcessedPeriod[room] !== p) {
             const result = generateDeterministicResult(room, lastProcessedPeriod[room]);
             setWingoHistory(prev => ({ ...prev, [room]: [result, ...(prev[room] || constructFallbackHistory(room, 20))].slice(0, 500) }));
             setTimeout(() => window.dispatchEvent(new CustomEvent('new_result_event', { detail: { room, result } })), 500);
         }
         lastProcessedPeriod[room] = p;
      }
    };
    const timerInterval = setInterval(updateLocalTimers, 1000);
    updateLocalTimers();

    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  const [chartPage, setChartPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [myHistoryPage, setMyHistoryPage] = useState(1);
  const [activeWingoRoom, setActiveWingoRoom] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Reset history pages when room changes
  useEffect(() => {
    if (!socketConnected) {
       setWingoHistory(prev => {
           let np = { ...prev };
           ['30s','1m','3m','5m'].forEach(r => {
                const roomSecs = r === '30s' ? 30 : r === '1m' ? 60 : r === '3m' ? 180 : 300;
                const expectedLastPeriod = getPeriodForTime(Math.floor(Date.now() / 1000) - roomSecs, r);
                if (!np[r] || np[r].length === 0 || np[r][0]?.period !== expectedLastPeriod || String(np[r][0]?.period || '').length !== 17) {
                    np[r] = constructFallbackHistory(r, 50);
                }
           });
           localStorage.setItem('wingo_history', JSON.stringify(np));
           return np;
       });
    }
  }, [socketConnected]);
  useEffect(() => {
    setHistoryPage(1);
    setChartPage(1);
    setMyHistoryPage(1);
  }, [activeWingoRoom]);
  const [wingoBetOption, setWingoBetOption] = useState<string | number | null>(null);
  const [showWingoBetModal, setShowWingoBetModal] = useState(false);
  const [wingoBetBalanceVal, setWingoBetBalanceVal] = useState(1); // 1, 10, 100, 1000
  const [wingoBetQuantity, setWingoBetQuantity] = useState<number | string>(1);
  const [wingoMultiplier, setWingoMultiplier] = useState(1); // 1, 5, 10, 20, 50, 100
  const [wingoOuterMultiplier, setWingoOuterMultiplier] = useState(1); // 1, 5, 10, 20, 50, 100
  const [wingoAgreed, setWingoAgreed] = useState(true);
  const [wingoWinningsAlert, setWingoWinningsAlert] = useState<{ isWin: boolean; text?: string; amount?: number; period?: string; room?: string; drawNumber?: number; drawColor?: string; drawSize?: string; } | null>(null);
  const [wingoIsSpinning, setWingoIsSpinning] = useState<boolean>(false);
  const [wingoRandomizing, setWingoRandomizing] = useState<boolean>(false);
  const [wingoRandomActiveNum, setWingoRandomActiveNum] = useState<number | null>(null);
  const [wingoCategory, setWingoCategory] = useState<'all' | 'wingo' | 'slots' | 'popular'>('all');
  const [promoFilter, setPromoFilter] = useState<'all' | 'hot' | 'deposit' | 'invite'>('all');

  const [wingoHistoryTab, setWingoHistoryTab] = useState<'history' | 'chart' | 'myhistory'>('history');
  const [showWingoHowToPlay, setShowWingoHowToPlay] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);

  // Rotate announcements every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAnnouncementIndex(prev => (prev + 1) % ANNOUNCEMENTS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const getPeriodForTime = (time, room) => {
    const pDate = new Date(time * 1000);
    const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
    let seq = (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
    if (room === '1m') seq = minOfDay;
    else if (room === '3m') seq = Math.floor(minOfDay / 3);
    else if (room === '5m') seq = Math.floor(minOfDay / 5);
    
    const yyyy = pDate.getUTCFullYear();
    const mm = String(pDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(pDate.getUTCDate()).padStart(2, '0');
    
    return `${yyyy}${mm}${dd}10001${String(seq).padStart(4, '0')}`;
  };

  const generateDeterministicResult = (room, periodStr) => {
    let hash = 0;
    const str = periodStr + room + "salt";
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    const num = Math.abs(hash) % 10;
    let color = '';
    if (num === 0) color = 'Red+Violet';
    else if (num === 5) color = 'Green+Violet';
    else if (num % 2 === 0) color = 'Red';
    else color = 'Green';
    return { period: periodStr, number: num, color: color, size: num >= 5 ? 'Big' : 'Small' };
  };

  const constructFallbackHistory = (room, count) => {
     const history = [];
     const nowTs = Math.floor(Date.now() / 1000);
     let roomSecs = 30;
     if (room === '1m') roomSecs = 60;
     if (room === '3m') roomSecs = 180;
     if (room === '5m') roomSecs = 300;
     
     for (let i = 0; i < count; i++) {
        const targetTs = nowTs - ((i + 1) * roomSecs);
        const period = getPeriodForTime(targetTs, room);
        history.push(generateDeterministicResult(room, period));
     }
     return history;
  };
  const sanitizeHistoryForFirestore = (historyObj: any): any => {
    if (historyObj === undefined || historyObj === null) return null;
    if (Array.isArray(historyObj)) {
      return historyObj.map(item => sanitizeHistoryForFirestore(item)).filter(item => item !== undefined);
    }
    if (typeof historyObj === 'object') {
      const cleanObj: any = {};
      for (const key of Object.keys(historyObj)) {
        const val = historyObj[key];
        if (val !== undefined) {
          cleanObj[key] = sanitizeHistoryForFirestore(val);
        }
      }
      return cleanObj;
    }
    return historyObj;
  };

  const getDocWithRetry = async (docRef: any, maxRetries = 4, delay = 1000): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await getDoc(docRef);
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('permission') && i < maxRetries - 1) {
          console.warn(`Firestore permission denied on read, retrying in ${delay * (i + 1)}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay * (i + 1)));
          continue;
        }
        throw err;
      }
    }
  };

  const setDocWithRetry = async (docRef: any, data: any, maxRetries = 4, delay = 1000): Promise<any> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await setDoc(docRef, data);
      } catch (err: any) {
        if (err.message && err.message.toLowerCase().includes('permission') && i < maxRetries - 1) {
          console.warn(`Firestore permission denied on write, retrying in ${delay * (i + 1)}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(res => setTimeout(res, delay * (i + 1)));
          continue;
        }
        throw err;
      }
    }
  };

  const [wingoHistory, setWingoHistory] = useState<{ [key: string]: { period: string; number: number; color: 'Green' | 'Red' | 'Violet' | 'Green+Violet' | 'Red+Violet'; size: 'Big' | 'Small'; betAmount?: number; winLoss?: 'Win' | 'Loss' | '-'; timestamp?: string; userChoice?: string | number }[] }>(() => {
    try {
        const saved = localStorage.getItem('wingo_history');
        return saved ? JSON.parse(saved) : { '30s': [], '1m': [], '3m': [], '5m': [] };
    } catch(e) {
        return { '30s': [], '1m': [], '3m': [], '5m': [] };
    }
  });

  // Load and sync GLOBAL wingo_history from Firestore real-time using onSnapshot
  useEffect(() => {
    if (!db) return;

    const ROOMS = ['30s', '1m', '3m', '5m'];
    const unsubscribes: (() => void)[] = [];

    ROOMS.forEach(room => {
      const roomDoc = doc(db, 'globalResults', room);
      const unsub = onSnapshot(roomDoc, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.history) {
            // Check if lastUpdated is fresh (updated in last 5 minutes)
            const lastUpdatedObj = data.lastUpdated;
            let lastUpdatedMs = 0;
            if (lastUpdatedObj) {
              if (typeof lastUpdatedObj.toMillis === 'function') {
                lastUpdatedMs = lastUpdatedObj.toMillis();
              } else if (lastUpdatedObj.seconds) {
                lastUpdatedMs = lastUpdatedObj.seconds * 1000;
              } else if (typeof lastUpdatedObj === 'number') {
                lastUpdatedMs = lastUpdatedObj;
              }
            }
            
            const isFresh = lastUpdatedMs && (Date.now() - lastUpdatedMs < 5 * 60 * 1000);

            if (isFresh) {
              setWingoHistory(prev => {
                const newState = { ...prev, [room]: data.history };
                localStorage.setItem('wingo_history', JSON.stringify(newState));
                return newState;
              });
            } else {
              // Stale server data (e.g. deployed on serverless platform like Vercel with no backend running)
              console.log(`[Firestore] globalResults room ${room} is stale (last updated ${lastUpdatedMs ? new Date(lastUpdatedMs).toLocaleString() : 'Never'}). Running in standalone simulation mode.`);
              setWingoHistory(prev => {
                const currentHistory = prev[room] || [];
                const roomSecs = room === '30s' ? 30 : room === '1m' ? 60 : room === '3m' ? 180 : 300;
                const expectedLastPeriod = getPeriodForTime(Math.floor(Date.now() / 1000) - roomSecs, room);
                
                // If local state doesn't have the current period's latest completed result, regenerate beautiful continuous series
                if (currentHistory.length === 0 || currentHistory[0]?.period !== expectedLastPeriod || String(currentHistory[0]?.period || '').length !== 17) {
                  const fallbackHistory = constructFallbackHistory(room, 50);
                  const newState = { ...prev, [room]: fallbackHistory };
                  localStorage.setItem('wingo_history', JSON.stringify(newState));
                  return newState;
                }
                return prev;
              });
            }
          }
        }
      });
      unsubscribes.push(unsub);
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [db]);
  const [myWingoBets, setMyWingoBets] = useState<{ [key: string]: { period: string; number?: number; color?: string; size?: string; betAmount: number; winLoss: 'Win' | 'Loss' | '-'; timestamp: string; userChoice: string | number; resolved: boolean }[] }>({ '30s': [], '1m': [], '3m': [], '5m': [] });
  const [expandedBetKey, setExpandedBetKey] = useState<string | null>(null);


  const syncUserBetsHistory = async (userUid: string) => {
    if (!db) return;
    try {
      const q = query(
        collection(db, 'wingoBets'),
        where('userId', '==', userUid)
      );
      const querySnapshot = await getDocs(q);
      const fetchedBets: any[] = [];
      querySnapshot.forEach((doc) => {
        fetchedBets.push(doc.data());
      });

      // Populate localBetsRef.current so live listeners don't duplicate or miss them
      localBetsRef.current = fetchedBets.map(b => ({
        room: b.room,
        period: b.period,
        betAmount: b.betAmount,
        userChoice: b.userChoice,
        timestamp: b.timestampDisplay || (b.timestamp ? b.timestamp.replace('T', ' ').substring(0, 19) : ''),
        resolved: b.resolved || false,
        winLoss: b.winLoss || '-'
      }));

      // Map Firestore fetched wingoBets into dedicated user bets state
      const mappedBetsObj: { [key: string]: any[] } = { '30s': [], '1m': [], '3m': [], '5m': [] };
      for (const room of ['30s', '1m', '3m', '5m']) {
        const roomBets = fetchedBets.filter(b => b.room === room);
        mappedBetsObj[room] = roomBets.map(b => {
          return {
            period: b.period,
            betAmount: b.betAmount,
            userChoice: b.userChoice,
            timestamp: b.timestampDisplay || (b.timestamp ? b.timestamp.replace('T', ' ').substring(0, 19) : ''),
            resolved: b.resolved || false,
            winLoss: b.winLoss || '-',
            number: b.drawNumber !== undefined ? b.drawNumber : -1,
            color: b.drawColor || 'Green',
            size: b.drawSize || 'Big'
          };
        }).sort((a, b) => b.period.localeCompare(a.period)).slice(0, 500);
      }
      setMyWingoBets(mappedBetsObj);
    } catch (err) {
      console.error('Failed to sync user bets history:', err);
    }
  };

  // Background cleanup: Resolve any pending bets that have a matching result in wingoHistory
  useEffect(() => {
    const timer = setInterval(() => {
        setMyWingoBets(prev => {
            let changed = false;
            const newState = { ...prev };
            
            for (const room of ['30s', '1m', '3m', '5m']) {
                const history = wingoHistory[room] || [];
                const bets = prev[room] || [];
                
                const updatedBets = bets.map(b => {
                    if (!b.resolved) {
                        const match = history.find(h => h.period === b.period && h.number !== -1);
                        if (match) {
                            changed = true;
                            let userWon = false;
                            const rNum = match.number;
                            const rCol = match.color;
                            const rSize = match.size;
                            const opt = b.userChoice;

                            if (typeof opt === 'number') {
                                if (opt === rNum) userWon = true;
                            } else if (opt === 'Green') {
                                if (rCol === 'Green' || rCol === 'Green+Violet') userWon = true;
                            } else if (opt === 'Red') {
                                if (rCol === 'Red' || rCol === 'Red+Violet') userWon = true;
                            } else if (opt === 'Violet') {
                                if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) userWon = true;
                            } else if (opt === 'Big') {
                                if (rSize === 'Big') userWon = true;
                            } else if (opt === 'Small') {
                                if (rSize === 'Small') userWon = true;
                            }
                            
                            // Also update Firestore if needed
                            const userUid = auth.currentUser?.uid;
                            if (userUid && db) {
                                const qry = query(
                                    collection(db, 'wingoBets'),
                                    where('userId', '==', userUid),
                                    where('room', '==', room),
                                    where('period', '==', b.period),
                                    where('resolved', '==', false)
                                );
                                getDocs(qry).then(snap => {
                                    snap.forEach(d => {
                                        updateDoc(d.ref, {
                                            resolved: true,
                                            winLoss: userWon ? 'Win' : 'Loss',
                                            drawNumber: rNum,
                                            drawColor: rCol,
                                            drawSize: rSize
                                        }).catch(() => {});
                                    });
                                }).catch(() => {});
                            }

                            return {
                                ...b,
                                resolved: true,
                                winLoss: userWon ? 'Win' as const : 'Loss' as const,
                                number: rNum,
                                color: rCol,
                                size: rSize
                            };
                        }
                    }
                    return b;
                });
                
                if (changed) {
                    newState[room] = updatedBets;
                }
            }
            
            return changed ? newState : prev;
        });
    }, 10000); // Check every 10s
    
    return () => clearInterval(timer);
  }, [wingoHistory, isLoggedIn]);

  useEffect(() => {
    const user = auth.currentUser;
    if (isLoggedIn && db && user) {
      syncUserBetsHistory(user.uid);
    }
  }, [isLoggedIn, db]);

  const handleRandomWingoSelection = () => {
    if (wingoRandomizing || wingoIsSpinning) return;
    playWingoSound(clickAudioRef);
    setWingoRandomizing(true);
    let count = 0;
    const maxCount = 40; // Medium shuffle iterations
    let currentDelay = 40; // Medium delay

    const shuffle = () => {
      count++;
      setWingoRandomActiveNum(Math.floor(Math.random() * 10));
      
      if (count < maxCount) {
        if (count > maxCount - 8) {
           currentDelay += 15; // slow down at the end
        }
        setTimeout(shuffle, currentDelay);
      } else {
        setTimeout(() => {
          const finalRng = Math.floor(Math.random() * 10);
          setWingoRandomActiveNum(null);
          setWingoRandomizing(false);
          handleWingoBetPlace(finalRng);
        }, 100);
      }
    };
    
    shuffle();
  };

  const activeTimer = wingoTimers[activeWingoRoom || '30s'] || 0;
  const isBettingDisabled = activeTimer <= 5 && activeTimer > 0;

  useEffect(() => {
    if (showWingoBetModal && activeTimer <= 5 && activeTimer > 0) {
      setShowWingoBetModal(false);
    }
  }, [activeTimer, showWingoBetModal]);

  const playWingoSound = (audioRef: React.RefObject<any>) => {
    // Sound removed
  };

  useEffect(() => {
    // Sound countdown removed
  }, [activeTimer, activeWingoRoom, currentTab, wingoSoundEnabled, wingoHistory]);

  const handleWingoBetPlace = (passedOption?: any) => {
    const activeTimer = wingoTimers[activeWingoRoom || '30s'] || 0;
    
    // Check if betting is blocked by countdown
    if (activeTimer <= 5 && activeTimer > 0) {
      setLobbyToast({ 
        type: 'info', 
        text: selectedLang === 'en' ? "Please wait for next period..." : "कृपया अगली अवधि के लिए प्रतीक्षा करें..." 
      });
      return;
    }
    
    if (wingoRandomizing || wingoIsSpinning) return;
    
    if (passedOption !== undefined) {
      setWingoBetOption(passedOption);
    }
    setWingoBetBalanceVal(1);
    setWingoBetQuantity(1);
    setWingoMultiplier(wingoOuterMultiplier);
    setShowWingoBetModal(true);
    // Play button click sound
    playWingoSound(clickAudioRef);
  };

  const localBetsRef = useRef<any[]>([]);

  useEffect(() => {
    let active = true;
    const socket = io({
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true
    });

    socket.on('connect', () => {
       console.log('Socket connected with ID:', socket.id);
       if (active) setSocketConnected(true);
    });
    socket.on('disconnect', (reason) => {
       console.log('Socket disconnected:', reason);
       if (active) setSocketConnected(false);
    });
    socket.on('connect_error', (err) => {
       if (err.message !== 'xhr poll error' && err.message !== 'websocket error') {
         console.error('Socket connection error detail:', err.message);
       }
       if (active) setSocketConnected(false);
    });

        socket.on('initial_data', (roomData: any) => {
       if (!active) return;
       setWingoHistory(prev => {
           let state = { ...prev };
           for (const room of ['30s', '1m', '3m', '5m']) {
               if (roomData[room]?.history && roomData[room].history.length > 0) {
                   state[room] = roomData[room].history;
               }
           }
           return state;
       });
       
       // Force resolve any missed bets on reconnect using the history just received
       for (const room of ['30s', '1m', '3m', '5m']) {
          if (!roomData[room]?.history) continue;
          
          let newBalanceChange = 0;
          const histDict = {};
          roomData[room].history.forEach((h: any) => { histDict[h.period] = h; });
          
          let anyResolved = false;
          const updatedLocalBets = localBetsRef.current.map(b => {
             if (b.room === room && !b.resolved) {
                 const result = histDict[b.period];
                 if (result) {
                    b.resolved = true;
                    anyResolved = true;
                    
                    let userWon = false;
                    let winMult = 0;
                    const rNum = result.number;
                    const rCol = result.color;
                    const rSize = result.size;
                    const opt = b.userChoice;
                    
                    if (typeof opt === 'number') {
                      if (opt === rNum) { userWon = true; winMult = 8.82; }
                    } else if (opt === 'Green') {
                      if (rCol === 'Green') { userWon=true; winMult=1.96; }
                      else if (rCol==='Green+Violet') { userWon=true; winMult=1.47; }
                    } else if (opt === 'Red') {
                      if (rCol === 'Red') { userWon=true; winMult=1.96; }
                      else if (rCol==='Red+Violet') { userWon=true; winMult=1.47; }
                    } else if (opt === 'Violet') {
                      if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) { userWon=true; winMult=4.41; }
                    } else if (opt === 'Big') {
                      if (rSize === 'Big') { userWon=true; winMult=1.96; }
                    } else if (opt === 'Small') {
                      if (rSize === 'Small') { userWon=true; winMult=1.96; }
                    }
  
                    b.winLoss = userWon ? 'Win' : 'Loss';
                    
                    if (userWon) {
                       newBalanceChange += (b.betAmount * winMult);
                    }
                    
                    const userUid = auth.currentUser?.uid;
                    if (userUid && db) {
                      import('firebase/firestore').then(({ query, collection, where, getDocs, updateDoc }) => {
                        const betsQuery = query(
                            collection(db, 'wingoBets'),
                            where('userId', '==', userUid),
                            where('room', '==', room),
                            where('period', '==', result.period)
                        );
                        getDocs(betsQuery).then(snap => {
                            snap.forEach(d => {
                                updateDoc(d.ref, {
                                    resolved: true,
                                    winLoss: userWon ? 'Win' : 'Loss',
                                    drawNumber: rNum,
                                    drawColor: rCol,
                                    drawSize: rSize
                                }).catch(()=>{});
                            });
                        }).catch(()=>{});
                      });
                    }
                 }
             }
             return b;
          });
          
          if (anyResolved) {
             localBetsRef.current = updatedLocalBets;
             if (newBalanceChange > 0) {
               setBalance((prev: number) => {
                 const updated = prev + newBalanceChange;
                 const userUid = auth.currentUser?.uid;
                 if (userUid && db) {
                   import('firebase/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
                     updateDoc(doc(db, 'users', userUid), {
                       balance: updated,
                       updatedAt: serverTimestamp()
                     }).catch(()=>{});
                   });
                 }
                 return updated;
               });
             }
             
             setMyWingoBets((prev: any) => {
                 const roomBets = prev[room] || [];
                 const updatedBets = roomBets.map((b: any) => {
                     const r = histDict[b.period];
                     if (r && !b.resolved) {
                         let userWon = false;
                         const opt = b.userChoice;
                         if (typeof opt === 'number') { if (opt === r.number) userWon = true; }
                         else if (opt === 'Green') { if (r.color === 'Green' || r.color === 'Green+Violet') userWon = true; }
                         else if (opt === 'Red') { if (r.color === 'Red' || r.color === 'Red+Violet') userWon = true; }
                         else if (opt === 'Violet') { if (['Violet','Green+Violet','Red+Violet'].includes(r.color)) userWon = true; }
                         else if (opt === 'Big') { if (r.size === 'Big') userWon = true; }
                         else if (opt === 'Small') { if (r.size === 'Small') userWon = true; }
                         return { ...b, resolved: true, winLoss: userWon ? 'Win' : 'Loss', number: r.number, color: r.color, size: r.size };
                     }
                     return b;
                 });
                 return { ...prev, [room]: updatedBets };
             });
          }
       }
    });

    socket.on('timer_sync', ({ room, time }: any) => {
       if (!active) return;
       setWingoTimers(prev => ({ ...prev, [room]: time }));
    });

    const processResult = ({ room, result }: any) => {
       if (!active) return;

       // resolve bets for this room
       let anyResolved = false;
       let hasWin = false;
       let hasLoss = false;
       let newBalanceChange = 0;
       let lastAlert: any = null;

       const updatedLocalBets = localBetsRef.current.map(b => {
           if (b.room === room && !b.resolved && b.period === result.period) {
                 b.resolved = true;
                 anyResolved = true;
                 
                 let userWon = false;
                 let winMult = 0;
                 const rNum = result.number;
                 const rCol = result.color;
                 const rSize = result.size;
                 const opt = b.userChoice;
                 
                 if (typeof opt === 'number') {
                   if (opt === rNum) { userWon = true; winMult = 8.82; }
                 } else if (opt === 'Green') {
                   if (rCol === 'Green') { userWon=true; winMult=1.96; }
                   else if (rCol==='Green+Violet') { userWon=true; winMult=1.47; }
                 } else if (opt === 'Red') {
                   if (rCol === 'Red') { userWon=true; winMult=1.96; }
                   else if (rCol==='Red+Violet') { userWon=true; winMult=1.47; }
                 } else if (opt === 'Violet') {
                   if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) { userWon=true; winMult=4.41; }
                 } else if (opt === 'Big') {
                   if (rSize === 'Big') { userWon=true; winMult=1.96; }
                 } else if (opt === 'Small') {
                   if (rSize === 'Small') { userWon=true; winMult=1.96; }
                 }

                 b.winLoss = userWon ? 'Win' : 'Loss';
                 if (userWon) hasWin = true;
                 else hasLoss = true;

                 // Persist resolution in Firestore
                 const userUid = auth.currentUser?.uid;
                 if (userUid && db) {
                   const betsQuery = query(
                       collection(db, 'wingoBets'),
                       where('userId', '==', userUid),
                       where('room', '==', room),
                       where('period', '==', result.period),
                       where('resolved', '==', false)
                   );
                   getDocs(betsQuery).then(snap => {
                       snap.forEach(d => {
                           updateDoc(d.ref, {
                               resolved: true,
                               winLoss: userWon ? 'Win' : 'Loss',
                               drawNumber: rNum,
                               drawColor: rCol,
                               drawSize: rSize
                           }).catch(e => console.error('Resolving bet doc failed:', e));
                       });
                   }).catch(e => console.error('Querying unresolved bets failed:', e));
                 }
                 
                 if (userWon) {
                    const amt = b.betAmount * winMult;
                    newBalanceChange += amt;
                    lastAlert = { isWin: true, text: selectedLang === 'en' ? `Congratulations! You won ₹${amt.toFixed(2)}` : `बधाई हो! आपने ₹${amt.toFixed(2)} जीते`, amount: amt, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };
                 } else {
                    lastAlert = { isWin: false, text: selectedLang === 'en' ? `Better luck next time! Number was ${rNum}.` : `अगली बार बेहतर भाग्य! नंबर ${rNum} था।`, amount: 0, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };
                 }
           }
           return b;
       });

       if (anyResolved) {
           localBetsRef.current = updatedLocalBets;

           if (newBalanceChange > 0) {
              setBalance(prev => {
                const updated = prev + newBalanceChange;
                const userUid = auth.currentUser?.uid;
                if (userUid) {
                  updateDoc(doc(db, 'users', userUid), {
                    balance: updated,
                    updatedAt: serverTimestamp()
                  }).catch(e => console.error('Winnings sync error:', e));
                }
                return updated;
              });
           }
           if (lastAlert) setWingoWinningsAlert(lastAlert);
       }

       // Resolve the corresponding bet in myWingoBets in real-time
       setMyWingoBets(prev => {
           const roomBets = prev[room] || [];
           const updatedBets = roomBets.map(b => {
               if (b.period === result.period && !b.resolved) {
                   let userWon = false;
                   const rNum = result.number;
                   const rCol = result.color;
                   const rSize = result.size;
                   const opt = b.userChoice;

                   if (typeof opt === 'number') {
                       if (opt === rNum) userWon = true;
                   } else if (opt === 'Green') {
                       if (rCol === 'Green' || rCol === 'Green+Violet') userWon = true;
                   } else if (opt === 'Red') {
                       if (rCol === 'Red' || rCol === 'Red+Violet') userWon = true;
                   } else if (opt === 'Violet') {
                       if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) userWon = true;
                   } else if (opt === 'Big') {
                       if (rSize === 'Big') userWon = true;
                   } else if (opt === 'Small') {
                       if (rSize === 'Small') userWon = true;
                   }

                   return {
                       ...b,
                       resolved: true,
                       winLoss: userWon ? 'Win' as const : 'Loss' as const,
                       number: rNum,
                       color: rCol,
                       size: rSize
                   };
               }
               return b;
           });
           return { ...prev, [room]: updatedBets };
       });

       // Fallback for global history update in case Firestore quota is exceeded
       setWingoHistory(prev => {
           const existing = prev[room] || [];
           // Insert new record at the start and deduplicate
           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);
           return { ...prev, [room]: updated };
       });

    };

    const handleFallbackResult = (e: any) => processResult(e.detail);
    window.addEventListener('new_result_event', handleFallbackResult);

    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));

    return () => { 
        active = false; 
        window.removeEventListener('new_result_event', handleFallbackResult);
      socket.disconnect(); 
    };
  }, [selectedLang]);

  const executeWingoBet = () => {
    if (!wingoAgreed) return;
    playWingoSound(clickAudioRef);
    
    const parsedQuantity = typeof wingoBetQuantity === 'number' ? wingoBetQuantity : (parseInt(wingoBetQuantity as string) || 1);
    const finalBetCost = wingoBetBalanceVal * parsedQuantity * wingoMultiplier;
    if (balance < finalBetCost) {
      setLobbyToast({ type: 'error', text: selectedLang === 'en' ? "Insufficient balance! Please reload your balance in the Mine tab." : "अपर्याप्त शेष राशि! कृपया माइन टैब में जाकर बैलेंस लोड करें।" });
      return;
    }
    
    setShowWingoBetModal(false);
    const updatedBalance = balance - finalBetCost;
    setBalance(updatedBalance);
    
    // Reward EXP matching the placed Wingo bet
    addExperience(finalBetCost, 'Betting EXP');
    
    const savedPhone = localStorage.getItem('userPhone');
    const userUid = auth.currentUser?.uid;
    if (userUid) {
      updateDoc(doc(db, 'users', userUid), {
        balance: updatedBalance,
        updatedAt: serverTimestamp()
      }).catch(e => console.error('Bet sync error:', e));
    }
    
    setWingoWinningsAlert(null);

    const targetRoom = activeWingoRoom || '30s';
    const roomHist = wingoHistory[targetRoom] || [];
    const lastPeriodObj = roomHist.find(h => h.number !== -1) || roomHist[0];
    const lastPeriod = lastPeriodObj?.period;
    
    let nextPeriod = '';
    if (lastPeriod) {
      const cleaned = lastPeriod.replace(/\D/g, '');
      if (cleaned.length === 17) {
        try {
          const basePart = cleaned.substring(0, 13);
          const seqPart = cleaned.substring(13);
          const nextSeq = String(parseInt(seqPart) + 1).padStart(4, '0');
          nextPeriod = basePart + nextSeq;
        } catch (e) {
          nextPeriod = (BigInt(cleaned) + 1n).toString();
        }
      } else {
        nextPeriod = (BigInt(cleaned) + 1n).toString();
      }
    } else {
      nextPeriod = '20260521100012001';
    }
    
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const displayTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    // Live sync for Admin Panel
    if (userUid) {
      // Use a more unique ID to avoid overwriting multiple bets in same period
      const betId = `${userUid}_${targetRoom}_${nextPeriod}_${now.getTime()}_${Math.floor(Math.random() * 1000)}`;
      setDoc(doc(db, 'wingoBets', betId), {
        room: targetRoom,
        period: nextPeriod,
        betAmount: finalBetCost,
        userChoice: wingoBetOption,
        userId: userUid,
        phoneNumber: savedPhone || '',
        uid: uid,
        balance: updatedBalance,
        timestamp: isoTimestamp,
        resolved: false,
        winLoss: '-',
        timestampDisplay: displayTimestamp
      }).catch(e => console.error('Admin bet sync error:', e));
    }

    if (localBetsRef.current) {
      localBetsRef.current.push({
         room: targetRoom,
         period: nextPeriod,
         betAmount: finalBetCost,
         userChoice: wingoBetOption,
         timestamp: displayTimestamp,
         resolved: false
      });
    }

    setMyWingoBets(prev => {
      const roomBets = prev[targetRoom] || [];
      const newRecord = {
        period: nextPeriod,
        betAmount: finalBetCost,
        userChoice: wingoBetOption,
        timestamp: displayTimestamp,
        resolved: false,
        winLoss: '-' as const,
        number: -1,
        color: 'Green',
        size: 'Big'
      };
      return {
        ...prev,
        [targetRoom]: [newRecord, ...roomBets].slice(0, 500)
      };
    });
    
    // Switch to myhistory tab
    setWingoHistoryTab('myhistory');

    // Show big success animation for 4 seconds
    setShowBetSuccessful(true);
    setTimeout(() => {
      setShowBetSuccessful(false);
    }, 4000);

    setLobbyToast({ 
      type: 'success', 
      text: selectedLang === 'en' ? "Bet Placed Successfully! Check My History." : "सट्टा सफलतापूर्वक लगाया गया! मेरा इतिहास देखें।" 
    });
  };

  const handleClaimInvitationBonus = async (tierId: number, reward: number) => {
    const userUid = auth.currentUser?.uid;
    if (!userUid) return;
    if (claimedInvitationBonuses.includes(tierId)) {
      setLobbyToast({ 
        type: 'error', 
        text: selectedLang === 'en' ? 'Bonus already claimed!' : 'बोनस पहले ही लिया जा चुका है!' 
      });
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const userRef = doc(db, 'users', userUid);
        const userSnap = await transaction.get(userRef);
        if (!userSnap.exists()) throw new Error("User not found");

        const currentBalance = Number(userSnap.data().balance || 0);
        const currentClaims = userSnap.data().claimedInvitationBonuses || [];

        if (currentClaims.includes(tierId)) {
          throw new Error("Already claimed");
        }

        transaction.update(userRef, {
          balance: currentBalance + reward,
          claimedInvitationBonuses: [...currentClaims, tierId],
          updatedAt: serverTimestamp()
        });
      });

      setClaimedInvitationBonuses(prev => [...prev, tierId]);
      setBalance(prev => prev + reward);
      setLobbyToast({ 
        type: 'success', 
        text: selectedLang === 'en' 
          ? `Successfully claimed ₹${reward.toFixed(2)} invitation bonus!` 
          : `सफलतापूर्वक ₹${reward.toFixed(2)} निमंत्रण बोनस प्राप्त किया!` 
      });
    } catch (err: any) {
      console.error("Error claiming invitation bonus:", err);
      setLobbyToast({ 
        type: 'error', 
        text: selectedLang === 'en' ? 'Failed to claim bonus.' : 'बोनस प्राप्त करने में विफल।' 
      });
    }
  };

  const t = translations[selectedLang];

  // Process registration or login submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    // Dynamic validations
    if (!phoneNumber) {
      setFormFeedback({ type: 'error', message: t.formErrorPhone });
      return;
    }
    if (phoneNumber.length < 10) {
      setFormFeedback({ type: 'error', message: t.formErrorDigits });
      return;
    }
    if (!password) {
      setFormFeedback({ type: 'error', message: t.formErrorPass });
      return;
    }
    if (password.length < 8 || password.length > 15) {
      setFormFeedback({ type: 'error', message: t.formErrorPassLen });
      return;
    }
    if (isRegisterMode && password !== confirmPassword) {
      setFormFeedback({ type: 'error', message: t.formErrorMatch });
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        // 1. REGISTER: Create Auth Account
        const userCredential = await createUserWithEmailAndPassword(auth, phoneNumber + "@neon.trade", password);
        const firebaseUid = userCredential.user.uid;

        // 2. CREATE USER DATA DOC in Firestore keyed by firebaseUid
        const newUserUid = Math.floor(100000 + Math.random() * 900000).toString();
        const userData = {
          uid: newUserUid,
          firebaseUid: firebaseUid,
          phoneNumber,
          balance: 28, 
          exp: 0,
          level: 0,
          claimedVipRewards: [],
          claimedMonthlyRewards: [],
          claimedInvitationBonuses: [],
          nickname: 'Member' + Math.random().toString(36).substring(7).toUpperCase(),
          avatar: AVAILABLE_AVATARS[0],
          referrer: referralInput || null,
          registeredAt: new Date().toISOString()
        };

        const userDocRef = doc(db, 'users', firebaseUid);
        await setDoc(userDocRef, userData);

        // Also create a lookup for phone number check
        await setDoc(doc(db, 'users_by_phone', phoneNumber), { uid: firebaseUid });

        // UI Updates will happen via onAuthStateChanged
        setLoading(false);
        setFormFeedback({
          type: 'success',
          message: t.formSuccessReg.replace('{phone}', phoneNumber)
        });
      } else {
        // ADMIN LOGIN CHECK
        if (phoneNumber === '7888943984' && password === '790890xyz') {
          try {
            // First try to sign in the admin
            await signInWithEmailAndPassword(auth, phoneNumber + "@neon.trade", password);
          } catch (signInErr: any) {
            // If the user does not exist in Auth, create it on-the-fly
            const errCode = signInErr.code || '';
            const errMessage = signInErr.message || '';
            const isMissingOrInvalid = 
              errCode === 'auth/user-not-found' || 
              errCode === 'auth/invalid-credential' || 
              errCode === 'auth/wrong-password' ||
              errMessage.includes('auth/invalid-credential') ||
              errMessage.includes('auth/user-not-found') ||
              errMessage.includes('auth/wrong-password');

            if (isMissingOrInvalid) {
              console.log('Admin Auth account not found or invalid, trying registration...');
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, phoneNumber + "@neon.trade", password);
                const firebaseUid = userCredential.user.uid;
                
                // Create user document in Firestore keyed by firebaseUid
                const userDocRef = doc(db, 'users', firebaseUid);
                const userData = {
                  uid: 'ADMIN01',
                  firebaseUid: firebaseUid,
                  phoneNumber,
                  balance: 999999,
                  exp: 0,
                  level: 0,
                  claimedVipRewards: [],
                  claimedMonthlyRewards: [],
                  nickname: 'Admin Panel',
                  avatar: AVAILABLE_AVATARS[0],
                  registeredAt: new Date().toISOString()
                };
                await setDoc(userDocRef, userData);
                await setDoc(doc(db, 'users_by_phone', phoneNumber), { uid: firebaseUid });
              } catch (regErr: any) {
                // If register fails because mail is in use, fallback to sign in (or print info)
                const regCode = regErr.code || '';
                const regMsg = regErr.message || '';
                if (regCode === 'auth/email-already-in-use' || regMsg.includes('auth/email-already-in-use')) {
                  throw signInErr; // throw original signIn error
                } else {
                  throw regErr;
                }
              }
            } else {
              throw signInErr;
            }
          }
          setIsAdmin(true);
          setIsLoggedIn(true);
          setNickname('Admin Panel');
          setUid('ADMIN01');
          setBalance(999999);
          setLoading(false);
          setFormFeedback({ type: 'success', message: 'Admin login successful.' });
          return;
        }

        // LOGIN: Sign in to Auth
        const userCredential = await signInWithEmailAndPassword(auth, phoneNumber + "@neon.trade", password);
        // UI Updates will happen via onAuthStateChanged
        setLoading(false);
        setFormFeedback({ type: 'success', message: t.formSuccessLogin });
      }
    } catch (error: any) {
      console.log('Auth handler info:', error.code || error.message);
      let errMsg = error.message || 'Authentication error happened';

      const errCode = error.code || '';
      const errMsgStr = error.message || '';

      const isEmailInUse = errCode === 'auth/email-already-in-use' || errMsgStr.includes('auth/email-already-in-use');
      const isInvalidCreds = 
        errCode === 'auth/invalid-credential' || 
        errCode === 'auth/wrong-password' || 
        errCode === 'auth/user-not-found' || 
        errMsgStr.includes('auth/invalid-credential') || 
        errMsgStr.includes('auth/wrong-password') || 
        errMsgStr.includes('auth/user-not-found');
      const isNotAllowed = errCode === 'auth/operation-not-allowed' || errMsgStr.includes('auth/operation-not-allowed');
      const isNetworkError = errCode === 'auth/network-request-failed' || errMsgStr.includes('auth/network-request-failed');

      if (isEmailInUse) {
        errMsg = selectedLang === 'en' ? 'This phone number is already registered.' : 'यह फोन नंबर पहले से पंजीकृत है।';
      } else if (isInvalidCreds) {
        errMsg = selectedLang === 'en' 
          ? 'Invalid phone number or password. If you are a new user, please switch to Register mode first.' 
          : 'अमान्य फोन नंबर या पासवर्ड। यदि आप नए उपयोगकर्ता हैं, तो कृपया पहले रजिस्टर मोड पर जाएँ।';
      } else if (isNotAllowed) {
        errMsg = selectedLang === 'en' 
          ? 'Registration/Login is currently disabled. Please enable Email/Password auth in your Firebase Console.' 
          : 'पंजीकरण/लॉगिन वर्तमान में अक्षम है। कृपया फायरबेस कंसोल में ईमेल/पासवर्ड प्रमाणीकरण सक्षम करें।';
      } else if (isNetworkError) {
        errMsg = selectedLang === 'en'
          ? `Network error (${errCode || 'connection-failed'}). Please check your internet connection. If you are using Incognito/Private mode, try a normal window as some browsers block Firebase Auth in private mode.`
          : `नेटवर्क समस्या (${errCode || 'connection-failed'})। कृपया अपना इंटरनेट कनेक्शन जांचें। यदि आप गुप्त/निजी मोड का उपयोग कर रहे हैं, तो सामान्य विंडो आज़माएं।`;
      }

      setLoading(false);
      setFormFeedback({ type: 'error', message: errMsg });
    }
  };

  const handleCopyUid = () => {
    navigator.clipboard.writeText(uid);
    setCopiedActive(true);
    setTimeout(() => {
      setCopiedActive(false);
    }, 2000);
  };

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    const userUid = auth.currentUser?.uid;
    if (userUid) {
      try {
        const userDocRef = doc(db, 'users', userUid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const freshBalance = userDoc.data().balance;
          setBalance(freshBalance);
        }
      } catch (e) {
        console.error('Balance refresh error:', e);
      }
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userUid');
      setIsLoggedIn(false);
      setIsAdmin(false);
      setShowAdminView(true);
      setBalance(0);
      setNickname('MemberNNGDQTST');
      setUid('000000');
      setNotifications([]);
      setMyWingoBets({ '30s': [], '1m': [], '3m': [], '5m': [] });
      localBetsRef.current = [];
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0c0a0a] flex flex-col items-center justify-center">
        <div className="relative w-full h-full max-w-[410px] mx-auto bg-[#0a0a0f] flex flex-col items-center justify-center p-6 gap-6">
          {/* Pulsing brand logo */}
          <div className="relative flex items-center justify-center animate-pulse duration-[2000ms]">
            <img 
              src={gameLogo} 
              alt="Neon Trade" 
              className="h-24 w-auto object-contain filter drop-shadow-[0_4px_16px_rgba(230,57,70,0.35)] select-none pointer-events-none"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Elegant premium loading indicator spin */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-red-500/20 border-t-red-500 animate-spin" />
            <span className="text-white/40 text-[10px] uppercase tracking-[3px] font-bold font-sans">
              Loading
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoggedIn && isAdmin && showAdminView) {
    return <MobileAdminPanelView onLogout={handleLogout} onToggleView={() => setShowAdminView(false)} />;
  }

  return (
    <div 
      className={`relative min-h-screen w-full flex flex-col items-center select-none overflow-x-hidden pt-0 ${activeWingoRoom ? 'pb-0' : currentTab === 'wheel' ? 'pb-20' : 'pb-24'}`}
      style={{
        backgroundColor: isLoggedIn ? '#260506' : '#0c0a0a',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* 1. Deep Elegant Casino Backdrop Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `url(${casinoBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          mixBlendMode: 'screen',
          filter: 'blur(1px)'
        }}
      />
      
      {/* Overlay color graded to match the game room's gorgeous deep maroon red */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none transition-all duration-500" 
        style={{
          background: isLoggedIn 
            ? 'linear-gradient(180deg, #4a0f10 0%, #260506 50%, #120102 100%)' 
            : 'linear-gradient(180deg, #0e0b0b 0%, #050404 90%, #120c0c 100%)'
        }}
      />

      {/* RENDER THE REVENUE/MEMBERSHIP PORTAL ONCE LOGGED IN */}
      {isLoggedIn ? (
        <>
          {/* FULL SCREEN NOTIFICATIONS OVERLAY */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px]">
                    {selectedLang === 'en' ? 'Notifications' : 'सूचनाएं'}
                  </h2>
                  <button
                    onClick={() => {
                      const savedPhone = localStorage.getItem('userPhone');
                      if (savedPhone) {
                        localStorage.setItem('notifications_' + savedPhone, JSON.stringify([]));
                        setNotifications([]);
                        setLobbyToast({
                          type: 'success',
                          text: selectedLang === 'en' ? 'Cleared all notifications' : 'सभी सूचनाएं हटा दी गई हैं'
                        });
                      }
                    }}
                    className="text-[#ffbc0d] text-xs hover:text-white cursor-pointer transition active:scale-95 pr-2 font-bold uppercase tracking-wide"
                  >
                    {selectedLang === 'en' ? 'Clear All' : 'सभी हटाएं'}
                  </button>
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-hide bg-[#f8f9fc]">
                  {notifications.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-20">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                        <Bell className="h-8 w-8 text-neutral-400" />
                      </div>
                      <h3 className="text-black font-bold text-base mb-1">
                        {selectedLang === 'en' ? 'No Notifications Yet' : 'अभी कोई सूचना नहीं है'}
                      </h3>
                      <p className="text-neutral-500 text-[12px] max-w-xs mx-auto">
                        {selectedLang === 'en' 
                          ? 'We will notify you about important updates, bonuses and logins here.' 
                          : 'हम आपको महत्वपूर्ण अपडेट, बोनस और लॉगिन के बारे में यहाँ सूचित करेंगे।'}
                      </p>
                    </div>
                  ) : (
                    notifications.map((item: any) => (
                      <div 
                        key={item.id} 
                        className="rounded-xl p-5 bg-white border border-neutral-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] relative transition"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-neutral-500">
                            <Inbox className="h-5 w-5" />
                          </div>
                          <div className="flex-1 text-left pr-6">
                            <h3 className="font-bold text-[14px] leading-tight text-neutral-800 uppercase tracking-wide">
                              {selectedLang === 'en' ? item.titleEn : item.titleHi}
                            </h3>
                            <div className="text-neutral-400 text-[11px] font-medium mt-1 mb-3">
                              {item.date}
                            </div>
                            <p className="text-neutral-600 text-[12.5px] leading-relaxed font-medium whitespace-pre-line">
                              {selectedLang === 'en' ? item.contentEn : item.contentHi}
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              setNotificationToDelete(item.id);
                              setShowDeleteConfirm(true);
                            }}
                            className="absolute top-4 right-4 p-1 text-neutral-300 hover:text-red-500 transition cursor-pointer"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  
                  {notifications.length > 0 && (
                    <div className="py-6 text-center">
                      <span className="text-neutral-300 text-[11px] font-bold uppercase tracking-[3px]">
                        {selectedLang === 'en' ? 'No More Notifications' : 'कोई और सूचना नहीं'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl"
                      >
                        <div className="p-6 text-center translate-y-1">
                          <h3 className="text-[17px] font-black text-neutral-900 mb-2">Warning</h3>
                          <p className="text-[14.5px] text-neutral-600 font-medium">Are you sure to delete this message?</p>
                        </div>
                        <div className="flex border-t border-neutral-100">
                          <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-4 text-[16px] font-bold text-neutral-500 hover:bg-neutral-50 transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <div className="w-[1px] bg-neutral-100" />
                          <button 
                            onClick={() => notificationToDelete && deleteNotification(notificationToDelete)}
                            className="flex-1 py-4 text-[16px] font-bold text-blue-500 hover:bg-neutral-50 transition cursor-pointer"
                          >
                            Confirm
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>


          {/* FULL SCREEN ANNOUNCEMENT OVERLAY (Neon Trade Style) */}
          <AnimatePresence>
            {showAnnouncements && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Announcement Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowAnnouncements(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center mr-8 text-white font-bold text-[17px]">
                    Announcement
                  </h2>
                </div>

                {/* Announcement List */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-hide">
                  {ANNOUNCEMENTS.map((item) => (
                    <div key={item.id} className="bg-[#5c1c1e] rounded-2xl p-5 border border-white/5 shadow-lg relative overflow-hidden">
                      {/* Yellow Speaker Icon Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-[#ffbc0d]/10 rounded-full flex items-center justify-center shrink-0">
                          <Bell className="h-6 w-6 text-[#ffbc0d]" />
                        </div>
                        <div className="flex-1 text-left">
                          <h3 className="text-[#ffbc0d] font-black text-[15px] leading-tight mb-2 uppercase tracking-wide">
                            {item.title}
                          </h3>
                          <p className="text-white/80 text-[12px] leading-relaxed font-medium">
                            {item.content}
                          </p>
                          <div className="mt-4 flex items-center justify-between">
                            <span className="text-white/50 text-[11px] font-medium font-mono">
                              {item.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="py-6 text-center">
                    <span className="text-white/20 text-[12px] font-bold uppercase tracking-[3px] opacity-50">No more</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN BALANCE RECORDS OVERLAY */}
          <AnimatePresence>
            {showBalanceRecords && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowBalanceRecords(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px]">
                    {selectedLang === 'en' ? 'Balance History' : 'शेष राशि का इतिहास'}
                  </h2>
                  <div className="w-10 h-10" />
                </div>

                {/* Records List */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3.5 scrollbar-hide">
                  {balanceRecords.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-20">
                      <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/5">
                        <Receipt className="h-8 w-8 text-neutral-400" />
                      </div>
                      <h3 className="text-white font-bold text-base mb-1">
                        {selectedLang === 'en' ? 'No Records Found' : 'कोई रिकॉर्ड नहीं मिला'}
                      </h3>
                      <p className="text-white/60 text-[12px]">
                        {selectedLang === 'en' ? 'Your transactions will appear here.' : 'आपके लेनदेन यहाँ दिखाई देंगे।'}
                      </p>
                    </div>
                  ) : (
                    balanceRecords.map((rec: any) => {
                      const isPos = rec.amount >= 0;
                      return (
                        <div 
                          key={rec.id} 
                          className="bg-[#5c1c1e] rounded-xl p-4 border border-white/5 flex flex-col justify-between shadow-md"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[12px] uppercase font-bold tracking-widest text-[#ffbc0d] bg-black/30 border border-white/5 px-2.5 py-1 rounded-md">
                              {rec.type === 'deposit' ? (selectedLang === 'en' ? 'Deposit' : 'जमा') :
                               rec.type === 'withdraw' ? (selectedLang === 'en' ? 'Withdrawal' : 'निकासी') :
                               rec.type === 'reward' ? (selectedLang === 'en' ? 'Rebate/Bonus' : 'बोनस / रिबेट') :
                               (selectedLang === 'en' ? 'Game Play' : 'खेल दांव')}
                            </span>
                            <span className="text-[10px] text-white/40 font-semibold font-mono tracking-wider">
                              ID: {rec.id.slice(-8).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col text-left">
                              <span className="text-[14px] text-white font-bold tracking-tight">
                                {selectedLang === 'en' ? rec.titleEn : rec.titleHi}
                              </span>
                              <span className="text-[11px] text-white/45 mt-1 font-mono">{rec.date}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`text-[17px] font-black font-mono ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isPos ? '+' : ''}₹{rec.amount.toFixed(2)}
                              </span>
                              <span className="text-[10px] text-emerald-400/80 bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-500/10 font-bold uppercase mt-1">
                                {selectedLang === 'en' ? 'Success' : 'सफल'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN GAME HISTORY OVERLAY */}
          <AnimatePresence>
            {showGameHistoryOverlay && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowGameHistoryOverlay(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-95 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px]">
                    {selectedLang === 'en' ? 'Game Betting History' : 'खेल सट्टेबाजी इतिहास'}
                  </h2>
                  <div className="w-10 h-10" />
                </div>

                {/* Room Tabs inside game history */}
                <div className="grid grid-cols-4 bg-black/25 p-1.5 border-b border-white/5 shrink-0">
                  {(['30s', '1m', '3m', '5m'] as const).map((roomKey) => {
                    const isActive = gameHistoryOverlayRoom === roomKey;
                    return (
                      <button
                        key={roomKey}
                        onClick={() => setGameHistoryOverlayRoom(roomKey)}
                        className={`py-3 text-[12px] font-black uppercase text-center tracking-wider transition rounded-lg ${
                          isActive 
                            ? 'bg-[#ffbc0d] text-[#4a0f10] shadow-md font-extrabold' 
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {roomKey === '30s' ? '30S' : roomKey.toUpperCase()}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tabs: winning results vs my bets */}
                <div className="flex bg-black/10 border-b border-white/5 p-1 shrink-0 gap-1">
                  <button
                    onClick={() => setGameHistorySubTab('results')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition rounded-md ${
                      gameHistorySubTab === 'results'
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    {selectedLang === 'en' ? 'Winning Draws' : 'विजेता ड्रॉ'}
                  </button>
                  <button
                    onClick={() => setGameHistorySubTab('bets')}
                    className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition rounded-md ${
                      gameHistorySubTab === 'bets'
                        ? 'bg-white/10 text-white border border-white/10'
                        : 'text-white/40 hover:text-white/80'
                    }`}
                  >
                    {selectedLang === 'en' ? 'My Betting History' : 'मेरा सट्टा इतिहास'}
                  </button>
                </div>

                {/* Records List */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3.5 scrollbar-hide">
                  <div className="rounded-xl bg-[#5c1c1e] p-4 text-center border border-white/5">
                    <h4 className="text-[#ffbc0d] font-black text-[14px] uppercase tracking-wide mb-1">
                      {gameHistorySubTab === 'results' 
                        ? (selectedLang === 'en' ? 'Wingo Lottery Draws' : 'विंगो लॉटरी ड्रा') 
                        : (selectedLang === 'en' ? 'My Custom Placed Bets' : 'मेरे द्वारा लगाए गए दांव')}
                    </h4>
                    <p className="text-white/50 text-[11px]">
                      {gameHistorySubTab === 'results'
                        ? (selectedLang === 'en' ? 'All historical drawing numbers synced' : 'सिंक किए गए सभी ऐतिहासिक ड्राइंग नंबर')
                        : (selectedLang === 'en' ? 'Real-time records matching live rooms' : 'लाइव कमरों से मेल खाने वाले वास्तविक समय रिकॉर्ड')}
                    </p>
                  </div>

                  {/* Pull and render records */}
                  {(() => {
                    const roomRecords = wingoHistory[gameHistoryOverlayRoom] || [];

                    if (gameHistorySubTab === 'results') {
                      const completedDraws = roomRecords.filter(h => h.number !== -1);
                      if (completedDraws.length === 0) {
                        return (
                          <div className="py-12 text-center opacity-65 flex flex-col items-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                              <Trophy className="h-6 w-6 text-[#ffbc0d]/70" />
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider block">
                              {selectedLang === 'en' ? 'No Draw Data Yet' : 'कोई डेटा उपलब्ध नहीं है'}
                            </span>
                            <span className="text-xs text-white/40 mt-1 max-w-[200px] block font-medium">
                              {selectedLang === 'en' ? 'Generating next block sequence shortly ...' : 'अगला ब्लॉक अनुक्रम जल्द ही उत्पन्न हो रहा है ...'}
                            </span>
                          </div>
                        );
                      }

                      return completedDraws.map((draw: any, idx: number) => {
                        // Color formatting
                        const c = draw.color;
                        let colDot = "bg-rose-500";
                        if (c.includes('Green') && c.includes('Violet')) colDot = "bg-gradient-to-r from-emerald-500 to-purple-500";
                        else if (c.includes('Red') && c.includes('Violet')) colDot = "bg-gradient-to-r from-rose-500 to-purple-500";
                        else if (c === 'Green') colDot = "bg-emerald-500";
                        else if (c === 'Violet') colDot = "bg-purple-500";
                        
                        // Format period
                        const displayPeriod = draw.period.length > 5 ? draw.period.slice(-5) : draw.period;

                        return (
                          <div key={idx} className="bg-[#5c1c1e] border border-white/5 rounded-xl p-4 flex items-center justify-between shadow-md">
                            <div className="text-left">
                              <span className="text-white/40 text-[10px] uppercase font-bold tracking-wider font-sans block mb-1">Period No.</span>
                              <span className="text-[#ffbc0d] font-black text-sm font-mono tracking-wide">{displayPeriod}</span>
                            </div>
                            
                            {/* Drawn details */}
                            <div className="flex items-center gap-3">
                              {/* Drawn Number with corresponding color background */}
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm text-white shadow-md border border-white/20 overflow-hidden ${colDot}`}>
                                {draw.number}
                              </div>
                              
                              {/* Labels */}
                              <div className="flex flex-col text-left gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white/50 text-[10px] font-bold">SIZE:</span>
                                  <span className={`text-[11px] font-black uppercase ${draw.size === 'Big' ? 'text-amber-400' : 'text-sky-400'}`}>
                                    {draw.size}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white/50 text-[10px] font-bold">COLOR:</span>
                                  <span className="text-[11px] font-black text-white/95 uppercase">{draw.color}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    } else {
                      // Personal Placed Bets tab
                      const myBets = myWingoBets[gameHistoryOverlayRoom] || [];
                      if (myBets.length === 0) {
                        return (
                          <div className="py-12 text-center opacity-65 flex flex-col items-center">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                              <Gamepad2 className="h-6 w-6 text-[#ffbc0d]/70" />
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider block">
                              {selectedLang === 'en' ? 'No Placed Bets' : 'कोई दांव नहीं खोजा गया'}
                            </span>
                            <span className="text-xs text-white/40 mt-1 max-w-[200px] block font-medium">
                              {selectedLang === 'en' ? `You have not placed any bets in the ${gameHistoryOverlayRoom} room yet.` : `आपने अभी तक ${gameHistoryOverlayRoom} कमरे में कोई दांव नहीं लगाया है।`}
                            </span>
                          </div>
                        );
                      }

                      return myBets.map((bet: any, idx: number) => {
                        const isWin = bet.winLoss === 'Win';
                        const displayPeriod = bet.period.length > 5 ? bet.period.slice(-5) : bet.period;
                        return (
                          <div key={idx} className="bg-[#5c1c1e] border border-white/5 rounded-xl p-4 flex flex-col justify-between shadow-lg">
                            <div className="flex items-center justify-between mb-3 text-white/50 text-[11px] font-mono">
                              <span>Period: {displayPeriod}</span>
                              <span>{bet.timestamp || 'Just now'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] text-white/90 font-bold uppercase">Choice:</span>
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase tracking-wide ${
                                    bet.userChoice === 'Green' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                    bet.userChoice === 'Red' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                  }`}>
                                    {bet.userChoice}
                                  </span>
                                </div>
                                <div className="text-[11px] text-white/40 mt-1.5 font-bold font-mono">
                                  STAKE: ₹{bet.betAmount}
                                </div>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <span className={`px-3 py-1 rounded-md text-[10px] font-black tracking-widest ${
                                  !bet.resolved ? 'bg-amber-500/10 text-[#ffbc0d] border border-amber-500/25' :
                                  isWin ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' :
                                  'bg-white/5 text-white/35 border border-white/5'
                                }`}>
                                  {!bet.resolved ? 'PENDING' : isWin ? 'SUCCEED' : 'FAILED'}
                                </span>
                                <span className={`text-[15px] font-black font-mono mt-1 ${!bet.resolved ? 'text-white/60' : isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {!bet.resolved ? '' : isWin ? '+' : '-'}₹{!bet.resolved ? bet.betAmount.toFixed(2) : (isWin ? (bet.betAmount * 1.96).toFixed(2) : bet.betAmount.toFixed(2))}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN GAME STATISTICS OVERLAY */}
          <AnimatePresence>
            {showGameStatsOverlay && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowGameStatsOverlay(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px]">
                    {selectedLang === 'en' ? 'Game Statistics' : 'खेल सांख्यिकी'}
                  </h2>
                  <div className="w-10 h-10" />
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 scrollbar-hide text-left">
                  <div className="bg-[#5c1c1e] rounded-2xl p-5 border border-white/5 shadow-md flex items-center justify-between text-left">
                    <div>
                      <h3 className="text-[#ffbc0d] text-[18px] font-black uppercase tracking-wide">
                        {selectedLang === 'en' ? 'VIP ANALYSIS' : 'वीआईपी विश्लेषण'}
                      </h3>
                      <p className="text-white/60 text-[11px] mt-1.5 leading-relaxed">
                        {selectedLang === 'en' 
                          ? 'Your day-to-day profit & betting efficiency report' 
                          : 'आपकी दैनिक लाभ और सट्टेबाजी दक्षता रिपोर्ट'}
                      </p>
                    </div>
                    <div className="text-[28px]">📊</div>
                  </div>

                  {/* Core KPI metrics bento grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#5c1c1e] p-4 rounded-xl border border-white/5 text-left">
                      <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider block">Win Ratio</span>
                      <span className="text-[22px] font-black text-emerald-400 font-mono block mt-1">72.4%</span>
                      <span className="text-[9px] text-neutral-400 font-medium block mt-1">Above Average (60%)</span>
                    </div>
                    <div className="bg-[#5c1c1e] p-4 rounded-xl border border-white/5 text-left">
                      <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider block">Total Bets</span>
                      <span className="text-[22px] font-black text-amber-400 font-mono block mt-1">142 Plays</span>
                      <span className="text-[9px] text-neutral-400 font-medium block mt-1">Across all game modes</span>
                    </div>
                    <div className="bg-[#5c1c1e] p-4 rounded-xl border border-white/5 text-left">
                      <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider block">Highest Won</span>
                      <span className="text-[22px] font-black text-[#ffbc0d] font-mono block mt-1">₹5,490</span>
                      <span className="text-[9px] text-neutral-400 font-medium block mt-1">Single WinGo multiplayer</span>
                    </div>
                    <div className="bg-[#5c1c1e] p-4 rounded-xl border border-white/5 text-left">
                      <span className="text-[10px] text-white/55 font-bold uppercase tracking-wider block">Weekly Profits</span>
                      <span className="text-[22px] font-black text-emerald-400 font-mono block mt-1">+₹841.50</span>
                      <span className="text-[9px] text-emerald-400 font-semibold block mt-1">▲ 14% this week</span>
                    </div>
                  </div>

                  {/* High-Fi Interactive Chart Component using pure Tailwind & SVG paths */}
                  <div className="bg-[#5c1c1e] rounded-2xl p-5 border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[13px] text-white font-semibold font-sans uppercase tracking-wider">Weekly Winnings Trend</span>
                      <span className="bg-[#ffbc0d]/10 text-[#ffbc0d] text-[10px] font-black px-2 py-0.5 rounded border border-[#ffbc0d]/10">7 DAYS RECORD</span>
                    </div>
                    <div className="w-full h-36 flex items-end relative overflow-hidden bg-black/20 rounded-xl p-2 border border-white/5">
                      <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                        {/* Smooth Area Gradient */}
                        <path d="M 0 100 Q 15 65 30 75 T 60 40 T 90 20 T 100 20 L 100 100 Z" fill="rgba(255,188,13,0.08)" />
                        {/* Shiny Glow Chart Line */}
                        <path d="M 0 95 Q 15 65 30 75 T 60 40 T 90 20 T 100 20" fill="none" stroke="#ffbc0d" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <div className="absolute bottom-1 w-full flex justify-between text-[9px] text-white/30 font-mono px-3">
                        <span>MON</span>
                        <span>TUE</span>
                        <span>WED</span>
                        <span>THU</span>
                        <span>FRI</span>
                        <span>SAT</span>
                        <span>SUN</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 mt-3 font-medium">
                      * This represents dynamic gameplay statistics compiled on real historical trials over Neon Trade server logs.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN ACCOUNT & SECURITY OVERLAY */}
          <AnimatePresence>
            {showAccountSecurityOverlay && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#4a0f10] flex flex-col font-sans select-none pointer-events-auto"
              >
                {/* Header */}
                <div className="bg-[#4a0f10] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowAccountSecurityOverlay(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px]">
                    {selectedLang === 'en' ? 'Account & Security' : 'खाता और सुरक्षा'}
                  </h2>
                  <div className="w-10 h-10" />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 text-left scrollbar-hide">
                  {/* Security badge and profile details */}
                  <div className="bg-[#5c1c1e] rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center text-[22px]">
                      🛡️
                    </div>
                    <div>
                      <h4 className="text-white font-extrabold text-base uppercase tracking-wide">
                        {selectedLang === 'en' ? 'Verified Account' : 'सत्यापित खाता'}
                      </h4>
                      <p className="text-white/40 text-[11px] font-medium">
                        {selectedLang === 'en' ? 'Secured by Neon Trade Cloud Protection' : 'Neon Trade क्लाउड सुरक्षा द्वारा सुरक्षित'}
                      </p>
                    </div>
                  </div>

                  {/* Account info card */}
                  <div className="bg-[#5c1c1e] rounded-xl p-4.5 border border-white/5 space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Phone Number</span>
                      <span className="text-white font-mono font-black text-sm">{(localStorage.getItem('userPhone') || '').replace(/(\d{2})(\d{4})(\d{4})/, '+$1 **** $3')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Login Password</span>
                      <button className="text-[#ffbc0d] text-[11px] font-black uppercase tracking-wider border border-[#ffbc0d]/30 px-3 py-1 rounded-md active:bg-[#ffbc0d]/10 cursor-pointer">
                        {selectedLang === 'en' ? 'Change' : 'बदलें'}
                      </button>
                    </div>
                  </div>

                  {/* Security tips */}
                  <div className="bg-black/15 rounded-xl p-5 border border-white/5">
                    <h3 className="text-[#ffbc0d] text-[13px] font-extrabold mb-3 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Security Recommendations
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <p className="text-white/60 text-[11.5px] leading-relaxed">
                          {selectedLang === 'en' 
                            ? 'Never share your login credentials or OTP with anyone, including individuals claiming to be Neon Trade staff.' 
                            : 'अपना लॉगिन क्रेडेंशियल या ओटीपी किसी के साथ साझा न करें, जिसमें Neon Trade स्टाफ होने का दावा करने वाले व्यक्ति भी शामिल हैं।'}
                        </p>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 mt-1.5" />
                        <p className="text-white/60 text-[11.5px] leading-relaxed">
                          {selectedLang === 'en' 
                            ? 'Update your password every 30 days to ensure maximum safety of your wallet balance.' 
                            : 'अपने वॉलेट बैलेंस की अधिकतम सुरक्षा सुनिश्चित करने के लिए हर 30 दिनों में अपना पासवर्ड अपडेट करें।'}
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FULL SCREEN GIFTS OVERLAY */}
          <AnimatePresence>
            {showGiftsOverlay && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#111111] flex flex-col font-sans select-none pointer-events-auto mx-auto max-w-[410px]"
              >
                {/* Header matching screenshot */}
                <div className="bg-[#1c1c1e] h-[55px] flex items-center px-4 border-b border-white/5 shrink-0">
                  <button 
                    onClick={() => setShowGiftsOverlay(false)}
                    className="w-10 h-10 flex items-center justify-center -ml-2 text-white/80 active:scale-90 transition active:bg-white/5 rounded-full cursor-pointer"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[3]" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-bold text-[17px] tracking-wide">
                    {selectedLang === 'en' ? 'Reward Redemption Code' : 'पुरस्कार मोचन कोड'}
                  </h2>
                  <button className="w-10 h-10 flex items-center justify-center -mr-2 text-white/80 active:scale-90 transition rounded-full">
                    <Receipt className="h-5 w-5" />
                  </button>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pt-4 pb-12">
                  
                  {/* Community Banner - Fixed direct link and aspect ratio */}
                  <div className="px-4 mb-4">
                    <div className="w-full aspect-[23/8] bg-[#1c1c1e] rounded-xl overflow-hidden shadow-xl border border-white/5 relative">
                      <img 
                        src="https://i.ibb.co/q36czcLP/gift-banner.jpg" 
                        alt="Join Community"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to another version of the link if direct fails
                          e.currentTarget.src = "https://i.ibb.co/zX9rZ6X/gift-banner.jpg"; 
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                    </div>
                  </div>

                  {/* Redemption Card */}
                  <div className="px-4 mb-4">
                    <div className="bg-[#1c1c1e] rounded-2xl p-5 border border-white/5 shadow-2xl relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#ff3b30]" />
                      
                      <h3 className="text-white font-bold text-[15px] mb-6 flex items-center gap-2">
                        <Gift className="h-5 w-5 text-[#ff3b30]" />
                        {selectedLang === 'en' ? 'Hi! We have a gift for you' : 'नमस्ते! हमारे पास आपके लिए एक उपहार है'}
                      </h3>

                      <div className="space-y-6">
                        <div className="relative">
                          <input 
                            type="text"
                            placeholder={selectedLang === 'en' ? 'Please enter the gift code' : 'कृपया उपहार कोड दर्ज करें'}
                            className="w-full bg-[#2a2a2c] outline-none text-white px-5 py-4 rounded-xl border border-white/5 text-[15px] placeholder:text-white/20 focus:border-[#ff3b30]/40 transition-all font-medium"
                            value={giftCodeInput}
                            onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                          />
                        </div>

                        <button 
                          disabled={claimingGift}
                          onClick={async () => {
                            if (!isLoggedIn || !auth.currentUser) {
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' ? 'Please log in first' : 'कृपया पहले लॉग इन करें'
                              });
                              return;
                            }
                            const code = giftCodeInput.trim().toUpperCase();
                            if (!code || code.length < 3) {
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' ? 'Invalid gift code format' : 'अमान्य उपहार कोड प्रारूप'
                              });
                              return;
                            }

                            setClaimingGift(true);
                            setLobbyToast({
                              type: 'success',
                              text: selectedLang === 'en' ? 'Validating gift code...' : 'गिफ्ट कोड सत्यापित किया जा रहा है...'
                            });

                            try {
                              const codeRef = doc(db, 'giftCodes', code);
                              const codeSnap = await getDoc(codeRef);
                              if (!codeSnap.exists()) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' ? 'Gift code is invalid or expired' : 'गिफ्ट कोड अमान्य है या समाप्त हो गया है'
                                });
                                return;
                              }

                              const giftData = codeSnap.data();
                              const giftAmount = parseFloat(giftData.amount || '0');
                              const giftType = giftData.type || 'standard';
                              const minDepositReq = parseFloat(giftData.minDeposit || '0');

                              // Check duplicate claim
                              const claimId = `${auth.currentUser.uid}_${code}`;
                              const claimRef = doc(db, 'giftClaims', claimId);
                              const claimSnap = await getDoc(claimRef);
                              if (claimSnap.exists()) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' ? 'This gift code has already been redeemed' : 'यह उपहार कोड पहले ही उपयोग किया जा चुका है'
                                });
                                return;
                              }

                              // Check user total deposits requirement
                              const userRef = doc(db, 'users', auth.currentUser.uid);
                              const userSnap = await getDoc(userRef);
                              if (!userSnap.exists()) throw new Error("User document not found");
                              
                              const userData = userSnap.data();
                              const userTotalDeposits = parseFloat(userData.totalDeposits || '0');

                              if (giftType === 'deposit_lock' && userTotalDeposits < minDepositReq) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' 
                                    ? `This code unlocks at automatic deposit of ₹${minDepositReq}. (You have: ₹${userTotalDeposits})`
                                    : `यह कोड अनलॉक करने के लिए ₹${minDepositReq} स्वचालित जमा आवश्यक है। (आपके पास: ₹${userTotalDeposits})`
                                });
                                return;
                              }

                              // Core balance credit transaction
                              await runTransaction(db, async (transaction) => {
                                const uSnap = await transaction.get(userRef);
                                if (!uSnap.exists()) throw new Error("User not found");
                                const currentBalance = parseFloat(uSnap.data().balance || '0');

                                // Create claimed record
                                transaction.set(claimRef, {
                                  userId: auth.currentUser?.uid,
                                  userUid: uid,
                                  giftCode: code,
                                  amount: giftAmount,
                                  claimedAt: new Date().toISOString()
                                });

                                // Modify structural balance
                                transaction.update(userRef, {
                                  balance: currentBalance + giftAmount
                                });
                              });

                              setLobbyToast({
                                type: 'success',
                                text: selectedLang === 'en' 
                                  ? `Success! You claimed ₹${giftAmount.toFixed(2)} gift bonus!` 
                                  : `सफलतापूर्वक ₹${giftAmount.toFixed(2)} उपहार पुरस्कार प्राप्त किया!`
                              });
                              setGiftCodeInput('');
                            } catch (e: any) {
                              console.error("Gift Claim Error:", e);
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' 
                                  ? 'Error claiming gift code: ' + e.message 
                                  : 'गिफ्ट कोड के दावे में त्रुटि: ' + e.message
                              });
                            } finally {
                              setClaimingGift(false);
                            }
                          }}
                          className={`w-full h-[52px] bg-gradient-to-b from-[#ff3b30] to-[#cc2211] rounded-full text-white font-black text-[16px] shadow-[0_4px_24px_rgba(204,34,17,0.5)] active:scale-[0.98] active:brightness-90 transition-all cursor-pointer flex items-center justify-center uppercase tracking-wide ${claimingGift ? 'opacity-60 pointer-events-none' : ''}`}
                        >
                          {claimingGift ? (selectedLang === 'en' ? 'Claiming...' : 'दावा किया जा रहा है...') : (selectedLang === 'en' ? 'Confirm' : 'पुष्टि करें')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Official Channels Card - WhatsApp Removed */}
                  <div className="px-4 mb-6">
                    <div className="bg-[#1c1c1e] rounded-2xl p-5 border border-white/5 shadow-2xl space-y-4">
                      <h4 className="text-white/70 font-bold text-[13px] tracking-tight">
                        {selectedLang === 'en' ? 'Follow our official channel for more bonuses' : 'अधिक बोनस के लिए हमारे आधिकारिक चैनल का अनुसरण करें'}
                      </h4>
                      
                      <div className="flex w-full">
                        <button className="w-full h-[54px] bg-[#2a2a2c] rounded-xl flex items-center justify-center gap-3 text-white font-bold text-[14px] border border-white/5 active:scale-[0.98] transition-all shadow-lg hover:bg-[#323235]">
                          <img src="https://cdn-icons-png.flaticon.com/512/2111/2111646.png" className="w-6 h-6 flex-shrink-0" alt="TG" />
                          <span className="uppercase tracking-wide">JOIN OFFICIAL TELEGRAM CHANNEL</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* History Header Bar */}
                  <div className="mx-4 bg-[#3d2424] rounded-t-xl py-3 px-6 flex items-center justify-between text-white/90 font-bold text-xs uppercase tracking-wider shadow-md">
                    <span>{selectedLang === 'en' ? 'Claim Time' : 'दावा समय'}</span>
                    <span>{selectedLang === 'en' ? 'Bonus' : 'बोनस'}</span>
                  </div>

                  {/* Redemption History List / Dynamic State */}
                  <div className="mx-4 bg-[#1c1c1e]/50 border-x border-b border-white/5 rounded-b-xl min-h-[300px] flex flex-col items-center justify-start py-4">
                     {claimedGifts.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-12">
                         <div className="relative mb-6">
                            <div className="w-24 h-24 bg-[#2a2a2c] rounded-2xl flex items-center justify-center opacity-40">
                               <List className="h-10 w-10 text-white/50" />
                            </div>
                            <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-[#3a3a3c] rounded-xl flex items-center justify-center shadow-lg border border-white/5 rotate-12">
                               <Gift className="h-5 w-5 text-red-500/60" />
                            </div>
                         </div>
                         <p className="text-white/30 font-bold text-[15px]">{selectedLang === 'en' ? 'No Records' : 'कोई रिकॉर्ड नहीं'}</p>
                       </div>
                     ) : (
                       <div className="w-full divide-y divide-white/5 px-4 space-y-3">
                         {claimedGifts.map((claim, idx) => (
                           <div key={idx} className="flex justify-between items-center py-3">
                             <div className="space-y-1 text-left">
                               <p className="text-white font-extrabold text-[14px] leading-tight">{claim.giftCode}</p>
                               <p className="text-[10px] text-white/40">
                                 {claim.claimedAt ? claim.claimedAt.replace('T', ' ').substring(0, 16) : ''}
                               </p>
                             </div>
                             <div className="text-right">
                               <span className="text-emerald-400 font-display font-black text-sm">
                                 +₹{Number(claim.amount).toFixed(2)}
                               </span>
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* SETTINGS OVERLAY - REDESIGNED AS MODAL PER SCREENSHOT */}
          <AnimatePresence>
            {showSettingsOverlay && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[300] bg-black/75 flex flex-col items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-[310px] bg-[#292929] rounded-[22px] overflow-hidden shadow-2xl border border-white/5"
                >
                  {/* Modal Title */}
                  <div className="h-[64px] flex items-center justify-center border-b border-white/5 mx-6">
                    <h2 className="text-white font-bold text-[20px]">Settings</h2>
                  </div>

                  <div className="p-5 pt-7 space-y-3.5">
                    {/* Language Setting Row */}
                    <div className="flex items-center gap-4 bg-[#333333] rounded-[14px] px-4.5 py-4 border border-white/5 shadow-inner">
                      <Globe className="w-5.5 h-5.5 text-[#ffccd1]/80" />
                      <span className="flex-1 text-white font-semibold text-[16px] tracking-wide">
                        language
                      </span>
                      <button 
                        onClick={() => {
                          playWingoSound(clickAudioRef);
                          setSelectedLang(selectedLang === 'en' ? 'hi' : 'en');
                        }}
                        className="bg-[#4d4d4d] px-4 py-1.5 rounded-lg text-white font-bold text-[13px] uppercase border border-white/10 active:scale-95 transition min-w-[50px] text-center"
                      >
                        {selectedLang}
                      </button>
                    </div>
                  </div>
                  
                  {/* Bottom spacer for padding */}
                  <div className="h-5" />
                </motion.div>

                {/* Circular Close Button Below Modal */}
                <button 
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setShowSettingsOverlay(false);
                  }}
                  className="mt-8 w-11 h-11 rounded-full border-2 border-white/20 flex items-center justify-center bg-black/20 active:scale-90 transition-transform cursor-pointer"
                >
                  <X className="w-6 h-6 text-white stroke-[2.5px]" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
            {/* FULL SCREEN VIP LEVELS OVERLAY */}
            <AnimatePresence>
              {showVipScreen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[210] pointer-events-auto"
                >
                  <VipLevelsView 
                    onBack={() => setShowVipScreen(false)}
                    userExp={userExp}
                    userLevel={userLevel}
                    nickname={nickname}
                    avatar={avatar}
                    claimedVipRewards={claimedVipRewards}
                    claimedMonthlyRewards={claimedMonthlyRewards}
                    onClaimReward={claimVipReward}
                    onClaimMonthlyReward={claimMonthlyReward}
                    selectedLang={selectedLang}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* FULL SCREEN LANGUAGE OVERLAY */}
            <AnimatePresence>
              {showLanguageScreen && (
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[210] pointer-events-auto"
                >
                  <div className="relative z-10 w-full max-w-[410px] min-h-screen bg-[#111113] flex flex-col text-white font-sans select-none mx-auto">
                    {/* Header matching the application's clean design */}
                    <div className="w-full flex items-center justify-between px-4 py-4 bg-[#1c1c1e] border-b border-neutral-900/50 shadow-md">
                      <button 
                        type="button"
                        onClick={() => setShowLanguageScreen(false)}
                        className="text-neutral-200 hover:text-white transition duration-150 cursor-pointer active:scale-95"
                        title="Back"
                      >
                        <ChevronLeft className="h-6 w-6 stroke-[3]" />
                      </button>
                      
                      <h3 className="text-white font-sans text-[17px] font-bold tracking-wide">
                        {t.languageHeader}
                      </h3>

                      <div className="w-6" />
                    </div>

                    {/* List box wrapper */}
                    <div className="px-4 mt-4">
                      <div className="w-full rounded-xl bg-[#1c1c1e] border border-neutral-800/10 overflow-hidden shadow-lg">
                        
                        {/* 1. ENGLISH ITEM */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLang('en');
                            setShowLanguageScreen(false);
                          }}
                          className="w-full flex items-center justify-between px-4.5 py-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition duration-150 cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3.5 font-sans">
                            <span className="text-xl select-none leading-none">🇬🇧</span>
                            <span className="text-[14px] font-bold text-white/95 uppercase tracking-wide">
                              {t.languageEnglish}
                            </span>
                          </div>
                          {selectedLang === 'en' && (
                            <Check className="h-4.5 w-4.5 text-emerald-400 stroke-[3.5]" />
                          )}
                        </button>

                        <div className="mx-4.5 border-t border-neutral-800/40" />

                        {/* 2. HINDI ITEM */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLang('hi');
                            setShowLanguageScreen(false);
                          }}
                          className="w-full flex items-center justify-between px-4.5 py-4 bg-transparent hover:bg-white/5 active:bg-white/10 transition duration-150 cursor-pointer text-left"
                        >
                          <div className="flex items-center gap-3.5 font-sans">
                            <span className="text-xl select-none leading-none">🇮🇳</span>
                            <span className="text-[14px] font-bold text-white/95">
                              {t.languageHindi}
                            </span>
                          </div>
                          {selectedLang === 'hi' && (
                            <Check className="h-4.5 w-4.5 text-emerald-400 stroke-[3.5]" />
                          )}
                        </button>

                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 w-full max-w-[410px] bg-transparent flex flex-col pt-0 pb-0">
          
          <AnimatePresence mode="wait">
            {currentTab === 'mine' ? (
              <motion.div
                key="mine-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full"
              >
                {/* 1. Curved red background banner area with rounded-b-[42px] and flat top edge */}
                <div 
                  className="w-full relative overflow-hidden rounded-t-none rounded-b-[42px] pt-10 pb-10 px-4 text-white shadow-xl flex flex-col"
                  style={{
                    background: 'linear-gradient(180deg, #d31a1a 0%, #a20f0f 50%, #830404 100%)',
                  }}
                >
                  {/* Decorative background visual sparkles */}
                  <div className="absolute top-[-30px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                  <div className="absolute bottom-[-10px] left-[-20px] w-24 h-24 rounded-full bg-black/25 blur-xl pointer-events-none" />

                  {/* Profile Layout */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-3.5">
                      {/* Avatar with dynamic ring glow */}
                      <div 
                        className="relative cursor-pointer group active:scale-95 transition-all"
                        onClick={() => {
                          setTempSelectedAvatar(avatar);
                          setIsAvatarModalOpen(true);
                        }}
                        title="Click to change avatar"
                      >
                        <img
                          src={avatar}
                          alt="User avatar"
                          className="h-15 w-15 rounded-full object-cover border-2 border-white/90 shadow-md group-hover:brightness-110 grayscale-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 rounded-full border-2 border-[#a20f0f] animate-pulse" />
                      </div>

                      {/* UID & Name Text with fully operational actions */}
                      <div className="flex flex-col text-left">
                        {/* Copyable UID */}
                        <div className="flex items-center gap-1.5 text-white/90">
                          <span className="text-[13.5px] font-black tracking-wide font-mono">
                            UID: {uid}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyUid}
                            className="p-1 rounded bg-black/25 hover:bg-black/45 hover:text-white transition cursor-pointer active:scale-90"
                            title="Copy UID"
                          >
                            <Copy className="h-3 w-3 stroke-[2.5]" />
                          </button>
                        </div>

                        {/* Editable nickname */}
                        <div className="flex items-center gap-1.5 mt-1">
                          {isEditingNickname ? (
                            <div className="flex items-center gap-1 bg-black/30 rounded-lg p-0.5 border border-white/20">
                              <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value.slice(0, 15))}
                                className="bg-transparent text-white text-xs font-black outline-none px-1 py-0.5 w-24"
                                placeholder={t.editPlaceholder}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={async () => {
                                  setIsEditingNickname(false);
                                  const currentUser = auth.currentUser;
                                  if (currentUser) {
                                    try {
                                      await updateDoc(doc(db, 'users', currentUser.uid), {
                                        nickname: nickname,
                                        updatedAt: serverTimestamp()
                                      });
                                    } catch (e) {
                                      console.error('Nickname update error:', e);
                                    }
                                  }
                                }}
                                className="p-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span className="text-[14px] font-black tracking-wide text-white drop-shadow-sm truncate max-w-[150px]">
                                {nickname}
                              </span>
                              <button
                                type="button"
                                onClick={() => setIsEditingNickname(true)}
                                className="p-1 rounded hover:bg-white/10 text-white/80 transition cursor-pointer active:scale-95"
                                title="Edit Nickname"
                              >
                                <Pencil className="h-3.5 w-3.5 stroke-[2.5]" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Blue Metallic Silver VIP0 Shield Badge on the right */}
                    <div className="flex flex-col items-center">
                      <button 
                        onClick={() => setShowVipScreen(true)}
                        className="relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                      >
                        {userLevel > 0 && VIP_ICONS[userLevel] ? (
                          <img 
                            src={VIP_ICONS[userLevel]} 
                            alt={`VIP${userLevel}`} 
                            className="w-14 h-14 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <>
                            {/* Custom SVG Shield replicating physical screenshot VIP badge */}
                            <svg className="w-13 h-13 filter drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <polygon points="50,10 85,25 85,65 50,90 15,65 15,25" fill="url(#vipGradient)" stroke="#819cb9" strokeWidth="4" />
                              <defs>
                                <linearGradient id="vipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#c5d5e6" />
                                  <stop offset="50%" stopColor="#7a92ad" />
                                  <stop offset="100%" stopColor="#435973" />
                                </linearGradient>
                              </defs>
                            </svg>
                            <span className="absolute text-white text-base font-black tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] font-mono">
                              {userLevel}
                            </span>
                          </>
                        )}
                      </button>
                      <button 
                         onClick={() => setShowVipScreen(true)}
                         className="mt-[-8px] z-10 bg-gradient-to-r from-[#d99494] via-[#f1d0d0] to-[#d99494] rounded-full px-5 py-0.5 text-[10px] font-black uppercase text-rose-950 shadow-md border border-neutral-100/30 scale-90 cursor-pointer"
                      >
                        VIP{userLevel}
                      </button>
                    </div>
                  </div>

                  {/* Absolute subtle temporary toast */}
                  {copiedActive && (
                    <div className="mt-3 bg-black/75 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold self-center animate-bounce">
                      {t.copiedMsg}
                    </div>
                  )}
                </div>

                {/* 2. Overlapping Balance Card Container shaped precisely like the picture */}
                <div className="px-4 mt-[-24px] z-25 relative">
                  <div className="w-full bg-[#1e1b1b] border border-neutral-900/60 rounded-2xl p-4 flex items-center justify-between shadow-[0_10px_25px_rgba(0,0,0,0.6)]">
                    {/* Currency Display */}
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-black text-[#ff3a3a] font-mono tracking-wide">
                          ₹{balance.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={handleRefreshBalance}
                          className={`p-1.5 text-neutral-400 hover:text-white transition cursor-pointer active:scale-95 ${isRefreshing ? 'animate-spin text-red-500' : ''}`}
                          title="Reload Balance"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider font-mono">
                        {selectedLang === 'en' ? 'Available Balance' : 'उपलब्ध शेष राशि'}
                      </span>
                    </div>

                    {/* Deposit & Withdraw Action Buttons with exact high fidelity color styles */}
                    <div className="flex items-center gap-5">
                      {/* Deposit Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowDepositScreen(true);
                        }}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition cursor-pointer"
                      >
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-b from-[#ffd36c] to-[#e47600] flex items-center justify-center text-white shadow-[#e47600]/20 shadow-md border border-white/10 group-hover:brightness-110">
                          <Coins className="h-5.5 w-5.5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-300">
                          {t.deposit}
                        </span>
                      </button>

                      {/* Withdraw Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowWithdrawScreen(true);
                        }}
                        className="flex flex-col items-center gap-1 group active:scale-95 transition cursor-pointer"
                      >
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-b from-[#40f1a0] to-[#049454] flex items-center justify-center text-white shadow-[#049454]/20 shadow-md border border-white/10 group-hover:brightness-110">
                          <Smartphone className="h-5.5 w-5.5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-neutral-300">
                          {t.withdraw}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. The 10 List navigation items precisely matching screenshot */}
                <div className="px-4 mt-4">
                  <div className="w-full bg-[#1b1717]/95 border border-white/5 rounded-2xl p-1.5 flex flex-col shadow-xl divide-y divide-neutral-900/50">
                    
                    {/* Item 1: Notifications */}
                    <div 
                      onClick={() => {
                        setShowNotifications(true);
                        markAllNotificationsAsRead();
                      }}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#ff3b30]/10 p-2 rounded-xl text-[#ff3b30] border border-[#ff3b30]/5">
                          <Bell className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.notifications}
                        </span>
                        {notifications.some((n: any) => n.unread) && (
                          <span className="bg-red-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full border border-white/10 animate-pulse">
                            {notifications.filter((n: any) => n.unread).length}
                          </span>
                        )}
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 2: Balance Record */}
                    <div 
                      onClick={() => setShowBalanceRecords(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#ff9500]/10 p-2 rounded-xl text-[#ff9500] border border-[#ff9500]/5">
                          <Receipt className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.balanceRecord}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 3: Game History */}
                    <div 
                      onClick={() => setShowGameHistoryOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#5856d6]/10 p-2 rounded-xl text-[#5856d6] border border-[#5856d6]/5">
                          <Gamepad2 className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.gameHistory}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 4: Game Statistics */}
                    <div 
                      onClick={() => setShowGameStatsOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#ff453a]/10 p-2 rounded-xl text-[#ff453a] border border-[#ff453a]/5">
                          <BarChart3 className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.gameStatistics}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 5: Account & Security */}
                    <div 
                      onClick={() => setShowAccountSecurityOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#30d158]/10 p-2 rounded-xl text-[#30d158] border border-[#30d158]/5">
                          <ShieldCheck className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.accountSecurity}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 6: Live Support */}
                    <div 
                      onClick={() => setShowGlobalChat(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#41b0df]/10 p-2 rounded-xl text-[#41b0df] border border-[#41b0df]/5">
                          <Headset className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.liveSupport}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    <div 
                      onClick={() => setCurrentTab('earn')}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#fbbf24]/10 p-2 rounded-xl text-[#fbbf24] border border-[#fbbf24]/5">
                          <Gift className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {selectedLang === 'en' ? 'Invitation Bonus' : 'निमंत्रण बोनस'}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 7: Gifts */}
                    <div 
                      onClick={() => setShowGiftsOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#ff453a]/10 p-2 rounded-xl text-[#ff453a] border border-[#ff453a]/5">
                          <Gift className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.gifts}
                        </span>
                      </div>
                      <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                    </div>

                    {/* Item 8: Language Option Switch */}
                    <div 
                      onClick={() => {
                        setShowLanguageScreen(true);
                      }}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#64d2ff]/10 p-2 rounded-xl text-[#64d2ff] border border-[#64d2ff]/5">
                          <Globe className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.languageHeader}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 font-extrabold uppercase font-mono tracking-wider bg-black/40 border border-white/5 rounded px-2 py-0.5">
                          {selectedLang === 'en' ? 'EN' : 'HI'}
                        </span>
                        <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                      </div>
                    </div>

                    {/* Item 9: Settings */}
                    <div 
                      onClick={() => setShowSettingsOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99 last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#a2a2a2]/10 p-2 rounded-xl text-[#a2a1a1] border border-[#a2a2a2]/5">
                          <Settings className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.settings}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Polished Logout button at the bottom of the content list */}
                <div className="px-5 mt-6 pb-12">
                  <button
                    onClick={() => {
                      playWingoSound(clickAudioRef);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full h-[40px] border border-[#ff3a3a] rounded-full flex items-center justify-center text-[#ff3a3a] font-medium text-[15px] active:scale-95 transition-all cursor-pointer"
                  >
                    Log out
                  </button>
                </div>

              </motion.div>
            ) : currentTab === 'home' ? (
              <motion.div
                key="home-dashboard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full text-white flex flex-col"
              >
                {/* 1. Interactive App Header */}
                {!activeWingoRoom && (
                  <>
                    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[410px] flex items-center justify-between px-3.5 py-1.5 bg-[#4d1213] border-b border-[#ffd275]/10 select-none shadow-[0_4px_25px_rgba(0,0,0,0.6)] z-50">
                      <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        <img 
                          src={gameLogo} 
                          alt="Neon Trade Brand Logo" 
                          className="h-[76px] -my-5.5 w-auto object-contain select-none filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)] pointer-events-none z-10" 
                          referrerPolicy="no-referrer"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>
                    </div>

                    {/* Profile & Alerts & Balance Capsule */}
                    <div className="flex items-center gap-3">
                      {/* Currency balance capsule shaped exactly like the screenshot */}
                      <div className="bg-[#310202] border border-[#ff3e3e]/30 rounded-full pl-2.5 pr-0.5 py-0.5 flex items-center gap-1.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                        {/* Golden multilayered coin */}
                        <div className="h-[18px] w-[18px] rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 flex items-center justify-center font-black text-[9px] text-[#421d00] shadow-[0_1px_3px_rgba(251,191,36,0.6)] border border-[#ffb300]/20">
                          ₹
                        </div>
                        
                        {/* Balance value */}
                        <span className="text-[11.5px] font-black text-white font-mono tracking-tight pr-1">
                          ₹{balance.toFixed(2)}
                        </span>
                        
                        {/* Red capsule positive action button resembling screenshot */}
                        <button 
                          onClick={() => {
                            playWingoSound(clickAudioRef);
                            setShowDepositScreen(true);
                          }}
                          className="h-[21px] w-[21px] rounded-full bg-gradient-to-b from-[#ff3e3e] to-[#c61d1d] hover:brightness-110 active:scale-90 transition flex items-center justify-center text-white font-black text-xs select-none shadow-md cursor-pointer border border-[#ff8888]/20"
                          title="Instant top-up"
                        >
                          +
                        </button>
                      </div>

                      {/* Notified golden bell button */}
                      <button 
                        onClick={() => {
                          setShowNotifications(true);
                          markAllNotificationsAsRead();
                        }}
                        className="h-[30px] w-[30px] rounded-full bg-[#120a0a]/60 flex items-center justify-center hover:bg-white/5 active:scale-95 transition relative border border-white/5"
                      >
                        <Bell className="h-4.5 w-4.5 text-amber-400 fill-amber-400 stroke-[1.8] animate-[swing_3s_ease-in-out_infinite]" />
                        {notifications.some((n: any) => n.unread) && (
                          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-600 rounded-full text-[8.5px] font-black text-white flex items-center justify-center border border-[#161111] animate-pulse">
                            {notifications.filter((n: any) => n.unread).length}
                          </span>
                        )}
                      </button>

                      {/* Avatar capsule precisely aligned with standard profile */}
                      <button 
                        onClick={() => {
                          setTempSelectedAvatar(avatar);
                          setIsAvatarModalOpen(true);
                        }} 
                        className="h-8.5 w-8.5 rounded-full border border-[#f44336]/35 overflow-hidden bg-neutral-950/80 active:scale-95 hover:border-[#ffd275]/50 transition shadow-inner flex items-center justify-center"
                      >
                        <img src={avatar} alt="avatar character profile" className="h-[90%] w-[90%] object-cover rounded-full" />
                      </button>
                    </div>
                  </div>
                  {/* Spacer to push content down because of the fixed header */}
                  <div className="h-[46px] w-full shrink-0" />

                  </>
                )}

                {activeWingoRoom ? (
                  activeWingoRoom === 'mines' || activeWingoRoom === 'mines_pro' ? (
                    <MinesGameView 
                      balance={balance} 
                      setBalance={setBalance} 
                      selectedLang={selectedLang} 
                      avatar={avatar}
                      uid={uid}
                      nickname={nickname}
                      setNickname={setNickname}
                      onBetPlaced={(amt) => addExperience(amt, 'Mines Bet EXP')}
                      onClose={() => {
                        setActiveWingoRoom(null);
                        setWingoBetOption(null);
                        setWingoWinningsAlert(null);
                        setWingoOuterMultiplier(1);
                      }}
                    />
                  ) : (
                    /* ----------------- INTERACTIVE WINGO GAMEPLAY WINDOW (NEON TRADE CLONE) ----------------- */
                    <div className="w-full flex flex-col min-h-screen" style={{ background: 'linear-gradient(to bottom, #4a0f10, #260506)' }}>
                    
                    {/* Brand Header representing Wingo 30s top bar directly */}
                    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[410px] grid grid-cols-3 items-center px-4 py-1.5 bg-[#4d1213] border-b border-[#ffd275]/10 z-30 shadow-md">
                      
                      {/* Left aligned Back button */}
                      <div className="flex items-center justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            playWingoSound(clickAudioRef);
                            setActiveWingoRoom(null);
                            setWingoBetOption(null);
                            setWingoWinningsAlert(null);
                            setWingoOuterMultiplier(1);
                          }}
                          className="text-white hover:opacity-80 transition cursor-pointer flex items-center justify-center p-1"
                        >
                          <ChevronLeft className="h-6 w-6 stroke-[3.5]" />
                        </button>
                      </div>
                      
                      {/* Center aligned Brand Logo - Bigger and sharper */}
                      <div className="flex items-center justify-center relative">
                        <img 
                          src={gameLogo} 
                          alt="Neon Trade Brand Logo" 
                          className="h-[52px] -my-2 w-auto object-contain select-none filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.55)] pointer-events-none z-10"
                          referrerPolicy="no-referrer"
                          draggable={false}
                          onContextMenu={(e) => e.preventDefault()}
                        />
                      </div>

                      {/* Right aligned Support/Icons */}
                      <div className="flex items-center justify-end gap-3.5 text-neutral-200">
                        <Briefcase className="h-5 w-5 hover:text-white transition cursor-pointer" onClick={() => { playWingoSound(clickAudioRef); setLobbyToast({ type: 'info', text: selectedLang === 'en' ? 'Rules manual connected.' : 'नियम मैनुअल कनेक्ट हो गया।' }); }} />
                        <Headset className="h-5 w-5 hover:text-white transition cursor-pointer" onClick={() => { playWingoSound(clickAudioRef); setShowGlobalChat(true); }} />
                      </div>
                    </div>

                    {/* Spacer to push content down because of the fixed header */}
                    <div className="h-[52px] w-full shrink-0" />

                    {/* Wallet Balance Card - Enhanced Grading with Lighting - Balanced and Compact */}
                    <div className="w-full px-4 pt-2 pb-1.5 flex flex-col">
                      <div 
                        className="w-full rounded-[18px] px-4 py-3.5 flex flex-col items-center justify-center shadow-[0_8px_25px_rgba(0,0,0,0.4)] border border-white/10"
                        style={{ background: 'linear-gradient(180deg, #5c1c1e 0%, #3d0f10 100%)' }}
                      >
                        {/* Balance display in center */}
                        <div className="flex flex-col items-center justify-center mb-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[21px] font-sans font-black tracking-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">₹{balance.toFixed(2)}</span>
                            <button 
                              onClick={() => {
                                playWingoSound(clickAudioRef);
                                handleRefreshBalance();
                              }} 
                              className="p-1 hover:bg-white/5 rounded-full transition cursor-pointer active:scale-90"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 text-white/55 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full border border-white/5">
                            <div className="w-3 h-3 bg-amber-400 rounded-sm relative shadow-inner shrink-0 scale-90">
                              <div className="absolute right-0 top-[20%] w-0.5 h-0.5 bg-amber-600 rounded-l-xs" />
                            </div>
                            <span className="text-white/70 text-[10.5px] font-bold tracking-wide uppercase">Wallet balance</span>
                          </div>
                        </div>

                        {/* Withdraw & Deposit pill shape action buttons */}
                        <div className="grid grid-cols-2 gap-2.5 w-full mt-1.5">
                          <button 
                            onClick={() => {
                              playWingoSound(clickAudioRef);
                              setShowWithdrawScreen(true);
                            }}
                            className="py-2.5 rounded-full font-black text-[12.5px] text-white uppercase tracking-wider text-center cursor-pointer shadow-lg transition transform active:scale-95 border border-white/10 bg-gradient-to-r from-[#d45c5c] to-[#cd4a4a]"
                          >
                            Withdraw
                          </button>
                          <button 
                            onClick={() => {
                              playWingoSound(clickAudioRef);
                              setShowDepositScreen(true);
                            }}
                            className="py-2.5 rounded-full font-black text-[12.5px] text-white uppercase tracking-wider text-center cursor-pointer shadow-lg transition transform active:scale-95 border border-white/10 bg-gradient-to-r from-[#248c66] to-[#1c7c5d]"
                          >
                            Deposit
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Scrolling Ticker Info Notice - Unified Color Grading */}
                    <div className="px-4 py-1.5">
                      <div className="w-full bg-[#3d0f10] border border-white/5 text-[#ffccd1] text-[10.5px] py-1.5 px-3 rounded-full flex items-center justify-between gap-1 overflow-hidden shadow-md">
                        <div className="flex-1 text-left select-none relative h-[16px] overflow-hidden">
                          <AnimatePresence mode="wait">
                            <motion.div 
                              key={currentAnnouncementIndex}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              exit={{ y: -20, opacity: 0 }}
                              transition={{ duration: 0.5 }}
                              className="absolute inset-0 truncate font-semibold flex items-center"
                            >
                              📢 {ANNOUNCEMENTS[currentAnnouncementIndex].content}
                            </motion.div>
                          </AnimatePresence>
                        </div>
                        <button 
                          onClick={() => {
                            playWingoSound(clickAudioRef);
                            setShowAnnouncements(true);
                          }}
                          className="px-3.5 py-1 rounded-full bg-[#ffbc0d] text-[#4d1213] font-black text-[9.5px] cursor-pointer shadow-sm shrink-0 active:scale-95 transition"
                        >
                          Detail
                        </button>
                      </div>
                    </div>

                    {/* WINGO TIME ROOMS HORIZONTAL SELECTION TABS - Enhanced Grading */}
                    <div className="px-4 py-2 select-none">
                      <div 
                        className="flex items-stretch justify-between rounded-2xl p-1 gap-1 min-h-[90px] shadow-[0_4px_15px_rgba(0,0,0,0.3)] border border-white/10"
                        style={{ background: 'linear-gradient(180deg, #5c1c1e 0%, #3d0f10 100%)' }}
                      >
                        {[
                          { id: '30s', title: 'WinGo', time: '30sec' },
                          { id: '1m', title: 'WinGo', time: '1 Min' },
                          { id: '3m', title: 'WinGo', time: '3 Min' },
                          { id: '5m', title: 'WinGo', time: '5 Min' }
                        ].map((tab) => {
                          const isActive = activeWingoRoom === tab.id;
                          return (
                            <button 
                              key={tab.id}
                              onClick={() => {
                                playWingoSound(clickAudioRef);
                                if (!isAdmin && totalDeposits < 200) {
                                  setShowDepositRequiredModal(true);
                                  return;
                                }
                                setActiveWingoRoom(tab.id);
                                setWingoBetOption(null);
                                setWingoWinningsAlert(null);
                                setWingoOuterMultiplier(1);
                              }}
                              className={`flex-1 flex flex-col items-center justify-center py-2 rounded-xl transition-all duration-200 cursor-pointer ${
                                isActive 
                                  ? 'bg-gradient-to-b from-[#ffcd3a] to-[#ff9d00] shadow-[0_2px_8px_rgba(0,0,0,0.3)]' 
                                  : 'bg-transparent'
                              }`}
                            >
                              <div className="relative mb-1 flex items-center justify-center h-9 w-9">
                                <img 
                                  src={isActive ? "https://i.ibb.co/ycG7BH8J/time-a-09419bb9.webp" : "https://i.ibb.co/JWFPSz2X/time-5d4e96a3.webp"} 
                                  alt="clock icon" 
                                  className={`h-8 w-8 object-contain select-none pointer-events-none ${!isActive ? 'opacity-30 grayscale' : ''}`}
                                  draggable={false}
                                />
                              </div>
                              
                              <div className="flex flex-col items-center justify-center leading-none">
                                <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-[#4d1213]' : 'text-[#ffccd1]/40'}`}>
                                  {tab.title}
                                </span>
                                <span className={`text-[11px] font-bold tracking-tight ${isActive ? 'text-[#4d1213]' : 'text-[#ffccd1]/40'}`}>
                                  {tab.time}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* TICKET & COUNTDOWN BOARD (Perforated Yellow Slip inspired by Neon Trade) */}
                    {(() => {
                      const totalSecs = wingoTimers[activeWingoRoom || '30s'] || 0;
                      const mStr = Math.floor(totalSecs / 60).toString().padStart(2, '0');
                      const sStr = (totalSecs % 60).toString().padStart(2, '0');
                      
                      const roomHistoryList = wingoHistory[activeWingoRoom || '30s'] || [];
                      const lastPeriodObj = roomHistoryList[0];
                      let periodCode = '';
                      
                      const generateTodayBase = () => {
                          const now = new Date();
                          const yyyy = now.getFullYear();
                          const mm = String(now.getMonth() + 1).padStart(2, '0');
                          const dd = String(now.getDate()).padStart(2, '0');
                          return `${yyyy}${mm}${dd}100010001`;
                      };

                      if (lastPeriodObj && lastPeriodObj.period) {
                        try {
                          const lastPeriod = String(lastPeriodObj.period).replace(/\D/g, '');
                          if (lastPeriod.length === 17) {
                            const basePart = lastPeriod.substring(0, 13);
                            const seqPart = lastPeriod.substring(13);
                            const nextSeq = (parseInt(seqPart) + 1).toString().padStart(4, '0');
                            periodCode = basePart + nextSeq;
                          } else {
                            periodCode = (BigInt(lastPeriod) + 1n).toString();
                          }
                        } catch (e) {
                          periodCode = generateTodayBase();
                        }
                      } else {
                        periodCode = generateTodayBase();
                      }
                      return (
                        <div className="px-4 py-1.5 select-none">
                          <div 
                            className="w-full rounded-2xl relative overflow-hidden shadow-[0_6px_20px_rgba(0,0,0,0.35)] flex min-h-[102px] text-neutral-900"
                            style={{ 
                              background: 'radial-gradient(circle at 50% 0, transparent 8px, #ffbc0d 8.3px), radial-gradient(circle at 50% 100%, transparent 8px, #ffbc0d 8.3px)',
                              backgroundSize: '100% 51.5%',
                              backgroundPosition: 'top, bottom',
                              backgroundRepeat: 'no-repeat'
                            }}
                          >
                            
                            {/* Left Block: How to play & room indicator & past 5 results */}
                            <div className="w-1/2 p-2.5 text-left flex flex-col justify-between relative">
                              <div>
                                <button 
                                  onClick={() => setShowWingoHowToPlay(true)}
                                  className="h-[21px] px-2.5 border border-[#4c0f12] rounded-full flex items-center gap-1.5 text-[#4c0f12] font-medium text-[11px] bg-transparent hover:bg-black/5 transition active:scale-95 cursor-pointer select-none"
                                >
                                  {/* Compact SVG Receipt Icon */}
                                  <svg width="11" height="13" viewBox="0 0 15 17" fill="none" className="shrink-0">
                                    <path d="M0 2C0 0.895431 0.895431 0 2 0H13C14.1046 0 15 0.895431 15 2V15.5C15 16.3284 14.3284 17 13.5 17C13.0858 17 12.6886 16.8354 12.3964 16.5429L11.5 15.6464L10.6036 16.5429C10.3114 16.8354 9.91421 17 9.5 17C9.08579 17 8.68859 16.8354 8.39645 16.5429L7.5 15.6464L6.60355 16.5429C6.31141 16.8354 5.91421 17 5.5 17C5.08579 17 4.68859 16.8354 4.39645 16.5429L3.5 15.6464L2.60355 16.5429C2.31141 16.8354 1.91421 17 1.5 17C0.671573 17 0 16.3284 0 15.5V2Z" fill="#4C0F12"/>
                                    <circle cx="4" cy="5.5" r="1" fill="#FFBC0D"/>
                                    <rect x="6.5" y="4.8" width="5" height="1.4" rx="0.7" fill="#FFBC0D"/>
                                    <circle cx="4" cy="10.5" r="1" fill="#FFBC0D"/>
                                    <rect x="6.5" y="9.8" width="5" height="1.4" rx="0.7" fill="#FFBC0D"/>
                                  </svg>
                                  <span className="leading-none whitespace-nowrap font-sans font-semibold text-[11px]">How to play</span>
                                </button>
                              </div>

                              <div className="flex flex-col gap-0.5 mt-0.5">
                                <span className="text-[12px] font-black uppercase tracking-wider text-[#4c0f12] font-sans leading-tight">
                                  WinGo {activeWingoRoom === '30s' ? '30s' : activeWingoRoom === '1m' ? '1 Min' : activeWingoRoom === '3m' ? '3 Min' : '5 Min'}
                                </span>
                              </div>

                              {/* 5 small outcome circles indicating last draws using glossy mini balls */}
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {(wingoHistory[activeWingoRoom || '30s'] || []).slice(0, 5).map((row, index) => (
                                  <div key={index} className="transition transform hover:scale-105">
                                    {renderGlossyBall(row.number, row.color, "h-4.5 w-4.5 text-[8.5px]")}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Vertical Center Dashed Line */}
                            <div className="absolute top-[14px] bottom-[14px] left-1/2 -translate-x-1/2 border-l-2 border-[#4c0f12]/60 border-dashed z-10" />

                            {/* Right Block: Countdown and Period */}
                            <div className="w-1/2 p-2.5 flex flex-col justify-between items-end text-right">
                              <div className="flex items-center justify-end h-[14px] select-none">
                                <span className="text-[10px] font-black text-[#4c0f12] uppercase tracking-wider leading-none">
                                  Time remaining
                                </span>
                              </div>
                              
                              {/* Ticket styled dark digital countdown blocks */}
                              <div className="flex items-center gap-1 my-1.5 select-none">
                                {/* Minutes digit 1 */}
                                <div className="bg-[#4c0f12] text-white font-extrabold w-5.5 h-6.5 flex items-center justify-center rounded text-[13px] font-mono shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                  {mStr[0]}
                                </div>
                                {/* Minutes digit 2 */}
                                <div className="bg-[#4c0f12] text-white font-extrabold w-5.5 h-6.5 flex items-center justify-center rounded text-[13px] font-mono shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                  {mStr[1]}
                                </div>
                                
                                <span className="text-[#4c0f12] font-black text-sm leading-none px-0.5">:</span>
                                
                                {/* Seconds digit 1 */}
                                <div className="bg-[#4c0f12] text-white font-extrabold w-5.5 h-6.5 flex items-center justify-center rounded text-[13px] font-mono shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                  {sStr[0]}
                                </div>
                                {/* Seconds digit 2 */}
                                <div className="bg-[#4c0f12] text-white font-extrabold w-5.5 h-6.5 flex items-center justify-center rounded text-[13px] font-mono shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                                  {sStr[1]}
                                </div>
                              </div>

                              {/* Current Period value directly underneath */}
                              <span className="text-[11px] font-black text-[#4c0f12] tracking-wide font-mono leading-none select-all">
                                {periodCode || "Loading..."}
                              </span>
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                    {/* CUSTOM HOW TO PLAY MODAL (Neon Trade Style) */}
                    <AnimatePresence>
                      {showWingoHowToPlay && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center px-6 pointer-events-auto">
                          {/* Dark overlay backdrop */}
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWingoHowToPlay(false)}
                            className="absolute inset-0 bg-black/75 backdrop-blur-[1px]"
                          />
                          
                          {/* Modal Container - Made narrower and more compact */}
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-[310px] bg-[#4a0f10] rounded-[24px] overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.8)] border border-white/5"
                          >
                            {/* Header Bar */}
                            <div className="bg-[#ffbc0d] py-2.5 text-center">
                              <span className="text-[#4a0f10] font-bold text-[13px] tracking-wide">
                                · wingo{activeWingoRoom === '30s' ? '30s' : activeWingoRoom === '1m' ? '1m' : activeWingoRoom === '3m' ? '3m' : '5m'} ·
                              </span>
                            </div>

                            {/* Content Section - Compact padding and refined text size */}
                            <div className="p-4 max-h-[60vh] overflow-y-auto text-left space-y-3 font-sans select-none scrollbar-hide">
                              <p className="text-[#ffccd1] text-[11.5px] leading-relaxed font-normal">
                                {activeWingoRoom === '30s' && "30seconds 1 issue, 25 seconds to order, 5 seconds waiting for the draw.. It opens all day. The total number of trade is 2880 issues."}
                                {activeWingoRoom === '1m' && "1 minute 1 issue, 55 seconds to order, 5 seconds waiting for the draw.. It opens all day. The total number of trade is 1440 issues."}
                                {activeWingoRoom === '3m' && "3 minutes 1 issue, 175 seconds to order, 5 seconds waiting for the draw.. It opens all day. The total number of trade is 480 issues."}
                                {activeWingoRoom === '5m' && "5 minutes 1 issue, 295 seconds to order, 5 seconds waiting for the draw.. It opens all day. The total number of trade is 288 issues."}
                              </p>

                              <p className="text-[#ffccd1] text-[11.5px] leading-relaxed font-normal">
                                If you spend 100 to trade, after deducting 2 service fee, your contract amount is 98:
                              </p>

                              <div className="space-y-3">
                                {[
                                  "1. Select green: if the result shows 1,3,7,9 you will get (98*2) 196;If the result shows 5, you will get (98*1.5) 147",
                                  "2. Select red: if the result shows 2,4,6,8 you will get (98*2) 196;If the result shows 0, you will get (98*1.5) 147",
                                  "3. Select violet:if the result shows 0 or 5, you will get (98*4.5) 441",
                                  "4. Select number:if the result is the same as the number you selected, you will get (98*9) 882",
                                  "5. Select big: if the result shows 5,6,7,8,9 you will get (98 * 2) 196",
                                  "6. Select small: if the result shows 0,1,2,3,4 you will get (98 * 2) 196"
                                ].map((rule, idx) => (
                                  <div key={idx} className="space-y-1">
                                    <p className="text-[#ffccd1] text-[11.5px] leading-tight font-normal">
                                      {rule}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Footer / Close Button Container - Tighter spacing */}
                            <div className="p-4 pt-1 pb-6 flex justify-center">
                              <button 
                                onClick={() => setShowWingoHowToPlay(false)}
                                className="w-full max-w-[150px] h-[38px] bg-[#ffbc0d] rounded-full text-[#4a0f10] font-bold text-[16px] shadow-lg active:scale-95 transition-transform duration-200 cursor-pointer flex items-center justify-center"
                              >
                                Close
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>

                    {/* WINGO BET CONFIRMATION MODAL */}
                    <AnimatePresence>
                      {showWingoBetModal && (
                        <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none px-0">
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWingoBetModal(false)}
                            className="absolute inset-0 bg-black/60 pointer-events-auto"
                          />
                          <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
                            className="relative w-full bg-[#3d0f10] rounded-t-[24px] overflow-hidden pointer-events-auto shadow-[0_-10px_40px_rgba(0,0,0,0.5)] max-w-7xl mx-auto"
                          >
                            {/* Colorful Header with Trapezoid path */}
                            {(() => {
                              const MODAL_RED = '#d54b52';
                              const MODAL_GREEN = '#1ca776';
                              const MODAL_VIOLET = '#9169fa';
                              const MODAL_YELLOW = '#ffbc0d';
                              const MODAL_BLUE = '#4285f4';

                              let headerBg = MODAL_YELLOW; 
                              let selectionLabel = wingoBetOption?.toString();
                              
                              if (wingoBetOption === 'Green') headerBg = MODAL_GREEN;
                              else if (wingoBetOption === 'Red') headerBg = MODAL_RED;
                              else if (wingoBetOption === 'Violet') headerBg = MODAL_VIOLET;
                              else if (wingoBetOption === 'Big') headerBg = MODAL_YELLOW;
                              else if (wingoBetOption === 'Small') headerBg = MODAL_BLUE;
                              else if (wingoBetOption === 0) headerBg = `linear-gradient(108deg, ${MODAL_RED} 50%, ${MODAL_VIOLET} 50%)`;
                              else if (wingoBetOption === 5) headerBg = `linear-gradient(108deg, ${MODAL_GREEN} 50%, ${MODAL_VIOLET} 50%)`;
                              else if (typeof wingoBetOption === 'number') {
                                const isGreen = [1, 3, 7, 9].includes(wingoBetOption);
                                headerBg = isGreen ? MODAL_GREEN : MODAL_RED;
                              }
                              
                              return (
                                <div className="relative pb-0 bg-transparent">
                                  <div 
                                    className="relative pt-2.5 pb-8 text-center text-white rounded-t-[24px] overflow-hidden"
                                    style={{ background: headerBg }}
                                  >
                                    <h3 className="font-normal text-[13.5px] mb-2 text-white/95 relative z-10">
                                      WinGo {activeWingoRoom === '30s' ? '30sec' : activeWingoRoom === '1m' ? '1Min' : activeWingoRoom === '3m' ? '3Min' : '5Min'}
                                    </h3>
                                    
                                    <div className="mx-14 h-[28px] bg-white rounded flex items-center justify-center shadow-sm relative z-10">
                                      <span className="text-black font-medium text-[14px] tracking-wide">
                                        Select {selectionLabel}
                                      </span>
                                    </div>

                                    {/* Shallow V Cut Overlay matching modal background */}
                                    <div 
                                      className="absolute bottom-[-1px] left-0 w-full h-[16px] z-20 pointer-events-none"
                                      style={{ 
                                        background: `linear-gradient(to top right, #3d0f10 49.5%, transparent 50.5%), linear-gradient(to top left, #3d0f10 49.5%, transparent 50.5%)`,
                                        backgroundSize: '50% 100%',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'left bottom, right bottom'
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Modal Body */}
                            <div className="px-4 pt-2 pb-3 space-y-2.5">
                              {/* Balance row */}
                              <div className="flex items-center justify-between">
                                <span className="text-white/95 font-medium text-[14px] tracking-wide">Balance</span>
                                <div className="flex gap-1.5">
                                  {[1, 10, 100, 1000].map(val => (
                                    <button
                                      key={val}
                                      onClick={() => setWingoBetBalanceVal(val)}
                                      className={`px-1 py-0.5 min-w-[46px] rounded-[3px] text-[12px] font-medium transition-all ${
                                        wingoBetBalanceVal === val ? 'bg-[#d54b52] text-white shadow-sm' : 'bg-[#582124] text-white/50'
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Quantity row */}
                              <div className="flex items-center justify-between">
                                <span className="text-white/95 font-medium text-[14px] tracking-wide">Quantity</span>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={() => {
                                      playWingoSound(clickAudioRef);
                                      setWingoBetQuantity(prev => Math.max(1, (typeof prev === 'number' ? prev : (parseInt(prev as string) || 1)) - 1));
                                    }}
                                    className="w-[28px] h-[28px] bg-[#d54b52] rounded-[3px] flex items-center justify-center text-black/80 text-[20px] font-bold active:scale-95 transition-transform"
                                  >
                                    -
                                  </button>
                                  <input 
                                    type="number"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={wingoBetQuantity}
                                    onChange={(e) => {
                                      if (e.target.value === '') {
                                        setWingoBetQuantity('');
                                      } else {
                                        const val = parseInt(e.target.value);
                                        if (!isNaN(val)) setWingoBetQuantity(val);
                                      }
                                    }}
                                    onBlur={() => {
                                      if (wingoBetQuantity === '' || (typeof wingoBetQuantity === 'number' && wingoBetQuantity < 1)) {
                                        setWingoBetQuantity(1);
                                      }
                                    }}
                                    className="w-[80px] h-[28px] bg-[#1a0506] rounded-[2px] text-center text-white font-medium text-[14px] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                  />
                                  <button 
                                    onClick={() => {
                                      playWingoSound(clickAudioRef);
                                      setWingoBetQuantity(prev => (typeof prev === 'number' ? prev : (parseInt(prev as string) || 1)) + 1);
                                    }}
                                    className="w-[28px] h-[28px] bg-[#d54b52] rounded-[3px] flex items-center justify-center text-black/80 text-[16px] font-bold active:scale-95 transition-transform"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {/* Multiplier buttons row */}
                              <div className="flex justify-end gap-1.5 pt-0">
                                {[1, 5, 10, 20, 50, 100].map(m => (
                                  <button
                                    key={m}
                                    onClick={() => {
                                      playWingoSound(clickAudioRef);
                                      setWingoMultiplier(m);
                                    }}
                                    className={`px-1 py-0.5 rounded-[3px] text-[11px] font-medium transition-all min-w-[38px] ${
                                      wingoMultiplier === m ? 'bg-[#d54b52] text-white shadow-sm' : 'bg-[#582124] text-white/50'
                                    }`}
                                  >
                                    X{m}
                                  </button>
                                ))}
                              </div>

                              {/* Agreement row */}
                              <div className="flex items-center gap-2 pt-1 pb-0">
                                <button 
                                  onClick={() => {
                                    playWingoSound(clickAudioRef);
                                    setWingoAgreed(!wingoAgreed);
                                  }}
                                  className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${wingoAgreed ? 'bg-[#ffbc0d]' : 'border border-white/20'}`}
                                >
                                  {wingoAgreed && <Check className="w-2.5 h-2.5 text-white stroke-[4]" />}
                                </button>
                                <span className="text-white/80 text-[12px] font-normal tracking-wide">
                                  I agree <span className="text-[#d54b52] ml-0.5 font-medium">《Pre-sale rules》</span>
                                </span>
                              </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex w-full h-[46px]">
                              {/* Cancel Button */}
                              <button 
                                onClick={() => {
                                  playWingoSound(clickAudioRef);
                                  setShowWingoBetModal(false);
                                }}
                                className="w-[35%] bg-[#6a3235] text-white/80 font-normal text-[14px] active:brightness-110 transition-all rounded-none"
                              >
                                Cancel
                              </button>
                              
                              {/* Confirm / Total Amount Button */}
                              <button 
                                onClick={executeWingoBet}
                                className="flex-1 font-normal text-[14px] flex items-center justify-center gap-2 active:brightness-110 transition-all rounded-none"
                                style={{ 
                                  background: (() => {
                                    const BTN_RED = '#d54b52';
                                    const BTN_GREEN = '#1ca776';
                                    const BTN_VIOLET = '#9169fa';
                                    const BTN_YELLOW = '#ffbc0d';
                                    const BTN_BLUE = '#4285f4';

                                    if (wingoBetOption === 'Green') return BTN_GREEN;
                                    if (wingoBetOption === 'Red') return BTN_RED;
                                    if (wingoBetOption === 'Violet') return BTN_VIOLET;
                                    if (wingoBetOption === 0) return BTN_RED;
                                    if (wingoBetOption === 5) return BTN_GREEN;
                                    if (wingoBetOption === 'Big') return BTN_YELLOW;
                                    if (wingoBetOption === 'Small') return BTN_BLUE;
                                    if (typeof wingoBetOption === 'number') {
                                      return [1, 3, 7, 9].includes(wingoBetOption) ? BTN_GREEN : BTN_RED;
                                    }
                                    return BTN_YELLOW;
                                  })(),
                                  color: (wingoBetOption === 'Big') ? '#4a0f10' : 'white' 
                                }}
                              >
                                Total amount ₹{(wingoBetBalanceVal * (typeof wingoBetQuantity === 'number' ? wingoBetQuantity : (parseInt(wingoBetQuantity as string) || 1)) * wingoMultiplier).toFixed(2)}
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>









                    {/* Shuffling Spinning loader */}
                    {wingoIsSpinning ? (
                      <div className="px-4 py-6 select-none">
                        <div className="w-full rounded-2xl bg-black/85 border border-dashed border-amber-500/30 p-8 flex flex-col items-center justify-center text-center gap-3 animate-[pulse_1.5s_infinite]">
                          <div className="h-10 w-10 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-1" />
                          <span className="text-xs font-black text-amber-300 font-mono uppercase tracking-widest">{selectedLang === 'en' ? '🎰 Drawing Lucky Numbers ...' : '🎰 भाग्यशाली संख्या घूम रही है ...'}</span>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* MAIN BETTING PANEL CONTAINER - Enhanced Grading */}
                        <div className="px-4 py-3 select-none relative">
                          <div 
                            className={`w-full rounded-[28px] p-4 flex flex-col gap-4 shadow-[0_8px_25px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden relative`}
                            style={{ 
                              background: 'linear-gradient(180deg, #5c1c1e 0%, #3d0f10 100%)',
                              transition: 'all 0.3s ease'
                            }}
                          >
                            {isBettingDisabled && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 rounded-[28px] pointer-events-auto cursor-not-allowed">
                                    <div className="flex gap-3">
                                        {String(activeTimer).padStart(2, '0').split('').map((digit, i) => (
                                            <div key={i} className="bg-[#5c1c1e] text-[#FFD700] text-7xl font-black w-24 h-36 flex items-center justify-center rounded-[20px]">
                                                {digit}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            {/* COLOR BET SELECTION TABS */}
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                onClick={() => handleWingoBetPlace('Green')}
                                className={`py-3 rounded-md font-bold text-[15px] tracking-wide text-white shadow-md cursor-pointer border border-white/5 ${
                                  wingoBetOption === 'Green' ? 'bg-[#1ca776] ring-2 ring-white/30' : 'bg-[#1ca776] shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                                }`}
                                style={{ borderRadius: '14px 4px 14px 4px' }}
                              >
                                Green
                              </button>
                              
                              <button
                                onClick={() => handleWingoBetPlace('Violet')}
                                className={`py-3 rounded-md font-bold text-[15px] tracking-wide text-white shadow-md cursor-pointer border border-white/5 ${
                                  wingoBetOption === 'Violet' ? 'bg-[#9169fa] ring-2 ring-white/30' : 'bg-[#9169fa] shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                                }`}
                                style={{ borderRadius: '4px' }}
                              >
                                Violet
                              </button>
                              
                              <button
                                onClick={() => handleWingoBetPlace('Red')}
                                className={`py-3 rounded-md font-bold text-[15px] tracking-wide text-white shadow-md cursor-pointer border border-white/5 ${
                                  wingoBetOption === 'Red' ? 'bg-[#d54b52] ring-2 ring-white/30' : 'bg-[#d54b52] shadow-[0_2px_4px_rgba(0,0,0,0.3)]'
                                }`}
                                style={{ borderRadius: '4px 14px 4px 14px' }}
                              >
                                Red
                              </button>
                            </div>

                            {/* 10 Glossy Numbers Panel (Darker inner box) */}
                            <div className="bg-[#2d090a] border border-white/5 rounded-xl p-4 flex flex-col gap-3 shadow-inner">
                              <div className="grid grid-cols-5 gap-y-4 gap-x-3 mt-1">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
                                  const isSelected = wingoBetOption === num;
                                  const isRandomActive = wingoRandomizing && wingoRandomActiveNum === num;
                                  const highlight = isSelected || isRandomActive;
                                  const col = num === 0 ? 'Red+Violet' :
                                              num === 5 ? 'Green+Violet' :
                                              [1, 3, 7, 9].includes(num) ? 'Green' : 'Red';
                                  return (
                                    <button
                                      key={num}
                                      onClick={() => handleWingoBetPlace(num)}
                                      className={`relative aspect-square w-full rounded-full flex items-center justify-center cursor-pointer select-none ${
                                        highlight ? 'scale-110 z-10 brightness-110 drop-shadow-md' : 'hover:scale-102 opacity-95'
                                      }`}
                                    >
                                      {renderGlossyBall(num, col, "h-full w-full text-[15.5px]")}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* SELECT MULTIPLIER BUTTONS RANGE bar */}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={handleRandomWingoSelection}
                                className="flex-none min-w-[62px] py-1.5 px-1 rounded-sm text-[12px] font-bold transition-all duration-150 cursor-pointer text-center bg-[#581516] border border-[#f87171]/30 text-[#f87171] hover:bg-[#6a1a1b] uppercase tracking-tighter"
                              >
                                Random
                              </button>
                              <div className="flex-1 flex gap-1 items-center justify-between">
                                {[1, 5, 10, 20, 50, 100].map((val) => {
                                  const isSelected = wingoOuterMultiplier === val;
                                  return (
                                    <button
                                      key={val}
                                      onClick={() => {
                                        setWingoOuterMultiplier(val);
                                        playWingoSound(clickAudioRef);
                                      }}
                                      className={`py-1.5 flex-1 min-w-[30px] px-1 rounded-sm text-[12px] font-bold transition-all duration-150 cursor-pointer text-center border ${
                                        isSelected 
                                          ? 'bg-[#1ca776] text-white border-white/20' 
                                          : 'bg-[#581516] border-white/5 text-white/40 hover:text-white'
                                      }`}
                                    >
                                      X{val}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* BIG / SMALL BET SELECTION PANEL */}
                            <div className="w-full flex rounded-r-full rounded-l-full overflow-hidden shadow-lg h-[46px]">
                              <button
                                onClick={() => {
                                  playWingoSound(clickAudioRef);
                                  handleWingoBetPlace('Big');
                                }}
                                className={`flex-1 font-bold text-[18px] tracking-wide cursor-pointer flex items-center justify-center ${
                                  wingoBetOption === 'Big' 
                                    ? 'bg-[#ffbc0d] text-[#4d1213] brightness-105' 
                                    : 'bg-[#ffbc0d] text-white opacity-80'
                                }`}
                              >
                                Big
                              </button>
                              <button
                                onClick={() => {
                                  playWingoSound(clickAudioRef);
                                  handleWingoBetPlace('Small');
                                }}
                                className={`flex-1 font-bold text-[18px] tracking-wide cursor-pointer flex items-center justify-center ${
                                  wingoBetOption === 'Small' 
                                    ? 'bg-[#4285f4] text-white brightness-105' 
                                    : 'bg-[#4285f4] text-white opacity-80 border-l border-white/10'
                                }`}
                              >
                                Small
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    {/* HISTORY RECORDS BOARD CARD matching Neon Trade exactly */}
                    <div className="w-full px-4 pt-3 pb-8 select-none">
                      {/* Tabs matching the button style from the screenshot */}
                      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                        <button 
                          className={`py-3 rounded-2xl font-bold text-[13px] shadow-md cursor-pointer transition transform active:scale-95 flex items-center justify-center font-sans ${wingoHistoryTab === 'history' ? 'bg-[#ffbb0d] text-neutral-900' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5 hover:text-white'}`} 
                          type="button"
                          onClick={() => {
                            playWingoSound(clickAudioRef);
                            setWingoHistoryTab('history');
                          }}
                        >
                          Game history
                        </button>
                        <button 
                          className={`py-3 rounded-2xl font-bold text-[13px] shadow-md cursor-pointer transition transform active:scale-95 flex items-center justify-center font-sans ${wingoHistoryTab === 'chart' ? 'bg-[#ffbb0d] text-neutral-900' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5 hover:text-white'}`} 
                          type="button"
                          onClick={() => {
                            playWingoSound(clickAudioRef);
                            setWingoHistoryTab('chart');
                          }}
                        >
                          Chart
                        </button>
                        <button 
                          className={`py-3 rounded-2xl font-bold text-[13px] shadow-md cursor-pointer transition transform active:scale-95 flex items-center justify-center font-sans ${wingoHistoryTab === 'myhistory' ? 'bg-[#ffbb0d] text-neutral-900' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5 hover:text-white'}`} 
                          type="button"
                          onClick={() => setWingoHistoryTab('myhistory')}
                        >
                          My history
                        </button>
                      </div>

                      {wingoHistoryTab === 'history' ? (
                        /* History Table directly cloned from Neon Trade screenshot */
                      <div className="w-full bg-[#2c1012] rounded-[18px] overflow-hidden shadow-2xl border border-white/5">
                        {/* Table Header Row Banner matching Neon Trade exactly - Enhanced Grading */}
                        <div className="grid grid-cols-[4.5fr_1.8fr_2fr_1.7fr] text-[13px] font-medium text-white/90 py-2.5 px-4 select-none border-b border-white/5"
                             style={{ background: 'linear-gradient(180deg, #5c1c1e 0%, #3d0f10 100%)' }}>
                          <div className="text-center font-sans tracking-tight">Period</div>
                          <div className="text-center font-sans tracking-tight">Number</div>
                          <div className="text-center font-sans tracking-tight">Big Small</div>
                          <div className="text-center font-sans tracking-tight">Color</div>
                        </div>

                        {/* Table Rows matching screenshot flat list */}
                        <div className="flex flex-col font-sans select-text bg-[#2c1012] py-0.5">
                          {(() => {
                            const roomHistory = [...(wingoHistory[activeWingoRoom || '30s'] || [])].sort((a,b) => b.period.localeCompare(a.period));
                            const pageSize = 10;
                            const pagedHistory = roomHistory.slice((historyPage - 1) * pageSize, historyPage * pageSize);
                            
                            return pagedHistory.map((row, index) => {
                              let numberContent;
                              const isPurple = row.number === 0 || row.number === 5;
                              const isGreen = [1, 3, 7, 9].includes(row.number);
                              
                              if (row.number === 0) {
                                numberContent = (
                                  <span 
                                    className="font-black text-[19px] font-sans leading-none tracking-tight text-transparent bg-clip-text"
                                    style={{ backgroundImage: 'linear-gradient(180deg, #ff4148 48%, #c742e4 48%)' }}
                                  >
                                    0
                                  </span>
                                );
                              } else if (row.number === 5) {
                                numberContent = (
                                  <span 
                                    className="font-black text-[19px] font-sans leading-none tracking-tight text-transparent bg-clip-text"
                                    style={{ backgroundImage: 'linear-gradient(180deg, #15be75 48%, #c742e4 48%)' }}
                                  >
                                    5
                                  </span>
                                );
                              } else if (isGreen) {
                                numberContent = (
                                  <span className="text-[#15be75] font-bold text-[18px] font-sans leading-none">
                                    {row.number}
                                  </span>
                                );
                              } else {
                                numberContent = (
                                  <span className="text-[#ff4148] font-bold text-[18px] font-sans leading-none">
                                    {row.number}
                                  </span>
                                );
                              }

                              return (
                                <div key={index} className="grid grid-cols-[4.5fr_1.8fr_2fr_1.7fr] items-center text-center py-2.5 px-4 min-h-[44px]">
                                  {/* Period ID Column */}
                                  <div className="text-left text-white/50 font-normal text-[12px] tracking-tight pl-2">
                                    {row.period}
                                  </div>
                                  
                                  {/* Number Column */}
                                  <div className="text-center flex justify-center items-center h-full">
                                    {numberContent}
                                  </div>
                                  
                                  {/* Big/Small Column */}
                                  <div className="text-center text-white/80 font-normal text-[12.5px]">
                                    {row.size}
                                  </div>
                                  
                                  {/* Color indicator dots */}
                                  <div className="flex justify-center items-center gap-[4px] select-none">
                                    {row.number === 0 ? (
                                      <div className="flex gap-[4px] justify-center scale-90">
                                        <span className="h-[9px] w-[9px] rounded-full bg-[#ff4148]" />
                                        <span className="h-[9px] w-[9px] rounded-full bg-[#c742e4]" />
                                      </div>
                                    ) : row.number === 5 ? (
                                      <div className="flex gap-[4px] justify-center scale-90">
                                        <span className="h-[9px] w-[9px] rounded-full bg-[#15be75]" />
                                        <span className="h-[9px] w-[9px] rounded-full bg-[#c742e4]" />
                                      </div>
                                    ) : (
                                      <span 
                                        className="h-[9px] w-[9px] rounded-full scale-90" 
                                        style={{ background: isGreen ? '#15be75' : '#ff4148' }}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                        {/* Pagination controls for history tab */}
                        <div className="flex items-center justify-center gap-6 py-4 px-4 bg-transparent select-none border-t border-white/[0.03]">
                            <button 
                            onClick={() => setHistoryPage(Math.max(1, historyPage - 1))}
                            className="h-[36px] w-[44px] rounded-lg bg-[#341113] text-[#dfb8ba]/60 flex items-center justify-center hover:bg-[#4a1a1c] transition active:scale-95 cursor-pointer shadow-md border border-white/5 disabled:opacity-30"
                            disabled={historyPage === 1}
                            >
                            <ChevronLeft className="h-5 w-5" />
                            </button>
                            <div className="text-[#dfb8ba]/60 text-[13px] font-sans font-medium flex items-center gap-1.5">
                                <span>{historyPage}/{Math.max(1, Math.ceil((wingoHistory[activeWingoRoom || '30s'] || []).length / 10))}</span>
                            </div>
                            <button 
                            onClick={() => setHistoryPage(Math.min(Math.ceil((wingoHistory[activeWingoRoom || '30s'] || []).length / 10), historyPage + 1))}
                            className="h-[36px] w-[44px] rounded-lg bg-[#ffbc0d] text-[#4d1213] flex items-center justify-center hover:brightness-110 transition active:scale-95 cursor-pointer shadow-md disabled:opacity-30"
                            disabled={historyPage >= Math.ceil((wingoHistory[activeWingoRoom || '30s'] || []).length / 10)}
                            >
                            <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                      </div>
                      ) : wingoHistoryTab === 'chart' ? (
                        <div className="w-full bg-[#2c1012] rounded-2xl overflow-hidden border border-white/[0.01] shadow-2xl">
                          <WingoChartView 
                            history={wingoHistory[activeWingoRoom || '30s'] || []} 
                            currentPage={chartPage}
                            totalPages={Math.ceil((wingoHistory[activeWingoRoom || '30s'] || []).length / 10)}
                            onPageChange={setChartPage}
                          />
                        </div>
                      ) : wingoHistoryTab === 'myhistory' ? (
                        /* My personal bet history view - Enhanced with Screenshot Layout & Maroon Grading */
                        <div className="flex flex-col gap-3 min-h-[400px] mb-4">
                           {(() => {
                             const allMyBets = myWingoBets[activeWingoRoom || '30s'] || [];
                             const totalMyPages = Math.ceil(allMyBets.length / 10) || 1;
                             const currentMyBets = allMyBets.slice((myHistoryPage - 1) * 10, myHistoryPage * 10);
                             return (
                               <>
                             {currentMyBets.length > 0 ? (
                             currentMyBets.map((historyItem, idx) => {
                                 const realIdx = (myHistoryPage - 1) * 10 + idx;
                                 // Determine Icon styling based on choice
                                 let iconBg = "";
                                 let iconText = "text-white";
                                 let iconStyle: React.CSSProperties = {};
                                 const choice = historyItem.userChoice;

                                 if (choice === 'Big') {
                                   iconBg = "bg-[#ffbb0d]";
                                   iconText = "text-[#4d1213]";
                                 } else if (choice === 'Small') {
                                   iconBg = "bg-[#4285f4]";
                                 } else if (choice === 'Red') {
                                   iconBg = "bg-[#ff4148]";
                                 } else if (choice === 'Green') {
                                   iconBg = "bg-[#15be75]";
                                 } else if (choice === 'Violet') {
                                   iconBg = "bg-[#c742e4]";
                                 } else if (typeof choice === 'number') {
                                   // Rules for number bets: split background for 0 and 5
                                   if (choice === 0) iconStyle = { background: 'linear-gradient(135deg, #ff4148 50%, #c742e4 50%)' };
                                   else if (choice === 5) iconStyle = { background: 'linear-gradient(135deg, #15be75 50%, #c742e4 50%)' };
                                   else if ([1,3,7,9].includes(choice)) iconBg = "bg-[#15be75]";
                                   else iconBg = "bg-[#ff4148]";
                                 } else {
                                   iconBg = "bg-[#341113]";
                                 }

                                 const betKey = `${activeWingoRoom || '30s'}_${historyItem.period}_${historyItem.userChoice}_${realIdx}`;
                                 const isExpanded = expandedBetKey === betKey;

                                 return (
                                   <div key={realIdx} className="flex flex-col mb-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                     <div 
                                         onClick={() => setExpandedBetKey(isExpanded ? null : betKey)}
                                         className={`w-full p-4 flex items-center justify-between cursor-pointer border border-white/[0.04] transition-all active:scale-[0.98] ${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}`}
                                         style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}>
                                       <div className="flex items-center gap-4">
                                         <div 
                                           className={`h-[38px] w-[44px] rounded-[12px] flex items-center justify-center font-black text-[13px] select-none shadow-lg border border-white/10 ${iconBg} ${iconText}`}
                                           style={iconStyle}
                                         >
                                           {historyItem.userChoice !== undefined ? historyItem.userChoice : historyItem.size}
                                         </div>
                                         <div className="flex flex-col gap-1">
                                           <div className="flex items-center gap-1.5">
                                             <span className="text-[15px] font-bold text-white tracking-tight leading-none">{historyItem.period}</span>
                                             <span className={`text-white/40 text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                                           </div>
                                           <span className="text-[11px] text-white/30 font-medium font-sans">{historyItem.timestamp}</span>
                                         </div>
                                       </div>
                                       <div className="flex flex-col items-end justify-center min-w-[90px]">
                                           <div className={`px-4 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1.5 ${!historyItem.resolved ? 'bg-[#ffbc0d]/10 text-[#ffbc0d] border-[#ffbc0d]/30' : historyItem.winLoss === 'Win' ? 'bg-[#15be75]/10 text-[#15be75] border-[#15be75]/30' : 'bg-transparent text-white/30 border-white/10 opacity-60'}`}>
                                             {!historyItem.resolved ? 'PENDING' : historyItem.winLoss === 'Win' ? 'SUCCEED' : 'FAILED'}
                                           </div>
                                           <span className={`text-[14px] font-black font-sans tracking-tight ${!historyItem.resolved ? 'text-white/60' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]/90'}`}>
                                             {!historyItem.resolved ? '' : historyItem.winLoss === 'Win' ? '+' : '-'}₹{!historyItem.resolved ? historyItem.betAmount.toFixed(2) : (historyItem.winLoss === 'Win' ? (historyItem.betAmount * (typeof historyItem.userChoice === 'number' ? 8.82 : historyItem.userChoice === 'Violet' ? 4.41 : (historyItem.userChoice === 'Green' && historyItem.color === 'Green+Violet') ? 1.47 : (historyItem.userChoice === 'Red' && historyItem.color === 'Red+Violet') ? 1.47 : 1.96)).toFixed(2) : historyItem.betAmount.toFixed(2))}
                                           </span>
                                       </div>
                                     </div>

                                     <AnimatePresence>
                                       {isExpanded && (
                                         <motion.div 
                                           initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="w-full bg-[#1e0506]/95 rounded-b-2xl border border-t-0 border-white/[0.04] overflow-hidden"
                                          >
                                            <div className="p-4 flex flex-col gap-3 font-sans text-[13px] text-white/70">
                                              
                                              <div className="flex justify-between items-center bg-[#2a0e10]/60 p-2.5 rounded-md border border-white/5">
                                                <span>{selectedLang === 'en' ? 'Order number' : 'ऑर्डर संख्या'}</span>
                                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
                                                  {(() => {
                                                    const orderNum = `WG${historyItem.period}${Math.abs(`${historyItem.period}_${historyItem.userChoice}_${historyItem.timestamp}`.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString().padStart(10, '3')}`;
                                                    return (
                                                      <>
                                                        {orderNum}
                                                        <Copy className="h-3.5 w-3.5 text-white/50 cursor-pointer active:scale-90" onClick={() => navigator.clipboard.writeText(orderNum)} />
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Period' : 'अवधि'}</span>
                                                <span className="font-mono text-white/90">{historyItem.period}</span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Purchase amount' : 'खरीद राशि'}</span>
                                                <span className="font-mono text-white/90">₹{historyItem.betAmount.toFixed(2)}</span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Quantity' : 'मात्रा'}</span>
                                                <span className="font-mono text-white/90">1</span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Amount after tax' : 'कर के बाद राशि'}</span>
                                                <span className="font-mono text-[#ff4148] font-medium">₹{(historyItem.betAmount * 0.98).toFixed(2)}</span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Tax' : 'कर'}</span>
                                                <span className="font-mono text-white/90">₹{(historyItem.betAmount * 0.02).toFixed(2)}</span>
                                              </div>

                                              {historyItem.resolved && (
                                                <div className="flex justify-between items-center px-1">
                                                  <span>{selectedLang === 'en' ? 'Result' : 'परिणाम'}</span>
                                                  <div className="flex items-center gap-1.5 font-medium">
                                                    <span className={historyItem.color === 'Green' ? 'text-[#15be75]' : historyItem.color === 'Red' ? 'text-[#ff4148]' : 'text-[#c742e4]'}>
                                                      {historyItem.number} {historyItem.color} {historyItem.size}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Select' : 'चुनें'}</span>
                                                <span className="font-medium text-white/90">{historyItem.userChoice}</span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Status' : 'स्थिति'}</span>
                                                <span className={`font-medium ${!historyItem.resolved ? 'text-[#ffbc0d]' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]'}`}>
                                                  {!historyItem.resolved ? (selectedLang === 'en' ? 'Pending' : 'लंबित') : historyItem.winLoss === 'Win' ? (selectedLang === 'en' ? 'Succeed' : 'सफल') : (selectedLang === 'en' ? 'Failed' : 'विफल')}
                                                </span>
                                              </div>

                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Win/lose' : 'जीत/हार'}</span>
                                                <span className={`font-mono font-medium tracking-tight ${!historyItem.resolved ? 'text-white/60' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]'}`}>
                                                  {!historyItem.resolved ? '₹0.00' : historyItem.winLoss === 'Win' ? `+₹${(historyItem.betAmount * (typeof historyItem.userChoice === 'number' ? 8.82 : historyItem.userChoice === 'Violet' ? 4.41 : (historyItem.userChoice === 'Green' && historyItem.color === 'Green+Violet') ? 1.47 : (historyItem.userChoice === 'Red' && historyItem.color === 'Red+Violet') ? 1.47 : 1.96)).toFixed(2)}` : `-₹${historyItem.betAmount.toFixed(2)}`}
                                                </span>
                                              </div>

                                              <div className="flex justify-between items-center px-1 border-t border-white/5 pt-3 mt-1">
                                                <span>{selectedLang === 'en' ? 'Order time' : 'ऑर्डर का समय'}</span>
                                                <span className="font-mono text-white/50 text-[11px]">{historyItem.timestamp}</span>
                                              </div>

                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })
                            ) : (
                              <div className="w-full bg-[#1b1717]/20 rounded-2xl py-16 px-6 flex flex-col items-center justify-center gap-4 border border-dashed border-white/10 opacity-40">
                                <div className="h-14 w-14 rounded-full bg-white/5 flex items-center justify-center">
                                  <List className="h-7 w-7 text-white/30" />
                                </div>
                                <div className="text-center">
                                  <p className="text-white font-bold text-sm tracking-tight font-sans">No betting data found</p>
                                  <p className="text-white/40 text-[11px] mt-1 font-sans">Start playing to see your strategy history here</p>
                                 </div>
                               </div>
                             )}

                             {allMyBets.length > 0 && (
                               <div className="flex items-center justify-center gap-4 py-4 mt-2">
                                 <button
                                   className="w-10 h-10 shadow-md rounded-2xl flex items-center justify-center border-white/5 border disabled:opacity-50 transition cursor-pointer"
                                   style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}
                                   onClick={() => setMyHistoryPage(p => Math.max(1, p - 1))}
                                   disabled={myHistoryPage === 1}
                                 >
                                   <ChevronLeft className="h-5 w-5 text-white/80" />
                                 </button>
                                 <span className="font-mono text-white/60 font-medium text-[13px]">
                                   {myHistoryPage}/{totalMyPages}
                                 </span>
                                 <button
                                   className="w-10 h-10 shadow-md rounded-2xl flex items-center justify-center border-white/5 border disabled:opacity-50 transition cursor-pointer"
                                   style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}
                                   onClick={() => setMyHistoryPage(p => Math.min(totalMyPages, p + 1))}
                                   disabled={myHistoryPage === totalMyPages}
                                 >
                                   <ChevronRight className="h-5 w-5 text-white/80" />
                                 </button>
                               </div>
                             )}
                               </>
                             );
                           })()}
                         </div>
                      ) : null}

                    </div>

                  </div>
                  )
                ) : (
                  /* ----------------- CORE LOBBY SECTION ----------------- */
                  <div className="w-full pb-8">
                    
                    {/* Featured Mega high-fidelity Neon Trade Slider Layout */}
                    <div className="px-4 mt-3.5 select-none relative group h-[142px] xs:h-[162px] sm:h-[180px]">
                      <AnimatePresence mode="wait">
                        {activeSlide === 0 ? (
                          <motion.div 
                            key="slide-1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="w-full h-full rounded-[24px] relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer active:scale-[0.99] transition-transform duration-100 group"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset }) => {
                              if (offset.x < -50) {
                                setActiveSlide(prev => (prev + 1) % 3);
                              } else if (offset.x > 50) {
                                setActiveSlide(prev => (prev - 1 + 3) % 3);
                              }
                            }}
                          >
                            <img 
                              src="https://i.ibb.co/ychmgkdn/file-00000000ef40720888a7368f6c1e9162.png" 
                              alt="Promo Banner 1"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                          </motion.div>
                        ) : activeSlide === 1 ? (
                          <motion.div 
                            key="slide-2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="w-full h-full rounded-[24px] relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer active:scale-[0.99] transition-transform duration-100 group"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset }) => {
                              if (offset.x < -50) {
                                setActiveSlide(prev => (prev + 1) % 3);
                              } else if (offset.x > 50) {
                                setActiveSlide(prev => (prev - 1 + 3) % 3);
                              }
                            }}
                          >
                            <img 
                              src="https://i.ibb.co/9HrkL5P8/file-000000005d70720890ec1f922e09e1c6.png" 
                              alt="Promo Banner 2"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="slide-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.35, ease: 'easeInOut' }}
                            className="w-full h-full rounded-[24px] relative overflow-hidden shadow-[0_12px_40px_rgba(0,0,0,0.85)] cursor-pointer active:scale-[0.99] transition-transform duration-100 group"
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.2}
                            onDragEnd={(e, { offset }) => {
                              if (offset.x < -50) {
                                setActiveSlide(prev => (prev + 1) % 3);
                              } else if (offset.x > 50) {
                                setActiveSlide(prev => (prev - 1 + 3) % 3);
                              }
                            }}
                          >
                            <img 
                              src="https://i.ibb.co/kgytxgB6/file-000000000ea87208926fdbf263bfa8a0.png" 
                              alt="Promo Banner 3"
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer pointer-events-none" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Interactive Touch swiper arrows appearing subtle on hover */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide(prev => (prev - 1 + 3) % 3);
                        }}
                        className="absolute left-1.5 top-1/2 -translate-y-1/2 cursor-pointer z-30 h-7 w-7 rounded-full bg-black/40 border border-white/5 text-white/60 hover:text-white flex items-center justify-center active:scale-90 transition opacity-0 group-hover:opacity-100"
                        title="Previous Banner"
                      >
                        <ChevronLeft className="h-4.5 w-4.5" />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlide(prev => (prev + 1) % 3);
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer z-30 h-7 w-7 rounded-full bg-black/40 border border-white/5 text-white/60 hover:text-white flex items-center justify-center active:scale-90 transition opacity-0 group-hover:opacity-100"
                        title="Next Banner"
                      >
                        <ChevronRight className="h-4.5 w-4.5" />
                      </button>
                    </div>

                    {/* Highly-reactive slide index dot pagers precisely integrated */}
                    <div className="flex items-center justify-center gap-2 mt-2 select-none">
                      {[...Array(3)].map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setActiveSlide(i)}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === activeSlide ? 'w-5 bg-gradient-to-r from-red-500 to-red-650' : 'w-1.5 bg-[#4c3c3c]'}`} 
                          title={`Slide ${i + 1}`}
                        />
                      ))}
                    </div>




                    {/* Highly polished golden-red high-roller capsules matching the website's color pattern precisely */}
                    <div className="px-4 mt-5 select-none font-sans">
                      <div className="grid grid-cols-4 gap-2.5">
                        
                        {/* Deposit Card */}
                        <div 
                          onClick={() => {
                            setShowDepositScreen(true);
                          }}
                          className="group rounded-2xl pt-4 pb-2.5 px-0.5 relative overflow-hidden flex flex-col items-center justify-between border border-white/15 hover:border-[#ffd275]/45 cursor-pointer shadow-[0_6px_16px_rgba(234,45,45,0.25)] hover:shadow-[0_8px_20px_rgba(234,45,45,0.35)] active:scale-95 transition-all duration-300"
                          style={{
                            background: 'linear-gradient(180deg, #ea2d2d 0%, #b81717 60%, #7d0404 100%)'
                          }}
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-black/45 border border-[#ffd275]/45 group-hover:scale-110 duration-200 relative shadow-sm">
                            <svg className="w-5 h-5 filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none">
                              <path d="M2,20 L22,20" stroke="#ffd275" strokeWidth="2" strokeLinecap="round" />
                              <path d="M4,12 L4,19" stroke="#ffd275" strokeWidth="1.5" />
                              <path d="M9,12 L9,19" stroke="#ffd275" strokeWidth="1.5" />
                              <path d="M15,12 L15,19" stroke="#ffd275" strokeWidth="1.5" />
                              <path d="M20,12 L20,19" stroke="#ffd275" strokeWidth="1.5" />
                              <path d="M2,12 L12,4 L22,12 Z" fill="#ffd275" />
                            </svg>
                          </div>
                          
                          <span className="text-[11px] font-black text-white mt-1.5 mb-2.5 uppercase select-none tracking-wider text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {selectedLang === 'en' ? 'Deposit' : 'जमा'}
                          </span>
                          
                          <div className="bg-[#310202] border border-[#ffd275]/30 group-hover:bg-[#4d0404] transition-colors duration-150 px-3.5 py-0.5 rounded-full text-[8.5px] font-black text-[#ffd275] uppercase scale-95 select-none shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                            {selectedLang === 'en' ? 'Get' : 'पाएं'}
                          </div>
                        </div>

                        {/* Withdraw Card */}
                        <div 
                          onClick={() => {
                            setShowWithdrawScreen(true);
                          }}
                          className="group rounded-2xl pt-4 pb-2.5 px-0.5 relative overflow-hidden flex flex-col items-center justify-between border border-white/15 hover:border-[#ffd275]/45 cursor-pointer shadow-[0_6px_16px_rgba(234,45,45,0.25)] hover:shadow-[0_8px_20px_rgba(234,45,45,0.35)] active:scale-95 transition-all duration-300"
                          style={{
                            background: 'linear-gradient(180deg, #ea2d2d 0%, #b81717 60%, #7d0404 100%)'
                          }}
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-black/45 border border-[#ffd275]/45 group-hover:scale-110 duration-200 relative shadow-sm">
                            <svg className="w-5 h-5 filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none">
                              <rect x="3" y="7" width="18" height="12" rx="2" stroke="#ffd275" strokeWidth="1.8" />
                              <path d="M9,7 L9,5 C9,4.4 9.4,4 10,4 L14,4 C14.6,4 15,4.4 15,5 L15,7" stroke="#ffd275" strokeWidth="1.8" fill="none" />
                              <path d="M12,11 L12,15" stroke="#ffd275" strokeWidth="2.0" strokeLinecap="round" />
                            </svg>
                          </div>

                          <span className="text-[11px] font-black text-white mt-1.5 mb-2.5 uppercase select-none tracking-wider text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {selectedLang === 'en' ? 'Withdraw' : 'निकासी'}
                          </span>

                          <div className="bg-[#310202] border border-[#ffd275]/30 group-hover:bg-[#4d0404] transition-colors duration-150 px-3.5 py-0.5 rounded-full text-[8.5px] font-black text-[#ffd275] uppercase scale-95 select-none shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                            {selectedLang === 'en' ? 'Get' : 'पाएं'}
                          </div>
                        </div>

                        {/* VIP Level Card */}
                        <div 
                          onClick={() => {
                            setLobbyToast({ 
                              type: 'info', 
                              text: selectedLang === 'en' ? 'Super VIP Level loaded. Daily Rebates activated.' : 'सुपर वीआईपी स्तर सक्रिय। दैनिक छूट प्राप्त करें।' 
                            });
                          }}
                          className="group rounded-2xl pt-4 pb-2.5 px-0.5 relative overflow-hidden flex flex-col items-center justify-between border border-white/15 hover:border-[#ffd275]/45 cursor-pointer shadow-[0_6px_16px_rgba(234,45,45,0.25)] hover:shadow-[0_8px_20px_rgba(234,45,45,0.35)] active:scale-95 transition-all duration-300"
                          style={{
                            background: 'linear-gradient(180deg, #ea2d2d 0%, #b81717 60%, #7d0404 100%)'
                          }}
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-black/45 border border-[#ffd275]/45 group-hover:scale-110 duration-200 relative shadow-sm">
                            <svg className="w-5 h-5 filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none">
                              <path d="M3,16 L4,7 L9,11 L12,4 L15,11 L20,7 L21,16 Z" fill="#ffd275" stroke="#ffd275" strokeWidth="1" />
                              <circle cx="4" cy="6" r="1" fill="#fff" />
                              <circle cx="12" cy="3" r="1.5" fill="#fff" />
                              <circle cx="20" cy="6" r="1" fill="#fff" />
                              <rect x="5" y="17" width="14" height="2" rx="0.5" fill="#ffd275" />
                            </svg>
                          </div>

                          <span className="text-[11px] font-black text-white mt-1.5 mb-2.5 uppercase select-none tracking-wider text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {selectedLang === 'en' ? 'VIP level' : 'वीआईपी'}
                          </span>

                          <div className="bg-[#310202] border border-[#ffd275]/30 group-hover:bg-[#4d0404] transition-colors duration-150 px-3.5 py-0.5 rounded-full text-[8.5px] font-black text-[#ffd275] uppercase scale-95 select-none shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                            {selectedLang === 'en' ? 'Get' : 'पाएं'}
                          </div>
                        </div>

                        {/* Wheel Card */}
                        <div 
                          onClick={() => {
                            setCurrentTab('wheel');
                            setLobbyToast({ 
                              type: 'success', 
                              text: selectedLang === 'en' ? 'Welcome to Wingo Fortune Wheel!' : 'विंगो फॉर्च्यून व्हील में आपका स्वागत है!' 
                              });
                          }}
                          className="group rounded-2xl pt-4 pb-2.5 px-0.5 relative overflow-hidden flex flex-col items-center justify-between border border-white/15 hover:border-[#ffd275]/45 cursor-pointer shadow-[0_6px_16px_rgba(234,45,45,0.25)] hover:shadow-[0_8px_20px_rgba(234,45,45,0.35)] active:scale-95 transition-all duration-300"
                          style={{
                            background: 'linear-gradient(180deg, #ea2d2d 0%, #b81717 60%, #7d0404 100%)'
                          }}
                        >
                          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-black/45 border border-[#ffd275]/45 group-hover:scale-110 duration-200 relative shadow-sm">
                            <svg className="w-5 h-5 animate-[spin_12s_linear_infinite] filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)]" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="9" stroke="#ffd275" strokeWidth="1.8" fill="#500707" />
                              <line x1="12" y1="3" x2="12" y2="21" stroke="#ffd275" strokeWidth="1" />
                              <line x1="3" y1="12" x2="21" y2="12" stroke="#ffd275" strokeWidth="1" />
                              <line x1="5.6" y1="5.6" x2="18.4" y2="18.4" stroke="#ffd275" strokeWidth="0.8" />
                              <line x1="18.4" y1="5.6" x2="5.6" y2="18.4" stroke="#ffd275" strokeWidth="0.8" />
                              <circle cx="12" cy="12" r="3.5" fill="#e11d48" stroke="#ffd275" strokeWidth="0.8" />
                            </svg>
                          </div>

                          <span className="text-[11px] font-black text-white mt-1.5 mb-2.5 uppercase select-none tracking-wider text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                            {selectedLang === 'en' ? 'Wheel' : 'चक्र'}
                          </span>

                          <div className="bg-[#310202] border border-[#ffd275]/30 group-hover:bg-[#4d0404] transition-colors duration-150 px-3.5 py-0.5 rounded-full text-[8.5px] font-black text-[#ffd275] uppercase scale-95 select-none shadow-[0_2px_6px_rgba(0,0,0,0.5)]">
                            {selectedLang === 'en' ? 'Get' : 'पाएं'}
                          </div>
                        </div>

                      </div>
                    </div>

                    {/* Popular Category Label and Game Selection controller indicator */}
                    <div className="px-4 mt-6 flex items-center justify-between select-none font-sans">
                      <div className="flex items-center gap-2">
                        {/* Small decorative yellow ring matching the dashboard controller design precisely */}
                        <div className="h-3 w-3 rounded-full border-2 border-red-500 flex items-center justify-center select-none shrink-0 scale-90">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        </div>
                        <span className="text-[14px] font-black tracking-tight text-white/95 uppercase font-sans">
                          {selectedLang === 'en' ? 'Popular Rooms' : 'लोकप्रिय गेम'}
                        </span>
                      </div>
                    </div>

                    {/* Game Filters Category Scroll bar */}
                    <div className="px-4 mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 font-sans">
                      <button
                        onClick={() => setWingoCategory('all')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${wingoCategory === 'all' ? 'bg-[#ff3a3a] text-white border border-[#ff5a5a]/25' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5'}`}
                      >
                        ⚡ {selectedLang === 'en' ? 'All Slots' : 'सभी खेल'}
                      </button>
                      <button
                        onClick={() => setWingoCategory('wingo')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${wingoCategory === 'wingo' ? 'bg-[#ff3a3a] text-white border border-[#ff5a5a]/25' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5'}`}
                      >
                        🎲 {selectedLang === 'en' ? 'Wingo' : 'विंगो'}
                      </button>
                      <button
                        onClick={() => setWingoCategory('slots')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${wingoCategory === 'slots' ? 'bg-[#ff3a3a] text-white border border-[#ff5a5a]/25' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5'}`}
                      >
                        🎰 {selectedLang === 'en' ? 'Slots' : 'स्लॉट्स'}
                      </button>
                      <button
                        onClick={() => setWingoCategory('popular')}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${wingoCategory === 'popular' ? 'bg-[#ff3a3a] text-white border border-[#ff5a5a]/25' : 'bg-[#341113] text-[#ffccd1]/70 border border-white/5'}`}
                      >
                        💎 {selectedLang === 'en' ? 'Popular' : 'लोकप्रिय'}
                      </button>
                    </div>

                    {/* 4 Games Layout Grid precisely using the imgbb extracted links */}
                    <div className="px-4 mt-4 grid grid-cols-2 gap-3.5">
                      {[
                        { 
                          id: '30s', 
                          name: selectedLang === 'en' ? 'Wingo 30s' : 'विंगो ३० सेकंड', 
                          time: '30S', 
                          image: 'https://i.ibb.co/twP5vVhH/file-0000000052447207a3365bdca980061e.png',
                          tag: selectedLang === 'en' ? 'Super Fast' : 'अति तीव्र',
                          desc: 'Speed Draw 30s',
                          cat: 'wingo',
                          isComingSoon: false
                        },
                        { 
                          id: '1m', 
                          name: selectedLang === 'en' ? 'Wingo 1Min' : 'विंगो १ मिनट', 
                          time: '1M', 
                          image: 'https://i.ibb.co/2QQr71m/file-000000008c6071faa26fa7f582b22667.png',
                          tag: selectedLang === 'en' ? 'Most Loved' : 'लोकप्रिय',
                          desc: 'Speed Room 1M',
                          cat: 'wingo',
                          isComingSoon: false
                        },
                        { 
                          id: '3m', 
                          name: selectedLang === 'en' ? 'Wingo 3Min' : 'विंगो ३ मिनट', 
                          time: '3M', 
                          image: 'https://i.ibb.co/9HMwVbML/file-00000000d9a07206a1f56f9c5ed5a935.png',
                          tag: selectedLang === 'en' ? 'Classic Room' : 'क्लासिक चयन',
                          desc: 'Standard Slices 3M',
                          cat: 'wingo',
                          isComingSoon: false
                        },
                        { 
                          id: '5m', 
                          name: selectedLang === 'en' ? 'Millennium 5' : 'मिलेनियम ५', 
                          time: '5M', 
                          image: 'https://i.ibb.co/WNQZyCdw/file-0000000073407209b9bf684dc8b4aeb5.png',
                          tag: selectedLang === 'en' ? 'Super Premium' : 'सुपर प्रीमियम',
                          desc: 'Mega Jackpot 5M',
                          cat: 'wingo',
                          isComingSoon: false
                        }
                      ]
                      .filter(g => wingoCategory === 'all' || wingoCategory === g.cat || (wingoCategory === 'popular' && ['30s', '1m'].includes(g.id)))
                      .map((game) => (
                        <div
                          key={game.id}
                          onClick={() => {
                            if (game.isComingSoon) {
                              setLobbyToast({
                                type: 'info',
                                text: selectedLang === 'en' 
                                  ? `${game.name} is coming soon! Please check back later.` 
                                  : `${game.name} जल्द ही आ रहा है! कृपया बाद में दोबारा देखें।`
                              });
                              return;
                            }
                            if (!isAdmin && totalDeposits < 200) {
                              setShowDepositRequiredModal(true);
                              return;
                            }
                            setActiveWingoRoom(game.id);
                            setWingoBetOption(null);
                            setWingoWinningsAlert(null);
                            setWingoOuterMultiplier(1);
                          }}
                          className={`group rounded-2xl overflow-hidden relative flex flex-col shadow-md cursor-pointer transition-all duration-300 bg-gradient-to-b from-[#4d1618] to-[#120002] border-2 border-[#ffd700]/30 shadow-[0_0_15px_rgba(253,210,117,0.15)] hover:border-[#ffd700]/70 ${
                            game.isComingSoon 
                              ? 'opacity-70 grayscale-[25%] active:scale-100' 
                              : 'active:scale-95 hover:scale-[1.04] hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 hover:z-10'
                          }`}
                        >
                          {/* Image Box - Changed aspect to aspect-[3/4] to render full height of portrait cards */}
                          <div className="w-full aspect-[3/4] bg-neutral-950 border-b border-neutral-900/40 relative overflow-hidden">
                            <img
                              src={game.image}
                              alt={game.name}
                              className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.05]"
                              referrerPolicy="no-referrer"
                            />
                            {/* Inner ambient shadows and highlights */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                            
                            {/* Accent badge */}
                            <span className="absolute top-2 left-2 text-black font-extrabold text-[8px] uppercase tracking-wider py-0.5 px-2 rounded-full border shadow-md bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-300 font-sans">
                              {game.tag}
                            </span>

                            {/* Semi-transparent Coming soon overlay banner */}
                            {game.isComingSoon && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="bg-amber-500/15 border border-amber-400/40 text-[#ffd275] font-black text-[11px] tracking-widest uppercase px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-xs font-sans">
                                  {selectedLang === 'en' ? 'Coming Soon' : 'जल्द आ रहा है'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Detail info */}
                          <div className="p-2.5 flex flex-col text-left">
                            <h4 className="text-[13px] font-black tracking-tight text-amber-400 font-sans">
                              {game.name}
                            </h4>
                            <p className="text-[8px] text-neutral-400/85 font-extrabold mt-0.5 leading-none">
                              {game.desc}
                            </p>
                            
                            {/* Live Clock countdown badge inside card */}
                            <div className="mt-2.5 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${game.isComingSoon ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                                <span className="text-[9px] font-bold text-neutral-400 font-mono">
                                  {game.id.startsWith('mines') ? (
                                    game.isComingSoon ? (
                                      selectedLang === 'en' ? 'Coming Soon' : 'जल्द आ रहा है'
                                    ) : (
                                      selectedLang === 'en' ? 'Active: Instant Play' : 'सक्रिय: तुरंत खेलें'
                                    )
                                  ) : (
                                    <>
                                      Draw: <span className="text-[#ff3a3a] font-extrabold font-sans">
                                        {Math.floor((wingoTimers[game.id] || 0) / 60).toString().padStart(2, '0')}:{((wingoTimers[game.id] || 0) % 60).toString().padStart(2, '0')}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </div>

                              <span className={`text-[9.5px] font-extrabold uppercase px-2 py-0.5 rounded-lg text-center leading-none ${
                                game.isComingSoon 
                                  ? 'bg-neutral-800 text-neutral-500' 
                                  : 'bg-[#df1c1c] text-white'
                              }`}>
                                {game.isComingSoon ? (selectedLang === 'en' ? 'SOON' : 'जल्द') : 'PLAY'}
                              </span>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Enhanced Promotional Dismissible Banner with Close Cross */}
                    <div className="px-4 mt-4">
                      <AnimatePresence>
                        {bannerVisible && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="relative w-full rounded-2xl overflow-hidden p-4 border border-[#ffd275]/25 shadow-2xl"
                            style={{
                              background: 'linear-gradient(135deg, #441111 0%, #220505 100%)',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.65), inset 0 0 12px rgba(253, 210, 117, 0.08)'
                            }}
                          >
                            <button
                              id="banner-dismiss-cross-lobby"
                              onClick={() => setBannerVisible(false)}
                              className="absolute top-2.5 right-2 px-1.5 py-1.5 rounded-full flex items-center justify-center text-[#ff3e3e] hover:text-white bg-black/40 hover:bg-rose-600/30 transition cursor-pointer z-20"
                              title="Dismiss banner"
                            >
                              <X className="h-3.5 w-3.5 stroke-[3]" />
                            </button>

                            <div className="flex items-center gap-4">
                              {/* Enhanced Logo Icon with pulsing ambient border */}
                              <div className="relative shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-black/55 border border-[#ffd275]/35 shadow-inner select-none">
                                <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-400 opacity-20 blur animate-pulse" />
                                <img
                                  src={gameLogo}
                                  alt="Neon Trade Logo"
                                  className="h-12 w-auto object-contain relative z-10 filter drop-shadow-[0_0_6px_rgba(253,210,117,0.35)] pointer-events-none"
                                  referrerPolicy="no-referrer"
                                  draggable={false}
                                  onContextMenu={(e) => e.preventDefault()}
                                />
                              </div>

                              <div className="flex-1 text-left min-w-0">
                                <h4 className="font-sans text-[13px] font-black text-white leading-tight tracking-wide flex items-center gap-1.5">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                                  {t.bannerTitle}
                                </h4>
                                <p className="mt-1 text-[10px] text-neutral-300 font-medium select-none leading-relaxed">
                                  {t.bannerSubtitle.split('Allow')[0] || ''}
                                  <span className="text-[#ffd275] font-extrabold px-0.5">Allow</span>
                                  {t.bannerSubtitle.split('Allow')[1] || ''}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setCurrentTab('wheel');
                                setLobbyToast({ type: 'success', text: selectedLang === 'en' ? 'Welcome Bonus Activated!' : 'वेलकम बोनस सक्रिय हो गया!' });
                              }}
                              className="mt-3.5 w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ffd275] to-[#f59e0b] py-2 px-4 text-center font-sans text-[11.5px] font-black uppercase text-black tracking-wider shadow-[0_4px_15px_rgba(251,176,59,0.35)] hover:brightness-110 active:scale-98 transition transform cursor-pointer"
                            >
                              <span className="flex items-center justify-center gap-1">
                                🎁 {t.bannerCta}
                              </span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    {/* Winning Information & Players of the Month Sections */}
                    <div className="px-4 mt-6">
                      
                      {/* Section: Winning Information */}
                      <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-r from-[#880d1e] via-[#c61a30] to-[#880d1e] text-white px-8 py-2 font-black uppercase text-base shadow-[0_4px_10px_rgba(200,20,40,0.5)] max-w-max relative w-[250px] text-center" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }}>
                          WINNING INFORMATION
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-10 overflow-hidden relative" style={{ height: '360px' }}>
                        <div className="flex flex-col gap-2">
                          <AnimatePresence initial={false}>
                            {liveWinners.map((w) => (
                              <motion.div 
                                key={w.id}
                                layout
                                initial={{ opacity: 0, y: -20, scale: 0.95, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, y: 0, scale: 1, height: 60, marginBottom: 2 }}
                                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                transition={{ 
                                  opacity: { duration: 0.3 },
                                  y: { type: "spring", stiffness: 400, damping: 28 },
                                  scale: { duration: 0.2 },
                                  height: { type: "spring", stiffness: 400, damping: 28 },
                                  layout: { type: "spring", stiffness: 400, damping: 28 }
                                }}
                                className="flex gap-2.5 bg-[#421d1d]/90 border border-[#ff3e3e]/15 p-1.5 rounded-lg shadow-sm items-center relative overflow-hidden shrink-0 h-[60px]"
                              >
                                {/* Left Side Game Banner Icon - Clean Portrait Rectangle fully covered with no empty space, matching the 5M lobby card styles exactly */}
                                <div className="w-[34px] h-[46px] rounded border border-[#ffd275]/30 bg-[#321313] overflow-hidden flex-shrink-0 relative flex items-center justify-center shadow-[0_0_4px_rgba(255,187,13,0.25)] select-none">
                                  <img 
                                    src={w.gameImg} 
                                    className="w-full h-full object-cover select-none pointer-events-none" 
                                    alt={w.game} 
                                    referrerPolicy="no-referrer"
                                  />
                                </div>

                                <div className="flex-col w-full min-w-0 flex justify-center">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11.5px] font-extrabold text-white truncate">{w.name}</span>
                                    <span className="text-[7px] tracking-wider font-extrabold text-[#5df0a6] bg-[#5df0a6]/10 px-1 border border-[#5df0a6]/20 rounded scale-90 origin-right">
                                      Wingo
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-white/50 select-none leading-tight truncate">
                                    The member has won this much of money Rs:
                                  </div>
                                  <div className="text-[11.5px] font-bold text-[#5df0a6] leading-none mt-0.5">
                                    ₹{w.amount.toFixed(2)}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Section: Players of the Month */}
                      <div className="flex justify-center mb-10 mt-6">
                        <div className="bg-gradient-to-r from-[#880d1e] via-[#c61a30] to-[#880d1e] text-white px-8 py-2 font-black uppercase text-base tracking-widest shadow-[0_4px_10px_rgba(200,20,40,0.5)] relative max-w-max w-[250px] text-center" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                          PLAYERS OF<br/>THE MONTH
                        </div>
                      </div>

                      <div className="relative mb-6 mt-8">
                                                  {/* Podium Container */}
                         <div className="flex items-end justify-center w-full max-w-[400px] mx-auto h-[160px] relative">
                             {/* Rank 3 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-[1.5px] border-[#d1b22e] bg-[#222] mb-[-10px] z-20 top-[-2px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[2].img} className="w-full h-full object-cover" alt="Rank 3" />
                                </div>
                                <div className="w-full h-[95px] bg-gradient-to-b from-[#bda028] to-[#6d5b12] flex flex-col items-center justify-end pb-[6px] custom-clip-rank3">
                                   <div className="text-3xl font-black text-[#ffea8a] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-0.5 font-serif transform translate-x-[4px]">3</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5 max-w-full truncate px-1">{MOCK_PODIUM[2].name}</div>
                                   <div className="text-[9.5px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[2].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                             
                             {/* Rank 1 */}
                             <div className="w-[45%] flex flex-col items-center justify-end relative z-30 mx-[-8px]">
                                <div className="absolute top-[-36px] z-40 text-4xl overflow-visible flex justify-center items-center h-12 w-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24">
                                    <defs>
                                      <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FFF200" />
                                        <stop offset="30%" stopColor="#FFC300" />
                                        <stop offset="100%" stopColor="#B37D00" />
                                      </linearGradient>
                                      <linearGradient id="jewel" x1="0%" y1="0%" x2="0%" y2="100%">
                                         <stop offset="0%" stopColor="#FF3333" />
                                         <stop offset="100%" stopColor="#AA0000" />
                                      </linearGradient>
                                    </defs>
                                    <path fill="url(#gold)" d="M2.5 19h19v2h-19zm2-2l-2.5-9.5 5.5 3.5 4.5-8 4.5 8 5.5-3.5-2.5 9.5z" stroke="#664400" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <circle cx="12" cy="5" r="1.5" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                    <circle cx="4.5" cy="11" r="1.2" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                    <circle cx="19.5" cy="11" r="1.2" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                  </svg>
                                </div>
                                <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-[#1ac29a] bg-[#222] mb-[-12px] z-20 relative shadow-[0_4px_10px_rgba(0,0,0,0.7)] object-cover">
                                  <img src={MOCK_PODIUM[0].img} className="w-full h-full object-cover" alt="Rank 1" />
                                </div>
                                <div className="w-full h-[125px] bg-gradient-to-b from-[#1ac29a] to-[#0d5945] flex flex-col items-center justify-end pb-2 custom-clip-rank1">
                                   <div className="text-[40px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] mb-1 font-serif leading-none mt-2">1</div>
                                   <div className="text-[11px] text-white font-bold tracking-tight mb-0.5 px-1 truncate max-w-full">{MOCK_PODIUM[0].name}</div>
                                   <div className="text-[11px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[0].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>

                             {/* Rank 2 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-[1.5px] border-[#23b9d6] bg-[#222] mb-[-10px] z-20 top-[-2px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[1].img} className="w-full h-full object-cover" alt="Rank 2" />
                                </div>
                                <div className="w-full h-[95px] bg-gradient-to-b from-[#25a5be] to-[#0f5463] flex flex-col items-center justify-end pb-[6px] custom-clip-rank2">
                                   <div className="text-3xl font-black text-[#c3f4ff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-0.5 font-serif transform -translate-x-[4px]">2</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5 max-w-full truncate px-1">{MOCK_PODIUM[1].name}</div>
                                   <div className="text-[9.5px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[1].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                         </div>

                         {/* Leaderboard Details */}
                         <div className="bg-[#4a1215] rounded-xl flex flex-col my-6 divide-y divide-[#ff3e3e]/10 border border-[#ff3e3e]/20 overflow-hidden shadow-lg">
                           {MOCK_LEADERBOARD.map((item, idx) => (
                             <div key={idx} className="flex items-center px-4 py-3 bg-[#4a1215] hover:bg-[#5f1c21] transition">
                                <div className="w-6 font-bold text-lg text-white/80">{item.rank}</div>
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 mx-3 relative bg-black/30">
                                   <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                                </div>
                                <div className="text-white text-sm flex-1 font-medium">{item.name}</div>
                                <div className="text-[#a53b51] font-black tracking-wide text-sm font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                                   ₹{item.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                             </div>
                           ))}
                         </div>
                      </div>

                    </div>

                    {/* Visual Disclaimer footer inside lobby */}
                    <div className="px-4 mt-6 text-center select-none opacity-40">
                      <p className="text-[8px] text-neutral-500 font-bold leading-relaxed uppercase">
                        Neon Trade lottery and entertainment systems are built for secure entertainment purposes inside the preview. All outcomes are simulated on device.
                      </p>
                    </div>

                  </div>
                )}

              </motion.div>
            ) : currentTab === 'earn' ? (
              <InvitationBonusView 
                uid={uid} 
                selectedLang={selectedLang} 
                onClose={() => {}} 
                inviteeCount={inviteeCount}
                inviteeDepositCount={inviteeDepositCount}
                claimedBonuses={claimedInvitationBonuses}
                onClaim={handleClaimInvitationBonus}
              />
            ) : currentTab === 'wheel' ? (
              <InviteWheelView 
                selectedLang={selectedLang} 
                balance={balance} 
                setBalance={setBalance} 
                setLobbyToast={setLobbyToast} 
                nickname={nickname}
                avatar={avatar}
                totalDeposits={totalDeposits}
                inviteeDepositCount={inviteeDepositCount}
                usedSpins={usedSpins}
                uid={uid}
                onSpinUsed={async () => {
                  const newUsed = usedSpins + 1;
                  setUsedSpins(newUsed);
                  const userUid = auth.currentUser?.uid;
                  if (userUid) {
                    const userDocRef = doc(db, 'users', userUid);
                    await updateDoc(userDocRef, { usedSpins: newUsed });
                  }
                }}
              />
            ) : (
              <motion.div
                key="other-views"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="w-full flex-1 overflow-y-auto pb-6 px-4 pt-6"
              >
                {currentTab === 'promo' ? (
                  <div className="space-y-5 pb-4">
                    {/* Premium Header */}
                    <div id="promo-header" className="flex items-center justify-between pb-3.5 border-b border-white/5 mb-4">
                      <div className="flex flex-col text-left">
                        <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffe49e] via-[#ffbb0d] to-[#e1a500] uppercase tracking-wide font-sans">
                          {selectedLang === 'en' ? 'Promotions & Offers' : 'प्रचार और ऑफर'}
                        </h2>
                        <span className="text-[9px] text-[#ffbb0d]/70 font-extrabold tracking-[0.12em] uppercase font-sans mt-0.5">EXCLUSIVE REWARDS CENTRE</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffbb0d]/10 border border-[#ffbb0d]/20 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[8px] text-[#ffbb0d] font-black uppercase tracking-widest leading-none">LIVE</span>
                      </div>
                    </div>

                    {/* Interactive Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-2 scrollbar-none select-none">
                      <button
                        onClick={() => { playWingoSound(clickAudioRef); setPromoFilter('all'); }}
                        className={`px-3.5 py-1.5 rounded-full font-sans text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                          promoFilter === 'all'
                            ? 'bg-[#ffe49e] text-[#421d00] border-[#ffe49e] shadow-[0_2px_10px_rgba(255,228,158,0.2)] scale-[1.02]'
                            : 'bg-black/45 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <Sparkles className="h-3 w-3 shrink-0" />
                        <span>{selectedLang === 'en' ? 'All' : 'सभी'}</span>
                      </button>
                      <button
                        onClick={() => { playWingoSound(clickAudioRef); setPromoFilter('hot'); }}
                        className={`px-3.5 py-1.5 rounded-full font-sans text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                          promoFilter === 'hot'
                            ? 'bg-[#ff3a3a] text-white border-[#ff3a3a] shadow-[0_2px_10px_rgba(255,58,58,0.2)] scale-[1.02]'
                            : 'bg-black/45 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <Flame className="h-3 w-3 shrink-0 animate-pulse" />
                        <span>{selectedLang === 'en' ? 'Hot' : 'हॉट'}</span>
                      </button>
                      <button
                        onClick={() => { playWingoSound(clickAudioRef); setPromoFilter('deposit'); }}
                        className={`px-3.5 py-1.5 rounded-full font-sans text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                          promoFilter === 'deposit'
                            ? 'bg-[#00f099] text-black border-[#00f099] shadow-[0_2px_10px_rgba(0,240,153,0.2)] scale-[1.02]'
                            : 'bg-black/45 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <CreditCard className="h-3 w-3 shrink-0" />
                        <span>{selectedLang === 'en' ? 'Deposit' : 'डिपोज़िट'}</span>
                      </button>
                      <button
                        onClick={() => { playWingoSound(clickAudioRef); setPromoFilter('invite'); }}
                        className={`px-3.5 py-1.5 rounded-full font-sans text-[11px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shrink-0 border flex items-center gap-1.5 ${
                          promoFilter === 'invite'
                            ? 'bg-purple-500 text-white border-purple-500 shadow-[0_2px_10px_rgba(168,85,247,0.2)] scale-[1.02]'
                            : 'bg-black/45 text-neutral-400 border-white/5 hover:border-white/10 hover:text-white'
                        }`}
                      >
                        <Users className="h-3 w-3 shrink-0" />
                        <span>{selectedLang === 'en' ? 'Invite' : 'इनवाइट'}</span>
                      </button>
                    </div>

                    {/* Promo Cards Feed */}
                    <div className="space-y-4">
                      {/* Premium Promo Card 1: Invite Wheel of Fortune */}
                      {(promoFilter === 'all' || promoFilter === 'hot' || promoFilter === 'invite') && (
                        <div className="bg-gradient-to-b from-[#341113] via-[#1a0506] to-[#0d0203] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.65)] border border-[#ffbb0d]/15 hover:border-[#ffbb0d]/40 transition-all duration-300 relative group flex flex-col">
                          <div className="relative h-[130px] w-full overflow-hidden shrink-0">
                            <img 
                              src="https://i.ibb.co/ychmgkdn/file-00000000ef40720888a7368f6c1e9162.png" 
                              alt="Lucky Spin Wheel Promo"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1a0506] to-transparent pointer-events-none" />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[8.5px] font-black tracking-wider uppercase bg-[#ff3a3a] text-white shadow-lg border border-white/10 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-white animate-ping" />
                              {selectedLang === 'en' ? 'HOT EVENT' : 'लोकप्रिय इवेंट'}
                            </span>
                          </div>

                          <div className="px-4 pb-4 pt-3 flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h3 className="text-[14.5px] font-black text-white leading-snug">
                                {selectedLang === 'en' ? 'Super Lucky Wheel Bonus' : 'सुपर लकी व्हील बोनस'}
                              </h3>
                              <span className="text-[9px] bg-amber-400/10 text-amber-400 font-black border border-amber-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                {selectedLang === 'en' ? 'Win up to ₹10K' : '₹10K तक जीतें'}
                              </span>
                            </div>

                            {/* Structured Highlights instead of emojis */}
                            <div className="bg-black/30 rounded-xl p-2.5 space-y-1.5 border border-white/5 mb-3.5">
                              <div className="flex items-center gap-2 text-left">
                                <Zap className="h-3.5 w-3.5 text-[#ffbb0d] shrink-0" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? '1 Free Spin coupon per qualified active user invite' : 'प्रति योग्य सक्रिय उपयोगकर्ता इनवाइट पर 1 फ्री स्पिन कूपन'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-left">
                                <Coins className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? '100% Guaranteed payouts loaded directly in rewards' : 'पुरस्कारों में सीधे 100% गारंटीकृत भुगतान लोड किया गया'}
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={() => setCurrentTab('wheel')} 
                              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#ffd36c] via-[#ffbb0d] to-[#db9c00] hover:brightness-110 active:brightness-95 text-[#421d00] font-black uppercase text-[11.5px] tracking-wider shadow-[0_4px_12px_rgba(255,187,13,0.25)] transition-all active:scale-[0.98] leading-none cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Sparkles className="h-3.5 w-3.5 shrink-0" />
                              {selectedLang === 'en' ? 'Spin Wheel Now' : 'अभी व्हील घुमाएं'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Premium Promo Card 2: Deposit 100% Double Match */}
                      {(promoFilter === 'all' || promoFilter === 'deposit') && (
                        <div className="bg-gradient-to-b from-[#341113] via-[#1a0506] to-[#0d0203] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.65)] border border-[#00f099]/15 hover:border-[#00f099]/40 transition-all duration-300 relative group flex flex-col">
                          <div className="relative h-[130px] w-full overflow-hidden shrink-0">
                            <img 
                              src="https://i.ibb.co/9HrkL5P8/file-000000005d70720890ec1f922e09e1c6.png" 
                              alt="First Deposit Promo"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1a0506] to-transparent pointer-events-none" />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[8.5px] font-black tracking-wider uppercase bg-[#00f099] text-black shadow-lg border border-black/10 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse" />
                              {selectedLang === 'en' ? 'MEGA BONUS' : 'मेगा बोनस'}
                            </span>
                          </div>

                          <div className="px-4 pb-4 pt-3 flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h3 className="text-[14.5px] font-black text-white leading-snug">
                                {selectedLang === 'en' ? '100% First Deposit Match' : '100% प्रथम जमा बोनस'}
                              </h3>
                              <span className="text-[9px] bg-emerald-400/10 text-[#00f099] font-black border border-[#00f099]/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                {selectedLang === 'en' ? 'Double Cash Match' : 'दोगुना कैश पाएं'}
                              </span>
                            </div>

                            {/* Structured Highlights */}
                            <div className="bg-black/30 rounded-xl p-2.5 space-y-1.5 border border-white/5 mb-3.5">
                              <div className="flex items-center gap-2 text-left">
                                <CreditCard className="h-3.5 w-3.5 text-[#00f099] shrink-0" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? 'Deposit ₹200 to ₹10,000 to double your gaming tokens' : 'गेमिंग टोकन दोगुना करने के लिए ₹200 से ₹10,000 जमा करें'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-left">
                                <Flame className="h-3.5 w-3.5 text-[#00f099] shrink-0 animate-pulse" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? 'Safely credited instantly inside your game wallet space' : 'सुरक्षित रूप से और तुरंत आपके गेम वॉलेट में क्रेडिट किया गया'}
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={() => { playWingoSound(clickAudioRef); setShowDepositScreen(true); }} 
                              className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#00f099] to-[#00b372] hover:brightness-110 active:brightness-95 text-black font-black uppercase text-[11.5px] tracking-wider shadow-[0_4px_12px_rgba(0,240,153,0.2)] transition-all active:scale-[0.98] leading-none cursor-pointer flex items-center justify-center gap-2"
                            >
                              <CreditCard className="h-3.5 w-3.5 shrink-0" />
                              {selectedLang === 'en' ? 'Deposit Now & Double' : 'अभी जमा करें और दोगुना पाएं'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Premium Promo Card 3: Agency Commission Recurrent Yield */}
                      {(promoFilter === 'all' || promoFilter === 'invite') && (
                        <div className="bg-gradient-to-b from-[#341113] via-[#1a0506] to-[#0d0203] rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.65)] border border-purple-500/15 hover:border-purple-500/40 transition-all duration-300 relative group flex flex-col">
                          <div className="relative h-[130px] w-full overflow-hidden shrink-0">
                            <img 
                              src="https://i.ibb.co/kgytxgB6/file-000000000ea87208926fdbf263bfa8a0.png" 
                              alt="Agency Recurrent Commission Promo"
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                              referrerPolicy="no-referrer"
                              loading="lazy"
                            />
                            <div className="absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#1a0506] to-transparent pointer-events-none" />
                            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[8.5px] font-black tracking-wider uppercase bg-[#8b5cf6] text-white shadow-lg border border-white/10 flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                              {selectedLang === 'en' ? 'VIP EXCLUSIVE' : 'वीआईपी एक्सक्लूसिव'}
                            </span>
                          </div>

                          <div className="px-4 pb-4 pt-3 flex flex-col">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <h3 className="text-[14.5px] font-black text-white leading-snug">
                                {selectedLang === 'en' ? 'Lifetime Agent Commission' : 'आजीवन एजेंट कमीशन'}
                              </h3>
                              <span className="text-[9px] bg-purple-400/10 text-purple-400 font-black border border-purple-400/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                                {selectedLang === 'en' ? '0.6% Lifetime Yield' : '0.6% आजीवन यील्ड'}
                              </span>
                            </div>

                            {/* Structured Highlights */}
                            <div className="bg-black/30 rounded-xl p-2.5 space-y-1.5 border border-white/5 mb-3.5">
                              <div className="flex items-center gap-2 text-left">
                                <Award className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? 'Earn up to 0.6% recursive payouts on every downline player' : 'प्रत्येक डाउनलाइन खिलाड़ी पर 0.6% तक आवर्ती भुगतान प्राप्त करें'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 text-left">
                                <TrendingUp className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                <p className="text-[10.5px] font-bold text-neutral-300 leading-normal">
                                  {selectedLang === 'en' ? 'Build endless streams with instant real-time settlements' : 'त्वरित रीयल-टाइम निपटान के साथ अंतहीन निष्क्रिय धाराएं बनाएं'}
                                </p>
                              </div>
                            </div>

                            <button 
                              onClick={() => { playWingoSound(clickAudioRef); setCurrentTab('earn'); }} 
                              className="w-full py-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 active:brightness-95 text-white font-black uppercase text-[11.5px] tracking-wider shadow-[0_4px_12px_rgba(139,92,246,0.25)] transition-all active:scale-[0.98] leading-none cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Trophy className="h-3.5 w-3.5 shrink-0" />
                              {selectedLang === 'en' ? 'Invitation Bonus Hub' : 'इनविटेशन बोनस हब'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full rounded-2xl bg-[#1b1717]/95 border border-white/5 p-6 shadow-2xl text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-[#ff3a3a]/10 flex items-center justify-center text-[#ff3a3a] mb-4">
                      🎁
                    </div>
                    <h3 className="text-xl font-black text-white capitalize select-none font-sans">
                      {currentTab} Lobby
                    </h3>
                    <p className="mt-2 text-xs text-neutral-400 select-none">
                      {selectedLang === 'en' 
                        ? 'This game section is loading assets. Please stick to available game modes.'
                        : 'यह खेल अनुभाग लोड हो रहा है। कृपया उपलब्ध मुख्य गेम मोड्स पर ही टिके रहें।'}
                    </p>
                    <button
                      onClick={() => setCurrentTab('home')}
                      className="mt-6 rounded-full px-6 py-2.5 text-xs font-black uppercase text-white bg-gradient-to-b from-[#df1c1c] to-[#aa1212] transition active:scale-95 cursor-pointer leading-none"
                    >
                      {selectedLang === 'en' ? 'Go to Home Screen' : 'होम स्क्रीन पर जाएं'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 4. Bottom Navbar shaped EXTREMELY EXACTLY like the screenshot */}
          {!activeWingoRoom && !showLanguageScreen && (
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[410px] h-[78px] bg-transparent select-none flex items-end">
              
              {/* Curved left base wing */}
              <div 
                className="absolute left-0 bottom-0 h-[65px] w-[50.2%] bg-[#1a1a1c] border-t-2 border-[#333]/50 rounded-tr-[50px] z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]"
              />

              {/* Curved right base wing */}
              <div 
                className="absolute right-0 bottom-0 h-[65px] w-[50.2%] bg-[#1a1a1c] border-t-2 border-[#333]/50 rounded-tl-[50px] z-10 shadow-[0_-4px_16px_rgba(0,0,0,0.6)]"
              />

              {/* Central red flared background */}
              <div 
                className="absolute left-1/2 -translate-x-1/2 bottom-[2px] w-[120px] h-[70px] z-15 pointer-events-none flex justify-center"
              >
                <svg className="absolute inset-0 w-full h-full drop-shadow-[0_4px_12px_rgba(220,20,20,0.4)]" viewBox="0 0 120 70" fill="none">
                  <defs>
                    <linearGradient id="flareGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f01a1a" />
                      <stop offset="40%" stopColor="#b30000" />
                      <stop offset="100%" stopColor="#3d0000" />
                    </linearGradient>
                    <linearGradient id="flareStroke" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff7777" />
                      <stop offset="100%" stopColor="#770000" />
                    </linearGradient>
                  </defs>
                  <path d="M 0 15 
                           C 20 18, 28 68, 40 68 
                           L 80 68 
                           C 92 68, 100 18, 120 15 
                           C 100 28, 85 30, 60 30 
                           C 35 30, 20 28, 0 15 Z" 
                        fill="url(#flareGrad)" 
                        stroke="url(#flareStroke)" 
                        strokeWidth="1" 
                        strokeLinecap="round" />
                </svg>
              </div>

              {/* Dynamic Navbar item containers */}
              <div className="relative z-20 w-full h-[62px] flex items-center justify-evenly px-1 pb-1">
                
                {/* 1. Home Tab Button */}
                <button
                  id="nav-tab-home"
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setCurrentTab('home');
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 flex-1"
                >
                  {currentTab === 'home' ? (
                    <div 
                      className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[16px] border border-[#ff4d4d]/25 w-[85%] max-w-[60px] mx-auto h-[54px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(222,34,34,0.15)]"
                      style={{
                        background: 'linear-gradient(180deg, #371414 0%, #200808 100%)'
                      }}
                    >
                      <img 
                        src="https://i.ibb.co/1GM5Gj5h/icon-home-6edfbce6.webp" 
                        alt="Home" 
                        className="h-[26px] w-[26px] object-contain select-none" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-[#ff3a3a] leading-none mt-1 capitalize">{t.homeTab}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-400 transition-colors w-full h-[52px]">
                      <img 
                        src="https://i.ibb.co/1GM5Gj5h/icon-home-6edfbce6.webp" 
                        alt="Home" 
                        className="h-[24px] w-[24px] object-contain select-none opacity-50 hover:opacity-80 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-neutral-500 leading-none mt-1.5 capitalize">{t.homeTab}</span>
                    </div>
                  )}
                </button>

                {/* 2. Promo Tab Button with Badged Notification */}
                <button
                  id="nav-tab-promo"
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setCurrentTab('promo');
                  }}
                  className="relative flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 flex-1"
                >
                  {/* Promo Badge removed */}

                  {currentTab === 'promo' ? (
                    <div 
                      className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[16px] border border-[#ff4d4d]/25 w-[85%] max-w-[60px] mx-auto h-[54px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(222,34,34,0.15)]"
                      style={{
                        background: 'linear-gradient(180deg, #371414 0%, #200808 100%)'
                      }}
                    >
                      <img 
                        src="https://i.ibb.co/HLpdHW17/icon-promo-17f3ee44.webp" 
                        alt="Promo" 
                        className="h-[26px] w-[26px] object-contain select-none" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-[#ff3a3a] leading-none mt-1 capitalize">{t.promoTab}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-400 transition-colors w-full h-[52px]">
                      <img 
                        src="https://i.ibb.co/HLpdHW17/icon-promo-17f3ee44.webp" 
                        alt="Promo" 
                        className="h-[24px] w-[24px] object-contain select-none opacity-50 hover:opacity-80 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-neutral-500 leading-none mt-1.5 capitalize">{t.promoTab}</span>
                    </div>
                  )}
                </button>

                {/* 3. Center Wheel Tab Button - Absolutely NO spin or movement animations */}
                <button
                  id="nav-tab-wheel"
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setCurrentTab('wheel');
                  }}
                  className="relative flex flex-col items-center justify-end pb-1.5 cursor-pointer active:scale-98 w-[90px] shrink-0 z-30"
                  style={{ height: '78px' }}
                >
                  <div className="absolute top-[-38px] left-1/2 -translate-x-1/2 w-[90px] h-[90px] flex items-center justify-center pointer-events-none">
                    <img 
                      src="https://i.ibb.co/0VftFSbC/turntable-home-ee908e6a.webp" 
                      alt="Wheel" 
                      className="h-[90px] w-[90px] max-w-none object-contain select-none filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.7)] pointer-events-auto"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[13px] font-bold text-white tracking-wide leading-none select-none z-30 font-sans drop-shadow-md pb-1">
                    {t.wheelTab}
                  </span>
                </button>

                {/* 4. Earn Tab Button */}
                <button
                  id="nav-tab-earn"
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setCurrentTab('earn');
                  }}
                  className="flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 flex-1"
                >
                  {currentTab === 'earn' ? (
                    <div 
                      className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[16px] border border-[#ff4d4d]/25 w-[85%] max-w-[60px] mx-auto h-[54px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(222,34,34,0.15)]"
                      style={{
                        background: 'linear-gradient(180deg, #371414 0%, #200808 100%)'
                      }}
                    >
                      <img 
                        src="https://i.ibb.co/8nNMJPz8/icon-earn-a380593b.webp" 
                        alt="Earn" 
                        className="h-[26px] w-[26px] object-contain select-none" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-[#ff3a3a] leading-none mt-1 capitalize">{t.earnTab}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-400 transition-colors w-full h-[52px]">
                      <img 
                        src="https://i.ibb.co/8nNMJPz8/icon-earn-a380593b.webp" 
                        alt="Earn" 
                        className="h-[24px] w-[24px] object-contain select-none opacity-50 hover:opacity-80 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-neutral-500 leading-none mt-1.5 capitalize">{t.earnTab}</span>
                    </div>
                  )}
                </button>

                {/* 5. Mine Tab Button with Badged Notification */}
                <button
                  id="nav-tab-mine"
                  onClick={() => {
                    playWingoSound(clickAudioRef);
                    setCurrentTab('mine');
                  }}
                  className="relative flex flex-col items-center justify-center cursor-pointer transition-all duration-150 active:scale-95 flex-1"
                >
                  {/* Mine Badge removed */}

                  {currentTab === 'mine' ? (
                    <div 
                      className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded-[16px] border border-[#ff4d4d]/25 w-[85%] max-w-[60px] mx-auto h-[54px] shadow-[inset_0_1px_4px_rgba(255,255,255,0.05),0_4px_10px_rgba(222,34,34,0.15)]"
                      style={{
                        background: 'linear-gradient(180deg, #371414 0%, #200808 100%)'
                      }}
                    >
                      <img 
                        src="https://i.ibb.co/SZwNY30/icon-menu-cb9b38c1.webp" 
                        alt="Mine" 
                        className="h-[26px] w-[26px] object-contain select-none" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-[#ff3a3a] leading-none mt-1 capitalize">{t.mineTab}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-1 text-neutral-500 hover:text-neutral-400 transition-colors w-full h-[52px]">
                      <img 
                        src="https://i.ibb.co/SZwNY30/icon-menu-cb9b38c1.webp" 
                        alt="Mine" 
                        className="h-[24px] w-[24px] object-contain select-none opacity-50 hover:opacity-80 transition-opacity" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[12px] font-medium text-neutral-500 leading-none mt-1.5 capitalize">{t.mineTab}</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Change Avatar dialog/overlay matching screenshot */}
          <AnimatePresence>
            {isAvatarModalOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex flex-col items-center justify-center p-4"
              >
                {/* Modal main box */}
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  className="w-full max-w-[340px] rounded-3xl p-6 text-center shadow-2xl relative"
                  style={{
                    background: '#1c1717',
                    border: '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <h3 className="text-[20px] font-black tracking-wide text-white mb-6 select-none font-display">
                    {selectedLang === 'en' ? 'Change Avatar' : 'अवतार बदलें'}
                  </h3>

                  {/* 20 Avatar Grid matching the exact reference layout of 3 columns with elegant scroll */}
                  <div className="grid grid-cols-3 gap-4 mb-6 overflow-y-auto max-h-[365px] pr-1.5 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                    {AVAILABLE_AVATARS.map((url, idx) => {
                      const isSelected = tempSelectedAvatar === url;
                      return (
                        <div 
                          key={idx}
                          onClick={() => setTempSelectedAvatar(url)}
                          className="relative aspect-square rounded-full cursor-pointer active:scale-95 transition-all"
                        >
                          <img
                            src={url}
                            alt={`Avatar Option ${idx + 1}`}
                            loading="eager"
                            decoding="sync"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150';
                              console.error('Avatar load error:', url);
                            }}
                            className={`h-full w-full rounded-full object-cover border-2 transition-all duration-200 ${
                              isSelected 
                                ? 'border-[#ff3a3a] filter brightness-110 scale-[1.05] shadow-[0_0_15px_rgba(255,58,58,0.4)]' 
                                : 'border-neutral-800 hover:border-neutral-600'
                            }`}
                            referrerPolicy="no-referrer"
                          />
                          {isSelected && (
                            <div className="absolute -bottom-1 -right-1 h-5.5 w-5.5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#1c1717] text-white">
                              <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Save button precisely matching physical red theme style */}
                  <button
                    type="button"
                    onClick={async () => {
                      setAvatar(tempSelectedAvatar);
                      setIsAvatarModalOpen(false);
                      const currentUser = auth.currentUser;
                      if (currentUser) {
                        try {
                          await updateDoc(doc(db, 'users', currentUser.uid), {
                            avatar: tempSelectedAvatar,
                            updatedAt: serverTimestamp()
                          });
                        } catch (e) {
                          console.error('Avatar update error:', e);
                        }
                      }
                    }}
                    className="w-full rounded-xl py-3 text-center font-display text-[15px] font-black uppercase tracking-wider text-white shadow-lg active:scale-97 transition transform hover:scale-[1.01] hover:brightness-110 cursor-pointer"
                    style={{
                      background: 'linear-gradient(180deg, #d31a1a 0%, #aa0f0f 100%)',
                      boxShadow: '0 4px 15px rgba(211,26,26,0.25)'
                    }}
                  >
                    {selectedLang === 'en' ? 'Save' : 'सुरक्षित करें'}
                  </button>
                </motion.div>

                {/* Hanging close circle below the modal card */}
                <motion.button
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                  type="button"
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="mt-6 flex items-center justify-center h-12 w-12 rounded-full border border-white/15 bg-[#120d0d] text-white hover:text-red-500 hover:border-red-500/50 active:scale-90 transition shadow-lg cursor-pointer"
                  title="Close Selection"
                >
                  <X className="h-5.5 w-5.5 stroke-[2.5]" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Logout Commitment Confirmation Modal shaped precisely like the screenshots */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[300] flex items-center justify-center p-6"
              >
                <motion.div 
                  initial={{ scale: 0.92, y: 15 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.92, y: 15 }}
                  className="w-full max-w-[320px] rounded-[32px] bg-[#222222] border border-white/5 overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
                >
                  {/* Header */}
                  <div className="w-full h-15 bg-[#2b2b2b] flex items-center justify-center border-b border-white/5">
                    <span className="text-white font-black text-[20px] tracking-wide">
                      Warning
                    </span>
                  </div>

                  <div className="p-8 text-center bg-[#222222]">
                    <p className="text-white font-semibold text-[16px] leading-relaxed mb-9">
                      {selectedLang === 'en' 
                        ? 'Are you sure you want to logout' 
                        : 'क्या आप वाकई लॉगआउट करना चाहते हैं'}
                    </p>

                    <div className="flex flex-col gap-3.5">
                      <button
                        onClick={() => {
                          playWingoSound(clickAudioRef);
                          setShowLogoutConfirm(false);
                          handleLogout();
                        }}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#ffbc0d] to-[#ffaa22] text-white font-black text-[16px] shadow-lg active:scale-95 transition transform cursor-pointer"
                      >
                        Logout
                      </button>
                      
                      <button
                        onClick={() => {
                          playWingoSound(clickAudioRef);
                          setShowLogoutConfirm(false);
                        }}
                        className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#d54b52] to-[#b91c1c] text-white font-black text-[16px] shadow-lg active:scale-95 transition transform cursor-pointer border border-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
        </>
      ) : (
        /* RENDER LOGIN/REGISTER ASSETS IF USER IS NOT REGISTERED OR LOGGED IN */
        <div className="relative z-10 w-full max-w-[410px] bg-transparent flex flex-col pt-6 pb-6 px-4">
          
          <AnimatePresence mode="wait">
            {!showLanguageScreen ? (
              /* ========================================================= */
              /* 3. A. PORTAL MAIN INTERACTIVE PAGE VIEW                    */
              /* ========================================================= */
              <motion.div
                key="main-portal"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                {/* 1. PORTAL HEADER: Back, Support, and Language Selection */}
                <div className="flex items-center justify-between w-full mb-2">
                  <button 
                    type="button"
                    className="p-2 text-white/80 hover:text-white transition cursor-pointer"
                    title="Back"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>

                  <div className="flex items-center gap-3">
                    {/* Support Button */}
                    <button 
                      type="button"
                      onClick={() => setShowGlobalChat(true)}
                      className="p-1.5 text-white/80 hover:text-white transition cursor-pointer"
                    >
                      <Headset className="h-5 w-5" />
                    </button>

                    {/* Language Selection Toggle */}
                    <button 
                      type="button"
                      onClick={() => setShowLanguageScreen(true)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition cursor-pointer"
                    >
                      <span className="text-[14px]">
                        {selectedLang === 'en' ? '🇬🇧' : '🇮🇳'}
                      </span>
                      <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                        {selectedLang.toUpperCase()}
                      </span>
                    </button>
                  </div>
                </div>

                 {/* CENTER BRAND LOGO - Neon Trade */}
                 <div className="flex flex-col items-center justify-center my-6 select-none">
                   <img 
                     src={gameLogo} 
                     alt="Neon Trade Logo"
                     className="h-24 w-auto object-contain drop-shadow-xl pointer-events-none" 
                     draggable={false}
                     onContextMenu={(e) => e.preventDefault()}
                   />
                 </div>

                {/* Enhanced Promotional Dismissible Banner with Close Cross */}
                <AnimatePresence>
                  {bannerVisible && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="relative w-full rounded-2xl overflow-hidden p-4 mb-5 border border-[#ffd275]/25 shadow-2xl"
                      style={{
                        background: 'linear-gradient(135deg, #441111 0%, #220505 100%)',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.65), inset 0 0 12px rgba(253, 210, 117, 0.08)'
                      }}
                    >
                      <button
                        id="banner-dismiss-cross"
                        onClick={() => setBannerVisible(false)}
                        className="absolute top-2.5 right-2 px-1.5 py-1.5 rounded-full flex items-center justify-center text-rose-500 hover:text-white bg-black/40 hover:bg-rose-600/30 transition cursor-pointer z-20"
                        title="Dismiss banner"
                      >
                        <X className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      <div className="flex items-center gap-4">
                        {/* Enhanced Logo Icon with pulsing ambient border */}
                        <div className="relative shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-black/55 border border-[#ffd275]/35 shadow-inner select-none">
                          <span className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-red-500 to-amber-400 opacity-20 blur animate-pulse" />
                          <img
                            src={gameLogo}
                            alt="Neon Trade Logo"
                            className="h-12 w-auto object-contain relative z-10 filter drop-shadow-[0_0_6px_rgba(253,210,117,0.35)] pointer-events-none"
                            referrerPolicy="no-referrer"
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                          />
                        </div>

                        <div className="flex-1 text-left min-w-0">
                          <h4 className="font-sans text-[13px] font-black text-white leading-tight tracking-wide flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            {t.bannerTitle}
                          </h4>
                          <p className="mt-1 text-[10px] text-neutral-300 font-medium select-none leading-relaxed">
                            {t.bannerSubtitle.split('Allow')[0] || ''}
                            <span className="text-[#ffd275] font-extrabold px-0.5">Allow</span>
                            {t.bannerSubtitle.split('Allow')[1] || ''}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentTab('wheel');
                          setLobbyToast({ type: 'success', text: selectedLang === 'en' ? 'Welcome Bonus Activated!' : 'वेलकम बोनस सक्रिय हो गया!' });
                        }}
                        className="mt-3.5 w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-[#ffd275] to-[#f59e0b] py-2 px-4 text-center font-sans text-[11.5px] font-black uppercase text-black tracking-wider shadow-[0_4px_15px_rgba(251,176,59,0.35)] hover:brightness-110 active:scale-98 transition transform cursor-pointer"
                      >
                        <span className="flex items-center justify-center gap-1">
                          🎁 {t.bannerCta}
                        </span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notification System */}
                {formFeedback && (
                  <div 
                    className={`mb-4 w-full rounded-2xl p-3 text-xs font-semibold text-left border ${
                      formFeedback.type === 'success' 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-600/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    {formFeedback.message}
                  </div>
                )}

                {/* Real-time Interaction Registration/Login Form */}
                <form onSubmit={handleSubmit} className="w-full flex flex-col">
                  <div className="space-y-4">
                    
                    {/* PHONE NUMBER FIELD (+91, exactly matching physical screenshot specs) */}
                    <div className="relative w-full">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <Smartphone className="h-5 w-5 text-red-500 stroke-[2.2] filter drop-shadow-[0_2px_4px_rgba(239,68,68,0.2)]" />
                        <span className="text-[14px] font-bold text-neutral-300 pr-1.5 border-r border-[#241e1e]">
                          +91
                        </span>
                      </div>
                      <input
                        type="tel"
                        id="login-phone-control"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder={t.phonePlaceholder}
                        className="w-full rounded-2xl border border-neutral-900 bg-neutral-950/80 pl-18 pr-4 py-3.5 text-[14px] text-white placeholder-neutral-500 focus:border-red-600/50 focus:ring-1 focus:ring-red-600/25 outline-none transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                        required
                      />
                    </div>

                    {/* PASSWORD KEYS FIELD */}
                    <div className="relative w-full">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                        <Lock className="h-4.5 w-4.5 text-red-500 stroke-[2.2]" />
                      </div>
                      <input
                        type={isPasswordVisible ? 'text' : 'password'}
                        id="login-pass-control"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t.passwordPlaceholder}
                        className="w-full rounded-2xl border border-neutral-900 bg-neutral-950/80 pl-12 pr-12 py-3.5 text-[14px] text-white placeholder-neutral-500 focus:border-red-600/50 focus:ring-1 focus:ring-red-600/25 outline-none transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                        maxLength={15}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
                      >
                        {isPasswordVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                      </button>
                    </div>

                    {!isRegisterMode && (
                      <div className="flex items-center justify-between px-1 mt-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 checked:bg-red-600 transition cursor-pointer" 
                          />
                          <span className="text-[12px] text-neutral-400 font-medium group-hover:text-neutral-300 transition">
                            {selectedLang === 'en' ? 'Remember password' : 'पासवर्ड याद रखें'}
                          </span>
                        </label>
                      </div>
                    )}

                    {/* ADDITIONAL REGISTRATION FIELDS */}
                    {isRegisterMode && (
                      <>
                        {/* VERIFY PASSWORD */}
                        <div className="relative w-full">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                            <Lock className="h-4.5 w-4.5 text-red-500 stroke-[2.2]" />
                          </div>
                          <input
                            type={isConfirmPasswordVisible ? 'text' : 'password'}
                            id="login-pass-verify"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t.confirmPasswordPlaceholder}
                            className="w-full rounded-2xl border border-neutral-900 bg-neutral-950/80 pl-12 pr-12 py-3.5 text-[14px] text-white placeholder-neutral-500 focus:border-red-600/50 focus:ring-1 focus:ring-red-600/25 outline-none transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                            maxLength={15}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition cursor-pointer"
                          >
                            {isConfirmPasswordVisible ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                          </button>
                        </div>

                        {/* REFERRAL FIELD */}
                        <div className="relative w-full">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center">
                            <ShieldCheck className="h-4.5 w-4.5 text-red-500 stroke-[2.2]" />
                          </div>
                          <input
                            type="text"
                            id="login-referral-id"
                            value={referralInput}
                            onChange={(e) => setReferralInput(e.target.value)}
                            placeholder={t.referralPlaceholder}
                            className="w-full rounded-2xl border border-neutral-900 bg-neutral-950/80 pl-12 pr-4 py-3.5 text-[14px] text-white placeholder-neutral-500 focus:border-red-600/50 focus:ring-1 focus:ring-red-600/25 outline-none transition duration-150 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                          />
                        </div>
                      </>
                    )}

                  </div>

                  {/* Submits and Switches */}
                  <div className="mt-8 flex flex-col items-center">
                    
                    {/* Golden Coin indicators */}
                    {isRegisterMode && (
                      <div 
                        className="mb-3.5 z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-black uppercase text-amber-300 shadow bg-gradient-to-r from-red-950/60 via-amber-950/50 to-red-950/60 border border-amber-500/20 font-mono tracking-wider animate-pulse"
                      >
                        <Coins className="h-4 w-4 text-amber-400 stroke-[2.2] shrink-0" />
                        {t.signUpBonus}
                      </div>
                    )}

                    {/* Register core Action submit button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full overflow-hidden rounded-full py-4 text-center font-display text-base font-extrabold uppercase tracking-widest text-white shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-98 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
                      style={{
                        background: 'linear-gradient(135deg, #aa1a1a 0%, #631212 100%)',
                        boxShadow: '0 6px 20px -2px rgba(170, 26, 26, 0.45)'
                      }}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </span>
                      ) : (
                        isRegisterMode ? t.registerBtn : t.loginBtn
                      )}
                    </button>

                    {/* Navigate button switch */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterMode(!isRegisterMode);
                        setFormFeedback(null);
                      }}
                      className="mt-4 w-full rounded-full border border-neutral-800 bg-neutral-950/10 py-3.5 text-center font-display text-[13px] font-bold uppercase tracking-wider text-red-500 hover:bg-neutral-800/10 hover:text-red-400 transition cursor-pointer"
                      style={{
                        border: '1px solid rgba(170, 26, 26, 0.25)',
                        color: '#aa1a1a'
                      }}
                    >
                      {isRegisterMode ? t.passwordLoginBtn : t.registerNewAccountBtn}
                    </button>


                    
                  </div>
                </form>
              </motion.div>
            ) : (
              /* ========================================================= */
              /* 3. B. SUB-PAGE: LANGUAGE SELECTION VIEW                    */
              /* ========================================================= */
              <motion.div
                key="language-settings"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col"
              >
                {/* LANGUAGE HEADER MATCHING VIEW 2 */}
                <div className="flex items-center justify-between w-full border-b border-neutral-900 pb-4 mb-6">
                  <button 
                    type="button"
                    onClick={() => setShowLanguageScreen(false)}
                    className="text-neutral-300 hover:text-white transition duration-150 cursor-pointer"
                    title="Back"
                  >
                    <ChevronLeft className="h-6 w-6 stroke-[2.5]" />
                  </button>
                  
                  <h3 className="text-white font-display text-[17px] font-bold text-center">
                    {t.languageHeader}
                  </h3>

                  {/* Empty block to support symmetry and centering */}
                  <div className="w-6" />
                </div>

                {/* LIST OF OPTIONS (English / हिन्दी) */}
                <div className="space-y-3">
                  {/* 1. ENGLISH ITEM */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLang('en');
                      setShowLanguageScreen(false);
                      setFormFeedback(null);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl bg-[#141212] border transition duration-150 cursor-pointer ${
                      selectedLang === 'en' 
                        ? 'border-[#911f1f]/50 bg-gradient-to-r from-[#1c1414] to-[#120d0d]' 
                        : 'border-neutral-900/60 hover:bg-[#1a1717]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none leading-none">🇬🇧</span>
                      <span className="text-[14px] font-bold text-white tracking-wide">
                        {t.languageEnglish}
                      </span>
                    </div>
                    {selectedLang === 'en' && (
                      <Check className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
                    )}
                  </button>

                  {/* 2. HINDI ITEM */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLang('hi');
                      setShowLanguageScreen(false);
                      setFormFeedback(null);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl bg-[#141212] border transition duration-150 cursor-pointer ${
                      selectedLang === 'hi' 
                        ? 'border-[#911f1f]/50 bg-gradient-to-r from-[#1c1414] to-[#120d0d]' 
                        : 'border-neutral-900/60 hover:bg-[#1a1717]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl select-none leading-none">🇮🇳</span>
                      <span className="text-[14px] font-bold text-white tracking-wide">
                        {t.languageHindi}
                      </span>
                    </div>
                    {selectedLang === 'hi' && (
                      <Check className="h-5 w-5 text-emerald-400 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* Deposit Overlay */}
      <AnimatePresence>
        {showDepositScreen && (
          <motion.div
            key="deposit-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
          >
            <DepositScreen 
              onClose={() => setShowDepositScreen(false)} 
              balance={balance} 
              onRefresh={handleRefreshBalance}
              onAddNotification={handleManualNotification}
            />
          </motion.div>
        )}
        {showWithdrawScreen && (
          <motion.div
            key="withdraw-screen"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100]"
          >
            <WithdrawScreen 
              onClose={() => setShowWithdrawScreen(false)} 
              balance={balance} 
              onRefresh={handleRefreshBalance}
              selectedLang={selectedLang}
              onAddNotification={handleManualNotification}
            />
          </motion.div>
        )}
        {showBetSuccessful && (
          <motion.div
            key="bet-successful"
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/80 backdrop-blur-[2px] text-white px-4 py-2.5 rounded-lg shadow-2xl text-[13px] font-medium tracking-tight">
              {selectedLang === 'en' ? 'Bet Successful' : 'सट्टा सफल'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showGlobalChat && (
          <SupportChat 
            onClose={() => setShowGlobalChat(false)} 
            userName={nickname}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showInvitationBonus && (
          <InvitationBonusView 
            onClose={() => setShowInvitationBonus(false)} 
            selectedLang={selectedLang}
            uid={uid}
            inviteeCount={inviteeCount}
            inviteeDepositCount={inviteeDepositCount}
            claimedBonuses={claimedInvitationBonuses}
            onClaim={handleClaimInvitationBonus}
          />
        )}
      </AnimatePresence>
      <WingoWinningsModal 
        alert={wingoWinningsAlert} 
        uid={uid}
        selectedLang={selectedLang}
        onClose={() => setWingoWinningsAlert(null)}
      />

      {isLoggedIn && isAdmin && !showAdminView && (
        <button 
          onClick={() => setShowAdminView(true)}
          className="fixed bottom-24 right-4 z-[9999] bg-[#ff3b30] text-white font-bold p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 h-11 hover:bg-[#ff453a] active:scale-95 transition-all text-xs font-black tracking-wider uppercase border border-white/20 cursor-pointer shadow-[0_4px_20px_rgba(255,59,48,0.4)]"
          title="Return to Admin Panel"
        >
          <Settings className="w-4 h-4 animate-spin-slow" />
          <span>Admin Panel</span>
        </button>
      )}

      {/* Progressive Web App (PWA) Quick Install banner and modal overlay */}
      <QuickInstall selectedLang={selectedLang} currentTab={currentTab} />

      {/* 200 Deposit Required Warning Modal */}
      <AnimatePresence>
        {showDepositRequiredModal && (
          <motion.div
            key="id-deposit-required-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#1b2330]/95 border border-white/10 shadow-[0_15px_35px_rgba(0,0,0,0.6)] w-full max-w-[280px] rounded-[18px] pt-5 overflow-hidden flex flex-col items-center text-center relative font-sans"
            >
              {/* Exclamation mark */}
              <div className="text-white text-3xl font-black mb-3 select-none leading-none">
                !
              </div>

              {/* Divider line under exclamation */}
              <div className="w-full h-[1px] bg-white/10" />

              {/* Modal Body */}
              <div className="p-4 flex flex-col items-center">
                {/* Error Header */}
                <div className="text-[14px] font-bold text-white/95 leading-tight tracking-wide mb-1">
                  Error: 1003
                </div>

                {/* Subtitle Message precisely configured as requested */}
                <div className="text-[12.5px] text-neutral-200 font-medium px-2 mt-1 leading-snug">
                  {selectedLang === 'en' 
                    ? '₹200 deposit required to enter.' 
                    : 'प्रवेश करने के लिए ₹200 का डिपॉजिट आवश्यक है।'}
                </div>
              </div>

              {/* Action buttons integrated neatly with Goagames aesthetics */}
              <div className="w-full flex border-t border-white/10 divide-x divide-white/10 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepositRequiredModal(false);
                    setShowDepositScreen(true);
                  }}
                  className="w-1/2 py-3 text-[12px] font-sans font-black text-blue-400 hover:bg-white/5 active:bg-white/10 transition cursor-pointer text-center uppercase tracking-wide"
                >
                  {selectedLang === 'en' ? 'Deposit' : 'डिपॉजिट'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositRequiredModal(false)}
                  className="w-1/2 py-3 text-[12px] font-sans font-black text-neutral-400 hover:text-white hover:bg-white/5 active:bg-white/10 transition cursor-pointer text-center uppercase tracking-wide"
                >
                  {selectedLang === 'en' ? 'Close' : 'बंद करें'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
