const { io } = require('socket.io-client');
const socket = io('http://127.0.0.1:3000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected!');
  socket.disconnect();
  process.exit(0);
});
socket.on('connect_error', (err) => {
  console.log('Connection error:', err.message);
  process.exit(1);
});
setTimeout(() => process.exit(1), 3000);
