#!/usr/bin/env node

'use strict';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

var assert = require('assert'),
    async  = require('async'),
    chai   = require('chai'),
    expect = chai.expect,
    should = chai.should(),
    sinon  = require('sinon'),
    ColoringEngine    = require('../lib/protocol/ColoringEngine'),
    OutputType        = require('../lib/protocol/OutputType'),
    TransactionOutput = require('../lib/protocol/TransactionOutput'),
    bitcore = require('bitcore'),
    Script  = require('bitcore/lib/script'),
    RpcClient = require('bitcoind-rpc/lib');


describe("TransactionOutput", function () {

  describe('::constructor', function () {

  });

  describe('::_computeAssetIds', function () {

    var config, getTransactionProvider, ce,
      inputs, outputs, markerOutputIndex, assetQuantities, result;


    beforeEach(function () {
      // RPC connection information
      config = {
        host:     process.env.JSONRPC_HOST,
        port:     process.env.JSONRPC_PORT,
        user:     process.env.JSONRPC_USER,
        pass:     process.env.JSONRPC_PASS,
        protocol: process.env.JSONRPC_PROTOCOL
      };

      // A wrapper to generate transaction providers given a config
      getTransactionProvider = function getTransactionProvider(config) {
        return function transactionProvider(hash, cb) {
          var rpcc = new RpcClient(config);
          rpcc.getRawTransaction(hash,cb);
        };
      };

      // Create an instance of the Coloring Engine
      ce = new ColoringEngine(getTransactionProvider(config));
    })

    it('should compute the asset id of an Issuance output', function (done) {

      // This is a simulation of the following transaction:
      // https://www.coinprism.info/tx/77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c
      // https://insight.bitpay.com/tx/77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c
      inputs = [
        new TransactionOutput(100000, new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'))
      ];
      markerOutputIndex=1;
      outputs = [
        { satoshis: new Buffer('5802000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'))},
        { satoshis: new Buffer('0000000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('6a224f41010001011b753d68747470733a2f2f6370722e736d2f63463557584459643642','hex'))},
        { satoshis: new Buffer('385d010000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'))}
      ];
      assetQuantities = [1];

      result = ce._computeAssetIds(inputs, markerOutputIndex, outputs, assetQuantities);
      result.length.should.equal(3);

      // Issuance output
      result[0].value.should.equal(600);
      result[0].outputType.should.equal(OutputType.ISSUANCE);
      result[0].assetId.toString('hex').should.equal('1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0');
      result[0].toString().should.equal('TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=ISSUANCE)');

      // Marker output
      result[1].value.should.equal(0);
      result[1].outputType.should.equal(OutputType.MARKER_OUTPUT);
      expect(result[1].assetId).to.be.null;
      result[1].toString().should.equal('TransactionOutput(value=0, script=0x6a224f41010001011b753d68747470733a2f2f6370722e736d2f63463557584459643642, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');

      // Transfer output (technically "uncolored" since this there is no asset id - this is just a "change" output)
      expect(result[2].assetId).to.be.null;
      expect(result[2].assetQuantity).to.be.null;
      result[2].value.should.equal(89400);
      result[2].outputType.should.equal(OutputType.TRANSFER);

      done();
    });

    it('should compute the asset id for a Transfer from an Issuance', function (done) {

      // This is a simulation of the following transaction:
      // https://www.coinprism.info/tx/b26bbbf5cf5a783241397236227640402ecdd10955f8aecf2ad19b3b744bde42
      // https://insight.bitpay.com/tx/b26bbbf5cf5a783241397236227640402ecdd10955f8aecf2ad19b3b744bde42
      inputs = [
        new TransactionOutput(600, new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'), new Buffer('1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0','hex'), 1, OutputType.ISSUANCE),
        new TransactionOutput(0,   new Buffer('6a224f41010001011b753d68747470733a2f2f6370722e736d2f63463557584459643642', null, null, OutputType.MARKER_OUTPUT))
      ];
      markerOutputIndex=0;
      outputs = [
        { satoshis: new Buffer('0000000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('6a074f410100010100','hex'))},
        { satoshis: new Buffer('5802000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac','hex'))},
        { satoshis: new Buffer('2836010000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'))}
      ];
      assetQuantities = [1];

      result = ce._computeAssetIds(inputs, markerOutputIndex, outputs, assetQuantities);
      result.length.should.equal(3);

      // Marker output
      result[0].value.should.equal(0);
      result[0].outputType.should.equal(OutputType.MARKER_OUTPUT);
      expect(result[0].assetId).to.be.null;
      result[0].toString().should.equal('TransactionOutput(value=0, script=0x6a074f410100010100, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');

      // Transfer output
      result[1].value.should.equal(600);
      result[1].outputType.should.equal(OutputType.TRANSFER);
      result[1].assetId.toString('hex').should.equal('1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0');
      result[1].toString().should.equal('TransactionOutput(value=600, script=0x76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=TRANSFER)');

      // Transfer output (technically "uncolored" since this there is no asset id - this is just a "change" output)
      expect(result[2].assetId).to.be.null;
      expect(result[2].assetQuantity).to.be.null;
      result[2].value.should.equal(79400);
      result[2].outputType.should.equal(OutputType.TRANSFER);

      done();
    });

    it('should compute the asset id for a Transfer from a Transfer', function (done) {

      // This is a simulation of the following transaction:
      // https://www.coinprism.info/tx/56a4bde85b9f2de5be0f17ad0fa666efebbf6cc7961b2720bdf0750282f8d18c
      // https://insight.bitpay.com/tx/56a4bde85b9f2de5be0f17ad0fa666efebbf6cc7961b2720bdf0750282f8d18c
      inputs = [
        new TransactionOutput(600, new Buffer('76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac','hex'), new Buffer('1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0','hex'), 1, OutputType.TRANSFER),
        new TransactionOutput(0,   new Buffer('6a224f41010001011b753d68747470733a2f2f6370722e736d2f63463557584459643642', null, null, OutputType.MARKER_OUTPUT))
      ];
      markerOutputIndex=0;
      outputs = [
        { satoshis: new Buffer('0000000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('6a074f410100010100','hex'))},
        { satoshis: new Buffer('5802000000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a914d717483b5554670550f8e79a3b958d294ecf806088ac','hex'))},
        { satoshis: new Buffer('905f010000000000','hex').readInt32LE(0),
          script: new Script(new Buffer('76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac','hex'))}
      ];
      assetQuantities = [1];

      result = ce._computeAssetIds(inputs, markerOutputIndex, outputs, assetQuantities);
      result.length.should.equal(3);

      // Marker output
      result[0].value.should.equal(0);
      result[0].outputType.should.equal(OutputType.MARKER_OUTPUT);
      expect(result[0].assetId).to.be.null;
      result[0].toString().should.equal('TransactionOutput(value=0, script=0x6a074f410100010100, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');

      // Transfer output
      result[1].value.should.equal(600);
      result[1].outputType.should.equal(OutputType.TRANSFER);
      result[1].assetId.toString('hex').should.equal('1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0');
      result[1].toString().should.equal('TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=TRANSFER)');

      // Transfer output (technically "uncolored" since this there is no asset id - this is just a "change" output)
      expect(result[2].assetId).to.be.null;
      expect(result[2].assetQuantity).to.be.null;
      result[2].value.should.equal(90000);
      result[2].outputType.should.equal(OutputType.TRANSFER);

      done();
    });

  });


  describe('::getOutput', function () {

    var txFunding, txIssue1, txIssue2, txXfer1, txXfer2, txXfer3,
        config, getTransactionProvider, ce,
        seriesCallback;

    beforeEach( function () {

      // Set up a few transaction hashes to use with testing
      // see https://www.coinprism.info/tx/<transactionhash> for information on each:
      // Transfer 0.001 BTC to address: 1LcJAv8c81q9BRv45znsVSdsuMRtKtpzKL
      txFunding = '405b36e856c6f89952116948268ffcd4deffb845c232514cf81a324f343eddf5';
      // Issue 1    'AJS39eYsPGYo3S8L73xWGv8DwPHT4LYp8B' asset to address:  akWaBR5wwbViq3g5R8cu49JYTExc4GrNpeT
      txIssue1  = '77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c';
      // Transfer 1 'AJS39eYsPGYo3S8L73xWGv8DwPHT4LYp8B' asset to address:  akMhZVXQsR7mUkud8LGDoQbnP3um6iFF1JC
      txXfer1   = 'b26bbbf5cf5a783241397236227640402ecdd10955f8aecf2ad19b3b744bde42';
      // (return) Transfer the 1 'AJS39eYsPGYo3S8L73xWGv8DwPHT4LYp8B' asset back to address: akWaBR5wwbViq3g5R8cu49JYTExc4GrNpeT
      txXfer2   = '56a4bde85b9f2de5be0f17ad0fa666efebbf6cc7961b2720bdf0750282f8d18c';
      // Issue 200  'AJS39eYsPGYo3S8L73xWGv8DwPHT4LYp8B' assets to address: akWaBR5wwbViq3g5R8cu49JYTExc4GrNpeT
      txIssue2  = 'dcccfdf72171964bfa895def45eeca746b126159473162a74d2c99c88bba469d';
      // Transfer 2 'AJS39eYsPGYo3S8L73xWGv8DwPHT4LYp8B' assets to address  akMhZVXQsR7mUkud8LGDoQbnP3um6iFF1JC
      txXfer3   = '5bcc5beaf1ded56e22757b05329fb00c8e37f53593ec56e7303e0a8c99ecd169';

      // RPC connection information
      config = {
        host:     process.env.JSONRPC_HOST,
        port:     process.env.JSONRPC_PORT,
        user:     process.env.JSONRPC_USER,
        pass:     process.env.JSONRPC_PASS,
        protocol: process.env.JSONRPC_PROTOCOL
      };

      // A wrapper to generate transaction providers given a config
      getTransactionProvider = function getTransactionProvider(config) {
        return function transactionProvider(hash, cb) {
          var rpcc = new RpcClient(config);
          rpcc.getRawTransaction(hash,cb);
        };
      };

      // Create an instance of the Coloring Engine
      ce = new ColoringEngine(getTransactionProvider(config));
    });


    it('should handle a non-Open Assets transaction given a valid hash', function (done) {
      this.timeout(5000);
      async.series([
        function (cb) {
          ce.getOutput(txFunding, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=100000, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=null, assetQuantity=null, outputType=UNCOLORED)');
            cb();
          });
        },
        function (cb) {
          ce.getOutput(txFunding, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=390000, script=0x76a9141937a416988ea705aa9c9112e67a35543c6854fb88ac, assetId=null, assetQuantity=null, outputType=UNCOLORED)');
            cb();
          });
        }
      ],function () {done();});
    });

    it('should detect an Open Assets issuance transaction output', function (done) {
      async.series([
        // Open Assets Issuance output
        function (cb) {
          ce.getOutput(txIssue1, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=ISSUANCE)');
            cb();
          });
        },
        // Open Assets Marker output
        function (cb) {
          ce.getOutput(txIssue1, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=0, script=0x6a224f41010001011b753d68747470733a2f2f6370722e736d2f63463557584459643642, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');
            cb();
          });
        }
      ],function () {done();});
    });

    it('should detect an Open Assets transfer transaction output', function (done) {
      this.timeout(5000);
      async.series([
        // Open Assets Marker output
        function (cb) {
          ce.getOutput(txXfer1, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=0, script=0x6a074f410100010100, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');
            cb();
          });
        },
        // Open Assets Transfer output
        function (cb) {
          ce.getOutput(txXfer1, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=TRANSFER)');
            cb();
          });
        }
      ],function () {done();});
    });

    it('should detect an Open Assets issuance transaction output', function (done) {
      async.series([
        // Open Assets Issuance output
        function (cb) {
          ce.getOutput(txIssue2, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=200, outputType=ISSUANCE)');
            cb();
          });
        },
        // Open Assets Marker output
        function (cb) {
          ce.getOutput(txIssue2, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=0, script=0x6a234f41010001c8011b753d68747470733a2f2f6370722e736d2f63463557584459643642, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');
            cb();
          });
        }
      ],function () {done();});
    });

    it('should detect an Open Assets transfer transaction output', function (done) {
      this.timeout(5000);
      async.series([
        // Open Assets Marker output
        function (cb) {
          ce.getOutput(txXfer2, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=0, script=0x6a074f410100010100, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');
            cb();
          });
        },
        // Open Assets Transfer output
        function (cb) {
          ce.getOutput(txXfer2, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=TRANSFER)');
            cb();
          });
        }
      ],function () {done();});
    });

    it('should detect an Open Assets transfer transaction output with "asset change"', function (done) {
      this.timeout(5000);
      async.series([
        // Open Assets Marker output
        function (cb) {
          ce.getOutput(txXfer3, 0, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=0, script=0x6a094f4101000202c70100, assetId=null, assetQuantity=null, outputType=MARKER_OUTPUT)');
            cb();
          });
        },
        // Open Assets Transfer output (Transfer 1 units from tx 56a...18c and 1 unit from tx dcc...69d to 1BjGFM...)
        function (cb) {
          ce.getOutput(txXfer3, 1, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a91475c37d8aaeb2cd9859a7b212d21e422903cf00a288ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=2, outputType=TRANSFER)');
            cb();
          });
        },
        // Open Assets Transfer output (Transfer the remaining 199 units from tx dcc...69d back to the 1LcJAv...)
        function (cb) {
          ce.getOutput(txXfer3, 2, function (err, data) {
            expect(err).to.not.exist;
            expect(data.toString()).to.equal(
              'TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=199, outputType=TRANSFER)');
            cb();
          });
        },
        // Transfer output (technically "uncolored" since there is no asset id - this is just a "change" output)
        function (cb) {
          ce.getOutput(txXfer3, 3, function (err, data) {
            expect(err).to.not.exist;
            expect(data.assetId).to.be.null;
            expect(data.assetQuantity).to.be.null;
            data.value.should.equal(58800);
            data.outputType.should.equal(OutputType.TRANSFER);
            expect(data.toString()).to.equal(
              'TransactionOutput(value=58800, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=null, assetQuantity=null, outputType=TRANSFER)');
            cb();
          });
        }
      ],function () {done();});
    });



  });



  describe('::hashScript', function () {
    it('should compute the RIPEMD160 of the SHA256 of the data', function (done) {
      var data = new Buffer('18E14A7B6A307F426A94F8114701E7C8E774E7F9A47E2C2035DB29A206321725','hex');
      var hash = new ColoringEngine().hashScript(data);
      hash.toString('hex').should.equal('29a4be50be7ff6ea37b9dcc1aa9642ab928c6dcb');
      done();
    });
  });

  describe('::addressFromBitcoinAddress', function () {
    it('should compute the OpenAsset address from a Bitcoin public address', function (done) {
      var btcAddr = '16UwLL9Risc3QfPqBUvKofHmBQ7wMtjvM';
      var oaAddr = new ColoringEngine().addressFromBitcoinAddress(btcAddr);
      oaAddr.should.equal('akB4NBW9UuCmHuepksob6yfZs6naHtRCPNy');
      done();
    });
  });

});
