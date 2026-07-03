import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target1 = `{isLoggedIn && isAdmin && !showAdminView && (
        <button 
          onClick={() => setShowAdminView(true)}
          className="fixed bottom-24 right-4 z-[9999] bg-[#ff3b30] text-white font-bold p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 h-11 hover:bg-[#ff453a] active:scale-95 transition-all text-xs font-black tracking-wider uppercase border border-white/20 cursor-pointer shadow-[0_4px_20px_rgba(255,59,48,0.4)]"
          title="Return to Admin Panel"
        >
          <Settings className="w-4 h-4 animate-spin-slow" />
          <span>Admin Panel</span>
        </button>
      )}`;

const target2 = `                    {/* Item 9: Settings */}
                    <div 
                      onClick={() => setShowSettingsOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99 last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#a2a2a2]/10 p-2 rounded-xl text-[#a2a1a1] border border-[#a2a2a2]/5">
                          <Settings className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.settings}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                      </div>
                    </div>`;

const replacement2 = `                    {/* Item 9: Settings */}
                    <div 
                      onClick={() => setShowSettingsOverlay(true)}
                      className="flex items-center justify-between py-3.5 px-3.5 hover:bg-white/5 transition cursor-pointer active:scale-99 last:rounded-b-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#a2a2a2]/10 p-2 rounded-xl text-[#a2a1a1] border border-[#a2a2a2]/5">
                          <Settings className="h-4.5 w-4.5" />
                        </div>
                        <span className="text-[14px] font-semibold text-white/90">
                          {t.settings}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-neutral-500 text-sm font-black font-mono">➔</span>
                      </div>
                    </div>
                    {/* Item 10: Admin Panel (Only for admins) */}
                    {isAdmin && (
                      <div 
                        onClick={() => setShowAdminView(true)}
                        className="flex items-center justify-between py-3.5 px-3.5 hover:bg-[#ff3b30]/10 transition cursor-pointer active:scale-99 border-t border-[#ff3b30]/20 rounded-b-2xl"
                        style={{ background: 'linear-gradient(90deg, rgba(255,59,48,0.1) 0%, transparent 100%)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-[#ff3b30]/20 p-2 rounded-xl text-[#ff3b30] border border-[#ff3b30]/20">
                            <Settings className="h-4.5 w-4.5 animate-spin-slow" />
                          </div>
                          <span className="text-[14px] font-semibold text-[#ff3b30]">
                            {selectedLang === 'en' ? 'Admin Panel' : 'एडमिन पैनल'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[#ff3b30] text-sm font-black font-mono">➔</span>
                        </div>
                      </div>
                    )}`;

if (code.includes(target1) && code.includes(target2)) {
  code = code.replace(target1, "");
  code = code.replace(target2, replacement2);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Patched successfully!");
} else {
  console.log("Failed to find targets!");
  if (!code.includes(target1)) console.log("- target1 not found");
  if (!code.includes(target2)) console.log("- target2 not found");
}
