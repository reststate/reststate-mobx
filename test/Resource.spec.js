import Resource from '../src/Resource';
import { ResourceClient } from 'jsonapi-client';

describe('Resource', () => {
  let api;
  let client;

  beforeEach(() => {
    api = {
      patch: jest.fn(),
    };
    client = new ResourceClient({
      name: 'widgets',
      httpClient: api,
    });
  });

  describe('save', () => {
    it('sends the correct API request', () => {
      const resource = new Resource({
        client,
        record: {
          type: 'widgets',
          id: '42',
          attributes: {
            title: 'Old Title',
          },
        },
      });

      const expectedRecord = {
        type: 'widgets',
        id: '42',
        attributes: {
          title: 'New Title',
        },
      };

      api.patch.mockResolvedValue({
        data: {
          data: expectedRecord,
        },
      });

      resource.attributes.title = 'New Title';

      return resource.save()
        .then(() => {
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
  });
});
