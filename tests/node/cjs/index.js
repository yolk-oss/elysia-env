if ('Bun' in globalThis) {
    throw new Error('❌ Use Node.js to run this test!')
}

const { env } = require('elysia-env')

if (typeof env !== 'function') {
    throw new Error('❌ CommonJS Node.js failed')
}

console.log('✅ CommonJS Node.js works!')
