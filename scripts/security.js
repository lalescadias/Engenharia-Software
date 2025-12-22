const HASH_ALG = "SHA-256";
const KEY_LENGTH = 256;
const DEFAULT_ITERATIONS = 210000;

function toBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function deriveHash(password, salt, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations,
      hash: HASH_ALG
    },
    keyMaterial,
    KEY_LENGTH
  );

  return new Uint8Array(bits);
}

 async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveHash(password, salt, DEFAULT_ITERATIONS);

  return {
    passwordHash: toBase64(hash),
    passwordSalt: toBase64(salt),
    iterations: DEFAULT_ITERATIONS
  };
}

 async function verifyPassword(password, user) {
  const salt = fromBase64(user.passwordSalt);
  const expected = fromBase64(user.passwordHash);
  const computed = await deriveHash(password, salt, user.iterations);

  if (expected.length !== computed.length) return false;

  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected[i] ^ computed[i];
  }
  return diff === 0;
}
