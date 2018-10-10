# vuex-jsonapi

`vuex-jsonapi`, unsurprisingly, allows you to access data from a [JSON API](http://jsonapi.org/) web service via MobX objects. Because of JSON API's strong conventions, in most cases all you should need to do is tell `mobx-jsonapi` the base URL of your web service, and which resources to access, and you should be set. No manual web request juggling!

This is a very early proof-of-concept, so THERE IS NO ERROR HANDLING YET, and many features of JSON API are not yet supported. Open a GitHub issue with any other features you'd like to see!

## Installation

```
# npm install --save mobx-jsonapi
```

## Setup

To create a MobX object corresponding to a resource on the server, create a `new ResourceStore()`:

```javascript
import { ResourceStore } from 'mobx-jsonapi';
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

### loadAll method

To retrieve all of the records for a resource, call the `loadAll()` method to save them into the store. The method returns a promise that will resolve to the recoreds:

```javascript
store.loadAll()
  .then(widgets => console.log(widgets));
```

### loadById method

To retrieve a single record by ID, call the `loadById()` method:

```javascript
store.loadById({ id: 42 })
  .then(widget => console.log(widget));
```

### loadWhere action / where getter

To filter/query for records based on certain criteria, use the `loadWhere` method, passing it an object of filter keys and values to send to the server:

```js
const filter = {
  category: 'whizbang',
};
store.loadWhere({ filter })
  .then(widgets => console.log(widgets));
```

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

```js
const parent = {
  type: 'categories',
  id: 27,
};

const relationship = 'purchased-widgets';

store.loadRelated({ parent, relationship })
  .then(widgets => console.log(widgets));
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

To update records, pass the entire updated record object to the `update` method:

```javascript
store.findById({ id: 42})
  .then(widget => {
    widget.attributes.title = 'Updated Title';
    return store.update(widget);
  });
```

### delete

To delete, pass either a full record or just an object with an ID field:

```javascript
const widgetIdObject = { id: 42 };
store.delete(widgetIdObject);
```

## License

Apache 2.0
