import moment from 'moment-timezone';

import getId from './modules/getId';
import getRound from './modules/getRound';
import getToken from './modules/getToken';
import printRound from './modules/printRound';

module.exports = (robot) => {
  robot.respond(/afl$/i, (res) => {
    const message = `I can help you out with afl scores:
"afl fixture" - Get fixtures/ scores of the latest round.
"afl round 27 2012" - Show fixtures for a specific round (year optional)`;
    res.send(message);
  });
  const regexRound = /(afl scores|afl fixture|afl round)\s?([0-9]{1,2})?\s?([0-9]{4})?/i;
  robot.respond(regexRound, (res) => {
    const roundNumber = res.match[2] || false;
    const roundYear = typeof res.match[3] !== 'undefined' ? res.match[3] : moment().format('YYYY');
    getId(roundNumber, false, roundYear).then((result) => {
      getRound(result)
        .then((resp) => {
          printRound(resp)
            .then((message) => {
              res.send(message);
            })
            .catch(error => robot.logger.error(error));
        })
        .catch(e => robot.logger.error(e));
    });
  });
  // Check our afl token and it's age (debug)
  robot.respond(/(afl token)/i, (res) => {
    getToken()
      .then((resp) => {
        const { retrieved, refresh, token, status } = resp;
        const debugString = `AFL API Token ${token}:
      Retrieved: ${retrieved.format('dddd, MMMM Do YYYY, h:mm:ss a')}
      Refreshes at: ${refresh.format('dddd, MMMM Do YYYY, h:mm:ss a')}
      Last status: ${status}`;
        res.send(debugString);
      })
      .catch(e => robot.logger.error(e));
  });
};
