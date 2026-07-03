import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `<div className="px-4 pb-2 space-y-2.5 relative">`;
const targetEnd1 = `<div className="mx-4 my-3 border-t border-dashed border-white/20" />`;

const startIndex = code.indexOf(target1);
const endIndex = code.indexOf(targetEnd1, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  let block = code.substring(startIndex, endIndex);
  block = block.replaceAll('text-sm relative', 'text-[13px] relative');
  block = block.replaceAll('text-[11.5px]', 'text-[11px]');
  
  code = code.substring(0, startIndex) + block + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated font sizes!");
} else {
  console.log("Could not find block.");
}
