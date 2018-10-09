import { ResourceClient } from 'jsonapi-client';
import Resource from './Resource';

export default class ResourceStore {
  records = []

  constructor({ name, httpClient }) {
    this.client = new ResourceClient({ name, httpClient });
  }

  loadAll({ options } = {}) {
    return this.client.all({ options })
      .then(records => {
        this.records = records.map(record => new Resource({ record, client: this.client }));
      });
  }

  loadById() {

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
