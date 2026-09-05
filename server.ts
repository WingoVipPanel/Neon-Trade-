import express from "express";
import path from "path";
import compression from "compression";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDocs, getDoc, collection, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

let db: any = null;

async function initFirebase() {
  try {
    console.log("Initializing Firebase Client SDK on Server...");
    const app = initializeApp(firebaseConfig);
    
    // Explicitly use the database ID from config if present
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    
    // Verification test with a timeout to avoid blocking boot
    try {
      const healthCheckPromise = setDoc(doc(db, '_server_health', 'boot'), {
        timestamp: serverTimestamp(),
        status: 'ok',
        databaseId: firebaseConfig.firestoreDatabaseId || '(default)'
      });
      
      // Give it 5 seconds or proceed anyway
      await Promise.race([
        healthCheckPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore health check timeout")), 5000))
      ]);
      console.log("Firestore Health Check: SUCCESS");
    } catch (e: any) {
      console.error("Firestore Health Check ERROR:", e.message);
      console.log("Proceeding without Firestore verification...");
    }
  } catch (err: any) {
    console.error("CRITICAL Firebase Initialization Error:", err.message);
  }
}

const ROOMS = ['30s', '1m', '3m', '5m'] as const;
type Room = typeof ROOMS[number];

interface WingoHistoryRecord {
  period: string;
  number: number;
  color: 'Green' | 'Red' | 'Violet' | 'Green+Violet' | 'Red+Violet';
  size: 'Big' | 'Small';
}

const urlMap: Record<Room, string> = {
  '30s': 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json?pageSize=500',
  '1m': 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json?pageSize=500',
  '3m': 'https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json?pageSize=500',
  '5m': 'https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json?pageSize=500',
};

const pollIntervalMap: Record<Room, number> = {
  '30s': 3000,
  '1m': 5000,
  '3m': 10000,
  '5m': 15000,
};

const timers: Record<Room, number> = {
  '30s': 30,
  '1m': 60,
  '3m': 180,
  '5m': 300,
};

const roomData: Record<Room, { history: WingoHistoryRecord[], lastPeriod: string, nextManualResult?: number }> = {
  '30s': { history: [], lastPeriod: "" },
  '1m': { history: [], lastPeriod: "" },
  '3m': { history: [], lastPeriod: "" },
  '5m': { history: [], lastPeriod: "" }
};

const getPeriodForTime = (time: number, room: Room) => {
    const pDate = new Date(time * 1000);
    const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
    const seconds = pDate.getUTCSeconds();
    let seq = 1;
    let roomCode = '1';
    
    if (room === '30s') {
      seq = (minOfDay * 2) + (seconds < 30 ? 1 : 2);
      roomCode = '5';
    } else if (room === '1m') {
      seq = minOfDay + 1;
      roomCode = '1';
    } else if (room === '3m') {
      seq = Math.floor(minOfDay / 3) + 1;
      roomCode = '2';
    } else if (room === '5m') {
      seq = Math.floor(minOfDay / 5) + 1;
      roomCode = '3';
    }
    
    const yyyy = pDate.getUTCFullYear();
    const mm = String(pDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(pDate.getUTCDate()).padStart(2, '0');
    
    return `${yyyy}${mm}${dd}1000${roomCode}${String(seq).padStart(4, '0')}`;
};

const getColor = (num: number) => {
  if (num === 0) return 'Red+Violet';
  if (num === 5) return 'Green+Violet';
  if ([1, 3, 7, 9].includes(num)) return 'Green';
  return 'Red';
};

function generateFallbackResult(room: Room): WingoHistoryRecord {
  const currentLast = roomData[room].lastPeriod;
  let nextPeriodStr = currentLast;
  try {
    const basePart = currentLast.substring(0, 13);
    const seqPart = currentLast.substring(13);
    const nextSeq = String(parseInt(seqPart) + 1).padStart(4, '0');
    nextPeriodStr = basePart + nextSeq;
  } catch (e) {
    nextPeriodStr = String(parseInt(currentLast || "20260522100012001") + 1);
  }

  // Check if there is a manual result set
  let number: number;
  if (roomData[room].nextManualResult !== undefined) {
    number = roomData[room].nextManualResult!;
    delete roomData[room].nextManualResult;
  } else {
    number = Math.floor(Math.random() * 10);
  }

  const color = getColor(number);
  const size = number >= 5 ? 'Big' : 'Small';

  return { period: nextPeriodStr, number, color, size };
}

async function startServer() {
  const app = express();
  app.use(compression());
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  
  const PORT = 3000;
  
  await initFirebase();

  // Load history from Firestore per room
  if (db) {
    try {
        console.log("Fetching drawing history from Firestore...");
        try {
            for (const room of ROOMS) {
                 try {
                     const docObj = await getDoc(doc(db, 'globalResults', room));
                     if (docObj.exists()) {
                         const data = docObj.data();
                         roomData[room].history = data.history || [];
                         if (roomData[room].history.length > 0) {
                             roomData[room].lastPeriod = roomData[room].history[0].period;
                         }
                         console.log(`Room [${room}]: Loaded ${roomData[room].history.length} records. Latest period: ${roomData[room].lastPeriod || "None"}`);
                     }
                 } catch (err: any) {
                     console.error(`Query failed for room ${room}:`, err.message);
                 }
            }
        } catch (e: any) {
            console.error("Query failed for globalResults", e.message);
        }
    } catch (e) {
        console.error("Failed to load history from Firestore during boot:", e);
    }
  }

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.emit('initial_data', roomData);

    socket.on('set_prediction', ({ room, number }: { room: Room, number: number | null }) => {
      if (ROOMS.includes(room)) {
        if (number === null) {
          delete roomData[room].nextManualResult;
        } else {
          roomData[room].nextManualResult = number;
        }
        // Broadcast update to admins
        io.emit('prediction_updated', { room, nextManualResult: roomData[room].nextManualResult });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

// ... existing code
  const broadcastResult = (room: Room, result: WingoHistoryRecord) => {
    io.emit('new_result', { room, result });
  };

  const isWriting: Record<Room, boolean> = { '30s': false, '1m': false, '3m': false, '5m': false };
  const lastSavedTime: Record<Room, number> = { '30s': 0, '1m': 0, '3m': 0, '5m': 0 };
  let lastErrorLogTime = 0;
  const saveResult = async (room: Room, record: WingoHistoryRecord) => {
      // Avoid adding the same period twice
      if (roomData[room].history.some(h => h.period === record.period)) return;

      roomData[room].history.unshift(record);
      
      // Limit to 500
      if (roomData[room].history.length > 500) {
          roomData[room].history = roomData[room].history.slice(0, 500);
      }
      
      // Update lastPeriod to the newest in set
      roomData[room].lastPeriod = roomData[room].history[0].period;
      
      // Persist to Firestore (Async - don't block the loop)
      const now = Date.now();
      if (db && !isWriting[room] && (now - lastSavedTime[room] > 3600000)) {
          isWriting[room] = true;
          lastSavedTime[room] = now;
          setDoc(doc(db, 'globalResults', room), {
              history: roomData[room].history,
              lastUpdated: serverTimestamp()
          }).then(() => {
              isWriting[room] = false;
          }).catch((e: any) => {
              isWriting[room] = false;
              if (now - lastErrorLogTime > 600000) {
                  console.error(`Firestore Persistence Error (room=${room}, doc=globalResults/${room}):`, e.code, e.message);
                  lastErrorLogTime = now;
              }
          });
      }
      broadcastResult(room, record);
  };

  function generateFallbackResult(room: Room): WingoHistoryRecord {
    const currentLast = roomData[room].lastPeriod;
    let nextPeriodStr = currentLast;
    try {
      const basePart = currentLast.substring(0, 13);
      const seqPart = currentLast.substring(13);
      const nextSeq = String(parseInt(seqPart) + 1).padStart(4, '0');
      nextPeriodStr = basePart + nextSeq;
    } catch (e) {
      nextPeriodStr = String(parseInt(currentLast || "20260522100012001") + 1);
    }

    // Check if there is a manual result set
    let number: number;
    if (roomData[room].nextManualResult !== undefined) {
      number = roomData[room].nextManualResult!;
      delete roomData[room].nextManualResult;
      // Broadcast update to admins
      io.emit('prediction_updated', { room, nextManualResult: undefined });
    } else {
      number = Math.floor(Math.random() * 10);
    }

    const color = getColor(number);
    const size = number >= 5 ? 'Big' : 'Small';

    return { period: nextPeriodStr, number, color, size };
  }

  const fetchRoomData = async (room: Room, fetchAll: boolean = false) => {
    try {
      const urlBase = urlMap[room].split('?')[0]; 
      
      let allRecords: any[] = [];
      
      if (fetchAll) {
          const fetchPage = async (page) => {
             const res = await fetch(`${urlBase}?pageNo=${page}&pageSize=10`, { signal: AbortSignal.timeout(10000) });
             if (!res.ok) return [];
             const d = await res.json();
             return d?.data?.list || [];
          };
          const promises = [];
          for (let page = 1; page <= 50; page++) {
             promises.push(fetchPage(page).catch(() => []));
          }
          const results = await Promise.all(promises);
          for (const list of results) {
             allRecords = [...allRecords, ...list];
          }
      } else {
          const res = await fetch(`${urlBase}?pageNo=1&pageSize=10`, { signal: AbortSignal.timeout(10000) });
          if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
          const d = await res.json();
          allRecords = d?.data?.list || [];
      }
      
      if (allRecords.length > 0) {
        const newRecords: WingoHistoryRecord[] = [];
        const currentActivePeriod = getPeriodForTime(Math.floor(Date.now() / 1000), room);

        for (let i = allRecords.length - 1; i >= 0; i--) {
          const item = allRecords[i];
          let num = parseInt(item.number);
          const period = item.issueNumber;
          
          if (period >= currentActivePeriod) continue;
          
          const existsInHistory = roomData[room].history.some(h => h.period === period);
          const existsInNew = newRecords.some(r => r.period === period);
          if (!existsInHistory && !existsInNew) {
              const record: WingoHistoryRecord = {
                period: period,
                number: num,
                color: getColor(num),
                size: num >= 5 ? 'Big' : 'Small'
              };
              newRecords.push(record);
          }
        }

        if (newRecords.length > 0) {
            // Apply prediction only to the MOST RECENT new record in polling mode
            if (!fetchAll && roomData[room].nextManualResult !== undefined) {
               const latestIndex = newRecords.length - 1;
               newRecords[latestIndex].number = roomData[room].nextManualResult;
               newRecords[latestIndex].color = getColor(newRecords[latestIndex].number);
               newRecords[latestIndex].size = newRecords[latestIndex].number >= 5 ? 'Big' : 'Small';
               
               delete roomData[room].nextManualResult;
               io.emit('prediction_updated', { room, nextManualResult: undefined });
            }

            if (newRecords.length === 1) {
                saveResult(room, newRecords[0]);
            } else {
                console.log(`[${room}] Adding ${newRecords.length} records...`);
                // Use a loop to ensure each one is saved and broadcasted
                for (let i = 0; i < newRecords.length; i++) {
                    await saveResult(room, newRecords[i]);
                }
            }
        }
      }
    } catch (e: any) {
      if (fetchAll) console.error(`Failed full fetch ${room}: ${e.message}`);
    }
  };

  // Internal Loop for generating fallbacks and timers
  setInterval(() => {
    const nowTs = Math.floor(Date.now() / 1000);
    const newTimers = {
      '30s': 30 - (nowTs % 30),
      '1m': 60 - (nowTs % 60),
      '3m': 180 - (nowTs % 180),
      '5m': 300 - (nowTs % 300),
    };

    Object.keys(newTimers).forEach(r => {
      const room = r as Room;
      const time = newTimers[room];
      
      io.emit('timer_sync', { room, time });

      const maxTime = room === '30s' ? 30 : room === '1m' ? 60 : room === '3m' ? 180 : 300;
      if (time === maxTime) {
        const prevPeriod = roomData[room].lastPeriod;
        setTimeout(async () => {
             if (roomData[room].lastPeriod === prevPeriod) {
                 console.log(`Fallback triggered for ${room}`);
                 const fallbackResult = generateFallbackResult(room);
                 await saveResult(room, fallbackResult);
             }
        }, 3000); 
      }
    });
  }, 1000);

  // Polling from network
  ROOMS.forEach((room) => {
    setInterval(() => {
        fetchRoomData(room);
    }, pollIntervalMap[room]);
  });

  // initial fetch
  ROOMS.forEach(r => {
      fetchRoomData(r, roomData[r].history.length < 500);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
