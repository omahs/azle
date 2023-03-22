import {
    CanisterResult,
    ic,
    $init,
    match,
    nat64,
    Opt,
    $postUpgrade,
    Principal,
    $query,
    Record,
    Service,
    serviceQuery,
    serviceUpdate,
    $update
} from 'azle';

//#region Performance
type PerfResult = Record<{
    wasmBodyOnly: nat64;
    wasmIncludingPrelude: nat64;
}>;

let perfResult: Opt<PerfResult> = null;

$query;
export function getPerfResult(): Opt<PerfResult> {
    return perfResult;
}

function recordPerformance(start: nat64, end: nat64): void {
    perfResult = {
        wasmBodyOnly: end - start,
        wasmIncludingPrelude: ic.performanceCounter(0)
    };
}
//#endregion

class WhoAmICanister extends Service {
    @serviceQuery
    installer: () => CanisterResult<Principal>;

    @serviceQuery
    argument: () => CanisterResult<Principal>;

    @serviceUpdate
    whoami: () => CanisterResult<Principal>;

    @serviceUpdate
    id: () => CanisterResult<Principal>;

    @serviceQuery
    idQuick: () => CanisterResult<Principal>;
}

// Initialize the variables to ensure that they aren't `undefined`.
// We use the zero principal but any principal could be used.
let install: Principal = Principal.fromText('aaaaa-aa');
let someone: Principal = Principal.fromText('aaaaa-aa');

// Manually save the calling principal and argument for later access.
$init;
export function init(somebody: Principal) {
    install = ic.caller();
    someone = somebody;
}

// Manually re-save these variables after new deploys.
$postUpgrade;
export function postUpgrade(somebody: Principal) {
    install = ic.caller();
    someone = somebody;
}

// Return the principal identifier of the wallet canister that installed this
// canister.
$query;
export function installer(): Principal {
    return install;
}

// Return the principal identifier that was provided as an installation
// argument to this canister.
$query;
export function argument(): Principal {
    return someone;
}

// Return the principal identifier of the caller of this method.
$update;
export function whoami(): Principal {
    const perfStart = ic.performanceCounter(0);

    const caller = ic.caller();

    const perfEnd = ic.performanceCounter(0);
    recordPerformance(perfStart, perfEnd);

    return caller;
}

// Return the principal identifier of this canister.
$update;
export async function id(): Promise<Principal> {
    const preXnetCallPerfStart = ic.performanceCounter(0);

    const thisCanister = new WhoAmICanister(ic.id());

    const preXnetCallPerfEnd = ic.performanceCounter(0);
    const result = await thisCanister.whoami().call();
    const postXnetCallPerfStart = ic.performanceCounter(0);

    const response = match(result, {
        Ok: (ok) => ok,
        Err: () => Principal.fromText('aaaaa-aa')
    });

    const postXnetCallPerfEnd = ic.performanceCounter(0);
    const preXnetCallPerf = preXnetCallPerfEnd - preXnetCallPerfStart;
    const postXnetCallPerf = postXnetCallPerfEnd - postXnetCallPerfStart;
    const totalPerf = preXnetCallPerf + postXnetCallPerf;
    perfResult = {
        wasmBodyOnly: totalPerf,
        wasmIncludingPrelude: ic.performanceCounter(0)
    };

    return response;
}

// Return the principal identifier of this canister via the global `ic` object.
// This is much quicker than `id()` above because it isn't making a cross-
// canister call to itself. Additionally, it can now be a `Query` which means it
// doesn't have to go through consensus.
$query;
export function idQuick(): Principal {
    return ic.id();
}
