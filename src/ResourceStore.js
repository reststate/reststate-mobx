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

  loadWhere() {

  }

  loadRelated() {

  }

  create(partialRecord) {
    return this.client.create(partialRecord)
      .then(record => new Resource({ record, client: this.client }));
  }
}
