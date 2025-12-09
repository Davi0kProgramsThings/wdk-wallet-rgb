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

// @review
// @author Davide Casale <davide.casale@tether.io>
// You can just do:
// export { WalletManager, createWallet, deriveKeysFromSeed, Network } from 'rgb-sdk'

import * as rgbSdk from 'rgb-sdk'

const { WalletManager, createWallet, deriveKeysFromSeed, Network } = rgbSdk

export { WalletManager, createWallet, deriveKeysFromSeed, Network }
