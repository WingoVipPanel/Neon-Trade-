import fs from 'fs';

let content = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf-8');

// 1. Add imports
content = content.replace(
  "import { io } from 'socket.io-client';",
  "import { io } from 'socket.io-client';\nimport { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc, runTransaction, getDocs } from 'firebase/firestore';\nimport { db } from '../lib/firebase';"
);

// 2. Add useEffect to fetch transactions (deposits & withdrawals)
content = content.replace(
  "  // -------------------------------------------------------------\n  // Wingo State\n  // -------------------------------------------------------------",
  `  useEffect(() => {
    if (!db) return;
    
    // Listen to Deposit Requests
    const qDep = query(collection(db, 'depositRequests'), orderBy('createdAt', 'desc'));
    const unsubDep = onSnapshot(qDep, (snap) => {
       const deps = snap.docs.map(doc => {
           const data = doc.data();
           return {
               id: doc.id,
               type: 'Deposit',
               userId: data.uid || data.userId || 'Unknown',
               amount: data.amount || data.totalAmount || 0,
               timestamp: data.createdAt?.toDate?.()?.getTime?.() || Date.now(),
               status: data.status === 'pending' ? 'Pending' : data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status,
               utr: data.utr,
               method: data.method
           };
       });
       setTransactions(prev => {
          const others = prev.filter(p => p.type !== 'Deposit');
          const combined = [...others, ...deps].sort((a,b)=> b.timestamp - a.timestamp);
          return combined;
       });
    });

    // Listen to Withdraw Requests
    const qWith = query(collection(db, 'withdrawRequests'), orderBy('createdAt', 'desc'));
    const unsubWith = onSnapshot(qWith, (snap) => {
       const withs = snap.docs.map(doc => {
           const data = doc.data();
           return {
               id: doc.id,
               type: 'Withdraw',
               userId: data.uid || data.userId || 'Unknown',
               amount: data.amount || 0,
               timestamp: data.createdAt?.toDate?.()?.getTime?.() || Date.now(),
               status: data.status === 'pending' ? 'Pending' : data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status,
               methodDetails: data.methodDetails,
               methodType: data.methodType
           };
       });
       setTransactions(prev => {
          const others = prev.filter(p => p.type !== 'Withdraw');
          const combined = [...others, ...withs].sort((a,b)=> b.timestamp - a.timestamp);
          return combined;
       });
    });
    
    const getUsers = async () => {
        try {
            const uSnap = await getDocs(collection(db, 'users'));
            const uArr = uSnap.docs.map(d => ({id: d.id, ...d.data()}));
            setUsers(uArr);
        } catch(e) {}
    };
    getUsers();

    return () => {
        unsubDep();
        unsubWith();
    };
  }, []);

  // -------------------------------------------------------------
  // Wingo State
  // -------------------------------------------------------------`
);

// 3. Update the handleTxAction function
content = content.replace(
  /const handleTxAction = \(id: string, newStatus: string\) => \{[\s\S]*?\n  \};\n/m,
  `const handleTxAction = async (id: string, newStatus: string) => {
    if (!db) return;
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    try {
        const collectionName = tx.type === 'Deposit' ? 'depositRequests' : 'withdrawRequests';
        const docRef = doc(db, collectionName, id);
        
        await updateDoc(docRef, { status: newStatus.toLowerCase() });
        notifyToast(newStatus);
        
        if (newStatus === 'Approved') {
            await runTransaction(db, async (t) => {
                const userRef = doc(db, 'users', tx.userId);
                const userDoc = await t.get(userRef);
                if (userDoc.exists()) {
                    const currentBal = userDoc.data().balance || 0;
                    if (tx.type === 'Deposit') {
                         t.update(userRef, { balance: currentBal + tx.amount });
                    } else if (tx.type === 'Withdraw') {
                         // Some might want it deducted beforehand, if not:
                         t.update(userRef, { balance: Math.max(0, currentBal - tx.amount) });
                    }
                }
            });
        }
    } catch(e: any) {
        notifyToast("Failed: " + e.message);
    }
  };\n`
);

fs.writeFileSync('src/components/MobileAdminPanelView.tsx', content);
