const { observable } = require('mobx');

const STATUS_INITIAL = 'INITIAL';
const STATUS_LOADING = 'LOADING';
const STATUS_ERROR = 'ERROR';
const STATUS_SUCCESS = 'SUCCESS';

const handleError = (record) => (error) => {
  record._status.set(STATUS_ERROR);
  throw error;
};

class Resource {
  constructor({ record, client }) {
    this.client = client;
    this._status = observable.box(STATUS_INITIAL);
    Object.assign(this, record);
  }

  get loading() {
    return this._status.get() ===  STATUS_LOADING;
  }

  get error() {
    return this._status.get() ===  STATUS_ERROR;
  }

  save() {
    const { type, id, attributes, relationships } = this;
    this._status.set(STATUS_LOADING);
    return this.client.update({ type, id, attributes, relationships })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        return response;
      })
      .catch(handleError(this));
  }

  delete() {
    this._status.set(STATUS_LOADING);
    return this.client.delete({ id: this.id })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        return response;
      })
      .catch(handleError(this));
  }
}

module.exports = Resource;
