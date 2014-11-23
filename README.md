openassets
==========

A JavaScript implementation of the [Open Assets Protocol](https://github.com/OpenAssets/open-assets-protocol).

About the Open Assets Protocol
------------------------------
The Open Assets Protocol is a simple and powerful protocol built on top of the Bitcoin Blockchain. It allows issuance and transfer of user-created assets. The Open Assets Protocol is an evolution of the concept of colored coins.

The protocol specification is publicly maintained at the official [OpenAssets repository](https://github.com/OpenAssets/open-assets-protocol). The [reference implementation](https://github.com/OpenAssets/openassets) exists as a Python module. This project provides a translation to JavaScript, packaged as an `npm` module.

Installation
------------

OpenAssets is provided as an [npm](https://www.npmjs.org/package/openassets) module for easy installation:

```npm install openassets```

Configuration
-------------

OpenAssets provides a recursive backtracking "coloring engine" that, when given a Bitcoin transaction hash and a transaction output index, is capable of traversing the Bitcoin blockchain to identify and trace colored coin issuance and transfer activity conforming to the Open Assets Protocol specification. To do so, the software establishes a connection to the [JSON-RPC port of a full Bitcoin node](https://en.bitcoin.it/wiki/API_reference_%28JSON-RPC%29). At the moment, the configuration needed for connecting to the node is expected to exist in the following environment variables, which must be specified when invoking Node:

* `JSONRPC_USER`  The username to use when connecting to the Bitcoin node's JSON-RPC service
* `JSONRPC_PASS`  The password corresponding to the username
* `JSONRPC_HOST`  The IP address or DNS name of the Bitcoin node
* `JSONRPC_PORT`  The port on which the JSON-RPC service is listening (default: 8332 (mainnet))
* `JSONRPC_PROTOCOL` The protocol to use: either 'http' or 'https'

See the "Running Tests" section for an example of how to provide these environment variables to Node from the command line.

Usage
-----

The following is a heavily documented example that provides a high-level idea of what this engine does. Many more detailed examples and documentation are available at the repository for the Python [reference implemenation](https://github.com/OpenAssets/openassets).

```JavaScript
// Required modules
var openassets = require('openassets'),
    // Bitcore provides an excellent JSON-RPC client implementation. Substitute your favorite.
    RpcClient  = require('bitcore/lib/RpcClient');

// JSON-RPC connection information (read from environment variables)
config = {
  host:     process.env.JSONRPC_HOST,
  port:     process.env.JSONRPC_PORT,
  user:     process.env.JSONRPC_USER,
  pass:     process.env.JSONRPC_PASS,
  protocol: process.env.JSONRPC_PROTOCOL
};

// A wrapper to generate a "transaction provider" given a config.
// 
// For generality, connection to the Bitcoin JSON-RPC service is
// externalized into the concept of a "transaction provider" that is 
// expected to conform to the following simple API: given a Bitcoin
// transaction hash and a callback function, the provider must
// populate the callback with the results of the 'getRawTransaction'
// JSON-RPC call.
getTransactionProvider = function getTransactionProvider(config) {
  return function transactionProvider(hash, cb) {
    var rpcc = new RpcClient(config);
    rpcc.getRawTransaction(hash,cb);
  };
};

// Create an instance of the Open Assets ColoringEngine, and pass to
// it a configured transaction provider
ce = new openassets.ColoringEngine(getTransactionProvider(config));

// Use the coloring engine to obtain information about a transaction. In
// this case, get the 0th output of a known Open Assets 'issuance' transaction.
// The first argument is the hash of the transaction, the 2nd is the index
// of the output to retrieve, and the third is a callback function that will
// be populated with the asset ID and asset quantity information, if any, associated with
// that output.
ce.getOutput(
  '77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c',
  0, function (err, data) {

  // If anything went wrong, say so
  if (err) console.log(err.message);

  // Print the asset information as a raw TransactionOutput object
  console.log(data);

  // Use the TransactionOutput.toString() method to get a more readable representation
  console.log(data.toString());

});
```

The example above can be run via the command line using Node and providing the necessary environment variables as follows:

```bash
~$ JSONRPC_USER=<username> JSONRPC_PASS=<password> JSONRPC_HOST=<host_or_ip> JSONRPC_PORT=3332 JSONRPC_PROTOCOL=https node example.js
```

The expected output of the example above is:
```bash
{ value: 600,
  script: <Buffer 76 a9 14 d7 17 48 3b 55 54 67 05 50 f8 e7 9a 3b 95 8d 29 4e cf 80 60 88 ac>,
  assetId: <Buffer 1d 27 fd 8f ac 0c da 22 1b 3f cc c6 ec c1 fc 46 cd 91 78 d0>,
  assetQuantity: 1,
  outputType: 2 }
TransactionOutput(value=600, script=0x76a914d717483b5554670550f8e79a3b958d294ecf806088ac, assetId=0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0, assetQuantity=1, outputType=ISSUANCE)
```
... in which we see that the ColoringEngine has identified this output as representing the issuance of 1 unit of the asset with id `0x1d27fd8fac0cda221b3fccc6ecc1fc46cd9178d0`. For reference, the transaction used in this example can be viewed using a Bitcoin [blockchain explorer](https://insight.bitpay.com/77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c) and via the [Coinprism.info explorer](https://www.coinprism.info/tx/77a6bbc65aa0326015835a3813778df4a037c15fb655e8678f234d8e2fc7439c). The former provides raw value and script information, the latter provides a confirmation of the assetID and asset quantity details we obtained via the command line. 


Running Tests
-------------
The test suite uses [Mocha](http://mochajs.org/) which must be available on your system. It can be easily installed via: `npm install -g mocha`.

Tests can be found in the `/tests` directory. To run the tests, simply provide the required connection information as environment variables, followed by invoking mocha on whichever test suite you wish to run:

```bash
~$ JSONRPC_USER=<username> JSONRPC_PASS=<password> JSONRPC_HOST=<host_or_ip> JSONRPC_PORT=3332 JSONRPC_PROTOCOL=https mocha test/<suite>.js
```

To Do
-----

This is a work in progress, with the ultimate aim of providing a complete JavaScript implementation of the protocol. The major unfinished work is the transaction builder ([reference implementation]( https://github.com/OpenAssets/openassets/blob/master/openassets/transactions.py)) that facilitates building and submitting Open Assets transactions to the bitcoin network. This section of the README will be updated when that is complete.

Contributing
------------

Contributions in _any_ form (i.e.: code, documentation, comments, questions, etc.) are warmly welcomed. If contributing code, please fork this repository and then open a Pull Request with your changes. If you've found a bug or have a question, comment, or request, please open an Issue.

