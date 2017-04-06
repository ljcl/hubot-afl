import formatMatch from './formatMatch';

/**
 * Builds up a message string to send.
 * @param  {object}   round A round object which needs to contain a round number, year,
 *                          and array of matches.
 * @param  {Function} cb
 */
function printRound(round) {
  return new Promise((resolve, reject) => {
    let count = 0;
    const total = round.items.length;
    let message = `AFL ${round.round} (${round.year})\n`;
    round.items.forEach((match) => {
      formatMatch(match, (err, result) => {
        if (err) reject(err);
        message += result;
        count += 1;
      });
      if (count === total) {
        resolve(message);
      } else {
        message += '\n';
      }
    });
  });
}

export default printRound;
