import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server } from "socket.io";
import admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import firebaseConfig from './firebase-applet-config.json';

let db: any = null;

async function initFirebase() {
  try {
    if (admin.apps.length === 0) {
      console.log("Initializing Firebase Admin...");
      admin.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    
    // Explicitly use the database ID from config if present
    const dbId = firebaseConfig.firestoreDatabaseId;
    console.log(`Setting up Firestore. Project: ${admin.app().options.projectId}, Database: ${dbId}`);
    
    db = getFirestore(admin.app(), dbId || '(default)');
    
    // Verification test with a timeout to avoid blocking boot
    try {
      const healthCheckPromise = db.collection('_server_health').doc('boot').set({
        timestamp: FieldValue.serverTimestamp(),
        status: 'ok',
        databaseId: dbId || '(default)'
      });
      
      // Give it 3 seconds or proceed anyway
      await Promise.race([
        healthCheckPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore health check timeout")), 3000))
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
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: "*" } });
  
  const PORT = 3000;
  
  await initFirebase();

  // Load history from Firestore per room
  if (db) {
    try {
        console.log("Fetching drawing history from Firestore...");
        // Fetch all recent records and filter in memory to avoid complex index requirements on boot
        const snap = await db.collection('wingo_history')
            .orderBy('serverTimestamp', 'desc')
            .limit(4000)
            .get();
            
        console.log(`Firestore returned ${snap.docs.length} total records.`);
        
        const allFetched: Record<Room, WingoHistoryRecord[]> = { '30s': [], '1m': [], '3m': [], '5m': [] };
        
        for (const doc of snap.docs) {
            const data = doc.data();
            const r = data.room as Room;
            if (ROOMS.includes(r) && allFetched[r].length < 500) {
                allFetched[r].push({
                    period: data.period,
                    number: data.number,
                    color: data.color,
                    size: data.size
                });
            }
        }
        
        for (const room of ROOMS) {
            // Firestore data is newest first, so we just set it
            roomData[room].history = allFetched[room];
            if (roomData[room].history.length > 0) {
                roomData[room].lastPeriod = roomData[room].history[0].period;
            }
            console.log(`Room [${room}]: Loaded ${roomData[room].history.length} records. Latest period: ${roomData[room].lastPeriod || "None"}`);
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

  const broadcastResult = (room: Room, result: WingoHistoryRecord) => {
    io.emit('new_result', { room, result });
  };

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
      if (db) {
          const docId = `${room}_${record.period}`;
          db.collection('wingo_history').doc(docId).set({
              ...record,
              room,
              serverTimestamp: FieldValue.serverTimestamp()
          }).catch((e: any) => {
              const now = Date.now();
              if (now - lastErrorLogTime > 600000) {
                  console.error(`Firestore Persistence Error (room=${room}, period=${record.period}):`, e.message);
                  lastErrorLogTime = now;
              }
          });
      }
      broadcastResult(room, record);
  };

  const fetchRoomData = async (room: Room) => {
    try {
      const res = await fetch(urlMap[room], { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
      const d = await res.json();
      const list = d?.data?.list || [];
      if (list.length > 0) {
        console.log(`API Fetch Success [${room}]: Received ${list.length} records. Latest Issue: ${list[0].issueNumber}`);
        // Iterate in reverse to save older records first if they are new to us
        const newRecords: WingoHistoryRecord[] = [];
        for (let i = list.length - 1; i >= 0; i--) {
          const item = list[i];
          const num = parseInt(item.number);
          const period = item.issueNumber;
          
          // Check if this period is already in our history
          const exists = roomData[room].history.some(h => h.period === period);
          if (!exists) {
              const record: WingoHistoryRecord = {
                period: period,
                number: num,
                color: getColor(num),
                size: num >= 5 ? 'Big' : 'Small'
              };
              newRecords.push(record);
          }
        }

        // Process records
        for (const record of newRecords) {
           saveResult(room, record);
        }
      }
    } catch (e: any) {
      console.error(`Failed to fetch ${room}: ${e.message}`);
    }
  };

  // Internal Loop for generating fallbacks and timers
  setInterval(() => {
    Object.keys(timers).forEach(r => {
      const room = r as Room;
      
      timers[room] -= 1;
      
      // Every sec broadcast timer (we could just let client sync, but exact timer is nice)
      io.emit('timer_sync', { room, time: timers[room] });

      if (timers[room] <= 0) {
        // Time to produce a result!
        // Try fetching first, we give it 2 seconds max
        const prevPeriod = roomData[room].lastPeriod;
        setTimeout(async () => {
             // Let see if fetch worked (it polls constantly anyway)
             if (roomData[room].lastPeriod === prevPeriod) {
                 console.log(`Fallback triggered for ${room}`);
                 const fallbackResult = generateFallbackResult(room);
                 await saveResult(room, fallbackResult);
             }
        }, 1500); // give it a chance to be updated by the network poller

        // Reset timer
        if (room === '30s') timers[room] = 30;
        if (room === '1m') timers[room] = 60;
        if (room === '3m') timers[room] = 180;
        if (room === '5m') timers[room] = 300;
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
  ROOMS.forEach(r => fetchRoomData(r));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
