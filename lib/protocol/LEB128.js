'use strict';

var leb = require('leb');

/**
 * Provide operations for serializing/deserializing integer data into
 * variable-length LEB128 integer encoding [1].
 *
 * References:
 * [1] https://en.wikipedia.org/wiki/LEB128
 *
**/
var LEB128 = {

  /**
   * Encode an arbitrarily large positive integer value using a small
   * number of bytes. This function returns a Buffer containing the
   * byte values of the LEB128-encoded integer.
  **/
	encode: function (value) {

    if (value < 0) {
      throw new Error('Negative values are not supported');
    }

    return leb.encodeUInt64(value);

	},

  /**
   * Decode a data Buffer containing an LEB128-encoded integer.
  **/
	decode: function (data) {

    if (!Buffer.isBuffer(data)) {
      throw new Error('Data to decode must be a Buffer object');
    }

    return leb.decodeUInt64(data).value;

	}

};


// Public API for this object
module.exports = LEB128;
