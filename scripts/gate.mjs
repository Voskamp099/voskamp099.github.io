// The access gate.
//
// The sample catalogue and the clips inside it are not published in the
// clear. The build encrypts them with a key derived from one short access
// code; the browser derives the same key when someone types that code, then
// decrypts the page and the media in place. Without the code the site ships
// ciphertext: there is nothing to read and nothing to play.
//
// What this is: a sharing gate. It keeps the research material out of reach
// of a casual visitor, and out of a repository anyone can clone.
//
// What this is not: a vault. The code is short on purpose, so it can be read
// aloud and typed from memory. Key derivation is deliberately slow (PBKDF2,
// 210k rounds) so that guessing the code offline costs real time. That raises
// the price of a brute force; it does not remove it. Anyone who has the code
// can pass the material on to anyone else.
//
// To change the code, set SAMPLE_ACCESS_CODE in the build environment or edit
// ACCESS_CODE below. Changing it re-encrypts everything, so material shared
// under the old code stops opening.
import crypto from 'node:crypto';

// The salt is not a secret: it is public on purpose, and the work it does is
// to make each derived key unique and to slow guessing down.
export const SALT = Buffer.from('cac7d6d1faf78681fe9a03a8aa4550a330ece3aa0313968bafe19f3c46983feb', 'hex');
export const ITERATIONS = 210000;
export const ACCESS_CODE = (process.env.SAMPLE_ACCESS_CODE || '482615').trim();

// A tiny known-plaintext block. The browser decrypts it with the key derived
// from the code someone typed; if it comes out right, the code was right. It
// costs the same amount of work to guess the code as to guess the key, so the
// check is no weaker than the encryption itself.
export const CANARY_TEXT = 'raelynn-gate-v1';

export function deriveKey(code) {
  return crypto.pbkdf2Sync(Buffer.from(String(code), 'utf8'), SALT, ITERATIONS, 32, 'sha256');
}

// The initialisation vector is derived from the item's own id rather than
// drawn at random. Two encryptions of the same item therefore produce the
// same bytes, so a rebuild does not rewrite every blob in the repository and
// the history stays readable. Each item still gets its own vector, so no two
// items ever share one.
export function ivFor(id) {
  return crypto.createHash('sha256').update('iv:' + id).digest().subarray(0, 12);
}

// The stored form is iv | ciphertext | tag, which is the order the browser's
// WebCrypto expects when it decrypts an AES-GCM buffer.
export function encrypt(key, plain, iv) {
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([iv, body, cipher.getAuthTag()]);
}

export function idFor(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 32);
}
