# Writing Data

## create

To create records on the server and also store it locally, use the `create` method. Pass it an object containing an `attributes` object. This is similar to a JSON:API record, but you don't need to specify the type -- the store will add the type.

```javascript
const recordData = {
  attributes: {
    title: 'My Widget',
  },
};
store.create(recordData);
```

You can also save relationships by providing a `relationships` attribute, just like in the JSON:API spec:

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

## save

The returned record objects are instances of `Record`. To update records, mutate attributes, then call `save()` on the record:

```javascript
const widget = store.byId({ id: 42 });
widget.attributes.title = 'Updated Title';
widget.save();
```

## update

`save()` will persist all attributes and relationships on the record to the server. If you only want to persist certain attributes or relationships, you can call `update()`, passing them in. The new values will be saved to the server and then updated in the record itself:

```javascript
const widget = store.byId({ id: 42 });
widget.update({
  attributes: { title: 'Updated Title' },
});
```

## delete

To delete, call `delete()` on a record:

```javascript
const widget = store.byId({ id: 42 });
widget.delete();
```
