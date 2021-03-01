console.log('chat');
const socket = io();
socket.on('chat', (data) => alert(data))