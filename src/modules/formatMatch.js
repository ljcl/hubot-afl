import moment from 'moment-timezone';

/**
 * Format a single match into an appropriate string.
 * @param  {object}   item Match information including scores, play status
 * @param  {Function} cb
 */
function formatMatch(item, cb) {
  let match;
  const status = item.match.status;
  if (status === 'CONCLUDED' || status === 'LIVE') {
    if (item.score) {
      const homeScore = parseInt(item.score.homeTeamScore.matchScore.totalScore, 10);
      const home = `${item.match.homeTeam.name} (${homeScore})`;
      const awayScore = parseInt(item.score.awayTeamScore.matchScore.totalScore, 10);
      const away = `${item.match.awayTeam.name} (${awayScore})`;

      match = `*${home}* - ${away}`;
      if (awayScore > homeScore) {
        // winners go first, bro
        match = `*${away}* - ${home}`;
      }
    } else {
      match = `Can't fetch score for ${item.match.homeTeam.name} vs ${item.match.awayTeam.name} :(`;
    }
  } else {
    const formatStyle = 'D-M-YY h:ma z';
    const dateUtc = moment.tz(item.match.date, 'UTC');
    const dateLocal = dateUtc.clone().tz(item.venue.timeZone);
    let date = dateLocal.format(formatStyle);
    const measureAgainst = moment().add(7, 'days');
    if (dateLocal.isSame(moment(), 'd')) {
      date = `${dateLocal.format('h:ma z')} (${dateLocal.fromNow()})`;
    } else if (dateLocal.isBefore(measureAgainst)) {
      date = dateLocal.format('dddd Do h:ma z');
    }
    match = `${item.match.name} - ${date} ${item.venue.name}`;
  }
  if (status === 'LIVE') {
    match = `*LIVE:* ${match}`;
  }
  if (status === 'SCHEDULED') {
    // Return date and venue
  }
  cb(false, match);
}

export default formatMatch;
