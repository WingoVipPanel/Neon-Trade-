import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const target = `          if (!existsInHistory && !existsInNew) {
              const record: WingoHistoryRecord = {
                period: period,
                number: num,
                color: getColor(num),
                size: num >= 5 ? 'Big' : 'Small'
              };
              newRecords.push(record);
          }`;

const replacement = `          if (!existsInHistory && !existsInNew) {
              // Override with admin's manual prediction if set
              if (roomData[room].nextManualResult !== undefined) {
                num = roomData[room].nextManualResult;
                delete roomData[room].nextManualResult;
              }

              const record: WingoHistoryRecord = {
                period: period,
                number: num,
                color: getColor(num),
                size: num >= 5 ? 'Big' : 'Small'
              };
              newRecords.push(record);
          }`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('server.ts', code);
  console.log("Patched server.ts successfully!");
} else {
  console.log("Could not find target in server.ts");
}
