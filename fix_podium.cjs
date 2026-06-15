const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const updatedPodium = `                         {/* Podium Container */}
                         <div className="flex items-end justify-center w-full max-w-[400px] mx-auto h-[160px] relative">
                             {/* Rank 3 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-[1.5px] border-[#d1b22e] bg-[#222] mb-[-10px] z-20 top-[-2px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[2].img} className="w-full h-full object-cover" alt="Rank 3" />
                                </div>
                                <div className="w-full h-[95px] bg-gradient-to-b from-[#bda028] to-[#6d5b12] flex flex-col items-center justify-end pb-[6px] custom-clip-rank3">
                                   <div className="text-3xl font-black text-[#ffea8a] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-0.5 font-serif transform translate-x-[4px]">3</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5 max-w-full truncate px-1">{MOCK_PODIUM[2].name}</div>
                                   <div className="text-[9.5px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[2].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                             
                             {/* Rank 1 */}
                             <div className="w-[45%] flex flex-col items-center justify-end relative z-30 mx-[-8px]">
                                <div className="absolute top-[-36px] z-40 text-4xl overflow-visible flex justify-center items-center h-12 w-12 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24">
                                    <defs>
                                      <linearGradient id="gold" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#FFF200" />
                                        <stop offset="30%" stopColor="#FFC300" />
                                        <stop offset="100%" stopColor="#B37D00" />
                                      </linearGradient>
                                      <linearGradient id="jewel" x1="0%" y1="0%" x2="0%" y2="100%">
                                         <stop offset="0%" stopColor="#FF3333" />
                                         <stop offset="100%" stopColor="#AA0000" />
                                      </linearGradient>
                                    </defs>
                                    <path fill="url(#gold)" d="M2.5 19h19v2h-19zm2-2l-2.5-9.5 5.5 3.5 4.5-8 4.5 8 5.5-3.5-2.5 9.5z" stroke="#664400" strokeWidth="0.5" strokeLinejoin="round"/>
                                    <circle cx="12" cy="5" r="1.5" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                    <circle cx="4.5" cy="11" r="1.2" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                    <circle cx="19.5" cy="11" r="1.2" fill="url(#jewel)" stroke="#440000" strokeWidth="0.5"/>
                                  </svg>
                                </div>
                                <div className="w-[60px] h-[60px] rounded-full overflow-hidden border-2 border-[#1ac29a] bg-[#222] mb-[-12px] z-20 relative shadow-[0_4px_10px_rgba(0,0,0,0.7)] object-cover">
                                  <img src={MOCK_PODIUM[0].img} className="w-full h-full object-cover" alt="Rank 1" />
                                </div>
                                <div className="w-full h-[125px] bg-gradient-to-b from-[#1ac29a] to-[#0d5945] flex flex-col items-center justify-end pb-2 custom-clip-rank1">
                                   <div className="text-[40px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] mb-1 font-serif leading-none mt-2">1</div>
                                   <div className="text-[11px] text-white font-bold tracking-tight mb-0.5 px-1 truncate max-w-full">{MOCK_PODIUM[0].name}</div>
                                   <div className="text-[11px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[0].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>

                             {/* Rank 2 */}
                             <div className="w-1/3 flex flex-col items-center justify-end relative z-10">
                                <div className="w-[45px] h-[45px] rounded-full overflow-hidden border-[1.5px] border-[#23b9d6] bg-[#222] mb-[-10px] z-20 top-[-2px] relative shadow-[0_4px_8px_rgba(0,0,0,0.6)] object-cover">
                                  <img src={MOCK_PODIUM[1].img} className="w-full h-full object-cover" alt="Rank 2" />
                                </div>
                                <div className="w-full h-[95px] bg-gradient-to-b from-[#25a5be] to-[#0f5463] flex flex-col items-center justify-end pb-[6px] custom-clip-rank2">
                                   <div className="text-3xl font-black text-[#c3f4ff] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mb-0.5 font-serif transform -translate-x-[4px]">2</div>
                                   <div className="text-[10px] text-white font-bold tracking-tight mb-0.5 max-w-full truncate px-1">{MOCK_PODIUM[1].name}</div>
                                   <div className="text-[9.5px] font-black text-[#5df0a6]">₹{MOCK_PODIUM[1].amount.toLocaleString('en-IN', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                                </div>
                             </div>
                         </div>
`;

content = content.replace(/\{\/\* Podium Container \*\/\}[\s\S]*?\{\/\* Leaderboard Details \*\/\}/, updatedPodium + '\n                         {/* Leaderboard Details */}');

fs.writeFileSync('src/App.tsx', content);
