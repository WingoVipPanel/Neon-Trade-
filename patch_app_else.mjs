import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            } else if (socketConnectedRef.current) {
              // Stale firestore data, BUT socket is connected! We rely on socket's initial_data and new_result.
              console.log(\`[Firestore] room \${room} is stale but Socket is connected. Ignoring stale firestore data.\`);
            } else {
            } else {`;

const replacement = `            } else if (socketConnectedRef.current) {
              // Stale firestore data, BUT socket is connected! We rely on socket's initial_data and new_result.
              console.log(\`[Firestore] room \${room} is stale but Socket is connected. Ignoring stale firestore data.\`);
            } else {`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Patched App.tsx successfully!");
} else {
   console.log("Failed to find double else");
}
