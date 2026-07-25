cat src/components/MobileAdminPanelView.tsx | awk '
/const handleDeleteTx = async \(id: string, type: string\) => \{/ {
  in_delete = 1
  print
  next
}
in_delete && /    if \(\!db\) return;/ { print; next }
in_delete && /    try \{/ { print; next }
in_delete && /        const collectionName = type === '"'"'Deposit'"'"' \? '"'"'depositRequests'"'"' : '"'"'withdrawRequests'"'"';/ { print; next }
in_delete && /        const docRef = doc\(db, collectionName, id\);/ {
  print
  print "        await deleteDoc(docRef);"
  print "        notifyToast(\"Deleted\");"
  skip = 1
  next
}
in_delete && skip && /    \} catch\(e: any\) \{/ {
  skip = 0
  print
  next
}
in_delete && !skip && /  \};/ {
  in_delete = 0
  print
  next
}
{ if (!skip) print }
' > tmp2.tsx && mv tmp2.tsx src/components/MobileAdminPanelView.tsx
