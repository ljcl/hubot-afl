import formatMatch from './formatMatch';

import getRoundResult from './__mocks__/getRound.json';

describe('getId', () => {
  test('Test formatting for a scheduled match', () => {
    const singleRound = getRoundResult.items[0];
    formatMatch(singleRound, (err, res) => {
      console.log(res);
      // console.log(err);
      // console.log(message);
    });
  });
});
