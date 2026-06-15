import fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const s = "           return { ...prev, [room]: updatedBets };\\n       });\\n    };\\n    \\n    const handleFallbackResult = (e: any) => processResult(e.detail);\\n    window.addEventListener('new_result_event', handleFallbackResult);\\n\\n    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));\\n\\n       // Fallback for global history update in case Firestore quota is exceeded\\n       setWingoHistory(prev => {\\n           const existing = prev[room] || [];\\n           // Insert new record at the start and deduplicate\\n           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);\\n           return { ...prev, [room]: updated };\\n       });\\n\\n    });";

const r = "           return { ...prev, [room]: updatedBets };\\n       });\\n       // Fallback for global history update in case Firestore quota is exceeded\\n       setWingoHistory(prev => {\\n           const existing = prev[room] || [];\\n           // Insert new record at the start and deduplicate\\n           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);\\n           return { ...prev, [room]: updated };\\n       });\\n    };\\n    const handleFallbackResult = (e: any) => processResult(e.detail);\\n    window.addEventListener('new_result_event', handleFallbackResult);\\n\\n    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));";

if (content.includes("    const handleFallbackResult = (e: any) => processResult(e.detail);")) {
  let lines = content.split('\\n');
  let newLines = [];
  let skip = 0;
  for (let i = 0; i < lines.length; i++) {
     if (skip > 0) { skip--; continue; }
     if (lines[i].includes("           return { ...prev, [room]: updatedBets };")) {
        if (lines[i+2] && lines[i+2].includes("    };") && lines[i+4] && lines[i+4].includes("    const handleFallbackResult")) {
            newLines.push("           return { ...prev, [room]: updatedBets };");
            newLines.push("       });");
            newLines.push("       // Fallback for global history update in case Firestore quota is exceeded");
            newLines.push("       setWingoHistory(prev => {");
            newLines.push("           const existing = prev[room] || [];");
            newLines.push("           // Insert new record at the start and deduplicate");
            newLines.push("           const updated = [result, ...existing.filter((h: any) => h.period !== result.period)].sort((a,b) => b.period.localeCompare(a.period)).slice(0, 500);");
            newLines.push("           return { ...prev, [room]: updated };");
            newLines.push("       });");
            newLines.push("    };");
            newLines.push("    const handleFallbackResult = (e: any) => processResult(e.detail);");
            newLines.push("    window.addEventListener('new_result_event', handleFallbackResult);");
            newLines.push("");
            newLines.push("    socket.on('new_result', ({ room, result }: any) => processResult({ room, result }));");
            skip = 16;
            continue;
        }
     }
     newLines.push(lines[i]);
  }
  fs.writeFileSync('src/App.tsx', newLines.join('\\n'));
}
