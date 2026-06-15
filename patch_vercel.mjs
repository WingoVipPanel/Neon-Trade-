import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const str2 = `const sanitizeHistoryForFirestore`;

if (content.includes("generateDeterministicResult")) {
  console.log("Already patched");
} else {

const deterministicFuncStr = \`
  const generateDeterministicResult = (room: string, periodStr: string) => {
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
        history.push(generateDeterministicResult(room, period));
     }
     return history;
  };
\`;

content = content.replace("const sanitizeHistoryForFirestore", deterministicFuncStr + "\nconst sanitizeHistoryForFirestore");

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

const timerNew = \`    let lastProcessedPeriod: Record<string, string> = { '30s': '', '1m': '', '3m': '', '5m': '' };

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
         
         if (lastProcessedPeriod[room] && lastProcessedPeriod[room] !== period) {
             const result = generateDeterministicResult(room, lastProcessedPeriod[room]);
             
             setWingoHistory((prev: any) => {
                const arr = prev[room] || constructFallbackHistory(room, 20);
                return { ...prev, [room]: [result, ...arr].slice(0, 500) };
             });
             
             setTimeout(() => {
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

const dispatchStr = \`    const handleFallbackResult = (e: any) => {
       const { room, result } = e.detail;
       if (!socketConnectedRef.current) {
          // Manually emit the socket event local logic by creating a dummy payload
          localBetsRef.current.forEach((b: any) => {
              if (b.room === room && !b.resolved && b.period === result.period) {
                  // Actually since the complex resolution is inside socket.on('new_result'), 
                  // we can just re-use it if we wrap it.
              }
          });
       }
    };
    window.addEventListener('fallback_new_result', handleFallbackResult);\`;

// Instead of rewriting the HUGE socket.on block, I'll just find the start of it and extract it to a function.
const searchStr = \`    socket.on('new_result', ({ room, result }: any) => {
       if (!active) return;\`;

const replaceStr = \`    const processResult = ({ room, result }: any) => {
       if (!active) return;\`;

content = content.replace(searchStr, replaceStr);

const endStr = \`           return { ...prev, [room]: updatedBets };
       });
    });\`;
    
const newEndStr = \`           return { ...prev, [room]: updatedBets };
       });
    };
    
    const handleFallbackResult = (e: any) => {
        processResult(e.detail);
    };
    window.addEventListener('fallback_new_result', handleFallbackResult);

    socket.on('new_result', ({ room, result }: any) => {
        processResult({ room, result });
    });\`;

content = content.replace(endStr, newEndStr);

const cleanupStr = \`      socket.disconnect(); 
    };
  }, [selectedLang]);\`;
const cleanupNewStr = \`      window.removeEventListener('fallback_new_result', handleFallbackResult);
      socket.disconnect(); 
    };
  }, [selectedLang]);\`;
content = content.replace(cleanupStr, cleanupNewStr);


fs.writeFileSync('src/App.tsx', content);

console.log("Patched locally for Vercel!");
}
