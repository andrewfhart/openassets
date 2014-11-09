'use strict';

/**
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