import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const target = `  // Internal Loop for generating fallbacks and timers
  setInterval(() => {
    Object.keys(timers).forEach(r => {
      const room = r as Room;
      
      timers[room] -= 1;
      
      // Every sec broadcast timer (we could just let client sync, but exact timer is nice)
      io.emit('timer_sync', { room, time: timers[room] });

      if (timers[room] <= 0) {
        // Time to produce a result!
        // Try fetching first, we give it 2 seconds max
        const prevPeriod = roomData[room].lastPeriod;
        setTimeout(async () => {
             // Let see if fetch worked (it polls constantly anyway)
             if (roomData[room].lastPeriod === prevPeriod) {
                 console.log(\`Fallback triggered for \${room}\`);
                 const fallbackResult = generateFallbackResult(room);
                 await saveResult(room, fallbackResult);
             }
        }, 1500); // give it a chance to be updated by the network poller

        // Reset timer
        if (room === '30s') timers[room] = 30;
        if (room === '1m') timers[room] = 60;
        if (room === '3m') timers[room] = 180;
        if (room === '5m') timers[room] = 300;
      }
    });
  }, 1000);`;

const replacement = `  // Internal Loop for generating fallbacks and timers
  setInterval(() => {
    const nowTs = Math.floor(Date.now() / 1000);
    const newTimers = {
      '30s': 30 - (nowTs % 30),
      '1m': 60 - (nowTs % 60),
      '3m': 180 - (nowTs % 180),
      '5m': 300 - (nowTs % 300),
    };

    Object.keys(newTimers).forEach(r => {
      const room = r as Room;
      const time = newTimers[room];
      
      io.emit('timer_sync', { room, time });

      // If timer is exactly at the boundary (e.g. 30, 60, 180, 300)
      const maxTime = room === '30s' ? 30 : room === '1m' ? 60 : room === '3m' ? 180 : 300;
      if (time === maxTime) {
        const prevPeriod = roomData[room].lastPeriod;
        setTimeout(async () => {
             // If after 3 seconds we still don't have a new result, generate fallback
             if (roomData[room].lastPeriod === prevPeriod) {
                 console.log(\`Fallback triggered for \${room}\`);
                 const fallbackResult = generateFallbackResult(room);
                 await saveResult(room, fallbackResult);
             }
        }, 3000); 
      }
    });
  }, 1000);`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('server.ts', code);
   console.log("Patched server timers successfully!");
} else {
   console.log("Failed to find target again");
}
