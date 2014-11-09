#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var assert = require('assert'),
    chai   = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    sinon  = require('sinon'),
    MarkerOutput = require('../lib/protocol/MarkerOutput'); 

describe("MarkerOutput", function () {

  describe('::constructor', function () {

    var mo;

    beforeEach( function () {
       mo = new MarkerOutput([1,2,3], Buffer('metadata', 'ascii'));
    });

    it('should store provided asset quantities list', function (done) {
      mo.assetQuantities.should.deep.equal([1,2,3]);
      done();
    });

    it('should store provided metadata', function (done) {
      mo.metadata.toString().should.equal('metadata');
      done();
    });

    it('should fail if an asset quantity is greater than MAX_ASSET_QUANTITY*', function (done) {
      // NOTE: See comments in MarkerOutput::constructor for caveats (*) to this test
      var fn = function () { var mo = new MarkerOutput([Math.pow(2,64)]); };
      expect(fn).to.throw(Error);
      done();
    });

    it('should handle empty metadata', function (done) {
      var mo = new MarkerOutput([1, 2, 3]);
      mo.metadata.toString('hex').should.equal('');
      done();
    });

    it('should ignore malformed metadata', function (done) {
      var mo = new MarkerOutput([1, 2, 3], 'metadata');
      mo.metadata.toString('hex').should.equal('');
      done();
    });
  });


  describe('::serializePayload', function () {

    var mo, buf, bs;

    beforeEach( function () {
      /*
       * The marker output in this test corresponds to the following
       * asset definition:
       *   Output 0: Issue 1 asset
       *   Output 1: Marker output (0, skip)
       *   Output 2: Transfer 300 assets
       *   Output 3: Transfer 624485 assets
       * The metadata associated with this transaction is 'metadata'
      */
      mo  = new MarkerOutput([1,300,624485], Buffer('metadata', 'ascii'));
      buf = mo.serializePayload();
      bs  = [].slice.call(buf);
    });

    it('should include the Open Assets tag', function (done) {
      bs.slice(0,2).should.deep.equal([0x4f,0x41]); 
      done();
    });

    it('should include the Open Assets version number', function (done) {
      bs.slice(2,4).should.deep.equal([0x01,0x00]); 
      done();
    });

    it('should include the length of the assetQuantities list', function (done) {
      bs.slice(4,5).should.deep.equal([0x03]); 
      done();
    });

    it('should include each asset quantity as an LEB128-encoded varint', function (done) {
      // 1      -> 0x01
      // 300    -> 0xac 0x02
      // 624485 -> 0xe5 0x8e 0x26
      bs.slice(5,11).should.deep.equal([0x01, 0xac, 0x02, 0xe5, 0x8e, 0x26]);
      done();
    });

    it('should include the length of the metadata', function (done) {
      bs.slice(11,12).should.deep.equal([0x08]);  // 'metadata'.length = 8
      done();
    });

    it('should include the metadata', function (done) {
      bs.slice(12,20).should.deep.equal(
        [0x6d, 0x65, 0x74, 0x61, 0x64, 0x61, 0x74, 0x61]);  // 'metadata'.length = 8
      done();
    });
  });

  describe('::deserializePayload', function () {

    var mo, buf, data;

    beforeEach(function () {
      mo   = new MarkerOutput([1, 300, 624485], Buffer('metadata','ascii'));
      buf  = mo.serializePayload();
      data = mo.deserializePayload(buf);
    });

    it('should recover each asset quantity', function (done) {
      data.assetQuantities.should.deep.equal([1, 300, 624485]);
      done();
    });

    it('should recover the content of the metadata', function (done) {
      data.metadata.toString('ascii').should.equal('metadata');
      done();
    });

    it('should fail if not given a valid payload', function (done) {
      var fn = function () {MarkerOutput.deserializePayload('asdfjkl;');};
      expect(fn).to.throw(Error);
      done();
    });

  });

});