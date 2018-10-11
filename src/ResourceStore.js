const { observable } = require('mobx');
const { ResourceClient } = require('jsonapi-client');
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
    this.records = observable([]);
    this.filtered = observable([]);
  }

  storeRecords(records) {
    this.records = records.map(record => (
      new Resource({ record, client: this.client })
    ));
  }

  loadAll({ options } = {}) {
    return this.client.all({ options })
      .then(response => (
        response.data.map(record => (
          new Resource({ record, client: this.client })
        ))
      ))
      .then(records => (
        records.map(storeRecord(this.records))
      ));
  }

  all() {
    return this.records;
  }

  loadById({ id, options }) {
    return this.client.find({ id, options })
      .then(response => (
        new Resource({ record: response.data, client: this.client })
      ))
      .then(storeRecord(this.records));
  }

  byId({ id }) {
    return this.records.find(record => record.id === id);
  }

  loadWhere({ filter, options } = {}) {
    return this.client.where({ filter, options })
      .then(response => (
        response.data.map(record => (
          new Resource({ record, client: this.client })
        ))
      ))
      .then(resources => {
        const ids = resources.map(({ id }) => id);
        this.filtered.push({ filter, ids });
        return resources.map(storeRecord(this.records))
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

    const { ids } = entry;
    return this.records.filter(record => ids.includes(record.id));
  }

  loadRelated({ parent, options } = {}) {
    return this.client.related({ parent, options })
      .then(response => (
        response.data.map(record => (
          new Resource({ record, client: this.client })
        ))
      ))
      .then(resources => (
        resources.map(storeRecord(this.records))
      ));
  }

  create(partialRecord) {
    return this.client.create(partialRecord)
      .then(response => response.data)
      .then(storeRecord(this.records));
  }
}

module.exports = ResourceStore;
