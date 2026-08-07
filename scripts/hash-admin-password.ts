/**
 * Generates a scrypt hash for ADMIN_PASSWORD_HASH.
 *
 * Usage:  npm run admin:hash -- "your-long-random-password"
 *
 * The plaintext password is never written to a file by this script. Paste the
 * resulting hash into your hosting platform's environment variables.
 */
import crypto from 'node:crypto';

const SCRYPT_KEYLEN = 64;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

const password = process.argv[2];

if (!password) {
  console.error('Usage: npm run admin:hash -- "your-long-random-password"');
  process.exit(1);
}

if (password.length < 12) {
  console.error('Choose a password of at least 12 characters. Longer is better.');
  process.exit(1);
}

console.info('\nAdd these to your environment (never to the repository):\n');
console.info(`ADMIN_PASSWORD_HASH="${hashPassword(password)}"`);
console.info(`ADMIN_SESSION_SECRET="${crypto.randomBytes(48).toString('hex')}"`);
console.info(`BOOKING_CONFIRMATION_SECRET="${crypto.randomBytes(48).toString('hex')}"`);
console.info('\nAlso set ADMIN_EMAIL to the address you will sign in with.\n');
