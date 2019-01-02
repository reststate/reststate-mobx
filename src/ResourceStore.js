const { observable, action, runInAction } = require('mobx');
const { ResourceClient } = require('@reststate/client');
const Resource = require('./Resource');

const STATUS_INITIAL = 'INITIAL';
const STATUS_LOADING = 'LOADING';
const STATUS_ERROR = 'ERROR';
const STATUS_SUCCESS = 'SUCCESS';

const storeRecord = records => newRecord => {
  const existingRecord = records.find(r => r.id === newRecord.id);
  if (existingRecord) {
    Object.assign(existingRecord, newRecord);
    return existingRecord;
  } else {
    records.push(newRecord);
    return newRecord;
  }
};

const matches = criteria => test =>
  Object.keys(criteria).every(key => criteria[key] === test[key]);

const handleError = store => error => {
  runInAction(() => {
    store._status.set(STATUS_ERROR);
  });
  throw error;
};

class ResourceStore {
  constructor({ name, httpClient }) {
    this.client = new ResourceClient({ name, httpClient });
    this._status = observable.box(STATUS_INITIAL);
    this.records = observable([]);
    this.filtered = observable([]);
    this.relatedRecords = observable([]);

    this.loadAll = action(({ options } = {}) => {
      this._status.set(STATUS_LOADING);
      return this.client
        .all({ options })
        .then(response => {
          const records = response.data.map(
            record =>
              new Resource({ record, client: this.client, store: this }),
          );
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
            records.forEach(storeRecord(this.records));
          });
          return records;
        })
        .catch(handleError(this));
    });

    this.loadById = action(({ id, options }) => {
      this._status.set(STATUS_LOADING);
      return this.client
        .find({ id, options })
        .then(response => {
          const record = new Resource({
            record: response.data,
            client: this.client,
            store: this,
          });
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
            storeRecord(this.records)(record);
          });
          return record;
        })
        .catch(handleError(this));
    });

    this.loadWhere = action(({ filter, options } = {}) => {
      this._status.set(STATUS_LOADING);
      return this.client
        .where({ filter, options })
        .then(response => {
          const ids = response.data.map(record => record.id);
          const resources = response.data.map(
            record =>
              new Resource({ record, client: this.client, store: this }),
          );
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
            const matchesRequestedFilter = matches(filter);
            const otherFilteredEntries = this.filtered.filter(
              ({ filter: testFilter }) => !matchesRequestedFilter(testFilter),
            );
            this.filtered.replace([...otherFilteredEntries, { filter, ids }]);
            resources.forEach(storeRecord(this.records));
          });
          return resources;
        })
        .catch(handleError(this));
    });

    this.loadRelated = action(({ parent, options } = {}) => {
      this._status.set(STATUS_LOADING);
      return this.client
        .related({ parent, options })
        .then(response => {
          const { id, type } = parent;
          const relatedIds = response.data.map(record => record.id);
          const resources = response.data.map(
            record =>
              new Resource({ record, client: this.client, store: this }),
          );
          runInAction(() => {
            this._status.set(STATUS_SUCCESS);
            const matchesParent = matches({ id, type });
            const otherParentEntries = this.relatedRecords.filter(
              record => !matchesParent(record),
            );
            this.relatedRecords.replace([
              ...otherParentEntries,
              { id, type, relatedIds },
            ]);
            resources.forEach(storeRecord(this.records));
          });
          return resources;
        })
        .catch(handleError(this));
    });

    this.create = action(partialRecord => {
      return this.client.create(partialRecord).then(response => {
        const record = new Resource({
          record: response.data,
          client: this.client,
          store: this,
        });
        runInAction(() => {
          storeRecord(this.records)(record);
        });
        return record;
      });
    });

    this.storeRecords = action(records => {
      this.records.replace(
        records.map(
          record => new Resource({ record, client: this.client, store: this }),
        ),
      );
    });

    this.remove = action(record => {
      this.records.replace(
        this.records.filter(testRecord => testRecord.id !== record.id),
      );
    });
  }

  get loading() {
    return this._status.get() === STATUS_LOADING;
  }

  get error() {
    return this._status.get() === STATUS_ERROR;
  }

  all() {
    return this.records;
  }

  byId({ id }) {
    return this.records.find(record => record.id === id);
  }

  where({ filter }) {
    const matchesRequestedFilter = matches(filter);
    const entry = this.filtered.find(({ filter: testFilter }) =>
      matchesRequestedFilter(testFilter),
    );

    if (!entry) {
      return [];
    }

    return entry.ids.map(id => this.byId({ id }));
  }

  related({ parent }) {
    const { type, id } = parent;
    const related = this.relatedRecords.find(matches({ type, id }));

    if (!related) {
      return [];
    }

    return related.relatedIds.map(id => this.byId({ id }));
  }
}

module.exports = ResourceStore;
