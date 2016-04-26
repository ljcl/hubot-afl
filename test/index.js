'use strict'

var Robot = require('hubot/src/robot')
var TextMessage = require('hubot/src/message').TextMessage
var expect = require('chai').expect

var moment = require('moment-timezone')

describe('hubot', function () {
  var robot
  var user

  beforeEach(() => {
    // create new robot, without http, using the mock adapter
    robot = new Robot(null, 'mock-adapter', false, 'Hubot')

    // configure user
    user = robot.brain.userForId('1', {
      name: 'mocha',
      room: '#mocha'
    })

    robot.adapter.on('connected', () => {
      // load the module under test and configure it for the
      // robot.  This is in place of external-scripts
      require('../src/index')(robot)
    })

    robot.run()
  })

  afterEach(() => {
    robot.shutdown()
  })

  it('Return information about an AFL season from the current year', (done) => {
    robot.adapter.on('send', (envelope, strings) => {
      expect(strings[0]).to.match(/Here\'s round/i)
      done()
    })
    // Send a message to Hubot
    robot.adapter.receive(new TextMessage(user, 'show me afl round 5'))
  })

  it('Return information about an AFL season from last year', (done) => {
    var lastYear = moment().subtract(1, 'years').format('Y')

    robot.adapter.on('send', (envelope, strings) => {
      expect(strings[0]).to.match(/Here\'s round/i)
      done()
    })

    // Send a message to Hubot
    robot.adapter.receive(new TextMessage(user, 'show me afl round 5 ' + lastYear))
  })

  it('Return the current year if AFL season query is too far in the future', (done) => {
    var nextYear = moment().add(1, 'years').format('Y')

    robot.adapter.on('send', (envelope, strings) => {
      expect(strings[0]).to.match(/Here\'s round/i)
      done()
    })

    // Send a message to Hubot
    robot.adapter.receive(new TextMessage(user, 'show me afl round 1' + nextYear))
  })

  it('Retrieve information about the api token', (done) => {
    robot.adapter.on('send', (envelope, strings) => {
      expect(strings[0]).to.match(/AFL API Token/i)
      done()
    })

    // Send a message to Hubot
    robot.adapter.receive(new TextMessage(user, 'afl token'))
  })
})
