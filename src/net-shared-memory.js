const cluster = require('cluster');
const { WorkerMemory } = require('@toxo/memory');
const { NetPrimaryMemory } = require('./net-primary-memory');

async function getNetSharedMemory(settings = {}) {
  if (cluster.isPrimary) {
    const result = new NetPrimaryMemory(settings);
    await result.start();
    return result;
  }
  return new WorkerMemory();
}

module.exports = {
  getNetSharedMemory,
};
