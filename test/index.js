'use strict'

const Helper = require('hubot-test-helper')
const expect = require('chai').expect
const http = require('http')

const helper = new Helper('../src/index.js')

describe('hubot', () => {
  let room

  beforeEach(() => room = helper.createRoom())
  afterEach(() => room.destroy())

  it('should respond when asked about afl', done => {
    room.user.say('alice', 'hubot afl').then(() => {
      expect(room.messages).to.eql([
        ['alice', 'hubot afl'],
        ['hubot', `I can help you out with afl scores:
"afl current round" - Get fixtures/ scores of the latest round.
"afl round 27 2012" - Show fixtures for a specific round (year optional)`]
      ])
      done()
    })
  })

//   it('should return specific round information', done => {
//     room.user.say('alice', 'hubot afl round 25 2015').then(() => {
//       expect(room.messages).to.eql([
//         ['alice', 'hubot afl round 25 2015'],
//         ['hubot', `AFL round 25 (2015)
// *Hawthorn (135)* - Adelaide Crows (61)
// *North Melbourne (77)* - Sydney Swans (51)`]
//       ])
//       done()
//     })
//   })

  it('should return the current round information', done => {
    room.user.say('alice', 'hubot afl current round').then(() => {
      expect(room.messages).to.match(/^AFL Round/)
      done()
    })
  })
})
