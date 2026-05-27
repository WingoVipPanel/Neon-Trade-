const https = require('https');
const urls = [
  'https://ibb.co/8LznPxND',
  'https://ibb.co/wNLfRNgr',
  'https://ibb.co/k2SsfCZH'
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const match = data.match(/<meta property="og:image" content="(.*?)"/);
      if (match) {
        console.log(match[1]);
      }
    });
  });
});
