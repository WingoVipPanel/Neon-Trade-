import fs from 'fs';

let content = fs.readFileSync('src/components/AdminPanelView.tsx', 'utf-8');

// 1. Add io import
content = content.replace(
  "import { motion, AnimatePresence } from 'motion/react';",
  "import { motion, AnimatePresence } from 'motion/react';\nimport { io } from 'socket.io-client';"
);

// 2. Replace Local Wingo countdown states with Socket ones
content = content.replace(
  "  // Wingo Room Countdown Controller State",
  "  // Wingo Room Countdown Controller State\n  const [activeAdminRoom, setActiveAdminRoom] = useState<'30s' | '1m' | '3m' | '5m'>('30s');\n  const [roomTimers, setRoomTimers] = useState<Record<string, number>>({'30s': 0, '1m': 0, '3m': 0, '5m': 0});\n  const [roomData, setRoomData] = useState<Record<string, any>>({'30s': { history:[], lastPeriod: '' }, '1m': { history:[], lastPeriod: '' }, '3m': { history:[], lastPeriod: '' }, '5m': { history:[], lastPeriod: '' }});\n  const [serverNextPrediction, setServerNextPrediction] = useState<Record<string, number|null>>({'30s': null, '1m': null, '3m': null, '5m': null});\n  const socketRef = useRef<any>(null);\n  const [socketConnected, setSocketConnected] = useState(false);\n"
);

// 3. Remove old secondsLeft and isTimerActive
content = content.replace("  const [secondsLeft, setSecondsLeft] = useState(180); // Default: 3 min (180s)\n", "");
content = content.replace("  const [isTimerActive, setIsTimerActive] = useState(true);\n", "");
content = content.replace("  const [currentPeriod, setCurrentPeriod] = useState('202606041125');\n", "");

// 4. Inject Socket useEffect inside initials
content = content.replace(
  "// -------------------------------------------------------------\n  // COUNTDOWN CLOCK TICK LOGIC\n  // -------------------------------------------------------------",
  `// -------------------------------------------------------------
  // COUNTDOWN CLOCK TICK LOGIC (NOW SOCKET-SYNCED)
  // -------------------------------------------------------------

  useEffect(() => {
    let active = true;
    const socket = io({
      reconnectionAttempts: 10,
      timeout: 20000,
      autoConnect: true
    });
    socketRef.current = socket;

    socket.on('connect', () => { if (active) setSocketConnected(true); });
    socket.on('disconnect', () => { if (active) setSocketConnected(false); });
    
    socket.on('initial_data', (rData: any) => {
       if (active) setRoomData(rData);
    });

    socket.on('timer_sync', ({ room, time }: any) => {
       if (active) setRoomTimers(prev => ({ ...prev, [room]: time }));
    });
    
    socket.on('prediction_updated', ({ room, nextManualResult }: any) => {
       if (active) {
         setServerNextPrediction(prev => ({ ...prev, [room]: nextManualResult }));
         // Update local pick if in that room
         if (activeAdminRoom === room) {
           setSelectedNextResult(nextManualResult ?? null);
         }
       }
    });

    socket.on('new_result', ({ room, result }: any) => {
       if (active) {
         setRoomData(prev => {
             let state = { ...prev };
             if (state[room]) {
                 state[room].history = [result, ...(state[room].history || [])].slice(0, 50);
                 state[room].lastPeriod = result.period;
             }
             return state;
         });
       }
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [activeAdminRoom]); // Added sync active room to sync lock correctly

  // Read current active values dynamically
  const activeSecondsLeft = roomTimers[activeAdminRoom] || 0;
  const activeDraws = roomData[activeAdminRoom]?.history || [];
  
  // Predict next period string based on lastPeriod logic...
  let lastPeriod = roomData[activeAdminRoom]?.lastPeriod || "20260522100012000";
  let activeCurrentPeriod = "";
  try {
     const bp = lastPeriod.substring(0, 13);
     const seq = lastPeriod.substring(13);
     activeCurrentPeriod = bp + String(parseInt(seq) + 1).padStart(4, '0');
  } catch(e) {
     activeCurrentPeriod = String(parseInt(lastPeriod) + 1);
  }`
);

// 4.5. comment out the old clock ticking useEffect and handlers
content = content.replace(
  /useEffect\(\(\) => \{\n    let timerInterval: any = null;\n[\s\S]*?\}, \[secondsLeft, isTimerActive\]\);/,
  "// (Old local timer interval removed in favor of Server Socket Sync)"
);

content = content.replace("const triggerDrawSettle = () => {", "const triggerDrawSettle = () => { notifyToast('Wait for server auto-settle round... Timer controls are server-authoritative.'); return;");

content = content.replace("const handleResetTimer = () => {", "const handleResetTimer = () => { notifyToast('Disabled in Server-Sync mode.'); return; ");
content = content.replace("const handleToggleTimer = () => {", "const handleToggleTimer = () => { notifyToast('Disabled in Server-Sync mode.'); return; ");

// 5. Update UI values in the markup from secondsLeft -> activeSecondsLeft
content = content.replace(/secondsLeft \/ 180/g, "activeSecondsLeft / (activeAdminRoom === '30s' ? 30 : activeAdminRoom === '1m' ? 60 : activeAdminRoom === '3m' ? 180 : 300)");
content = content.replace(/secondsLeft \/ 60/g, "activeSecondsLeft / 60");
content = content.replace(/secondsLeft \% 60/g, "activeSecondsLeft % 60");
content = content.replace(/\{currentPeriod\}/g, "{activeCurrentPeriod}");
content = content.replace(/isTimerActive \?/g, "true ?");
content = content.replace(/isTimerActive \?/g, "true ?");

// Change rendering of draws array 
content = content.replace(/draws\.map/g, "activeDraws.slice(0,10).map");


// 6. Handle Set Prediction
content = content.replace(
  "const handleConfirmNextResult = () => {",
  `const handleConfirmNextResult = () => {
    if (selectedNextResult === null) {
      notifyToast("Select a number, or clear lock by clicking active again.");
      if (socketRef.current) socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: null });
      return;
    }
    if (socketRef.current) socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: selectedNextResult });
    notifyToast(\`Success: Overruled server draw for \${activeAdminRoom} to \${selectedNextResult}!\`);
  }`
);

// 7. Inject Room Selector Header into Wingo Control Cabinet
content = content.replace(
  `<h2 className="text-lg md:text-xl font-display font-bold text-[#f0c040] uppercase tracking-wider text-left">Wingo Control Cabinet</h2>
                <p className="text-xs text-slate-400 mt-1">Real-time clock trigger cabinet to pause, resume, reset periods or enforce custom outcomes.</p>`,
  `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-display font-bold text-[#f0c040] uppercase tracking-wider text-left">
                      Wingo Control Cabinet
                      {socketConnected ? <span className="ml-3 inline-flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"/> LIVE CONNECTED</span> : <span className="ml-3 inline-flex items-center gap-1 text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full">OFFLINE</span>}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">Manage predictions directly injected into active server loop mechanisms.</p>
                  </div>
                  <div className="flex gap-2 bg-[#0a0a0f] p-1.5 rounded-xl border border-slate-800">
                    {(['30s', '1m', '3m', '5m'] as const).map(room => (
                      <button 
                        key={room} 
                        onClick={() => { setActiveAdminRoom(room); setSelectedNextResult(serverNextPrediction[room] ?? null); }} 
                        className={\`px-4 py-2 rounded-lg text-xs font-bold font-dmmono uppercase transition \${activeAdminRoom === room ? 'bg-[#f0c040] text-black shadow-md' : 'text-slate-400 hover:text-white'}\`}
                      >
                        {room}
                      </button>
                    ))}
                  </div>
                </div>`
);


// 8. Remove the old serializers for currentPeriod and timerSecs
content = content.replace("const savedPeriod = localStorage.getItem('wt_admin_current_period');\n    if (savedPeriod) setCurrentPeriod(savedPeriod);\n\n    const savedSeconds = localStorage.getItem('wt_admin_timer_secs');\n    if (savedSeconds) setSecondsLeft(parseInt(savedSeconds));", "");
content = content.replace("const localDraws = localStorage.getItem('wt_admin_draws');\n    if (localDraws) {\n      setDraws(JSON.parse(localDraws));\n    } else {\n      setDraws(SEED_DRAWS);\n      localStorage.setItem('wt_admin_draws', JSON.stringify(SEED_DRAWS));\n    }", "// Draws managed by server socket state\n    setDraws(SEED_DRAWS);");

fs.writeFileSync('src/components/AdminPanelView.tsx', content);
console.log("Patched!");
