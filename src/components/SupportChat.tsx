import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, User, Headset, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: string;
}

interface SupportChatProps {
  onClose: () => void;
  userName?: string;
  userAvatar?: string;
}

export default function SupportChat({ onClose, userName = 'Lucky Gamer', userAvatar }: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'How can we help you today? Please describe your issue.',
      sender: 'support',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userQuery = inputText.trim();

    const userMsg: Message = {
      id: Date.now().toString(),
      text: userQuery,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');

    // Simulated responsive Support Desk automated typing feedback
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const queryLower = userQuery.toLowerCase();
      let replyText = "Thank you for contacting Tech win Live Support. Our accounts manager is verifying your account details. Please hold on ...";
      
      if (queryLower.includes("withdraw") || queryLower.includes("withdrawal") || queryLower.includes("paisa nikal") || queryLower.includes("nical") || queryLower.includes("nikalna") || queryLower.includes("paisae nikal")) {
        replyText = "Hello! Tech win withdrawals are processed instantly and credited through high-speed bank UPI channels. Normal timeline is 2 to 5 minutes. If your balance hasn't arrived, please verify that your UPI ID is linked correctly in the Withdraw section of the Wallet tab.";
      } else if (queryLower.includes("deposit") || queryLower.includes("add money") || queryLower.includes("balance load") || queryLower.includes("paisa add") || queryLower.includes("recharge") || queryLower.includes("deposit failed")) {
        replyText = "Hello! For instant deposits, select UPI QR in the Deposit section of the Mine/Wallet tab. Scan the golden QR with any UPI app (GPay, PhonePe, Paytm). Your credits will automatically reflect in your Tech win wallet inside 30 seconds. Feel free to refresh your balance at the top!";
      } else if (queryLower.includes("bonus") || queryLower.includes("promo") || queryLower.includes("gift") || queryLower.includes("code") || queryLower.includes("coupon")) {
        replyText = "Awesome! We have active promotional codes for new registrants. Go to 'Gifts & Promos' in the Mine tab menu, and try entering secret codes: [ WELCOME ] to claim ₹250, [ LUCKY777 ] to claim ₹100, or [ VIPWIN ] to claim ₹500 immediately!";
      } else if (queryLower.includes("hi") || queryLower.includes("hello") || queryLower.includes("hey") || queryLower.includes("sir") || queryLower.includes("help") || queryLower.includes("supp") || queryLower.includes("baat")) {
        replyText = "Hello! Welcome to Tech win Premium Desk support. How can we help you with deposits, withdrawals, or gaming history queries today? Type 'deposit', 'withdraw' or 'promo' for instant helper instructions.";
      }
      
      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: 'support',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, supportMsg]);
    }, 1200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="fixed inset-0 z-[100] bg-[#2c1012] flex flex-col font-sans max-w-[410px] mx-auto overflow-hidden"
    >
      {/* Header */}
      <div className="h-[56px] bg-[#3d0f10] border-b border-white/5 flex items-center px-4 shadow-md shrink-0">
        <button onClick={onClose} className="h-10 w-10 flex items-center justify-start text-white active:scale-90 transition-transform">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-3 ml-2 flex-1">
          <div className="relative">
            <div className="w-9 h-9 bg-[#ff4148] rounded-full flex items-center justify-center">
              <Headset className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#3d0f10]" />
          </div>
          <div>
            <div className="text-white text-[15px] font-bold leading-none">Live Support</div>
            <div className="text-green-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Online</div>
          </div>
        </div>
      </div>

      {/* Chat area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#2c1012]"
        style={{ scrollBehavior: 'smooth' }}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-[#ff4148] text-white rounded-tr-none' 
                  : 'bg-[#3d0f10] text-white/90 rounded-tl-none border border-white/5'
              }`}>
                {msg.text}
              </div>
              <span className="text-[9px] text-white/30 mt-1 uppercase font-bold tracking-tight px-1">
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[#3d0f10] border border-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="p-4 bg-[#3d0f10] border-t border-white/5 pb-6 shrink-0">
        <div className="flex items-center gap-2 bg-[#2c1012] rounded-full pl-5 pr-1.5 py-1.5 border border-white/10 focus-within:border-[#ff4148]/40 transition-colors">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-medium placeholder:text-white/20"
          />
          <button 
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90 ${
              inputText.trim() ? 'bg-[#ff4148] text-white' : 'bg-white/5 text-white/20'
            }`}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
