import ResourceStore from '../src/ResourceStore';

describe('ResourceStore', () => {
  let store;
  let api;

  beforeEach(() => {
    api = {
      get: jest.fn(),
    };
    store = new ResourceStore({
      name: 'widgets',
      httpClient: api,
    });
  });

  describe('loadAll', () => {
    it('loads records via the client', () => {
      const records = [
        {
          type: 'widgets',
          id: '1',
        },
      ];
      api.get.mockResolvedValue({ data: records });

      return store.loadAll()
        .then(() => {
          expect(store.records.length).toEqual(1);
          const record = store.records[0];
          expect(record.id).toEqual('1');
        });
    });
  });

  describe('loadById', () => {
    describe('when the record is not yet present in the store', () => {
      beforeEach(() => {
        store.storeRecords([
          {
            type: 'widgets',
            id: '27',
          },
        ]);
      });

      it('adds the record to the list of all records', () => {
        const id = '42';
        const record = {
          type: 'widgets',
          id,
          attributes: {
            title: 'New Title',
          },
        };
        api.get.mockResolvedValue({ data: record });
        return store.loadById(id)
          .then(() => {
            const { records } = store;

            expect(records.length).toEqual(2);

            const storedRecord = records.find(r => r.id === id);
            expect(storedRecord.attributes.title).toEqual('New Title');
          });
      });
    });

    describe('when the record is already present in the store', () => {
      beforeEach(() => {
        store.storeRecords([
          {
            type: 'widgets',
            id: '42',
            attributes: {
              title: 'Old Title',
            },
          },
        ]);
      });

      it('adds the record to the list of all records', () => {
        const id = '42';
        const record = {
          type: 'widgets',
          id,
          attributes: {
            title: 'New Title',
          },
        };
        api.get.mockResolvedValue({ data: record });
        return store.loadById(id)
          .then(() => {
            const { records } = store;

            expect(records.length).toEqual(1);

            const storedRecord = records[0];
            expect(storedRecord.attributes.title).toEqual('New Title');
          });
      });
    });
  });
});
