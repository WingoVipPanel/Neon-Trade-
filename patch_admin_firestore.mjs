import fs from 'fs';

let code = fs.readFileSync('src/components/MobileAdminPanelView.tsx', 'utf8');

const target = `  const handleConfirmNextResult = () => {
    if (socketRef.current) socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: selectedNextResult });
    notifyToast(selectedNextResult !== null ? \`Number \${selectedNextResult} confirmed for next draw!\` : \`Unset prediction.\`);
  };`;

const replacement = `  const handleConfirmNextResult = async () => {
    if (socketRef.current) {
        socketRef.current.emit('set_prediction', { room: activeAdminRoom, number: selectedNextResult });
    }
    
    // Fallback for static environments (Firebase Hosting / Vercel)
    if (db) {
        try {
            await setDoc(doc(db, 'globalResults', activeAdminRoom + '_prediction'), {
                nextManualResult: selectedNextResult,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('Failed to save manual prediction to Firestore', e);
        }
    }

    notifyToast(selectedNextResult !== null ? \`Number \${selectedNextResult} confirmed for next draw!\` : \`Unset prediction.\`);
  };`;

if (code.includes(target)) {
    if (!code.includes('setDoc')) {
        code = code.replace("from 'firebase/firestore';", ", setDoc } from 'firebase/firestore';");
    }
    code = code.replace(target, replacement);
    fs.writeFileSync('src/components/MobileAdminPanelView.tsx', code);
    console.log("Patched MobileAdminPanelView.tsx successfully!");
} else {
    console.log("Could not find target in MobileAdminPanelView.tsx");
}
