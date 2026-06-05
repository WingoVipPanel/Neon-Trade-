import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  HelpCircle,
  FileText,
  ChevronLeft,
  Volume2,
  VolumeX,
  Sparkles,
  Crown,
} from "lucide-react";
import confetti from "canvas-confetti";

interface InviteWheelViewProps {
  selectedLang: string;
  onBack?: () => void;
  balance: number;
  setBalance: React.Dispatch<React.SetStateAction<number>>;
  setLobbyToast: React.Dispatch<
    React.SetStateAction<{
      type: "success" | "error" | "info";
      text: string;
    } | null>
  >;
  nickname: string;
  avatar: string;
  totalDeposits: number;
  inviteeDepositCount: number;
  usedSpins: number;
  onSpinUsed: () => void;
  uid: string;
}

const PRIZES = [
  { id: 1, label: "₹0-10", value: 5, prob: 30 },
  { id: 2, label: "₹27", value: 27, prob: 25 },
  { id: 3, label: "₹57", value: 57, prob: 20 },
  { id: 4, label: "₹500", value: 500, prob: 2 },
  { id: 5, label: "₹377", value: 377, prob: 3 },
  { id: 6, label: "₹77", value: 77, prob: 10 },
  { id: 7, label: "₹87", value: 87, prob: 7 },
  { id: 8, label: "₹177", value: 177, prob: 3 },
];

export default function InviteWheelView({
  selectedLang,
  onBack,
  balance,
  setBalance,
  setLobbyToast,
  nickname,
  avatar,
  totalDeposits,
  inviteeDepositCount,
  usedSpins,
  onSpinUsed,
  uid,
}: InviteWheelViewProps) {
  const spinsLeft = Math.max(0, inviteeDepositCount - usedSpins);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [totalSpins, setTotalSpins] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientType, setInsufficientType] = useState<"spin" | "cashout">(
    "cashout",
  );
  const [wonAmount, setWonAmount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [rewardWallet, setRewardWallet] = useState(0);
  const [spinHistory, setSpinHistory] = useState<
    { id: number; user: string; amount: number; time: string; isYou: boolean }[]
  >([]);

  const unlockTarget = 500;

  const handleCashOut = () => {
    if (rewardWallet >= unlockTarget) {
      setBalance((prev) => prev + rewardWallet);
      setRewardWallet(0);
      setLobbyToast({
        type: "success",
        text:
          selectedLang === "en" ? "Cash out successful!" : "निकालना सफल रहा!",
      });
    } else {
      setInsufficientType("cashout");
      setShowInsufficientModal(true);
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
    spinAudioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3",
    );
    winAudioRef.current = new Audio(
      "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
    );

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
      setLobbyToast({
        type: "error",
        text:
          selectedLang === "en"
            ? "Spin is locked! Deposit ₹200 to unlock."
            : "स्पिन लॉक है! अनलॉक करने के लिए ₹200 जमा करें।",
      });
      return;
    }
    if (spinsLeft <= 0) {
      setInsufficientType("spin");
      setShowInsufficientModal(true);
      return;
    }
    if (isSpinning) return;

    // Trigger vibration if supported
    if (navigator.vibrate) navigator.vibrate(50);

    setIsSpinning(true);
    onSpinUsed();

    // Determine Result
    const isFirstSpin = totalSpins === 0;
    const targetPrizeIndex = getPrizeIndex(isFirstSpin);

    // Calculate rotation with easing duration 0.1 seconds
    const sliceAngle = 360 / PRIZES.length;
    // Align so pointer stops exactly at the center of the target slice
    const stopAngle = targetPrizeIndex * sliceAngle + sliceAngle / 2;
    const finalRotation = rotation - (rotation % 360) - stopAngle;

    setRotation(finalRotation);

    setTimeout(() => {
      // Wheel finished spinning
      setIsSpinning(false);
      setTotalSpins((prev) => prev + 1);

      const prize = PRIZES[targetPrizeIndex];
      setWonAmount(prize.value);

      // Vibration pattern for win
      if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);

      setShowPopup(true);
      // Fire Confetti!
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 100,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#ffbb0d", "#f44336", "#4CAF50"],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#ffbb0d", "#f44336", "#4CAF50"],
        });
      }, 250);

      // Add reward to the wheel's wallet
      setRewardWallet((prev) => prev + prize.value);

      // Get formatted date/time like 2026-05-24 15:46:27
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

      // Add to history
      setSpinHistory((prev) =>
        [
          {
            id: Date.now(),
            user: nickname,
            amount: prize.value,
            time: formattedDate,
            isYou: true,
          },
          ...prev,
        ].slice(0, 15),
      ); // Keep last 15
    }, 200); // Instant result feedback duration replaced 7000ms
  };

  const handleInvite = () => {
    // Just copy link, don't give fake spins
    navigator.clipboard.writeText(`https://neon-trade.vercel.app?ref=${uid}`);
    setLobbyToast({
      type: "success",
      text:
        selectedLang === "en"
          ? "Referral link copied!"
          : "रेफरल लिंक कॉपी किया गया!",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col font-sans relative bg-[#120102] text-white"
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
          0%, 100% { background-color: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff, inset 0 -2px 4px rgba(0,0,0,0.5); }
          50% { background-color: #ffd040; box-shadow: 0 0 5px #ffd040, inset 0 -1px 2px rgba(0,0,0,0.4); opacity: 0.8; }
        }
        @keyframes led-glow-even {
          0%, 100% { background-color: #ffd040; box-shadow: 0 0 5px #ffd040, inset 0 -1px 2px rgba(0,0,0,0.4); opacity: 0.8; }
          50% { background-color: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #ffffff, inset 0 -2px 4px rgba(0,0,0,0.5); }
        }
        .bulb-odd {
          animation: led-glow-odd 1s infinite ease-in-out;
        }
        .bulb-even {
          animation: led-glow-even 1s infinite ease-in-out;
        }
      `}</style>

      {/* Radiant Glow Behind the text */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[60%] h-[20%] bg-gradient-radial from-white/10 to-transparent blur-3xl z-0 pointer-events-none" />

      {/* Sunburst Background Match */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `repeating-conic-gradient(from 0deg, #1e0506 0deg 8deg, #120102 8deg 16deg)`,
        }}
      />

      {/* Gradient fades overlay for the background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#120102] via-transparent to-transparent z-0 pointer-events-none opacity-80" />
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#120102] via-[#120102] to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 z-0 pointer-events-none opacity-50" />

      {/* Sparkling stars decorative overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[15%] left-[10%] w-3 h-3 bg-white rounded-full blur-[1px] shadow-[0_0_15px_10px_rgba(255,255,255,0.4)]"
          style={{
            clipPath:
              "polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)",
          }}
        />
        <div
          className="absolute top-[25%] right-[15%] w-4 h-4 bg-white rounded-full blur-[1px] shadow-[0_0_20px_10px_rgba(255,255,255,0.4)]"
          style={{
            clipPath:
              "polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)",
          }}
        />
        <div
          className="absolute top-[45%] left-[5%] w-2 h-2 bg-white rounded-full blur-[1px] shadow-[0_0_10px_8px_rgba(255,255,255,0.3)]"
          style={{
            clipPath:
              "polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)",
          }}
        />
        <div
          className="absolute top-[50%] right-[8%] w-3 h-3 bg-white rounded-full blur-[1px] shadow-[0_0_15px_10px_rgba(255,255,255,0.4)]"
          style={{
            clipPath:
              "polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)",
          }}
        />
        <div
          className="absolute bottom-[25%] left-[20%] w-4 h-4 bg-white rounded-full blur-[1px] shadow-[0_0_20px_10px_rgba(255,255,255,0.4)]"
          style={{
            clipPath:
              "polygon(50% 0%, 55% 45%, 100% 50%, 55% 55%, 50% 100%, 45% 55%, 0% 50%, 45% 45%)",
          }}
        />
      </div>

      {/* Elegant Radial Shine Backdrop Behind the Wheel */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-radial from-[#ff8d00]/10 via-[#ff3b2f]/0 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Header */}
      <div className="sticky top-0 z-30 flex items-center justify-between p-4 bg-[#1a0506] border-b border-white/5">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors active:scale-95 text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-lg font-medium text-white tracking-wide">
          {selectedLang === "en" ? "Invitation Wheel" : "आमंत्रण व्हील"}
        </div>
        <div className="flex items-center gap-4 text-[#ef5350]">
          <HelpCircle className="w-[22px] h-[22px] cursor-pointer" />
          <FileText className="w-[22px] h-[22px] cursor-pointer" />
        </div>
      </div>

      <div className="flex flex-col items-center w-full px-4 pt-6 pb-2 relative z-10">
        {/* VIP Golden Wallet/Balance Card */}
        <div className="w-full flex flex-col items-center relative z-20 mb-4 mt-2">
          <div className="text-white/50 font-normal tracking-wide text-[11px] mb-0.5 font-sans select-none uppercase">
            {selectedLang === "en" ? "my amount(187:11:21)" : "मेरी राशि(187:11:21)"}
          </div>

          <div className="flex items-center gap-0.5 mb-2.5">
            <span className="text-xl font-bold text-[#ffb74d] drop-shadow-md">
              ₹
            </span>
            <span className="text-3xl font-black tracking-wide text-[#ffb74d] drop-shadow-[0_2px_8px_rgba(255,183,77,0.4)]">
              {rewardWallet.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleCashOut}
            className="px-6 py-1.5 bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] hover:from-[#e53935] hover:to-[#c62828] text-white font-extrabold rounded-full text-xs uppercase tracking-wider shadow-[0_3px_10px_rgba(211,47,47,0.4),inset_0_-1.5px_0_rgba(0,0,0,0.2)] active:scale-95 transition-all cursor-pointer border border-[#ff6b6b]/20"
          >
            {selectedLang === "en" ? "CASH OUT" : "कैश आउट"}
          </button>
        </div>

        {/* Spinner Frame Container */}
        <div className="relative mt-2 mb-6 flex justify-center items-center w-[270px] h-[270px] z-10 shrink-0 drop-shadow-[0_12px_30px_rgba(0,0,0,0.8)]">
          {/* Wheel Outer Gold Border */}
          <div className="absolute inset-[-12px] rounded-full border-[6px] border-[#ffca28] bg-gradient-to-b from-[#ffca28] via-[#ffa000] to-[#ff8f00] shadow-[0_0_20px_rgba(255,202,40,0.45),inset_0_3px_8px_rgba(0,0,0,0.5)] z-0" />
          <div className="absolute inset-[-5px] rounded-full border-[3px] border-[#ffe082] z-0" />

          {/* Wheel Red Ring with Dots */}
          <div className="absolute inset-0 rounded-full flex items-center justify-center p-[14px] z-10 bg-[#e53935] border-2 border-white/20 shadow-inner">
            {/* Outer Border Dots with flashing LED chase animation */}
            <div className="absolute inset-0 rounded-full pointer-events-none">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={`border-dot-${i}`}
                  className={`absolute w-[8px] h-[8px] rounded-full shadow-sm ${i % 2 === 0 ? "bulb-odd" : "bulb-even"}`}
                  style={{
                    top: "50%",
                    left: "50%",
                    transform: `translate(-50%, -50%) rotate(${i * 15}deg) translateY(-124px)`,
                  }}
                />
              ))}
            </div>

            {/* The Spinning Wheel Slices */}
            <motion.div
              className="w-full h-full relative border-[5px] border-[#ffcc00] rounded-full overflow-hidden shadow-[inset_0_4px_15px_rgba(0,0,0,0.7)] bg-[#1e0a0b]"
              animate={{ rotate: rotation }}
              transition={{
                duration: 0.1,
                type: "tween",
                ease: "linear",
              }}
            >
              {/* Shine glow reflection sweep while spinning */}
              <AnimatePresence>
                {isSpinning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4, rotate: -rotation }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.1, ease: "linear" }}
                    className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,255,255,0.35)_45deg,transparent_90deg)] z-20 pointer-events-none"
                  />
                )}
              </AnimatePresence>

              {/* Slices Conic Gradient Background */}
              <div
                className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]"
                style={{
                  background: `conic-gradient(
                       #ffffff 0deg 45deg, 
                       #ffe082 45deg 90deg, 
                       #ffffff 90deg 135deg, 
                       #ffe082 135deg 180deg, 
                       #ffffff 180deg 225deg, 
                       #ffe082 225deg 270deg, 
                       #ffffff 270deg 315deg, 
                       #ffe082 315deg 360deg)`,
                }}
              />

              {/* Slice Borders & Text */}
              {PRIZES.map((prize, index) => {
                const sliceAngle = 360 / PRIZES.length;
                // Correct rotation so the middle of the top of the slice points outward
                const textRotation = index * sliceAngle + sliceAngle / 2;
                const isYellowSlice = index % 2 === 1;

                return (
                  <div
                    key={prize.id}
                    className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start pointer-events-none"
                    style={{
                      transform: `rotate(${textRotation}deg)`,
                      transformOrigin: "50% 50%",
                      paddingTop: "16px",
                    }}
                  >
                    <span
                      className="font-bold text-[15px] font-sans tracking-wide drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)] text-[#d84315]"
                    >
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
                    className="absolute w-[6px] h-[50%] bg-gradient-to-b from-[#ffea00] to-[#f57f17] origin-bottom shadow-[0_0_8px_#ffea00]"
                    style={{
                      left: "50%",
                      top: "0",
                      marginLeft: "-3px",
                      transform: `rotate(${index * sliceAngle}deg)`,
                    }}
                  />
                );
              })}
            </motion.div>

            {/* Center Play Button Cap */}
            <button
              onClick={handleSpin}
              disabled={isSpinning}
              className="absolute w-[80px] h-[80px] rounded-full z-20 flex flex-col items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.5),inset_0_-3px_6px_rgba(0,0,0,0.1),inset_0_3px_6px_rgba(255,255,255,0.8)] border-[5px] border-[#e53935] bg-gradient-to-b from-[#fff8e1] to-[#ffe082] cursor-pointer active:scale-95 transition-transform hover:brightness-105"
            >
              {/* Inner ring */}
              <div className="absolute inset-0 rounded-full border-[1.5px] border-[#ffca28] m-[2px] pointer-events-none" />

              <span className="text-[#e53935] font-black text-[26px] leading-none drop-shadow-[0_1px_1px_rgba(229,57,53,0.3)] mt-1 z-10">
                X{spinsLeft}
              </span>
              <span className="text-[#e53935] font-black text-[8px] mt-0.5 tracking-wide uppercase whitespace-nowrap opacity-95 pb-0.5 z-10">
                {selectedLang === "en" ? "FREE SPIN" : "फ्री स्पिन"}
              </span>
            </button>
          </div>

          {/* Highlight Sector Overlay acting as Pointer at the top slice */}
          <div
            className="absolute z-20 pointer-events-none flex justify-center items-start"
            style={{
              top: "-12px",
              left: "50%",
              transform: "translateX(-50%)",
              height: "58%", // slightly more than half to reach center
              width: "110px", // width wide enough to cover the 45deg slice at outer edge
            }}
          >
            <div
              className="w-full h-full border-[5px] border-[#ffca28] bg-[#fff8e1]/30"
              style={{
                clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
              }}
            />
            {/* White overlay inner borders for the glossy look */}
            <div
              className="absolute top-[5px] w-[calc(100%-12px)] h-[calc(100%-6px)] border-[1.5px] border-white/60"
              style={{
                clipPath: "polygon(50% 100%, 0 0, 100% 0)",
              }}
            />
          </div>
        </div>

        {/* Modern RED Pill Invite Button */}
        <button
          id="btn-invite-rewards"
          onClick={handleInvite}
          className="w-[85%] max-w-[300px] py-2.5 bg-gradient-to-r from-[#d32f2f] to-[#b71c1c] hover:from-[#e53935] hover:to-[#c62828] text-white font-extrabold rounded-full text-xs uppercase tracking-wider shadow-[0_3px_10px_rgba(211,47,47,0.4),inset_0_-1.5px_0_rgba(0,0,0,0.2)] active:scale-95 transition-all z-20 cursor-pointer flex items-center justify-center shrink-0 mt-6 border border-[#ff6b6b]/20"
        >
          {selectedLang === "en"
            ? "INVITE FRIENDS FOR REWARDS"
            : "पुरस्कारों के लिए दोस्तों को आमंत्रित करें"}
        </button>

        {/* Remaining Price Counter label text */}
        <p
          id="lbl-remaining-target"
          className="text-white/40 font-medium text-[12px] mt-2 mb-4 text-center z-20 tracking-wide"
        >
          {selectedLang === "en"
            ? `Only ₹${Math.max(0, 500 - rewardWallet).toFixed(2)} left to get prize ₹500.00`
            : `पुरस्कार ₹500.00 प्राप्त करने के लिए केवल ₹${Math.max(0, 500 - rewardWallet).toFixed(2)} शेष हैं`}
        </p>

        {/* User Record History List Container - Clean professional layout */}
        <div
          id="container-record-history"
          className="w-full mt-2 text-left z-20 relative px-1 flex flex-col pb-8"
        >
          <h3
            id="heading-record"
            className="text-white text-[20px] font-bold tracking-wide mb-4"
          >
            {selectedLang === "en" ? "Record" : "इतिहास"}
          </h3>

          {spinHistory.length > 0 ? (
            <div
              id="list-records"
              className="flex flex-col divide-y divide-white/10"
            >
              {spinHistory.map((record, index) => (
                <div
                  id={`record-item-${record.id}-${index}`}
                  key={`${record.id}-${index}`}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover bg-amber-100"
                    />

                    <span className="text-[15px] font-medium text-white/90">
                      {record.user}
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-[#e57373] font-medium text-[15px]">
                      ₹{record.amount.toFixed(2)}
                    </div>
                    <div className="text-white/40 text-[12px]">
                      {record.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              id="empty-records-state"
              className="flex flex-col items-center justify-center py-10 bg-black/15 border border-white/5 rounded-2xl"
            >
              <FileText className="w-10 h-10 text-white/10 mb-2.5" />
              <span className="text-white/40 text-xs font-semibold tracking-wide uppercase">
                {selectedLang === "en" ? "No record" : "कोई रिकॉर्ड नहीं"}
              </span>
            </div>
          )}
        </div>
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
                  {selectedLang === "en" ? "CONGRATULATIONS!" : "बधाई हो!"}
                </p>
                <div className="text-[#ffbb0d] text-2xl font-black drop-shadow-md leading-none flex items-center gap-1.5 mt-0.5">
                  <span className="text-white/80 text-xs font-bold uppercase">
                    {selectedLang === "en" ? "You won" : "आपने जीता"}:
                  </span>{" "}
                  ₹{wonAmount}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Insufficient amount Modal - Precisely as requested by image */}
      <AnimatePresence>
        {showInsufficientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            onClick={() => setShowInsufficientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[85%] max-w-[310px] bg-[#222] rounded-[20px] overflow-hidden shadow-[0_12px_35px_rgba(0,0,0,0.6)] border border-white/5"
            >
              <div className="p-6 flex flex-col items-center text-center">
                <h2 className="text-white text-[17px] font-bold tracking-tight mb-5">
                  {selectedLang === "en"
                    ? "Insufficient amount"
                    : "अपर्याप्त राशि"}
                </h2>

                <p className="text-white/80 text-[13px] font-medium leading-normal mb-6 px-1">
                  {selectedLang === "en"
                    ? `You need ₹${(unlockTarget - rewardWallet).toFixed(2)} more to cash out`
                    : `कैश आउट करने के लिए आपको ₹${(unlockTarget - rewardWallet).toFixed(2)} और चाहिए`}
                </p>

                <button
                  onClick={() => {
                    setShowInsufficientModal(false);
                    handleInvite();
                  }}
                  className="w-full py-2 bg-[#d32f2f] hover:bg-[#e53935] text-white font-bold rounded-full text-[11px] uppercase tracking-wide shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  {selectedLang === "en"
                    ? "INVITE FRIENDS FOR REWARDS"
                    : "पुरस्कारों के लिए दोस्तों को आमंत्रित करें"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
