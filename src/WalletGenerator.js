  let numWorkers = navigator.hardwareConcurrency || 1;
  let workers = [];
  let WORKER_URL, WASM_URL;
  const generateWorkerEventName = id => `workerId-${id}`;
  const handleMessage = event => {
    const data = event.data;
    switch (data.cmd) {
      case 'found':
        document.dispatchEvent(
          new CustomEvent(generateWorkerEventName(data.workerId), {
            detail: {
              cmd: data.cmd,
              wallet: data.wallet,
              mnemonicPrivateKeyLegacy: data.mnemonicPrivateKeyLegacy
            }
          })
        );
        break;
    }
    console.log(event);
  };
  const createWorker = ({ workerId }) => {
    let worker = new Worker(WORKER_URL);
    worker.postMessage({
      cmd: 'init',
      wasmUrl: WASM_URL,
      workerId
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
    workers.map(worker => worker.terminate());
  };
  const stopSearch = () => {
    workers.map(worker => worker.postMessage({cmd: 'stop'}));
  };
  const search = ({ searchPattern }) => {
    let allWork = [];
    workers.map((worker, workerId) => {
      allWork.push(
        new Promise((resolve, reject) => {
          document.addEventListener(
            generateWorkerEventName(workerId),
            event => {
              resolve({
                wallet: event.detail.wallet,
                mnemonicPrivateKeyLegacy: event.detail.mnemonicPrivateKeyLegacy
              });
              stopSearch();
            }
          );

          worker.postMessage({
            cmd: 'search',
            searchPattern
          });
        })
      );
    });
    return Promise.race(allWork);
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
    stopSearch
  };

