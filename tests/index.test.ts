import { Elysia, t } from 'elysia'
import { env } from '../src'

import { describe, expect, it, spyOn } from 'bun:test'

const req = (path: string) => new Request(`http://localhost${path}`)

describe('@yolk-oss/elysia-env', () => {
    describe('core', () => {
        it('should return correct env variable', async () => {
            const app = new Elysia()
                .use(
                    env({
                        API_TOKEN: t.String(),
                    }),
                )
                .get('/', ({ env }) => env.API_TOKEN)

            const response = await app
                .handle(req('/'))
                .then((res) => res.text())
            expect(response).toBe('hello!elysia')
        })

        it('should return multiple correct env variables', async () => {
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
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

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

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

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
                .get('/', ({ env }) => env)

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

    describe('env source', () => {
        it('should use custom envSource instead of process.env', async () => {
            const customEnv = {
                CUSTOM_API_TOKEN: 'custom-token',
                CUSTOM_NUMBER: '123',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            CUSTOM_API_TOKEN: t.String(),
                            CUSTOM_NUMBER: t.Number(),
                        },
                        {
                            envSource: customEnv,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            expect(response).toEqual({
                CUSTOM_API_TOKEN: 'custom-token',
                CUSTOM_NUMBER: 123,
            })
        })

        it('should handle missing variables in custom envSource', async () => {
            const processSpy = spyOn(process, 'exit').mockImplementation(
                () => undefined as never,
            )
            const consoleSpy = spyOn(console, 'error')

            const emptyEnvSource = {}

            const app = new Elysia()
                .use(
                    env(
                        {
                            REQUIRED_VAR: t.String(),
                        },
                        {
                            envSource: emptyEnvSource,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalled()
            expect(consoleSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    REQUIRED_VAR: 'Expected string',
                },
            ])
        })

        it('should use default values with custom envSource', async () => {
            const customEnv = {
                DEFINED_VAR: 'defined-value',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            DEFINED_VAR: t.String(),
                            UNDEFINED_VAR: t.String({
                                default: 'default-value',
                            }),
                        },
                        {
                            envSource: customEnv,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            expect(response).toEqual({
                DEFINED_VAR: 'defined-value',
                UNDEFINED_VAR: 'default-value',
            })
        })

        it('should validate type constraints with custom envSource', async () => {
            const processSpy = spyOn(process, 'exit').mockImplementation(
                () => undefined as never,
            )
            const consoleSpy = spyOn(console, 'error')

            const invalidEnvSource = {
                NUMBER_VAR: 'not-a-number',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            NUMBER_VAR: t.Number(),
                        },
                        {
                            envSource: invalidEnvSource,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).toHaveBeenCalled()
            expect(consoleSpy).toHaveBeenCalled()
            expect(consoleSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    NUMBER_VAR: 'Expected number',
                },
            ])
        })

        it('should handle mixed process.env and custom envSource correctly', async () => {
            const originalEnv = process.env

            try {
                // Set up process.env with a test value
                process.env = {
                    ...process.env,
                    PROCESS_VAR: 'process-value',
                }

                const customEnv = {
                    CUSTOM_VAR: 'custom-value',
                }

                const app = new Elysia()
                    .use(
                        env(
                            {
                                CUSTOM_VAR: t.String(),
                                PROCESS_VAR: t.String(),
                            },
                            {
                                envSource: customEnv,
                            },
                        ),
                    )
                    .get('/', ({ env }) => env)

                const response = await app
                    .handle(req('/'))
                    .then((res) => res.json())

                expect(response).toEqual({
                    CUSTOM_VAR: 'custom-value',
                    PROCESS_VAR: undefined,
                })
            } finally {
                process.env = originalEnv
            }
        })

        it('should handle async envSource that resolves environment variables', async () => {
            const mockVaultService = async () => ({
                DB_PASSWORD: 'secret-db-password',
                API_KEY: 'vault-api-key',
                SERVICE_URL: 'https://api.service.com',
            })

            const app = new Elysia()
                .use(
                    env(
                        {
                            DB_PASSWORD: t.String(),
                            API_KEY: t.String(),
                            SERVICE_URL: t.String(),
                        },
                        {
                            envSource: await mockVaultService(),
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            expect(response).toEqual({
                DB_PASSWORD: 'secret-db-password',
                API_KEY: 'vault-api-key',
                SERVICE_URL: 'https://api.service.com',
            })
        })

        it('should handle async envSource that fails to fetch', async () => {
            spyOn(process, 'exit').mockImplementation(() => undefined as never)
            spyOn(console, 'error')

            const mockFailedVaultService = async () => {
                throw new Error('Failed to connect to vault')
            }

            try {
                const app = new Elysia()
                    .use(
                        env(
                            {
                                SECRET_KEY: t.String(),
                            },
                            {
                                envSource: await mockFailedVaultService(),
                            },
                        ),
                    )
                    .get('/', ({ env }) => env)

                await app.handle(req('/'))
            } catch (error) {
                expect((error as Error).message).toBe(
                    'Failed to connect to vault',
                )
            }
        })
    })
})
