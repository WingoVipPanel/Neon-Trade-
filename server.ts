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
    
    // Pattern that often works best: use the app's firestore method
    if (dbId && dbId !== '(default)') {
      console.log(`Using specific database: ${dbId}`);
      db = getFirestore(dbId);
    } else {
      console.log("Using default database");
      db = getFirestore();
    }
    
    // Verification test (swallowed internal error if it fails to not block boot)
    try {
      await db.collection('_server_health').doc('boot').set({
        timestamp: FieldValue.serverTimestamp(),
        status: 'ok',
        databaseId: dbId || '(default)'
      });
      console.log("Firestore Health Check: SUCCESS");
    } catch (e: any) {
      console.error("Firestore Health Check [Non-Blocking] ERROR:", e.message);
      if (e.message.includes('PERMISSION_DENIED')) {
        console.error("CRITICAL: The service account does not have permission to access the Firestore database. Please ensure the project and database ID are correct.");
      }
      console.log("Disabling server-side Firestore persistence to avoid further errors.");
      db = null;
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
  '30s': 'https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json',
  '1m': 'https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json',
  '3m': 'https://draw.ar-lottery01.com/WinGo/WinGo_3M/GetHistoryIssuePage.json',
  '5m': 'https://draw.ar-lottery01.com/WinGo/WinGo_5M/GetHistoryIssuePage.json',
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
        for (const room of ROOMS) {
            roomData[room].history = [];
            console.log(`Fetching drawing history documents for room ${room} sorted by serverTimestamp descending...`);
            const snap = await db.collection('wingo_history')
                .where('room', '==', room)
                .orderBy('serverTimestamp', 'desc')
                .limit(500)
                .get();
                
            for (const doc of snap.docs) {
                const data = doc.data();
                roomData[room].history.push({
                    period: data.period,
                    number: data.number,
                    color: data.color,
                    size: data.size
                });
            }
            
            if (roomData[room].history.length > 0) {
                roomData[room].lastPeriod = roomData[room].history[0].period;
            }
            console.log(`Room [${room}]: Loaded ${roomData[room].history.length} records. Latest period: ${roomData[room].lastPeriod || "None"}`);
        }
    } catch (e) {
        console.error("Failed to load history from Firestore per room:", e);
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
      roomData[room].lastPeriod = record.period;
      roomData[room].history.unshift(record);
      
      // Persist to Firestore
      if (db) {
          try {
              const docRef = await db.collection('wingo_history').add({
                  ...record,
                  room,
                  serverTimestamp: FieldValue.serverTimestamp()
              });
              console.log(`Saved result to Firestore: room=${room}, period=${record.period}, docId=${docRef.id}`);
          } catch (e: any) {
              const now = Date.now();
              // Only log the full error every 10 minutes per server instance to avoid spamming "bar bar errors"
              if (now - lastErrorLogTime > 600000) {
                  console.error(`Firestore Persistence Error (room=${room}, period=${record.period}):`, e.message);
                  lastErrorLogTime = now;
              }
          }
      }
      broadcastResult(room, record);
  };

  const fetchRoomData = async (room: Room) => {
    try {
      const res = await fetch(urlMap[room], { signal: AbortSignal.timeout(3000) });
      const d = await res.json();
      const list = d?.data?.list || [];
      if (list.length > 0) {
        const item = list[0];
        const num = parseInt(item.number);
        const record: WingoHistoryRecord = {
          period: item.issueNumber,
          number: num,
          color: getColor(num),
          size: num >= 5 ? 'Big' : 'Small'
        };
        
        if (record.period !== roomData[room].lastPeriod) {
          await saveResult(room, record);
        }
      }
    } catch (e) {
      console.error(`Failed to fetch ${room}, doing nothing.. or should we fallback now?`);
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
