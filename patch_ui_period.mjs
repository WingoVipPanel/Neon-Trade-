import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                      if (lastPeriodObj && lastPeriodObj.period) {
                        try {
                          const lastPeriod = String(lastPeriodObj.period).replace(/\\D/g, '');
                          if (lastPeriod.length === 17) {
                            const basePart = lastPeriod.substring(0, 13);
                            const seqPart = lastPeriod.substring(13);
                            const nextSeq = (parseInt(seqPart) + 1).toString().padStart(4, '0');
                            periodCode = basePart + nextSeq;
                          } else {
                            periodCode = (BigInt(lastPeriod) + 1n).toString();
                          }
                        } catch (e) {
                          periodCode = generateTodayBase();
                        }
                      } else {
                        periodCode = generateTodayBase();
                      }`;

const replacement = `                      periodCode = getPeriodForTime(Math.floor(Date.now() / 1000), activeWingoRoom || '30s');`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Patched UI periodCode successfully!");
} else {
   console.log("Failed to find target");
}
