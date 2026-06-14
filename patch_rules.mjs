import fs from 'fs';

let content = fs.readFileSync('firestore.rules', 'utf-8');

content = content.replace(
  /match \/depositRequests\/\{requestId\} \{[\s\S]*?allow update: if isAdmin\(\);\n    \}/m,
  `match \/depositRequests\/{requestId} {
      allow list: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn();
      allow get: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow update, delete: if isAdmin();
    }`
);

content = content.replace(
  /match \/withdrawRequests\/\{requestId\} \{[\s\S]*?allow update: if isAdmin\(\);\n    \}/m,
  `match \/withdrawRequests\/{requestId} {
      allow list: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow get: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if isSignedIn();
      allow update, delete: if isAdmin();
    }`
);

fs.writeFileSync('firestore.rules', content);
