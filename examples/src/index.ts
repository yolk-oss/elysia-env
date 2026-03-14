import { Elysia, env, t } from 'elysia'

new Elysia()
    .use(
        env({
            TOKEN: t.String({
                minLength: 5,
                error: 'TOKEN is required for service A!',
            }),
            IS_ENABLED: t.Boolean({ default: false }),
            PORT: t.Number({
                default: 3000,
            }),
        }),
    )
    .get('/', ({ env }) => env)
    .listen(4242, ({ hostname, port }) => {
        console.log(`🦊 📂 - Listening on http://${hostname}:${port}`)
    })
