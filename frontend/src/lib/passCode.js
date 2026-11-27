/**
 * Pass reference line embedded in every visitor-pass QR code.
 *
 *   Ref: <pass_id>~<yyyy-mm-dd>~<property id>~<check>
 *
 * The real backend only needs the pass_id (it looks the pass up in the shared
 * database). The GitHub Pages demo has no shared database — each browser keeps its
 * own data — so the guard's device uses the date, property and check value to
 * accept a pass that was created on the resident's phone.
 * The check value catches mistyped or altered codes; it is not a security
 * signature. Real authenticity comes from the server lookup.
 */
const fnv = (str, seed) => {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i += 1) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h.toString(16).padStart(8, '0');
};

const body = (p) => `${p.pass_id}|${p.expected_date}|${p.property_id}|${(p.guest_name || '').trim().toLowerCase()}`;
const check = (p) => fnv(body(p), 2166136261) + fnv(body(p), 0x9e3779b9);

/** Stable UUID-shaped id from any text (used for the demo's sample passes). */
export const stableId = (text) => {
  const h = fnv(text, 1) + fnv(text, 2) + fnv(text, 3) + fnv(text, 4);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

export const refLine = (p) => `Ref: ${p.pass_id}~${p.expected_date}~${p.property_id}~${check(p)}`;

/** Parse a scanned QR text. Returns { pass_id, expected_date, property_id, guest_name, intact } or null. */
export const parsePassText = (text) => {
  const t = String(text || '');
  const ref = t.match(/Ref:\s*([0-9a-f-]{36})~(\d{4}-\d{2}-\d{2})~(\d+)~([0-9a-f]{16})/i);
  const short = t.match(/ID:\s*([A-Z0-9-]+)/i);
  const guest = t.match(/Guest:\s*(.+)/i)?.[1]?.trim() || null;
  if (!ref) return short ? { short: short[1].toLowerCase(), guest_name: guest } : null;
  const p = { pass_id: ref[1].toLowerCase(), expected_date: ref[2], property_id: Number(ref[3]), guest_name: guest };
  return { ...p, intact: check(p) === ref[4].toLowerCase() };
};
