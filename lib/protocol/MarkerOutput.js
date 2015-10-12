/* Copyright (c) 2014, Andrew Hart <hello@andrewfhart.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var Opcode = require('bitcore/lib/opcode'),
    Parser = require('../util/BinaryParser'),
    Put    = require('bufferput'),
    Script = require('bitcore/lib/script'),
    LEB128 = require('./LEB128');

/**
 * MarkerOutput
 *
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

  // Validate provided asset quantities
  // NOTE: This check is not guaranteed to catch all values > MAX_ASSET_QUANTITY.
  //       Because MAX_ASSET_QUANTITY is larger than Number.MAX_VALUE, exact
  //       representation of values near MAX_ASSET_QUANTITY is sometimes odd.
  //       For example (MAX_ASSET_QUANTITY === MAX_ASSET_QUANTITY+1) evaluates
  //       to 'true'. However, if a number is significantly larger than
  //       MAX_ASSET_QUANTITY, then this check will catch it.
  // TODO: Find a more precise check that will handle all cases
  if (assetQuantities) {
    assetQuantities.forEach(function (q) {
      if (q > MAX_ASSET_QUANTITY) {
        throw Error('Asset quantity '
          + assetQuantities[i]
          + ' exceeds maximum allowed (' + MAX_ASSET_QUANTITY + ')');
      }
    });
  }

  // Store provided asset quantities
  this.assetQuantities = assetQuantities
    ? assetQuantities
    : [];

  // Validate and store provided metadata
  this.metadata = (metadata && Buffer.isBuffer(metadata))
    ? metadata 
    : new Buffer([]);
};

/** 
 * Serialize the marker output data into a payload buffer
**/
MarkerOutput.prototype.serializePayload = function () {

  var i, buffer;

  // Initialize a buffer to hold the payload
  buffer = new Put();
  buffer.word16be(OPEN_ASSETS_TAG);            // Add Open Assets tag
  buffer.word16be(OPEN_ASSETS_VERSION);        // Add Open Assets version
  buffer.varint(this.assetQuantities.length); // Add number of assetQuantities
  
  // LEB128-encode each asset quantity and store as varint
  for(i = 0; i < this.assetQuantities.length; i++) {
    buffer.put(LEB128.encode(this.assetQuantities[i]));
  }

  // Encode the output metadata
  buffer.varint(this.metadata.length)         // Add the metadata length
  buffer.put(this.metadata);                  // Add the metadata

  // Return the serialized payload buffer
  return buffer.buffer();
};

/** 
 * Deserialize the marker output payload
 * @param Buffer  payload  A Buffer object containing the marker output payload
 * @return MarkerOutput    The marker output object
**/
MarkerOutput.prototype.deserializePayload = function (payload) {

  var parser = new Parser(payload),
      openAssetsTag,                      // Open Assets marker
      openAssetsVersion,                  // Open Assets version tag
      outputCount,                        // Number of outputs (excl. marker output)
      assetQuantities = [],               // Asset quantities for each output
      metadataLength  = 0,                // Length of metadata
      metadata,                           // Metadata content
      decodeData,                         // Intermediate data structure
      i;

  try {

    if (!payload || !Buffer.isBuffer(payload)) {
      throw new Error('Payload must be a valid Buffer object');
    }

    // Extract the Open Assets Protocol metadata
    openAssetsTag     = parser.word16be();
    openAssetsVersion = parser.word16be();

    // Extract the number of asset quantities
    outputCount = parser.varInt();

    // Extract the asset quantities
    for (i = 0; i < outputCount; i++) {
      // Decode an LEB128-encoded integer, and get stream metadata
      decodeData = LEB128.decodeWithMetadata(payload, parser.pos);
      // Add the decoded value to the assetQuantities array
      assetQuantities.push(decodeData.value);
      // Update the parser position to the next unseen byte
      parser.pos = decodeData.nextIndex;
    }

    // Extract the metadata length
    metadataLength = parser.varInt();

    // Extract the metadata itself
    metadata = parser.buffer(metadataLength);

    // Return the resulting object
    return new MarkerOutput(assetQuantities, metadata);

  } catch (err) {
    throw new Error("Deserialization error: " + err.message)
  }

};


/**
 * Create an output script containing OP_RETURN and a PUSHDATA
 * @param Buffer data   The content of the PUSHDATA
 * @return Buffer       The final script
**/
MarkerOutput.prototype.buildScript = function (data) {

  // Ensure data is a valid Buffer object
  if (!data || !Buffer.isBuffer(data)) {
    throw new Error('Data must be a valid Buffer object');
  }

  // Create a Script object for the output script
  var script = Script.buildDataOut(data);

  // Return the buffer for the built script
  return script.toBuffer();

};

/**
 * Parse an output script and return the payload if the output matches
 * the right pattern for an output.
 * @param   Buffer  outputScript  The output script to be parsed
 * @return  Buffer  The marker output payload
**/
MarkerOutput.prototype.parseScript = function (outputScript) {

  var script, payload;

  // Ensure outputScript is a valid Buffer object
  if (!outputScript || !Buffer.isBuffer(outputScript)) {
    throw new Error('Output script must be a valid Buffer object');
  }

  // Create a Script object from the provided outputScript and parse it
  script = new Script(outputScript);

  // The opcode must be OP_RETURN
  if(!script.isDataOut()) {
      return false;
  }

  // There must be exactly one data section following the opcode
  if (!script.chunks[1] || script.chunks.length > 2) {
    return false;
  }

  // The payload must begin with the Open Assets tag and Open Assets version
  payload = script.getData();
  if ('0x' + payload.slice(0,2).toString('hex') != OPEN_ASSETS_TAG ||
      '0x' + payload.slice(2,4).toString('hex') != OPEN_ASSETS_VERSION) {
    return false;
  }

  return payload;

};


// Public API for this object
module.exports = MarkerOutput;
module.exports.OPEN_ASSETS_TAG     = OPEN_ASSETS_TAG;
module.exports.OPEN_ASSETS_VERSION = OPEN_ASSETS_VERSION;
module.exports.MAX_ASSET_QUANTITY  = MAX_ASSET_QUANTITY;
