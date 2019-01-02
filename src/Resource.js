const { observable, action, runInAction } = require('mobx');

class Resource {
  constructor({ record, client, store }) {
    this.client = client;
    this.store = store;
    this.type = record.type;
    this.id = record.id;
    this.attributes = observable(record.attributes || {});
    this.relationships = observable(record.relationships || {});

    this.save = action(() => {
      const { type, id } = this;
      const attributes = Object.assign({}, this.attributes);
      const relationships = Object.assign({}, this.relationships);
      return this.client.update({ type, id, attributes, relationships });
    });

    this.update = action(({ attributes, relationships }) => {
      const { type, id } = this;
      return this.client
        .update({ type, id, attributes, relationships })
        .then(response => {
          runInAction(() => {
            Object.assign(this.attributes, attributes);
            Object.assign(this.relationships, this.relationships);
          });
          return response;
        });
    });

    this.delete = action(() => {
      return this.client.delete({ id: this.id }).then(response => {
        runInAction(() => {
          this.store.remove(this);
        });
        return response;
      });
    });
  }
}

module.exports = Resource;
