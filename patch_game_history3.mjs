import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStart = `                      return myBets.map((bet: any, idx: number) => {
                        const isWin = bet.winLoss === 'Win';`;

const targetEnd = `                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>`;

const newCode = `                      return myBets.map((bet: any, idx: number) => {
                        const isWin = bet.winLoss === 'Win';
                        const displayPeriod = bet.period;
                        const orderNum = \`WG\${bet.period}\${Math.abs(\`\${bet.period}_\${bet.userChoice}_\${bet.timestamp}\`.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString().padStart(10, '3')}\`;

                        let payoutMultiplier = 1.96;
                        if (typeof bet.userChoice === 'number') payoutMultiplier = 8.82;
                        else if (bet.userChoice === 'Violet') payoutMultiplier = 4.41;
                        else if (bet.userChoice === 'Green' && bet.color === 'Green+Violet') payoutMultiplier = 1.47;
                        else if (bet.userChoice === 'Red' && bet.color === 'Red+Violet') payoutMultiplier = 1.47;

                        const winnings = isWin ? bet.betAmount * payoutMultiplier : 0;
                        const profitLoss = isWin ? winnings - bet.betAmount : -bet.betAmount;

                        return (
                          <div key={idx} className="mb-4 bg-[#3d0f10] rounded-xl overflow-hidden shadow-lg border border-white/5 font-sans relative w-full">
                            {/* Header */}
                            <div className="flex justify-between items-start p-4">
                              <div className="flex flex-col">
                                <span className="text-white font-bold text-lg">Win Go</span>
                                <span className="text-white/40 text-xs mt-0.5">{bet.timestamp || 'Just now'}</span>
                              </div>
                              <div className={\`text-base font-bold \${!bet.resolved ? 'text-[#ffbc0d]' : isWin ? 'text-[#15be75]' : 'text-[#ffcf24]'}\`}>
                                {!bet.resolved ? 'Pending' : isWin ? 'Win' : 'Lose'}
                              </div>
                            </div>

                            {/* Details List */}
                            <div className="px-4 pb-2 space-y-2.5 relative">
                              {/* Type */}
                              <div className="flex justify-between items-center text-sm relative">
                                <div className="absolute left-[3px] top-[14px] bottom-[-14px] w-[1px] border-l border-dashed border-white/20" />
                                <div className="flex items-center gap-2 z-10 bg-[#3d0f10]">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0" />
                                  <span className="text-white/70">Type</span>
                                </div>
                                <span className="text-white">Win Go {gameHistoryOverlayRoom === '30s' ? '30s' : gameHistoryOverlayRoom === '1m' ? '1Min' : gameHistoryOverlayRoom === '3m' ? '3Min' : '5Min'}</span>
                              </div>
                              {/* Period */}
                              <div className="flex justify-between items-center text-sm relative">
                                <div className="absolute left-[3px] top-[14px] bottom-[-14px] w-[1px] border-l border-dashed border-white/20" />
                                <div className="flex items-center gap-2 z-10 bg-[#3d0f10]">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0" />
                                  <span className="text-white/70">Period</span>
                                </div>
                                <span className="text-white font-mono">{displayPeriod}</span>
                              </div>
                              {/* Order number */}
                              <div className="flex justify-between items-center text-sm relative">
                                <div className="absolute left-[3px] top-[14px] bottom-[-14px] w-[1px] border-l border-dashed border-white/20" />
                                <div className="flex items-center gap-2 z-10 bg-[#3d0f10]">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0" />
                                  <span className="text-white/70">Order number</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-white font-mono text-[11.5px]">{orderNum}</span>
                                  <Copy className="h-3.5 w-3.5 text-white/50 cursor-pointer active:scale-90" onClick={() => navigator.clipboard.writeText(orderNum)} />
                                </div>
                              </div>
                              {/* Select */}
                              <div className="flex justify-between items-center text-sm relative">
                                <div className="absolute left-[3px] top-[14px] bottom-[-14px] w-[1px] border-l border-dashed border-white/20" />
                                <div className="flex items-center gap-2 z-10 bg-[#3d0f10]">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0" />
                                  <span className="text-white/70">Select</span>
                                </div>
                                <span className="text-white">{bet.userChoice !== undefined ? bet.userChoice : bet.size}</span>
                              </div>
                              {/* Total bet */}
                              <div className="flex justify-between items-center text-sm relative">
                                <div className="flex items-center gap-2 z-10 bg-[#3d0f10]">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0" />
                                  <span className="text-white/70">Total bet</span>
                                </div>
                                <span className="text-white font-mono">₹{bet.betAmount.toFixed(2)}</span>
                              </div>
                            </div>

                            <div className="mx-4 my-3 border-t border-dashed border-white/20" />

                            {/* Lottery Results */}
                            <div className="px-4 pb-4">
                              <div className="flex items-center gap-2 mb-3 relative">
                                <div className="absolute left-[3px] top-[14px] bottom-[-24px] w-[1px] border-l border-dashed border-white/20" />
                                <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0 z-10 bg-[#3d0f10]" />
                                <span className="text-white/70 text-sm">Lottery results</span>
                              </div>
                              
                              {bet.resolved ? (
                                <div className="flex items-center gap-2.5 pl-3 mb-5 relative">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0 z-10 bg-[#3d0f10] -ml-[13px]" />
                                  
                                  {/* Ball */}
                                  <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold \${bet.color === 'Green' ? 'bg-[#15be75] text-white' : bet.color === 'Red' ? 'bg-[#ff4148] text-white' : 'bg-[#c742e4] text-white'}\`}>
                                     {bet.number}
                                  </div>
                                  {/* Size */}
                                  <div className={\`px-3 py-1 rounded text-[13px] font-medium text-white \${bet.size === 'Big' ? 'bg-[#ffcf24] text-black' : 'bg-[#4285f4]'}\`}>
                                    {bet.size}
                                  </div>
                                  {/* Color */}
                                  <div className={\`px-3 py-1 rounded text-[13px] font-medium text-white \${bet.color === 'Green' ? 'bg-[#15be75]' : bet.color === 'Red' ? 'bg-[#ff4148]' : bet.color === 'Violet' ? 'bg-[#c742e4]' : 'bg-gradient-to-r from-[#15be75] to-[#c742e4]'}\`}>
                                    {bet.color}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 pl-3 mb-5 relative">
                                  <div className="w-1.5 h-1.5 rounded-full border-2 border-[#ffcf24] shrink-0 z-10 bg-[#3d0f10] -ml-[13px]" />
                                  <span className="text-white/40 text-[13px] italic">Waiting for results...</span>
                                </div>
                              )}

                              {/* 2x2 Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[#2c1012] rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
                                  <span className="text-white/90 text-[15px] font-mono">₹{(bet.betAmount * 0.98).toFixed(2)}</span>
                                  <span className="text-white/50 text-[12px] mt-0.5">Actual amount</span>
                                </div>
                                <div className="bg-[#2c1012] rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
                                  <span className={\`text-[15px] font-mono \${winnings > 0 ? 'text-[#15be75]' : 'text-white/50'}\`}>
                                    ₹{bet.resolved ? winnings.toFixed(2) : '0.00'}
                                  </span>
                                  <span className="text-white/50 text-[12px] mt-0.5">Winnings</span>
                                </div>
                                <div className="bg-[#2c1012] rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
                                  <span className="text-white/90 text-[15px] font-mono">₹{(bet.betAmount * 0.02).toFixed(2)}</span>
                                  <span className="text-white/50 text-[12px] mt-0.5">Handling fee</span>
                                </div>
                                <div className="bg-[#2c1012] rounded-lg p-3 flex flex-col items-center justify-center border border-white/5">
                                  <span className={\`text-[15px] font-mono \${!bet.resolved ? 'text-white/50' : profitLoss > 0 ? 'text-[#15be75]' : 'text-[#ffcf24]'}\`}>
                                    {!bet.resolved ? '₹0.00' : profitLoss > 0 ? \`+₹\${profitLoss.toFixed(2)}\` : \`-₹\${Math.abs(profitLoss).toFixed(2)}\`}
                                  </span>
                                  <span className="text-white/50 text-[12px] mt-0.5">Profit/loss</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    }
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd) + targetEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the block to replace", { startIndex, endIndex });
}
