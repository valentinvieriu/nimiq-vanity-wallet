class NimiqRenderer {
  // Create a new renderer that loads the WASM from the path provided.
  constructor(worker_uri, wasm_uri, cpu_count) {
    this.numWorkers = cpu_count || navigator.hardwareConcurrency || 1;

    this.workers = [];
    for (let i = 0; i < this.numWorkers; i++) {
      let worker = new Worker(worker_uri);
      worker.postMessage({
        cmd: 'init',
        wasmUrl: wasm_uri,
        workerId: i
      });
      worker.onmessage = this.handleMessage.bind(this);
      this.workers.push(worker);
    }
  }

  render(searchPattern) {
    let result = [];
    for (let i = 0; i < this.numWorkers; i++) {
      let worker = this.workers[i];
      result.push(new Promise((resolve, reject) => {
        document.addEventListener(`workerId-${i})`, event => {
          resolve({
            wallet: event.detail.wallet,
            mnemonicPrivateKeyLegacy: event.detail.mnemonicPrivateKeyLegacy,
          });
          this.stopRender();
        });
  
        worker.postMessage({
          cmd: 'search',
          searchPattern
        });
      }))
    }
    return Promise.race(result); 
  }

  stopRender() {
    for (let i = 0; i < this.numWorkers; i++) {
      this.workers[i].terminate();
      // this.workers[i].postMessage({
      //   cmd: 'stop',
      // });
    }
  }
  scaleRender(max) {
    if (max === this.workers.length) return;

    if(max > this.workers.length) {

    } else {
      for (let i = max; i < this.workers.length; i++) {
        this.workers[i].terminate();
      }
    }
    this.numWorkers = max;
  }
  // Handle an event coming from the WebWorker.
  handleMessage(event) {
    const data = event.data;
    switch (data.cmd) {
      case 'found':
        document.dispatchEvent(
          new CustomEvent(`workerId-${data.workerId})`, {
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
}
