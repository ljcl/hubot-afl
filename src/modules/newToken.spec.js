import fetchMock from 'fetch-mock';
import moment from 'moment-timezone';
import newToken from './newToken';
import testValues from './__mocks__/testValues';

describe('newToken', () => {
  beforeAll(() => fetchMock.post('http://api.afl.com.au/cfs/afl/WMCTok', { token: testValues.token }));

  test('fetches a token from the AFL API, and has retrieve and refresh dates', () =>
    newToken().then((res) => {
      const { retrieved, refresh, token } = res;
      expect(moment.isMoment(retrieved)).toBe(true);
      expect(moment.isMoment(refresh)).toBe(true);
      expect(token).toBe(testValues.token);
    }));

  afterAll(() => fetchMock.restore());
});
