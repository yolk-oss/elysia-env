# @yolk-oss/elysia-env

env plugin for [Elysia.js](https://elysiajs.com)

## Installation

```bash
bun add @yolk-oss/elysia-env
```

## Usage

```ts
import { Elysia, t } from 'elysia'
import { env } from '@yolk-oss/elysia-env'

const app = new Elysia()
    .use(
        env({
            TOKEN: t.String({
                minLength: 5,
                error: 'TOKEN is required for a service!',
            }),
        }),
    )
    .get('/', ({ env }) => env.TOKEN)
    //                           ^? (property) TOKEN: string
    .listen(8080)

console.log(`Listening on http://${app.server!.hostname}:${app.server!.port}`)
```

Checkout the [examples](./examples) and [tests](./tests) folders on github.

## License

[MIT](LICENSE)
