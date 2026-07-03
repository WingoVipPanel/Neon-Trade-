import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                                                  <div className="flex items-center gap-1.5 font-medium">
                                                    <span className={historyItem.color === 'Green' ? 'text-[#15be75]' : historyItem.color === 'Red' ? 'text-[#ff4148]' : 'text-[#c742e4]'}>
                                                      {historyItem.number} {historyItem.color} {historyItem.size}
                                                    </span>
                                                  </div>`;

const replacement = `                                                  <div className="flex items-center gap-2 font-medium">
                                                    {/* Ball */}
                                                    <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                                       <img src={LOTTERY_BALLS[historyItem.number as number]} className="w-full h-full object-contain drop-shadow-md" alt={historyItem.number?.toString()} />
                                                    </div>
                                                    {/* Size */}
                                                    <div className={\`px-1.5 py-0.5 rounded text-[10px] font-bold text-white \${historyItem.size === 'Big' ? 'bg-[#faa449]' : 'bg-[#508cf3]'}\`}>
                                                      {historyItem.size}
                                                    </div>
                                                    {/* Color */}
                                                    <div 
                                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                                      style={{
                                                        background: historyItem.color === 'Green' ? '#15be75' : 
                                                                    historyItem.color === 'Red' ? '#ff4148' : 
                                                                    historyItem.color === 'Violet' ? '#c742e4' : 
                                                                    historyItem.color === 'Green+Violet' ? 'linear-gradient(to right, #c742e4 50%, #15be75 50%)' : 
                                                                    historyItem.color === 'Red+Violet' ? 'linear-gradient(to right, #ff4148 50%, #c742e4 50%)' : '#15be75'
                                                      }}
                                                    >
                                                      {historyItem.color === 'Green+Violet' ? 'Violet Green' : historyItem.color === 'Red+Violet' ? 'Red Violet' : historyItem.color}
                                                    </div>
                                                  </div>`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Updated history pills successfully!");
} else {
  console.log("Could not find target history pills block.");
}
