const { io } = require('socket.io-client');
const socket = io('http://127.0.0.1:3000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('set_prediction', { room: '30s', number: 8 });
});

socket.on('prediction_updated', (data) => {
  console.log('prediction updated', data);
});

socket.on('new_result', (data) => {
  if (data.room === '30s') {
    console.log('Got new result for 30s:', data.result);
    process.exit(0);
  }
});
