import moment from 'moment-timezone';
import newToken from './newToken';

// Start off with blank tokens
global.token = {
  retrieved: undefined,
  refresh: undefined,
  token: undefined,
};

/**
 * @typedef getToken
 * @property {string} retrieved Date the token was received.
 * @property {string} refresh Date to ask for a new token.
 * @property {string} token The token retrieved from the AFL API.
 * @property {string} status Weather the token was refreshed, retained or
 *                           fetched for the first time.
*/

/**
 * Determine if a token needs to be fetched or returned.
 * @return {Promise<getToken>} A promise to the token.
*/
function getToken() {
  return new Promise((resolve, reject) => {
    if (typeof global.token.retrieved !== 'undefined') {
      const timeNow = moment();
      // There is a token, check date
      if (timeNow.isAfter(global.token.refresh, 'hour')) {
        // Get a new token
        newToken()
          .then((res) => {
            Object.assign(global.token, res, {
              status: 'refreshed',
            });
            resolve(global.token);
          })
          .catch((e) => {
            reject(e);
          });
      } else {
        Object.assign(global.token, {
          status: 'retained',
        });
        resolve(global.token);
      }
    } else {
      newToken()
        .then((res) => {
          Object.assign(global.token, res, {
            status: 'fetched',
          });
          resolve(global.token);
        })
        .catch((e) => {
          reject(e);
        });
    }
  });
}

module.exports = getToken;
