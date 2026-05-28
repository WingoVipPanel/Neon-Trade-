import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InvitationRecordView from './InvitationRecordView';

interface InvitationBonusViewProps {
  onClose: () => void;
  selectedLang: 'en' | 'hi';
  uid: string;
}

const BONUS_TIERS = [
  { id: 1, reward: 38, invitees: 1, recharge: 300 },
  { id: 2, reward: 158, invitees: 3, recharge: 300 },
  { id: 3, reward: 580, invitees: 10, recharge: 500 },
  { id: 4, reward: 1800, invitees: 30, recharge: 800 },
  { id: 5, reward: 2800, invitees: 50, recharge: 1200 },
  { id: 6, reward: 4500, invitees: 75, recharge: 1200 },
  { id: 7, reward: 5800, invitees: 100, recharge: 1200 },
  { id: 8, reward: 11800, invitees: 200, recharge: 1200 },
  { id: 9, reward: 29000, invitees: 500, recharge: 1200 },
  { id: 10, reward: 58000, invitees: 1000, recharge: 1200 },
  { id: 11, reward: 118000, invitees: 2000, recharge: 1200 },
  { id: 12, reward: 300000, invitees: 5000, recharge: 1200 },
];

export default function InvitationBonusView({ onClose, selectedLang, uid }: InvitationBonusViewProps) {
  const [showRecordView, setShowRecordView] = useState(false);
  // Reset invitation stats to 0 as requested by user
  const userInvitees = 0;
  const userDeposits = 0;

  // Render checkmark icon
  const CheckIcon = () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  // Render cross icon
  const CrossIcon = () => (
    <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="w-full flex-1 overflow-y-auto pb-24 font-sans text-white h-full"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-center p-4 bg-[#341113] border-b border-white/5">
        <h1 className="text-xl font-black text-[#ffd275] uppercase tracking-wide">
          {selectedLang === 'en' ? 'Invitation bonus' : 'निमंत्रण बोनस'}
        </h1>
      </div>

      {/* Banner Area */}
      <div className="w-full bg-gradient-to-r from-[#df1c1c] to-[#aa1212] p-5 pt-6 pb-12 relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-1 shadow-sm text-white">
            {selectedLang === 'en' ? 'Invite friends and deposit' : 'दोस्तों को आमंत्रित करें और जमा करें'}
          </h2>
          <p className="text-sm font-bold mb-1 drop-shadow-sm text-white/90">
            {selectedLang === 'en' ? 'Both parties can receive rewards' : 'दोनों पक्षों को पुरस्कार मिल सकते हैं'}
          </p>
          <p className="text-xs font-medium max-w-[65%] drop-shadow-sm leading-tight text-white/80">
            {selectedLang === 'en' ? 'Invite friends to register, if they deposit ₹200 or more, get 19% commission!' : 'पंजीकरण करने के लिए आमंत्रित करें, यदि वे ₹200 जमा करते हैं, तो 19% कमीशन प्राप्त करें!'}
          </p>
          <div className="mt-4">
            <span className="text-xs text-white/80 lowercase font-bold">activity date</span>
            <div className="bg-black/30 inline-block px-2 py-0.5 rounded ml-2">
              <span className="font-semibold text-sm text-[#ffd275]">2023-03-18 - 2041-12-29</span>
            </div>
          </div>
        </div>
        
        {/* Abstract Graphic / Icon in Background */}
        <div className="absolute right-0 bottom-0 w-[140px] h-[140px] opacity-90 translate-x-4 translate-y-4">
           {/* Simulate a Red Envelope gift image graphic */}
           <div className="w-full h-full flex flex-col justify-end items-center pb-2">
              <div className="w-24 h-24 bg-[#ffd275] rounded-full shadow-[0_0_20px_rgba(255,210,117,0.5)] absolute bottom-6 right-2 animate-pulse" />
              <div className="w-20 h-28 bg-[#ff3a3a] rounded shadow-lg translate-x-2 -rotate-12 border-2 border-[#ffd275]" />
              <div className="w-20 h-28 bg-[#ff3a3a] rounded shadow-xl -translate-y-4 -translate-x-4 rotate-6 border-2 border-[#ffd275]" />
           </div>
        </div>
      </div>

      {/* Referral Link embedded inside */}
      <div className="px-4 -mt-2 relative z-10 mb-4">
        <div className="bg-[#2a0e0f] rounded-2xl p-4 shadow-lg border border-white/5">
          <h3 className="text-sm font-black text-[#ffd275] uppercase tracking-wide mb-3">
            {selectedLang === 'en' ? 'Share your referral code' : 'अपना रेफ़रल कोड साझा करें'}
          </h3>
          
          <div className="bg-[#1b0809] p-3 rounded-xl border border-white/5 flex flex-col gap-3">
            <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5">
              <span className="text-[#ffd275] font-mono text-xs font-black truncate max-w-[200px]">
                https://neontrade.app?ref={uid}
              </span>
              <div className="bg-[#341113] p-1.5 rounded cursor-pointer hover:bg-[#ff3a3a]/20 transition-colors">
                <svg className="w-4 h-4 text-[#ffd275]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
            </div>
            <div className="flex items-center justify-between bg-black/40 rounded-lg p-2.5">
              <div>
                <span className="text-[10px] text-white/40 block mb-0.5 uppercase tracking-wider font-bold">
                  {selectedLang === 'en' ? 'Invite Code' : 'आमंत्रण कोड'}
                </span>
                <span className="text-white font-mono text-sm font-black">
                  {uid}
                </span>
              </div>
              <div className="bg-[#341113] p-1.5 rounded cursor-pointer hover:bg-[#ff3a3a]/20 transition-colors">
                <svg className="w-4 h-4 text-[#ffd275]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats/Action Buttons */}
      <div className="px-4 relative z-10 flex gap-4">
        <button className="flex-1 bg-[#341113] rounded-xl p-3 flex flex-col items-center justify-center shadow-lg border border-white/5 active:scale-95 transition-transform cursor-pointer">
          <svg className="w-6 h-6 text-[#ffd275] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <span className="text-[11px] text-[#ffd275] font-black uppercase tracking-wider leading-tight">
            {selectedLang === 'en' ? 'Rules' : 'नियम'}
          </span>
        </button>
        <button 
          onClick={() => setShowRecordView(true)}
          className="flex-1 bg-[#341113] rounded-xl p-3 flex flex-col items-center justify-center shadow-lg border border-white/5 active:scale-95 transition-transform cursor-pointer"
        >
          <svg className="w-6 h-6 text-[#ffd275] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span className="text-[11px] text-[#ffd275] font-black uppercase tracking-wider leading-tight text-center">
            {selectedLang === 'en' ? 'Record' : 'रिकॉर्ड'}
          </span>
        </button>
      </div>

      {/* Bonus List */}
      <div className="mt-8 px-4 space-y-4">
        {BONUS_TIERS.map((tier) => {
          const isFinished = userInvitees >= tier.invitees && userDeposits >= tier.invitees; // simplified logic
          const hasReceivedObj = false; // reset hardcoded received status

          return (
            <div key={tier.id} className="w-full bg-[#2a0e0f] rounded-2xl overflow-hidden border border-white/5 shadow-md relative">
              {/* Card Header */}
              <div className="flex justify-between items-center h-12">
                <div className="flex bg-[#1ab261] h-full items-center pl-4 pr-3 rounded-br-[20px]">
                  <span className="font-black text-sm text-white">Bonus {tier.id}</span>
                  <div className="ml-2 bg-[#ffffff]/20 rounded-full p-0.5">
                    {hasReceivedObj ? <CheckIcon /> : <CrossIcon />}
                  </div>
                </div>
                <div className="pr-4">
                  <span className="text-[#ffd275] font-black text-lg">₹{tier.reward.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Requirements Box */}
              <div className="p-4 pt-5 pb-5">
                <div className="bg-[#1b0809] border border-white/5 rounded-lg">
                  <div className="flex justify-between p-3 border-b border-white/5">
                    <span className="text-white/50 font-bold uppercase tracking-wider text-[10px]">{selectedLang === 'en' ? 'Target: Number of invitees' : 'लक्ष्य: आमंत्रित लोगों की संख्या'}</span>
                    <span className="font-black text-sm text-white/90">{tier.invitees}</span>
                  </div>
                  <div className="flex justify-between p-3">
                    <span className="text-white/50 font-bold uppercase tracking-wider text-[10px]">{selectedLang === 'en' ? 'Requirement: Min Recharge' : 'आवश्यकता: न्यूनतम रिचार्ज'}</span>
                    <span className="text-[#df1c1c] font-black text-sm">₹{tier.recharge.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Progress & Divider */}
              <div className="mx-4 border-t border-dashed border-white/10" />

              {/* Progress Info */}
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center justify-center border-r border-white/5">
                  <span className="text-[#ffd275] font-black text-sm">{userInvitees} / {tier.invitees}</span>
                  <span className="text-white/50 text-[10px] mt-0.5 font-bold uppercase tracking-wider">{selectedLang === 'en' ? 'Your Invitees' : 'आपके आमंत्रित लोग'}</span>
                </div>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-[#df1c1c] font-black text-sm">{userDeposits} / {tier.invitees}</span>
                  <span className="text-white/50 text-[10px] mt-0.5 font-bold uppercase tracking-wider">{selectedLang === 'en' ? 'Qualifying Deposits' : 'पात्र जमा राशि'}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="px-4 pb-4">
                <button 
                  disabled={!isFinished || hasReceivedObj}
                  className={`w-full py-3 rounded-xl text-sm font-black shadow-md tracking-widest uppercase
                    ${hasReceivedObj 
                      ? 'bg-[#341113] text-white/50 cursor-not-allowed' // Received state
                      : 'bg-[#4a1618] text-white/30 cursor-not-allowed' // Unfinished state
                    }
                  `}
                >
                  {hasReceivedObj 
                    ? (selectedLang === 'en' ? 'Received' : 'प्राप्त किया')
                    : (selectedLang === 'en' ? 'Unfinished' : 'अपूर्ण')
                  }
                </button>
              </div>
              
              <div className="absolute top-[162px] -left-2 w-4 h-4 bg-[#1b0809] rounded-full border border-transparent" />
              <div className="absolute top-[162px] -right-2 w-4 h-4 bg-[#1b0809] rounded-full border border-transparent" />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showRecordView && (
          <InvitationRecordView
            selectedLang={selectedLang}
            onClose={() => setShowRecordView(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
