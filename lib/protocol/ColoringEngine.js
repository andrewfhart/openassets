'use strict';

var async        = require('async'),
    buffertools  = require('buffertools'),
    HashUtil     = require('bitcore/util'),
    LEB128       = require('./LEB128'),
    MarkerOutput = require('./MarkerOutput'),
    Opcode       = require('bitcore/lib/Opcode'),
    OutputType   = require('./OutputType'),
    Parser       = require('bitcore/util/BinaryParser'),
    Put          = require('bufferput'),
    Script       = require('bitcore/lib/Script'),
    Transaction  = require('bitcore/lib/Transaction'),
    TransactionOutput = require('./TransactionOutput');

/**
 * The backtracking engine used to find the asset ID and asset quantity 
 * of any output.
**/

/**
 * Constructor
 * @param function transactionProvider  A function that accepts a transaction hash, 
 *                                      performs a transaction lookup, and populates
 *                                      a callback. The first parameter to this
 *                                      function should be the transaction hash to
 *                                      look up. The second parameter should be a
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

  var coloringEngine = this,
      tx;

  coloringEngine.transactionProvider(transactionHash, function (err, data) {
    if (err) return cb(err);

    // Propagate error message from underlying JSON RPC call
    if (data.message) return cb(data.message);

    // Successful lookups will always populate 'result'
    if (!data.result) return cb('Transaction could not be retrieved.');

    // Create and populate a Transaction object using the raw data
    tx = new Transaction();
    tx.parse(new Buffer(data.result,'hex'));

    // Compute ID and asset quantity of transaction outputs
    coloringEngine.colorTransaction(tx, function (err, data) {
      if (err) return cb(err);

      console.log('~~~Transaction: ' + transactionHash + '~~~');
      console.log(data);
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');

      // If an output matching outputIndex exists, return it
      if (data[outputIndex]) { 
        return cb(null, data[outputIndex]); 
      }
      // Otherwise, report the error
      else { 
        return cb('No data for output matching index ' + outputIndex);
      }

    });

  });

}

/**
 * Compute the asset ID and and asset quantity of every output in the transaction
 * @param Buffer   transaction        The transaction to color
 * @param function cb                 A callback function to invoke with the result. The
 *                                    function should have the signature cb(err, data). If
 *                                    successful, 'data' will be populated with an array
 *                                    containing all the colored outputs of the transaction.
**/
ColoringEngine.prototype.colorTransaction = function (transaction, cb) {

  var coloringEngine = this,
      foundMarkerOutput = false,
      markerOutputPayload = null,
      markerOutput = null;

  // Helper function to make the appropriate response in the case
  // where no valid asset ids were found in a transaction. In 
  // this case all of the transaction outputs are considered uncolored.
  var makeUncoloredResponse = function (tx) { 
    var outs = [];
    tx.outs.forEach(function (o) {
      outs.push(new TransactionOutput(o.v.readInt32LE(0),o.s));
    });
    return outs;
  };

  // If the transaction is a coinbase transaction, the marker output is always invalid
  if (transaction.isCoinBase()) {
    return cb(null, makeUncoloredResponse(transaction));
  }

  // Search transaction outputs for an Open Assets "Marker Output"
  transaction.outs.forEach(function (o, outIdx) {
    // If a valid marker is found, we can stop processing subsequent outputs
    // since, according to the spec: "if multiple valid marker outputs
    // exist in the same transaction, the first one is used and the other
    // ones are considered as regular outputs." [1]
    // [1] https://github.com/OpenAssets/open-assets-protocol/blob/master/specification.mediawiki
    if (!foundMarkerOutput) {
      // Attempt to decode this output as a Marker Output.
      markerOutputPayload = MarkerOutput.prototype.parseScript(o.s);
      // If a valid marker output payload was decoded
      if (markerOutputPayload) {
        // Extract the marker output (asset quantity and metadata) information
        markerOutput = MarkerOutput.prototype.deserializePayload(markerOutputPayload);
        // If valid marker output information was extracted, we have all the
        // information necessary to compute the colored outputs for this tx
        if (markerOutput) {
          foundMarkerOutput = true;

          // Build a recursive backtracking function for each of this
          // transactions inputs. Looking at the colored outputs from
          // transactions linked to this transaction's inputs will allow
          // us to dertermine which assets flow into the current transaction.
          var prevouts = [];
          transaction.inputs().forEach(function (i, idx) {

            prevouts.push(function (fcb) {
              var outHash = buffertools.reverse(i[0]).toString('hex');
              coloringEngine.getOutput(outHash, idx, fcb);
            });
          }, coloringEngine);

          // Fetch the colored outputs for each previous transaction
          async.parallel(prevouts, function (err, inTxs){
            if (err) return cb(err);

            // Store results of all recursive backtracking
            var inputs = inTxs;

            // Ensure all inputs were processed
            if (inputs.length !== transaction.ins.length) {
              return ("Error processing inputs: expected "
                + transaction.ins.length + " results, got " + inputs.length);
            }

            // Compute the asset ids of the colored outputs
            var outputsWithAssetIds = ColoringEngine.prototype._computeAssetIds(
              inputs,
              outIdx,
              transaction.outs,
              markerOutput.assetQuantities);

            if (outputsWithAssetIds) {
              // If successful, return the colored outputs
              return cb(null, outputsWithAssetIds);
            } else {
              // Otherwise, the transaction should be considered uncolored
              return cb(null, makeUncoloredResponse(transaction));
            }
          });
        }
      }
    }
  }, coloringEngine);

  // If no marker output was encountered in any of the transaction
  // outputs, all transaction outputs are considered uncolored.
  if (!foundMarkerOutput) {
    return cb(null, makeUncoloredResponse(transaction));
  }

};


/**
 * Compute Asset IDs of every output in a transaction
 * @param array(TransactionOutput) inputs            The outputs referenced by the inputs of the transaction
 * @param int                      markerOutputIndex The position of the marker output in the transaction
 * @param array(TransactionOut)    outputs           The outputs of the transaction
 * @param array(int)               assetQuantities   The list of asset quantities of the outputs
 * @param function                 cb                A callback to invoke with the array of computed asset ids
 * @return array(TransactionOutput) An array of transaction outputs with computed asset ids
**/
ColoringEngine.prototype._computeAssetIds = function (inputs, markerOutputIndex, outputs, assetQuantities) {

  var coloringEngine = this,
      result = [],
      assetId,
      issuanceAssetId,
      outputAssetQuantity,
      curInput,
      inputUnitsLeft,
      outputUnitsLeft,
      progress,
      i;

  // If there are more items in the asset quantities list than outputs in
  // the transaction (excluding the marker output), the marker output is
  // deemed invalid
  if (assetQuantities.length > outputs.length - 1) {
    return false;
  }

  // If there is no input in the transaction, the marker output is always invalid
  if (inputs.length == 0) {
    return false;
  }

  // Add the issuance outputs
  issuanceAssetId = coloringEngine.hashScript(inputs[0].script);
  for (i = 0; i < markerOutputIndex; i++) {
    if (i < assetQuantities.length && assetQuantities[i] > 0) {
      result.push(new TransactionOutput(
        outputs[i].v.readInt32LE(0),
        outputs[i].s,
        issuanceAssetId,
        assetQuantities[i],
        OutputType.ISSUANCE));
    } else {
      result.push(new TransactionOutput(
        outputs[i].v.readInt32LE(0),
        outputs[i].s,
        null,
        null,
        OutputType.ISSUANCE));
    }
  }

  // Add the marker output
  result.push(new TransactionOutput(
    outputs[markerOutputIndex].v.readInt32LE(0),
    outputs[markerOutputIndex].s,
    null,
    null,
    OutputType.MARKER_OUTPUT));

  // Add the transfer outputs
  for (i = markerOutputIndex + 1; i < outputs.length; i++) {

    if (i <= assetQuantities.length) {
      outputAssetQuantity = assetQuantities[i-1];
    } else {
      outputAssetQuantity = 0;
    }

    outputUnitsLeft = outputAssetQuantity;
    assetId = null;

    var BACKSTOP = 0;

    curInput = 0;
    assetId  = (inputs[curInput])
      ? inputs[curInput].assetId
      : null;
    inputUnitsLeft = (inputs[curInput])
      ? ((null == inputs[curInput].assetQuantity) ? 0 : inputs[curInput].assetQuantity)
      : 0;

    while (outputUnitsLeft > 0 && (++BACKSTOP < 1000)) {
      // Move to the next input if the current one is depleted
      if (inputUnitsLeft == 0) {
        curInput++;

        // If there are less asset units available than in the outputs
        // the marker output is considered invalid
        if (!inputs[curInput]) {
          return false;
        // Otherwise, use the assetQuantity associated with the current input
        } else {
          inputUnitsLeft = (null == inputs[curInput].assetQuantity) ? 0 : inputs[curInput].assetQuantity;
        }
      }

      // If the current input is colored, assign its asset id to the
      // current input
      if (inputs[curInput].assetId != null) {
        progress = Math.min(inputUnitsLeft, outputUnitsLeft);
        outputUnitsLeft -= progress;
        inputUnitsLeft  -= progress;

        if (assetId == null) {
          // This is the first input to map to this output
          assetId = inputs[curInput].assetId;
        } else if (assetId != inputs[curInput].assetId) {
          // Another different asset ID has already been assigned to
          // that output. The marker output is considered invalid
          return false
        }
      }

      result.push(new TransactionOutput(
        outputs[i].v.readInt32LE(0),
        outputs[i].s,
        assetId,
        outputAssetQuantity,
        OutputType.TRANSFER));
    }

  }

  return result;
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
