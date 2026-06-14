import fs from 'fs';
['src/components/AdminPanelView.tsx', 'src/components/MobileAdminPanelView.tsx'].forEach(file => {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/reconnectionAttempts: 10/g, "reconnectionAttempts: Infinity");
    fs.writeFileSync(file, content);
});
