import 'isomorphic-fetch';

import getToken from './getToken';

/**
 * @typedef getRound
 * @property {string} id The AFL API canonical round id (e.g 'CD_R201701403')
 * @property {integer} games Amount of games in this round (e.g 7)
 * @property {string} round Name of this round (e.g 'Round 14')
 * @property {string} year Year this round takes place (e.g 2017)
 * @property {string[]} items Array of games taking place this round
*/

/**
 * Fetch a round from the AFL api
 * @param  {number} [round=false] The round number to fetch, if false the latest will be fetched.
 * @return {Promise<getRound>} A promise to the round data.
*/
/**
 */
function getRound(round) {
  return new Promise((resolve, reject) => {
    getToken()
      .then((res) => {
        let roundid = round;

        if (typeof roundid === 'object') roundid = roundid.id;
        let requestUrl = 'http://api.afl.com.au/cfs/afl/matchItems';
        requestUrl += roundid ? `/round/${roundid}` : '';

        const requestOptions = {
          headers: { 'x-media-mis-token': res.token },
        };
        fetch(requestUrl, requestOptions)
          .then(res => res.json())
          .then((json) => {
            if (json.code) { reject(json); } else {
              resolve({
                id: json.roundId,
                games: json.items.length,
                round: json.items[0].round.name,
                year: json.items[0].round.year,
                items: json.items,
              });
            }
          })
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
}

export default getRound;
