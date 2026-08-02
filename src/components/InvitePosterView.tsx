import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Download, Copy, Share2, Facebook, Twitter, Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

interface InvitePosterViewProps {
  onBack: () => void;
  uid: string;
  selectedLang?: string;
  key?: string;
}

export default function InvitePosterView({ onBack, uid, selectedLang = "en" }: InvitePosterViewProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const posterRefs = useRef<(HTMLDivElement | null)[]>([]);

  const inviteLink = `https://neon-trade.vercel.app?ref=${uid}`;

  const posters = [
    "https://i.ibb.co/yFP0G6qg/file-00000000ca487209855fa5f317777609.png",
    "https://i.ibb.co/yFP0G6qg/file-00000000ca487209855fa5f317777609.png",
    "https://i.ibb.co/yFP0G6qg/file-00000000ca487209855fa5f317777609.png"
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      const scrollPosition = scrollRef.current.scrollLeft;
      const containerWidth = scrollRef.current.offsetWidth;
      // Calculate which poster is closest to the center
      const index = Math.round(scrollPosition / (containerWidth * 0.68)); 
      setActiveTab(Math.min(Math.max(index, 0), posters.length - 1));
    };

    const container = scrollRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [posters.length]);

  const handleDownload = async () => {
    if (isDownloading) return;
    const activePosterElement = posterRefs.current[activeTab];
    if (!activePosterElement) return;

    try {
      setIsDownloading(true);
      const canvas = await html2canvas(activePosterElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2 // Higher resolution
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `invite_poster_${uid}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating poster:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    // You could trigger a toast here if passed via props
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#3a060a] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <div className="h-14 flex items-center px-4 relative z-10">
        <ChevronLeft onClick={onBack} className="text-white w-6 h-6 cursor-pointer" />
        <h1 className="text-white text-lg font-medium absolute left-1/2 -translate-x-1/2">
          {selectedLang === 'en' ? 'Invite' : 'आमंत्रित करें'}
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-4">
        <p className="text-white/70 text-center text-[13px] mb-3 mt-1">
          {selectedLang === 'en' ? 'Please swipe left - right to choose your favorite poster' : 'कृपया अपना पसंदीदा पोस्टर चुनने के लिए बाएं-दाएं स्वाइप करें'}
        </p>

        {/* Poster Carousel */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto gap-3 px-8 pb-4 snap-x snap-mandatory hide-scrollbar"
        >
          {posters.map((poster, idx) => (
            <div 
              key={idx} 
              ref={el => posterRefs.current[idx] = el}
              className="relative shrink-0 w-[68%] max-w-[260px] aspect-[4/6] mx-auto snap-center rounded-xl overflow-hidden shadow-xl"
            >
              <img src={poster} alt="Poster" className="w-full h-full object-cover pointer-events-none" crossOrigin="anonymous" referrerPolicy="no-referrer" />
              {/* QR Code Container overlayed precisely on the box in the poster */}
              <div className="absolute bottom-[9%] left-1/2 -translate-x-1/2 bg-white p-1.5 rounded-md shadow-lg">
                <QRCode value={inviteLink} size={75} />
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center px-8 text-white text-[15px] mb-4 w-full">
          <div>
            {selectedLang === 'en' ? 'Invite friends' : 'दोस्तों को आमंत्रित करें'}
          </div>
          <div>
            {selectedLang === 'en' ? 'Income ' : 'आय '}<span className="text-[#ffcf24]">10 billion</span>{selectedLang === 'en' ? ' Commission' : ' कमीशन'}
          </div>
        </div>

        {/* Buttons */}
        <div className="px-8 space-y-3 w-full">
          <button 
            className="w-full py-2.5 bg-gradient-to-b from-[#ffcf24] to-[#f57f17] text-[#4e1c00] font-bold rounded-full text-[15px] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <span className="w-5 h-5 border-2 border-[#4e1c00] border-t-transparent rounded-full animate-spin"></span>
            ) : null}
            {selectedLang === 'en' ? (isDownloading ? 'Downloading...' : 'Download QR Code') : (isDownloading ? 'डाउनलोड हो रहा है...' : 'क्यूआर कोड डाउनलोड करें')}
          </button>
          
          <button 
            className="w-full py-2.5 border border-[#ffcf24] text-[#ffcf24] font-bold rounded-full text-[15px] active:scale-95 transition-all bg-transparent"
            onClick={handleCopy}
          >
            {selectedLang === 'en' ? 'Copy invitation link' : 'निमंत्रण लिंक कॉपी करें'}
          </button>
        </div>

        {/* Social Share */}
        <div className="mt-6 text-center px-6 pb-4">
          <p className="text-white/60 text-[13px] mb-3">
            {selectedLang === 'en' ? 'Share to other apps to invite friend' : 'दोस्तों को आमंत्रित करने के लिए अन्य ऐप्स पर साझा करें'}
          </p>
          <div className="flex justify-center gap-5">
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg">
                <MessageCircle className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-white/70 text-[11px]">WhatsApp</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-10 h-10 bg-[#0088cc] rounded-full flex items-center justify-center shadow-lg">
                <Send className="text-white w-5 h-5 -ml-0.5 mt-0.5" />
              </div>
              <span className="text-white/70 text-[11px]">Telegram</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-10 h-10 bg-[#1877F2] rounded-full flex items-center justify-center shadow-lg">
                <Facebook className="text-white w-5 h-5 fill-current" />
              </div>
              <span className="text-white/70 text-[11px]">Facebook</span>
            </div>
            
            <div className="flex flex-col items-center gap-1.5 cursor-pointer">
              <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold font-serif leading-none mt-0.5">X</span>
              </div>
              <span className="text-white/70 text-[11px]">Twitter</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
