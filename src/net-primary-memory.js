const { PrimaryMemory } = require('@toxo/memory');
const { isPortInUse } = require('./is-port-in-use');
const { WsServer } = require('./ws-server');
const { WsClient } = require('./ws-client');

class NetPrimaryMemory extends PrimaryMemory {
  constructor(settings = {}) {
    super(settings);
    this.url = settings.url;
    this.port = settings.port || 5050;
    this.mode = settings.mode || 'normal';
    this.started = false;
    this.isPrimary = false;
    this.onIsPrimary = () => {};
    this.onServerConnect = () => {};
    this.onServerDisconnect = () => {};
    this.onServerPing = () => {};
    this.onServerMessage = () => {};
    this.onClientConnect = () => {};
    this.onClientDisconnect = () => {};
    this.onClientMessage = () => {};
    this.onClientPong = () => {};
    if (settings.netMethods) {
      this.netMethods = settings.netMethods;
    } else if (this.mode === 'normal') {
      this.netMethods = {
        set: true,
        remove: true,
        clear: true,
        setChild: true,
        removeChild: true,
        clearChilds: true,
        addData: true,
        removeData: true,
        clearData: true,
        putIntoData: true,
        removeFromData: true,
      };
    } else {
      this.netMethods = {
        '*': true,
      };
    }
  }

  doOnServerConnect(socket) {
    if (!this.isPrimary) {
      this.isPrimary = true;
      this.ownSocketId = socket.id;
      this.onIsPrimary();
    }
    this.onServerConnect(socket);
  }

  doOnServerDisconnect(socket) {
    this.onServerDisconnect(socket);
  }

  doOnServerMessage(socket, message) {
    this.onServerMessage(socket, message);
    this.server.broadcast(message);
  }

  doOnServerPing(socket) {
    this.onServerPing(socket);
  }

  doOnClientConnect(socket) {
    if (this.server) {
      if (!this.server.sockets[socket.id]) {
        this.server.stop();
        this.server = undefined;
      }
    }
    this.onClientConnect(socket);
  }

  doOnClientDisconnect(socket) {
    this.onClientDisconnect(socket);
  }

  doOnClientMessage(socket, message) {
    this.onClientMessage(socket, message);
    if (socket.id !== this.ownSocketId) {
      super.executeMethod(message);
    }
  }

  doOnClientPong(socket, time) {
    this.onClientPong(socket, time);
  }

  async start() {
    if (!this.started) {
      this.started = true;
      this.client = new WsClient({ url: this.url });
      this.client.start();
      this.client.onConnect = this.doOnClientConnect.bind(this);
      this.client.onDisconnect = this.doOnClientDisconnect.bind(this);
      this.client.onMessage = this.doOnClientMessage.bind(this);
      this.client.onPong = this.doOnClientPong.bind(this);
      const portUsed = await isPortInUse(this.port);
      if (!portUsed) {
        this.server = new WsServer({ port: this.port });
        this.server.onConnect = this.doOnServerConnect.bind(this);
        this.server.onDisconnect = this.doOnServerDisconnect.bind(this);
        this.server.onPing = this.doOnServerPing.bind(this);
        this.server.onMessage = this.doOnServerMessage.bind(this);
        this.server.start();
      }
    }
  }

  stop() {
    if (this.started) {
      this.started = false;
      if (this.server) {
        this.server.stop();
        this.server = undefined;
      }
    }
  }

  executeMethod(message) {
    if (this.netMethods['*'] || this.netMethods[message.data.method]) {
      this.client.sendMessage(message);
    }
    return super.executeMethod(message);
  }
}

module.exports = {
  NetPrimaryMemory,
};
