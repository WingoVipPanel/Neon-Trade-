import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Remove "Data Sync" text so it always says "Time remaining", but maybe keeps the red dot if !socketConnected
const dataSyncOld = "{socketConnected ? 'Time remaining' : 'Data Sync'}";
const dataSyncNew = "'Time remaining'";
content = content.replace(dataSyncOld, dataSyncNew);

// 2. Fix the visual indicator
const dotOld = "w-2 h-2 rounded-full ${socketConnected ? 'bg-[#4c0f12] shadow-[0_0_8px_rgba(76,15,18,0.4)]' : 'bg-[#4c0f12]/40 shadow-[0_0_4px_rgba(76,15,18,0.2)]'}";
const dotNew = "w-2 h-2 rounded-full ${socketConnected ? 'bg-[#4c0f12] shadow-[0_0_8px_rgba(76,15,18,0.4)]' : 'bg-[#e23f3f] shadow-[0_0_8px_rgba(226,63,63,0.6)] animate-pulse'}";
content = content.replace(dotOld, dotNew);

// 3. Fix reconnection attempts
content = content.replace(/reconnectionAttempts: 10/g, "reconnectionAttempts: Infinity");

// 4. Update initial_data to forcefully overwrite AND resolve missing results
const oldInitialData = `    socket.on('initial_data', (roomData: any) => {
       if (!active) return;
       // initial layout (fallback to socket data if Firestore snapshot is unavailable due to quota)
       setWingoHistory(prev => {
           let state = { ...prev };
           for (const room of ['30s', '1m', '3m', '5m']) {
               if (roomData[room]?.history && roomData[room].history.length > 0) {
                   // Only use socket data if we haven't loaded recent data yet from Firestore
                   if (!state[room] || state[room].length === 0) {
                       state[room] = roomData[room].history;
                   }
               }
           }
           return state;
       });
    });`;

const newInitialData = `    socket.on('initial_data', (roomData: any) => {
       if (!active) return;
       setWingoHistory(prev => {
           let state = { ...prev };
           for (const room of ['30s', '1m', '3m', '5m']) {
               if (roomData[room]?.history && roomData[room].history.length > 0) {
                   state[room] = roomData[room].history;
               }
           }
           return state;
       });
       
       // Force resolve any missed bets on reconnect using the history just received
       for (const room of ['30s', '1m', '3m', '5m']) {
          if (!roomData[room]?.history) continue;
          
          let newBalanceChange = 0;
          const histDict = {};
          roomData[room].history.forEach((h: any) => { histDict[h.period] = h; });
          
          let anyResolved = false;
          const updatedLocalBets = localBetsRef.current.map(b => {
             if (b.room === room && !b.resolved) {
                 const result = histDict[b.period];
                 if (result) {
                    b.resolved = true;
                    anyResolved = true;
                    
                    let userWon = false;
                    let winMult = 0;
                    const rNum = result.number;
                    const rCol = result.color;
                    const rSize = result.size;
                    const opt = b.userChoice;
                    
                    if (typeof opt === 'number') {
                      if (opt === rNum) { userWon = true; winMult = 8.82; }
                    } else if (opt === 'Green') {
                      if (rCol === 'Green') { userWon=true; winMult=1.96; }
                      else if (rCol==='Green+Violet') { userWon=true; winMult=1.47; }
                    } else if (opt === 'Red') {
                      if (rCol === 'Red') { userWon=true; winMult=1.96; }
                      else if (rCol==='Red+Violet') { userWon=true; winMult=1.47; }
                    } else if (opt === 'Violet') {
                      if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) { userWon=true; winMult=4.41; }
                    } else if (opt === 'Big') {
                      if (rSize === 'Big') { userWon=true; winMult=1.96; }
                    } else if (opt === 'Small') {
                      if (rSize === 'Small') { userWon=true; winMult=1.96; }
                    }
  
                    b.winLoss = userWon ? 'Win' : 'Loss';
                    
                    if (userWon) {
                       newBalanceChange += (b.betAmount * winMult);
                    }
                    
                    const userUid = auth.currentUser?.uid;
                    if (userUid && db) {
                      import('firebase/firestore').then(({ query, collection, where, getDocs, updateDoc }) => {
                        const betsQuery = query(
                            collection(db, 'wingoBets'),
                            where('userId', '==', userUid),
                            where('room', '==', room),
                            where('period', '==', result.period)
                        );
                        getDocs(betsQuery).then(snap => {
                            snap.forEach(d => {
                                updateDoc(d.ref, {
                                    resolved: true,
                                    winLoss: userWon ? 'Win' : 'Loss',
                                    drawNumber: rNum,
                                    drawColor: rCol,
                                    drawSize: rSize
                                }).catch(()=>{});
                            });
                        }).catch(()=>{});
                      });
                    }
                 }
             }
             return b;
          });
          
          if (anyResolved) {
             localBetsRef.current = updatedLocalBets;
             if (newBalanceChange > 0) {
               setBalance((prev: number) => {
                 const updated = prev + newBalanceChange;
                 const userUid = auth.currentUser?.uid;
                 if (userUid && db) {
                   import('firebase/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
                     updateDoc(doc(db, 'users', userUid), {
                       balance: updated,
                       updatedAt: serverTimestamp()
                     }).catch(()=>{});
                   });
                 }
                 return updated;
               });
             }
             
             setMyWingoBets((prev: any) => {
                 const roomBets = prev[room] || [];
                 const updatedBets = roomBets.map((b: any) => {
                     const r = histDict[b.period];
                     if (r && !b.resolved) {
                         let userWon = false;
                         const opt = b.userChoice;
                         if (typeof opt === 'number') { if (opt === r.number) userWon = true; }
                         else if (opt === 'Green') { if (r.color === 'Green' || r.color === 'Green+Violet') userWon = true; }
                         else if (opt === 'Red') { if (r.color === 'Red' || r.color === 'Red+Violet') userWon = true; }
                         else if (opt === 'Violet') { if (['Violet','Green+Violet','Red+Violet'].includes(r.color)) userWon = true; }
                         else if (opt === 'Big') { if (r.size === 'Big') userWon = true; }
                         else if (opt === 'Small') { if (r.size === 'Small') userWon = true; }
                         return { ...b, resolved: true, winLoss: userWon ? 'Win' : 'Loss', number: r.number, color: r.color, size: r.size };
                     }
                     return b;
                 });
                 return { ...prev, [room]: updatedBets };
             });
          }
       }
    });`;

if (content.includes("socket.on('initial_data', (roomData: any) => {")) {
  const parts = content.split("socket.on('initial_data', (roomData: any) => {");
  const middle = parts[1].split("    });")[0];
  content = parts[0] + newInitialData + "\n" + parts[1].substring(middle.length + 7);
}

fs.writeFileSync('src/App.tsx', content);
