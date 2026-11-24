// Minimal UUIDv6 generator (RFC 9562).
// Produces a 36-char hyphenated UUID string without external deps.

/** 100-ns intervals between 1582-10-15 (UUID epoch) and 1970-01-01. */
const UUID_EPOCH_OFFSET = 0x01b21dd213814000n;
/** 60-bit timestamp mask — prevents the millisecond conversion overflowing. */
const TIMESTAMP_MASK = 0xfffffffffffffffn;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function uuidv6(): string {
  const timestamp =
    (BigInt(Date.now()) * 10_000n + UUID_EPOCH_OFFSET) & TIMESTAMP_MASK;
  const rand = crypto.getRandomValues(new Uint8Array(8));

  // time_high (32 bits) + time_mid (16 bits) + version 6 + time_low (12 bits)
  const timeHigh = Number((timestamp >> 28n) & 0xffffffffn);
  const timeMid = Number((timestamp >> 12n) & 0xffffn);
  const timeLow = Number(timestamp & 0xfffn);

  const bytes = new Uint8Array(16);
  bytes[0] = (timeHigh >>> 24) & 0xff;
  bytes[1] = (timeHigh >>> 16) & 0xff;
  bytes[2] = (timeHigh >>> 8) & 0xff;
  bytes[3] = timeHigh & 0xff;
  bytes[4] = (timeMid >>> 8) & 0xff;
  bytes[5] = timeMid & 0xff;
  bytes[6] = 0x60 | ((timeLow >>> 8) & 0x0f);
  bytes[7] = timeLow & 0xff;

  // variant (2 bits) + clock_seq (14 bits)
  bytes[8] = 0x80 | (rand[0] & 0x3f);
  bytes[9] = rand[1];
  // node (48 bits)
  bytes.set(rand.subarray(2, 8), 10);

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
