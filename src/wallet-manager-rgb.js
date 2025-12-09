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

import WalletManager from '@tetherto/wdk-wallet'
import { deriveKeysFromSeed } from './libs/rgb-sdk.js'

const MEMPOOL_SPACE_URL = 'https://mempool.space'

/** @typedef {import('@tetherto/wdk-wallet').FeeRates} FeeRates */

/** @typedef {import('./wallet-account-read-only-rgb.js').RgbWalletConfig} RgbWalletConfig */

export default class WalletManagerRgb extends WalletManager {
  /**
   * Creates a new wallet manager for the RGB.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {RgbWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    super(seed, config)

    /** @private */
    this._network = config.network || 'testnet'
    /** @private */
    this._rgbNodeEndpoint = config.rgb_node_endpoint || 'https://rgb-node.test.thunderstack.org'
    /** @private */
    this._keys = null
  }

  /**
   * Initializes the wallet keys from the seed phrase
   * @private
   */
  async _initializeKeys () {
    if (this._keys) {
      return this._keys
    }

    if (!this.seed) {
      throw new Error('RGB wallet requires a BIP-39 mnemonic seed phrase')
    }
    // Derive keys from mnemonic
    this._keys = await deriveKeysFromSeed(this._network, this.seed)
    return this._keys
  }

  /**
   * Returns the account always at index 0 RGB does not support multiple BIP-44
   *
   * @example
   * const account = await wallet.getAccount();
   * @returns {Promise<WalletAccountRgb>} The account.
   */
  async getAccount () {
    const index = 0 //
    if (!this._accounts[index]) {
      await this._initializeKeys()
      const { default: WalletAccountRgb } = await import('./wallet-account-rgb.js')
      const account = await WalletAccountRgb.at(
        this.seed,
        {
          // @review
          // @author Davide Casale <davide.casale@tether.io>
          // You can safely remove the following line:
          ...this._config,
          network: this._network,
          rgb_node_endpoint: this._rgbNodeEndpoint,
          keys: this._keys
        }
      )

      this._accounts[index] = account
    }

    return this._accounts[index]
  }

  /**
   * Restores the account from a wallet backup.

     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // It would be better to define and export a new type definition in the top-level of the file that includes
     // the specification for the backup and password fields instead of using an anonymous type.
     //
     // You can then use it here with:
     // * @param {RgbWalletConfig & RestoreAccountOptions} restoreConfig - Restore configuration containing backup details.
   * @param {RgbWalletConfig & {
   *   backup: Buffer | Uint8Array | ArrayBuffer | import('node:stream').Readable,
   *   password: string,
   * }} restoreConfig - Restore configuration containing backup details.
   * @returns {Promise<WalletAccountRgb>} The restored account.
   */
  async restoreAccountFromBackup (restoreConfig = {}) {
    const index = 0
    const { default: WalletAccountRgb } = await import('./wallet-account-rgb.js')

    await this._initializeKeys()

    const config = {
      // @review
      // @author Davide Casale <davide.casale@tether.io>
      // You can safely remove the following line:
      ...this._config,
      ...restoreConfig,
      network: this._network,
      rgb_node_endpoint: this._rgbNodeEndpoint,
      keys: this._keys
    }

    // @review
    // @author Davide Casale <davide.casale@tether.io>
    // This condition will never be true since if the seed is not given the _initializeKeys
    // method will throw first, so you can remove this check:
    if (!config.keys) {
      throw new Error('Wallet keys are required to restore from backup.')
    }

    const account = await WalletAccountRgb.fromBackup(this.seed, config)
    this._accounts[index] = account

    // @review
    // @author Davide Casale <davide.casale@tether.io>
    // The _keys property will already be set to config.keys, so you can remove this line:
    this._keys = config.keys

    return account
  }

  /**
   * Returns the wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
     // @review
     // @author Davide Casale <davide.casale@tether.io>
     // Change the return type of methods that always throw to never:
     // * @returns {Promise<never>} The account.
   * @returns {Promise<WalletAccountRgb>} The account.
   */
  async getAccountByPath (path) {
    throw new Error('Method not supported on the RGB')
  }

  /**
   * Returns the current fee rates.
   *
   * @returns {Promise<FeeRates>} The fee rates (in satoshis).
   */
  async getFeeRates () {
    const response = await fetch(`${MEMPOOL_SPACE_URL}/api/v1/fees/recommended`)

    const { fastestFee, hourFee } = await response.json()

    return {
      normal: BigInt(hourFee),
      fast: BigInt(fastestFee)
    }
  }
}
