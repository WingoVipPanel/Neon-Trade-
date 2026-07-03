import fs from 'fs';

let code = fs.readFileSync('src/components/InviteWheelView.tsx', 'utf8');

// Replace the very last `    </motion.div>\n  );` with `    </motion.div>\n  </motion.div>\n  );`
code = code.replace(/<\/motion\.div>\n\s+<\/motion\.div>\n\s*\);|<\/motion\.div>\n\s*\);/g, `    </motion.div>\n    </motion.div>\n  );`);

fs.writeFileSync('src/components/InviteWheelView.tsx', code);
console.log("Patched 2");
