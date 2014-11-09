#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var assert = require('assert'),
    chai   = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    sinon  = require('sinon'),
    LEB128 = require('../lib/protocol/LEB128');

describe("LEB128 Encoder/Decoder", function () {

  describe('::encode', function () {

    it('should accept only positive integer value', function (done) {
      var encode_string   = function () { LEB128.encode('abc'); };
      var encode_float    = function () { LEB128.encode(1.5); };
      var encode_negative = function () { LEB128.encode(-1); };
      expect(encode_string).to.throw(Error);
      expect(encode_float).to.throw(Error);
      expect(encode_negative).to.throw(Error);
      done();
    });

    it('should encode non-negative integer value correctly', function (done) {
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

    it('should decode LEB128-encoded integer value correctly', function (done) {
      var v0 = LEB128.decode(Buffer([0]));
      var v1 = LEB128.decode(Buffer([0xac,0x02]));
      var v2 = LEB128.decode(Buffer([0xe5,0x8e,0x26]));
      v0.should.equal(0);
      v1.should.equal(300);
      v2.should.equal(624485);
      done();
    });

    it('should decode LEB128-encoded integer value correctly given an offset', function (done) {
      var v0 = LEB128.decode(Buffer([0xff,0x34,0xff,0xe5,0x8e,0x26,0x00,0x00]), 3);
      v0.should.equal(624485);
      done();
    });

  });

  describe('::decodeWithMetadata', function () {

    it('should accept only Buffer object', function (done) {
      var decode_string   = function () { LEB128.decodeWithMetadata('0x00'); };
      var decode_array    = function () { LEB128.decodeWithMetadata([0xac,0x02]); };
      var decode_integer  = function () { LEB128.decodeWithMetadata(-1); };
      var decode_nothing  = function () { LEB128.decodeWithMetadata(); };
      expect(decode_string).to.throw(Error);
      expect(decode_array).to.throw(Error);
      expect(decode_integer).to.throw(Error);
      done();
    });

    it('should decode LEB128-encoded integer value correctly', function (done) {
      var v0 = LEB128.decodeWithMetadata(Buffer([0]));
      var v1 = LEB128.decodeWithMetadata(Buffer([0xac,0x02]));
      var v2 = LEB128.decodeWithMetadata(Buffer([0xe5,0x8e,0x26]));
      v0.should.deep.equal({value: 0, nextIndex: 1, lossy: false});
      v1.should.deep.equal({value: 300, nextIndex: 2, lossy: false});
      v2.should.deep.equal({value: 624485, nextIndex: 3, lossy: false});
      done();
    });

    it('should decode LEB128-encoded integer value correctly given an offset', function (done) {
      var v0 = LEB128.decodeWithMetadata(Buffer([0xff,0xff,0xff,0xe5,0x8e,0x26,0x00,0x00]), 3);
      v0.should.deep.equal({value: 624485, nextIndex: 6, lossy: false});
      done();
    });
  });

});

