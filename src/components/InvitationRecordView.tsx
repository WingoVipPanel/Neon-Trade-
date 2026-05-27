import React from 'react';
import { motion } from 'framer-motion';

interface InvitationRecordViewProps {
  onClose: () => void;
  selectedLang: 'en' | 'hi';
}

const MOCK_RECORDS: any[] = [
  // Records cleared as requested by user
];

export default function InvitationRecordView({ onClose, selectedLang }: InvitationRecordViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-[#1b0809] overflow-y-auto w-full h-full font-sans text-white"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-center p-4 bg-[#341113] border-b border-white/5 shadow-md">
        <div 
          onClick={onClose}
          className="absolute left-4 w-10 h-10 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        <h1 className="text-xl font-black text-[#ffd275] tracking-wide uppercase">
          {selectedLang === 'en' ? 'Invitation record' : 'निमंत्रण रिकॉर्ड'}
        </h1>
      </div>

      <div className="p-4 space-y-3 pb-24">
        {MOCK_RECORDS.map((record) => (
          <div key={record.id} className="bg-[#2a0e0f] rounded-xl p-4 border border-white/5 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white text-base font-black truncate mr-2">{record.name}</span>
              <span className="text-[#ffd275] text-sm font-black whitespace-nowrap">UID:{record.uid}</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-[#1b0809] p-2 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                  {selectedLang === 'en' ? 'Registration time' : 'पंजीकरण समय'}
                </span>
                <span className="text-[#ffd275] text-xs font-mono font-black">{record.regTime}</span>
              </div>
              
              <div className="flex justify-between items-center bg-[#1b0809] p-2 rounded-lg border border-white/5">
                <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider">
                  {selectedLang === 'en' ? 'Deposit amount' : 'जमा राशि'}
                </span>
                <span className="text-[#df1c1c] text-sm font-black">
                  ₹{record.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
