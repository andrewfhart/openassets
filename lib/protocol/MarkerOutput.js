'use strict';

var Put = require('bufferput'),
    LEB128 = require('./LEB128');

/**
 * Represents an Open Assets marker output[1]. The marker output
 * is what distinguishes a transaction as being an Open Assets
 * Protocol transaction. 
 *
 * References:
 * [1] https://github.com/OpenAssets/open-assets-protocol/blob/master/specification.mediawiki#Marker_output
 *
**/

/* Constants */
var OPEN_ASSETS_TAG     = 0x4f41;
var OPEN_ASSETS_VERSION = 0x0100;
var MAX_ASSET_QUANTITY  = Math.pow(2,63) -1;

/**
 * Constructor 
 * @param array(int) assetQuantities    The list of asset quantities
 * @param Buffer     metadata           The metadata in the marker output
**/
function MarkerOutput (assetQuantities, metadata) {

  var i;

  // Validate provided asset quantities
  // NOTE: This check is not guaranteed to catch all values > MAX_ASSET_QUANTITY.
  //       Because MAX_ASSET_QUANTITY is larger than Number.MAX_VALUE, exact 
  //       representation of values near MAX_ASSET_QUANTITY is sometimes odd. 
  //       For example (MAX_ASSET_QUANTITY === MAX_ASSET_QUANTITY+1) evaluates
  //       to 'true'. However, if a number is significantly larger than 
  //       MAX_ASSET_QUANTITY, then this check will catch it.
  // TODO: Find a more precise check that will handle all cases
  for (i = 0; i < assetQuantities.length; i++) {
    if (assetQuantities[i] > MAX_ASSET_QUANTITY) {
      throw Error('Asset quantity ' 
        + assetQuantities[i] 
        + ' exceeds maximum allowed (' + MAX_ASSET_QUANTITY + ')'
      );
    }
  }

  // Store provided asset quantities
  this.assetQuantities = assetQuantities;

  // Validate and store provided metadata
  this.metadata = (metadata && Buffer.isBuffer(metadata))
    ? metadata 
    : new Buffer([]);

};

/** 
 * Serializes the marker output data into a payload buffer 
**/
MarkerOutput.prototype.serializePayload = function () {

  var i, buffer;

  // Initialize a buffer to hold the payload 
  buffer = new Put()
    .word16be(OPEN_ASSETS_TAG)            // Add Open Assets tag
    .word16be(OPEN_ASSETS_VERSION)        // Add Open Assets version 
    .varint(this.assetQuantities.length); // Add number of assetQuantities
  
  // LEB128-encode each asset quantity and store as varint
  for(i = 0; i < this.assetQuantities.length; i++) {
    buffer.put(LEB128.encode(this.assetQuantities[i]));
  }

  // Encode the output metadata
  buffer
    .varint(this.metadata.length)         // Add the metadata length
    .put(this.metadata);                  // Add the metadata

  // Return the serialized payload buffer
  return buffer.buffer();
};


// Public API for this object
module.exports = MarkerOutput;

