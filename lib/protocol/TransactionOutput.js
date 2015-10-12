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

var LEB128       = require('./LEB128'),
    MarkerOutput = require('./MarkerOutput'),
    Opcode       = require('bitcore/lib/opcode'),
    OutputType   = require('./OutputType'),
    Parser       = require('../util/BinaryParser'),
    Put          = require('bufferput'),
    Script       = require('bitcore/lib/script');

/**
 * Transaction Output
 *
 * Represents an Open Assets transaction output and its asset
 * ID and asset quantity.
**/

/**
 * Constructor
 * @param int    value         The satoshi value of the output
 * @param Buffer script        The script controlling redemption of the output
 * @param Buffer assetId	     The asset ID of the output
 * @param int    assetQuantity The asset quantity of the output
 * @param int    outputType	   The type of the output
**/
function TransactionOutput (value, script, assetId, assetQuantity, outputType) {

  // Ensure script is a valid Buffer object
  if (script && !Buffer.isBuffer(script)) {
    throw new Error("Script must be a valid Buffer object");
  }

  // Ensure assetId is a valid Buffer object
  if (assetId && !Buffer.isBuffer(assetId)) {
    throw new Error("Asset ID must be a valid Buffer object");
  }

  // Ensure asset quantity is within range
  if (assetQuantity && (assetQuantity < 0 || assetQuantity > MarkerOutput.MAX_ASSET_QUANTITY)) {
    throw new Error(
      "Asset quantity out of supported range (0-"
        + MarkerOutput.MAX_ASSET_QUANTITY + ")");
  }

  // Ensure outputType is a valid identifier
  if (outputType && (outputType < OutputType.UNCOLORED || outputType > OutputType.TRANSFER)) {
    throw new Error("Unsupported output type specified");
  }

  // Assign arguments
  this.value = (value != undefined) ? value : null;
  this.script = script || null;
  this.assetId = assetId || null;
  this.assetQuantity = assetQuantity || null;
  this.outputType = outputType || OutputType.UNCOLORED;

}

TransactionOutput.prototype.toString = function () {
  return 'TransactionOutput(' +
    'value='         + this.value                                                   + ', ' +
    'script='        + ((this.script)  ? '0x' + this.script.toString('hex') : null) + ', ' +
    'assetId='       + ((this.assetId) ? '0x' + this.assetId.toString('hex'): null) + ', ' +
    'assetQuantity=' + this.assetQuantity                                           + ', ' +
    'outputType='    + OutputType.reverseMap(this.outputType) + ')';
}

module.exports = TransactionOutput;
