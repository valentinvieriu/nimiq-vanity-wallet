// This is a "Web Worker" which utilizes WASM to generate QRCodes in the browser.
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
importScripts('WalletUtils.js');
// importScripts('MnemonicWords.js');
class NimiqWebWorker {
  constructor(wasmUrl) {
    importScripts('/dist/worker-wasm.js');

    this.instance = fetch(wasmUrl)
      .then(response => response.arrayBuffer())
      .then(wasm => Module({ wasmBinary: wasm }));
  }

  // Returns a SVG DOMString that can be dropped into the DOM.
  render() {
    return this.instance;
  }
}

let memoizedWorker;
let workerId;
let searchForPattern;
const generateAdress = WModule =>
  new Promise(async (resolve, reject) => {
    try {
      const privateKey = crypto.getRandomValues(new Uint8Array(32));
      const publicKey = WalletUtils.generatePublicKey(WModule, privateKey);
      const address = WalletUtils.generateAddress(WModule, publicKey);
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
onmessage = event => {
  const data = event.data;
  switch (data.cmd) {
    case 'stop':
      postMessage({
        cmd: 'alert',
        message :'Worker stopped'
      });
      searchForPattern = false;
      close(); // Terminates the worker.
      break;
    case 'init':
      memoizedWorker = new NimiqWebWorker(data['wasmUrl']);
      workerId = data['workerId'];
      searchForPattern = true;
      break;
    case 'search':
      memoizedWorker.render().then(async WModule => {
        searchForPattern = true;
        const pattern = new RegExp(data.searchPattern, 'g');
        let startTime = performance.now();
        let countHash = 0;
        while (searchForPattern) {
          const {
            friendlyAddress,
            mnemonicPrivateKeyLegacy
          } = await generateAdress(WModule);
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
      });
      break;
    default:
      postMessage('Dude, unknown cmd: ' + data.msg);
  }
};
