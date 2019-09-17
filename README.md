# @reststate/mobx

[![CircleCI](https://circleci.com/gh/reststate/reststate-mobx.svg?style=svg)](https://circleci.com/gh/reststate/reststate-mobx)

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

That's all you need to do--the JSON:API spec takes care of the rest!

## Usage

For more information on usage, see the [`@reststate/mobx` docs](https://mobx.reststate.codingitwrong.com).

## License

Apache 2.0
