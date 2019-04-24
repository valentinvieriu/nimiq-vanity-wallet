var  WalletGenerator = (()=> {
  let numWorkers = navigator.hardwareConcurrency || 1;
  let workers = [];
  const handleMessage = (event) => {
    const data = event.data;
    switch (data.cmd) {
      case 'found':
        document.dispatchEvent(
          new CustomEvent(`MnemonicFound`, {
            detail: {
              cmd: data.cmd,
              wallet: data.wallet,
              mnemonicPrivateKeyLegacy: data.mnemonicPrivateKeyLegacy
            }
          })
        );
        break;
    }
    console.log(event)
  }
  const createWorker = (wasmUrl, workerId) => {
    let worker = new Worker(wasmUrl);
    worker.postMessage({
      cmd: 'init',
      wasmUrl,
      workerId
    });
    worker.onmessage = handleMessage.bind(this);
    return worker;
  }
  const init = (workerUrl, wasmUrl, cpuCount) => {
    numWorkers = cpuCount ? cpuCount : numWorkers;
    for (let i = 0; i < numWorkers; i++) {
      let worker = createWorker(workerUrl,`worker-${i}`);
      workers.push(worker);
    }

  }
  return {
    init,
  }
})();