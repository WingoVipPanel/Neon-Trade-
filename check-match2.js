import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";

const config = JSON.parse(fs.readFileSync("firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  const users = {};
  const userSnap = await getDocs(collection(db, "users"));
  userSnap.forEach(doc => {
    users[doc.id] = doc.data();
  });
  console.log("Users count:", Object.keys(users).length);

  const depSnap = await getDocs(collection(db, "depositRequests"));
  let matchCount = 0;
  let noMatchCount = 0;
  depSnap.forEach(doc => {
    const data = doc.data();
    const userId = data.userId || data.uid;
    if (userId) {
      if (users[userId]) {
         matchCount++;
      } else {
         noMatchCount++;
      }
    }
  });
  console.log(`Matches: ${matchCount}, No Matches: ${noMatchCount}`);
  process.exit(0);
}
run();
