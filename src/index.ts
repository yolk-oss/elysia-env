import type { TProperties } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'
import { Elysia, Static, t } from 'elysia'

export type EnvOptions<T extends TProperties> = {
    /**
     * Custom environment variables source to use instead of process.env.
     * This allows fetching environment variables from alternative sources like
     * secret managers, configuration services, or custom storage.
     *
     * @example
     * // Using process.env (default)
     * env(schema)
     *
     * @example
     * // Using custom environment object
     * env(schema, {
     *   envSource: { API_KEY: 'custom-key', DB_URL: 'custom-url' }
     * })
     *
     * @example
     * // Using async values from a secret manager
     * const secrets = await vault.getSecrets()
     * env(schema, { envSource: secrets })
     *
     * @example
     * // Combining multiple sources
     * env(schema, {
     *   envSource: {
     *     ...process.env,
     *     ...await getSecrets(),
     *     ...overrides
     *   }
     * })
     *
     * @default process.env
     */
    envSource?: NodeJS.ProcessEnv

    /**
     * Only load environment variables with this prefix.
     * The prefix will be removed from the variable names.
     *
     * @example
     * // With process.env = { APP_API_KEY: 'abc', APP_DEBUG: 'true', OTHER_VAR: '123' }
     * env(schema, { prefix: 'APP_' })
     * // Will only load { API_KEY: 'abc', DEBUG: 'true' }
     */
    prefix?: string

    /**
     * Defines how to handle validation errors for environment variables.
     *
     * - 'exit': Exits process with error code 1 (default)
     * - 'warn': Logs warning and continues
     * - 'silent': Continues without logging
     * - function: Custom error handler
     *
     * @default 'exit'
     */
    onError?:
        | 'exit'
        | 'warn'
        | 'silent'
        | ((errors: Record<string, string>) => void)

    /**
     * Callback executed when environment variables are successfully validated.
     *
     * @param env
     */
    onSuccess?: (env: Static<ReturnType<typeof t.Object<T>>>) => void
}

export const env = <TEnv extends TProperties = NonNullable<unknown>>(
    variables: TEnv,
    options: EnvOptions<TEnv> = {},
) =>
    new Elysia({
        name: '@yolk-oss/elysia-env',
    }).decorate(() => {
        const {
            envSource = process.env,
            onError = 'exit',
            onSuccess,
            prefix,
        } = options

        let processedEnvSource = envSource

        if (prefix) {
            processedEnvSource = Object.entries(envSource).reduce(
                (acc, [key, value]) => {
                    if (key.startsWith(prefix)) {
                        // Remove prefix and add to processed env
                        const newKey = key.substring(prefix.length)
                        acc[newKey] = value
                    }
                    return acc
                },
                {} as NodeJS.ProcessEnv,
            )
        }

        const EnvVariableSchema = t.Object(variables)
        const Compiler = TypeCompiler.Compile(EnvVariableSchema)

        const preparedVariables = Value.Parse(
            ['Clone', 'Clean', 'Default', 'Decode', 'Convert'],
            EnvVariableSchema,
            processedEnvSource,
        )

        if (!Compiler.Check(preparedVariables)) {
            const errors = [...Compiler.Errors(preparedVariables)].reduce(
                (errors, e) => {
                    const path = e.path.substring(1)
                    return { ...errors, [path]: e.message }
                },
                {},
            )

            if (typeof onError === 'function') {
                onError(errors)
            } else {
                switch (onError) {
                    case 'silent':
                        break

                    case 'warn':
                        console.warn(
                            '⚠️ Invalid environment variables:',
                            errors,
                        )

                        break

                    case 'exit':
                        console.error(
                            '❌ Invalid environment variables:',
                            errors,
                        )

                        process.exit(1)
                }
            }
        } else {
            onSuccess?.(preparedVariables)
        }

        return {
            env: preparedVariables as Static<typeof EnvVariableSchema>,
        }
    })
