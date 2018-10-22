# @reststate/mobx

[![CircleCI](https://circleci.com/gh/reststate/reststate-mobx.svg?style=svg)](https://circleci.com/gh/reststate/reststate-mobx)

`@reststate/mobx`, unsurprisingly, allows you to access data from a [JSON API](http://jsonapi.org/) web service via [MobX](https://mobx.js.org/) objects. Because of JSON API's strong conventions, in most cases all you should need to do is tell `@reststate/mobx` the base URL of your web service, and which resources to access, and you should be set. No manual web request juggling!

This is a very early proof-of-concept, so many features of JSON API are not yet supported. Open a GitHub issue with any other features you'd like to see!

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

## Installation

```
# npm install --save @reststate/mobx
```

## Setup

To create a MobX object corresponding to a resource on the server, create a `new ResourceStore()`:

```javascript
import { ResourceStore } from '@reststate/mobx';
import api from './api';

const store = new ResourceStore({
  name: 'widgets',
  httpClient: api,
});
```

The `httpClient` accepts an object with a signature similar to the popular [Axios](https://github.com/axios/axios) HTTP client directory. You can either pass in an Axios client configured with your base URL and headers. Note that spec-compliant servers will require a `Content-Type` header of `application/vnd.api+json`; you will need to configure your HTTP client to send that.

```javascript
import axios from 'axios';

const httpClient = axios.create({
  baseURL: 'http://api.example.com/',
  headers: {
    'Content-Type': 'application/vnd.api+json',
    'Authentication': `Bearer ${token}`,
  },
});

const module = new ResourceStore({
  name: 'widgets',
  httpClient,
});
```

Or else you can pass in an object that exposes the following methods:

```javascript
const httpClient = {
  get(path) {
    // ...
  },
  post(path, body) {
    // ...
  },
  patch(path, body) {
    // ...
  },
  delete(path, body) {
    // ...
  },
};
```

That's all you need to do--the JSON API spec takes care of the rest!

## Usage

Working with JSON API data is split into two parts:

- **load methods** are used to asynchronously request data from the server or update data on the server, storing the results into the store's state.
- **observable methods** are used to synchronously access data from the module's state. These should be used in rendering out contents to React, for example. Because they are observable, React will rerender when they are changed.

### loadAll/all methods

To retrieve all of the records for a resource, call the `loadAll()` method to save them into the store. The method returns a promise that will resolve to the records:

```javascript
store.loadAll()
  .then(widgets => console.log(widgets));
```

Typically, though, you will access records synchronously with the `all()` method:

```javascript
const widgets = store.all();
console.log(widgets);
```

### loadById method

To retrieve a single record by ID, call the `loadById()` method:

```javascript
store.loadById({ id: 42 })
  .then(widget => console.log(widget));
```

Access it synchronously with the `byId()` method:

```javascript
const widget = store.byId({ id: 42 });
console.log(widget);
```

If you know the record has already been retrieved, you don't need to load it again. For example, if you've loaded all records on a list screen, and then you click to view the details for a single record, you can just use `byId()` directly, bypassing `loadById()`.

### loadWhere action / where getter

To filter/query for records based on certain criteria, use the `loadWhere` method, passing it an object of filter keys and values to send to the server:

```javascript
const filter = {
  category: 'whizbang',
};
store.loadWhere({ filter })
  .then(widgets => console.log(widgets));
```

Records can be accessed synchronously by passing the same filter to the `where()` method:

```javascript
const widgets = store.where({ filter });
console.log(widgets);
```

`where()` doesn’t perform any filtering logic on the client side; it simply keeps track of which IDs were returned by the server side request and retrieves those records.

### loadRelated method

Finally, to load records related via JSON API relationships, use the `loadRelated` method. A nested resource URL is constructed like `categories/27/widgets`. (In the future we will look into using HATEOAS to let the server tell us the relationship URL).

```javascript
const parent = {
  type: 'category',
  id: 27,
};

store.loadRelated({ parent })
  .then(widgets => console.log(widgets));
```

By default, the name of the relationship on `parent` is assumed to be the same as the name of the other model: in this case, `widgets`. In cases where the names are not the same, you can explicitly pass the relationship name:

```javascript
const parent = {
  type: 'categories',
  id: 27,
};

const relationship = 'purchased-widgets';

store.loadRelated({ parent, relationship })
  .then(widgets => console.log(widgets));
```

Records can be accessed synchronously using the `related()` method:

```javascript
const widgets = store.loadRelated({ parent });
console.log(widgets);
```

### create

To create records on the server and also store it locally, use the `create` method. Pass it an object containing an `attributes` object. This is similar to a JSON API record, but you don't need to specify the type -- the store will add the type.

```javascript
const recordData = {
  attributes: {
    title: 'My Widget',
  },
};
store.create(recordData);
```

You can also save relationships by providing a `relationships` attribute, just like in the JSON API spec:

```javascript
const recordData = {
  attributes: {
    title: 'My Widget',
  },
  relationships: {
    category: {
      data: {
        type: 'categories',
        id: 42,
      },
    },
  },
};
store.create(recordData);
```

### update

The returned record objects are instances of `Record`. To update records, mutate attributes, then call `update()` on the record:

```javascript
const widget = store.byId({ id: 42 });
widget.attributes.title = 'Updated Title';
widget.update();
```

### delete

To delete, call `delete()` on a record:

```javascript
const widget = store.byId({ id: 42 });
widget.delete();
```

## License

Apache 2.0
