#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var assert = require('assert'),
    chai   = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    sinon  = require('sinon'),
    OutputType        = require('../lib/protocol/OutputType'),
    TransactionOutput = require('../lib/protocol/TransactionOutput'); 


describe("TransactionOutput", function () {

  describe('::constructor', function () {

    var value, script, assetId, assetQuantity, outputType,
      assetQuantityValid, assetQuantityTooSmall, assetQuantityTooBig,
      outputTypeValid, outputTypeInvalid;

    beforeEach(function () {
      value = 500;
      script  = new Buffer([0x01,0x02,0x03,0x04]);
      assetId = new Buffer([0x01,0x02]);
      assetQuantityValid = Math.pow(2,20);
      assetQuantityTooSmall = -1;
      assetQuantityTooBig = Math.pow(2,65);
      outputTypeValid = OutputType.TRANSFER;
      outputTypeInvalid = -1;
    });

    it('should apply defaults if only given a value', function (done) {
      var to = new TransactionOutput(value);
      to.value.should.equal(value);
      expect(to.script).to.be.null;
      expect(to.assetId).to.be.null;
      expect(to.assetId).to.be.null;
      to.outputType.should.equal(OutputType.UNCOLORED);
      done();
    });

    it('should correctly store the provided script', function (done) {
      var to = new TransactionOutput(value, script);
      to.script.should.deep.equal(script);
      done();
    });

    it('should correctly store the provided asset ID', function (done) {
      var to = new TransactionOutput(value, script, assetId);
      to.assetId.should.deep.equal(assetId);
      done();
    });

    it('should correctly store the provided asset quantity', function (done) {
      var to = new TransactionOutput(value, script, assetId, assetQuantityValid);
      to.assetQuantity.should.deep.equal(assetQuantityValid);
      done();
    });

    it('should correctly store the provided output type', function (done) {
      var to = new TransactionOutput(value, script, assetId, assetQuantityValid, outputTypeValid);
      to.outputType.should.deep.equal(outputTypeValid);
      done();
    });

    it('should fail if asset quantity is out of range', function (done) {
      expect(function() {var to = new TransactionOutput(value, script, assetId, assetQuantityTooSmall);})
        .to.throw(Error);
      expect(function() {var to = new TransactionOutput(value, script, assetId, assetQuantityTooBig);})
        .to.throw(Error);
      done();
    });

    it('should fail if unsupported output type specified', function (done) {
      expect(function() {var to = new TransactionOutput(value, script, assetId, assetQuantityValid, outputTypeInvalid);})
        .to.throw(Error);
      done();
    });

  });

  describe('::toString', function () {

    var to, value, script, assetId, assetQuantityValid, outputTypeValid;

    beforeEach(function () {
      value = 500;
      script  = new Buffer([0x01,0x02,0x03,0x04]);
      assetId = new Buffer([0x01,0x02]);
      assetQuantityValid = Math.pow(2,20);
      outputTypeValid = OutputType.TRANSFER;
    });

    it('should generate a string representation of a default TransactionOutput', function (done) {
      to = new TransactionOutput();
      expect(to.toString()).to.equal(
        'TransactionOutput(value=null, script=null, assetId=null, assetQuantity=null, outputType=UNCOLORED)');
      done();
    });

    it('should generate a string representation of a custom TransactionOutput', function (done) {
      to = new TransactionOutput(value, script, assetId, assetQuantityValid, outputTypeValid);
      expect(to.toString()).to.equal(
        'TransactionOutput(value=500, script=0x01020304, assetId=0x0102, assetQuantity=1048576, outputType=TRANSFER)');
      done();
    });
  });

});
