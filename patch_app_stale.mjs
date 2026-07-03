import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            const isFresh = lastUpdatedMs && (Date.now() - lastUpdatedMs < 5 * 60 * 1000);

            if (isFresh) {`;

const replacement = `            const isFresh = lastUpdatedMs && (Date.now() - lastUpdatedMs < 5 * 60 * 1000);

            if (isFresh) {
              // Valid fresh data from firestore
              setWingoHistory(prev => {
                const newState = { ...prev, [room]: data.history };
                localStorage.setItem('wingo_history', JSON.stringify(newState));
                return newState;
              });
            } else if (socketConnectedRef.current) {
              // Stale firestore data, BUT socket is connected! We rely on socket's initial_data and new_result.
              console.log(\`[Firestore] room \${room} is stale but Socket is connected. Ignoring stale firestore data.\`);
            } else {`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   // Need to remove the original setWingoHistory block inside if (isFresh) since we added it to the replacement
   const target2 = `              setWingoHistory(prev => {
                const newState = { ...prev, [room]: data.history };
                localStorage.setItem('wingo_history', JSON.stringify(newState));
                return newState;
              });
            } else {`;
   code = code.replace(target2, `            } else {`);
   fs.writeFileSync('src/App.tsx', code);
   console.log("Patched App.tsx successfully!");
} else {
   console.log("Failed to find target");
}
