'use strict'

var request = require('request')
var moment = require('moment-timezone')
var leftpad = require('left-pad')
var _ = require('lodash')

var tokenRetrieved
var tokenRefresh
var aflToken

function getToken (cb) {
  if (typeof tokenRetrieved !== 'undefined') {
    // There is a token, check date
    if (tokenRetrieved.isSameOrAfter(tokenRefresh, 'day')) {
      // Get a new token
      newToken(function (err, token) {
        if (err) throw new Error(err)
        aflToken = token
        cb(false, aflToken)
      })
    } else {
      cb(false, aflToken)
    }
  } else {
    newToken(function (err, token) {
      if (err) throw new Error(err)
      aflToken = token
      cb(false, aflToken)
    })
  }
}

function newToken (cb) {
  tokenRetrieved = moment()
  tokenRefresh = moment().add(1, 'days')
  request({method: 'POST', url: 'http://api.afl.com.au/cfs/afl/WMCTok'}, function (error, response, body) {
    if (error) throw new Error(error)
    var data = JSON.parse(body)
    cb(false, data.token)
  })
}

function formatMatch (item, cb) {
  var match
  var status = item.match.status
  if (status === 'CONCLUDED' || status === 'LIVE') {
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
    var formatStyle = 'D-M-YY h:ma z'
    var dateUtc = moment.tz(item.match.date, 'UTC')
    var dateLocal = dateUtc.clone().tz(item.venue.timeZone)
    var date = dateLocal.format(formatStyle)
    match = item.match.name + ' - ' + date + ' ' + item.venue.name
  }
  if (status === 'LIVE') {
    // Return a stream URL
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
function getId (match, round, year, cb) {
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
  // TODO: Allow further in the future if we can assume the schedule is released.
  year = (!moment(year, 'YYYY', true).isValid() ? moment().year() : year)
  year = (moment(year, 'YYYY', true).isAfter(moment()) ? moment().year() : year)
  result.year = year
  result.id = 'CD_' + prefix + year + '014' + leftpad(round, 2, 0) + match
  // e.g: CD_R201501401
  cb(result)
}

module.exports = (robot) => {
  robot.hear(/(show me)?\s?(afl round)\s([0-9]{1,2})\s?([0-9]{4})?/i, (res) => {
    var round = res.match[3].replace(/\?/g, '')
    var year = (typeof res.match[4] !== 'undefined' ? res.match[4] : '')
    getId(false, round, year, function (round) {
      getToken(function (err, token) {
        if (err) throw new Error(err)
        var optionsRound = {
          url: 'http://api.afl.com.au/cfs/afl/matchItems/round/' + round.id,
          headers: {'x-media-mis-token': aflToken}
        }
        request(optionsRound, function (error, response, body) {
          if (error) throw new Error(error)
          if (response.statusCode === 200) {
            var json = JSON.parse(body)
            var count = 0
            var total = json.items.length
            var message = 'Here\'s round ' + round.number + ' (' + round.year + ')\n'
            _.forEach(json.items, function (match) {
              formatMatch(match, function (err, result) {
                if (err) throw err
                message += result
                count++
              })
              if (count === total) {
                res.send(message)
              } else {
                message += '\n'
              }
            })
          } else if (response.statusCode === 404) {
            res.send('You probably did something wrong (' + response.statusCode + ' ' + response.statusMessage + ')')
          } else {
            res.send('We probably did something wrong (' + response.statusCode + ')')
            console.warn(body)
          }
        })
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
