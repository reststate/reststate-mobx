import { configure, runInAction } from 'mobx';
import { ResourceClient } from '@reststate/client';
import Resource from '../src/Resource';

configure({ enforceActions: 'always' });

describe('Resource', () => {
  let api;
  let client;
  let resource;

  beforeEach(() => {
    api = {
      patch: jest.fn(),
      delete: jest.fn(),
    };
    client = new ResourceClient({
      name: 'widgets',
      httpClient: api,
    });
    resource = new Resource({
      client,
      record: {
        type: 'widgets',
        id: '42',
        attributes: {
          title: 'Old Title',
        },
      },
    });
  });

  describe('save', () => {
    const expectedRecord = {
      type: 'widgets',
      id: '42',
      attributes: {
        title: 'New Title',
      },
    };

    it('sets the loading flag while loading', () => {
      api.patch.mockResolvedValue({
        data: {
          data: expectedRecord,
        },
      });
      resource.save();
      expect(resource.loading).toEqual(true);
    });

    it('resets the error flag', () => {
      api.patch
        .mockRejectedValueOnce()
        .mockResolvedValueOnce({
          data: {
            data: expectedRecord,
          },
        });

      return resource.save()
        .catch(() => resource.save())
        .then(() => {
          expect(resource.error).toEqual(false);
        });
    });

    describe('success', () => {
      beforeEach(() => {
        api.patch.mockResolvedValue({
          data: {
            data: expectedRecord,
          },
        });

        runInAction(() => {
          resource.attributes.title = 'New Title';
        });

        return resource.save();
      });

      it('sends the correct API request', () => {
        expect(api.patch).toHaveBeenCalledWith(
          'widgets/42',
          {
            data: {
              ...expectedRecord,
              relationships: {},
            },
          },
        );
      });

      it('sets loading to false when done', () => {
        expect(resource.loading).toEqual(false);
      });
    });

    describe('error', () => {
      const errors = [
        {
          title: "can't be blank",
          detail: "title - can't be blank (3)",
          code: '100',
          source: {
            pointer: '/data/attributes/title',
          },
          status: '422',
        },
      ];

      let resource;
      let response;

      beforeEach(() => {
        // TODO: resource needs to be re-assigned here or test fails; why?
        resource = new Resource({
          client,
          record: {
            type: 'widgets',
            id: '42',
            attributes: {
              title: 'Old Title',
            },
          },
        });

        api.patch.mockRejectedValue(errors);
        response = resource.save();
      });

      it('rejects with the response body', () => {
        expect(response).rejects.toEqual(errors);
      });

      it('sets the error flag on the resource', () => {
        response.catch(() => {
          expect(resource.error).toEqual(true);
        });
      });
    });
  });

  describe('delete', () => {
    let store;

    beforeEach(() => {
      store = {
        remove: jest.fn(),
      };
      resource = new Resource({
        client,
        store,
        record: {
          type: 'widgets',
          id: '42',
        },
      });
    });

    it('resets the error flag', () => {
      api.delete
        .mockRejectedValueOnce()
        .mockResolvedValueOnce();

      return resource.delete()
        .catch(() => resource.delete())
        .then(() => {
          expect(resource.error).toEqual(false);
        });
    });

    describe('success', () => {
      beforeEach(() => {
        api.delete.mockResolvedValue();
      });

      it('sets loading to true while loading', () => {
        resource.delete();
        expect(resource.loading).toEqual(true);
      });

      it('sends the correct API request', () => {
        resource.delete().then(() => {
          expect(api.delete).toHaveBeenCalledWith('widgets/42');
        });
      });

      it('sets loading to false when done loading', () => {
        resource.delete().then(() => {
          expect(resource.loading).toEqual(false);
        });
      });

      it('removes the record from the store', () => {
        resource.delete().then(() => {
          expect(store.remove).toHaveBeenCalledWith(resource);
        });
      });
    });

    describe('error', () => {
      beforeEach(() => {
        api.delete.mockRejectedValue();
      });

      it('sets loading to false when done loading', () => {
        resource.delete().catch(() => {
          expect(resource.loading).toEqual(false);
        });
      });

      it('sets error to true', () => {
        resource.delete().catch(() => {
          expect(resource.error).toEqual(true);
        });
      });
    });
  });
});
