import { Elysia, Static, t } from 'elysia'
import type { TProperties } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import { Value } from '@sinclair/typebox/value'

export const env = <TEnv extends TProperties = NonNullable<unknown>>(
    variables: TEnv,
) =>
    new Elysia({
        name: '@yolk-oss/elysia-env',
    }).decorate(() => {
        const envVariableSchema = t.Object(variables)
        // TODO: allow to pass env to take data from?
        const runtimeEnv = process.env
        const typeCompiler = TypeCompiler.Compile(envVariableSchema)

        const preparedVariables = Value.Clean(
            envVariableSchema,
            Value.Convert(
                envVariableSchema,
                Value.Default(envVariableSchema, runtimeEnv),
            ),
        )

        if (!typeCompiler.Check(preparedVariables)) {
            console.error(
                '❌ Invalid environment variables:',
                [...typeCompiler.Errors(preparedVariables)].reduce(
                    (errors, e) => {
                        const path = e.path.substring(1)
                        return { ...errors, [path]: e.message }
                    },
                    {},
                ),
            )

            // TODO: ask user if they want it to stop the process or just show error in console
            process.exit()
        }

        // TODO: add success/error callback as params?
        return {
            env: preparedVariables as Static<typeof envVariableSchema>,
        }
    })
