# Types

On the web, values are inherently strings. Whether it's a URL's path, its
query string parameters, or the submitted fields of a form, everything boils
down to strings. When working on the backend with Primate, it is often imporant
to establish and assert a runtime type concept, including a way to coerce
strings into a given type and validate that the coerced value lies within an
expected range or satisfies other conditions.

!!!
Primate types aren't programming types in the true sense. They translate to one
of JavaScript's underlying types, and unlike static types, they provide a form
of runtime safety. You can think of them as coercive value predicates; a
`boolean` runtime type would consider both boolean `true` and string `"true"`
as true, which is what you would expect on the web.
!!!

## Defining

Types are defined in the `types` directory, unless specified
[elsewise](/guide/configuration#paths-types) in the configuration. Type
filenames are alphanumeric and lowercase-first -- any files not starting with a 
lowercase letter will be ignored by Primate.

Type files must export a function as their default export, and Primate will
refuse to start if it detects a type that's not a function.

Here is an example for a `number` type, a type that makes sure a string is
convertible to a number.

```js caption=types/number.js
import {is} from "runtime-compat/dyndef";

const numeric = n => !Number.isNaN(Number.parseFloat(n)) && Number.isFinite(n);

export default value => {
  is(value).string();
  try {
    return numeric(value) && Number(value);
  } catch() {
    throw new Error(`${value} is not a number`);
  }
}
```

If a string can be successfully converted to a number, a `number` type will
returned. Otherwise the type function will throw.

!!!
There is nothing stopping you from accepting other base types like `number` or
`bigint` as input, but your main input type will usually be strings.
!!!

You can also create more elaborate types, like `uuid`.

```js caption=types/uuid.js
import {is} from "runtime-compat/dyndef";
import crypto from "runtime-compat/crypto";

const valid = /^[^\W_]{8}-[^\W_]{4}-[^\W_]{4}-[^\W_]{4}-[^\W_]{12}$/u;

export default value => {
  is(value).string();
  if (valid(value)) {
    return value;
  }
  throw new Error(`${value} is not a valid UUID`);
};
```

The `uuid` type makes sure a string is a valid UUID.

!!!
The `number` and `uuid` types are so common that they're included in a Primate
module, [`@primate/types`](/modules/types), alongside many other commonly used
types.
!!!

## Using

Primate types can be imported and used anywhere in your application to ensure
certain code invariants are met. In addition, many of Primate's built-in
functionalities integrate seamlessly with the types you define.

### Path parameters

In Primate's [filesystem-based routing](/guide/routing), path parameters may be
additionally specified with types to ensure the path adheres to a certain
format.

```js caption=routes/user/{userId:uuid}.js | typed path
export default {
  /*
    GET /user/b8c5b7b2-4f4c-4939-81d8-d1bdadd888c5
    -> "User ID is b8c5b7b2-4f4c-4939-81d8-d1bdadd888c5"

    GET /user/1
    -> Error
  */
  get(request) {
    const userId = request.path.get("userId");
    return `User ID is ${userId}`;
  }
}
```

In the above example, using the `uuid` type we previously defined in `types`,
we make sure the route function is only executed if the `GET` request is to a
pathname starting with `user/` and followed by a valid UUID.

Parameters named in the same way as types will be automatically typed. Assume
that we created the following `userId` type that makes sure a dataset user
exists with the given type.

```js caption=types/userId.js | asserted user id
import number from "./number.js";

const users = [
  {
    id: 6161
    name: "Donald",
  },
];

export default id => {
  /* IDs must be numbers */
  const nid = number(id);
  const user = users.find(user => user.id === nid);
  if (user !== undefined) {
    return nid;
  }
  throw new Error(`${id} is not a valid user ID`);
}
```

With that definition, using `{userId}` in any route will autotype it to the
`userId` type.

```js caption=routes/user/{userId}.js | autotyped path
export default {
  get(request) {
    /*
      GET /user/6161
      -> "User ID is 6161"

      GET /user/1616
      -> Error
    */
    const userId = request.path.get("userId");
    return `User ID is ${userId}`;
  }
}
```

Here, we avoided typing out the route as `user/{userId:userId}.js` and relied
on Primate to match the type to the parameter name. In this case, `GET
/user/1616` cannot be matched to a route, as `1616` is not an ID of a user in
our dataset.

By first checking that the given value is a number, we have also coerced it to
the correct JavaScript type, making sure the strict equally in the `find`
predicate works. Using such delegated typing allows you to distinguish between
different classes of errors: the input being a proper numeric string vs.
supplying the ID of an actual dataset user.

!!!
If you do not wish Primate to automatically type your path parameters, set
`types.explicit` to `true` in your configuration. In that case, you would need
to use the route filename `routes/user/{userId:userId}.js` instead.
!!!

### Request query

Likewise, the request's query string parts, which we previously accessed using
`request.query.get`, may be typed to ensure adherence to a given format. This
can be achieved manually by importing the type function. Here we'll also create
an additional `user` type coercing the ID into a user object, to be able to
return it as the response body.

```js caption=types/user.js | asserted id coerced to user
import number from "./number.js";

const users = [
  {
    id: 6161
    name: "Donald",
  },
];

export default id => {
  /* ids must be numbers */
  const nid = number(id);
  const user = users.find(user => user.id === nid);
  if (user !== undefined) {
    return user;
  }
  throw new Error(`no user with ID ${id}`);
}
```

We then use the type to assert the id is a user id and coerce it into a user.

```js caption=routes/user.js | typed query (manually)
import user from "../types/user.js";

export default {
  /*
    GET /user?userId=6161
    -> `{id: 6161, name: "Donald"}`

    GET /user?userId=1616
    -> Error
  */
  get(request) {
    return user(request.query.get("userId"));
  }
}
```

This is generally OK, but as routes may arbitrarily nested, it can make
importing from relative paths unseemly. For that, Primate enhances the `query`
object with functions for sending a property's value to the runtime type for
validation.

```js caption=routes/user.js | typed query (using dispatchers)
export default {
  /*
    GET /user?userId=6161
    -> `{id: 6161, name: "Donald"}`

    GET /user?userId=1616
    -> Error
  */
  get(request) {
    /* get the "userId" property from the request query, running it through the
    `user` type, returning the user object or throwing in case of a failure */
    return request.query.user("userId");
  }
}
```

Primate here adds any defined types as dispatcher functions of the
`request.query` object, in addition to the `get()` function which allows direct
access to the query string parts. As there is no user in our dataset with the
ID `1616`, if a client tries to access `GET /user?userId=1616`, the route will
throw with the client redirected to an error page.

!!!
As `get` is already defined on `request.query`, it is considered a reserved
keyword -- Primate will refuse to start if you try to define a type with this
name.
!!!

### Headers and cookies

In identical fashion to the request query, you can make sure certain headers or
cookies follow a given format, by retrieving them using the appropriate type
function.

```js caption=routes/user.js | typed headers
export default {
  /*
    GET /user
    X-User-Id: 6161
    -> `{id: 6161, name: "Donald"}`

    GET /user
    X-User-Id: 1616
    -> Error
  */
  get(request) {
    return request.headers.user("X-User-Id");
  }
}
```

```js caption=routes/user.js | typed cookies
export default {
  /*
    GET /user
    Cookie: userId=6161
    -> `{id: 6161, name: "Donald"}`

    GET /user
    Cookie: userId=1616
    -> Error
  */
  get(request) {
    return request.cookies.user("userId");
  }
}
```

## Related modules

Primate's ecosystem extends the concept of types by providing many defaults
and integrating with database types.

### Types

Most of the time you won't need to define your own types unless you have very
specific use cases. Primate's [Types module](/modules/types) comes with a
handful of common types such as `string`, `number`, `uuid`, `isodate`,
containing over 20 different types. By importing and loading this module, its
types will be injected and available wherever types are used.

### Store

The Primate [Store module](/modules/store), used for data persistance, also
integrates with Primate's type concept and extends upon it. It is highly
recommended to use it in conjuction with the Types module.