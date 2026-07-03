const fs = require('fs');
let code = fs.readFileSync('src/components/InviteWheelView.tsx', 'utf-8');

code = code.replace('{ id: 5, label: "₹377", value: 377, prob: 3 }', '{ id: 5, label: "₹7", value: 7, prob: 3 }');
code = code.replace('const isFirstSpin = totalSpins === 0;', 'const isFirstSpin = localUsedSpins === 0;');

fs.writeFileSync('src/components/InviteWheelView.tsx', code);
console.log("Done");
