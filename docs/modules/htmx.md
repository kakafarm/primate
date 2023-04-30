# HTMX handler

The [HTMX handler module][repository] serves HTMX components with the `.htmx`
extension.

## Install

`npm i @primate/htmx`

## Load

Import and initialize the module in your configuration.

```js file=primate.config.js
import htmx from "@primate/htmx";

export default {
  modules: [htmx()],
};
```

## Use

Create an HTMX component in `components`.

```html file=components/post-add.htmx
<h1>Add post</h1>
<form hx-post="/htmx" hx-wrap="outerHTML">
  <p>
    <div><label>Title</label></div>
    <input name="title" />
  </p>
  <p>
    <div><label>Text</label></div>
    <textarea name="text"></textarea>
  </p>
  <input type="submit" value="Save post" />
</form>
```

Create a route and serve the HTMX `post-add` component, adding a POST route for
handling its form.

```js file=routes/htmx.js
import {view, html} from "primate";

const posts = [
export default {
  get() {
    return view("post-add.htmx");
  },
  post({body}) {
    return html(
      `<h2>Adding a post with:</h2>
      <div><strong>Title</strong> ${body.title}</div>
      <div><strong>Text</strong> ${body.text}</div>`,
    {partial: true});
  }
};
```

Your rendered HTMX component will be accessible at http://localhost:6161/htmx.

Here, we used the `html` handler to return HTML directly from the POST route,
indicating it should not include the `index.html` layout by setting `partial`
to `true`. 

## Configuration options

### directory

Directory where the HTMX components reside. Defaults to
`config.paths.components`.

[repository]: https://github.com/primatejs/primate/tree/master/packages/htmx