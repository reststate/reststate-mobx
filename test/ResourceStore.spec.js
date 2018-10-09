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
});
