import { ResourceClient } from 'jsonapi-client';
import Resource from './Resource';

const storeRecord = (records) => (newRecord) => {
  const existingRecord = records.find(r => r.id === newRecord.id);
  if (existingRecord) {
    Object.assign(existingRecord, newRecord);
  } else {
    records.push(newRecord);
  }
};

export default class ResourceStore {
  records = []

  constructor({ name, httpClient }) {
    this.client = new ResourceClient({ name, httpClient });
  }

  storeRecords(records) {
    this.records = records.map(record => (
      new Resource({ record, client: this.client })
    ));
  }

  loadAll({ options } = {}) {
    return this.client.all({ options })
      .then(records => records.forEach(storeRecord(this.records)));
  }

  loadById(id) {
    return this.client.find(id)
      .then(storeRecord(this.records));
  }

  loadWhere(criteria, { options } = {}) {
    return this.client.where(criteria, { options })
      .then(records => {
        return records.map(record => (
          new Resource({ record, client: this.client })
        ));
      })
      .then(resources => {
        resources.forEach(storeRecord(this.records));
        return resources;
      });
  }

  loadRelated(parent, { options } = {}) {
    return this.client.related({ parent, options })
      .then(records => {
        return records.map(record => (
          new Resource({ record, client: this.client })
        ));
      })
      .then(resources => {
        resources.forEach(storeRecord(this.records));
        return resources;
      });
  }

  create(partialRecord) {
    return this.client.create(partialRecord)
      .then(response => response.data)
      .then(storeRecord(this.records));
  }
}
