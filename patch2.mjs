import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = \`           return { ...prev, [room]: updatedBets };
       });
    };
    
    const handleFallbackResult = (e: any) => processResult(e.detail);
    window.addEventListener('new_result_event', handleFallbackResult);

    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));

       // Fallback for global history update in case Firestore quota is exceeded
       setWingoHistory(prev => {
           const existing = prev[room] || [];
           // Insert new record at the start and deduplicate
           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);
           return { ...prev, [room]: updated };
       });

    });\`;
    

const replaceStr = \`           return { ...prev, [room]: updatedBets };
       });

       // Fallback for global history update in case Firestore quota is exceeded
       setWingoHistory(prev => {
           const existing = prev[room] || [];
           // Insert new record at the start and deduplicate
           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);
           return { ...prev, [room]: updated };
       });
       
    };
    
    const handleFallbackResult = (e: any) => processResult(e.detail);
    window.addEventListener('new_result_event', handleFallbackResult);

    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));\`;
// replace with stripped space to match just in case
content = content.replace(targetStr, replaceStr);

// A regex approach if it failed
if (!content.includes("    const handleFallbackResult = (e: any) => processResult(e.detail);")) {
    console.log("String match failed. Using regex.");
} else {
    console.log("String match partially succeeded? Or the regex is needed anyway to be safe.");
}

content = content.replace(/\\s*return { \\.\\.\\.prev, \\[room]: updatedBets };\\s*}\\);\\s*};\\s*const handleFallbackResult = \\(e: any\\) => processResult\\(e\\.detail\\);\\s*window\\.addEventListener\\('new_result_event', handleFallbackResult\\);\\s*socket\\.on\\('new_result', \\(\\{ room, result \\}: any\\) => processResult\\(\\{ room, result \\}\\)\\);\\s*\\/\\/ Fallback for global history update in case Firestore quota is exceeded\\s*setWingoHistory\\(prev => \\{\\s*const existing = prev\\[room] \\|\\| \\[\\];\\s*\\/\\/ Insert new record at the start and deduplicate\\s*const updated = \\[result, \\.\\.\\.existing\\.filter\\(\\(h: any\\) => h\\.period !== result\\.period\\)]\\.sort\\(\\(a,b\\) => b\\.period\\.localeCompare\\(a\\.period\\)\\)\\.slice\\(0, 500\\);\\s*return \\{ \\.\\.\\.prev, \\[room]: updated \\};\\s*}\\);\\s*}\\);/g, replaceStr);

fs.writeFileSync('src/App.tsx', content);

console.log("Fixed!");

