if ('Bun' in globalThis) {
    throw new Error('❌ Use Node.js to run this test!')
}

import { env } from 'elysia-env'

if (typeof env !== 'function') {
    throw new Error('❌ ESM Node.js failed')
}

console.log('✅ ESM Node.js works!')
