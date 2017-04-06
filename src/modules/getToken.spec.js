import fetchMock from 'fetch-mock';
import moment from 'moment-timezone';
import getToken from './getToken';
import testValues from './__mocks__/testValues';

describe('getToken', () => {
  beforeAll(() => fetchMock.post('http://api.afl.com.au/cfs/afl/WMCTok', { token: testValues.token }));

  test('uses an existing token without needing to refresh', () => {
    global.token = {
      retrieved: moment('2017-03-27T04:17:35.163'),
      refresh: moment().add(1, 'hour'),
      token: testValues.token,
    };
    return getToken().then((res) => {
      const { retrieved, refresh, token, status } = res;
      expect(moment.isMoment(retrieved)).toBe(true);
      expect(moment.isMoment(refresh)).toBe(true);
      expect(token).toBe(testValues.token);
      expect(status).toBe('retained');
    });
  });

  test('gets a new token when refresh date matches parameters', () => {
    global.token = {
      retrieved: moment('2017-03-27T04:17:35.163'),
      refresh: moment('2017-03-28T04:17:35.163'),
    };
    return getToken().then((res) => {
      const { retrieved, refresh, token, status } = res;
      expect(moment.isMoment(retrieved)).toBe(true);
      expect(moment.isMoment(refresh)).toBe(true);
      expect(token).toBe(testValues.token);
      expect(status).toBe('refreshed');
    });
  });

  test('gets a new token when a retrieved date not found', () => {
    global.token = {
      retrieved: undefined,
      refresh: undefined,
      token: undefined,
    };
    return getToken().then((res) => {
      const { retrieved, refresh, token, status } = res;
      expect(moment.isMoment(retrieved)).toBe(true);
      expect(moment.isMoment(refresh)).toBe(true);
      expect(token).toBe(testValues.token);
      expect(status).toBe('fetched');
    });
  });

  afterAll(() => fetchMock.restore());
});
