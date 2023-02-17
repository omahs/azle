// Copyright 2021 DFINITY Stiftung

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at

//    http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

// The original license for the DFINITY code can be found here: https://github.com/dfinity/ic/blob/master/LICENSE
// This file contains derivative works licensed as MIT: https://github.com/demergent-labs/azle/blob/main/LICENSE

// Taken in part from: https://github.com/dfinity/interface-spec/blob/master/spec/ic.did

import {
    blob,
    CanisterResult,
    ExternalCanister,
    Func,
    nat,
    nat64,
    Opt,
    Query,
    $query,
    Principal,
    update,
    Variant
} from '../../index';

import {
    GetBalanceArgs,
    GetCurrentFeePercentilesArgs,
    GetUtxosArgs,
    GetUtxosResult,
    MillisatoshiPerByte,
    Satoshi,
    SendTransactionArgs
} from './bitcoin';

export {
    BitcoinAddress,
    BitcoinNetwork,
    BlockHash,
    GetBalanceArgs,
    GetCurrentFeePercentilesArgs,
    GetUtxosArgs,
    GetUtxosResult,
    MillisatoshiPerByte,
    Outpoint,
    Page,
    Satoshi,
    SendTransactionArgs,
    SendTransactionError,
    Utxo,
    UtxosFilter
} from './bitcoin';

export type CanisterId = Principal;
export type UserId = Principal;
export type WasmModule = blob;

export type CanisterSettings = {
    controllers: Opt<Principal[]>;
    compute_allocation: Opt<nat>;
    memory_allocation: Opt<nat>;
    freezing_threshold: Opt<nat>;
};

export type DefiniteCanisterSettings = {
    controllers: Principal[];
    compute_allocation: nat;
    memory_allocation: nat;
    freezing_threshold: nat;
};

export type CreateCanisterArgs = {
    settings: Opt<CanisterSettings>;
};

export type CreateCanisterResult = {
    canister_id: CanisterId;
};

export type UpdateSettingsArgs = {
    canister_id: Principal;
    settings: CanisterSettings;
};

export type InstallCodeArgs = {
    mode: InstallCodeMode;
    canister_id: CanisterId;
    wasm_module: WasmModule;
    arg: blob;
};

export type InstallCodeMode = Variant<{
    install: null;
    reinstall: null;
    upgrade: null;
}>;

export type UninstallCodeArgs = {
    canister_id: CanisterId;
};

export type StartCanisterArgs = {
    canister_id: CanisterId;
};

export type StopCanisterArgs = {
    canister_id: CanisterId;
};

export type CanisterStatusArgs = {
    canister_id: Principal;
};

export type CanisterStatusResult = {
    status: CanisterStatus;
    settings: DefiniteCanisterSettings;
    module_hash: Opt<blob>;
    memory_size: nat;
    cycles: nat;
};

export type CanisterStatus = Variant<{
    running: null;
    stopping: null;
    stopped: null;
}>;

export type DeleteCanisterArgs = {
    canister_id: CanisterId;
};

export type DepositCyclesArgs = {
    canister_id: CanisterId;
};

export type ProvisionalCreateCanisterWithCyclesArgs = {
    amount: Opt<nat>;
    settings: Opt<CanisterSettings>;
};

export type ProvisionalCreateCanisterWithCyclesResult = {
    canister_id: CanisterId;
};

export type ProvisionalTopUpCanisterArgs = {
    canister_id: CanisterId;
    amount: nat;
};

export type HttpRequestArgs = {
    url: string;
    max_response_bytes: Opt<nat64>;
    method: HttpMethod;
    headers: HttpHeader[];
    body: Opt<blob>;
    transform: Opt<HttpTransform>;
};

export type HttpTransform = {
    function: HttpTransformFunc;
    context: blob;
};

export type HttpTransformFunc = Func<
    Query<(args: HttpTransformArgs) => HttpResponse>
>;

export type HttpTransformArgs = {
    response: HttpResponse;
    context: blob;
};

export type HttpMethod = Variant<{
    get: null;
    head: null;
    post: null;
}>;

export type HttpHeader = {
    name: string;
    value: string;
};

export type HttpResponse = {
    status: nat;
    headers: HttpHeader[];
    body: blob;
};

export type KeyId = {
    curve: EcdsaCurve;
    name: string;
};

export type EcdsaCurve = Variant<{
    secp256k1: null;
}>;

export type EcdsaPublicKeyArgs = {
    canister_id: Opt<Principal>;
    derivation_path: blob[];
    key_id: KeyId;
};

export type SignWithEcdsaArgs = {
    message_hash: blob;
    derivation_path: blob[];
    key_id: KeyId;
};

export type EcdsaPublicKeyResult = {
    public_key: blob;
    chain_code: blob;
};

export type SignWithEcdsaResult = {
    signature: blob;
};

export type ManagementOld = Canister<{
    bitcoin_get_balance(args: GetBalanceArgs): CanisterResult<Satoshi>;
    bitcoin_get_current_fee_percentiles(
        args: GetCurrentFeePercentilesArgs
    ): CanisterResult<MillisatoshiPerByte[]>;
    bitcoin_get_utxos(args: GetUtxosArgs): CanisterResult<GetUtxosResult>;
    bitcoin_send_transaction(args: SendTransactionArgs): CanisterResult<null>;
    create_canister(
        args: CreateCanisterArgs
    ): CanisterResult<CreateCanisterResult>;
    update_settings(args: UpdateSettingsArgs): CanisterResult<void>;
    install_code(args: InstallCodeArgs): CanisterResult<void>;
    uninstall_code(args: UninstallCodeArgs): CanisterResult<void>;
    start_canister(args: StartCanisterArgs): CanisterResult<void>;
    stop_canister(args: StopCanisterArgs): CanisterResult<void>;
    canister_status(
        args: CanisterStatusArgs
    ): CanisterResult<CanisterStatusResult>;
    delete_canister(args: DeleteCanisterArgs): CanisterResult<void>;
    deposit_cycles(args: DepositCyclesArgs): CanisterResult<void>;
    raw_rand(): CanisterResult<blob>;
    http_request(args: HttpRequestArgs): CanisterResult<HttpResponse>;
    provisional_create_canister_with_cycles(
        args: ProvisionalCreateCanisterWithCyclesArgs
    ): CanisterResult<ProvisionalCreateCanisterWithCyclesResult>;
    provisional_top_up_canister(
        args: ProvisionalTopUpCanisterArgs
    ): CanisterResult<void>;
    ecdsa_public_key(
        args: EcdsaPublicKeyArgs
    ): CanisterResult<EcdsaPublicKeyResult>;
    sign_with_ecdsa(
        args: SignWithEcdsaArgs
    ): CanisterResult<SignWithEcdsaResult>;
}>;

export class Management extends ExternalCanister {
    @update
    bitcoin_get_balance: (args: GetBalanceArgs) => CanisterResult<Satoshi>;

    @update
    bitcoin_get_current_fee_percentiles: (
        args: GetCurrentFeePercentilesArgs
    ) => CanisterResult<MillisatoshiPerByte[]>;

    @update
    bitcoin_get_utxos: (args: GetUtxosArgs) => CanisterResult<GetUtxosResult>;

    @update
    bitcoin_send_transaction: (
        args: SendTransactionArgs
    ) => CanisterResult<null>;

    @update
    create_canister: (
        args: CreateCanisterArgs
    ) => CanisterResult<CreateCanisterResult>;

    @update
    update_settings: (args: UpdateSettingsArgs) => CanisterResult<void>;

    @update
    install_code: (args: InstallCodeArgs) => CanisterResult<void>;

    @update
    uninstall_code: (args: UninstallCodeArgs) => CanisterResult<void>;

    @update
    start_canister: (args: StartCanisterArgs) => CanisterResult<void>;

    @update
    stop_canister: (args: StopCanisterArgs) => CanisterResult<void>;

    @update
    canister_status: (
        args: CanisterStatusArgs
    ) => CanisterResult<CanisterStatusResult>;

    @update
    delete_canister: (args: DeleteCanisterArgs) => CanisterResult<void>;

    @update
    deposit_cycles: (args: DepositCyclesArgs) => CanisterResult<void>;

    @update
    raw_rand: () => CanisterResult<blob>;

    @update
    http_request: (args: HttpRequestArgs) => CanisterResult<HttpResponse>;

    @update
    provisional_create_canister_with_cycles: (
        args: ProvisionalCreateCanisterWithCyclesArgs
    ) => CanisterResult<ProvisionalCreateCanisterWithCyclesResult>;

    @update
    provisional_top_up_canister: (
        args: ProvisionalTopUpCanisterArgs
    ) => CanisterResult<void>;

    @update
    ecdsa_public_key: (
        args: EcdsaPublicKeyArgs
    ) => CanisterResult<EcdsaPublicKeyResult>;

    @update
    sign_with_ecdsa: (
        args: SignWithEcdsaArgs
    ) => CanisterResult<SignWithEcdsaResult>;
}

export const management_canister = new Management(
    Principal.fromText('aaaaa-aa')
);
