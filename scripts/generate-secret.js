#!/usr/bin/env node

const crypto = require('crypto');

function generateSecret(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

console.log('\n=== Kahade Secret Generator ===\n');
console.log('JWT_SECRET:', generateSecret(32));
console.log('JWT_REFRESH_SECRET:', generateSecret(32));
console.log('SESSION_SECRET:', generateSecret(32));
console.log('\nCopy these values to your .env file\n');
