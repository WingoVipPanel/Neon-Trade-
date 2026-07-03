const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const start = code.indexOf('{/* Sub Tabs: winning results vs my bets */}');
const end = code.indexOf('              </motion.div>\n            )}\n          </AnimatePresence>');
console.log(code.substring(start, end));
