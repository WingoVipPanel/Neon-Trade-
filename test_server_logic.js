const getPeriodForTime = (time, room) => {
    const pDate = new Date(time * 1000);
    const minOfDay = pDate.getUTCHours() * 60 + pDate.getUTCMinutes();
    const seconds = pDate.getUTCSeconds();
    let seq = 1;
    let roomCode = '1';
    
    if (room === '30s') {
      seq = (minOfDay * 2) + (seconds < 30 ? 1 : 2);
      roomCode = '5';
    } else if (room === '1m') {
      seq = minOfDay + 1;
      roomCode = '1';
    } else if (room === '3m') {
      seq = Math.floor(minOfDay / 3) + 1;
      roomCode = '2';
    } else if (room === '5m') {
      seq = Math.floor(minOfDay / 5) + 1;
      roomCode = '3';
    }
    
    const yyyy = pDate.getUTCFullYear();
    const mm = String(pDate.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(pDate.getUTCDate()).padStart(2, '0');
    
    return `${yyyy}${mm}${dd}1000${roomCode}${String(seq).padStart(4, '0')}`;
};

const now = Math.floor(Date.now() / 1000);
console.log(getPeriodForTime(now, '30s'));
console.log(getPeriodForTime(now, '1m'));
