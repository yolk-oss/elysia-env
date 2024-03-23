import { Elysia, t } from 'elysia'
import { env } from '../src'

import { describe, expect, it, spyOn } from 'bun:test'

const req = (path: string) => new Request(`http://localhost${path}`)

describe('@yolk/elysia-env', () => {
    it('should return correct env variable', async () => {
        const app = new Elysia()
            .use(
                env({
                    API_TOKEN: t.String(),
                }),
            )
            .get('/', ({ env }) => env.API_TOKEN)

        const response = await app.handle(req('/')).then((res) => res.text())
        expect(response).toBe('hello!elysia')
    })

    it('should return correct env variables', async () => {
        const app = new Elysia()
            .use(
                env({
                    API_TOKEN: t.String(),
                    BOOLEAN_ENV: t.Boolean(),
                    ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING:
                        t.Number({
                            default: 42,
                        }),
                }),
            )
            .get('/', ({ env }) => env.API_TOKEN)

        const response = await app.handle(req('/')).then((res) => res.json())

        expect(response).toEqual({
            API_TOKEN: 'hello!elysia',
            BOOLEAN_ENV: true,
            ANSWER_TO_THE_ULTIMATE_QUESTION_OF_LIFE_THE_UNIVERSE_AND_EVERYTHING: 42,
        })
    })

    it('should return correct default and boolean variable', async () => {
        const app = new Elysia()
            .use(
                env({
                    BOOLEAN_ENV: t.Boolean(),
                    ALSO_BOOLEAN_BUT_NOT_DEFINED_IN_ENV: t.Boolean({
                        default: false,
                    }),
                }),
            )
            .get('/', ({ env }) => env)

        const response = await app.handle(req('/')).then((res) => res.json())

        expect(response).toEqual({
            BOOLEAN_ENV: true,
            ALSO_BOOLEAN_BUT_NOT_DEFINED_IN_ENV: false,
        })
    })

    it('should throw error when variable is missing', async () => {
        const processSpy = spyOn(process, 'exit').mockImplementation(
            () => undefined as never,
        )
        const consoleSpy = spyOn(console, 'error')

        const app = new Elysia()
            .use(
                env({
                    NON_EXISTANT_API_TOKEN: t.String({
                        error: "oh no, it's missing",
                    }),
                }),
            )
            .get('/', ({ env }) => env.NON_EXISTANT_API_TOKEN)

        await app.handle(req('/'))

        expect(processSpy).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalled()

        expect(consoleSpy.mock.lastCall).toEqual([
            '❌ Invalid environment variables:',
            {
                NON_EXISTANT_API_TOKEN: 'Expected string',
            },
        ])
    })

    it('should throw condition error', async () => {
        const processSpy = spyOn(process, 'exit').mockImplementation(
            () => undefined as never,
        )
        const consoleSpy = spyOn(console, 'error')

        const app = new Elysia()
            .use(
                env({
                    API_TOKEN: t.String({
                        minLength: 42,
                    }),
                }),
            )
            .get('/', ({ env }) => env.API_TOKEN)

        await app.handle(req('/'))

        expect(processSpy).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalled()
        expect(consoleSpy.mock.lastCall).toEqual([
            '❌ Invalid environment variables:',
            {
                API_TOKEN: 'Expected string length greater or equal to 42',
            },
        ])
    })
})
