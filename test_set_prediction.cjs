const { io } = require('socket.io-client');
const socket = io('http://127.0.0.1:3000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log('Connected, emitting set_prediction for 30s room to 7');
  socket.emit('set_prediction', { room: '30s', number: 7 });
});

socket.on('prediction_updated', (data) => {
  console.log('Prediction updated received:', data);
  if (data.room === '30s' && data.nextManualResult === 7) {
     console.log('Prediction was successfully set on server.');
  }
});

socket.on('new_result', (data) => {
  console.log('New result received:', data);
  if (data.room === '30s') {
     console.log('Did it use our prediction 7?', data.result.number === 7);
     process.exit(0);
  }
});
