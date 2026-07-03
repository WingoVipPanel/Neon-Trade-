import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                  {/* Color */}
                                  <div className={\`px-2 py-0.5 rounded text-[11px] font-medium text-white \${bet.color === 'Green' ? 'bg-[#15be75]' : bet.color === 'Red' ? 'bg-[#ff4148]' : bet.color === 'Violet' ? 'bg-[#c742e4]' : bet.color === 'Green+Violet' ? 'bg-[linear-gradient(to_right,#c742e4_50%,#15be75_50%)]' : bet.color === 'Red+Violet' ? 'bg-[linear-gradient(to_right,#ff4148_50%,#c742e4_50%)]' : 'bg-[#15be75]'}\`}>
                                    {bet.color === 'Green+Violet' ? 'Violet Green' : bet.color === 'Red+Violet' ? 'Red Violet' : bet.color}
                                  </div>`;

const replacement = `                                  {/* Color */}
                                  <div 
                                    className="px-2 py-0.5 rounded text-[11px] font-medium text-white"
                                    style={{
                                      background: bet.color === 'Green' ? '#15be75' : 
                                                  bet.color === 'Red' ? '#ff4148' : 
                                                  bet.color === 'Violet' ? '#c742e4' : 
                                                  bet.color === 'Green+Violet' ? 'linear-gradient(to right, #c742e4 50%, #15be75 50%)' : 
                                                  bet.color === 'Red+Violet' ? 'linear-gradient(to right, #ff4148 50%, #c742e4 50%)' : '#15be75'
                                    }}
                                  >
                                    {bet.color === 'Green+Violet' ? 'Violet Green' : bet.color === 'Red+Violet' ? 'Red Violet' : bet.color}
                                  </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated pills with inline styles successfully!");
} else {
  console.log("Could not find target pills block for inline styles.");
}
