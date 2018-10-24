# Reading Data

Working with JSON API data is split into two parts:

- **load methods** are used to asynchronously request data from the server or update data on the server, storing the results into the store's state.
- **observable methods** are used to synchronously access data from the module's state. These should be used in rendering out contents to React, for example. Because they are observable, React will rerender when they are changed.

## loadAll/all

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

## loadById/byId

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

## loadWhere/where

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

## loadRelated/related

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
