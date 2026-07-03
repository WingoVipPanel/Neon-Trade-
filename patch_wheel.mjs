import fs from 'fs';

let code = fs.readFileSync('src/components/InviteWheelView.tsx', 'utf8');

// Import InvitePosterView
code = code.replace(
  `import { motion, AnimatePresence } from "framer-motion";`,
  `import { motion, AnimatePresence } from "framer-motion";\nimport InvitePosterView from "./InvitePosterView";`
);

// Add showInvitePosters state
code = code.replace(
  `const [showPopup, setShowPopup] = useState(false);`,
  `const [showPopup, setShowPopup] = useState(false);\n  const [showInvitePosters, setShowInvitePosters] = useState(false);`
);

// Modify handleInvite
code = code.replace(
  `const handleInvite = () => {
    // Just copy link, don't give fake spins
    navigator.clipboard.writeText(\`https://neon-trade.vercel.app?ref=\${uid}\`);
    setLobbyToast({
      type: "success",
      text:
        selectedLang === "en"
          ? "Referral link copied!"
          : "रेफरल लिंक कॉपी किया गया!",
    });
  };`,
  `const handleInvite = () => {
    setShowInvitePosters(true);
  };`
);

// Add the view at the top of the return
code = code.replace(
  `return (
    <motion.div`,
  `return (
    <motion.div className="w-full flex flex-col relative h-full">
      <AnimatePresence>
        {showInvitePosters && (
          <InvitePosterView 
            key="invite-poster-view"
            uid={uid} 
            selectedLang={selectedLang} 
            onBack={() => setShowInvitePosters(false)} 
          />
        )}
      </AnimatePresence>
    <motion.div`
);
code = code.replace(/<motion\.div\n      initial=\{\{ opacity: 0 \}\}/, `<motion.div className="w-full flex flex-col font-sans relative bg-[#120102] text-white flex-1 overflow-y-auto"\n      initial={{ opacity: 0 }}`);
code = code.replace(/className="w-full flex flex-col font-sans relative bg-\[#120102\] text-white"/g, '');

fs.writeFileSync('src/components/InviteWheelView.tsx', code);
console.log("Patched");
