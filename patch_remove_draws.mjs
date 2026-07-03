import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStart = `                {/* Sub Tabs: winning results vs my bets */}`;
const targetEnd = `                    } else {
                      // Personal Placed Bets tab`;

const newCode = `                {/* Records List */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3.5 scrollbar-hide">
                  <div className="rounded-xl bg-[#5c1c1e] p-4 text-center border border-white/5">
                    <h4 className="text-[#ffbc0d] font-black text-[14px] uppercase tracking-wide mb-1">
                      {selectedLang === 'en' ? 'My Custom Placed Bets' : 'मेरे द्वारा लगाए गए दांव'}
                    </h4>
                    <p className="text-white/50 text-[11px]">
                      {selectedLang === 'en' ? 'Real-time records matching live rooms' : 'लाइव कमरों से मेल खाने वाले वास्तविक समय रिकॉर्ड'}
                    </p>
                  </div>

                  {/* Pull and render records */}
                  {(() => {
                      // Personal Placed Bets tab`;

const startIndex = code.indexOf(targetStart);
const endIndex = code.indexOf(targetEnd) + targetEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newCode + code.substring(endIndex);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the block to replace", { startIndex, endIndex });
}
