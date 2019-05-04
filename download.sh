#!/bin/sh
mkdir -p ./src/libs
# Get the latest wasm files
curl -L https://raw.githubusercontent.com/nimiq-network/core/master/dist/worker-wasm.js -o ./src/libs/worker-wasm.js
curl -L https://raw.githubusercontent.com/nimiq-network/core/master/dist/worker-wasm.wasm -o ./src/libs/worker-wasm.wasm

#Css Style https://github.com/nimiq/nimiq-style
curl -L https://cdn.jsdelivr.net/npm/@nimiq/style@v0.6.2/nimiq-style.min.css -o ./src/libs/nimiq-style.min.css
curl -L https://cdn.jsdelivr.net/npm/@nimiq/style@v0.6.2/nimiq-style.icons.svg -o ./src/libs/nimiq-style.icons.svg

#Icons https://github.com/nimiq/iqons
curl -L https://raw.githubusercontent.com/nimiq/iqons/master/dist/iqons.bundle.min.js -o ./src/libs/iqons.bundle.min.js