import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `  const getPeriodForTime = (time, room) => {
    const pDate = new Date(time * 1000);
    const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
    let seq = (minOfDay * 2) + Math.floor(pDate.getUTCSeconds() / 30);
    if (room === '1m') seq = minOfDay;
    else if (room === '3m') seq = Math.floor(minOfDay / 3);
    else if (room === '5m') seq = Math.floor(minOfDay / 5);
    
    const yyyy = pDate.getUTCFullYear();
    const mm = String(pDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(pDate.getUTCDate()).padStart(2, '0');
    
    return \`\${yyyy}\${mm}\${dd}10001\${String(seq).padStart(4, '0')}\`;
  };`;

const replacement = `  const getPeriodForTime = (time, room) => {
    const pDate = new Date(time * 1000);
    const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
    const seconds = pDate.getUTCSeconds();
    let seq = 1;
    let roomCode = '1';
    
    if (room === '30s') {
      seq = (minOfDay * 2) + (seconds < 30 ? 1 : 2);
      roomCode = '5';
    } else if (room === '1m') {
      seq = minOfDay + 1;
      roomCode = '1';
    } else if (room === '3m') {
      seq = Math.floor(minOfDay / 3) + 1;
      roomCode = '2';
    } else if (room === '5m') {
      seq = Math.floor(minOfDay / 5) + 1;
      roomCode = '3';
    }
    
    const yyyy = pDate.getUTCFullYear();
    const mm = String(pDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(pDate.getUTCDate()).padStart(2, '0');
    
    return \`\${yyyy}\${mm}\${dd}1000\${roomCode}\${String(seq).padStart(4, '0')}\`;
  };`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Patched getPeriodForTime successfully!");
} else {
   console.log("Failed to find target");
}
