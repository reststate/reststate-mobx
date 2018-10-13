const { observable } = require('mobx');
class Resource {
  constructor({ record, client }) {
    this.client = client;
    this._error = observable.box(false);
    Object.assign(this, record);
  }

  get error() {
    return this._error.get();
  }

  save() {
    const { type, id, attributes, relationships } = this;
    return this.client.update({ type, id, attributes, relationships })
      .catch(response => {
        this._error.set(true);
        throw response.errors;
      });
  }

  delete() {
    return this.client.delete({ id: this.id });
  }
}

module.exports = Resource;
