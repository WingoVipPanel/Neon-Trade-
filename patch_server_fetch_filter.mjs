import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const target = `        // Iterate in reverse to save older records first if they are new to us
        const newRecords: WingoHistoryRecord[] = [];
        for (let i = allRecords.length - 1; i >= 0; i--) {
          const item = allRecords[i];
          let num = parseInt(item.number);
          const period = item.issueNumber;
          
          // Check if this period is already in our history`;

const replacement = `        // Iterate in reverse to save older records first if they are new to us
        const newRecords: WingoHistoryRecord[] = [];
        const currentActivePeriod = getPeriodForTime(Math.floor(Date.now() / 1000), room);

        for (let i = allRecords.length - 1; i >= 0; i--) {
          const item = allRecords[i];
          let num = parseInt(item.number);
          const period = item.issueNumber;
          
          // Prevent early results: do not process results for periods that are still active or in the future
          if (period >= currentActivePeriod) {
             continue;
          }
          
          // Check if this period is already in our history`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('server.ts', code);
   console.log("Patched server fetch filter successfully!");
} else {
   console.log("Failed to find target");
}
