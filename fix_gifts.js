const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = code.split('\n');

const startIdx = lines.findIndex(l => l.includes('{/* FULL SCREEN GIFTS OVERLAY */}'));
const endIdx = lines.findIndex(l => l.includes('{/* SETTINGS OVERLAY - REDESIGNED AS MODAL PER SCREENSHOT */}'));

if (startIdx !== -1 && endIdx !== -1) {
    const newSection = `          {/* FULL SCREEN GIFTS OVERLAY */}
          <AnimatePresence>
            {showGiftsOverlay && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[200] bg-[#2b0d0e] flex flex-col font-sans select-none pointer-events-auto mx-auto max-w-[410px]"
              >
                {/* Header */}
                <div className="bg-[#4d1618] h-[55px] flex items-center px-2 shrink-0">
                  <button 
                    onClick={() => setShowGiftsOverlay(false)}
                    className="w-12 h-12 flex items-center justify-center text-white active:bg-white/5 rounded-full cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <h2 className="flex-1 text-center text-white font-medium text-[17px] mr-12">
                    {selectedLang === 'en' ? 'Gift' : 'उपहार'}
                  </h2>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col pb-12">
                  
                  {/* Full width banner */}
                  <div className="w-full aspect-[21/9] bg-[#2b0d0e] relative">
                    <img 
                      src="https://i.ibb.co/YBYym3PG/gift-banner.jpg" 
                      alt="Gift Banner"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "https://i.ibb.co/n0k8JQK/gift-banner-fallback.jpg"; // fallback if ibb goes down
                      }}
                    />
                  </div>

                  {/* Redemption Card */}
                  <div className="px-4 mt-4">
                    <div className="bg-[#3b1415] rounded-[10px] p-5 shadow-sm">
                      <div className="space-y-1 mb-5">
                        <p className="text-white/60 text-[14px]">
                          {selectedLang === 'en' ? 'Hi' : 'नमस्ते'}
                        </p>
                        <p className="text-white/60 text-[14px]">
                          {selectedLang === 'en' ? 'We have a gift for you' : 'हमारे पास आपके लिए एक उपहार है'}
                        </p>
                      </div>

                      <h3 className="text-white text-[15px] mb-3">
                        {selectedLang === 'en' ? 'Please enter the gift code below' : 'कृपया नीचे उपहार कोड दर्ज करें'}
                      </h3>

                      <div className="space-y-4">
                        <input 
                          type="text"
                          placeholder={selectedLang === 'en' ? 'Please enter gift code' : 'कृपया उपहार कोड दर्ज करें'}
                          className="w-full bg-[#240b0c] outline-none text-white px-5 py-3.5 rounded-full text-[14px] placeholder:text-white/30 transition-all font-medium"
                          value={giftCodeInput}
                          onChange={(e) => setGiftCodeInput(e.target.value.toUpperCase())}
                        />

                        <button 
                          disabled={claimingGift}
                          onClick={async () => {
                            if (!isLoggedIn || !auth.currentUser) {
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' ? 'Please log in first' : 'कृपया पहले लॉग इन करें'
                              });
                              return;
                            }
                            const code = giftCodeInput.trim().toUpperCase();
                            if (!code || code.length < 3) {
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' ? 'Invalid gift code format' : 'अमान्य उपहार कोड प्रारूप'
                              });
                              return;
                            }

                            setClaimingGift(true);
                            setLobbyToast({
                              type: 'success',
                              text: selectedLang === 'en' ? 'Validating gift code...' : 'गिफ्ट कोड सत्यापित किया जा रहा है...'
                            });

                            try {
                              const codeRef = doc(db, 'giftCodes', code);
                              const codeSnap = await getDoc(codeRef);
                              if (!codeSnap.exists()) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' ? 'Gift code is invalid or expired' : 'गिफ्ट कोड अमान्य है या समाप्त हो गया है'
                                });
                                return;
                              }

                              const giftData = codeSnap.data();
                              const giftAmount = parseFloat(giftData.amount || '0');
                              const giftType = giftData.type || 'standard';
                              const minDepositReq = parseFloat(giftData.minDeposit || '0');

                              // Check duplicate claim
                              const claimId = \`\${auth.currentUser.uid}_\${code}\`;
                              const claimRef = doc(db, 'giftClaims', claimId);
                              const claimSnap = await getDoc(claimRef);
                              if (claimSnap.exists()) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' ? 'This gift code has already been redeemed' : 'यह उपहार कोड पहले ही उपयोग किया जा चुका है'
                                });
                                return;
                              }

                              // Check user total deposits requirement
                              const userRef = doc(db, 'users', auth.currentUser.uid);
                              const userSnap = await getDoc(userRef);
                              if (!userSnap.exists()) throw new Error("User document not found");
                              
                              const userData = userSnap.data();
                              const userTotalDeposits = parseFloat(userData.totalDeposits || '0');

                              if (giftType === 'deposit_lock' && userTotalDeposits < minDepositReq) {
                                setLobbyToast({
                                  type: 'error',
                                  text: selectedLang === 'en' 
                                    ? \`This code unlocks at automatic deposit of ₹\${minDepositReq}. (You have: ₹\${userTotalDeposits})\`
                                    : \`यह कोड अनलॉक करने के लिए ₹\${minDepositReq} स्वचालित जमा आवश्यक है। (आपके पास: ₹\${userTotalDeposits})\`
                                });
                                return;
                              }

                              // Core balance credit transaction
                              await runTransaction(db, async (transaction) => {
                                const uSnap = await transaction.get(userRef);
                                if (!uSnap.exists()) throw new Error("User not found");
                                const currentBalance = parseFloat(uSnap.data().balance || '0');

                                // Create claimed record
                                transaction.set(claimRef, {
                                  userId: auth.currentUser?.uid,
                                  userUid: uid,
                                  giftCode: code,
                                  amount: giftAmount,
                                  claimedAt: new Date().toISOString()
                                });

                                // Modify structural balance
                                transaction.update(userRef, {
                                  balance: currentBalance + giftAmount
                                });
                              });

                              setLobbyToast({
                                type: 'success',
                                text: selectedLang === 'en' 
                                  ? \`Success! You claimed ₹\${giftAmount.toFixed(2)} gift bonus!\` 
                                  : \`सफलतापूर्वक ₹\${giftAmount.toFixed(2)} उपहार पुरस्कार प्राप्त किया!\`
                              });
                              setGiftCodeInput('');
                            } catch (e: any) {
                              console.error("Gift Claim Error:", e);
                              setLobbyToast({
                                type: 'error',
                                text: selectedLang === 'en' 
                                  ? 'Error claiming gift code: ' + e.message 
                                  : 'गिफ्ट कोड के दावे में त्रुटि: ' + e.message
                              });
                            } finally {
                              setClaimingGift(false);
                            }
                          }}
                          className={\`w-full h-[46px] bg-gradient-to-r from-[#ffc107] to-[#ff9800] rounded-full text-[#111111] font-medium text-[16px] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center \${claimingGift ? 'opacity-70 pointer-events-none' : ''}\`}
                        >
                          {claimingGift ? (selectedLang === 'en' ? 'Receiving...' : 'प्राप्त किया जा रहा है...') : (selectedLang === 'en' ? 'Receive' : 'प्राप्त करें')}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* History Section */}
                  <div className="px-4 mt-4">
                    <div className="bg-[#3b1415] rounded-[10px] p-4 shadow-sm min-h-[300px] flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-5 h-5 bg-[#ffc107] rounded flex items-center justify-center text-[#3b1415] p-0.5">
                           <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm3 5h8v2H8v-2z"/></svg>
                        </div>
                        <span className="text-white text-[15px] font-medium">{selectedLang === 'en' ? 'History' : 'इतिहास'}</span>
                      </div>

                      {claimedGifts.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                            <path d="M40 90C34.4772 90 30 85.5228 30 80V40C30 34.4772 34.4772 30 40 30H70C75.5228 30 80 34.4772 80 40V80C80 85.5228 75.5228 90 70 90H40Z" fill="#582a2b" opacity="0.4"/>
                            <rect x="42" y="42" width="26" height="4" rx="2" fill="#75383a" opacity="0.6"/>
                            <rect x="42" y="52" width="18" height="4" rx="2" fill="#75383a" opacity="0.6"/>
                            <path d="M90 75C90 77.7614 87.7614 80 85 80H75V70H85C87.7614 70 90 72.2386 90 75Z" fill="#582a2b" opacity="0.4"/>
                            <path d="M30 75C30 72.2386 32.2386 70 35 70H45V80H35C32.2386 80 30 77.7614 30 75Z" fill="#582a2b" opacity="0.4"/>
                            <circle cx="85" cy="50" r="10" fill="#582a2b" opacity="0.2"/>
                            <circle cx="25" cy="40" r="6" fill="#582a2b" opacity="0.2"/>
                          </svg>
                          <p className="text-white/60 text-[14px]">{selectedLang === 'en' ? 'No data' : 'कोई डेटा नहीं'}</p>
                        </div>
                      ) : (
                        <div className="w-full space-y-3 mt-2">
                          {claimedGifts.map((claim, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                              <div className="space-y-1">
                                <p className="text-white/90 text-[14px]">{claim.giftCode}</p>
                                <p className="text-[12px] text-white/50">
                                  {claim.claimedAt ? claim.claimedAt.replace('T', ' ').substring(0, 16) : ''}
                                </p>
                              </div>
                              <div className="text-[#ff9800] text-[15px] font-medium">
                                +₹{Number(claim.amount).toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
`;
    lines.splice(startIdx, endIdx - startIdx, newSection);
    fs.writeFileSync('src/App.tsx', lines.join('\n'));
    console.log("Fixed!");
} else {
    console.log("Could not find blocks");
}
