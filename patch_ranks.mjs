import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const rankDataStr = `
const MOCK_WINNERS = [
  { name: 'Mem***VIX', amount: 19.60, game: 'Wingo' },
  { name: 'Mem***FLT', amount: 19.60, game: 'Wingo' },
  { name: 'Mem***FSS', amount: 215.60, game: 'Wingo' },
  { name: 'Mem***SAF', amount: 39.20, game: 'Wingo' },
  { name: 'Mem***PLA', amount: 215.60, game: 'Wingo' },
  { name: 'VIP***09X', amount: 480.00, game: 'Wingo' },
  { name: 'Mem***B2M', amount: 18.00, game: 'Slots' }
];

const MOCK_PODIUM = [
  { rank: 1, name: 'Mem***G1X', amount: 3001900520.08, img: 'https://i.pravatar.cc/150?img=47' },
  { rank: 2, name: 'Mem***DOE', amount: 124928436.08, img: 'https://i.pravatar.cc/150?img=32' },
  { rank: 3, name: 'Mem***C3W', amount: 186398091.32, img: 'https://i.pravatar.cc/150?img=5' }
];

const MOCK_LEADERBOARD = [
  { rank: 4, name: 'Mem***QKV', amount: 8004389.12, img: 'https://i.pravatar.cc/150?img=11' },
  { rank: 5, name: 'Mem***RT6', amount: 7256562.88, img: 'https://i.pravatar.cc/150?img=9' },
  { rank: 6, name: 'NIN***PRO', amount: 6910293.60, img: 'https://i.pravatar.cc/150?img=12' },
  { rank: 7, name: 'Mem***0PJ', amount: 4214000.00, img: 'https://i.pravatar.cc/150?img=1' },
  { rank: 8, name: 'Mem***FVJ', amount: 3410498.00, img: 'https://i.pravatar.cc/150?img=40' },
  { rank: 9, name: 'Vip***am', amount: 3191860.00, img: 'https://i.pravatar.cc/150?img=4' },
  { rank: 10, name: 'Mem***WJ2', amount: 2286017.58, img: 'https://i.pravatar.cc/150?img=31' }
];
`;

content = content.replace("const ANNOUNCEMENTS = [", rankDataStr + "\nconst ANNOUNCEMENTS = [");

const rankComponentStr = `
                    {/* Winning Information & Players of the Month Sections */}
                    <div className="px-4 mt-6">
                      
                      {/* Section: Winning Information */}
                      <div className="flex justify-center mb-6">
                        <div className="bg-gradient-to-r from-[#880d1e] via-[#c61a30] to-[#880d1e] text-white px-8 py-2 font-black uppercase text-base shadow-[0_4px_10px_rgba(200,20,40,0.5)] max-w-max relative w-[250px] text-center" style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0 100%)' }}>
                          WINNING INFORMATION
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-10 overflow-hidden relative" style={{ height: '360px' }}>
                        <div className="animate-auto-scroll flex flex-col gap-3">
                          {[...MOCK_WINNERS, ...MOCK_WINNERS].map((w, i) => (
                            <div key={i} className="flex gap-3 bg-[#421d1d] border border-[#ff3e3e]/20 p-3 rounded-lg shadow-md items-center">
                              <div className="w-[50px] h-[50px] rounded flex-shrink-0 bg-gradient-to-bl from-blue-400 to-cyan-500 overflow-hidden relative border-2 border-yellow-400 flex items-center justify-center shadow-[0_0_8px_rgba(255,200,0,0.5)]">
                                <div className="absolute top-0 right-0 bg-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black text-blue-600 border border-yellow-400 z-20">1</div>
                                <span className="text-[10px] font-black italic text-white z-20 bottom-1 absolute drop-shadow-md">WINGO</span>
                                {/* Background graphics for the wingo icon imitation */}
                                <div className="absolute inset-0 opacity-40 blur-[1px] z-10 flex items-center justify-center text-[30px]">
                                   👑
                                </div>
                              </div>
                              <div className="flex-col w-full">
                                <div className="text-[13px] font-bold text-white mb-0.5">{w.name}</div>
                                <div className="text-[10px] text-white/50 mb-0.5">The member has won this much of money Rs:</div>
                                <div className="text-sm font-black text-[#6dffb8]">₹{w.amount.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Section: Players of the Month */}
                      <div className="flex justify-center mb-10">
                        <div className="bg-gradient-to-r from-[#880d1e] via-[#c61a30] to-[#880d1e] text-white px-8 py-2 font-black uppercase text-base tracking-widest shadow-[0_4px_10px_rgba(200,20,40,0.5)] relative max-w-max w-[250px] text-center" style={{ clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)' }}>
                          PLAYERS OF<br/>THE MONTH
                        </div>
                      </div>

                      <div className="relative mb-6">
                         {/* Podium Container */}
                         <div className="flex items-end justify-center w-full max-w-[400px] mx-auto h-[160px] relative">
                             {/* Rank 3 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-[#d1b22e] bg-[#222] mb-[-12px] z-20 top-[-6px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[2].img} className="w-full h-full object-cover" alt="Rank 3" />
                                </div>
                                <div className="w-full h-[85px] bg-gradient-to-b from-[#d1b22e] to-[#6d5b12] flex flex-col items-center justify-end pb-2 custom-clip-rank3">
                                   <div className="text-3xl font-black text-white/90 drop-shadow-md mb-1 font-serif">3</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5">{MOCK_PODIUM[2].name}</div>
                                   <div className="text-[10px] font-black text-[#6dffb8]">₹{MOCK_PODIUM[2].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                             
                             {/* Rank 1 */}
                             <div className="w-[45%] flex flex-col items-center justify-end relative z-30 mx-[-8px]">
                                <div className="absolute top-[-30px] z-40 text-4xl">👑</div>
                                <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-[#1ac29a] bg-[#222] mb-[-16px] z-20 relative shadow-[0_4px_10px_rgba(0,0,0,0.7)] object-cover">
                                  <img src={MOCK_PODIUM[0].img} className="w-full h-full object-cover" alt="Rank 1" />
                                </div>
                                <div className="w-full h-[115px] bg-gradient-to-b from-[#1ac29a] to-[#0d5945] flex flex-col items-center justify-end pb-3 custom-clip-rank1">
                                   <div className="text-4xl font-black text-white drop-shadow-lg mb-1 font-serif">1</div>
                                   <div className="text-[11px] text-white font-bold tracking-tight mb-0.5">{MOCK_PODIUM[0].name}</div>
                                   <div className="text-[11px] font-black text-[#6dffb8]">₹{MOCK_PODIUM[0].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>

                             {/* Rank 2 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-2 border-[#23b9d6] bg-[#222] mb-[-12px] z-20 top-[-6px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[1].img} className="w-full h-full object-cover" alt="Rank 2" />
                                </div>
                                <div className="w-full h-[85px] bg-gradient-to-b from-[#23b9d6] to-[#0f5463] flex flex-col items-center justify-end pb-2 custom-clip-rank2">
                                   <div className="text-3xl font-black text-white/90 drop-shadow-md mb-1 font-serif">2</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5">{MOCK_PODIUM[1].name}</div>
                                   <div className="text-[10px] font-black text-[#6dffb8]">₹{MOCK_PODIUM[1].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                         </div>

                         {/* Leaderboard Details */}
                         <div className="bg-[#4a1215] rounded-xl flex flex-col my-6 divide-y divide-[#ff3e3e]/10 border border-[#ff3e3e]/20 overflow-hidden shadow-lg">
                           {MOCK_LEADERBOARD.map((item, idx) => (
                             <div key={idx} className="flex items-center px-4 py-3 bg-[#4a1215] hover:bg-[#5f1c21] transition">
                                <div className="w-6 font-bold text-lg text-white/80">{item.rank}</div>
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 mx-3 relative bg-black/30">
                                   <img src={item.img} className="w-full h-full object-cover" alt={item.name} />
                                </div>
                                <div className="text-white text-sm flex-1 font-medium">{item.name}</div>
                                <div className="text-[#a53b51] font-black tracking-wide text-sm font-sans drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                                   ₹{item.amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                </div>
                             </div>
                           ))}
                         </div>
                      </div>

                    </div>
`;

content = content.replace("{/* Visual Disclaimer footer inside lobby */}", rankComponentStr + "\n                    {/* Visual Disclaimer footer inside lobby */}");

fs.writeFileSync('src/App.tsx', content);

let cssContent = fs.readFileSync('src/index.css', 'utf-8');
const clipCss = \`
.custom-clip-rank3 {
  clip-path: polygon(0 30px, 100% 0, 100% 100%, 0 100%);
}
.custom-clip-rank1 {
  clip-path: polygon(50% 0, 100% 30px, 100% 100%, 0% 100%, 0 30px);
}
.custom-clip-rank2 {
  clip-path: polygon(0 0, 100% 30px, 100% 100%, 0 100%);
}

@keyframes auto-scroll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-50%); }
}

.animate-auto-scroll {
  animation: auto-scroll 15s linear infinite;
}
.animate-auto-scroll:hover {
  animation-play-state: paused;
}
\`;
if (!cssContent.includes("custom-clip-rank3")) {
  cssContent += clipCss;
  fs.writeFileSync('src/index.css', cssContent);
}

