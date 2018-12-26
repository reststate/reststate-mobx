import { configure } from 'mobx';
import ResourceStore from '../src/ResourceStore';

configure({ enforceActions: 'always' });

describe('ResourceStore', () => {
  const fieldOptions = {
    'fields[widgets]': 'title',
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

    it('resets the error flag', () => {
      api.get
        .mockRejectedValueOnce()
        .mockResolvedValueOnce({
          data: {
            data: records,
          },
        });

      return store.loadAll()
        .catch(() => store.loadAll())
        .then(() => {
          expect(store.error).toEqual(false);
        });
    });

    describe('success', () => {
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
          return store.loadAll({ options: fieldOptions })
            .then(() => {
              expect(api.get)
                .toHaveBeenCalledWith('widgets?fields[widgets]=title');
            });
        });
      });
    });

    describe('error', () => {
      const error = { dummy: 'error' };

      let response;

      beforeEach(() => {
        api.get.mockRejectedValue(error);
        response = store.loadAll();
      });

      it('rejects with the error', () => {
        expect(response).rejects.toEqual(error);
      });

      it('sets loading to false when done', () => {
        return response.catch(() => {
          expect(store.loading).toEqual(false);
        });
      });

      it('sets the error flag', () => {
        return response.catch(() => {
          expect(store.error).toEqual(true);
        });
      });
    });
  });

  describe('loadById', () => {
    const id = '42';
    const record = {
      type: 'widgets',
      id,
      attributes: {
        title: 'New Title',
      },
    };

    it('resets the error flag', () => {
      api.get
        .mockRejectedValueOnce()
        .mockResolvedValueOnce({
          data: {
            data: record,
          },
        });

      return store.loadById({ id })
        .catch(() => store.loadById({ id }))
        .then(() => {
          expect(store.error).toEqual(false);
        });
    });

    describe('success', () => {
      it('sets loading to true while loading', () => {
        api.get.mockResolvedValue({
          data: {
            data: record,
          },
        });
        const promise = store.loadById({ id, options: fieldOptions });
        expect(store.loading).toEqual(true);
      });

      describe('when the record is not yet present in the store', () => {
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

          return store.loadById({ id, options: fieldOptions })
            .then(record => resolvedRecord = record);
        });

        it('calls the right API method', () => {
          expect(api.get)
            .toHaveBeenCalledWith('widgets/42?fields[widgets]=title');
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

          return store.loadById({ id, options: fieldOptions })
            .then(record => resolvedRecord = record);
        });

        it('calls the right API method', () => {
          expect(api.get)
            .toHaveBeenCalledWith('widgets/42?fields[widgets]=title');
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
      const error = { dummy: 'error' };

      let response;

      beforeEach(() => {
        api.get.mockRejectedValue(error);
        response = store.loadById({ id: '42' });
      });

      it('rejects with the error', () => {
        expect(response).rejects.toEqual(error);
      });

      it('sets loading to false when rejected', () => {
        return response.catch(() => {
          expect(store.loading).toEqual(false);
        });
      });

      it('sets the error flag', () => {
        return response.catch(() => {
          expect(store.error).toEqual(true);
        });
      });
    });
  });

  describe('loadWhere', () => {
    const filter = {
      status: 'draft',
    };

    const records = [
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
    ];

    it('sets loading to true while loading', () => {
      api.get.mockResolvedValue({
        data: {
          data: records,
        },
      });
      store.loadWhere({ filter });
      expect(store.loading).toEqual(true);
    });

    it('resets the error flag', () => {
      api.get
        .mockRejectedValueOnce()
        .mockResolvedValueOnce({
          data: {
            data: records,
          },
        });

      return store.loadWhere({ filter })
        .catch(() => store.loadWhere({ filter }))
        .then(() => {
          expect(store.error).toEqual(false);
        });
    });

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
            data: records,
          },
        });

        return store.loadWhere({ filter, options: fieldOptions })
          .then(response => {
            resolvedRecords = response;
          });
      });

      it('passes the filter on to the server', () => {
        expect(api.get).toHaveBeenCalledWith(
          'widgets?filter[status]=draft&fields[widgets]=title',
        );
      });

      it('sets loading to false', () => {
        expect(store.loading).toEqual(false);
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

      it('overwrites previous results', async () => {
        let records = store.where({ filter });
        expect(records.length).toEqual(2);

        api.get.mockResolvedValue({
          data: {
            data: [
              {
                type: 'widgets',
                id: '4',
                attributes: {
                  title: 'Updated Title',
                },
              },
            ],
          },
        });

        await store.loadWhere({ filter });
        records = store.where({ filter });
        expect(records.length).toEqual(1);
        expect(records[0].id).toEqual('4');
      });

      it('reflects changes in the results returned by where()', async () => {
        let records = store.where({ filter });
        expect(records[0].attributes.title).toEqual('Foo');

        api.get.mockResolvedValue({
          data: {
            data: {
              type: 'widgets',
              id: records[0].id,
              attributes: {
                title: 'Updated Title',
              },
            },
          },
        });

        await store.loadById({ id: records[0].id });

        records = store.where({ filter });
        expect(records[0].attributes.title).toEqual('Updated Title');
      });
    });

    describe('error', () => {
      const error = { dummy: 'error' };

      let response;

      beforeEach(() => {
        api.get.mockRejectedValue(error);
        response = store.loadWhere({ filter });
      });

      it('rejects with the error', () => {
        expect(response).rejects.toEqual(error);
      });

      it('sets loading to false when rejected', () => {
        return response.catch(() => {
          expect(store.loading).toEqual(false);
        });
      });

      it('sets the error flag', () => {
        return response.catch(() => {
          expect(store.error).toEqual(true);
        });
      });
    });
  });

  describe('loadRelated', () => {
    const parent = {
      type: 'users',
      id: '42',
    };

    const records = [
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
    ];

    it('sets loading to true while loading', () => {
      api.get.mockResolvedValue({
        data: {
          data: records,
        },
      });
      store.loadRelated({ parent });
      expect(store.loading).toEqual(true);
    });

    it('resets the error flag', () => {
      api.get
        .mockRejectedValueOnce()
        .mockResolvedValueOnce({
          data: {
            data: records,
          },
        });

      return store.loadRelated({ parent })
        .catch(() => store.loadRelated({ parent }))
        .then(() => {
          expect(store.error).toEqual(false);
        });
    });

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
            data: records,
          },
        });

        return store.loadRelated({ parent, options: fieldOptions })
          .then(response => {
            resolvedRecords = response;
          });
      });

      it('passes the filter on to the server', () => {
        expect(api.get).toHaveBeenCalledWith(
          'users/42/widgets?fields[widgets]=title',
        );
      });

      it('sets loading to false when resolved', () => {
        expect(store.loading).toEqual(false);
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
      let response;

      beforeEach(() => {
        api.get.mockRejectedValue();
        response = store.loadRelated({ parent });
      });

      it('sets loading to false when rejected', () => {
        return response.catch(() => {
          expect(store.loading).toEqual(false);
        });
      });

      it('sets the error flag', () => {
        return response.catch(() => {
          expect(store.error).toEqual(true);
        });
      });
    });
  });

  describe('create', () => {
    const widget = {
      attributes: {
        title: 'Baz',
      },
    };
    const resultWidget = {
      type: 'widget',
      id: '27',
      attributes: widget.attributes,
    };

    describe('success', () => {
      let resolvedRecord;

      beforeEach(() => {
        api.post.mockResolvedValue({
          data: {
            data: resultWidget,
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
          detail: "title - can't be blank (1)",
          code: '100',
          source: {
            pointer: '/data/attributes/title',
          },
          status: '422',
        },
      ];

      let response;

      beforeEach(() => {
        api.post.mockRejectedValue(errors);
        response = store.create(widget);
      });

      it('rejects with the response body', () => {
        expect(response).rejects.toEqual(errors);
      });
    });
  });

  describe('remove', () => {
    it('removes the post from the store', () => {
      const matchingPost = {
        type: 'widgets',
        id: '2',
        attributes: {
          title: 'Matching',
        },
      };

      const otherPost = {
        type: 'widgets',
        id: '1',
        attributes: {
          title: 'Non-Matching',
        },
      };

      store.storeRecords([otherPost, matchingPost]);
      store.remove(matchingPost);

      const records = store.all();
      expect(records.length).toEqual(1);
      expect(records[0].attributes.title).toEqual(otherPost.attributes.title);
    });
  });
});
