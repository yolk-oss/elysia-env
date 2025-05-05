import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    jest,
    spyOn,
} from 'bun:test'
import { Elysia, t } from 'elysia'
import { env } from '../src'

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

    describe('onSuccess', () => {
        it('should invoke custom onSuccess handler on successful environment variable parsing', async () => {
            const onSuccessSpy = jest.fn((envVariables) => {
                console.log('onSuccess called with:', envVariables)
            })

            const app = new Elysia()
                .use(
                    env(
                        {
                            REQUIRED_VAR: t.String(),
                        },
                        {
                            envSource: { REQUIRED_VAR: 'some-value' },
                            onSuccess: onSuccessSpy,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(onSuccessSpy).toHaveBeenCalledWith({
                REQUIRED_VAR: 'some-value',
            })
        })

        it('should handle multiple successful variables and invoke onSuccess', async () => {
            const onSuccessSpy = jest.fn((envVariables) => {
                console.log('onSuccess called with:', envVariables)
            })

            const envSource = {
                VAR_1: 'value1',
                VAR_2: 'value2',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            VAR_1: t.String(),
                            VAR_2: t.String(),
                        },
                        {
                            envSource,
                            onSuccess: onSuccessSpy,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(onSuccessSpy).toHaveBeenCalledWith(envSource)
        })

        it('should not invoke onSuccess if variables are invalid', async () => {
            const onSuccessSpy = jest.fn((envVariables) => {
                console.log('onSuccess called with:', envVariables)
            })

            const app = new Elysia()
                .use(
                    env(
                        {
                            REQUIRED_VAR: t.String(),
                        },
                        {
                            onSuccess: onSuccessSpy,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            expect(onSuccessSpy).not.toHaveBeenCalled()
        })
    })

    describe('prefix', () => {
        it('should filter environment variables by prefix', async () => {
            // Mock environment with prefixed variables
            const mockEnv = {
                APP_API_KEY: 'test-key',
                APP_DEBUG: 'true',
                OTHER_VAR: 'should-be-ignored',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            API_KEY: t.String(),
                            DEBUG: t.Boolean(),
                        },
                        {
                            envSource: mockEnv,
                            prefix: 'APP_',
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            expect(response).toEqual({
                API_KEY: 'test-key',
                DEBUG: true,
            })

            console.log({ response })
            // Verify that non-prefixed variables are excluded
            expect(response.OTHER_VAR).toBeUndefined()
        })

        it('should handle empty result when no variables match prefix', async () => {
            const mockEnv = {
                PROD_API_KEY: 'test-key',
                PROD_DEBUG: 'true',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            API_KEY: t.String({ default: 'default-key' }),
                            DEBUG: t.Boolean({ default: false }),
                        },
                        {
                            envSource: mockEnv,
                            prefix: 'APP_',
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            // Should use default values since no variables match the prefix
            expect(response).toEqual({
                API_KEY: 'default-key',
                DEBUG: false,
            })
        })

        it('should work with process.env when no envSource is provided', async () => {
            // Save original process.env
            const originalEnv = process.env

            try {
                // Mock process.env
                process.env = {
                    ...process.env,
                    TEST_API_KEY: 'process-key',
                    TEST_DEBUG: 'true',
                    SOME_OTHER_VAR: 'value',
                } as any

                const app = new Elysia()
                    .use(
                        env(
                            {
                                API_KEY: t.String(),
                                DEBUG: t.Boolean(),
                            },
                            { prefix: 'TEST_' },
                        ),
                    )
                    .get('/', ({ env }) => env)

                const response = await app
                    .handle(req('/'))
                    .then((res) => res.json())

                // Should use process.env and filter by prefix
                expect(response).toEqual({
                    API_KEY: 'process-key',
                    DEBUG: true,
                })
                expect(response.SOME_OTHER_VAR).toBeUndefined()
            } finally {
                // Restore original process.env
                process.env = originalEnv
            }
        })

        it('should handle case-sensitive prefixes correctly', async () => {
            const mockEnv = {
                app_api_key: 'lowercase-key',
                APP_API_KEY: 'uppercase-key',
                App_Debug: 'mixed-case',
            }

            const app = new Elysia()
                .use(
                    env(
                        {
                            API_KEY: t.String(),
                            Debug: t.String(),
                            api_key: t.String(),
                        },
                        {
                            envSource: mockEnv,
                            prefix: 'APP_',
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const response = await app
                .handle(req('/'))
                .then((res) => res.json())

            // Should only match the exact case
            expect(response.API_KEY).toBe('uppercase-key')
            expect(response.api_key).toBeUndefined()

            // Test with mixed case prefix
            const appMixed = new Elysia()
                .use(
                    env(
                        {
                            Debug: t.String(),
                        },
                        {
                            envSource: mockEnv,
                            prefix: 'App_',
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            const responseMixed = await appMixed
                .handle(req('/'))
                .then((res) => res.json())

            // Should match the mixed case
            expect(responseMixed.Debug).toBe('mixed-case')
        })

        it('should combine prefix with other options like onError', async () => {
            const mockEnv = {
                // No matching prefixed variables
            }

            const errorHandlerSpy = jest.fn()

            const app = new Elysia()
                .use(
                    env(
                        {
                            REQUIRED_VAR: t.String(),
                        },
                        {
                            envSource: mockEnv,
                            prefix: 'APP_',
                            onError: errorHandlerSpy,
                        },
                    ),
                )
                .get('/', ({ env }) => env)

            await app.handle(req('/'))

            // Should call error handler with the unprefixed variable name
            expect(errorHandlerSpy).toHaveBeenCalledWith({
                REQUIRED_VAR: expect.any(String),
            })
        })
    })
})
