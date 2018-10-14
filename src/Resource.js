const { observable } = require('mobx');
class Resource {
  constructor({ record, client }) {
    this.client = client;
    this._loading = observable.box(false);
    this._error = observable.box(false);
    Object.assign(this, record);
  }

  get loading() {
    return this._loading.get();
  }

  get error() {
    return this._error.get();
  }

  save() {
    const { type, id, attributes, relationships } = this;
    this._loading.set(true);
    return this.client.update({ type, id, attributes, relationships })
      .then(response => {
        this._loading.set(false);
        return response;
      })
      .catch(response => {
        this._error.set(true);
        throw response.errors;
      });
  }

  delete() {
    this._loading.set(true);
    return this.client.delete({ id: this.id })
      .then(response => {
        this._loading.set(false);
        return response;
      })
      .catch(error => {
        this._error.set(true);
        throw error;
      });
  }
}

module.exports = Resource;
