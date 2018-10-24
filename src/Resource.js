const { observable, action, runInAction } = require('mobx');

const STATUS_INITIAL = 'INITIAL';
const STATUS_LOADING = 'LOADING';
const STATUS_ERROR = 'ERROR';
const STATUS_SUCCESS = 'SUCCESS';

const handleError = (record) => (error) => {
  runInAction(() => {
    record._status.set(STATUS_ERROR);
  });
  throw error;
};

class Resource {
  constructor({ record, client, store }) {
    this.client = client;
    this.store = store;
    this._status = observable.box(STATUS_INITIAL);
    this.type = record.type;
    this.id = record.id;
    this.attributes = observable(record.attributes || {});
    this.relationships = observable(record.relationships || {});

    this.save = action(() => {
      this._status.set(STATUS_LOADING);
      const { type, id } = this;
      const attributes = Object.assign({}, this.attributes);
      const relationships = Object.assign({}, this.relationships);
      return this.client.update({ type, id, attributes, relationships })
        .then(response => {
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
          });
          return response;
        })
        .catch(handleError(this));
    });

    this.delete = action(() => {
      this._status.set(STATUS_LOADING);
      return this.client.delete({ id: this.id })
        .then(response => {
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
            this.store.remove(this);
          });
          return response;
        })
        .catch(handleError(this));
    });
  }

  get loading() {
    return this._status.get() ===  STATUS_LOADING;
  }

  get error() {
    return this._status.get() ===  STATUS_ERROR;
  }
}

module.exports = Resource;
