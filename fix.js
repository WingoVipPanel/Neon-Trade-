let fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');
content = content.replace("    });\\n\\n    return () => { ", "    };\\n\\n    return () => { ");
fs.writeFileSync('src/App.tsx', content);
