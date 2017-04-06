import printRound from './printRound';

import getRoundResult from './__mocks__/getRound.json';

describe('getId', () => {
  test('Returns an ID for the second match of round two, 2013', () => {
    return printRound(getRoundResult)
      .then((message) => {
        // TODO
        // console.log('todo', message)
      }).catch((e) => {
        // console.log('todo', e)
      });
  });
});
