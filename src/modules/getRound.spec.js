import fetchMock from 'fetch-mock';

import getRound from './getRound';
import matchItems from './__mocks__/matchItems.json';
import matchItemsError from './__mocks__/matchItemsError.json';
import testValues from './__mocks__/testValues';

describe('getRound', () => {
  beforeAll(() => {
    fetchMock.post('http://api.afl.com.au/cfs/afl/WMCTok', { token: testValues.token });
    fetchMock.get('*', matchItems);
  });

  test('gets the "current" round without specifying a specific id', () => getRound(false).then((res) => {
    const { id, games, round, items } = res;
    expect(id).toBe('CD_R201701403');
    expect(games).toBe(9);
    expect(items.length).toBe(9);
    expect(round).toBe('Round 3');
  }));

  test('gets round "CD_R201701403"', () => getRound({ id: 'CD_R201701403' }).then((res) => {
    const { id, games, round, year, items } = res;
    expect(id).toBe('CD_R201701403');
    expect(games).toBe(9);
    expect(year).toBe('2017');
    expect(items.length).toBe(9);
    expect(round).toBe('Round 3');
  }));

  test('fails when fetching an invalid round', () => {
    fetchMock.restore();
    fetchMock.post('http://api.afl.com.au/cfs/afl/WMCTok', { token: testValues.token });
    fetchMock.get('*', matchItemsError);
    return getRound('CD_R2017014013').catch((error) => {
      const { code, techMessage } = error;
      expect(code).toBe('CFSAPI001');
      expect(techMessage).toBe('Invalid round id CD_R2017014013');
    });
  });

  afterAll(() => {
    fetchMock.restore();
  });
});
