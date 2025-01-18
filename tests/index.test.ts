import { Elysia, t } from 'elysia'
import { env } from '../src'
import { describe, expect, it, spyOn, beforeEach, afterEach } from 'bun:test'

const req = (path: string) => new Request(`http://localhost${path}`)

describe('@yolk-oss/elysia-env', () => {
    let processSpy: any
    let consoleErrorSpy: any
    let consoleWarnSpy: any

    beforeEach(() => {
        processSpy = spyOn(process, 'exit').mockImplementation(
            () => undefined as never,
        )
        consoleErrorSpy = spyOn(console, 'error')
        consoleWarnSpy = spyOn(console, 'warn')
    })

    afterEach(() => {
        processSpy.mockRestore()
        consoleErrorSpy.mockRestore()
        consoleWarnSpy.mockRestore()
    })

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
            expect(consoleErrorSpy).toHaveBeenCalled()

            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    NON_EXISTANT_API_TOKEN: 'Expected string',
                },
            ])
        })

        it('should throw condition error', async () => {
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
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    API_TOKEN: 'Expected string length greater or equal to 42',
                },
            ])
        })

        it('should handle multiple validation errors', async () => {
            const app = new Elysia()
                .use(
                    env({
                        REQUIRED_VAR_1: t.String(),
                        REQUIRED_VAR_2: t.String(),
                    }),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).toHaveBeenCalledWith(1)
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    REQUIRED_VAR_1: 'Expected string',
                    REQUIRED_VAR_2: 'Expected string',
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
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
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
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                {
                    NUMBER_VAR: 'Expected number',
                },
            ])
        })

        it('should handle mixed process.env and custom envSource correctly', async () => {
            const originalEnv = process.env

            try {
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

    describe('onError', () => {
        it('should default to "exit" if onError is not specified', async () => {
            const app = new Elysia()
                .use(env({ REQUIRED_VAR: t.String() }))
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).toHaveBeenCalledWith(1)
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                { REQUIRED_VAR: 'Expected string' },
            ])
        })

        it('should exit process on validation error when onError is "exit"', async () => {
            const app = new Elysia()
                .use(env({ REQUIRED_VAR: t.String() }, { onError: 'exit' }))
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).toHaveBeenCalledWith(1)
            expect(consoleErrorSpy).toHaveBeenCalled()
            expect(consoleErrorSpy.mock.lastCall).toEqual([
                '❌ Invalid environment variables:',
                { REQUIRED_VAR: 'Expected string' },
            ])
        })

        it('should log warning on validation error when onError is "warn"', async () => {
            const app = new Elysia()
                .use(env({ REQUIRED_VAR: t.String() }, { onError: 'warn' }))
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(consoleWarnSpy).toHaveBeenCalled()
            expect(consoleWarnSpy.mock.lastCall).toEqual([
                '⚠️ Invalid environment variables:',
                { REQUIRED_VAR: 'Expected string' },
            ])
        })

        it('should not log or exit on validation error when onError is "silent"', async () => {
            const app = new Elysia()
                .use(env({ REQUIRED_VAR: t.String() }, { onError: 'silent' }))
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(processSpy).not.toHaveBeenCalled()
            expect(consoleErrorSpy).not.toHaveBeenCalled()
            expect(consoleWarnSpy).not.toHaveBeenCalled()
        })

        it('should use custom error handler function for validation errors', async () => {
            const errorHandlerObj = {
                handler: (errors: Record<string, string>) => {
                    console.log('Custom handler:', errors)
                },
            }

            const handlerSpy = spyOn(errorHandlerObj, 'handler')

            const app = new Elysia()
                .use(
                    env(
                        { REQUIRED_VAR: t.String() },
                        { onError: errorHandlerObj.handler },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(handlerSpy).toHaveBeenCalledWith({
                REQUIRED_VAR: 'Expected string',
            })
        })

        it('should handle multiple validation errors when onError is "warn"', async () => {
            const consoleSpy = spyOn(console, 'warn')

            const app = new Elysia()
                .use(
                    env(
                        {
                            REQUIRED_VAR_1: t.String(),
                            REQUIRED_VAR_2: t.String(),
                        },
                        { onError: 'warn' },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(consoleSpy).toHaveBeenCalled()
            expect(consoleSpy.mock.lastCall).toEqual([
                '⚠️ Invalid environment variables:',
                {
                    REQUIRED_VAR_1: 'Expected string',
                    REQUIRED_VAR_2: 'Expected string',
                },
            ])
        })
    })
})
