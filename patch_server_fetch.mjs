import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

const target = `      if (fetchAll) {
          console.log(\`[\${room}] Fetching full 50 pages (500 records) from API...\`);
          // Fetch up to 50 pages sequentially to populate initial history
          for (let page = 1; page <= 50; page++) {
             try {
                const res = await fetch(\`\${urlBase}?pageNo=\${page}&pageSize=10\`, { signal: AbortSignal.timeout(5000) });
                if (!res.ok) {
                   console.log(\`[\${room}] HTTP Error on page \${page}: \${res.status}\`);
                   break;
                }
                const d = await res.json();
                const list = d?.data?.list || [];
                if (list.length === 0) break;
                allRecords = [...allRecords, ...list];
                if (allRecords.length >= 500) break;
             } catch (e) {
                console.log(\`[\${room}] Fetch error at page \${page}:\`, e);
                break; // stop fetching if we encounter an error to avoid spamming
             }
          }
      } else {`;

const replacement = `      if (fetchAll) {
          console.log(\`[\${room}] Fetching full 50 pages (500 records) from API concurrently...\`);
          const fetchPage = async (page) => {
             const res = await fetch(\`\${urlBase}?pageNo=\${page}&pageSize=10\`, { signal: AbortSignal.timeout(10000) });
             if (!res.ok) return [];
             const d = await res.json();
             return d?.data?.list || [];
          };
          const promises = [];
          for (let page = 1; page <= 50; page++) {
             promises.push(fetchPage(page).catch(e => { console.log('page err', page); return []; }));
          }
          const results = await Promise.all(promises);
          for (const list of results) {
             allRecords = [...allRecords, ...list];
          }
      } else {`;

if (code.includes(target)) {
   code = code.replace(target, replacement);
   fs.writeFileSync('server.ts', code);
   console.log("Patched server.ts successfully!");
} else {
   console.log("Failed to find target");
}
