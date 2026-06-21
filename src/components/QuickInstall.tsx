import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const gameLogo = "https://i.ibb.co/rGjxr0hn/file-00000000d308720cab57b8c2210b5b42.png";

interface QuickInstallProps {
  selectedLang?: 'en' | 'hi';
  currentTab?: string;
}

export default function QuickInstall({ selectedLang, currentTab }: QuickInstallProps) {
  const [showBanner, setShowBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showChromePrompt, setShowChromePrompt] = useState(false);
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const lang = selectedLang || 'en';
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const triggerRealOrSimulatedInstall = async () => {
    if (deferredPrompt) {
      try {
        setShowModal(false);
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User prompt choice outcome: ${outcome}`);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setShowBanner(false);
          sessionStorage.setItem('wt_app_installed', 'true');
        }
      } catch (err) {
        console.error('Error invoking native prompt:', err);
        // Fallback to Chrome Simulation
        setShowModal(false);
        setShowChromePrompt(true);
      }
      setDeferredPrompt(null);
    } else {
      // Show Chrome dialog simulation for iframe/non-PWA context
      setShowModal(false);
      setShowChromePrompt(true);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA beforeinstallprompt captured.');
    };

    const handleAppInstalled = () => {
      console.log('App was successfully installed (native callback)');
      setIsInstalled(true);
      setShowModal(false);
      setShowChromePrompt(false);
      setShowBanner(false);
      sessionStorage.setItem('wt_app_installed', 'true');
    };

    const handleTriggerInstall = () => {
      triggerRealOrSimulatedInstall();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('trigger-quick-install', handleTriggerInstall);

    // Automatic modal display delay timer (2.5 seconds on page load)
    let autoPromptTimer: NodeJS.Timeout;
    const dismissed = localStorage.getItem('pwa_install_dismissed') === 'true' || sessionStorage.getItem('wt_install_dismissed_v3') === 'true';
    const isAlreadyInstalled = sessionStorage.getItem('wt_app_installed') === 'true';

    if (!dismissed && !isAlreadyInstalled) {
      autoPromptTimer = setTimeout(() => {
        setShowModal(true);
      }, 2500); // 2.5 seconds delay
    }

    // Initial check display mode
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      sessionStorage.getItem('wt_app_installed') === 'true'
    ) {
      setIsInstalled(false); // Enable visibility even in standalone for testing/viewing
      setShowBanner(true);
    }

    // Check if dismissed
    if (sessionStorage.getItem('wt_install_dismissed_v3') === 'true' || localStorage.getItem('pwa_install_dismissed') === 'true') {
      setShowBanner(false);
    }

    return () => {
      if (autoPromptTimer) clearTimeout(autoPromptTimer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('trigger-quick-install', handleTriggerInstall);
    };
  }, [deferredPrompt]); // re-bind to lock the latest state handle correctly

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    localStorage.setItem('pwa_install_dismissed', 'true');
    sessionStorage.setItem('wt_install_dismissed_v3', 'true');
  };

  const handleSimulatedInstallSubmit = () => {
    // Start installation progress sequence
    setShowChromePrompt(false);
    setInstallProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 20) + 10;
      if (progress >= 100) {
        progress = 100;
        setInstallProgress(100);
        setIsInstalled(true);
        setShowBanner(false);
        sessionStorage.setItem('wt_app_installed', 'true');
        clearInterval(interval);
        
        setTimeout(() => {
          setInstallProgress(null);
        }, 1500);
      } else {
        setInstallProgress(progress);
      }
    }, 150);
  };

  if (isInstalled && installProgress === null) return null;

  return (
    <>
      {/* 1. STICKY FLOAT PROMO BANNER (Screenshot 1 & 3 inspired Yellow Add to Desktop banner) */}
      <AnimatePresence>
        {showBanner && currentTab === 'home' && !isInstalled && installProgress === null && (
          <motion.div
            initial={{ y: 80, opacity: 0, x: '-50%', scale: 1 }}
            animate={{ 
              y: 0, 
              opacity: 1, 
              x: '-50%',
              scale: [1, 1.02, 1, 1.02, 1],
            }}
            exit={{ y: 80, opacity: 0, x: '-50%', scale: 1 }}
            transition={{ 
              y: { type: 'spring', damping: 25, stiffness: 200 },
              scale: {
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
              }
            }}
            id="install-banner-wrapper"
            onClick={() => setShowModal(true)}
            className="fixed bottom-[114px] left-1/2 z-40 w-[72%] max-w-[210px] h-[30px] bg-gradient-to-r from-[#ffca05] via-[#ffbd02] to-[#f29f05] text-white rounded-full flex-row flex items-center justify-between shadow-[0_4px_12px_rgba(242,159,5,0.4)] cursor-pointer pl-1 pr-1 border border-[#ffe066]/60"
          >
            {/* High-fidelity round badge icon featuring the Neon Trade Logo */}
            <div className="w-[22px] h-[22px] min-w-[22px] bg-[#330c0e] rounded-full overflow-hidden border border-[#ffca05]/40 flex items-center justify-center p-0.5 shadow-md flex-shrink-0 select-none">
              <img
                src={gameLogo}
                alt="Neon Trade Logo"
                className="w-full h-full object-contain filter drop-shadow-[0_1px_3px_rgba(0,0,0,0.5)] scale-110"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Direct clean text display with heavy drop shadow to make white text on yellow background extremely high contrast and readable */}
            <div className="flex-1 text-center font-[900] text-[9.2px] tracking-wider uppercase pr-1.5 drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)] font-sans select-none">
              {lang === 'en' ? 'Add to Desktop' : 'डेस्कटॉप पर जोड़ें'}
            </div>

            {/* Compact close button in translucent circle */}
            <button
               onClick={handleDismiss}
               className="w-4 h-4 min-w-[16px] rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center transition-colors mr-0.5 cursor-pointer flex-shrink-0"
               aria-label="Dismiss"
            >
              <X size={7.5} className="text-white/94 stroke-[3.5]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. QUICK INSTALL POPUP MODAL (Screenshot 2) */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Dark back curtains */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-[315px] bg-white text-slate-800 rounded-[32px] p-6 shadow-2xl flex flex-col items-center select-none border border-slate-100"
            >
              {/* Close Button at top-right */}
              <button
                onClick={() => {
                  setShowModal(false);
                  localStorage.setItem('pwa_install_dismissed', 'true');
                  sessionStorage.setItem('wt_install_dismissed_v3', 'true');
                }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                <X size={14} className="stroke-[2.5]" />
              </button>

              {/* Lightning symbol and Heading */}
              <div className="flex items-center gap-2 mt-4 mb-2">
                <span className="text-[#f43f5e] text-2xl font-black">⚡</span>
                <h3 className="text-[21px] font-black text-slate-900 tracking-tight font-sans">
                  {lang === 'en' ? 'Quick Install' : 'त्वरित इंस्टॉल'}
                </h3>
              </div>

              {/* Security shield and Verified Badge */}
              <div className="border border-rose-200/80 bg-[#ffebee] text-[#f43f5e] font-extrabold text-[12px] px-5 py-1.5 rounded-full flex items-center gap-1 mt-1 mb-8 shadow-sm">
                <span className="text-sm">🛡️</span>
                <span>{lang === 'en' ? 'Activated' : 'सक्रिय'}</span>
              </div>

              {/* Install Button */}
              <button
                onClick={triggerRealOrSimulatedInstall}
                className="w-full py-3.5 bg-gradient-to-r from-[#de2222] to-[#eb3a44] hover:brightness-105 active:brightness-95 active:scale-97 text-white font-black rounded-2xl text-base uppercase tracking-wider transition-all duration-150 shadow-lg shadow-red-500/15 cursor-pointer text-center leading-none"
              >
                {lang === 'en' ? 'Install' : 'इंस्टॉल'}
              </button>

              {/* Not Now cancel option */}
              <button
                onClick={() => {
                  setShowModal(false);
                  localStorage.setItem('pwa_install_dismissed', 'true');
                  sessionStorage.setItem('wt_install_dismissed_v3', 'true');
                }}
                className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest cursor-pointer transition-colors"
              >
                {lang === 'en' ? 'Not Now' : 'अभी नहीं'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. SIMULATED BROWSER NATIVE INSTALL OVERLAY (Screenshot 3) */}
      <AnimatePresence>
        {showChromePrompt && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            {/* Background screen overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChromePrompt(false)}
              className="absolute inset-0 bg-black/75"
            />

            {/* Simulated Dialog Frame */}
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-[310px] bg-white rounded-3xl p-5 shadow-2xl flex flex-col font-sans text-slate-900 select-none border border-slate-100"
            >
              {/* Prompt title header */}
              <h4 className="text-[19px] font-medium text-slate-900 mb-4 select-none pr-4 text-left leading-none font-sans">
                Install app
              </h4>

              {/* Icon & App Details Row */}
              <div className="flex items-center gap-4 py-1.5 mb-5 text-left">
                {/* App circular logo matching Screenshot 3 */}
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center p-0.5">
                  <img
                    src={gameLogo}
                    alt="App Logo"
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Vertical detail stack */}
                <div className="flex flex-col justify-center leading-tight">
                  <span className="text-base font-medium text-slate-900 font-sans leading-none">
                    Neon Trade
                  </span>
                  <span className="text-[12.5px] text-slate-500 font-normal leading-none mt-1.5">
                    neon-trade.vercel.app
                  </span>
                </div>
              </div>

              {/* Simulated browser CTA Buttons */}
              <div className="flex items-center justify-end gap-5 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => setShowChromePrompt(false)}
                  className="text-[#1a73e8] hover:bg-[#1a73e8]/5 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulatedInstallSubmit}
                  className="text-[#1a73e8] hover:bg-[#1a73e8]/5 px-3 py-2 rounded-lg transition-colors cursor-pointer select-none"
                >
                  Install
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ON-SCREEN PROGRESS TOAST OR NOTIFICATION */}
      <AnimatePresence>
        {installProgress !== null && (
          <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="bg-[#1b1b1f] text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-4 text-xs font-bold max-w-[280px] w-full border border-white/10"
            >
              {/* Spinner */}
              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div className="flex-1 text-left leading-none font-sans">
                {lang === 'en' ? 'Installing Application...' : 'ऐप स्थापित हो रहा है...'}
                <div className="text-[10px] text-neutral-400 mt-1">{installProgress}% complete</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
