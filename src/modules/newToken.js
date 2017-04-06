import moment from 'moment-timezone';
import 'isomorphic-fetch';

/**
  * @typedef newToken
  * @property {string} retrieved Date the token was received.
  * @property {string} refresh Date to ask for a new token.
  * @property {string} token The token retrieved from the AFL API.
*/

/**
  * Fetch a new token and set new timers for refreshing.
  * @return {Promise<newToken>} A promise to the token.
*/
function newToken() {
  return new Promise((resolve, reject) => {
    fetch(
      'http://api.afl.com.au/cfs/afl/WMCTok',
      { method: 'POST' }
    )
      .then(res => res.json())
      .then(json => resolve({
        retrieved: moment(),
        refresh: moment().add(6, 'hours'),
        token: json.token
      }))
      .catch(err => reject(err));
  })
}

module.exports = newToken;
