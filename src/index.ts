import { Elysia, Static, t } from 'elysia'
import type { TProperties } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'

export type EnvOptions = {
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
}

export const env = <TEnv extends TProperties = NonNullable<unknown>>(
    variables: TEnv,
    options: EnvOptions = {},
) =>
    new Elysia({
        name: '@yolk-oss/elysia-env',
    }).decorate(() => {
        const { envSource = process.env } = options

        const EnvVariableSchema = t.Object(variables)
        const Compiler = TypeCompiler.Compile(EnvVariableSchema)

        const preparedVariables = Value.Parse(
            ['Clone', 'Clean', 'Default', 'Decode', 'Convert'],
            EnvVariableSchema,
            envSource,
        )

        if (!Compiler.Check(preparedVariables)) {
            console.error(
                '❌ Invalid environment variables:',
                [...Compiler.Errors(preparedVariables)].reduce((errors, e) => {
                    const path = e.path.substring(1)
                    return { ...errors, [path]: e.message }
                }, {}),
            )

            process.exit()
        }

        return {
            env: preparedVariables as Static<typeof EnvVariableSchema>,
        }
    })
