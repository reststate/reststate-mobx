import ResourceStore from '../src/ResourceStore';

describe('ResourceStore', () => {
  const includeOptions = {
    include: 'customers',
  };

  let store;
  let api;

  beforeEach(() => {
    api = {
      get: jest.fn(),
      post: jest.fn(),
    };
    store = new ResourceStore({
      name: 'widgets',
      httpClient: api,
    });
  });

  describe('loadAll', () => {
    const records = [
      {
        type: 'widgets',
        id: '1',
      },
    ];

    beforeEach(() => {
      api.get.mockResolvedValue({
        data: {
          data: records,
        },
      });
    });

    describe('when passing no options', () => {
      beforeEach(() => {
        return store.loadAll();
      });

      it('makes the correct API call', () => {
        expect(api.get).toHaveBeenCalledWith('widgets?');
      });

      it('loads records via the client', () => {
        expect(store.records.length).toEqual(1);
        const record = store.records[0];
        expect(record.id).toEqual('1');
      });
    });

    describe('when passing an include option', () => {
      it('makes the correct API call', () => {
        return store.loadAll({ options: includeOptions })
          .then(() => {
            expect(api.get).toHaveBeenCalledWith('widgets?include=customers');
          });
      });
    });
  });

  describe('all', () => {
    it('returns all records currently in the store', () => {
      const records = [
        {
          type: 'widgets',
          id: '27',
        },
        {
          type: 'widgets',
          id: '42',
        },
      ]
      store.storeRecords(records);

      const result = store.all();

      expect(result.length).toEqual(2);
      const record = result[0];
      expect(record.id).toEqual('27');
    });
  });

  describe('loadById', () => {
    describe('when the record is not yet present in the store', () => {
      const id = '42';
      const record = {
        type: 'widgets',
        id,
        attributes: {
          title: 'New Title',
        },
      };

      beforeEach(() => {
        store.storeRecords([
          {
            type: 'widgets',
            id: '27',
          },
        ]);

        api.get.mockResolvedValue({
          data: {
            data: record,
          },
        });

        return store.loadById({ id, options: includeOptions });
      });

      it('calls the right API method', () => {
        expect(api.get).toHaveBeenCalledWith('widgets/42?include=customers');
      });

      it('adds the record to the list of all records', () => {
        const { records } = store;
        expect(records.length).toEqual(2);

        const storedRecord = records.find(r => r.id === id);
        expect(storedRecord.attributes.title).toEqual('New Title');
      });
    });

    describe('when the record is already present in the store', () => {
      const id = '42';
      const record = {
        type: 'widgets',
        id,
        attributes: {
          title: 'New Title',
        },
      };

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

        api.get.mockResolvedValue({
          data: {
            data: record,
          },
        });

        return store.loadById({ id, options: includeOptions });
      });

      it('calls the right API method', () => {
        expect(api.get).toHaveBeenCalledWith('widgets/42?include=customers');
      });

      it('adds the record to the list of all records', () => {
        const { records } = store;
        expect(records.length).toEqual(1);

        const storedRecord = records[0];
        expect(storedRecord.attributes.title).toEqual('New Title');
      });
    });
  });

  describe('byId', () => {
    it('retrieves the record when present', () => {
      const matchingRecord = {
        type: 'widgets',
        id: '2',
        attributes: {
          title: 'Matching',
        },
      };
      store.storeRecords([
        {
          type: 'widgets',
          id: '1',
        },
        matchingRecord,
      ]);

      const result = store.byId({ id: '2' });
      expect(result.attributes.title).toEqual('Matching');
    });

    it('returns undefined when not present', () => {
      store.storeRecords([
        {
          type: 'widgets',
          id: '1',
        },
      ]);

      const result = store.byId({ id: '2' });
      expect(result).toEqual(undefined);
    });
  });

  describe('loadWhere', () => {
    const filter = {
      status: 'draft',
    };

    let resolvedRecords;

    beforeEach(() => {
      store.storeRecords([
        {
          type: 'widgets',
          id: '1',
          attributes: {
            title: 'Non-Matching',
          },
        },
      ]);
      api.get.mockResolvedValue({
        data: {
          data: [
            {
              type: 'widget',
              id: '2',
              attributes: {
                title: 'Foo',
              },
            },
            {
              type: 'widget',
              id: '3',
              attributes: {
                title: 'Bar',
              },
            },
          ],
        },
      });

      return store.loadWhere({ filter, options: includeOptions })
        .then(response => {
          resolvedRecords = response;
        });
    });

    it('passes the filter on to the server', () => {
      expect(api.get).toHaveBeenCalledWith(
        'widgets?filter[status]=draft&include=customers',
      );
    });

    it('resolves to the results by filter', () => {
      expect(resolvedRecords.length).toEqual(2);

      const firstRecord = resolvedRecords[0];
      expect(firstRecord.id).toEqual('2');
      expect(firstRecord.attributes.title).toEqual('Foo');
    });

    it('stores the records in the list of all records', () => {
      expect(store.records.length).toEqual(3);
    });

    it('makes the results available via filter()', () => {
      const records = store.where({ filter });
      expect(records.length).toEqual(2);

      const firstRecord = records[0];
      expect(firstRecord.id).toEqual('2');
      expect(firstRecord.attributes.title).toEqual('Foo');
    });
  });

  describe('loadRelated', () => {
    const parent = {
      type: 'users',
      id: '42',
    };
    let resolvedRecords;

    beforeEach(() => {
      store.storeRecords([
        {
          type: 'widgets',
          id: '1',
          attributes: {
            title: 'Non-Matching',
          },
        },
      ]);
      api.get.mockResolvedValue({
        data: {
          data: [
            {
              type: 'widget',
              id: '2',
              attributes: {
                title: 'Foo',
              },
            },
            {
              type: 'widget',
              id: '3',
              attributes: {
                title: 'Bar',
              },
            },
          ],
        },
      });

      return store.loadRelated({ parent, options: includeOptions })
        .then(response => {
          resolvedRecords = response;
        });
    });

    it('passes the filter on to the server', () => {
      expect(api.get).toHaveBeenCalledWith(
        'users/42/widgets?include=customers',
      );
    });

    it('resolves to the returned results', () => {
      expect(resolvedRecords.length).toEqual(2);

      const firstRecord = resolvedRecords[0];
      expect(firstRecord.id).toEqual('2');
      expect(firstRecord.attributes.title).toEqual('Foo');
    });

    it('stores the records in the list of all records', () => {
      expect(store.records.length).toEqual(3);
    });

    it('makes the records accessible via related()', () => {
      const records = store.related({ parent });
      expect(records.length).toEqual(2);

      const firstRecord = records[0];
      expect(firstRecord.id).toEqual('2');
      expect(firstRecord.attributes.title).toEqual('Foo');
    });
  });

  describe('create', () => {
    const widget = {
      attributes: {
        title: 'Baz',
      },
    };

    beforeEach(() => {
      api.post.mockResolvedValue({
        data: {
          data: {
            type: 'widget',
            id: '27',
            attributes: widget.attributes,
          },
        },
      });
      return store.create(widget);
    });

    it('sends the request to the server', () => {
      const expectedBody = {
        data: {
          type: 'widgets',
          attributes: widget.attributes,
        },
      };
      expect(api.post).toHaveBeenCalledWith('widgets', expectedBody);
    });

    it('stores the record to the list', () => {
      const { records } = store;
      expect(records.length).toEqual(1);

      const firstRecord = records[0];
      expect(firstRecord.id).toEqual('27');
      expect(firstRecord.attributes.title).toEqual('Baz');
    });
  });
});
