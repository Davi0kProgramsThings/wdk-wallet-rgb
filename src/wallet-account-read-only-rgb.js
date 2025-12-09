// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict'

import { WalletAccountReadOnly } from '@tetherto/wdk-wallet'
import { WalletManager } from './libs/rgb-sdk.js'

/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */

// @review
// @author Davide Casale <davide.casale@tether.io>
// Rename this type to 'RgbTransactionReceipt' and add an export for it in the index.js file to make
// it accessible outside of the package:
// /** @typedef {import('rgb-sdk').Transaction} RgbTransactionReceipt */
/** @typedef {import('rgb-sdk').Transaction} Transaction */

/**
 * @typedef {Object} RgbTransaction
 * @property {string} to - The transaction's recipient.
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // Always accept big integers too for numerical inputs that represent crypto currency amounts:
   // * @property {number | bigint} value - The amount of bitcoins to send to the recipient (in satoshis).
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

/**
 * @typedef {Object} RgbWalletConfig
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // Instead of using the string type, use a string literal union of all the field's valid values:
   // * @property {'mainnet' | 'testnet' | 'regtest'} [network] - The network (default: "regtest").
 * @property {string} [network] - The network (default: "regtest").
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // I suggest using camel case instead of snake case for javascript property names:
   // * @property {string} [rgbNodeEndpoint] - The RGB node endpoint (default: "http://127.0.0.1:8000").
   //
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // The actual default value of this field is not localhost:
   // * @property {string} [rgbNodeEndpoint] - The RGB node endpoint (default: "https://rgb-node.test.thunderstack.org").
 * @property {string} [rgb_node_endpoint] - The RGB node endpoint (default: "http://127.0.0.1:8000").
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // Instead of a generic object type, use the 'GeneratedKeys' type from your rgb-sdk:
   // * @property {import('rgb-sdk').GeneratedKeys} [keys] - The wallet keys from rgb-sdk.
   //
   // If not all keys are necessary, you can pick just some of them:
   // * @property {Pick<import('rgb-sdk').GeneratedKeys, 'account_xpub_vanilla' | 'account_xpub_colored' | 'master_fingerprint'>} [keys] - The wallet keys from rgb-sdk.
   //
   // Even better, you can define a type definition for the import in the top-level of the file and then reference it here:
   // * @property {Keys} [keys] - The wallet keys from rgb-sdk.
 * @property {Object} [keys] - The wallet keys from rgb-sdk.
   // @review
   // @author Davide Casale <davide.casale@tether.io>
   // Add and implement the 'transferMaxFee' property (take a look at how it works in @tetherto/wdk-wallet-evm):
   // * @property {number | bigint} [transferMaxFee] - The maximum fee amount for transfer operations.
 */

export default class WalletAccountReadOnlyRgb extends WalletAccountReadOnly {
  /**
   * Creates a new RGB read-only wallet account.
   *
   * @param {string} address - The account's address.
   * @param {RgbWalletConfig} [config] - The configuration object.
   */
  constructor (address, config = {}) {
    super(address)

    /**
     * The read-only wallet account configuration.
     *
     * @protected
     * @type {RgbWalletConfig}
     */
    this._config = config
    /** @private */
    this._wallet = null
  }

  // @review
  // @author Davide Casale <davide.casale@tether.io>
  // You can perform these checks and initialize the wallet manager instance directly in the constructor,
  // since no async operation is actually happening in this method. This would make the implementation of
  // the other methods slightly more straightforward, as they wouldn't need to include a call to the
  // '_initializeWallet' anymore.
  /**
   * Initializes the RGB wallet manager for read-only operations
   * @private
   */
  async _initializeWallet () {
    if (this._wallet) {
      return this._wallet
    }

    if (!this._config.keys) {
      throw new Error('Wallet keys are required for read-only account')
    }

    const { keys } = this._config
    const network = this._config.network || 'testnet'
    const rgbNodeEndpoint = this._config.rgb_node_endpoint || 'https://rgb-node.test.thunderstack.org'

    this._wallet = new WalletManager({
      xpub_van: keys.account_xpub_vanilla,
      xpub_col: keys.account_xpub_colored,
      master_fingerprint: keys.master_fingerprint,
      network,
      rgb_node_endpoint: rgbNodeEndpoint
    })

    return this._wallet
  }

  /**
   * Returns the account's bitcoin balance.
   *
   * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
   */
  async getBalance () {
    await this._initializeWallet()
    const balance = await this._wallet.getBtcBalance()
    return BigInt(balance.vanilla.settled || 0)
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The asset ID of the token.
   * @returns {Promise<bigint>} The token balance (in base unit).
   */
  async getTokenBalance (tokenAddress) {
    await this._initializeWallet()
    const balance = await this._wallet.getAssetBalance(tokenAddress)
    return BigInt(balance || 0)
  }

  /**
   * Quotes the costs of a send transaction operation.
   *
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // The name of this argument should be 'tx', and its type should be 'RgbTransaction':
     // * @param {RgbTransaction} tx - The transaction.
   * @param {Transaction} options - The transaction.
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // Remove the following two @param tags:
   * @param {string} options.to - The transaction's recipient.
   * @param {number} options.value - The amount of bitcoins to send to the recipient (in satoshis).
   * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
   */
  async quoteSendTransaction (options) {
    const feeRate = await this._wallet.estimateFeeRate(1)
    const psbt = await this._wallet.sendBtcBegin({
      address: options.to,
      amount: options.value,
      fee_rate: Math.round(feeRate)
    })
    const signedPsbt = await this._wallet.signPsbt(psbt)
    const { fee } = await this._wallet.estimateFee(signedPsbt)
    return { fee: BigInt(fee) }
  }

  /**
   * Quotes the costs of a transfer operation.
   *
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // This is not how jsdoc actually works. Instead of importing the 'TransferOptions' type from @tetherto/wdk-wallet,
     // uou should define it again yourself in the top-level of this file in order to be compatible with the original type
     // and to extend it with the new fields. This is how it should look:
     // /**
     //  * @typedef {Object} TransferOptions
     //  * @property {string} token - The RGB asset ID to transfer.
     //  * @property {string} recipient - The recipient's invoice (from blindReceive).
     //  * @property {number | bigint} amount - The amount to transfer.
     //  * @property {number} [feeRate] - The fee rate in sat/vbyte (default: 1).
     //  * @property {number} [minConfirmations] - Minimum confirmations (default: 1).
     //  * @property {Object} [witnessData] - The witness data.
     //
     // Make sure to use token, recipient and amount instead of asset_id, to and value in order to make the type
     // compatible with the original 'TransferOptions', which is necessary to avoid breaking solid and making the
     // signature of the 'quoteTransfer' method incompatible with the superclass's.
     //
     // I also suggest to import or define a better type for the 'witnessData' field, instead of using a generic object
     // type.
   * @param {TransferOptions} options - The transfer's options.
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // Remove all the following @property tags:
   * @property {string} options.asset_id - The RGB asset ID to transfer.
   * @property {string} options.to - The recipient's invoice (from blindReceive).
   * @property {number} options.value - The amount to transfer.
   * @property {Object} [options.witness_data] - The witness data.
   * @property {number} [options.fee_rate] - The fee rate in sat/vbyte (default: 1).
   * @property {number} [options.min_confirmations] - Minimum confirmations (default: 1).
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   *
   */
  async quoteTransfer (options) {
    const feeRate = await this._wallet.estimateFeeRate(1)
    const psbt = await this._wallet.sendBegin({
      invoice: options.to,
      asset_id: options.asset_id,
      witness_data: options.witness_data,
      amount: options.value,
      fee_rate: Math.round(feeRate),
      min_confirmations: options.min_confirmations
    })
    const signedPsbt = await this._wallet.signPsbt(psbt)
    const { fee } = await this._wallet.estimateFee(signedPsbt)
    return { fee: BigInt(fee) }
  }

  /**
   * Returns a transaction's receipt.
   *
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<Transaction | null>} The receipt, or null if the transaction has not been created yet.
   */
  async getTransactionReceipt (hash) {
    const transactions = await this._wallet.listTransactions()
    const tx = transactions.find(t => t.txid === hash)
    return tx || null
  }

  /**
   * Returns a transfer's receipt.
   *
   * @param {string} hash - The transfer's hash.
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // The 'RgbTransfer' type doesn't exist. Define it and rename it to 'RgbTransferReceipt'. Remember to also
     // add an export for it in the index.js file:
     // * @returns {Promise<RgbTransferReceipt | null>} The receipt, or null if the transfer has not been created yet.
   * @returns {Promise<RgbTransfer | null>} The receipt, or null if the transfer has not been created yet.
   */
  async getTransferReceipt (hash) {
    const transfers = await this._wallet.listTransfers()
    const transfer = transfers.find(t => t.txid === hash)
    return transfer || null
  }
}
