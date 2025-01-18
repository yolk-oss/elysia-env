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
        // TODO: allow to pass env to take data from?
        const runtimeEnv = process.env

        const EnvVariableSchema = t.Object(variables)
        const Compiler = TypeCompiler.Compile(EnvVariableSchema)

        const preparedVariables = Value.Parse(
            ['Clone', 'Clean', 'Default', 'Decode', 'Convert'],
            EnvVariableSchema,
            runtimeEnv,
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
