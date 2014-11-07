#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var should = require('should'),
    assert = require('assert'),
    chai   = require('chai'),
    expect = chai.expect,
    LEB128 = require('../lib/protocol/LEB128');

describe("LEB128 Encoder/Decoder", function () {

  describe('::encode', function () {

    it('should accept only positive integer values', function (done) {
      var encode_string   = function () { LEB128.encode('abc'); };
      var encode_float    = function () { LEB128.encode(1.5); };
      var encode_negative = function () { LEB128.encode(-1); };
      expect(encode_string).to.throw(Error);
      expect(encode_float).to.throw(Error);
      expect(encode_negative).to.throw(Error);
      done();
    });

    it('should encode non-negative integer values correctly', function (done) {
      var v0 = LEB128.encode(0);
      var v1 = LEB128.encode(300);
      var v2 = LEB128.encode(624485);
      v0.toString('hex').should.equal('00');
      v1.toString('hex').should.equal('ac02');
      v2.toString('hex').should.equal('e58e26');
      done();
    });

  });

  describe('::decode', function () {

    it('should accept only Buffer objects', function (done) {
      var decode_string   = function () { LEB128.decode('0x00'); };
      var decode_array    = function () { LEB128.decode([0xac,0x02]); };
      var decode_integer  = function () { LEB128.decode(-1); };
      var decode_nothing  = function () { LEB128.decode(); };
      expect(decode_string).to.throw(Error);
      expect(decode_array).to.throw(Error);
      expect(decode_integer).to.throw(Error);
      done();
    });

    it('should decode LEB128-encoded integer values correctly', function (done) {
      var v0 = LEB128.decode(Buffer([0]));
      var v1 = LEB128.decode(Buffer([0xac,0x02]));
      var v2 = LEB128.decode(Buffer([0xe5,0x8e,0x26]));
      v0.should.equal(0);
      v1.should.equal(300);
      v2.should.equal(624485);
      done();
    });
  });

});

