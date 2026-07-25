cat src/components/MobileAdminPanelView.tsx | awk '
/const docRef = doc\(db, collectionName, id\);/ {
  print
  print "        let finalUserId = tx.userId;"
  print "        if (/^\\d{10}$/.test(finalUserId)) {"
  print "             const phoneDocRef = doc(db, '"'"'users_by_phone'"'"', finalUserId);"
  print "             const phoneDoc = await getDoc(phoneDocRef);"
  print "             if (phoneDoc.exists()) {"
  print "                 finalUserId = phoneDoc.data().uid;"
  print "             }"
  print "        }"
  print "        const userRef = doc(db, '"'"'users'"'"', finalUserId);"
  print ""
  print "        await runTransaction(db, async (t) => {"
  print "             const userDoc = await t.get(userRef);"
  print "             if (!userDoc.exists()) {"
  print "                 throw new Error(\"User document not found\");"
  print "             }"
  print ""
  print "             t.update(docRef, { status: newStatus.toLowerCase() });"
  print ""
  print "             const currentBal = userDoc.data().balance || 0;"
  print "             if (newStatus === '"'"'Approved'"'"' && tx.type === '"'"'Deposit'"'"') {"
  print "                 t.update(userRef, { "
  print "                     balance: Number(currentBal) + Number(tx.amount),"
  print "                     totalDeposits: Number(userDoc.data().totalDeposits || 0) + Number(tx.amount)"
  print "                 });"
  print "             } else if (newStatus === '"'"'Rejected'"'"' && tx.type === '"'"'Withdraw'"'"') {"
  print "                 t.update(userRef, { "
  print "                     balance: Number(currentBal) + Number(tx.amount) "
  print "                 });"
  print "             }"
  print "        });"
  print "        notifyToast(newStatus);"
  
  skip = 1
  next
}
/catch\(e: any\) {/ {
  skip = 0
}
{ if (!skip) print }
' > tmp.tsx && mv tmp.tsx src/components/MobileAdminPanelView.tsx
