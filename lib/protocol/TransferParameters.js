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
 * TransferParameters
 *
 * Encapsulates the details of a Bitcoin or asset transfer
**/

/**
 * Constructor
 * @param array(SpendableOutput) unspentOutputs  The unspent outputs available for the transaction
 * @param Buffer                 toScript        The output script to which to send Bitcoin/assets
 * @param Buffer                 changeScript    The output script to which to send remaining change
 * @param int                    amount          The asset quantity or number of satoshis sent in the tx
**/
var TransferParameters = function (unspentOutputs, toScript, changeScript, amount) {
  self.unspentOutputs = unspentOutputs;
  self.toScript       = toScript;
  self.changeScript   = changeScript;
  self.amount         = amount;
};

// The public API for this object
module.exports = TransferParameters;
