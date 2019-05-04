#!/bin/sh
mkdir -p ./dist
# Get the latest wasm files
./download.sh
# copy files
cp -r src/* dist/ 