'use strict';

var HashUtil     = require('bitcore/util'), 
    LEB128       = require('./LEB128'),
    MarkerOutput = require('./MarkerOutput'),
    Opcode       = require('bitcore/lib/Opcode'),
    OutputType   = require('./OutputType'),
    Parser       = require('bitcore/util/BinaryParser'),
    Put          = require('bufferput'),
    Script       = require('bitcore/lib/Script'),
    TransactionOutput = require('./TransactionOutput');

/**
 * The backtracking engine used to find the asset ID and asset quantity 
 * of any output.
**/

/**
 * Constructor
 * @param function transactionProvider  A function that accepts a transaction hash, 
 *                                      performs a transaction lookup, and populates
 *                                      a callback function. The first parameter to
 *                                      this function should be the transaction hash
 *                                      to look up. The second parameter should be a
 *                                      callback function with the following 
 *                                      signature: cb(err, data). See the test cases
 *                                      for this class for an example provider using
 *                                      the Bitcore RpcClient library.                                      
**/ 
function ColoringEngine (transactionProvider) {

  this.transactionProvider = transactionProvider;

}

/**
 * Get an output and information about its asset ID and asset quantity.
 * @param Buffer   transactionHash The hash of the transaction containing the output
 * @param int      outputIndex     The index of the output
 * @param function cb              A callback function to invoke with the result
**/
ColoringEngine.prototype.getOutput = function (transactionHash, outputIndex, cb) {

  this.transactionProvider(transactionHash, cb);

}

/**
 * Compute the asset ID and and asset quantity of every output in the transaction
 * @param ??     transaction          The transaction to color
 * @return array(TransactionOutput)   An array containing all the colored outputs of the transaction
**/
ColoringEngine.prototype.colorTransaction = function (transaction) {

}

/**
 * Compute Asset IDs of every output in a transaction
 * @param array(TransactionOutput) inputs            The outputs referenced by the inputs of the transaction
 * @param int                      markerOutputIndex The position of the marker output in the transaction
 * @param array(??)                outputs           The outputs of the transaction
 * @param array(int)               assetQuantities   The list of asset quantities of the outputs
 * @return array(TransactionOutput)                  A list of outputs with asset ID and asset quantity information
**/
ColoringEngine.prototype._computeAssetIds = function (inputs, markerOutputIndex, outputs, assetQuantities) {

}

/**
 * Hash a script into an Asset ID using SHA256 followed by RIPEMD160
 * @param Buffer data           The data to hash
 * @return       The resulting Asset ID
**/
ColoringEngine.prototype.hashScript = function (data) {

  return HashUtil.sha256ripe160(data);

}

module.exports = ColoringEngine;
