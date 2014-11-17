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

/**
 * OutputType
 *
 * Represents the four types of transaction outputs defined
 * by the Open Assets Protocol[1].
 *
 * References:
 * [1] https://github.com/OpenAssets/open-assets-protocol/blob/master/specification.mediawiki#Open_Assets_Transactions
 *
**/

/** Constants **/
var UNCOLORED = 0;
var MARKER_OUTPUT = 1;
var ISSUANCE = 2;
var TRANSFER = 3;

function reverseMap (value) {
  switch (value) {
    case UNCOLORED:     return "UNCOLORED";
    case MARKER_OUTPUT: return "MARKER_OUTPUT";
    case ISSUANCE:      return "ISSUANCE";
    case TRANSFER:      return "TRANSFER";
    default:            return "Unknown";
  }
}

// The public API for this object
module.exports.reverseMap    = reverseMap;
module.exports.UNCOLORED     = UNCOLORED;
module.exports.MARKER_OUTPUT = MARKER_OUTPUT;
module.exports.ISSUANCE      = ISSUANCE;
module.exports.TRANSFER      = TRANSFER;
