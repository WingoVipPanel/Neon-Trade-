import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `    const targetRoom = activeWingoRoom || '30s';
    const roomHist = wingoHistory[targetRoom] || [];
    const lastPeriodObj = roomHist.find(h => h.number !== -1) || roomHist[0];
    const lastPeriod = lastPeriodObj?.period;
    
    let nextPeriod = '';
    if (lastPeriod) {
      const cleaned = lastPeriod.replace(/\\D/g, '');
      if (cleaned.length === 17) {
        try {
          const basePart = cleaned.substring(0, 13);
          const seqPart = cleaned.substring(13);
          const nextSeq = String(parseInt(seqPart) + 1).padStart(4, '0');
          nextPeriod = basePart + nextSeq;
        } catch (e) {
          nextPeriod = (BigInt(cleaned) + 1n).toString();
        }
      } else {
        nextPeriod = (BigInt(cleaned) + 1n).toString();
      }
    } else {
      nextPeriod = '20260521100012001';
    }`;

const replacement = `    const targetRoom = activeWingoRoom || '30s';
    let nextPeriod = getPeriodForTime(Math.floor(Date.now() / 1000), targetRoom);`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Patched executeWingoBet period logic successfully!");
} else {
   console.log("Failed to find target");
}
