let WalletUtils = (() => {
  importScripts('/utils/Buffer.js');
  importScripts('/utils/MnemonicWords.js');
  function ibanCheck(str) {
    const num = str
      .split('')
      .map(c => {
        const code = c.toUpperCase().charCodeAt(0);
        return code >= 48 && code <= 57 ? c : (code - 55).toString();
      })
      .join('');
    let tmp = '';

    for (let i = 0; i < Math.ceil(num.length / 6); i++) {
      tmp = (parseInt(tmp + num.substr(i * 6, 6)) % 97).toString();
    }

    return parseInt(tmp);
  }

  async function crcChecksum(entropy) {
    function CRC8(buf) {
      // Adapted from https://github.com/mode80/crc8js
      // Create a lookup table byte array
      const table = []; // 256 max len byte array
  
      for (let i = 0; i < 256; ++i) {
        let curr = i;
        for (let j = 0; j < 8; ++j) {
          if ((curr & 0x80) !== 0) {
            curr = ((curr << 1) ^ 0x97) % 256; // Polynomial C2 by Baicheva98
          } else {
            curr = (curr << 1) % 256;
          }
        }
        table[i] = curr;
      }
      let c = 0;
      for (let i = 0; i < buf.length; i++) {
        c = table[(c ^ buf[i]) % 256];
      }
      return c;
    }
    const ENT = entropy.length * 8;
    const CS = ENT / 32;
    const hash = CRC8(entropy);
    return BufferUtils.toBinary([hash]).slice(0, CS);
  }

  async function sha256Checksum(entropy) {
    const ENT = entropy.length * 8;
    const CS = ENT / 32;
    const hash = await crypto.subtle.digest('SHA-256', entropy);
    return BufferUtils.toBinary(hash).slice(0, CS);
  }

  function bitsToMnemonic(bits) {
    const chunks = bits.match(/(.{11})/g);
    const result = chunks.map(chunk => {
      const index = parseInt(chunk, 2);
      return MnemonicWords[index];
    });

    return result;
  }
  const CCODE = 'NQ';
  const ADDRESS_SERIALIZED_SIZE = 20;
  const PUBLIC_KEY_SIZE = 32;
  const PRIVATE_KEY_SIZE = 32;
  const BLAKE2B_SIZE = 32;

  const generateEntropy = () =>
    crypto.getRandomValues(new Uint8Array(PRIVATE_KEY_SIZE));

  const generatePublicKey = (WasmModule, privateKey) => {
    // const { publicKey } = nacl.sign.keyPair.fromSeed(privateKey);
    let stackPtr;
    try {
      stackPtr = WasmModule.stackSave();
      const wasmOut = WasmModule.stackAlloc(PUBLIC_KEY_SIZE);
      const pubKeyBuffer = new Uint8Array(
        WasmModule.HEAP8.buffer,
        wasmOut,
        PRIVATE_KEY_SIZE
      );
      pubKeyBuffer.set(privateKey);
      const wasmIn = WasmModule.stackAlloc(privateKey.length);
      const privKeyBuffer = new Uint8Array(
        WasmModule.HEAP8.buffer,
        wasmIn,
        PRIVATE_KEY_SIZE
      );
      privKeyBuffer.set(privateKey);

      WasmModule._ed25519_public_key_derive(wasmOut, wasmIn);
      privKeyBuffer.fill(0);
      const publicKey = new Uint8Array(PUBLIC_KEY_SIZE);
      publicKey.set(pubKeyBuffer);
      return publicKey;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      if (stackPtr !== undefined) WasmModule.stackRestore(stackPtr);
    }
  };
  const generateAddress = (WasmModule, publicKey) => {
    // const hash = blakejs.blake2b(publicKey, null, 32);
    let stackPtr;
    try {
      stackPtr = WasmModule.stackSave();
      const hashSize = BLAKE2B_SIZE;
      const wasmOut = WasmModule.stackAlloc(hashSize);
      const wasmIn = WasmModule.stackAlloc(publicKey.length);
      new Uint8Array(WasmModule.HEAPU8.buffer, wasmIn, publicKey.length).set(
        publicKey
      );
      const res = WasmModule._nimiq_blake2(wasmOut, wasmIn, publicKey.length);
      if (res !== 0) {
        throw res;
      }
      const hash = new Uint8Array(hashSize);
      hash.set(new Uint8Array(WasmModule.HEAPU8.buffer, wasmOut, hashSize));
      const address = hash.subarray(0, ADDRESS_SERIALIZED_SIZE);
      return address;
    } catch (e) {
      console.error(e);
      throw e;
    } finally {
      if (stackPtr !== undefined) WasmModule.stackRestore(stackPtr);
    }
  };

  const mnemonicSeed = entropy => {
    let result = [];
    entropy.forEach(el => result.push(MnemonicWords[el]));
    return result.join(' ');
  };
  const entropyToMnemonic = async (entropy, legacy = false) => {
    const entropyBits = BufferUtils.toBinary(entropy);
    const checksumBits = legacy
      ? await crcChecksum(entropy)
      : await sha256Checksum(entropy);
    const bits = entropyBits + checksumBits;
    // return bits;
    return bitsToMnemonic(bits);
  };
  const toUserFriendlyAddress = (address, withSpaces = true) => {
    const base32 = BufferUtils.toBase32(address);
    // eslint-disable-next-line prefer-template
    const check = ('00' + (98 - ibanCheck(base32 + CCODE + '00'))).slice(-2);
    let res = CCODE + check + base32;
    if (withSpaces) res = res.replace(/.{4}/g, '$& ').trim();
    return res;
  };
  return {
    generateEntropy,
    generatePublicKey,
    generateAddress,
    mnemonicSeed,
    entropyToMnemonic,
    toUserFriendlyAddress
  };
})();
