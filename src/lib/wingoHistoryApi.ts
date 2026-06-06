import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface WingoResult {
  id: string; // unique timestamp or period
  number: number;
  color: 'Red' | 'Green' | 'Violet' | 'Red+Violet' | 'Green+Violet';
  size: 'Big' | 'Small';
  timestamp: number;
}

/**
 * 1. RESULT GENERATION
 */
export function generateRandomWingoResult(): WingoResult {
  const number = Math.floor(Math.random() * 10); // 0-9
  
  let color: WingoResult['color'] = 'Red';
  if (number === 0) color = 'Red+Violet';
  else if (number === 5) color = 'Green+Violet';
  else if ([1, 3, 7, 9].includes(number)) color = 'Green';
  else if ([2, 4, 6, 8].includes(number)) color = 'Red';

  // Size: 5 se upar Big (5, 6, 7, 8, 9), niche Small (0, 1, 2, 3, 4)
  const size: WingoResult['size'] = number >= 5 ? 'Big' : 'Small';

  return {
    id: Date.now().toString(), // unique id
    number,
    color,
    size,
    timestamp: Date.now()
  };
}

/**
 * 2. STORAGE - Add to Array & Limit to 500
 */
export async function addWingoResult(uid: string, newResult: WingoResult): Promise<WingoResult[]> {
  try {
    // Current history from local storage as quick base
    let currentHistory: WingoResult[] = [];
    const localData = localStorage.getItem(`wingo_history_${uid}`);
    if (localData) {
      currentHistory = JSON.parse(localData);
    }

    // Array ke upar add (unshift)
    currentHistory.unshift(newResult);

    // Latest 500 only (501wa aate hi delete ho jayega)
    currentHistory = currentHistory.slice(0, 500);

    // 1. LocalStorage Backup
    localStorage.setItem(`wingo_history_${uid}`, JSON.stringify(currentHistory));

    // 2. Firestore Storage (User ke uid se save)
    const userDocRef = doc(db, 'user_wingo_history', uid);
    await setDoc(userDocRef, { history: currentHistory }, { merge: true });

    return currentHistory;
  } catch (error) {
    console.error("Error saving Wingo result:", error);
    return [];
  }
}

/**
 * 3. LOGIN KE BAAD - Fetch user history
 */
export async function fetchUserWingoHistory(uid: string): Promise<WingoResult[]> {
  try {
    const userDocRef = doc(db, 'user_wingo_history', uid);
    const snap = await getDoc(userDocRef);

    if (snap.exists()) {
      const data = snap.data();
      const firestoreHistory = data.history || [];
      
      // Update local storage so it's always in sync
      localStorage.setItem(`wingo_history_${uid}`, JSON.stringify(firestoreHistory));
      
      return firestoreHistory;
    } else {
      // Return from local storage if firestore doc doesn't exist yet
      const localData = localStorage.getItem(`wingo_history_${uid}`);
      return localData ? JSON.parse(localData) : [];
    }
  } catch (error) {
    console.error("Error fetching Wingo history:", error);
    // Fallback to local storage if network fails
    const localData = localStorage.getItem(`wingo_history_${uid}`);
    return localData ? JSON.parse(localData) : [];
  }
}
