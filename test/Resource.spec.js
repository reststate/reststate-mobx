import '@babel/polyfill';
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
        expect(api.patch).toHaveBeenCalledWith('widgets/42', {
          data: {
            ...expectedRecord,
            relationships: {},
          },
        });
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
    });
  });

  describe('update', () => {
    const expectedRecord = {
      type: 'widgets',
      id: '42',
      attributes: {
        title: 'New Title',
      },
    };

    describe('success', () => {
      beforeEach(() => {
        api.patch.mockResolvedValue({
          data: {
            data: expectedRecord,
          },
        });

        return resource.update({
          attributes: {
            title: 'New Title',
          },
        });
      });

      it('sends the correct API request', () => {
        expect(api.patch).toHaveBeenCalledWith('widgets/42', {
          data: {
            ...expectedRecord,
          },
        });
      });

      it('updates the attributes on the record', () => {
        expect(resource.attributes.title).toEqual('New Title');
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
        response = resource.update({
          attributes: {
            title: '',
          },
        });
      });

      it('rejects with the response body', () => {
        expect(response).rejects.toEqual(errors);
      });

      it('does not update the attributes on the record', () => {
        return response.catch(() => {
          expect(resource.attributes.title).toEqual('Old Title');
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

    describe('success', () => {
      beforeEach(() => {
        api.delete.mockResolvedValue();
      });

      it('sends the correct API request', () => {
        return resource.delete().then(() => {
          expect(api.delete).toHaveBeenCalledWith('widgets/42');
        });
      });

      it('removes the record from the store', () => {
        return resource.delete().then(() => {
          expect(store.remove).toHaveBeenCalledWith(resource);
        });
      });
    });

    describe('error', () => {
      const error = { dummy: 'error' };

      beforeEach(() => {
        api.delete.mockRejectedValue(error);
      });

      it('sets loading to false when done loading', () => {
        const response = resource.delete();
        expect(response).rejects.toEqual(error);
      });
    });
  });
});
