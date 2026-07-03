import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStart = `                                  {/* Ball */}
                                  <div className={\`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold \${bet.color === 'Green' ? 'bg-[#15be75] text-white' : bet.color === 'Red' ? 'bg-[#ff4148] text-white' : 'bg-[#c742e4] text-white'}\`}>
                                     {bet.number}
                                  </div>`;

const newCode = `                                  {/* Ball */}
                                  <div className="w-[30px] h-[30px] flex items-center justify-center shrink-0">
                                     <img src={numberBalls[bet.number as number]} className="w-full h-full object-contain drop-shadow-md" alt={bet.number?.toString()} />
                                  </div>`;

const startIndex = code.indexOf(targetStart);
if (startIndex !== -1) {
  code = code.substring(0, startIndex) + newCode + code.substring(startIndex + targetStart.length);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced ball successfully!");
} else {
  console.log("Could not find ball block to replace.");
}
