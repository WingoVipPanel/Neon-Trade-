import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<img src={numberBalls[bet.number as number]} className="w-full h-full object-contain drop-shadow-md" alt={bet.number?.toString()} />`;
const replacement = `<img src={LOTTERY_BALLS[bet.number as number]} className="w-full h-full object-contain drop-shadow-md" alt={bet.number?.toString()} />`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed numberBalls to LOTTERY_BALLS!");
} else {
  console.log("Could not find numberBalls string.");
}
