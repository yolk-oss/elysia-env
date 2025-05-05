# @yolk-oss/elysia-env

[![elysia][elysia-src]][elysia-href]
[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![License][license-src]][license-href]

A plugin for [Elysia.js](https://elysiajs.com) to validate environment variables and inject them into your application.

## Table of Contents

-   [Installation](#installation)
-   [Basic Usage](#basic-usage)
-   [Features](#features)
    -   [Custom Environment Sources](#custom-environment-sources)
    -   [Prefix](#prefix)
    -   [Error Handling](#error-handling)
    -   [Success Callback](#success-callback)
-   [License](#license)

## Installation

To install `@yolk-oss/elysia-env` with Bun, run the following command:

```bash
bun add @yolk-oss/elysia-env
```

## Basic Usage

The `@yolk-oss/elysia-env` plugin provides a way to validate and inject environment variables into your Elysia.js application.
You define a schema for the environment variables using TypeBox, and the plugin will validate them, inject them, and handle errors based on your preferences.

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

## Features

### Custom Environment Sources

You can specify a custom source for the environment variables.
By default, the plugin uses process.env, but you can use alternative sources like secret managers, custom storage, etc.

```ts
env(schema, {
    envSource: {
        API_KEY: 'custom-api-key',
        DB_URL: 'custom-db-url',
    },
})
```

### Prefix

You can specify a prefix for the environment variables.
This will load only variables that start with the specified prefix.

```ts
env(schema, {
    prefix: 'MY_APP_', // Variables must start with MY_APP_
})
```

> [!WARNING]
> Variables with default values will be available even if they don't start with the prefix.

### Error Handling

You can control how the plugin handles validation errors through the `onError` option:

-   'exit': Exits the process with an error code 1 (default).
-   'warn': Logs a warning message but continues running the app.
-   'silent': Continues without logging anything.
-   Function: You can pass a custom error handler function.

```ts
env(schema, {
    onError: 'warn', // Logs a warning and continues
})
```

### Success Callback

You can define a callback function that is executed when the environment variables pass validation successfully.

```ts
env(schema, {
    onSuccess: (env) => {
        console.log('Successfully loaded environment variables:', env)
    },
})
```

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
