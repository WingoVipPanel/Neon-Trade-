import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const deterministicFuncStr = `
  const generateDeterministicResult = (room: string, periodStr: string) => {
    // Generate a deterministic hash from room and period so all clients see the same result
    let hash = 0;
    const str = periodStr + room + "secret_salt_123";
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    const num = Math.abs(hash) % 10;
    
    let color = '';
    if (num === 0) color = 'Red+Violet';
    else if (num === 5) color = 'Green+Violet';
    else if (num % 2 === 0) color = 'Red';
    else color = 'Green';
    
    return {
      period: periodStr,
      number: num,
      color: color,
      size: num >= 5 ? 'Big' : 'Small'
    };
  };

  const constructFallbackHistory = (room: string, count: number) => {
     const history = [];
     const nowTs = Math.floor(Date.now() / 1000);
     let roomSecs = 30;
     if (room === '1m') roomSecs = 60;
     if (room === '3m') roomSecs = 180;
     if (room === '5m') roomSecs = 300;
     
     for (let i = 0; i < count; i++) {
        const pDate = new Date((nowTs - ((i+1) * roomSecs)) * 1000);
        
        // Match standard formatting yyyyMMdd1000xxxxx
        const y = pDate.getUTCFullYear();
        const m = String(pDate.getUTCMonth() + 1).padStart(2, '0');
        const d = String(pDate.getUTCDate()).padStart(2, '0');
        
        // This is a naive period generator for fallback
        const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
        let issue = 10001;
        if (room === '1m') issue = 10001 + minOfDay;
        else if (room === '3m') issue = 10001 + Math.floor(minOfDay / 3);
        else if (room === '5m') issue = 10001 + Math.floor(minOfDay / 5);
        else issue = 10001 + (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
        
        const period = \`\${y}\${m}\${d}\${issue}\`;
        history.push(generateDeterministicResult(room, period));
     }
     return history;
  };
`;

const standaloneOld = `  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);`;

const standaloneNew = \`  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);
  
  \${deterministicFuncStr}
\`;

content = content.replace(standaloneOld, standaloneNew);

const timerOld = `    const updateLocalTimers = () => {
      if (socketConnectedRef.current) return;
      const nowTs = Math.floor(Date.now() / 1000);
      setWingoTimers({
        '30s': 30 - (nowTs % 30),
        '1m': 60 - (nowTs % 60),
        '3m': 180 - (nowTs % 180),
        '5m': 300 - (nowTs % 300),
      });
    };`;

const timerNew = \`    let lastProcessedPeriod = { '30s': '', '1m': '', '3m': '', '5m': '' };

    const updateLocalTimers = () => {
      if (socketConnectedRef.current) return;
      
      const nowTs = Math.floor(Date.now() / 1000);
      
      const computeTimerAndPeriod = (sec: number, room: string) => {
         const t = sec - (nowTs % sec);
         
         const pDate = new Date(nowTs * 1000);
         const y = pDate.getUTCFullYear();
         const m = String(pDate.getUTCMonth() + 1).padStart(2, '0');
         const d = String(pDate.getUTCDate()).padStart(2, '0');
         const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
         
         let issue = 10001;
         if (room === '1m') issue = 10001 + minOfDay;
         else if (room === '3m') issue = 10001 + Math.floor(minOfDay / 3);
         else if (room === '5m') issue = 10001 + Math.floor(minOfDay / 5);
         else issue = 10001 + (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
         const period = \\\`\\\${y}\\\${m}\\\${d}\\\${issue}\\\`;
         
         // At tick 0 or when we cross over to a new period, we generate result for the PREVIOUS period
         if (lastProcessedPeriod[room] && lastProcessedPeriod[room] !== period) {
             const result = generateDeterministicResult(room, lastProcessedPeriod[room]);
             
             // Update history
             setWingoHistory((prev: any) => {
                const arr = prev[room] || constructFallbackHistory(room, 20);
                return { ...prev, [room]: [result, ...arr].slice(0, 500) };
             });
             
             // Resolve bets
             setTimeout(() => {
                // We dispatch a synthetic event
                window.dispatchEvent(new CustomEvent('fallback_new_result', { detail: { room, result } }));
             }, 500);
         }
         
         if (!lastProcessedPeriod[room] || lastProcessedPeriod[room] !== period) {
             lastProcessedPeriod[room] = period;
         }
         
         return t;
      };

      setWingoTimers({
        '30s': computeTimerAndPeriod(30, '30s'),
        '1m': computeTimerAndPeriod(60, '1m'),
        '3m': computeTimerAndPeriod(180, '3m'),
        '5m': computeTimerAndPeriod(300, '5m'),
      });
    };\`;

content = content.replace(timerOld, timerNew);

const initialHistoryOld = \`  // Reset history pages when room changes
  useEffect(() => {
    setHistoryPage(1);
    setChartPage(1);
    setMyHistoryPage(1);
  }, [activeWingoRoom]);\`;

const initialHistoryNew = \`  // Generate initial fallback history on mount if disconnected
  useEffect(() => {
    if (!socketConnected) {
       setWingoHistory((prev: any) => {
           let np = { ...prev };
           ['30s','1m','3m','5m'].forEach(r => {
              if (!np[r] || np[r].length === 0) {
                 np[r] = constructFallbackHistory(r, 40);
              }
           });
           return np;
       });
    }
  }, [socketConnected]);
  
  // Reset history pages when room changes
  useEffect(() => {
    setHistoryPage(1);
    setChartPage(1);
    setMyHistoryPage(1);
  }, [activeWingoRoom]);\`;

content = content.replace(initialHistoryOld, initialHistoryNew);

const windowEventOld = \`    socket.on('new_result', ({ room, result }: any) => {
       if (!active) return;\`;

const windowEventNew = \`
    const processResult = ({ room, result }: any) => {
       if (!active) return;
        // ... (body of new_result listener) ...
       let anyResolved = false;
       let hasWin = false;
       let hasLoss = false;
       let newBalanceChange = 0;
       let lastAlert: any = null;

       const updatedLocalBets = localBetsRef.current.map((b: any) => {
           if (b.room === room && !b.resolved && b.period === result.period) {
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
                 if (userWon) hasWin = true;
                 else hasLoss = true;

                 import('firebase/auth').then(({ getAuth }) => {
                   import('firebase/firestore').then(({ query, collection, where, getDocs, updateDoc }) => {
                     const auth = getAuth();
                     const userUid = auth.currentUser?.uid;
                     if (userUid && window.firebaseDbRef) {
                       const betsQuery = query(
                           collection(window.firebaseDbRef, 'wingoBets'),
                           where('userId', '==', userUid),
                           where('room', '==', room),
                           where('period', '==', result.period),
                           where('resolved', '==', false)
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
                     }
                   });
                 });
                 
                 if (userWon) {
                    const amt = b.betAmount * winMult;
                    newBalanceChange += amt;
                    lastAlert = { isWin: true, text: \`Congratulations! You won ₹\${amt.toFixed(2)}\`, amount: amt, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };
                 } else {
                    lastAlert = { isWin: false, text: \`Better luck next time! Number was \${rNum}.\`, amount: 0, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };
                 }
           }
           return b;
       });

       if (anyResolved) {
           localBetsRef.current = updatedLocalBets;

           if (newBalanceChange > 0) {
              setBalance((prev: number) => {
                const updated = prev + newBalanceChange;
                import('firebase/auth').then(({ getAuth }) => {
                    import('firebase/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
                      const auth = getAuth();
                      const userUid = auth.currentUser?.uid;
                      if (userUid && window.firebaseDbRef) {
                        updateDoc(doc(window.firebaseDbRef, 'users', userUid), {
                          balance: updated,
                          updatedAt: serverTimestamp()
                        }).catch(()=>{});
                      }
                    });
                });
                return updated;
              });
           }
           if (lastAlert) setWingoWinningsAlert(lastAlert);
       }

       setMyWingoBets((prev: any) => {
           const roomBets = prev[room] || [];
           const updatedBets = roomBets.map((b: any) => {
               if (b.period === result.period && !b.resolved) {
                   const matchedLocal = updatedLocalBets.find((lb: any) => lb.period === b.period && lb.room === room && lb.userChoice === b.userChoice);
                   if (matchedLocal) {
                       return { ...b, resolved: true, winLoss: matchedLocal.winLoss, number: result.number, color: result.color, size: result.size };
                   }
               }
               return b;
           });
           return { ...prev, [room]: updatedBets };
       });
    };

    const handleFallbackResult = (e: any) => {
        processResult(e.detail);
    };
    window.addEventListener('fallback_new_result', handleFallbackResult);

    socket.on('new_result', ({ room, result }: any) => {
       if (!active) return;
       processResult({ room, result });
    });
\`;

content = content.replace(\`    socket.on('new_result', ({ room, result }: any) => {\\n       if (!active) return;\\n\\n       // resolve bets for this room\\n       let anyResolved = false;\\n       let hasWin = false;\\n       let hasLoss = false;\\n       let newBalanceChange = 0;\\n       let lastAlert: any = null;\\n\\n       const updatedLocalBets = localBetsRef.current.map(b => {\\n           if (b.room === room && !b.resolved && b.period === result.period) {\\n                 b.resolved = true;\\n                 anyResolved = true;\\n                 \\n                 let userWon = false;\\n                 let winMult = 0;\\n                 const rNum = result.number;\\n                 const rCol = result.color;\\n                 const rSize = result.size;\\n                 const opt = b.userChoice;\\n                 \\n                 if (typeof opt === 'number') {\\n                   if (opt === rNum) { userWon = true; winMult = 8.82; }\\n                 } else if (opt === 'Green') {\\n                   if (rCol === 'Green') { userWon=true; winMult=1.96; }\\n                   else if (rCol==='Green+Violet') { userWon=true; winMult=1.47; }\\n                 } else if (opt === 'Red') {\\n                   if (rCol === 'Red') { userWon=true; winMult=1.96; }\\n                   else if (rCol==='Red+Violet') { userWon=true; winMult=1.47; }\\n                 } else if (opt === 'Violet') {\\n                   if (['Violet','Green+Violet','Red+Violet'].includes(rCol)) { userWon=true; winMult=4.41; }\\n                 } else if (opt === 'Big') {\\n                   if (rSize === 'Big') { userWon=true; winMult=1.96; }\\n                 } else if (opt === 'Small') {\\n                   if (rSize === 'Small') { userWon=true; winMult=1.96; }\\n                 }\\n\\n                 b.winLoss = userWon ? 'Win' : 'Loss';\\n                 if (userWon) hasWin = true;\\n                 else hasLoss = true;\\n\\n                 // Persist resolution in Firestore\\n                 const userUid = auth.currentUser?.uid;\\n                 if (userUid && db) {\\n                   const betsQuery = query(\\n                       collection(db, 'wingoBets'),\\n                       where('userId', '==', userUid),\\n                       where('room', '==', room),\\n                       where('period', '==', result.period),\\n                       where('resolved', '==', false)\\n                   );\\n                   getDocs(betsQuery).then(snap => {\\n                       snap.forEach(d => {\\n                           updateDoc(d.ref, {\\n                               resolved: true,\\n                               winLoss: userWon ? 'Win' : 'Loss',\\n                               drawNumber: rNum,\\n                               drawColor: rCol,\\n                               drawSize: rSize\\n                           }).catch(e => console.error('Resolving bet doc failed:', e));\\n                       });\\n                   }).catch(e => console.error('Querying unresolved bets failed:', e));\\n                 }\\n                 \\n                 if (userWon) {\\n                    const amt = b.betAmount * winMult;\\n                    newBalanceChange += amt;\\n                    lastAlert = { isWin: true, text: selectedLang === 'en' ? \\\`Congratulations! You won ₹\\\${amt.toFixed(2)}\\\` : \\\`बधाई हो! आपने ₹\\\${amt.toFixed(2)} जीते\\\`, amount: amt, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };\\n                 } else {\\n                    lastAlert = { isWin: false, text: selectedLang === 'en' ? \\\`Better luck next time! Number was \\\${rNum}.\\\` : \\\`अगली बार बेहतर भाग्य! नंबर \\\${rNum} था।\\\`, amount: 0, period: result.period, room: room, drawNumber: rNum, drawColor: rCol, drawSize: rSize };\\n                 }\\n           }\\n           return b;\\n       });\\n\\n       if (anyResolved) {\\n           localBetsRef.current = updatedLocalBets;\\n\\n           if (newBalanceChange > 0) {\\n              setBalance(prev => {\\n                const updated = prev + newBalanceChange;\\n                const userUid = auth.currentUser?.uid;\\n                if (userUid) {\\n                  updateDoc(doc(db, 'users', userUid), {\\n                    balance: updated,\\n                    updatedAt: serverTimestamp()\\n                  }).catch(e => console.error('Winnings sync error:', e));\\n                }\\n                return updated;\\n              });\\n           }\\n           if (lastAlert) setWingoWinningsAlert(lastAlert);\\n       }\\n\\n       // Resolve the corresponding bet in myWingoBets in real-time\\n       setMyWingoBets(prev => {\\n           const roomBets = prev[room] || [];\\n           const updatedBets = roomBets.map(b => {\\n               if (b.period === result.period && !b.resolved) {\\n                   const matchedLocal = updatedLocalBets.find(lb => lb.period === b.period && lb.room === room && lb.userChoice === b.userChoice);\\n                   if (matchedLocal) {\\n                       return { ...b, resolved: true, winLoss: matchedLocal.winLoss, number: result.number, color: result.color, size: result.size };\\n                   }\\n               }\\n               return b;\\n           });\\n           return { ...prev, [room]: updatedBets };\\n       });\\n    });\`, windowEventNew);

content = content.replace(\`      socket.disconnect(); 
    };
  }, [selectedLang]);\`, \`      window.removeEventListener('fallback_new_result', handleFallbackResult);
      socket.disconnect(); 
    };
  }, [selectedLang]);\`);

content = content.replace("window.firebaseDbRef = db;", "");
content = content.replace("export default App;", "window.firebaseDbRef = null;\nexport default App;");
const winOld = "window.firebaseDbRef = null;";
const winNew = "import { db as AppDb } from './lib/firebase'; window.firebaseDbRef = AppDb;";
content = content.replace(winOld, winNew);

fs.writeFileSync('src/App.tsx', content);

