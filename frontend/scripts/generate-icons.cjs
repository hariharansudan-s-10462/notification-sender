const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// CRC32
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff];
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

// Blue (#1e40af) background, white notification bell silhouette
function createIcon(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB

  const cx = size / 2, cy = size / 2;
  const bellR = size * 0.28;   // bell body radius
  const dotR  = size * 0.07;   // notification dot radius
  const dotCy = cy + size * 0.30; // dot below centre

  const stride = 1 + size * 3;
  const raw = Buffer.alloc(size * stride);

  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // PNG filter None
    for (let x = 0; x < size; x++) {
      const offset = y * stride + 1 + x * 3;
      const dx = x - cx, dy = y - cy;

      // White bell body (upper circle) or notification dot (lower circle)
      const inBell = Math.sqrt(dx * dx + dy * dy) <= bellR && y <= cy + bellR * 0.4;
      const inDot  = Math.sqrt(dx * dx + (y - dotCy) ** 2) <= dotR;

      if (inBell || inDot) {
        raw[offset] = 255; raw[offset + 1] = 255; raw[offset + 2] = 255;
      } else {
        raw[offset] = 0x1e; raw[offset + 1] = 0x40; raw[offset + 2] = 0xaf;
      }
    }
  }

  const idat = zlib.deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const out = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(out, 'pwa-192x192.png'), createIcon(192));
fs.writeFileSync(path.join(out, 'pwa-512x512.png'), createIcon(512));
console.log('Generated pwa-192x192.png and pwa-512x512.png');
