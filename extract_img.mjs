import https from 'https';

https.get('https://ibb.co/xSk1TLbV', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const match = data.match(/https:\/\/i\.ibb\.co\/[a-zA-Z0-9_\-]+\/[a-zA-Z0-9_\-\.]+/);
    if (match) {
      console.log("FOUND_URL:", match[0]);
    } else {
      console.log("Not found in HTML");
    }
  });
}).on('error', (err) => {
  console.log("Error:", err.message);
});
