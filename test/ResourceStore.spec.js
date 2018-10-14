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
    describe('success', () => {
      const records = [
        {
          type: 'widgets',
          id: '1',
        },
      ];

      let promise;
      let resolvedRecords;

      beforeEach(() => {
        api.get.mockResolvedValue({
          data: {
            data: records,
          },
        });
      });

      it('sets loading to true while loading', () => {
        const promise = store.loadAll();
        expect(store.loading).toEqual(true);
      });

      describe('when passing no options', () => {
        beforeEach(() => {
          return store.loadAll()
            .then(records => resolvedRecords = records);
        });

        it('makes the correct API call', () => {
          expect(api.get).toHaveBeenCalledWith('widgets?');
        });

        it('sets loading to false when done', () => {
          expect(store.loading).toEqual(false);
        });

        it('resolves to the records', () => {
          expect(resolvedRecords.length).toEqual(1);
          const record = resolvedRecords[0];
          expect(record.id).toEqual('1');
        });

        it('makes records available via all()', () => {
          const records = store.all();

          expect(records.length).toEqual(1);
          const record = records[0];
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

    describe('error', () => {
      beforeEach(() => {
        api.get.mockRejectedValue();
        return store.loadAll();
      });

      it('sets loading to false when done', () => {
        expect(store.loading).toEqual(false);
      });

      it('sets the error flag', () => {
        expect(store.error).toEqual(true);
      });
    });
  });

  describe('loadById', () => {
    describe('success', () => {
      it('sets loading to true while loading', () => {
        const id = '42';
        api.get.mockResolvedValue();
        const promise = store.loadById({ id, options: includeOptions });
        expect(store.loading).toEqual(true);
      });

      describe('when the record is not yet present in the store', () => {
        const id = '42';
        const record = {
          type: 'widgets',
          id,
          attributes: {
            title: 'New Title',
          },
        };

        let resolvedRecord;

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

          return store.loadById({ id, options: includeOptions })
            .then(record => resolvedRecord = record);
        });

        it('calls the right API method', () => {
          expect(api.get).toHaveBeenCalledWith('widgets/42?include=customers');
        });

        it('sets loading to false', () => {
          expect(store.loading).toEqual(false);
        });

        it('resolves to the correct record', () => {
          expect(resolvedRecord.attributes.title).toEqual('New Title');
        });

        it('makes the record available via byId()', () => {
          const storedRecord = store.byId({ id });
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

        let resolvedRecord;

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

          return store.loadById({ id, options: includeOptions })
            .then(record => resolvedRecord = record);
        });

        it('calls the right API method', () => {
          expect(api.get).toHaveBeenCalledWith('widgets/42?include=customers');
        });

        it('resolves to the right record', () => {
          expect(resolvedRecord.attributes.title).toEqual('New Title');
        });

        it('makes the record available via byId()', () => {
          const storedRecord = store.byId({ id });
          expect(storedRecord.attributes.title).toEqual('New Title');
        });
      });
    });

    describe('error', () => {
      beforeEach(() => {
        api.get.mockRejectedValue();
        return store.loadById({ id: '42' });
      });

      it('sets the error flag', () => {
        expect(store.error).toEqual(true);
      });
    });
  });

  describe('loadWhere', () => {
    const filter = {
      status: 'draft',
    };

    describe('success', () => {
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

      it('makes the results available via where()', () => {
        const records = store.where({ filter });
        expect(records.length).toEqual(2);

        const firstRecord = records[0];
        expect(firstRecord.id).toEqual('2');
        expect(firstRecord.attributes.title).toEqual('Foo');
      });
    });

    describe('error', () => {
      beforeEach(() => {
        api.get.mockRejectedValue();
        return store.loadWhere({ filter });
      });

      it('sets the error flag', () => {
        expect(store.error).toEqual(true);
      });
    });
  });

  describe('loadRelated', () => {
    const parent = {
      type: 'users',
      id: '42',
    };

    describe('success', () => {
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

      it('makes the records accessible via related()', () => {
        const records = store.related({ parent });
        expect(records.length).toEqual(2);

        const firstRecord = records[0];
        expect(firstRecord.id).toEqual('2');
        expect(firstRecord.attributes.title).toEqual('Foo');
      });
    });

    describe('error', () => {
      beforeEach(() => {
        api.get.mockRejectedValue();
        return store.loadRelated({ parent });
      });

      it('sets the error flag', () => {
        expect(store.error).toEqual(true);
      });
    });
  });

  describe('create', () => {
    const widget = {
      attributes: {
        title: 'Baz',
      },
    };

    describe('success', () => {
      let resolvedRecord;

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
        return store.create(widget)
          .then(record => resolvedRecord = record);
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

      it('resolves to the returned record', () => {
        expect(resolvedRecord.id).toEqual('27');
        expect(resolvedRecord.attributes.title).toEqual('Baz');
      });

      it('makes the record available via byId()', () => {
        const foundRecord = store.byId({ id: '27' });
        expect(foundRecord.attributes.title).toEqual('Baz');
      });
    });

    describe('error', () => {
      const errors = [
        {
          title: "can't be blank",
          detail: "title - can't be blank",
          code: '100',
          source: {
            pointer: '/data/attributes/title',
          },
          status: '422',
        },
      ];

      let response;

      beforeEach(() => {
        api.post.mockRejectedValue({ data: { errors } });
        response = store.create(widget);
      });

      it('rejects with the response body', () => {
        expect(response).rejects.toEqual(errors);
      });

      it('sets the error flag', () => {
        response.catch(() => {
          expect(store.error).toEqual(true);
        });
      });
    });
  });
});
