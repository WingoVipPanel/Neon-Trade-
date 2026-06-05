import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bomb, 
  ChevronLeft, 
  Coins, 
  Volume2, 
  VolumeX, 
  Trophy, 
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  RefreshCw,
  Star,
  Pencil,
  Check,
  Copy,
  Smartphone,
  Bell
} from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

interface MinesGameViewProps {
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  selectedLang: 'en' | 'hi';
  onClose: () => void;
  avatar?: string;
  uid?: string;
  nickname?: string;
  setNickname?: React.Dispatch<React.SetStateAction<string>>;
  onBetPlaced?: (cost: number) => void;
}

interface Cell {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  clickedByPlayer: boolean;
}

export default function MinesGameView({ 
  balance, 
  setBalance, 
  selectedLang, 
  onClose,
  avatar = 'https://api.dicebear.com/7.x/lorelei/svg?seed=Olivia&backgroundColor=ffd275',
  uid = '697564',
  nickname = 'MemberNNGDQTST',
  setNickname,
  onBetPlaced
}: MinesGameViewProps) {
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [localNickname, setLocalNickname] = useState(nickname);
  const [copiedActive, setCopiedActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setLocalNickname(nickname);
  }, [nickname]);

  const handleCopyUid = () => {
    navigator.clipboard.writeText(uid);
    setCopiedActive(true);
    setTimeout(() => {
      setCopiedActive(false);
    }, 2000);
  };

  const handleRefreshBalance = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    // In production, this would re-fetch from Firestore
    const user = auth.currentUser;
    if (user) {
      // Balance is already synced via state in App.tsx, 
      // but we add a small delay for production feel
      setTimeout(() => {
        setIsRefreshing(false);
      }, 700);
    } else {
      setTimeout(() => setIsRefreshing(false), 700);
    }
  };

  const t = {
    editPlaceholder: selectedLang === 'en' ? 'Enter nickname...' : 'निकनेम डालें...',
    copiedMsg: selectedLang === 'en' ? 'Copied Successfully!' : 'सफलतापूर्वक कॉपी किया गया!',
    deposit: selectedLang === 'en' ? 'Deposit' : 'जमा करें',
    withdraw: selectedLang === 'en' ? 'Withdraw' : 'निकासी'
  };

  // Game Configuration States
  const [betAmount, setBetAmount] = useState<number>(10);
  const [betInput, setBetInput] = useState<string>("10.00");
  const [minesCount, setMinesCount] = useState<number>(3);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMinesDropdownOpen, setIsMinesDropdownOpen] = useState<boolean>(false);
  const [autoGameEnabled, setAutoGameEnabled] = useState<boolean>(false);
  const [activeGameId, setActiveGameId] = useState<string>("TCL626178867" + Math.floor(100000 + Math.random() * 900000));

  // Game Engine States
  const [grid, setGrid] = useState<Cell[]>(() => generateEmptyGrid());
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [notification, setNotification] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);
  
  // Local History of last games in this session
  const [gameHistory, setGameHistory] = useState<{
    id: string;
    bet: number;
    mines: number;
    multiplier: number;
    result: 'win' | 'loss';
    profit: number;
    timestamp: string;
  }[]>([]);

  // Update states safely for floats (Rupees and Paise)
  const updateBetAmount = (val: number) => {
    const rounded = parseFloat(val.toFixed(2));
    setBetAmount(rounded);
    setBetInput(rounded.toFixed(2));
  };

  // Helper for grid cell construction
  function generateEmptyGrid(): Cell[] {
    return Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: false,
      isRevealed: false,
      clickedByPlayer: false
    }));
  }

  // Multiplier formula
  function nCr(n: number, r: number): number {
    if (r < 0 || r > n) return 0;
    if (r === 0 || r === n) return 1;
    let prod = 1;
    for (let i = 1; i <= r; i++) {
      prod = prod * (n - i + 1) / i;
    }
    return prod;
  }

  function getMinesMultiplier(mines: number, revealed: number): number {
    if (revealed === 0) return 1.0;
    const totalCells = 25;
    const gems = totalCells - mines;
    if (revealed > gems) return 0;
    
    const waysTotal = nCr(totalCells, revealed);
    const waysGems = nCr(gems, revealed);
    if (waysGems === 0) return 0;
    
    // Applying a highly generous 1% house edge to reward high mine choices with greater profits!
    const multiplier = 0.99 * (waysTotal / waysGems);
    return Math.max(1.01, parseFloat(multiplier.toFixed(2)));
  }

  const currentMultiplier = getMinesMultiplier(minesCount, revealedCount);
  const nextMultiplier = getMinesMultiplier(minesCount, revealedCount + 1);

  // Retro sound effects with browser audio context synthesizer APIs
  const playSound = (type: 'gem' | 'explosion' | 'start' | 'cashout' | 'win') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      if (type === 'gem') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        // Multiplier pitch scale (higher pitch as they hit more gems)
        const baseFreq = 523.25; // C5
        const step = revealedCount * 40;
        osc.frequency.setValueAtTime(baseFreq + step, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2 + step, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
      } else if (type === 'explosion') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(25, ctx.currentTime + 0.4);
        gain.gain.setValueAtTime(0.28, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
        
        // Deep sub rumbly layer
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(65, ctx.currentTime);
        subOsc.frequency.linearRampToValueAtTime(10, ctx.currentTime + 0.5);
        subGain.gain.setValueAtTime(0.35, ctx.currentTime);
        subGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc.start();
        subOsc.start();
        osc.stop(ctx.currentTime + 0.45);
        subOsc.stop(ctx.currentTime + 0.5);
      } else if (type === 'start') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();
        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);
        
        osc1.type = 'triangle';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime + 0.1); // C5
        osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.05); // G4
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5

        gain1.gain.setValueAtTime(0.1, ctx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        gain2.gain.setValueAtTime(0.08, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        
        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.3);
        osc2.stop(ctx.currentTime + 0.3);
      } else if (type === 'cashout') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.08); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.16); // D6
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.45);
      } else if (type === 'win') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.07); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.14); // G5
        osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.21); // C6
        osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.28); // E6
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      }
    } catch (e) {
      console.warn("Audio Context blocked", e);
    }
  };

  // Notification auto dismiss
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const handleStartGame = () => {
    if (gameState === 'playing') return;
    
  // Validation
    if (betAmount < 10) {
      setNotification({
        type: 'error',
        text: selectedLang === 'en' ? 'Minimum bet amount is ₹10' : 'न्यूनतम सट्टा राशि ₹10 है'
      });
      return;
    }

    if (balance < betAmount) {
      setNotification({
        type: 'error',
        text: selectedLang === 'en' ? 'Insufficient balance! Please select a smaller bet' : 'अपर्याप्त बैलेंस! कृपया एक छोटा सट्टा चुनें'
      });
      return;
    }

    // Deduct balance
    const updatedBalance = balance - betAmount;
    setBalance(updatedBalance);
    
    if (onBetPlaced) {
      onBetPlaced(betAmount);
    }
    
    const user = auth.currentUser;
    if (user) {
      updateDoc(doc(db, 'users', user.uid), {
        balance: updatedBalance,
        updatedAt: serverTimestamp()
      }).catch(e => console.error('Mines bet sync error:', e));
    }
    
    setRevealedCount(0);
    setActiveGameId("TCL" + Math.floor(6261700000000 + Math.random() * 99999999));
    
    // Generate board layout with exact minesCount mines placed randomly
    const cellIndices = Array.from({ length: 25 }, (_, i) => i);
    // Shuffle indices
    for (let i = cellIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cellIndices[i], cellIndices[j]] = [cellIndices[j], cellIndices[i]];
    }

    const minePositions = new Set(cellIndices.slice(0, minesCount));
    
    const freshGrid: Cell[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      isMine: minePositions.has(i),
      isRevealed: false,
      clickedByPlayer: false
    }));

    setGrid(freshGrid);
    setGameState('playing');
    playSound('start');
    
    setNotification({
      type: 'info',
      text: selectedLang === 'en' ? 'Game Started! Tap cells to find Gems.' : 'खेल शुरू! रत्न खोजने के लिए खानों पर टैप करें।'
    });
  };

  const handleCellClick = (cellId: number) => {
    if (gameState !== 'playing') return;
    
    const cell = grid[cellId];
    if (cell.isRevealed) return;

    const newGrid = [...grid];
    
    if (cell.isMine) {
      // Hit a mine! Boom! Game over
      newGrid[cellId] = { ...cell, isRevealed: true, clickedByPlayer: true };
      
      // Reveal all remaining mines and gems so player can inspect
      newGrid.forEach(c => {
        c.isRevealed = true;
      });

      setGrid(newGrid);
      setGameState('lost');
      playSound('explosion');

      // Record in session stats
      const timestamp = new Date().toLocaleTimeString();
      setGameHistory(prev => [
        {
          id: activeGameId.replace("TCL", "ID-"),
          bet: betAmount,
          mines: minesCount,
          multiplier: 0,
          result: 'loss',
          profit: -betAmount,
          timestamp
        },
        ...prev
      ]);

      setNotification({
        type: 'error',
        text: selectedLang === 'en' ? 'BOOM! You hit a mine!' : 'धमाका! आपने माइन को छू दिया!'
      });
    } else {
      // Found a safe gem!
      newGrid[cellId] = { ...cell, isRevealed: true, clickedByPlayer: true };
      const nextCount = revealedCount + 1;
      setRevealedCount(nextCount);
      
      // Check if they found all gems!
      const totalSafeGems = 25 - minesCount;
      if (nextCount === totalSafeGems) {
        // Automatic complete victory!
        newGrid.forEach(c => {
          c.isRevealed = true;
        });
        setGrid(newGrid);
        setGameState('won');
        
        const finalMulti = getMinesMultiplier(minesCount, nextCount);
        const winAmount = betAmount * finalMulti;
        const updatedBalance = balance + winAmount;
        setBalance(updatedBalance);
        
        const user = auth.currentUser;
        if (user) {
          updateDoc(doc(db, 'users', user.uid), {
            balance: updatedBalance,
            updatedAt: serverTimestamp()
          }).catch(e => console.error('Mines win sync error:', e));
        }
        
        playSound('win');

        const timestamp = new Date().toLocaleTimeString();
        setGameHistory(prev => [
          {
            id: activeGameId.replace("TCL", "ID-"),
            bet: betAmount,
            mines: minesCount,
            multiplier: finalMulti,
            result: 'win',
            profit: winAmount - betAmount,
            timestamp
          },
          ...prev
        ]);

        setNotification({
          type: 'success',
          text: selectedLang === 'en' 
            ? `CLEARED! You cleared all safe gems. Won ₹${winAmount.toFixed(2)}!` 
            : `बेहतरीन! आपने सभी रत्न खोजे। जीते ₹${winAmount.toFixed(2)}!`
        });
      } else {
        // Normal jewel reveal
        setGrid(newGrid);
        playSound('gem');
      }
    }
  };

  const handleCashOut = () => {
    if (gameState !== 'playing' || revealedCount === 0) return;

    const winAmount = betAmount * currentMultiplier;
    const updatedBalance = balance + winAmount;
    setBalance(updatedBalance);
    
    const user = auth.currentUser;
    if (user) {
      updateDoc(doc(db, 'users', user.uid), {
        balance: updatedBalance,
        updatedAt: serverTimestamp()
      }).catch(e => console.error('Mines cashout sync error:', e));
    }
    
    playSound('cashout');

    // Reveal rest of board to satisfy curiosity
    const revealedGrid = grid.map(c => ({
      ...c,
      isRevealed: true
    }));
    
    setGrid(revealedGrid);
    setGameState('won'); // Set to won so they see congratulations banner

    const timestamp = new Date().toLocaleTimeString();
    setGameHistory(prev => [
      {
        id: activeGameId.replace("TCL", "ID-"),
        bet: betAmount,
        mines: minesCount,
        multiplier: currentMultiplier,
        result: 'win',
        profit: winAmount - betAmount,
        timestamp
      },
      ...prev
    ]);

    setNotification({
      type: 'success',
      text: selectedLang === 'en' 
        ? `Cashed out! You secured ₹${winAmount.toFixed(2)} (${currentMultiplier}x)` 
        : `कैश आउट! सुरक्षित किए ₹${winAmount.toFixed(2)} (${currentMultiplier}x)`
    });
  };

  const selectRandomCell = () => {
    if (gameState !== 'playing') return;
    const unrevealedIndices = grid
      .filter(cell => !cell.isRevealed)
      .map(cell => cell.id);
    
    if (unrevealedIndices.length > 0) {
      const randomIndex = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      handleCellClick(randomIndex);
    }
  };

  // double, half or select decimal bets
  const doubleBet = () => {
    if (gameState === 'playing') return;
    updateBetAmount(Math.min(balance, betAmount * 2));
  };

  const halfBet = () => {
    if (gameState === 'playing') return;
    updateBetAmount(Math.max(10.00, betAmount / 2));
  };

  const handleManualBetChange = (rawInput: string) => {
    setBetInput(rawInput);
    const parsedVal = parseFloat(rawInput);
    if (!isNaN(parsedVal)) {
      setBetAmount(parseFloat(parsedVal.toFixed(2)));
    } else {
      setBetAmount(0);
    }
  };

  const handleInputBlur = () => {
    if (betAmount < 10) {
      updateBetAmount(10.00);
    } else {
      setBetInput(betAmount.toFixed(2));
    }
  };

  return (
    <div className="w-full flex flex-col font-sans select-none pb-8 bg-[#00214a]" style={{ minHeight: '100vh' }}>
      
      {/* 1. Curved red background banner area with rounded-b-[42px] and flat top edge */}
      <div 
        className="w-full relative overflow-hidden rounded-t-none rounded-b-[42px] pt-4 pb-10 px-4 text-white shadow-xl flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #d31a1a 0%, #a20f0f 50%, #830404 100%)',
        }}
      >
        {/* Decorative background visual sparkles */}
        <div className="absolute top-[-30px] right-[-30px] w-36 h-36 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10px] left-[-20px] w-24 h-24 rounded-full bg-black/25 blur-xl pointer-events-none" />

        {/* Back navigation & sound toggle at the very top of the curved red banner */}
        <div className="w-full flex items-center justify-between z-10 mb-3.5">
          <button 
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-rose-100 hover:text-white bg-black/35 px-3 py-1.5 rounded-full border border-white/10 transition cursor-pointer active:scale-95 shadow-sm"
          >
            <ChevronLeft className="h-4 w-4 stroke-[3]" />
            {selectedLang === 'en' ? 'Back to Lobby' : 'लॉबी में वापस'}
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-xs font-black tracking-widest uppercase font-sans text-[#ffd275]">
              {selectedLang === 'en' ? 'Mines Play' : 'माइन खेलें'}
            </h1>
            <button
              onClick={() => setSoundEnabled(prev => !prev)}
              className="p-1.5 rounded-full bg-black/35 hover:bg-black/50 border border-white/10 transition text-rose-100"
              title={soundEnabled ? "Mute" : "Unmute"}
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5 stroke-[2.5]" /> : <VolumeX className="h-3.5 w-3.5 opacity-60 stroke-[2.5]" />}
            </button>
          </div>
        </div>

        {/* Profile Layout representing same layout as home profile section */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-3.5">
            {/* Avatar with dynamic ring glow */}
            <div className="relative group transition-all">
              <img
                src={avatar}
                alt="User avatar"
                className="h-15 w-15 rounded-full object-cover border-2 border-white/90 shadow-md grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 rounded-full border-2 border-[#a20f0f] animate-pulse" />
            </div>

            {/* UID & Name Text */}
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
                      value={localNickname}
                      onChange={(e) => {
                        const nextVal = e.target.value.slice(0, 15);
                        setLocalNickname(nextVal);
                        if (setNickname) setNickname(nextVal);
                      }}
                      className="bg-transparent text-white text-xs font-black outline-none px-1 py-0.5 w-24"
                      placeholder={t.editPlaceholder}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setIsEditingNickname(false)}
                      className="p-0.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="text-[14px] font-black tracking-wide text-white drop-shadow-sm truncate max-w-[150px]">
                      {localNickname}
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
            <div className="relative flex items-center justify-center">
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
                0
              </span>
            </div>
            <div className="mt-[-8px] z-10 bg-gradient-to-r from-[#d99494] via-[#f1d0d0] to-[#d99494] rounded-full px-5 py-0.5 text-[10px] font-black uppercase text-rose-950 shadow-md border border-neutral-100/30 scale-90">
              VIP0
            </div>
          </div>
        </div>

        {/* Absolute subtle temporary toast */}
        {copiedActive && (
          <div className="mt-3 bg-black/75 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-emerald-400 font-bold self-center animate-bounce">
            {t.copiedMsg}
          </div>
        )}
      </div>

      {/* 2. Overlapping Balance Card Container shaped precisely like the home tab */}
      <div className="px-4 mt-[-24px] z-25 relative select-none">
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
                setBalance((b) => b + 500);
              }}
              className="flex flex-col items-center gap-1 group active:scale-95 transition cursor-pointer bg-transparent border-none outline-none"
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
                if (balance >= 100) setBalance((b) => b - 100);
              }}
              className="flex flex-col items-center gap-1 group active:scale-95 transition cursor-pointer bg-transparent border-none outline-none"
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

      {/* 3. Embedded Metallic Blue Styled Game Container */}
      <div className="w-full bg-gradient-to-b from-[#026ada] via-[#004fb0] to-[#003682] p-4 text-white flex-1 flex flex-col items-center mt-4 rounded-t-[32px]">

        {/* GAME TITLE HEADER */}
        <h2 className="text-xl font-black tracking-widest text-white uppercase text-center mt-2 mb-3 font-sans">
          MINES
        </h2>

        {/* TOP ROW: Game ID dropdown + Next Multiply capsule pill */}
        <div className="w-full max-w-[370px] flex items-center justify-between gap-2 mb-4 select-none">
          
          {/* Game ID Selector Dropdown */}
          <div className="relative flex-1">
            <select
              value={activeGameId}
              onChange={(e) => {
                if (gameState !== 'playing') {
                  setActiveGameId(e.target.value);
                }
              }}
              disabled={gameState === 'playing'}
              className="w-full px-3 py-1.5 text-[11px] font-black text-sky-200 bg-[#0051b4] rounded-lg border border-[#1b76df]/50 outline-none cursor-pointer appearance-none flex items-center justify-between focus:ring-1 focus:ring-sky-400/50 disabled:opacity-85"
            >
              <option value={activeGameId}>Game ID: {activeGameId.substring(0, 16)}...</option>
              <option value="TCL6261788670669">Game ID: TCL6261788670669...</option>
              <option value="TCL6261543892011">Game ID: TCL6261543892011...</option>
              <option value="TCL6261230491823">Game ID: TCL6261230491823...</option>
            </select>
            <div className="absolute right-2.5 top-2.5 pointer-events-none text-sky-300">
              <ChevronDown className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Next Multiplier Yellow Pill Capsule */}
          <div 
            className="px-3 py-1.5 text-[11px] font-black uppercase text-neutral-900 bg-[#ffbc0d] rounded-full flex items-center justify-center shadow-[0_3px_10px_rgba(255,188,13,0.35)] cursor-default select-none tracking-wide"
            title="Estimated payout value for next correct tile selection"
          >
            {selectedLang === 'en' ? 'Next' : 'अगला'}: {(betAmount * nextMultiplier).toFixed(2)} INR
          </div>
        </div>

        {/* White neon division line */}
        <div className="w-full max-w-[370px] h-[1px] bg-sky-200/20 mb-6" />

        {/* 3. 5x5 MINES CELL PLAY CANVAS */}
        <div className="w-full max-w-[370px] aspect-square bg-[#013576]/90 border border-[#1457ad]/35 rounded-2xl p-4.5 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),0_10px_30px_rgba(0,0,0,0.5)] relative mb-6">
          
          {/* Unopened standard game modal overlay */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#00173c]/80 backdrop-blur-xs rounded-2xl p-6 text-center select-none">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="mb-3"
              >
                <Star className="h-12 w-12 text-[#ffbc0d] fill-[#ffbc0d] filter drop-shadow-[0_0_12px_rgba(255,188,13,0.6)]" />
              </motion.div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider">
                {selectedLang === 'en' ? 'PLACE YOUR BET TO PLAY' : 'सट्टा लगाकर शुरू करें'}
              </h4>
              <p className="text-[10px] text-sky-200/70 font-semibold mt-1 max-w-[240px] leading-relaxed">
                {selectedLang === 'en' 
                  ? 'Set your preferred bet amount below, select the number of mines and trigger "BET" to enter.' 
                  : 'नीचे अपना सट्टा चुनें, माइन की संख्या चुनें और खेलने के लिए BET बटन दबाएं।'}
              </p>
            </div>
          )}

          {/* Victory Clear Winner Banner Overlay */}
          {(gameState === 'won' || gameState === 'lost') && (
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between p-3.5 bg-[#001e3d] border-2 border-[#1660bd] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">
                  {gameState === 'won' ? '⭐' : '💥'}
                </span>
                <div className="text-left leading-none">
                  <span className="block text-xs font-black uppercase tracking-wider text-white">
                    {gameState === 'won' 
                      ? (selectedLang === 'en' ? 'Victory Clear' : 'शुद्ध विजय') 
                      : (selectedLang === 'en' ? 'Detonation Loss' : 'खेल समाप्त')}
                  </span>
                  <span className="text-[10px] font-bold text-sky-200/80 mt-1 block font-sans">
                    {gameState === 'won'
                      ? (selectedLang === 'en' ? `Secured ₹${(betAmount * currentMultiplier).toFixed(2)}!` : `जीते ₹${(betAmount * currentMultiplier).toFixed(2)}!`)
                      : (selectedLang === 'en' ? 'Mine triggered. Bet lost!' : 'माइन फटा। सट्टा राशि खो गई!')}
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setGameState('idle');
                  setRevealedCount(0);
                  setGrid(generateEmptyGrid());
                }}
                className="px-3.5 py-2 rounded-lg bg-[#ffbc0d] text-neutral-900 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer active:scale-95 transition shadow-lg border border-white/20 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3 stroke-[3]" />
                {selectedLang === 'en' ? 'REPLAY' : 'रीप्ले'}
              </button>
            </div>
          )}

          {/* Actual 5x5 grid alignment */}
          <div className="grid grid-cols-5 grid-rows-5 gap-2.5 w-full h-full">
            {grid.map((cell) => {
              let cellVisualClass = "bg-[#0c59b2] border-[#1b76df]/50 hover:bg-[#1266c8] shadow-[inset_0_2px_4px_rgba(255,255,255,0.2),inset_0_-4px_0_#07448e,0_4px_8px_rgba(0,0,0,0.35)]";
              let iconToRender = null;
              
              // Unopened center blue dot representation
              let showBlueDot = !cell.isRevealed;

              if (cell.isRevealed) {
                showBlueDot = false;
                if (cell.isMine) {
                  if (cell.clickedByPlayer) {
                    // Exploded / detonation click by player
                    cellVisualClass = "bg-gradient-to-b from-[#ff5151] to-[#c61f1f] border-[#ff9191] shadow-[inset_0_2px_3px_rgba(255,255,255,0.3),inset_0_-4px_0_#8b0e0e,0_4px_10px_rgba(239,68,68,0.55)] animate-shake";
                    iconToRender = <span className="text-2xl filter drop-shadow-md">💥</span>;
                  } else {
                    // Safe unclicked mine disclosed at the end
                    cellVisualClass = "bg-[#023166] border-[#0c498d]/40 shadow-[inset_0_-3px_0_#012046,0_3px_5px_rgba(0,0,0,0.25)] opacity-90";
                    iconToRender = <span className="text-xl filter drop-shadow-md">💣</span>;
                  }
                } else {
                  if (cell.clickedByPlayer) {
                    // Safe clicked gold star cell
                    cellVisualClass = "bg-gradient-to-b from-[#ffb50d] via-[#f08e00] to-[#d38300] border-[#ffe28a]/40 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),inset_0_-4px_0_#a86000,0_4px_8px_rgba(0,0,0,0.25)]";
                    iconToRender = <Star className="h-7 w-7 text-white fill-white filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />;
                  } else {
                    // Safe remaining gemstone unclicked revealed at the end
                    cellVisualClass = "bg-[#0f4d8e] border-[#1f6dc0]/50 shadow-[inset_0_-3px_0_#08386b,0_3px_5px_rgba(0,0,0,0.2)] opacity-80 animate-pulse";
                    iconToRender = <Star className="h-5 w-5 text-sky-200 fill-sky-200" />;
                  }
                }
              }

              return (
                <button
                  key={cell.id}
                  type="button"
                  disabled={gameState !== 'playing' || cell.isRevealed}
                  onClick={() => handleCellClick(cell.id)}
                  className={`aspect-square border rounded-xl flex items-center justify-center transition active:scale-95 duration-100 relative ${cellVisualClass} cursor-pointer disabled:cursor-default`}
                >
                  {/* Small dark blue reflective center indicator dot */}
                  {showBlueDot && (
                    <div className="w-3.5 h-3.5 rounded-full bg-[#1875e5] opacity-90 shadow-[0_0_8px_#1875e5] flex items-center justify-center" />
                  )}
                  
                  {cell.isRevealed && iconToRender}
                </button>
              );
            })}
          </div>

        </div>

        {/* 4. CONTROL BAR (RANDOM - AUTO GAME SWITCH - MINES DROPDOWN) */}
        <div className="w-full max-w-[370px] flex items-center justify-between gap-2.5 mb-6 relative select-none">
          
          {/* Random choice trigger */}
          <button
            type="button"
            disabled={gameState !== 'playing'}
            onClick={selectRandomCell}
            className="flex-1 bg-gradient-to-b from-[#1b7cdd] to-[#044ba9] hover:from-[#2e90f2] hover:to-[#085bc7] border border-[#2f92f5]/40 text-white font-extrabold text-[10px] tracking-wider uppercase rounded-full py-2 cursor-pointer shadow-md active:scale-95 disabled:opacity-40 transition-all"
          >
            {selectedLang === 'en' ? 'RANDOM' : 'यादृच्छिक'}
          </button>

          {/* Auto Game Switch Toggle */}
          <div className="flex items-center gap-1.5 bg-[#00173c]/35 px-2.5 py-1.5 rounded-full border border-sky-400/15">
            <span className="text-[9.5px] font-black text-sky-200 font-sans tracking-wide uppercase">
              {selectedLang === 'en' ? 'Auto Game' : 'ऑटो गेम'}
            </span>
            <div 
              onClick={() => {
                if (gameState !== 'playing') {
                  setAutoGameEnabled(prev => !prev);
                }
              }}
              className={`w-9 h-5.5 rounded-full relative p-0.5 cursor-pointer border transition-all duration-250 ${
                autoGameEnabled 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-400' 
                  : 'bg-black/45 border-white/10'
              } ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div 
                className={`w-4.5 h-4.5 rounded-full bg-white shadow-md transform transition-transform duration-200 ${
                  autoGameEnabled ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Mines Count selection dropdown card trigger wrapper */}
          <div className="relative">
            <button
              type="button"
              disabled={gameState === 'playing'}
              onClick={() => setIsMinesDropdownOpen(prev => !prev)}
              className="px-3.5 py-2 bg-gradient-to-b from-[#1b7cdd] to-[#044ba9] border border-[#2f92f5]/40 text-white font-extrabold text-[10.5px] tracking-wide rounded-full cursor-pointer shadow-md select-none flex items-center gap-1 disabled:opacity-40"
            >
              💣 {selectedLang === 'en' ? `Mines: ${minesCount}` : `माइन: ${minesCount}`} <ChevronDown className="h-3 w-3 stroke-[2.5]" />
            </button>

            {/* Custom overlay options list stack */}
            <AnimatePresence>
              {isMinesDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-[#052d5e]/95 backdrop-blur-md border-2 border-[#1456a3]/60 rounded-xl p-1 shadow-2xl space-y-1 w-28 absolute bottom-12 right-0 z-30 flex flex-col max-h-[160px] overflow-y-auto scrollbar-none"
                >
                  {[1, 2, 3, 5, 10, 15, 20, 24].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setMinesCount(num);
                        setIsMinesDropdownOpen(false);
                      }}
                      className={`w-full py-1.5 text-center text-[10.5px] font-black uppercase rounded-lg transition-all ${
                        minesCount === num 
                          ? 'bg-gradient-to-r from-sky-500 to-[#1b7cdd] text-white font-black' 
                          : 'text-sky-100 hover:bg-[#1266c8]/30 hover:text-white'
                      }`}
                    >
                      {num} {selectedLang === 'en' ? 'Mines' : 'माइन'}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* 5. METALLIC DEEP INNER BET PANEL SETUP BOX */}
        <div className="w-full max-w-[370px] bg-gradient-to-b from-[#013576]/90 to-[#00224d]/95 border border-[#1457ad]/35 rounded-[22px] p-4.5 shadow-[0_12px_28px_rgba(0,0,0,0.65)] flex flex-col gap-4 select-none relative">
          
          {/* Row 1: Digit Input area + Adjustments row (- stacking, +, coins stack) */}
          <div className="flex items-center justify-between gap-3">
            
            {/* Embedded Bet numerical field */}
            <div className="flex-1 bg-[#00173c]/85 border border-[#1456a3]/50 hover:border-[#1e7fff]/50 rounded-xl px-3.5 py-1.5 flex flex-col text-left focus-within:border-sky-400 focus-within:shadow-[0_0_8px_rgba(56,189,248,0.25)] transition-all">
              <span className="text-[10px] uppercase tracking-wider text-sky-300/80 font-black mb-0.5">
                {selectedLang === 'en' ? 'Bet' : 'सट्टा राशि'}
              </span>
              <div className="flex items-center justify-between">
                <input
                  type="number"
                  step="0.01"
                  value={betInput}
                  disabled={gameState === 'playing'}
                  onChange={(e) => handleManualBetChange(e.target.value)}
                  onBlur={handleInputBlur}
                  className="w-full bg-transparent border-none outline-none font-bold text-sm text-white focus:ring-0 p-0"
                />
                <span className="text-[10.5px] font-black text-sky-100/90 font-mono ml-1">
                  INR
                </span>
              </div>
            </div>

            {/* Circular Adjusters */}
            <div className="flex items-center gap-1.5">
              
              {/* Minus adjuster */}
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={halfBet}
                className="w-9 h-9 rounded-full bg-[#0351ad] hover:bg-[#0563d1] transition flex items-center justify-center font-extrabold text-[#ffffff] shadow-md border border-[#1a6de0]/30 active:scale-95 disabled:opacity-40"
                title="Half bet amount (1/2)"
              >
                —
              </button>

              {/* Stack adjustment coin shortcut preset */}
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={() => updateBetAmount(50.00)}
                className="w-9 h-9 rounded-full bg-[#0351ad] hover:bg-[#0563d1] transition flex flex-col items-center justify-center outline-none border border-[#1a6de0]/30 shadow-md text-[10px] font-black text-amber-300 active:scale-95 disabled:opacity-40"
                title="Quick preset ₹50.00"
              >
                <span>🪙</span>
              </button>

              {/* Plus adjuster */}
              <button
                type="button"
                disabled={gameState === 'playing'}
                onClick={doubleBet}
                className="w-9 h-9 rounded-full bg-[#0351ad] hover:bg-[#0563d1] transition flex items-center justify-center font-extrabold text-[#ffffff] shadow-md border border-[#1a6de0]/30 active:scale-95 disabled:opacity-40"
                title="Double bet amount (2x)"
              >
                +
              </button>

            </div>

          </div>

          {/* Row 2: Secondary reload and the Giant green play/cashout */}
          <div className="flex items-center gap-3">
            
            {/* Round reload exchange preset button */}
            <button
              type="button"
              onClick={() => {
                if (gameState !== 'playing') {
                  updateBetAmount(10.00);
                  setNotification({
                    type: 'info',
                    text: selectedLang === 'en' ? 'Reset bet to standard ₹10.00' : 'मानक राशि ₹10.00 पुनर्स्थापित'
                  });
                }
              }}
              disabled={gameState === 'playing'}
              className="w-12 h-11.5 rounded-2xl bg-gradient-to-tr from-[#024ea4] to-[#0a72ed] hover:from-[#0a72ed] hover:to-[#2289ff] transition flex items-center justify-center border border-[#1e7fff]/50 text-white shadow-lg active:scale-95 disabled:opacity-40 cursor-pointer"
              title="Reset bet to ₹10"
            >
              <RefreshCw className="h-5 w-5 stroke-[2.5]" />
            </button>

            {/* Giant Glossy Green Play/Cashout Pillar */}
            {gameState !== 'playing' ? (
              <button
                type="button"
                onClick={handleStartGame}
                className="flex-1 py-3 bg-gradient-to-b from-[#72c219] via-[#5fa312] to-[#3e6f05] border border-[#83db1f]/50 hover:brightness-110 active:scale-98 text-white font-black text-base tracking-widest uppercase rounded-2xl flex items-center justify-center gap-2.5 shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_6px_16px_rgba(61,114,4,0.45)] transition cursor-pointer"
              >
                {/* Glossy white play triangle */}
                <div className="w-5 h-5 flex items-center justify-center bg-white text-[#437b04] rounded-full text-[9px] pl-0.5 shadow-md">
                  ▶
                </div>
                <span>{selectedLang === 'en' ? 'BET' : 'सट्टा लगाएं'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleCashOut}
                disabled={revealedCount === 0}
                className={`flex-1 py-2.5 border rounded-2xl text-white font-black tracking-widest uppercase flex flex-col items-center justify-center transition shadow-lg ${
                  revealedCount > 0 
                    ? 'bg-gradient-to-b from-[#72c219] via-[#5fa312] to-[#3e6f05] border-[#83db1f]/50 hover:brightness-110 active:scale-98 cursor-pointer shadow-[inset_0_2px_4px_rgba(255,255,255,0.45),0_6px_16px_rgba(61,114,4,0.45)]' 
                    : 'bg-neutral-900/60 border-white/5 text-neutral-500 cursor-not-allowed opacity-60'
                }`}
              >
                <span className="text-sm font-black tracking-widest">
                  {selectedLang === 'en' ? 'CASH OUT' : 'कैश आउट'}
                </span>
                {revealedCount > 0 && (
                  <span className="text-[10px] text-lime-200 mt-0.5 font-bold font-mono tracking-wide">
                    INR {(betAmount * currentMultiplier).toFixed(2)} ({currentMultiplier.toFixed(2)}x)
                  </span>
                )}
              </button>
            )}

          </div>

        </div>

        {/* 6. REALISTIC BOTTOM NAV FOOTER (QUESTION MARK - MONOCHROME WALLET MONOSPACE - HAMBURGER MENU) */}
        <div className="w-full max-w-[370px] bg-[#001c3d] py-2.5 px-3 rounded-2xl mt-4 border border-[#1456a3]/30 flex items-center justify-between select-none shadow-md">
          
          <button 
            onClick={() => {
              setNotification({
                type: 'info',
                text: selectedLang === 'en' 
                  ? 'Goal: Click blue tiles to find gold stars. Choose more mines for massive multipliers!' 
                  : 'लक्ष्य: सोने के सितारे खोजने के लिए टाइलें दबाएं। विशाल लाभ के लिए अधिक माइन चुनें!'
              });
            }}
            className="w-5.5 h-5.5 rounded-full border-2 border-[#ffbc0d] hover:bg-[#ffbc0d]/10 transition flex items-center justify-center text-[#ffbc0d] font-black text-[11px] cursor-pointer"
            title="Help Rulebook"
          >
            ?
          </button>

          <div className="font-mono text-xs font-black text-sky-100 tracking-wide">
            {balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR
          </div>

          <button 
            onClick={() => {
              setNotification({
                type: 'info',
                text: selectedLang === 'en' 
                  ? 'Mines Engine v1.0.6 (High Performance Matrix Server)' 
                  : 'माइन्स इंजन v1.0.6 (उच्च प्रदर्शन सर्वर)'
              });
            }}
            className="text-sky-200 hover:text-white transition cursor-pointer leading-none text-base font-black px-1"
            title="Menu Stats"
          >
            ☰
          </button>

        </div>

      </div>

      {/* Floating alert notifications block inside background scope */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 text-center text-xs font-black rounded-full border flex items-center justify-center gap-2 shadow-xl ${
              notification.type === 'error' 
                ? 'bg-red-500 text-white border-red-600 shadow-red-500/20' 
                : notification.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-600 shadow-emerald-500/20'
                : 'bg-[#ffbc0d] text-neutral-900 border-[#d38300]/50 font-sans shadow-amber-500/10'
            }`}
          >
            {notification.type === 'error' ? '🚫' : '✨'}
            {notification.text}
          </motion.div>
        )}
      </AnimatePresence>



    </div>
  );
}
