import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const newHistoryStart = `                             currentMyBets.map((historyItem, idx) => {`;
const newHistoryEnd = `                                 );
                               })`;

const oldHistoryStr = `                             currentMyBets.map((historyItem, idx) => {
                                 const realIdx = (myHistoryPage - 1) * 10 + idx;
                                 // Determine Icon styling based on choice
                                 let iconBg = "";
                                 let iconText = "text-white";
                                 let iconStyle = {};
                                 const choice = historyItem.userChoice;
                                 if (choice === 'Big') {
                                   iconBg = "bg-[#ffbb0d]";
                                   iconText = "text-[#4d1213]";
                                 } else if (choice === 'Small') {
                                   iconBg = "bg-[#4285f4]";
                                 } else if (choice === 'Red') {
                                   iconBg = "bg-[#ff4148]";
                                 } else if (choice === 'Green') {
                                   iconBg = "bg-[#15be75]";
                                 } else if (choice === 'Violet') {
                                   iconBg = "bg-[#c742e4]";
                                 } else if (typeof choice === 'number') {
                                   // Rules for number bets: split background for 0 and 5
                                   if (choice === 0) iconStyle = { background: 'linear-gradient(135deg, #ff4148 50%, #c742e4 50%)' };
                                   else if (choice === 5) iconStyle = { background: 'linear-gradient(135deg, #15be75 50%, #c742e4 50%)' };
                                   else if ([1,3,7,9].includes(choice)) iconBg = "bg-[#15be75]";
                                   else iconBg = "bg-[#ff4148]";
                                 } else {
                                   iconBg = "bg-[#341113]";
                                 }
                                 const betKey = \`\${activeWingoRoom || '30s'}_\${historyItem.period}_\${historyItem.userChoice}_\${realIdx}\`;
                                 const isExpanded = expandedBetKey === betKey;
                                 return (
                                   <div key={realIdx} className="flex flex-col mb-1 shadow-xl animate-in fade-in slide-in-from-bottom-2">
                                     <div
                                          onClick={() => setExpandedBetKey(isExpanded ? null : betKey)}
                                         className={\`w-full p-4 flex items-center justify-between cursor-pointer border border-white/[0.04] transition-all active:scale-[0.98] \${isExpanded ? 'rounded-t-2xl' : 'rounded-2xl'}\`}
                                         style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}>
                                       <div className="flex items-center gap-4">
                                         <div
                                            className={\`h-[38px] w-[44px] rounded-[12px] flex items-center justify-center font-black text-[13px] select-none shadow-lg border border-white/10 \${iconBg} \${iconText}\`}
                                           style={iconStyle}
                                         >
                                           {historyItem.userChoice !== undefined ? historyItem.userChoice : historyItem.size}
                                         </div>
                                         <div className="flex flex-col gap-1">
                                           <div className="flex items-center gap-1.5">
                                             <span className="text-[15px] font-bold text-white tracking-tight leading-none">{historyItem.period}</span>
                                             <span className={\`text-white/40 text-[10px] transition-transform duration-300 \${isExpanded ? 'rotate-180' : ''}\`}>▼</span>
                                           </div>
                                           <span className="text-[11px] text-white/30 font-medium font-sans">{historyItem.timestamp}</span>
                                         </div>
                                       </div>
                                       <div className="flex flex-col items-end justify-center min-w-[90px]">
                                           <div className={\`px-4 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border mb-1.5 \${!historyItem.resolved ? 'bg-[#ffbc0d]/10 text-[#ffbc0d] border-[#ffbc0d]/30' : historyItem.winLoss === 'Win' ? 'bg-[#15be75]/10 text-[#15be75] border-[#15be75]/30' : 'bg-transparent text-white/30 border-white/10 opacity-60'}\`}>
                                             {!historyItem.resolved ? 'PENDING' : historyItem.winLoss === 'Win' ? 'SUCCEED' : 'FAILED'}
                                           </div>
                                           <span className={\`text-[14px] font-black font-sans tracking-tight \${!historyItem.resolved ? 'text-white/60' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]/90'}\`}>
                                             {!historyItem.resolved ? '' : historyItem.winLoss === 'Win' ? '+' : '-'}₹{!historyItem.resolved ? historyItem.betAmount.toFixed(2) : (historyItem.winLoss === 'Win' ? (historyItem.betAmount * (typeof historyItem.userChoice === 'number' ? 8.82 : historyItem.userChoice === 'Violet' ? 4.41 : (historyItem.userChoice === 'Green' && historyItem.color === 'Green+Violet') ? 1.47 : (historyItem.userChoice === 'Red' && historyItem.color === 'Red+Violet') ? 1.47 : 1.96)).toFixed(2) : historyItem.betAmount.toFixed(2))}
                                           </span>
                                       </div>
                                     </div>
                                     <AnimatePresence>
                                       {isExpanded && (
                                         <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="w-full bg-[#1e0506]/95 rounded-b-2xl border border-t-0 border-white/[0.04] overflow-hidden"
                                          >
                                            <div className="p-4 flex flex-col gap-3 font-sans text-[13px] text-white/70">
                                                                                            <div className="flex justify-between items-center bg-[#2a0e10]/60 p-2.5 rounded-md border border-white/5">
                                                <span>{selectedLang === 'en' ? 'Order number' : 'ऑर्डर संख्या'}</span>
                                                <div className="flex items-center gap-1.5 font-mono text-[11px] text-white/90">
                                                  {(() => {
                                                    const orderNum = \`WG\${historyItem.period}\${Math.abs(\`\${historyItem.period}_\${historyItem.userChoice}_\${historyItem.timestamp}\`.split("").reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString().padStart(10, '3')}\`;
                                                    return (
                                                      <>
                                                        {orderNum}
                                                        <Copy className="h-3.5 w-3.5 text-white/50 cursor-pointer active:scale-90" onClick={() => navigator.clipboard.writeText(orderNum)} />
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Period' : 'अवधि'}</span>
                                                <span className="font-mono text-white/90">{historyItem.period}</span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Purchase amount' : 'खरीद राशि'}</span>
                                                <span className="font-mono text-white/90">₹{historyItem.betAmount.toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Quantity' : 'मात्रा'}</span>
                                                <span className="font-mono text-white/90">1</span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Amount after tax' : 'कर के बाद राशि'}</span>
                                                <span className="font-mono text-[#ff4148] font-medium">₹{(historyItem.betAmount * 0.98).toFixed(2)}</span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Tax' : 'कर'}</span>
                                                <span className="font-mono text-white/90">₹{(historyItem.betAmount * 0.02).toFixed(2)}</span>
                                              </div>
                                              {historyItem.resolved && (
                                                <div className="flex justify-between items-center px-1">
                                                  <span>{selectedLang === 'en' ? 'Result' : 'परिणाम'}</span>
                                                  <div className="flex items-center gap-1.5 font-medium">
                                                    <span className={historyItem.color === 'Green' ? 'text-[#15be75]' : historyItem.color === 'Red' ? 'text-[#ff4148]' : 'text-[#c742e4]'}>
                                                      {historyItem.number} {historyItem.color} {historyItem.size}
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Select' : 'चुनें'}</span>
                                                <span className="font-medium text-white/90">{historyItem.userChoice}</span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Status' : 'स्थिति'}</span>
                                                <span className={\`font-medium \${!historyItem.resolved ? 'text-[#ffbc0d]' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]'}\`}>
                                                  {!historyItem.resolved ? (selectedLang === 'en' ? 'Pending' : 'लंबित') : historyItem.winLoss === 'Win' ? (selectedLang === 'en' ? 'Succeed' : 'सफल') : (selectedLang === 'en' ? 'Failed' : 'विफल')}
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center px-1">
                                                <span>{selectedLang === 'en' ? 'Win/lose' : 'जीत/हार'}</span>
                                                <span className={\`font-mono font-medium tracking-tight \${!historyItem.resolved ? 'text-white/60' : historyItem.winLoss === 'Win' ? 'text-[#15be75]' : 'text-[#ff4148]'}\`}>
                                                  {!historyItem.resolved ? '₹0.00' : historyItem.winLoss === 'Win' ? \`+₹\${(historyItem.betAmount * (typeof historyItem.userChoice === 'number' ? 8.82 : historyItem.userChoice === 'Violet' ? 4.41 : (historyItem.userChoice === 'Green' && historyItem.color === 'Green+Violet') ? 1.47 : (historyItem.userChoice === 'Red' && historyItem.color === 'Red+Violet') ? 1.47 : 1.96)).toFixed(2)}\` : \`-₹\${historyItem.betAmount.toFixed(2)}\`}
                                                </span>
                                              </div>
                                              <div className="flex justify-between items-center px-1 border-t border-white/5 pt-3 mt-1">
                                                <span>{selectedLang === 'en' ? 'Order time' : 'ऑर्डर का समय'}</span>
                                                <span className="font-mono text-white/50 text-[11px]">{historyItem.timestamp}</span>
                                              </div>
                                            </div>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  );
                                })`;

const startIndex = code.indexOf(newHistoryStart);
const endIndex = code.indexOf(newHistoryEnd) + newHistoryEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + oldHistoryStr + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Reverted successfully!");
} else {
  console.log("Could not find the block to revert", { startIndex, endIndex });
}
