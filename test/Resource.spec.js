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
