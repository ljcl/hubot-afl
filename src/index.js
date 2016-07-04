'use strict'

var request = require('request')
var moment = require('moment-timezone')
var leftpad = require('left-pad')
var _ = require('lodash')

var tokenRetrieved
var tokenRefresh
var aflToken

/**
 * Determine if a token needs to be fetched or returned.
 * @param  {Function} cb
 */
function getToken (cb) {
  if (typeof tokenRetrieved !== 'undefined') {
    // There is a token, check date
    if (tokenRetrieved.isSameOrAfter(tokenRefresh, 'hour')) {
      console.info('[hubot-afl] token is old!', tokenRetrieved)
      // Get a new token
      newToken(function (err, token) {
        if (err) throw new Error(err)
        aflToken = token
        cb(false, aflToken)
      })
    } else {
      console.info('[hubot-afl] checking for token, didn\'t need one', tokenRetrieved)
      cb(false, aflToken)
    }
  } else {
    console.info('[hubot-afl] getting new token, couldn\'t find a previous one.')
    newToken(function (err, token) {
      if (err) throw new Error(err)
      aflToken = token
      cb(false, aflToken)
    })
  }
}

/**
 * Fetch a new token and set new timers for refreshing.
 * @param  {Function} cb
 */
function newToken (cb) {
  tokenRetrieved = moment()
  tokenRefresh = moment().add(6, 'hours')
  console.info('[hubot-afl] getting a new token', tokenRetrieved)
  console.info('[hubot-afl] setting refresh to ', tokenRefresh)
  request({method: 'POST', url: 'http://api.afl.com.au/cfs/afl/WMCTok'}, function (error, response, body) {
    if (error) throw new Error(error)
    var data = JSON.parse(body)
    cb(false, data.token)
  })
}

/**
 * Format a single match into an appropriate string.
 * @param  {object}   item Match information including scores, play status
 * @param  {Function} cb
 */
function formatMatch (item, cb) {
  var match
  var status = item.match.status
  if (status === 'CONCLUDED' || status === 'LIVE') {
    if (item.score) {
      var homeScore = parseInt(item.score.homeTeamScore.matchScore.totalScore, 10)
      var home = item.match.homeTeam.name + ' (' + homeScore + ')'
      var awayScore = parseInt(item.score.awayTeamScore.matchScore.totalScore, 10)
      var away = item.match.awayTeam.name + ' (' + awayScore + ')'

      match = '*' + home + '* - ' + away
      if (awayScore > homeScore) {
        // winners go first, bro
        match = '*' + away + '* - ' + home
      }
    } else {
      match = 'Can\'t fetch score for ' + item.match.homeTeam.name + ' vs ' + item.match.awayTeam.name + ' :('
    }
  } else {
    var formatStyle = 'D-M-YY h:ma z'
    var dateUtc = moment.tz(item.match.date, 'UTC')
    var dateLocal = dateUtc.clone().tz(item.venue.timeZone)
    var date = dateLocal.format(formatStyle)
    match = item.match.name + ' - ' + date + ' ' + item.venue.name
  }
  if (status === 'LIVE') {
    match = '*LIVE:* ' + match
  }
  if (status === 'SCHEDULED') {
    // Return date and venue
  }
  cb(false, match)
}

/**
 * Convert a provided round number and year into an AFL code
 * @param  {integer}   match AFL match index
 * @param  {integer}   round AFL round index
 * @param  {integer}   year  Optional year, will use current if not provided
 * @param  {function} cb
 */
function getId (round, match = false, year, cb) {
  var result = {}
  result.number = round
  var prefix = 'R'
  if (typeof match === 'number' && (match % 1) === 0) {
    prefix = 'M'
    match = leftpad(match, 2, 0)
  } else {
    match = ''
  }
  // If it's not a year or a year in the future, set it to the current year.
  year = (!moment(year, 'YYYY', true).isValid() ? moment().year() : year)
  year = (moment(year, 'YYYY', true).isAfter(moment()) ? moment().year() : year)
  result.type = (moment(year, 'YYYY', true).isAfter(moment()) ? moment().year() : year)
  result.year = year
  result.type = (prefix === 'M' ? 'Match' : 'Round')
  result.id = 'CD_' + prefix + year + '014' + leftpad(round, 2, 0) + match
  // e.g: CD_R201501401
  cb(result)
}

/**
 * Fetch a round from the AFL api
 * @param  {number}   round The round number to fetch, if false the latest will be fetched.
 * @param  {Function} cb
 */
function getRound (round, cb) {
  // Make sure we have a token
  getToken((err) => {
    if (err) throw new Error(err)
    // Do we want to return a specific match or the latest one?
    // If an `id` is supplied, let's return a specific round.
    var requestUrl = 'http://api.afl.com.au/cfs/afl/matchItems'
    requestUrl += (round ? '/round/' + round : '')
    var requestOptions = {
      url: requestUrl,
      headers: {'x-media-mis-token': aflToken}
    }
    request(requestOptions, function (error, response, body) {
      if (error) throw new Error(error)
      if (response.statusCode === 200) {
        var currentRound = {}
        var json = JSON.parse(body)
        currentRound.id = json.roundId
        currentRound.matches = json.items.length
        currentRound.number = parseInt(json.roundId.slice(-2), 10)
        currentRound.items = json.items
        cb(false, response, currentRound)
      } else {
        cb({statusCode: response.statusCode, statusMessage: response.statusMessage}, response)
      }
    })
  })
}

/**
 * Builds up a message string to send.
 * @param  {object}   round A round object which needs to contain a round number, year, and array of matches.
 * @param  {Function} cb
 */
function printRound (round, cb) {
  var count = 0
  var total = round.items.length
  var message = 'AFL round ' + round.number + ' (' + round.year + ')\n'
  _.forEach(round.items, function (match) {
    formatMatch(match, function (err, result) {
      if (err) throw err
      message += result
      count++
    })
    if (count === total) {
      cb(false, message)
    } else {
      message += '\n'
    }
  })
}

module.exports = (robot) => {
  robot.hear(/afl$/i, (res) => {
    var message = `I can help you out with afl scores:
"show me the current afl round" - Get fixtures/ scores of the latest round.
"show me afl round 27 2012" - Show fixtures for a specific round (year optional)`
    res.send(message)
  })
  robot.hear(/(show me the)?\s?(current)\s?(afl)\s?\s?(round)?/i, (res) => {
    getRound(false, (err, resp, round) => {
      round.year = moment().format('YYYY')
      if (err) { robot.logger.error(err) }
      if (resp.statusCode === 200) {
        printRound(round, (error, message) => {
          if (error) { robot.logger.error(error) }
          res.send(message)
        })
      } else if (resp.statusCode === 404) {
        robot.logger.warning(res)
        res.send('You probably did something wrong (' + resp.statusCode + ' ' + resp.statusMessage + ')')
      } else {
        robot.logger.warning(res)
        res.send('We probably did something wrong (' + resp.statusCode + ')')
      }
    })
  })
  robot.hear(/(show me)?\s?(afl round)\s([0-9]{1,2})\s?([0-9]{4})?/i, (res) => {
    var roundNumber = res.match[3].replace(/\?/g, '')
    var roundYear = (typeof res.match[4] !== 'undefined' ? res.match[4] : moment().format('YYYY'))
    getId(roundNumber, false, roundYear, function (round) {
      getRound(round.id, (err, resp, round) => {
        if (err) { robot.logger.error(err) }
        if (resp.statusCode === 200) {
          round.year = roundYear
          printRound(round, (error, message) => {
            if (error) { robot.logger.error(error) }
            res.send(message)
          })
        } else if (resp.statusCode === 404) {
          res.send('You probably did something wrong (' + resp.statusCode + ' ' + resp.statusMessage + ')')
        } else {
          res.send('We probably did something wrong (' + resp.statusCode + ')')
          console.warn(round)
        }
      })
    })
  })
  // Check our afl token and it's age (debug)
  robot.hear(/(afl token)/i, (res) => {
    getToken(function (err, token) {
      if (err) throw new Error(err)
      var debugString = 'AFL API Token ' + aflToken + ': \n'
      debugString += 'Retrieved: ' + tokenRetrieved.format('dddd, MMMM Do YYYY, h:mm:ss a') + '\n'
      debugString += 'Refreshes: ' + tokenRefresh.format('dddd, MMMM Do YYYY, h:mm:ss a')
      res.send(debugString)
    })
  })
}
