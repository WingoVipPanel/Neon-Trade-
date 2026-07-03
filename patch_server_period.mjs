import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const target = `const getColor = (num: number) => {`;

const replacement = `const getPeriodForTime = (time: number, room: Room) => {
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
};

const getColor = (num: number) => {`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('server.ts', code);
   console.log("Patched server getPeriodForTime successfully!");
} else {
   console.log("Failed to find target");
}
