// This is a "Web Worker" which utilizes WASM to generate QRCodes in the browser.
// https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
self.importScripts('WalletUtils.js');
// self.importScripts('MnemonicWords.js');
class NimiqWebWorker {
  constructor(wasm_uri) {
    self.importScripts('/dist/worker-wasm.js');

    this.instance = fetch(wasm_uri)
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

// This is the main handler. It is called when the worker is sent a message via the
// `the_worker.postMessage` function.
self.onmessage = event => {
  const data = event.data;
  switch (data.cmd) {
    case 'stop':
      self.postMessage('Worker stopped');
      // searchForPattern = false;
      // self.close(); // Terminates the worker.
      break;
    case 'init':
      memoizedWorker = new NimiqWebWorker(data['wasmUrl']);
      workerId = data['workerId'];
      searchForPattern = true;
      break;
    case 'search':
      memoizedWorker.render().then(async WModule => {
        while (searchForPattern) {
          var pattern = new RegExp(data.searchPattern, 'g');
          const privateKey = crypto.getRandomValues(new Uint8Array(32));
          const publicKey = WalletUtils.generatePublicKey(WModule, privateKey);
          const address = WalletUtils.generateAddress(WModule, publicKey);
          const friendlyAddress = WalletUtils.toUserFriendlyAddress(address);
          const mnemonicPrivateKeyLegacy = await WalletUtils.entropyToMnemonic(privateKey, true).then(result => result.join(' '));
          // console.log(workerId, friendlyAddress);
          if (pattern.test(friendlyAddress)) {
            searchForPattern = false;
            self.postMessage({
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
      self.postMessage('Dude, unknown cmd: ' + data.msg);
  }
};
