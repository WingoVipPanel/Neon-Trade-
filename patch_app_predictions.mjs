import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);`;

const replacement1 = `  const [socketConnected, setSocketConnected] = useState(false);
  const socketConnectedRef = useRef(false);
  const [manualPredictions, setManualPredictions] = useState<{ [key: string]: number | null }>({});
  const manualPredictionsRef = useRef<{ [key: string]: number | null }>({});

  useEffect(() => {
    socketConnectedRef.current = socketConnected;
  }, [socketConnected]);

  // Sync predictions for serverless execution
  useEffect(() => {
    if (!db) return;
    const rooms = ['30s', '1m', '3m', '5m'];
    const unsubs = rooms.map(room => {
       return onSnapshot(doc(db, 'globalResults', room + '_prediction'), (snap) => {
          if (snap.exists()) {
             const data = snap.data();
             const val = data.nextManualResult !== undefined ? data.nextManualResult : null;
             setManualPredictions(prev => {
                const next = { ...prev, [room]: val };
                manualPredictionsRef.current = next;
                return next;
             });
          }
       });
    });
    return () => unsubs.forEach(u => u());
  }, []);
`;

const target2 = `  const generateDeterministicResult = (room, periodStr) => {
    let hash = 0;
    const str = periodStr + room + "salt";
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    const num = Math.abs(hash) % 10;
    let color = '';
    if (num === 0) color = 'Red+Violet';
    else if (num === 5) color = 'Green+Violet';
    else if (num % 2 === 0) color = 'Red';
    else color = 'Green';
    return { period: periodStr, number: num, color: color, size: num >= 5 ? 'Big' : 'Small' };
  };`;

const replacement2 = `  const generateDeterministicResult = (room, periodStr) => {
    let num = 0;
    const manualNum = manualPredictionsRef.current[room];
    if (manualNum !== undefined && manualNum !== null) {
       num = manualNum;
       // We can only use it once, so we clear it locally to avoid repeating
       manualPredictionsRef.current[room] = null;
    } else {
       let hash = 0;
       const str = periodStr + room + "salt";
       for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
       num = Math.abs(hash) % 10;
    }
    
    let color = '';
    if (num === 0) color = 'Red+Violet';
    else if (num === 5) color = 'Green+Violet';
    else if (num % 2 === 0) color = 'Red';
    else color = 'Green';
    return { period: periodStr, number: num, color: color, size: num >= 5 ? 'Big' : 'Small' };
  };`;

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, replacement1);
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched App.tsx for manual predictions successfully!");
} else {
  console.log("Could not find targets in App.tsx!");
}
