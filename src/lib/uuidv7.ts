// Minimal UUIDv7 generator (RFC 9562).
// Produces a 36-char hyphenated UUID string without external deps.

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function uuidv7(): string {
  const now = Date.now();
  const rand = crypto.getRandomValues(new Uint8Array(10));

  const bytes = new Uint8Array(16);

  // 48-bit big-endian Unix timestamp (ms)
  bytes[0] = (now >> 40) & 0xff;
  bytes[1] = (now >> 32) & 0xff;
  bytes[2] = (now >> 24) & 0xff;
  bytes[3] = (now >> 16) & 0xff;
  bytes[4] = (now >> 8) & 0xff;
  bytes[5] = now & 0xff;

  // version (4 bits) + rand_a (12 bits)
  bytes[6] = 0x70 | (rand[0] & 0x0f);
  bytes[7] = rand[1];

  // variant (2 bits) + rand_b (14 bits)
  bytes[8] = 0x80 | (rand[2] & 0x3f);
  bytes[9] = rand[3];

  // rand_c (48 bits)
  bytes.set(rand.subarray(4, 10), 10);

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
