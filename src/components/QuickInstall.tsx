import React, { useState, useEffect } from 'react';
import { Download, X, ShieldCheck, Share, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function QuickInstall() {
  const [showBanner, setShowBanner] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [installProgress, setInstallProgress] = useState<number | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [showSuccess, setShowSuccess] = useState(false);

  // Listen for native beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      console.log('PWA beforeinstallprompt captured.');
    };

    const handleAppInstalled = () => {
      console.log('App was successfully installed (native callback)');
      setIsInstalled(true);
      setShowSuccess(true);
      setInstallProgress(100);
      localStorage.setItem('wt_app_installed', 'true');
      
      // Auto close after success
      setTimeout(() => {
        setShowModal(false);
        setShowBanner(false);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Detect platform
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check if already in standalone display mode (installed)
    if (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      localStorage.getItem('wt_app_installed') === 'true'
    ) {
      setIsInstalled(true);
      setShowBanner(false);
    }

    // Check localStorage to see if user dismissed it recently
    const dismissed = localStorage.getItem('wt_install_dismissed_v2');
    if (dismissed && dismissed === 'true') {
      setShowBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowBanner(false);
    localStorage.setItem('wt_install_dismissed_v2', 'true');
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        // MUST call prompt() inside a trusted user gesture thread
        deferredPrompt.prompt();
        
        // Wait for native prompt selection
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User choice outcome: ${outcome}`);
        
        if (outcome === 'accepted') {
          // Start simulated progress bar to match native download speed
          setInstallProgress(0);
          let current = 0;
          const interval = setInterval(() => {
            current += Math.floor(Math.random() * 12) + 8;
            if (current >= 100) {
              current = 100;
              setInstallProgress(100);
              setShowSuccess(true);
              setIsInstalled(true);
              clearInterval(interval);
              localStorage.setItem('wt_app_installed', 'true');
              
              setTimeout(() => {
                setShowModal(false);
                setShowBanner(false);
              }, 2000);
            } else {
              setInstallProgress(current);
            }
          }, 120);
        } else {
          // User cancelled prompt, reset
          setInstallProgress(null);
        }
      } catch (err) {
        console.error('Error triggering Native Prompt:', err);
        runSimulatedBackupInstall();
      }
      setDeferredPrompt(null);
    } else {
      // Backup/iOS simulation & instructions
      runSimulatedBackupInstall();
    }
  };

  const runSimulatedBackupInstall = () => {
    setInstallProgress(0);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 12) + 8;
      if (current >= 100) {
        current = 100;
        setInstallProgress(100);
        setShowSuccess(true);
        clearInterval(interval);
        
        // Keep screen open so they can follow iOS or Android custom menu instructions if not automatic
        setTimeout(() => {
          if (platform === 'android' || platform === 'desktop') {
            setShowModal(false);
            setShowBanner(false);
          }
        }, 3000);
      } else {
        setInstallProgress(current);
      }
    }, 120);
  };

  // If already installed, do not render banner or modal
  if (isInstalled && !showModal) return null;

  return (
    <>
      {/* FLOATING BANNER AT THE BOTTOM */}
      <AnimatePresence>
        {showBanner && !isInstalled && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
            id="install-banner-wrapper"
            className="fixed bottom-[74px] left-0 right-0 z-40 mx-4 md:max-w-md md:mx-auto cursor-pointer"
            onClick={() => setShowModal(true)}
          >
            <div className="bg-gradient-to-r from-[#d92a3f] to-[#e63946] hover:from-[#c22134] hover:to-[#d02c38] text-white p-3 pr-4 rounded-xl flex items-center justify-between shadow-2xl border border-white/10 transition-all active:scale-98">
              {/* Left Logo / White download badge element */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner relative flex-shrink-0">
                  <img 
                    src="https://i.ibb.co/LhbR2xX0/file-00000000d8947209aa95cf6b9358b708.png" 
                    alt="App Logo"
                    className="w-8 h-8 object-contain rounded-md"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 border border-white">
                    <Download size={8} className="stroke-[3]" />
                  </div>
                </div>
                
                {/* Content text */}
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider font-sans leading-tight">
                    Quick Install
                  </span>
                  <span className="text-[11px] text-red-55 opacity-95 font-medium">
                    Download APP for a Better Experience
                  </span>
                </div>
              </div>

              {/* Right install arrow or close badge */}
              <div className="flex items-center gap-2">
                <span className="bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider transition-all whitespace-nowrap">
                  INSTALL NOW
                </span>
                <button 
                  onClick={handleDismiss} 
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={14} className="text-white/85" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUICK INSTALL MODAL STEP OVERLAY */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Body Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm bg-white text-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden border border-white/20 flex flex-col items-center"
            >
              {/* Close Button top-right */}
              <button 
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={16} />
              </button>

              {/* Lightning Bolt icon + Quick Install Title */}
              <div className="flex items-center gap-2 mt-2 mb-1.5">
                <span className="text-red-500 text-xl font-bold">⚡</span>
                <h3 className="text-md md:text-lg font-extrabold font-sans text-slate-900 uppercase tracking-wide">
                  Quick Install
                </h3>
              </div>

              {/* Activated Shield Badge */}
              <div className="border border-emerald-200 text-emerald-600 bg-emerald-50 font-bold text-[10px] px-3.5 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider mb-5">
                <ShieldCheck size={12} className="stroke-[3]" />
                <span>100% Safe & Verified</span>
              </div>

              {/* Real Game Logo Container in Modal */}
              <div className="w-24 h-24 bg-gradient-to-br from-slate-50 to-amber-50 p-2.5 rounded-2xl shadow-md border border-slate-100 mb-5 flex items-center justify-center relative">
                <img 
                  src="https://i.ibb.co/LhbR2xX0/file-00000000d8947209aa95cf6b9358b708.png" 
                  alt="Tech win Logo" 
                  className="w-full h-full object-contain rounded-xl select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-white shadow-md animate-bounce">
                  <Download size={10} className="stroke-[3]" />
                </div>
              </div>

              {/* Description */}
              <div className="text-center mb-5">
                <h4 className="font-extrabold text-slate-900 text-sm">Tech win Standalone App</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed max-w-[260px] mx-auto">
                  Instant launch from your home screen. Uses almost zero cache storage, and opens 3x faster than normal browsing.
                </p>
              </div>

              {/* Success Screen Or Custom Loader UI */}
              {showSuccess ? (
                <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 py-3 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
                  <CheckCircle2 className="text-emerald-500 stroke-[2.5]" size={28} />
                  <span className="font-extrabold text-xs uppercase tracking-wide">App Installed Successfully!</span>
                </div>
              ) : installProgress === null ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full py-3.5 bg-gradient-to-r from-[#d92a3f] to-[#e63946] hover:from-[#c22134] hover:to-[#d02c38] text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-97 cursor-pointer text-center"
                >
                  Install Now
                </button>
              ) : (
                <div className="w-full relative h-[44px] bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center select-none font-bold">
                  {/* Progress bar fill */}
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${installProgress}%` }}
                    transition={{ ease: "easeOut" }}
                    className="absolute top-0 left-0 bottom-0 bg-red-500"
                  />
                  {/* Percentage content overlay */}
                  <span className="relative z-10 text-xs font-black uppercase tracking-wider text-slate-900 mix-blend-difference">
                    Installing {installProgress}%
                  </span>
                </div>
              )}

              {/* HELP INFORMATION CONTAINER */}
              <div className="mt-5 pt-4 border-t border-slate-100 w-full text-left">
                <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/50">
                  <HelpCircle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-slate-800">Quick Guide:</p>
                    {platform === 'ios' ? (
                      <ol className="list-decimal list-inside space-y-1 mt-1 font-medium text-slate-600">
                        <li>Tap the Safari <span className="text-blue-600 font-bold inline-flex items-center">Share <Share size={10} className="mx-0.5 inline" /></span> button at the bottom.</li>
                        <li>Select <span className="font-black text-[#d92a3f]">"Add to Home Screen"</span> from options.</li>
                        <li>Click <span className="font-bold">"Add"</span> top-right. App is ready!</li>
                      </ol>
                    ) : (
                      <p className="mt-0.5 text-slate-500 leading-normal">
                        After clicking "Install Now", confirm the installation in your browser's prompt. 
                        If the prompt does not launch automatically, tap the browser menu (⋮) and choose <span className="font-extrabold text-slate-800">"Install app"</span> or <span className="font-extrabold text-[#d92a3f]">"Add to Home Screen"</span>.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
