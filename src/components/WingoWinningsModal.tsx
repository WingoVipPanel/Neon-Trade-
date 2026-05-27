import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

export const WingoWinningsModal = ({ alert, onClose, uid, selectedLang }: any) => {
  const [timeLeft, setTimeLeft] = useState(3);
  const [autoClose, setAutoClose] = useState(true);

  // Use a local state to hold the alert data so we can animate it out even after it turns null in props
  const [localAlert, setLocalAlert] = useState(alert);

  // Stable reference for onClose callback to prevent parent re-renders from resetting the timer
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Track unique alert identifier to reset timer only when a fresh result/period arrives
  const alertId = alert ? `${alert.room}_${alert.period}` : '';

  useEffect(() => {
    if (alert) {
      setLocalAlert(alert);
      setTimeLeft(3); // reset timer
      setAutoClose(true);
    }
  }, [alertId]);

  useEffect(() => {
    if (!autoClose || !alert) return;
    if (timeLeft <= 0) {
      onCloseRef.current();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, autoClose, alert]);

  const isWin = localAlert?.isWin;

  return (
    <AnimatePresence>
      {alert && localAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center auto-events-all bg-black/65 backdrop-blur-[3px]">
          {/* Keyframe Injector */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-7px); }
            }
            @keyframes ticket-slide {
              0% { transform: translateY(-115%); opacity: 0; }
              100% { transform: translateY(0%); opacity: 1; }
            }
            .animate-float-wingo {
              animation: float 2.5s ease-in-out infinite;
            }
            .animate-ticket-slide-wingo {
              animation: ticket-slide 0.8s cubic-bezier(0.19, 1, 0.22, 1) 0.15s forwards;
            }
          `}</style>

          <motion.div 
            key="winnings-modal"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className="relative w-[300px] flex flex-col items-center select-none transform-gpu"
          >
            {/* Confetti Background (Premium and realistic, less quantity, smaller pieces) */}
            {isWin && (
              <div className="absolute inset-0 -top-32 -bottom-32 -left-16 -right-16 pointer-events-none overflow-hidden z-[100]">
                {[...Array(24)].map((_, i) => {
                  const colors = ['bg-[#ff3b3b]', 'bg-[#10b981]', 'bg-[#fbbf24]', 'bg-[#3b82f6]', 'bg-[#a855f7]', 'bg-white'];
                  const color = colors[i % colors.length];
                  const isCircle = i % 3 === 0;
                  const size = 4 + (i % 5); // 4px to 8px
                  return (
                    <motion.div
                      key={i}
                      initial={{ 
                        y: -80 - (i * 12), 
                        x: ((i * 17) % 320) - 160, 
                        opacity: 1, 
                        rotate: i * 15,
                        scale: 0.6 + ((i % 5) * 0.1)
                      }}
                      animate={{ 
                        y: 600, 
                        x: (((i * 17) % 320) - 160) + (i % 2 === 0 ? 40 : -40), 
                        opacity: [1, 1, 0], 
                        rotate: i * 360 
                      }}
                      transition={{ 
                        duration: 2.0 + (i % 3) * 0.5, 
                        repeat: Infinity, 
                        delay: (i % 4) * 0.3,
                        ease: "linear"
                      }}
                      className={`absolute top-0 ${color}`}
                      style={{ 
                        width: isCircle ? size : size * 1.8, 
                        height: size,
                        borderRadius: isCircle ? '50%' : '1px',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Modal Body Container - Slit-down size to look ultra refined and exact on all viewports */}
            <div 
              className={`relative w-[275px] rounded-[30px] mt-[70px] pb-5 flex flex-col items-center z-10 
                ${isWin 
                  ? 'bg-gradient-to-b from-[#ff8163] via-[#ff5447] to-[#f63738] shadow-[0_15px_35px_rgba(246,55,56,0.22)] border-[1.5px] border-[#ff9176]/30' 
                  : 'bg-gradient-to-b from-[#e3f0fd] via-[#c4def1] to-[#a3c7e6] shadow-[0_15px_35px_rgba(163,199,230,0.22)] border-[1.5px] border-white/50'
                }`}
            >
              
              {/* Top Banner Assembly (Wings + Badge Group) - Scaled down for cuter, tight size */}
              <div className="absolute -top-[74px] w-[310px] h-[110px] flex justify-center z-20 pointer-events-none">
                 
                 {/* Single polished Master SVG with Symmetrical structures */}
                 <svg viewBox="0 0 400 200" className="w-[310px] h-[155px] overflow-visible select-none pointer-events-none drop-shadow-xl animate-float-wingo">
                   <defs>
                     {/* Gold gradients */}
                     <linearGradient id="goldOuter" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="#fffefe" />
                       <stop offset="25%" stopColor="#ffe49a" />
                       <stop offset="75%" stopColor="#faa019" />
                       <stop offset="100%" stopColor="#c25a00" />
                     </linearGradient>
                     <linearGradient id="goldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                       <stop offset="0%" stopColor="#ffa51a" />
                       <stop offset="100%" stopColor="#ff7a00" />
                     </linearGradient>
                     <linearGradient id="goldRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="#fff4d4" />
                       <stop offset="45%" stopColor="#ffa53d" />
                       <stop offset="100%" stopColor="#dd3f00" />
                     </linearGradient>
                     <linearGradient id="goldWing" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#ffffff" />
                       <stop offset="100%" stopColor="#ffe9cc" />
                     </linearGradient>

                     {/* Silver gradients */}
                     <linearGradient id="silverOuter" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="#ffffff" />
                       <stop offset="35%" stopColor="#cbdbe9" />
                       <stop offset="75%" stopColor="#92b3cf" />
                       <stop offset="100%" stopColor="#5f81a1" />
                     </linearGradient>
                     <linearGradient id="silverInner" x1="0%" y1="0%" x2="100%" y2="100%">
                       <stop offset="0%" stopColor="#a3c4dc" />
                       <stop offset="100%" stopColor="#759ab7" />
                     </linearGradient>
                     <linearGradient id="silverRibbon" x1="0%" y1="0%" x2="0%" y2="100%">
                       <stop offset="0%" stopColor="#edf5fc" />
                       <stop offset="50%" stopColor="#b4cde2" />
                       <stop offset="100%" stopColor="#7397b8" />
                     </linearGradient>
                     <linearGradient id="silverWing" x1="0%" y1="0%" x2="100%" y2="0%">
                       <stop offset="0%" stopColor="#ffffff" />
                       <stop offset="100%" stopColor="#e3f0fa" />
                     </linearGradient>

                     <filter id="svgShadow" x="-10%" y="-10%" width="120%" height="120%">
                       <feDropShadow dx="0" dy="5" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.32" />
                     </filter>
                   </defs>

                   {/* Left Wing */}
                   <g id="left-wing-grp">
                     {/* Feather 1 */}
                     <path d="M 148 76 C 112 52, 70 62, 52 82 C 48 86, 52 92, 62 90 C 85 86, 122 86, 148 91 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffd0a3" : "#cbdae5"} strokeWidth="1.2" />
                     {/* Feather 2 */}
                     <path d="M 145 91 C 105 77, 62 92, 45 116 C 41 121, 47 127, 55 124 C 76 116, 115 111, 143 111 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffc285" : "#bdcede"} strokeWidth="1.2" />
                     {/* Feather 3 */}
                     <path d="M 143 109 C 110 101, 74 121, 58 145 C 55 150, 61 156, 68 152 C 86 141, 115 133, 141 131 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffa852" : "#a8c0d4"} strokeWidth="1.2" />
                   </g>

                   {/* Right Wing (Symmetric) */}
                   <g id="right-wing-grp" transform="translate(400, 0) scale(-1, 1)">
                     {/* Feather 1 */}
                     <path d="M 148 76 C 112 52, 70 62, 52 82 C 48 86, 52 92, 62 90 C 85 86, 122 86, 148 91 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffd0a3" : "#cbdae5"} strokeWidth="1.2" />
                     {/* Feather 2 */}
                     <path d="M 145 91 C 105 77, 62 92, 45 116 C 41 121, 47 127, 55 124 C 76 116, 115 111, 143 111 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffc285" : "#bdcede"} strokeWidth="1.2" />
                     {/* Feather 3 */}
                     <path d="M 143 109 C 110 101, 74 121, 58 145 C 55 150, 61 156, 68 152 C 86 141, 115 133, 141 131 Z" fill={isWin ? "url(#goldWing)" : "url(#silverWing)"} stroke={isWin ? "#ffa852" : "#a8c0d4"} strokeWidth="1.2" />
                   </g>

                   {/* Side ribbon background connector shading */}
                   <path d="M 115 142 L 95 116 L 140 111 Z" fill={isWin ? "#b23000" : "#455d73"} />
                   <path d="M 285 142 L 305 116 L 260 111 Z" fill={isWin ? "#b23000" : "#455d73"} />

                   {/* Side ribbon swallowtails */}
                   <path d="M 95 116 L 55 125 C 65 142, 75 151, 115 142 Z" fill={isWin ? "url(#goldRibbon)" : "url(#silverRibbon)"} filter="url(#svgShadow)" />
                   <path d="M 305 116 L 345 125 C 335 142, 325 151, 285 142 Z" fill={isWin ? "url(#goldRibbon)" : "url(#silverRibbon)"} filter="url(#svgShadow)" />

                   {/* Golden circular base medal */}
                   <circle cx="200" cy="90" r="54" fill={isWin ? "url(#goldOuter)" : "url(#silverOuter)"} filter="url(#svgShadow)" />
                   <circle cx="200" cy="90" r="48" fill="none" stroke="#ffffff" strokeWidth="2.5" opacity="0.9" />
                   <circle cx="200" cy="90" r="43" fill={isWin ? "url(#goldInner)" : "url(#silverInner)"} />

                   {/* Center alignment: translate(200, 90) centers at cx=200 cy=90. We scale of 0.8, and subtract half width/height (25, 36.5) to align perfectly in center with no offset bias. */}
                   {/* Stylised Premium Rocket Silhouette pointing straight up */}
                   <g transform="translate(200, 90) scale(0.8) translate(-25, -36.5)">
                     {/* White solid fuselage body */}
                     <path d="M25,6 C33,16 34,28 34,44 C34,51 31,56 25,56 C19,56 16,51 16,44 C16,28 17,16 25,6 Z" fill="#ffffff" />
                     {/* Left wing stabilizer */}
                     <path d="M16,36 C11,40 7,44 6,48 C5,51 8,52 13,51 C15,50 16,48 16,46 Z" fill="#ffffff" />
                     {/* Right wing stabilizer */}
                     <path d="M34,36 C39,40 43,44 44,48 C45,51 42,52 37,51 C35,50 34,48 34,46 Z" fill="#ffffff" />
                     {/* Rocket blast booster flame trail */}
                     <path d="M21,57 C21,63 25,67 25,67 C25,67 29,63 29,57 Z" fill={isWin ? "#ffd95a" : "#cbdbe9"} />
                     {/* Round power core badge containing white lightning bolt */}
                     <circle cx="25" cy="31" r="5" fill={isWin ? "#ff7e00" : "#4e6a82"} />
                     <path d="M24.4,27.5 L27,30.5 L24.8,31 L26.2,34.5 L23.6,31.5 L25.2,31 Z" fill="#ffffff" />
                   </g>

                   {/* Premium Front Fold Symmetrical Drapery Ribbon */}
                   <path d="M 125 118 Q 200 84 275 118 L 265 139 Q 200 106 135 139 Z" fill={isWin ? "url(#goldRibbon)" : "url(#silverRibbon)"} filter="url(#svgShadow)" />
                 </svg>
                 
              </div>

              {/* Congratulations/Sorry Header Title */}
              <h2 className={`mt-[48px] text-[25px] font-[900] tracking-normal mb-1 font-sans select-none text-center ${isWin ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]' : 'text-[#506e8b] drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]'}`}>
                {isWin ? 'Congratulations' : 'Sorry'}
              </h2>

              {/* Lottery Result Details */}
              <div className="flex items-center justify-center gap-1.5 mb-3 px-3 w-full">
                 <span className={`text-[11px] font-semibold tracking-wide ${isWin ? 'text-white/85' : 'text-[#6b859e]'}`}>
                    Lottery results
                 </span>
                 <div className="flex items-center gap-1 font-bold text-white text-[10.5px] font-sans">
                    <span className={`px-2 py-0.5 rounded-[4px] shadow-sm flex items-center justify-center ${localAlert.drawColor === 'Red' ? 'bg-[#ff3b3c]' : localAlert.drawColor === 'Green' ? 'bg-[#10b981]' : 'bg-[#a855f7]'}`}>
                        {localAlert.drawColor === 'Red' ? 'Red' : localAlert.drawColor === 'Green' ? 'Green' : 'Violet'}
                    </span>
                    <span className={`w-[18px] h-[18px] rounded-full shadow-sm flex items-center justify-center text-[10px]`} style={{ backgroundColor: localAlert.drawColor === 'Red' ? '#ff3b3c' : localAlert.drawColor === 'Green' ? '#10b981' : '#a855f7' }}>
                        {localAlert.drawNumber}
                    </span>
                    <span className={`px-2 py-0.5 rounded-[4px] shadow-sm flex items-center justify-center ${localAlert.drawColor === 'Red' ? 'bg-[#ff3b3c]' : localAlert.drawColor === 'Green' ? 'bg-[#10b981]' : 'bg-[#a855f7]'}`}>
                        {localAlert.drawSize === 'Big' ? 'Big' : 'Small'}
                    </span>
                 </div>
              </div>

              {/* Authentic 3D Interactive Ticket Slot Component - scaled down nicely */}
              <div className="relative w-full mt-2 flex flex-col items-center">
                {/* LAYER 1: 3D Slot Back Cavity / Bottom Border (z-10) */}
                <div className={`absolute w-[225px] h-[25px] rounded-full p-[2px] z-10 shadow-[0_4px_8px_rgba(0,0,0,0.3)] ${isWin ? 'bg-gradient-to-b from-[#da3a27] to-[#a01c0e] border-[1px] border-[#ff6c58]/40' : 'bg-gradient-to-b from-[#8fafd2] to-[#517698] border-[1px] border-white/40'}`}>
                  {/* Deep pitch black cavity internal for authentic slit appearance */}
                  <div className="w-full h-full bg-[#000000] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden">
                     {/* The realistic inner horizontal paper slot entrance */}
                     <div className="w-[180px] h-[3px] bg-[#000000]" />
                  </div>
                </div>

                {/* LAYER 3: 3D Slot Front Lip / Top Border (z-30) - Clipped to top half to let ticket emerge from the horizontal middle */}
                <div className={`absolute w-[225px] h-[25px] rounded-full p-[2px] z-30 pointer-events-none ${isWin ? 'bg-gradient-to-b from-[#da3a27] to-[#a01c0e] border-[1px] border-[#ff6c58]/40' : 'bg-gradient-to-b from-[#8fafd2] to-[#517698] border-[1px] border-white/40'}`} style={{ clipPath: 'inset(0 0 50% 0)' }}>
                  {/* Deep pitch black cavity internal for authentic slit appearance */}
                  <div className="w-full h-full bg-[#000000] rounded-full shadow-[inset_0_3px_6px_rgba(0,0,0,0.95)] flex items-center justify-center relative overflow-hidden">
                     {/* The realistic inner horizontal paper slot entrance */}
                     <div className="w-[180px] h-[3px] bg-[#000000]" />
                  </div>
                </div>

                {/* LAYER 2: Parent overflow-masked wrapper that clips ticket precisely to the middle-plane of slot (z-20) */}
                {/* Starts exactly at the horizontal middle of the 25px slot (marginTop: 12.5px) */}
                <div className="relative w-[184px] h-[112px] overflow-hidden z-20" style={{ marginTop: '12.5px' }}>
                  
                  {/* Sleek Ticket document sliding smoothly down on entry */}
                  <div 
                    className="relative w-full h-full bg-gradient-to-b from-white via-[#fbfdfe] to-[#f5f9fc] rounded-b-[14px] flex flex-col items-center pt-4 pb-2 px-2.5 shadow-[0_8px_16px_rgba(0,0,0,0.18)] border-x border-b border-[#cbd4e1] animate-ticket-slide-wingo"
                  >
                     {/* Traditional Jagged / Curved tear line aesthetic at bottom */}
                     <div className="absolute -bottom-[6px] left-0 right-0 h-[8px] bg-gradient-to-b from-white to-[#cbd4e1]" style={{ clipPath: 'polygon(0 0, 100% 0, 97% 100%, 80% 92%, 60% 100%, 40% 92%, 20% 100%, 3% 92%)' }} />
                     
                     {/* Ticket Internal Fields */}
                     {isWin ? (
                       <>
                         <span className="text-[11px] font-extrabold mt-0.5 tracking-wider text-[#ff3c32] uppercase font-sans">
                           Bonus
                         </span>
                         <span className="text-[24px] font-[900] tracking-tight text-[#ff3333] leading-none mb-1 mt-0.5 font-sans">
                           {`₹${(localAlert.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                         </span>
                       </>
                     ) : (
                       <span className="text-[20px] font-[900] tracking-tight text-[#597a9a] leading-tight my-2.5 font-sans uppercase">
                         Lose
                       </span>
                     )}

                     {/* Dynamic period stats */}
                     <div className={`text-center text-[9.5px] text-[#64748b] leading-[1.3] font-sans font-medium px-1 ${isWin ? 'mt-0.5' : 'mt-0'}`}>
                        Period: {localAlert.room === '30s' ? 'WinGo 30sec' : localAlert.room === '1m' ? 'WinGo 1 Min' : localAlert.room === '3m' ? 'WinGo 3 Min' : 'WinGo 5 Min'}
                        <span className="font-mono text-[10.5px] text-[#475569] font-bold block mt-0.5 opacity-90">{localAlert.period}</span>
                     </div>
                  </div>

                </div>
              </div>

              {/* Exact Auto Close section matching specifications */}
              <div 
                className="flex items-center justify-center gap-2 mt-5 mb-1 cursor-pointer select-none" 
                onClick={() => setAutoClose(!autoClose)}
              >
                <div 
                  className={`w-[17px] h-[17px] rounded-full border-[1.5px] flex items-center justify-center transition-colors 
                    ${isWin 
                      ? 'border-white bg-white/25 hover:bg-white/35' 
                      : 'border-[#4e6c8b] bg-[#4e6c8b]/15 hover:bg-[#4e6c8b]/25'
                    }`}
                >
                  {autoClose && <Check className={`w-3 h-3 stroke-[3.5px] ${isWin ? 'text-white' : 'text-[#4e6c8b]'}`} />}
                </div>
                <span className={`text-[12.5px] font-[700] font-sans ${isWin ? 'text-white/95' : 'text-[#4e6c8b]'}`}>
                   {timeLeft} seconds auto close
                </span>
              </div>

            </div>

            {/* Custom Clear Close Button suspended perfectly below the card */}
            <button 
               onClick={onClose}
               className="mt-5 w-[36px] h-[36px] rounded-full border-[1.5px] border-white/40 flex items-center justify-center bg-transparent text-white/90 cursor-pointer hover:bg-white/10 hover:scale-105 transition active:scale-95 z-30"
               style={{ textShadow: '0 3px 8px rgba(0,0,0,0.5)' }}
            >
               <X className="w-[20px] h-[20px] stroke-[2px]" />
            </button>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
