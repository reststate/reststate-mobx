const { observable } = require('mobx');
const { ResourceClient } = require('@reststate/client');
const Resource = require('./Resource');

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

class ResourceStore {
  constructor({ name, httpClient }) {
    this.client = new ResourceClient({ name, httpClient });
    this._loading = observable.box(false);
    this._error = observable.box(false);
    this.records = observable([]);
    this.filtered = observable([]);
    this.relatedRecords = observable([]);
  }

  get loading() {
    return this._loading.get();
  }

  get error() {
    return this._error.get();
  }

  storeRecords(records) {
    this.records = records.map(record => (
      new Resource({ record, client: this.client })
    ));
  }

  loadAll({ options } = {}) {
    this._error.set(false);
    this._loading.set(true);
    return this.client.all({ options })
      .then(response => {
        this._loading.set(false);
        const records = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        records.forEach(storeRecord(this.records));
        return records;
      })
      .catch(error => {
        this._loading.set(false);
        this._error.set(true);
      });
  }

  all() {
    return this.records;
  }

  loadById({ id, options }) {
    this._error.set(false);
    this._loading.set(true);
    return this.client.find({ id, options })
      .then(response => {
        this._loading.set(false);
        const record = new Resource({
          record: response.data,
          client: this.client,
        });
        storeRecord(this.records)(record);
        return record;
      })
      .catch(error => {
        this._loading.set(false);
        this._error.set(true);
      });
  }

  byId({ id }) {
    return this.records.find(record => record.id === id);
  }

  loadWhere({ filter, options } = {}) {
    this._error.set(false);
    this._loading.set(true);
    return this.client.where({ filter, options })
      .then(response => {
        const resources = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        this.filtered.push({ filter, resources });
        this._loading.set(false);
        resources.forEach(storeRecord(this.records));
        return resources;
      })
      .catch(error => {
        this._loading.set(false);
        this._error.set(true);
      });
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
    this._error.set(false);
    this._loading.set(true);
    return this.client.related({ parent, options })
      .then(response => {
        const { id, type } = parent;
        this._loading.set(false);
        const resources = response.data.map(record => (
          new Resource({ record, client: this.client })
        ));
        this.relatedRecords.push({ id, type, resources });
        resources.forEach(storeRecord(this.records));
        return resources;
      })
      .catch(error => {
        this._loading.set(false);
        this._error.set(true);
      });
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
    this._error.set(false);
    this._loading.set(true);
    return this.client.create(partialRecord)
      .then(response => {
        this._loading.set(false);
        const record = response.data;
        storeRecord(this.records)(record);
        return record;
      })
      .catch(error => {
        this._loading.set(false);
        this._error.set(true);
        throw error;
      });
  }
}

module.exports = ResourceStore;
