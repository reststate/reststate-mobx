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
  constructor({ record, client }) {
    this.client = client;
    this._status = observable.box(STATUS_INITIAL);
    this.type = record.type;
    this.id = record.id;
    this.attributes = observable(record.attributes || {});
    this.relationships = observable(record.relationships || {});
  }

  get loading() {
    return this._status.get() ===  STATUS_LOADING;
  }

  get error() {
    return this._status.get() ===  STATUS_ERROR;
  }

  save = action(() => {
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
  })

  delete = action(() => {
    this._status.set(STATUS_LOADING);
    return this.client.delete({ id: this.id })
      .then(response => {
        runInAction(() => {
          this._status.set(STATUS_SUCCESS);
        });
        return response;
      })
      .catch(handleError(this));
  })
}

module.exports = Resource;
