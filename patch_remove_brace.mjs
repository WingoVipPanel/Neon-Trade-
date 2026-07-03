import fs from 'fs';

let code = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                        );
                      });
                    }
                  })()}`;

const replacement = `                        );
                      });
                  })()}`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log("Fixed brace successfully!");
} else {
  console.log("Could not find brace to fix.");
}
