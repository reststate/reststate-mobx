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

      api.delete.mockResolvedValue();

      return resource.delete();
    });

    it('sends the correct API request', () => {
      expect(api.delete).toHaveBeenCalledWith('widgets/42');
    });
  });
});
