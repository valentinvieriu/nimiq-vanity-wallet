let WebWorker = (() => {
  importScripts('WalletUtils.js');
  importScripts('/dist/worker-wasm.js');

  let WorkerModule, workerId, searchForPattern;

  const generateAdress = WorkerModule =>
    new Promise(async (resolve, reject) => {
      try {
        const privateKey = crypto.getRandomValues(new Uint8Array(32));
        const publicKey = WalletUtils.generatePublicKey(
          WorkerModule,
          privateKey
        );
        const address = WalletUtils.generateAddress(WorkerModule, publicKey);
        const friendlyAddress = WalletUtils.toUserFriendlyAddress(address);
        const mnemonicPrivateKeyLegacy = await WalletUtils.entropyToMnemonic(
          privateKey,
          true
        ).then(result => result.join(' '));
        resolve({ friendlyAddress, mnemonicPrivateKeyLegacy });
      } catch (error) {
        reject(error);
      }
    });
  // This is the main handler. It is called when the worker is sent a message via the
  // `the_worker.postMessage` function.
  onmessage = async event => {
    const data = event.data;
    switch (data.cmd) {
      case 'stop':
        postMessage({
          cmd: 'alert',
          message: 'Worker stopped'
        });
        searchForPattern = false;
        close(); // Terminates the worker.
        break;
      case 'init':
        WorkerModule = Module({ wasmBinary:data['wasmBinary'] });
        workerId = data['workerId'];
        break;
      case 'search':
        searchForPattern = true;
        const pattern = new RegExp(data.searchPattern, 'g');
        let startTime = performance.now();
        let countHash = 0;
        while (searchForPattern) {
          const {
            friendlyAddress,
            mnemonicPrivateKeyLegacy
          } = await generateAdress(WorkerModule);
          countHash = countHash + 1;
          let nowTime = performance.now();
          if (nowTime - startTime > 1000) {
            postMessage({
              cmd: 'countHash',
              workerId,
              countHash
            });
            startTime = nowTime;
            countHash = 0;
          }
          if (pattern.test(friendlyAddress)) {
            // searchForPattern = false;
            postMessage({
              cmd: 'found',
              workerId,
              wallet: friendlyAddress,
              mnemonicPrivateKeyLegacy
            });
          }
        }
        break;
      default:
        postMessage('Dude, unknown cmd: ' + data.msg);
    }
  };
  return {
    generateAdress
  };
})();
