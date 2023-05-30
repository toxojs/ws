const { NetPrimaryMemory, isPortInUse } = require('./src');

async function getPort(initial) {
  let port = initial;
  let portUsed = await isPortInUse(port);
  while (portUsed) {
    port += 1;
    // eslint-disable-next-line no-await-in-loop
    portUsed = await isPortInUse(port);
  }
  return port;
}

(async () => {
  const port = await getPort(5050);
  console.log(`port: ${port}`);
  const memory = new NetPrimaryMemory({ url: 'ws://localhost:5050', port });
  memory.onIsPrimary = () => console.log('is primary');
  await memory.start();
})();
