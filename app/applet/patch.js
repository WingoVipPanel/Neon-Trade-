const fs = require('fs');
const file = 'src/components/AdminPanelView.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(/text-xl md:text-2xl/g, 'text-lg md:text-xl');

fs.writeFileSync(file, data);
console.log("Patched!");
