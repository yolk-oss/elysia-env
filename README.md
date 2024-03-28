# @yolk-oss/elysia-env

[![elysia][elysia-src]][elysia-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

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

<!-- Badges -->

[elysia-src]: https://img.shields.io/badge/%F0%9F%A6%8A-f6f8fa?style=flat-square&label=elysia&labelColor=f06292
[elysia-href]: https://elysiajs.com/
[npm-version-src]: https://img.shields.io/npm/v/@yolk-oss/elysia-env?style=flat-square&labelColor=EFEBE8&color=F4BB29
[npm-version-href]: https://npmjs.com/package/@yolk-oss/elysia-env
[npm-downloads-src]: https://img.shields.io/npm/dm/@yolk-oss/elysia-env?style=flat-square&labelColor=EFEBE8&color=F4BB29
[npm-downloads-href]: https://npmjs.com/package/@yolk-oss/elysia-env
[bundle-src]: https://img.shields.io/bundlephobia/minzip/@yolk-oss/elysia-env?style=flat-square&labelColor=EFEBE8&color=F4BB29&label=bundlephobia
[bundle-href]: https://bundlephobia.com/result?p=@yolk-oss/elysia-env
[license-src]: https://img.shields.io/github/license/yolk-oss/elysia-env.svg?style=flat-square&labelColor=EFEBE8&color=F4BB29
[license-href]: https://github.com/yolk-oss/elysia-plugin/blob/main/LICENSE
