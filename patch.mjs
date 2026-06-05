import fs from 'fs';
const content = fs.readFileSync('src/App.tsx', 'utf-8');
const targetStr = `                                   <p className="text-white/40 text-[11px] mt-1 font-sans">Start playing to see your strategy history here</p>\n                                 </div>\n                               </div>\n                             )}\n                         </div>`;

const newStr = `                                   <p className="text-white/40 text-[11px] mt-1 font-sans">Start playing to see your strategy history here</p>\n                                 </div>\n                               </div>\n                             )}\n\n                             {allMyBets.length > 0 && (\n                               <div className="flex items-center justify-center gap-4 py-4 mt-2">\n                                 <button\n                                   className="w-10 h-10 shadow-md rounded-2xl flex items-center justify-center border-white/5 border disabled:opacity-50 transition cursor-pointer"\n                                   style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}\n                                   onClick={() => setMyHistoryPage(p => Math.max(1, p - 1))}\n                                   disabled={myHistoryPage === 1}\n                                 >\n                                   <ChevronLeft className="h-5 w-5 text-white/80" />\n                                 </button>\n                                 <span className="font-mono text-white/60 font-medium text-[13px]">\n                                   {myHistoryPage}/{totalMyPages}\n                                 </span>\n                                 <button\n                                   className="w-10 h-10 shadow-md rounded-2xl flex items-center justify-center border-white/5 border disabled:opacity-50 transition cursor-pointer"\n                                   style={{ background: 'linear-gradient(180deg, #3d0f10 0%, #2c1012 100%)' }}\n                                   onClick={() => setMyHistoryPage(p => Math.min(totalMyPages, p + 1))}\n                                   disabled={myHistoryPage === totalMyPages}\n                                 >\n                                   <ChevronRight className="h-5 w-5 text-white/80" />\n                                 </button>\n                               </div>\n                             )}\n                               </>\n                             );\n                           })()}\n                         </div>`;
if (content.includes(targetStr)) {
    fs.writeFileSync('src/App.tsx', content.replace(targetStr, newStr));
    console.log("Success");
} else {
    // If not exact matching space, let's use a regex
    console.log("Exact match failed, trying regex");
    const regex = /<p className="text-white\/40 text-\[11px\] mt-1 font-sans">Start playing to see your strategy history here<\/p>\s*<\/div>\s*<\/div>\s*<\/div>\s*\)}\s*<\/div>/g;
    
    // Wait, the div closing sequence is: </p> -> </div> -> </div> -> )} -> </div>
    const regex2 = /<p className="text-white\/40 text-\[11px\] mt-1 font-sans">Start playing to see your strategy history here<\/p>\s*<\/div>\s*<\/div>\s*\)}\s*<\/div>/;
    
    if (regex2.test(content)) {
        fs.writeFileSync('src/App.tsx', content.replace(regex2, newStr.trim()));
        console.log("Success with regex2");
    } else {
        console.error("Regex also failed to find the target snippet.");
    }
}
