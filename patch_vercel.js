const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const replacement = `
  const generateDeterministicResult = (room, periodStr) => {
    let hash = 0;
    const str = periodStr + room + "salt";
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    const num = Math.abs(hash) % 10;
    let color = '';
    if (num === 0) color = 'Red+Violet';
    else if (num === 5) color = 'Green+Violet';
    else if (num % 2 === 0) color = 'Red';
    else color = 'Green';
    return { period: periodStr, number: num, color: color, size: num >= 5 ? 'Big' : 'Small' };
  };

  const constructFallbackHistory = (room, count) => {
     const history = [];
     const nowTs = Math.floor(Date.now() / 1000);
     let roomSecs = 30;
     if (room === '1m') roomSecs = 60;
     if (room === '3m') roomSecs = 180;
     if (room === '5m') roomSecs = 300;
     
     for (let i = 0; i < count; i++) {
        const pDate = new Date((nowTs - ((i+1) * roomSecs)) * 1000);
        const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
        let issue = 10001;
        if (room === '1m') issue = 10001 + minOfDay;
        else if (room === '3m') issue = 10001 + Math.floor(minOfDay / 3);
        else if (room === '5m') issue = 10001 + Math.floor(minOfDay / 5);
        else issue = 10001 + (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
        const period = \`\${pDate.getUTCFullYear()}\${String(pDate.getUTCMonth() + 1).padStart(2, '0')}\${String(pDate.getUTCDate()).padStart(2, '0')}\${issue}\`;
        history.push(generateDeterministicResult(room, period));
     }
     return history;
  };
`;

content = content.replace("const sanitizeHistoryForFirestore", replacement + "\n  const sanitizeHistoryForFirestore");

content = content.replace("    const updateLocalTimers = () => {", \`
    let lastProcessedPeriod = { '30s': '', '1m': '', '3m': '', '5m': '' };
    const getPeriodForTime = (time, room) => {
        const pDate = new Date(time * 1000);
        const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
        let issue = 10001;
        if (room === '1m') issue = 10001 + minOfDay;
        else if (room === '3m') issue = 10001 + Math.floor(minOfDay / 3);
        else if (room === '5m') issue = 10001 + Math.floor(minOfDay / 5);
        else issue = 10001 + (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
        return \`\${pDate.getUTCFullYear()}\${String(pDate.getUTCMonth() + 1).padStart(2, '0')}\${String(pDate.getUTCDate()).padStart(2, '0')}\${issue}\`;
    };

    const updateLocalTimers = () => {
\`);

const tickRep = \`      setWingoTimers({
        '30s': 30 - (nowTs % 30),
        '1m': 60 - (nowTs % 60),
        '3m': 180 - (nowTs % 180),
        '5m': 300 - (nowTs % 300),
      });
      
      const secMap = { '30s': 30, '1m': 60, '3m': 180, '5m': 300 };
      for (const room of Object.keys(secMap)) {
         const p = getPeriodForTime(nowTs, room);
         if (lastProcessedPeriod[room] && lastProcessedPeriod[room] !== p) {
             const result = generateDeterministicResult(room, lastProcessedPeriod[room]);
             setWingoHistory(prev => ({ ...prev, [room]: [result, ...(prev[room] || constructFallbackHistory(room, 20))].slice(0, 500) }));
             setTimeout(() => window.dispatchEvent(new CustomEvent('new_result_event', { detail: { room, result } })), 500);
         }
         lastProcessedPeriod[room] = p;
      }\`;

content = content.replace(\`      setWingoTimers({
        '30s': 30 - (nowTs % 30),
        '1m': 60 - (nowTs % 60),
        '3m': 180 - (nowTs % 180),
        '5m': 300 - (nowTs % 300),
      });\`, tickRep);


content = content.replace(\`  // Reset history pages when room changes
  useEffect(() => {
    setHistoryPage(1);
    setChartPage(1);
    setMyHistoryPage(1);
  }, [activeWingoRoom]);\`, \`
  useEffect(() => {
    if (!socketConnected) {
       setWingoHistory(prev => {
           let np = { ...prev };
           ['30s','1m','3m','5m'].forEach(r => { if (!np[r] || np[r].length === 0) np[r] = constructFallbackHistory(r, 40); });
           return np;
       });
    }
  }, [socketConnected]);
  
  useEffect(() => {
    setHistoryPage(1);
    setChartPage(1);
    setMyHistoryPage(1);
  }, [activeWingoRoom]);\`);

content = content.replace(\`    socket.on('new_result', ({ room, result }: any) => {
       if (!active) return;\`, \`
    const processResult = ({ room, result }: any) => {
       if (!active) return;\`);
       
content = content.replace(\`           return { ...prev, [room]: updatedBets };
       });
    });\`, \`           return { ...prev, [room]: updatedBets };
       });
    };
    
    const handleFallbackResult = (e) => processResult(e.detail);
    window.addEventListener('new_result_event', handleFallbackResult);

    socket.on('new_result', ({ room, result }) => processResult({ room, result }));\`);
    
content = content.replace(\`      socket.disconnect(); 
    };
  }, [selectedLang]);\`, \`      window.removeEventListener('new_result_event', handleFallbackResult);
      socket.disconnect(); 
    };
  }, [selectedLang]);\`);

fs.writeFileSync('src/App.tsx', content);
console.log('patched successfully!');
