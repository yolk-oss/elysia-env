import { Elysia } from 'elysia'
import { myPlugin } from '../src'

import { describe, expect, it } from 'bun:test'

const req = (path: string) => new Request(`http://localhost${path}`)

describe('elysia-env', () => {
	it('getProjectName should return elysia-env', async () => {
		const app = new Elysia()
			.use(myPlugin())
			.get('/', ({ getProjectName }) => getProjectName())

		const res = await app.handle(req('/'))
		expect(await res.text()).toBe('elysia-env')
	})
})
