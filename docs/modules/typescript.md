# TypeScript

This binding introduces support for routes written in TypeScript.

## Install

`npm install @primate/binding @swc/core@1.3`

## Configure

Import and initialize the module in your configuration.

```js caption=primate.config.js
import { typescript } from "@primate/binding";

export default {
  modules: [
    typescript(),
  ],
};
```

## Use

Using TypeScript is identical to using JavaScript, with the exception that to
get proper editor completions for your route function parameters and return
code, your route needs to use `satisfies Route` with the Primate `Route` export.

```ts caption=routes/plain-text.ts
import { Route } from "primate";

export default {
  get() {
    return "Donald";
  },
} satisfies Route;
```

!!!
Using `satisfies Route` is optional and will only result in your editor showing
your proper completions.
!!!

Refer to the [routes] and [responses] documentation for the different aspects
of handling requests and returning responses.

## Configuration options

### extension

Default `".ts"`

The file extension associated with TypeScript routes.

[routes]: /guide/routes
[responses]: /guide/responses