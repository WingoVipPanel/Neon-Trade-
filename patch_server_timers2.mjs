import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const regex = /\/\/ Internal Loop for generating fallbacks and timers[\s\S]*?\}, 1000\);/m;

const replacement = `// Internal Loop for generating fallbacks and timers
  setInterval(() => {
    const nowTs = Math.floor(Date.now() / 1000);
    const newTimers = {
      '30s': 30 - (nowTs % 30),
      '1m': 60 - (nowTs % 60),
      '3m': 180 - (nowTs % 180),
      '5m': 300 - (nowTs % 300),
    };

    Object.keys(newTimers).forEach(r => {
      const room = r;
      const time = newTimers[room];
      
      io.emit('timer_sync', { room, time });

      const maxTime = room === '30s' ? 30 : room === '1m' ? 60 : room === '3m' ? 180 : 300;
      if (time === maxTime) {
        const prevPeriod = roomData[room].lastPeriod;
        setTimeout(async () => {
             if (roomData[room].lastPeriod === prevPeriod) {
                 console.log(\`Fallback triggered for \${room}\`);
                 const fallbackResult = generateFallbackResult(room);
                 await saveResult(room, fallbackResult);
             }
        }, 3000); 
      }
    });
  }, 1000);`;

if (code.match(regex)) {
   code = code.replace(regex, replacement);
   fs.writeFileSync('server.ts', code);
   console.log("Patched server timers successfully with regex!");
} else {
   console.log("Regex failed to find target");
}
