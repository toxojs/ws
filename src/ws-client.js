const { io } = require('socket.io-client');
const { deserialize } = require('@toxo/serialize');

class WsClient {
  constructor(settings = {}) {
    this.url = settings.url || process.env.WS_URL || 'ws://localhost:5050';
    this.socket = undefined;
    this.pingTime = settings.pingTime || undefined;
    this.onConnect = () => {};
    this.onDisconnect = () => {};
    this.onMessage = () => {};
    this.onPong = () => {};
  }

  start() {
    if (!this.socket) {
      this.socket = io(this.url, {});
      this.socket.on('connect', () => {
        this.onConnect(this.socket);
      });
      this.socket.on('disconnect', () => {
        this.onDisconnect(this.socket);
      });
      this.socket.on('message', (message) => {
        const deserialized = deserialize(message);
        console.log('deserialization de la buena');
        this.onMessage(this.socket, deserialized);
      });
      if (this.pingTime) {
        this.pingInterval = setInterval(() => {
          const start = Date.now();
          this.socket.emit('ping', () => {
            this.onPong(this.socket, Date.now() - start);
          });
        }, this.pingTime);
      }
    }
  }

  stop() {
    if (this.socket) {
      clearInterval(this.pingInterval);
      this.socket.close();
      this.socket = undefined;
    }
  }

  get isStarted() {
    return !!this.socket;
  }

  sendMessage(message) {
    this.socket.emit('message', message);
  }
}

module.exports = {
  WsClient,
};
