if ('Bun' in globalThis) {
	throw new Error('❌ Use Node.js to run this test!')
}

import { myPlugin } from 'elysia-env'

if (typeof myPlugin !== 'function') {
	throw new Error('❌ ESM Node.js failed')
}

console.log('✅ ESM Node.js works!')
