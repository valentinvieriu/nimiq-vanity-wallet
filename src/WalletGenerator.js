  let numWorkers = navigator.hardwareConcurrency || 1;
  let workers = [];
  let WORKER_URL, WASM_URL;
  const handleMessage = event => {
    const data = event.data;
    switch (data.cmd) {
      case 'found':
        document.dispatchEvent(
          new CustomEvent(`WalletGenerator-${data.cmd}`, {
            detail: {
              cmd: data.cmd,
              wallet: data.wallet,
              mnemonicPrivateKeyLegacy: data.mnemonicPrivateKeyLegacy
            }
          })
        );
        break;
      case 'countHash':
        document.dispatchEvent(
          new CustomEvent(`WalletGenerator-${data.cmd}`, {
            detail: {
              cmd: data.cmd,
              workerId: data.workerId,
              countHash: data.countHash,
            }
          })
        );
        break;
      case 'alert':
        document.dispatchEvent(
          new CustomEvent(`WalletGenerator-${data.cmd}`, {
            detail: {
              cmd: data.cmd,
              workerId: data.workerId,
              message: data.message,
            }
          })
        );
        break;
    }
    // console.log(event);
  };
  const createWorker = ({ workerId }) => {
    let worker = new Worker(WORKER_URL);
    worker.postMessage({
      workerId,
      cmd: 'init',
      wasmUrl: WASM_URL
    });
    worker.onmessage = handleMessage;
    return worker;
  };
  const init = ({ workerUrl, wasmUrl, cpuCount }) => {
    numWorkers = cpuCount ? cpuCount : numWorkers;
    WORKER_URL = workerUrl;
    WASM_URL = wasmUrl;
    for (let workerId = 0; workerId < numWorkers; workerId++) {
      let worker = createWorker({ workerId });
      workers.push(worker);
    }
  };
  const destroyWorkers = () => {
    for (let workerId = 0; workerId < numWorkers; workerId++) {
      let worker = workers[workerId];
      worker.terminate();
      workers.push(worker);
    }
    workers=[];
    // workers.map((worker, workerId) => {
    //   worker.terminate()
    //   workers.splice(workerId,1);
    // });
  };
  const stopSearch = () => {
    workers.map(worker => worker.postMessage({cmd: 'stop'}));
  };
  const search = ({ searchPattern }) => {
    let allWork = [];
    workers.map((worker, workerId) => {
      worker.postMessage({
        workerId,
        cmd: 'search',
        searchPattern
      });
    });
  };

  const scaleSearch = cpuCount => {
    if (cpuCount === workers.length) return;

    if (cpuCount > workers.length) {
      for (let i = workers.length; i < cpuCount; i++) {
        let worker = createWorker({ workerId:i });
        workers[i] = worker;
      }
    } else {
      for (let i = cpuCount; i < workers.length; i++) {
        workers[i].terminate();
        workers.splice(i,1);
      }
    }
    numWorkers = cpuCount;
  };
  export default {
    init,
    search,
    scaleSearch,
    stopSearch,
    destroyWorkers
  };

