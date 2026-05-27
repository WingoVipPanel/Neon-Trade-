import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, Info, Gift, Calendar, TrendingUp, Percent } from 'lucide-react';

interface VipLevel {
  level: number;
  icon: string;
  expRequired: number;
  rebateRate: string;
  levelUpReward?: string;
  monthlyReward?: string;
  gradient: string;
}

const VIP_DATA: VipLevel[] = [
  {
    level: 1,
    icon: "https://i.ibb.co/XZq1B1jc/image.png",
    expRequired: 3000,
    rebateRate: "0.15%",
    levelUpReward: "60",
    monthlyReward: "30",
    gradient: "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  },
  {
    level: 2,
    icon: "https://i.ibb.co/wNggG8pK/image.png",
    expRequired: 30000,
    rebateRate: "0.25%",
    levelUpReward: "180",
    monthlyReward: "80",
    gradient: "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  },
  {
    level: 3,
    icon: "https://i.ibb.co/ZzjszWGD/image.png",
    expRequired: 400000,
    rebateRate: "0.35%",
    levelUpReward: "388",
    monthlyReward: "158",
    gradient: "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  },
  {
    level: 4,
    icon: "https://i.ibb.co/LdrR656w/image.png",
    expRequired: 4000000,
    rebateRate: "0.45%",
    levelUpReward: "1,288",
    monthlyReward: "628",
    gradient: "linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)",
  },
  {
    level: 5,
    icon: "https://i.ibb.co/XH3Dgmr/image.png",
    expRequired: 20000000,
    rebateRate: "0.55%",
    levelUpReward: "4,888",
    monthlyReward: "1,288",
    gradient: "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  },
  {
    level: 6,
    icon: "https://i.ibb.co/S7B8F6Dg/image.png",
    expRequired: 80000000,
    rebateRate: "0.65%",
    levelUpReward: "12,888",
    monthlyReward: "4,666",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    level: 7,
    icon: "https://i.ibb.co/6JNJ9rss/image.png",
    expRequired: 300000000,
    rebateRate: "0.68%",
    levelUpReward: "68,888",
    monthlyReward: "12,666",
    gradient: "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)",
  },
  {
    level: 8,
    icon: "https://i.ibb.co/kgfBPHRX/image.png",
    expRequired: 1000000000,
    rebateRate: "0.7%",
    levelUpReward: "168,888",
    monthlyReward: "66,666",
    gradient: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
  },
  {
    level: 9,
    icon: "https://i.ibb.co/0pvh8x4c/image.png",
    expRequired: 5000000000,
    rebateRate: "0.75%",
    levelUpReward: "688,888",
    monthlyReward: "166,666",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    level: 10,
    icon: "https://i.ibb.co/4wJBbxgN/image.png",
    expRequired: 9999999999,
    rebateRate: "0.8%",
    levelUpReward: "1,688,888",
    monthlyReward: "666,666",
    gradient: "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  }
];

interface VipLevelsViewProps {
  onBack: () => void;
  userExp: number;
  userLevel: number;
  nickname: string;
  avatar: string;
  claimedVipRewards: number[];
  claimedMonthlyRewards?: number[];
  onClaimReward: (level: number, rewardAmountStr: string) => void;
  onClaimMonthlyReward?: (level: number, rewardAmountStr: string) => void;
  selectedLang: string;
}

const VipLevelsView: React.FC<VipLevelsViewProps> = ({ 
  onBack, 
  userExp, 
  userLevel, 
  nickname, 
  avatar,
  claimedVipRewards,
  claimedMonthlyRewards = [],
  onClaimReward,
  onClaimMonthlyReward,
  selectedLang
}) => {
  const [activeVipTab, setActiveVipTab] = React.useState<'rules' | 'history'>('rules');
  const currentVip = VIP_DATA.find(v => v.level === userLevel) || { level: 0, gradient: 'linear-gradient(135deg, #666 0%, #333 100%)' };

  // Calculate dynamic history records based on user level & exp
  const getHistoryRecords = () => {
    const list: any[] = [];
    const baseDate = new Date();
    const savedPhone = localStorage.getItem('userPhone');

    if (savedPhone) {
      const historyKey = `vip_history_${savedPhone}`;
      const existingHistoryObj = localStorage.getItem(historyKey);
      if (existingHistoryObj) {
        try {
          const parsed = JSON.parse(existingHistoryObj);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Always inject level maintenance record if not already present
            const maintenanceTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 46, 17);
            const formattedMaintenanceTime = maintenanceTime.toISOString().replace('T', ' ').substring(0, 19);
            const hasMaintenance = parsed.some(item => item.type === 'maintenance');
            if (!hasMaintenance) {
              parsed.push({
                type: 'maintenance',
                title: 'Level maintenance',
                subtitle: 'Completion of level maintenance conditions [100% Completed]',
                timestamp: formattedMaintenanceTime,
                value: '0 EXP',
                color: '#cca06a',
                valColor: '#a3a3a3'
              });
            }
            return parsed.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
          }
        } catch (_) {}
      }
    }

    // Default clean single level maintenance event for clean profiles
    const maintenanceTime = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 46, 17);
    const formattedMaintenanceTime = maintenanceTime.toISOString().replace('T', ' ').substring(0, 19);
    list.push({
      type: 'maintenance',
      title: 'Level maintenance',
      subtitle: 'Completion of level maintenance conditions [100% Completed]',
      timestamp: formattedMaintenanceTime,
      value: '0 EXP',
      color: '#cca06a',
      valColor: '#a3a3a3'
    });

    return list;
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col w-full h-screen bg-[#3d0b0c] text-white font-sans overflow-hidden">
      {/* VIP Banner Header - Truly Sticky/Fixed */}
      <div className="flex-shrink-0 h-14 flex items-center justify-center bg-[#3d0b0c] border-b border-white/5 shadow-md">
        <button onClick={onBack} className="absolute left-2 p-2 hover:bg-white/5 rounded-full transition-colors active:scale-95 z-50">
          <ChevronLeft className="w-6 h-6 text-white/80" />
        </button>
        <h1 className="text-base font-bold tracking-[0.2em] text-white/90 uppercase">
          VIP
        </h1>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* User Info Section - Extremely Compact & Clean */}
        <div className="px-5 pt-4 pb-2 flex flex-col">
          <div className="flex items-center">
            {/* Avatar Area - Compact ring with subtle glow */}
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-0.5 rounded-full bg-white/5 blur-[2px]" />
              <img 
                src={avatar || "https://i.ibb.co/hR0LpZ3/image.png"} 
                alt="avatar" 
                className="relative w-16 h-16 rounded-full object-cover border border-white/10" 
              />
            </div>

            <div className="ml-4 flex flex-col items-start gap-1">
              {/* VIP Label - Compact Silver Medal Style */}
              <div className="flex items-center bg-gradient-to-r from-gray-300 via-white to-gray-400 rounded-sm pl-0.5 pr-2.5 shadow-lg h-6">
                 <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center mr-1 shadow-inner border border-white/40">
                    <TrendingUp className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                 </div>
                 <span className="text-[11px] font-black italic text-gray-700 tracking-tighter">VIP{userLevel ?? 0}</span>
              </div>
              
              {/* Username - Reduced size for better proportions */}
              <h2 className="text-white text-base font-bold tracking-wide mt-0.5">
                {nickname || "MemberNNGLSKMK"}
              </h2>
            </div>
          </div>

          {/* Exp Cards Grid - Compact and Professional */}
          <div className="grid grid-cols-2 gap-2 w-full mt-5">
            <div className="bg-[#4d1213] rounded-sm p-3 flex flex-col items-center justify-center border border-white/5 shadow-inner">
              <div className="flex items-baseline leading-none">
                <span className="text-[#f1ad3e] text-lg font-black">{userExp ?? 0}</span>
                <span className="text-[#f1ad3e] text-[10px] font-black ml-1">EXP</span>
              </div>
              <span className="text-white/20 text-[9px] mt-2 uppercase font-bold tracking-wider">My experience</span>
            </div>
            <div className="bg-[#4d1213] rounded-sm p-3 flex flex-col items-center justify-center border border-white/5 shadow-inner">
              <div className="flex items-baseline leading-none">
                <span className="text-white text-2xl font-black">8</span>
                <span className="text-white text-[10px] font-bold ml-1">Days</span>
              </div>
              <span className="text-white/20 text-[9px] mt-2 uppercase font-bold tracking-wider">Payout time</span>
            </div>
          </div>

          {/* Small Settlement Notice */}
          <div className="mt-3 py-1.5 px-3 bg-black/10 rounded border border-white/5">
            <p className="text-center text-white/20 text-[9px] leading-tight font-medium">
              VIP level rewards are settled at 2:00 am on the 1st of every month
            </p>
          </div>
        </div>

        {/* Tab Navigation closely matching the user screenshot layout */}
        <div className="sticky top-0 z-10 flex items-center justify-around border-b border-white/5 bg-[#3d0b0c] select-none py-1 mb-4 shadow-sm">
          <button
            onClick={() => setActiveVipTab('history')}
            className={`flex-1 py-3 text-sm font-bold tracking-wide transition-all duration-200 text-center relative ${
              activeVipTab === 'history'
                ? 'text-[#ffd275]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            History
            {activeVipTab === 'history' && (
              <div className="absolute bottom-0 inset-x-8 h-0.5 bg-[#ffd275]" />
            )}
          </button>
          <button
            onClick={() => setActiveVipTab('rules')}
            className={`flex-1 py-3 text-sm font-bold tracking-wide transition-all duration-200 text-center relative ${
              activeVipTab === 'rules'
                ? 'text-[#ffd275]'
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            Rules
            {activeVipTab === 'rules' && (
              <div className="absolute bottom-0 inset-x-8 h-0.5 bg-[#ffd275]" />
            )}
          </button>
        </div>

        {activeVipTab === 'rules' ? (
          /* VIP Cards Slider Area (Vertical Scroll) */
          <div className="flex flex-col gap-4 px-4 pb-20">
          {VIP_DATA.map((vip) => {
            const isLocked = userLevel < vip.level;
            const progress = Math.min(100, (userExp / vip.expRequired) * 100);
            
            return (
              <motion.div
                key={vip.level}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-white/10"
                style={{ background: vip.gradient }}
              >
              <div className="p-5 flex flex-col h-48">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-white/80" />
                      <span className="text-2xl font-black italic">VIP{vip.level}</span>
                      {isLocked && (
                        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md px-2 py-0.5 rounded-full">
                           <span className="text-[10px] font-bold">Not open yet</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-white/80 mt-1 leading-tight max-w-[150px]">
                      Upgrading VIP{vip.level} requires {vip.expRequired}EXP
                    </p>
                  </div>
                  
                  {/* Badge Icon */}
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
                    <img 
                      src={vip.icon} 
                      alt={`VIP${vip.level}`} 
                      className="w-14 h-14 object-contain"
                      onError={(e) => {
                         // Fallback if ibb.co link fails to render directly
                         (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/shapes/svg?seed=VIP${vip.level}&backgroundColor=transparent`;
                      }}
                    />
                  </div>
                </div>

                <div className="mt-auto">
                   <div className="bg-black/20 rounded-lg px-2 py-1 text-[10px] font-bold w-fit mb-2">
                      Bet ₹1 = 1EXP
                   </div>
                   
                   <div className="relative w-full h-4 bg-black/30 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="absolute left-0 top-0 h-full bg-[#ffd3d6] transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-bold text-white mix-blend-difference">
                        <span>{userExp}/{vip.expRequired}</span>
                        <span>{vip.expRequired} EXP can be leveled up</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Benefits Section for this level */}
              <div className="bg-[#30090a] p-5 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-yellow-500">💎</span>
                  <span className="text-sm font-bold">VIP{vip.level} Benefits level</span>
                </div>

                <div className="space-y-3">
                  {vip.levelUpReward && (
                    <div className="flex items-center justify-between p-3 bg-[#4d1213] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#ff3a3a]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gift className="w-6 h-6 text-[#ff3a3a]" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
                            {selectedLang === 'en' ? 'Level up rewards' : 'लेवल अप पुरस्कार'}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {selectedLang === 'en' ? 'Each account can only receive 1 time' : 'प्रत्येक खाता केवल 1 बार प्राप्त कर सकता है'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-500 mr-1">₹{vip.levelUpReward}</span>
                        {claimedVipRewards.includes(vip.level) ? (
                          <div className="bg-neutral-600/30 border border-neutral-600/20 text-neutral-400 text-[10px] px-2.5 py-1 rounded font-bold uppercase select-none">
                            {selectedLang === 'en' ? 'Received' : 'प्राप्त किया'}
                          </div>
                        ) : userLevel >= vip.level ? (
                          <button
                            onClick={() => onClaimReward(vip.level, vip.levelUpReward!)}
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:brightness-110 active:scale-95 text-black text-[10px] px-3 py-1.5 rounded-sm font-bold transition-all uppercase cursor-pointer"
                          >
                            {selectedLang === 'en' ? 'Receive' : 'प्राप्त करें'}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-white/5 border border-white/5 text-white/20 text-[10px] px-2.5 py-1 rounded font-bold uppercase cursor-not-allowed select-none"
                          >
                            {selectedLang === 'en' ? 'Locked' : 'लॉक है'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {vip.monthlyReward && (
                    <div className="flex items-center justify-between p-3 bg-[#4d1213] rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-6 h-6 text-orange-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold">
                            {selectedLang === 'en' ? 'Monthly reward' : 'मासिक पुरस्कार'}
                          </span>
                          <span className="text-[10px] text-white/40">
                            {selectedLang === 'en' ? 'Each account can only receive 1 time per month' : 'प्रत्येक खाता महीने में केवल 1 बार प्राप्त कर सकता है'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-yellow-500 mr-1">₹{vip.monthlyReward}</span>
                        {claimedMonthlyRewards.includes(vip.level) ? (
                          <div className="bg-neutral-600/30 border border-neutral-600/20 text-neutral-400 text-[10px] px-2.5 py-1 rounded font-bold uppercase select-none">
                            {selectedLang === 'en' ? 'Received' : 'प्राप्त किया'}
                          </div>
                        ) : userLevel >= vip.level ? (
                          <button
                            onClick={() => onClaimMonthlyReward?.(vip.level, vip.monthlyReward!)}
                            className="bg-gradient-to-r from-orange-400 to-amber-500 hover:brightness-110 active:scale-95 text-black text-[10px] px-3 py-1.5 rounded-sm font-bold transition-all uppercase cursor-pointer"
                          >
                            {selectedLang === 'en' ? 'Receive' : 'प्राप्त करें'}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-white/5 border border-white/5 text-white/20 text-[10px] px-2.5 py-1 rounded font-bold uppercase cursor-not-allowed select-none"
                          >
                            {selectedLang === 'en' ? 'Locked' : 'लॉक है'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 bg-[#4d1213] rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                         <Percent className="w-6 h-6 text-yellow-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">
                          {selectedLang === 'en' ? 'Rebate rate' : 'रिबेट दर'}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {selectedLang === 'en' ? 'Increase income of rebate' : 'रिबेट की आय बढ़ाएं'}
                        </span>
                      </div>
                    </div>
                    <div className="bg-yellow-500/20 px-3 py-1 rounded text-yellow-500 text-xs font-bold">
                      {vip.rebateRate}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
        </div>
        ) : (
          /* History Area perfectly styled matching the screenshots */
          <div className="flex flex-col gap-3 px-4 pb-20 font-sans">
            {getHistoryRecords().map((item, idx) => (
              <div
                key={idx}
                className="bg-[#4d1213] rounded-xl p-4 border border-white/5 shadow-md flex items-center justify-between hover:brightness-110 transition-all duration-200"
              >
                <div className="flex flex-col gap-1 pr-2">
                  <span
                    className="text-sm font-extrabold tracking-wide"
                    style={{ color: item.color }}
                  >
                    {item.title}
                  </span>
                  <span className="text-[11px] text-white/50 leading-tight font-medium">
                    {item.subtitle}
                  </span>
                  <span className="text-[10px] text-white/20 font-mono mt-0.5">
                    {item.timestamp}
                  </span>
                </div>

                <div className="flex-shrink-0 flex items-center">
                  {item.rewards ? (
                    <div className="flex gap-2">
                      {item.rewards.map((reward: any, rIdx: number) => (
                        <div
                          key={rIdx}
                          className="flex items-center gap-1 px-3 py-1.5 rounded bg-black/20 border text-[11px] font-black animate-pulse"
                          style={{
                            borderColor: reward.amount === '0' ? 'rgba(255,255,255,0.08)' : 'rgba(255,187,13,0.3)',
                            color: reward.amount === '0' ? 'rgba(255,255,255,0.3)' : '#ffe49e'
                          }}
                        >
                          <span className="text-xs leading-none">{reward.icon}</span>
                          <span className="font-mono">{reward.amount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span
                      className="text-[11px] font-black font-mono px-2.5 py-1.5 rounded bg-black/15 text-right"
                      style={{ color: item.valColor || '#4ade80' }}
                    >
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="text-center py-8">
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest block">
                No more
              </span>
            </div>
          </div>
        )}
    </div>
  </div>
);
};

export default VipLevelsView;
