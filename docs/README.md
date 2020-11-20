# @reststate/mobx

:::danger
This package is no longer maintained.
:::

`@reststate/mobx` allows you to access data from a [JSON:API](http://jsonapi.org/) web service via [MobX](https://mobx.js.org/) objects. Because of JSON:API's strong conventions, in most cases all you should need to do is tell `@reststate/mobx` the base URL of your web service, and which resources to access, and you should be set. No manual web request juggling!

This is a very early proof-of-concept, so many features of JSON:API are not yet supported. Open a GitHub issue with any other features you'd like to see!

## Synopsis

```javascript
const store = new ResourceStore({
  name: 'widgets',
  httpClient: axios.create(...),
});

store.loadAll()
  .then(() => {
    const widgets = store.all();
    console.log(widgets);
  });

store.create({
  attributes: {
    title: 'My Widget',
  },
});
```

## License

Apache 2.0
