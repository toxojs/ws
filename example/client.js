const { WsClient } = require('./src');

const client = new WsClient({ pingTime: 1000 });
client.onConnect = () => console.log('connected');
client.onDisconnect = () => console.log('disconnected');
client.onPong = (socket, time) => console.log(`pong: ${time}ms`);
client.onMessage = (socket, message) => console.log(message);
client.start();
client.sendMessage({ event: 'addData', data: { name: 'test', value: 123 } });
