import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                  {/* Size */}
                                  <div className={\`px-3 py-1 rounded text-[13px] font-medium text-white \${bet.size === 'Big' ? 'bg-[#ffcf24] text-black' : 'bg-[#4285f4]'}\`}>
                                    {bet.size}
                                  </div>
                                  {/* Color */}
                                  <div className={\`px-3 py-1 rounded text-[13px] font-medium text-white \${bet.color === 'Green' ? 'bg-[#15be75]' : bet.color === 'Red' ? 'bg-[#ff4148]' : bet.color === 'Violet' ? 'bg-[#c742e4]' : 'bg-gradient-to-r from-[#15be75] to-[#c742e4]'}\`}>
                                    {bet.color}
                                  </div>`;

const replacement = `                                  {/* Size */}
                                  <div className={\`px-2 py-0.5 rounded text-[11px] font-medium text-white \${bet.size === 'Big' ? 'bg-[#ffcf24] text-black' : 'bg-[#4285f4]'}\`}>
                                    {bet.size}
                                  </div>
                                  {/* Color */}
                                  <div className={\`px-2 py-0.5 rounded text-[11px] font-medium text-white \${bet.color === 'Green' ? 'bg-[#15be75]' : bet.color === 'Red' ? 'bg-[#ff4148]' : bet.color === 'Violet' ? 'bg-[#c742e4]' : bet.color === 'Green+Violet' ? 'bg-gradient-to-r from-[#c742e4] to-[#15be75]' : bet.color === 'Red+Violet' ? 'bg-gradient-to-r from-[#ff4148] to-[#c742e4]' : 'bg-gradient-to-r from-[#15be75] to-[#c742e4]'}\`}>
                                    {bet.color === 'Green+Violet' ? 'Violet Green' : bet.color === 'Red+Violet' ? 'Red Violet' : bet.color}
                                  </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed colors!");
} else {
  console.log("Could not find target block.");
}
