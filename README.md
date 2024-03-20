# elysia-env

elysia-env plugin for [Elysia.js](https://elysiajs.com)

## Installation

```bash
bun add elysia-env
```

## Usage

```ts
import { Elysia } from 'elysia';
import { myPlugin } from 'elysia-env';

const app = new Elysia()
  .use(myPlugin())
  .get('/', (ctx) => {
    return ctx.getProjectName();
  })
  .listen(8080);

console.log(`Listening on http://${app.server!.hostname}:${app.server!.port}`);
```

Checkout the [examples](./examples) and [tests](./tests) folders on github.

## API

### Plugin Options

| Option | Description |
| ------ | ----------- |
| `...`  | ...         |

### `ctx.getProjectName()`

Returns the project name

```js
const projectName = ctx.getProjectName();
```

## License

[...](LICENSE)

