const { observable } = require('mobx');
const { ResourceClient } = require('@reststate/client');
const Resource = require('./Resource');

const STATUS_INITIAL = 'INITIAL';
const STATUS_LOADING = 'LOADING';
const STATUS_ERROR = 'ERROR';
const STATUS_SUCCESS = 'SUCCESS';

const storeRecord = (records) => (newRecord) => {
  const existingRecord = records.find(r => r.id === newRecord.id);
  if (existingRecord) {
    Object.assign(existingRecord, newRecord);
    return existingRecord;
  } else {
    records.push(newRecord);
    return newRecord;
  }
};

const matches = (criteria) => (test) => (
  Object.keys(criteria).every(key => (
    criteria[key] === test[key]
  ))
);

const handleError = (store) => (error) => {
  store._status.set(STATUS_ERROR);
  throw error;
};

class ResourceStore {
  constructor({ name, httpClient }) {
    this.client = new ResourceClient({ name, httpClient });
    this._status = observable.box(STATUS_INITIAL);
    this.records = observable([]);
    this.filtered = observable([]);
    this.relatedRecords = observable([]);
  }

  get loading() {
    return this._status.get() === STATUS_LOADING;
  }

  get error() {
    return this._status.get() === STATUS_ERROR;
  }

  storeRecords(records) {
    this.records = records.map(record => (
      new Resource({ record, client: this.client })
    ));
  }

  loadAll({ options } = {}) {
    this._status.set(STATUS_LOADING);
    return this.client.all({ options })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        const records = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        records.forEach(storeRecord(this.records));
        return records;
      })
      .catch(handleError(this));
  }

  all() {
    return this.records;
  }

  loadById({ id, options }) {
    this._status.set(STATUS_LOADING);
    return this.client.find({ id, options })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        const record = new Resource({
          record: response.data,
          client: this.client,
        });
        storeRecord(this.records)(record);
        return record;
      })
      .catch(handleError(this));
  }

  byId({ id }) {
    return this.records.find(record => record.id === id);
  }

  loadWhere({ filter, options } = {}) {
    this._status.set(STATUS_LOADING);
    return this.client.where({ filter, options })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        const resources = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        this.filtered.push({ filter, resources });
        resources.forEach(storeRecord(this.records));
        return resources;
      })
      .catch(handleError(this));
  }

  where({ filter }) {
    const matchesRequestedFilter = matches(filter);
    const entry = this.filtered.find(({ filter: testFilter }) => (
      matchesRequestedFilter(testFilter)
    ));

    if (!entry) {
      return [];
    }

    return entry.resources;
  }

  loadRelated({ parent, options } = {}) {
    this._status.set(STATUS_LOADING);
    return this.client.related({ parent, options })
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        const { id, type } = parent;
        const resources = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        this.relatedRecords.push({ id, type, resources });
        resources.forEach(storeRecord(this.records));
        return resources;
      })
      .catch(handleError(this));
  }

  related({ parent }) {
    const { type, id } = parent;
    const related = this.relatedRecords.find(matches({ type, id }));

    if (!related) {
      return [];
    }

    return related.resources;
  }

  create(partialRecord) {
    this._status.set(STATUS_LOADING);
    return this.client.create(partialRecord)
      .then(response => {
        this._status.set(STATUS_SUCCESS);
        const record = response.data;
        storeRecord(this.records)(record);
        return record;
      })
      .catch(handleError(this));
  }
}

module.exports = ResourceStore;
