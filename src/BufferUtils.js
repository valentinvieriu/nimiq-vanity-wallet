let BufferUtils = {};

BufferUtils.BASE32_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVXY";

//https://stackoverflow.com/a/53307879
BufferUtils.toHex = buffer => {
  return [...new Uint8Array(buffer)]
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
};
BufferUtils.fromHex = hex => {
  hex = hex.trim();
  return Uint8Array.from(hex.match(/.{2}/g) || [], byte => parseInt(byte, 16));
};

BufferUtils.toBinary = buffer => {
  let bin = "";
  buffer = new Uint8Array(buffer);
  for (let i = 0; i < buffer.length; i++) {
    const code = buffer[i];
    bin += code.toString(2).padStart(8, "0");
  }
  return bin;
};

BufferUtils.toBase64encoded = buffer => {
  const decoder = new TextDecoder("utf8");
  const b64encoded = btoa(decoder.decode(buffer));
  return b64encoded;
};

BufferUtils.toBase32 = (buf, alphabet = BufferUtils.BASE32_ALPHABET) => {
  let shift = 3,
    carry = 0,
    byte,
    symbol,
    i,
    res = "";

  for (i = 0; i < buf.length; i++) {
    byte = buf[i];
    symbol = carry | (byte >> shift);
    res += alphabet[symbol & 0x1f];

    if (shift > 5) {
      shift -= 5;
      symbol = byte >> shift;
      res += alphabet[symbol & 0x1f];
    }

    shift = 5 - shift;
    carry = byte << shift;
    shift = 8 - shift;
  }

  if (shift !== 3) {
    res += alphabet[carry & 0x1f];
  }

  while (res.length % 8 !== 0 && alphabet.length === 33) {
    res += alphabet[32];
  }

  return res;
};
