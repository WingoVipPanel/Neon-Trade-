import React from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface InvitationRecordViewProps {
  onClose: () => void;
  selectedLang: 'en' | 'hi';
  uid: string;
}

export default function InvitationRecordView({ onClose, selectedLang, uid }: InvitationRecordViewProps) {
  const [records, setRecords] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!uid) return;
    
    // Fetch real referral deposits from Firestore
    const q = query(
      collection(db, 'referralDeposits'),
      where('referrerUid', '==', uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recordsList: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        recordsList.push({
          id: doc.id,
          name: data.inviteeNickname || 'User',
          uid: data.inviteeUid || '000000',
          deposit: data.amount || 0,
          regTime: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'Just now'
        });
      });
      setRecords(recordsList);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching referral records:", err);
      // Fallback for missing index
      const qSimple = query(
        collection(db, 'referralDeposits'),
        where('referrerUid', '==', uid)
      );
      onSnapshot(qSimple, (snapshot) => {
        const recordsList: any[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          recordsList.push({
            id: doc.id,
            name: data.inviteeNickname || 'User',
            uid: data.inviteeUid || '000000',
            deposit: data.amount || 0,
            regTime: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : 'Just now'
          });
        });
        setRecords(recordsList);
        setLoading(false);
      });
    });

    return () => unsubscribe();
  }, [uid]);
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

      <div className="p-4 space-y-3 pb-6">
        {loading ? (
          <div className="flex justify-center p-10">
            <span className="text-white/50 animate-pulse font-bold tracking-widest text-xs uppercase">Loading records...</span>
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 bg-[#2a0e0f]/50 rounded-2xl border border-white/5">
             <svg className="w-12 h-12 text-white/10 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
             <span className="text-white/30 text-xs font-bold uppercase tracking-wider text-center leading-relaxed italic">
               No invitation records found.<br/>Invite friends to start earning!
             </span>
          </div>
        ) : records.map((record) => (
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
                  ₹{(record.deposit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
