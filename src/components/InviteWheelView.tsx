import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, FileText, ChevronLeft, Volume2, VolumeX, Sparkles, Crown } from 'lucide-react';

interface InviteWheelViewProps {
  selectedLang: string;
  onBack?: () => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setLobbyToast: React.Dispatch<React.SetStateAction<{type: 'success'|'error'|'info', text: string} | null>>;
  nickname: string;
  avatar: string;
  totalDeposits: number;
}

const PRIZES = [
  { id: 1, label: '₹1', value: 1, prob: 25 },
  { id: 2, label: '₹2', value: 2, prob: 20 },
  { id: 3, label: '₹3', value: 3, prob: 18 },
  { id: 4, label: '₹5', value: 5, prob: 15 },
  { id: 5, label: '₹8', value: 8, prob: 10 },
  { id: 6, label: '₹10', value: 10, prob: 7 },
  { id: 7, label: '₹15', value: 15, prob: 4 },
  { id: 8, label: '₹98', value: 98, prob: 1 }
];

export default function InviteWheelView({ selectedLang, onBack, balance, setBalance, setLobbyToast, nickname, avatar, totalDeposits }: InviteWheelViewProps) {
  const [spinsLeft, setSpinsLeft] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [wonAmount, setWonAmount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rewardWallet, setRewardWallet] = useState(0);
  const [spinHistory, setSpinHistory] = useState<{ id: number; user: string; amount: number; time: string; isYou: boolean }[]>([]);
  
  const unlockTarget = 100;

  const handleCashOut = () => {
    if (rewardWallet >= unlockTarget) {
      setBalance(prev => prev + rewardWallet);
      setRewardWallet(0);
      setLobbyToast({ type: 'success', text: selectedLang === 'en' ? 'Cash out successful!' : 'निकालना सफल रहा!' });
    } else {
      setLobbyToast({ type: 'error', text: selectedLang === 'en' ? `Reach ₹${unlockTarget} to cash out.` : `निकालने के लिए ₹${unlockTarget} तक पहुंचें.` });
    }
  };
  
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPopup) {
      timer = setTimeout(() => {
        setShowPopup(false);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [showPopup]);
  
  // Audio configuration 
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // We are simulating audio objects here for the "sound effect" requirements.
    // In a real app we would load actual MP3/WAV files.
    spinAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
    winAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
    
    return () => {
      if (spinAudioRef.current) {
        spinAudioRef.current.pause();
        spinAudioRef.current = null;
      }
      if (winAudioRef.current) {
        winAudioRef.current.pause();
        winAudioRef.current = null;
      }
    };
  }, []);

  const getPrizeIndex = (isFirstSpin: boolean) => {
    // 🔒 Security: First signup spin fixed to ₹98. 
    // In production, this should be enforced from API response.
    if (isFirstSpin) return 7; 
    
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (let i = 0; i < PRIZES.length; i++) {
      cumulative += PRIZES[i].prob;
      if (rand <= cumulative) {
        return i;
      }
    }
    return 0; // Fallback
  };

  const handleSpin = () => {
    if (totalDeposits < 200) {
      setLobbyToast({ type: 'error', text: selectedLang === 'en' ? 'Spin is locked! Deposit ₹200 to unlock.' : 'स्पिन लॉक है! अनलॉक करने के लिए ₹200 जमा करें।' });
      return;
    }
    if (spinsLeft <= 0) {
      setLobbyToast({ type: 'error', text: selectedLang === 'en' ? 'No spins available! Invite friends to get more.' : 'कोई स्पिन उपलब्ध नहीं है! अधिक प्राप्त करने के लिए दोस्तों को आमंत्रित करें।' });
      return;
    }
    if (isSpinning) return;

    // Trigger vibration if supported
    if (navigator.vibrate) navigator.vibrate(50);

    setIsSpinning(true);
    setSpinsLeft(prev => prev - 1);
    
    if (soundEnabled && spinAudioRef.current) {
      spinAudioRef.current.currentTime = 0;
      spinAudioRef.current.play().catch(e => console.log('Audio play blocked:', e));
    }

    // Determine Result
    const isFirstSpin = totalSpins === 0;
    const targetPrizeIndex = getPrizeIndex(isFirstSpin);
    
    // Calculate rotation with easing duration 7 seconds
    // 8 extra full spins + target angle
    const extraSpins = 8;
    const sliceAngle = 360 / PRIZES.length;
    // Align so pointer stops exactly at the center of the target slice
    const stopAngle = (targetPrizeIndex * sliceAngle); 
    const finalRotation = rotation - (rotation % 360) + (extraSpins * 360) - stopAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      // Wheel finished spinning
      setIsSpinning(false);
      setTotalSpins(prev => prev + 1);
      
      if (soundEnabled && spinAudioRef.current) {
        spinAudioRef.current.pause();
      }
      
      const prize = PRIZES[targetPrizeIndex];
      setWonAmount(prize.value);
      
      // Vibration pattern for win
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
      
      if (soundEnabled && winAudioRef.current) {
        winAudioRef.current.currentTime = 0;
        winAudioRef.current.play().catch(e => console.log('Audio play blocked:', e));
      }
      
      setShowPopup(true);
      // Add reward to the wheel's wallet
      setRewardWallet(prev => prev + prize.value);
      
      // Get formatted date/time like 2026-05-24 15:46:27
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
      
      // Add to history
      setSpinHistory(prev => [
        { id: Date.now(), user: nickname, amount: prize.value, time: formattedDate, isYou: true },
        ...prev
      ].slice(0, 15)); // Keep last 15
      
    }, 7000); // 7 seconds spin duration matches transition duration
  };

  const handleInvite = () => {
    setLobbyToast({ type: 'success', text: selectedLang === 'en' ? 'Referral link copied!' : 'रेफरल लिंक कॉपी किया गया!' });
    setTimeout(() => {
       setSpinsLeft(prev => prev + 1);
       setLobbyToast({ type: 'info', text: selectedLang === 'en' ? 'A friend registered! You got 1 Spin.' : 'एक दोस्त ने पंजीकरण किया! आपको 1 स्पिन मिला।' });
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full h-full flex flex-col font-sans relative bg-[#1a0808] text-white overflow-hidden"
    >
      {/* Premium CSS Keyframe Styles for shiny gleam effect and LED chase lights */}
      <style>{`
        @keyframes shine-sweep {
          0% { transform: translateX(-150%) rotate(45deg); }
          50%, 100% { transform: translateX(150%) rotate(45deg); }
        }
        .shiny-btn::after {
          content: '';
          position: absolute;
          top: -50%; right: -50%; bottom: -50%; left: -50%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%);
          transform: rotate(45deg);
          animation: shine-sweep 3s infinite ease-in-out;
        }
        @keyframes led-glow-odd {
          0%, 100% { background-color: #ffbb0d; box-shadow: 0 0 10px #ffbb0d, inset 0 -2px 4px rgba(0,0,0,0.3); }
          50% { background-color: #ffe89e; box-shadow: 0 0 4px #ffbb0d, inset 0 -1px 2px rgba(0,0,0,0.2); opacity: 0.6; }
        }
        @keyframes led-glow-even {
          0%, 100% { background-color: #ffe3db; box-shadow: 0 0 3px #ffffff, inset 0 -1px 2px rgba(0,0,0,0.2); opacity: 0.6; }
          50% { background-color: #ffffff; box-shadow: 0 0 10px #ffffff, inset 0 -2px 4px rgba(0,0,0,0.3); }
        }
        .bulb-odd {
          animation: led-glow-odd 1.2s infinite ease-in-out;
        }
        .bulb-even {
          animation: led-glow-even 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Premium Dark Casino Background with Golden Sparkles and Beams */}
      <div className="absolute inset-0 bg-radial-gradient from-[#3a1416] via-[#1a0808] to-[#0d0303] pointer-events-none" />
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 overflow-hidden">
        <svg className="absolute top-[10%] w-[200%] h-[500px] -left-[50%] fill-[#ff5138]" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      {/* Elegant Radial Shine Backdrop Behind the Wheel */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-radial from-[#ff8d00]/10 via-[#ff3b2f]/0 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#23090a] border-b border-[#ffbb0d]/15 shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors active:scale-95">
              <ChevronLeft className="w-6 h-6 text-[#ffbb0d]" />
            </button>
          )}
          <h1 className="text-xl font-black tracking-widest text-[#ffbb0d] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {selectedLang === 'en' ? 'Lucky Wheel' : 'लकी व्हील'}
          </h1>
        </div>
        <div className="flex items-center gap-4 text-[#ffbb0d]">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className="hover:text-white transition-colors p-1 bg-[#3a1a1c] border border-white/5 rounded-lg">
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 opacity-50" />}
          </button>
          <HelpCircle className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="flex flex-col items-center flex-1 px-4 pt-6 pb-40 relative z-10 overflow-y-auto">
        
        {/* VIP Golden Wallet/Balance Card */}
        <div className="w-full max-w-sm bg-gradient-to-b from-[#3a1a1c]/70 to-[#1e0a0b]/90 backdrop-blur-md rounded-2xl py-3.5 px-4.5 border border-[#ffbb0d]/30 shadow-[0_12px_30px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] mb-4 flex flex-col items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#ffbb0d]/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#ff3b2f]/5 rounded-full blur-2xl pointer-events-none" />
          
          <div id="lbl-min-cashout-limit" className="text-[#ffbb0d] text-[11px] font-black tracking-widest uppercase flex items-center gap-1.5 drop-shadow">
            <div className="w-1.5 h-1.5 rounded-full bg-[#ffbb0d] animate-pulse shadow-[0_0_8px_#ffbb0d]" />
            {selectedLang === 'en' ? 'MINIMUM CASH OUT ₹100' : 'न्यूनतम निकासी ₹100'}
          </div>
          
          <div className="mt-1.5 flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-[#ffbb0d] drop-shadow-md">₹</span>
            <span className="text-4xl font-black tracking-wider text-white drop-shadow-[0_2px_15px_rgba(255,187,13,0.3)]">
              {rewardWallet.toFixed(2)}
            </span>
          </div>

          {/* Luxury Progress Bar to 100 */}
          <div className="w-full bg-black/50 h-2 rounded-full mt-3 overflow-hidden p-[1px] border border-white/5">
            <div 
              className="bg-gradient-to-r from-[#ffbb0d] via-[#ffa100] to-[#ff4148] h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(255,187,13,0.8)]"
              style={{ width: `${Math.min(100, (rewardWallet / unlockTarget) * 100)}%` }}
            />
          </div>
          
          <div className="w-full flex justify-between mt-1.5 text-[10px] text-white/60 font-black uppercase tracking-wider">
            <span>{selectedLang === 'en' ? 'Target Status' : 'लक्ष्य की स्थिति'}</span>
            <span className="text-[#ffbb0d]">{Math.min(100, Math.round((rewardWallet / unlockTarget) * 100))}%</span>
          </div>

          <button 
            onClick={handleCashOut}
            className={`shiny-btn mt-3.5 w-full py-2.5 bg-gradient-to-b from-[#ffbb0d] to-[#d69000] text-[#2c0b0c] font-black rounded-xl text-xs uppercase tracking-widest shadow-[0_6px_20px_rgba(255,187,13,0.3),inset_0_2px_3px_rgba(255,255,255,0.4)] active:translate-y-0.5 active:shadow-sm transition-all cursor-pointer border-t border-[#fff]/50 hover:brightness-110 relative overflow-hidden`}
          >
            {selectedLang === 'en' ? 'CASH OUT TO WALLET' : 'वॉलेट में निकालें'}
          </button>
        </div>

        {/* Spinner Frame Container */}
        <div className="relative mt-2 mb-14 flex justify-center items-center w-[320px] h-[320px] sm:w-[360px] sm:h-[360px] z-10 shrink-0">
           
           {/* Wheel Border Ring */}
           <div className="absolute inset-0 rounded-full flex items-center justify-center p-[18px] z-10 border-[6px] border-[#ffbb0d] bg-gradient-to-b from-[#4a1a1c] to-[#2c1012] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.6),0_15px_40px_rgba(0,0,0,0.9)]">
              
              {/* Outer Border Dots with flashing LED chase animation */}
              <div className="absolute inset-0 rounded-full pointer-events-none">
                 {Array.from({ length: 24 }).map((_, i) => (
                    <div 
                      key={`border-dot-${i}`} 
                      className={`absolute w-[12px] h-[12px] rounded-full ${i % 2 === 0 ? 'bulb-odd' : 'bulb-even'}`} 
                      style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${i * 15}deg) translateY(-152px)`
                      }}
                    />
                 ))}
              </div>

              {/* The Spinning Wheel Slices */}
              <motion.div 
                className="w-full h-full relative border-[4px] border-[#ffbb0d] rounded-full overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.7)] bg-[#1e0a0b]"
                animate={{ rotate: rotation }}
                transition={{ 
                  duration: 7, 
                  type: 'tween', 
                  ease: [0.15, 0.95, 0.25, 1] // Custom casino wheel easing rotation curve
                }}
              >
                 {/* Shine glow reflection sweep while spinning */}
                 <AnimatePresence>
                   {isSpinning && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 0.4, rotate: -rotation }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 7, ease: [0.15, 0.95, 0.25, 1] }}
                       className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.35)_45deg,transparent_90deg)] z-20 pointer-events-none"
                     />
                   )}
                 </AnimatePresence>

                 {/* Slices Conic Gradient Background */}
                 <div 
                   className="absolute inset-0 rounded-full" 
                   style={{
                     background: `conic-gradient(
                       #3e1619 0deg 45deg, 
                       #270d0f 45deg 90deg, 
                       #3e1619 90deg 135deg, 
                       #270d0f 135deg 180deg, 
                       #3e1619 180deg 225deg, 
                       #270d0f 225deg 270deg, 
                       #3e1619 270deg 315deg, 
                       #270d0f 315deg 360deg)`
                   }}
                 />

                 {/* Slice Borders & Text */}
                 {PRIZES.map((prize, index) => {
                    const sliceAngle = 360 / PRIZES.length;
                    const textRotation = (index * sliceAngle) + (sliceAngle / 2) - 90;
                    
                    return (
                      <div 
                        key={prize.id}
                        className="absolute top-0 left-0 w-full h-full flex items-center justify-end pr-[14%]"
                        style={{
                          transform: `rotate(${textRotation}deg)`,
                          transformOrigin: '50% 50%'
                        }}
                      >
                         <span className={`font-black text-[22px] whitespace-nowrap rotate-90 tracking-widest drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${prize.value >= 15 ? 'text-[#ffbb0d]' : 'text-white'}`}>
                           {prize.label}
                         </span>
                      </div>
                    );
                 })}
                 
                 {/* Shiny Golden Divider Inlays */}
                 {PRIZES.map((_, index) => {
                    const sliceAngle = 360 / PRIZES.length;
                    return (
                      <div 
                        key={`separator-${index}`}
                        className="absolute w-[2px] h-[50%] bg-[#ffbb0d]/40 origin-bottom shadow-[0_0_4px_#ffbb0d]"
                        style={{ 
                          left: '50%',
                          top: '0',
                          marginLeft: '-1px',
                          transform: `rotate(${index * sliceAngle}deg)` 
                        }}
                      />
                    );
                 })}
              </motion.div>

              {/* Center Play Button Cap */}
              <button 
                onClick={handleSpin}
                disabled={isSpinning}
                className="absolute w-[105px] h-[105px] rounded-full z-20 flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.8),inset_0_4px_10px_rgba(255,255,255,0.25)] border-[5px] border-[#ffbb0d] bg-gradient-to-b from-[#4a1a1c] to-[#1e0a0b] cursor-pointer active:scale-95 transition-transform hover:brightness-110"
              >
                 {/* Visual pulsing wave ring around inner spinner */}
                 <div className="absolute inset-0 rounded-full border border-[#ffbb0d]/20 animate-ping pointer-events-none" />
                 
                 <span className="text-[#ffbb0d] font-black text-[34px] leading-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] mt-1.5">
                   X{spinsLeft}
                 </span>
                 <span className="text-[#ffbb0d] font-black text-[9px] mt-0.5 tracking-widest uppercase whitespace-nowrap opacity-90 pb-1">
                   {selectedLang === 'en' ? 'FREE SPIN' : 'फ्री स्पिन'}
                 </span>
              </button>
           </div>

           {/* Professional Polished Golden Pointer Downward */}
           <div className="absolute -top-[25px] left-1/2 -ml-[30px] w-[60px] h-[75px] z-30 flex flex-col items-center drop-shadow-[0_10px_8px_rgba(0,0,0,0.8)]">
             <div className="w-[50px] h-[24px] bg-gradient-to-b from-[#ffbb0d] to-[#d69000] rounded-t-lg border-2 border-white/40 border-b-0" />
             <div 
               className="w-[50px] h-[45px] bg-[#d69000] flex items-center justify-center border-2 border-white/40 border-t-0"
               style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
             />
             <div 
               className="absolute top-[3px] w-[42px] h-[40px] bg-gradient-to-b from-[#fff] to-[#ffbb0d]"
               style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
             />
           </div>
        </div>

        {/* Modern RED Pill Invite Button */}
        <button 
          id="btn-invite-rewards"
          onClick={handleInvite}
          className="w-full max-w-[360px] py-4 bg-gradient-to-b from-[#e63238] to-[#cc141a] text-white font-extrabold rounded-full text-[16px] uppercase tracking-wider shadow-[0_6px_20px_rgba(204,20,26,0.35),inset_0_2px_4px_rgba(255,255,255,0.3)] active:translate-y-0.5 transition-all border-t border-[#ff8e91]/40 z-20 cursor-pointer text-shadow-sm hover:brightness-110 flex items-center justify-center gap-2 shrink-0"
        >
          {selectedLang === 'en' ? 'INVITE FRIENDS FOR REWARDS' : 'पुरस्कारों के लिए दोस्तों को आमंत्रित करें'}
        </button>
        
        {/* Remaining Price Counter label text */}
        <p id="lbl-remaining-target" className="text-white/95 font-semibold text-[15px] mt-4 mb-8 text-center z-20 tracking-wide">
          {selectedLang === 'en' 
            ? `Only ₹${Math.max(0, 100 - rewardWallet).toFixed(2)} left to get prize ₹100.00` 
            : `पुरस्कार ₹100.00 प्राप्त करने के लिए केवल ₹${Math.max(0, 100 - rewardWallet).toFixed(2)} शेष हैं`}
        </p>

        {/* User Record History List Container - Clean professional layout */}
        {spinHistory.length > 0 && (
          <div id="container-record-history" className="w-full max-w-sm mt-2 text-left z-20 relative px-1 flex flex-col">
            <h3 id="heading-record" className="text-white text-xl font-extrabold tracking-wide mb-5 flex items-center justify-between">
              <span>{selectedLang === 'en' ? 'Record' : 'इतिहास'}</span>
            </h3>
            
            <div id="list-records" className="flex flex-col divide-y divide-white/[0.08]">
              {spinHistory.map((record, index) => (
                <div 
                  id={`record-item-${record.id}-${index}`}
                  key={`${record.id}-${index}`}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 transition-opacity"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      {/* Premium glowing corona ring around user photo */}
                      <div className="absolute -inset-0.5 bg-gradient-to-tr from-[#ffbb0d] to-[#ff4c4c] rounded-full blur-[1px] opacity-75 animate-pulse" />
                      <img 
                        src={avatar} 
                        alt="Avatar" 
                        referrerPolicy="no-referrer"
                        className="relative w-11 h-11 rounded-full border-2 border-[#1e0a0b] shadow-lg object-cover bg-amber-100"
                      />
                      {/* Gorgeous small crown overlay on top corner */}
                      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-[#ffbb0d] to-[#ffa100] p-[3px] rounded-full flex items-center justify-center border border-[#1e0a0b] shadow-md z-10">
                        <Crown className="w-2.5 h-2.5 text-[#1e0a0b] fill-[#1e0a0b] stroke-[2.5]" />
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[15px] font-extrabold text-white tracking-wide">
                        {record.user}
                      </span>
                      <span className="text-[#ffbb0d] text-[11px] font-black uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ffbb0d] animate-pulse shadow-[0_0_4px_#ffbb0d]" />
                        {selectedLang === 'en' ? 'Spin Reward' : 'स्पिन पुरस्कार'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right flex flex-col items-end gap-0.5">
                    <div className="text-[#ff4c4c] font-black tracking-wider text-[17px] drop-shadow-[0_1px_4px_rgba(255,76,76,0.3)]">
                      ₹{record.amount.toFixed(2)}
                    </div>
                    <div className="text-white/40 text-[11px] tracking-wider font-medium">
                      {record.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Minimal Bottom Win Popup */}
      <AnimatePresence>
        {showPopup && (
           <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.9 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            className="fixed bottom-[110px] left-0 right-0 z-50 px-4 flex justify-center pointer-events-none"
          >
            <div className="bg-[#2c1012] border-2 border-[#ffbb0d] px-6 py-4 rounded-xl shadow-[0_15px_35px_rgba(0,0,0,0.8)] flex items-center gap-4 w-auto drop-shadow-xl pointer-events-auto">
              <div className="w-10 h-10 rounded-full bg-gradient-to-b from-[#ffbb0d] to-[#d69000] flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-[#4d1213]" />
              </div>
              <div className="flex flex-col">
                <p className="text-white/90 text-sm font-black tracking-wider uppercase">
                  {selectedLang === 'en' ? 'CONGRATULATIONS!' : 'बधाई हो!'}
                </p>
                <div className="text-[#ffbb0d] text-2xl font-black drop-shadow-md leading-none flex items-center gap-1.5 mt-0.5">
                  <span className="text-white/80 text-xs font-bold uppercase">{selectedLang === 'en' ? 'You won' : 'आपने जीता'}:</span> ₹{wonAmount}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
