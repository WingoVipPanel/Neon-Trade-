import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("    });\n\n    });\n\n    socket.on('timer_sync'", "    });\n\n    socket.on('timer_sync'");

fs.writeFileSync('src/App.tsx', content);
