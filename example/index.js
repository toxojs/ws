const cluster = require('cluster');
// eslint-disable-next-line import/no-extraneous-dependencies
const { ioc, factory } = require('@toxo/ioc');
const { MongodbProvider, DatabaseManager } = require('@toxo/database');
const { getNetSharedMemory } = require('../src');
const config = require('./config.json');

const logger = ioc.get('logger');
const logEventFn = (eventName) => logger.log(`****${eventName}`);

async function bootstrap() {
  const sharedMemory = await getNetSharedMemory({
    url: 'ws://localhost:5050',
    port: 5050,
  });
  ioc.register('sharedMemory', sharedMemory);
}

async function configureDatabase() {
  factory.register(MongodbProvider);
  const dbManager = await DatabaseManager.createFrom(config.databases);
  ioc.register('databaseManager', dbManager);
  const collection = dbManager.getMainCollection('tenants');
  collection.addHook('beforeAll', logEventFn, -1);
  await dbManager.start();
}

async function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

async function orchestrate() {
  await bootstrap();
  logger.log(`Starting Primary process with PID ${process.pid}`);
  for (let i = 0; i < 4; i += 1) {
    cluster.fork();
    // eslint-disable-next-line no-await-in-loop
    await wait(1);
  }
}

async function serve() {
  await bootstrap();
  logger.log(`Worker with PID ${process.pid} started.`);
  await configureDatabase();
  const dbManager = ioc.get('databaseManager');
  const collection = dbManager.getMainCollection('tenants');
  let item = await collection.findById('61925b2574ad1ebeff6c179c');
  logger.log(item.tenantId);
  item = await collection.findById('61925b2574ad1ebeff6c179c');
  logger.log(item.tenantId);
  item = await collection.findOne({
    tenantId: '49ba9f38-9749-4885-a86c-170afff9a5b7',
  });
  logger.log(item.tenantId);
  item = await collection.findOne({
    tenantId: '73832b67-1b07-41b3-8ee1-36694b0af628',
  });
  logger.log(item.tenantId);
  setTimeout(async () => {
    item = await collection.findById('620f1e2b0e0bb375638bcc26');
    console.log(item.tenantId);
  }, 10000);
}

(async () => {
  if (cluster.isPrimary) {
    await orchestrate();
  } else {
    await serve();
  }
})();
