import https from 'https';

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
      const match = data.match(/<link rel="image_src" href="(.*?)"/);
      if (match) {
        console.log(match[1]);
      } else {
        const match2 = data.match(/<meta property="og:image" content="(.*?)"/);
        if (match2) {
          console.log(match2[1]);
        } else {
           console.log("Not found for " + url);
        }
      }
    });
  });
});
