#!/bin/sh

# Get the latest wasm files
curl -L https://raw.githubusercontent.com/nimiq-network/core/master/dist/worker-wasm.js -o ./dist/worker-wasm.js
curl -L https://raw.githubusercontent.com/nimiq-network/core/master/dist/worker-wasm.wasm -o ./dist/worker-wasm.wasm

#Css Style https://github.com/nimiq/nimiq-style
curl -L https://cdn.jsdelivr.net/npm/@nimiq/style@v0.6.2/nimiq-style.min.css -o ./dist/nimiq-style.min.css
curl -L https://cdn.jsdelivr.net/npm/@nimiq/style@v0.6.2/nimiq-style.icons.svg -o ./dist/nimiq-style.icons.svg

#Icons https://github.com/nimiq/iqons
curl -L https://raw.githubusercontent.com/nimiq/iqons/master/dist/iqons.bundle.min.js -o ./dist/iqons.bundle.min.js