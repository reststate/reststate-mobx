import Resource from '../src/Resource';
import { ResourceClient } from '@reststate/client';

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
      api.patch.mockResolvedValue({
        data: {
          data: expectedRecord,
        },
      });
      resource.save();
      expect(resource.loading).toEqual(true);
    });

    describe('success', () => {
      beforeEach(() => {
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

        api.patch.mockResolvedValue({
          data: {
            data: expectedRecord,
          },
        });

        resource.attributes.title = 'New Title';

        return resource.save();
      });

      it('sends the correct API request', () => {
        expect(api.patch).toHaveBeenCalledWith(
          'widgets/42',
          {
            data: {
              ...expectedRecord,
              relationships: undefined,
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
          detail: "title - can't be blank",
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

        api.patch.mockRejectedValue({ data: { errors } });
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
    beforeEach(() => {
      resource = new Resource({
        client,
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
    });

    describe('error', () => {
      beforeEach(() => {
        api.delete.mockRejectedValue();
      });

      it('sets error to true', () => {
        resource.delete().catch(() => {
          expect(resource.error).toEqual(true);
        });
      });
    });
  });
});
