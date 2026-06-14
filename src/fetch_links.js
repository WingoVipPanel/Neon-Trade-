import https from 'https';

const urls = [
  'https://ibb.co/NgnzJc3F',
  'https://ibb.co/9LL09kz',
  'https://ibb.co/xq4mf140',
  'https://ibb.co/LDMmtKqW'
];

urls.forEach(url => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const match = data.match(/https:\/\/i\.ibb\.co\/[^"]+/);
      if (match) {
        console.log(`${url} -> ${match[0]}`);
      }
    });
  });
});
