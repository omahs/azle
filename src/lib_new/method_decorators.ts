import { ic } from './ic';
import { IDL, Principal } from './index';

import {
    CandidClass,
    ReturnCandidClass,
    toParamIDLTypes,
    toReturnIDLType,
    CandidTypesDefs,
    CandidDef,
    extractCandid
} from './utils';
import { display } from './utils';
import {
    Service,
    serviceCall,
    ServiceConstructor,
    serviceDecorator
} from './service';

export type Manual<T> = void;

type Mode =
    | 'init'
    | 'postUpgrade'
    | 'query'
    | 'update'
    | 'heartbeat'
    | 'inspectMessage';

const modeToCandid = {
    query: ' query',
    update: ''
};

type MethodArgs = { manual: boolean };

// Until we can figure how how to type check Funcs, Variants, and Records we are just going to have to use any here
// export function query(paramsIdls: CandidClass[], returnIdl: ReturnCandidClass) {
export function init(paramsIdls: any[]): any {
    return (target: any, key: string, descriptor?: PropertyDescriptor) => {
        return setupCanisterMethod(
            target,
            paramsIdls,
            [],
            'init',
            false,
            key,
            descriptor
        );
    };
}

// Until we can figure how how to type check Funcs, Variants, and Records we are just going to have to use any here
// export function query(paramsIdls: CandidClass[], returnIdl: ReturnCandidClass) {
export function postUpgrade(paramsIdls: any[]): any {
    return (target: any, key: string, descriptor?: PropertyDescriptor) => {
        return setupCanisterMethod(
            target,
            paramsIdls,
            [],
            'postUpgrade',
            false,
            key,
            descriptor
        );
    };
}

export function heartbeat(
    target: any,
    key: string,
    descriptor?: PropertyDescriptor
) {
    return setupCanisterMethod(
        target,
        [],
        [],
        'heartbeat',
        false,
        key,
        descriptor
    );
}

export function inspectMessage(
    target: any,
    key: string,
    descriptor?: PropertyDescriptor
) {
    return setupCanisterMethod(
        target,
        [],
        [],
        'inspectMessage',
        false,
        key,
        descriptor
    );
}

// Until we can figure how how to type check Funcs, Variants, and Records we are just going to have to use any here
// export function query(paramsIdls: CandidClass[], returnIdl: ReturnCandidClass) {
export function query(
    paramsIdls: any[],
    returnIdl: any,
    args: MethodArgs = { manual: false }
): any {
    return (target: any, key: string, descriptor?: PropertyDescriptor) => {
        if (descriptor === undefined) {
            serviceDecorator(target, key, paramsIdls, returnIdl);
            // TODO: We need to call addIDLforMethodtoServiceConstructor
        } else {
            return setupCanisterMethod(
                target,
                paramsIdls,
                returnIdl,
                'query',
                args.manual,
                key,
                descriptor
            );
        }
    };
}

// export function update(
//     paramsIdls: CandidClass[],
//     returnIdl: ReturnCandidClass
export function update(
    paramsIdls: any[],
    returnIdl: any,
    args: MethodArgs = { manual: false }
): any {
    return (target: any, key: string, descriptor?: PropertyDescriptor) => {
        if (descriptor === undefined) {
            serviceDecorator(target, key, paramsIdls, returnIdl);
        } else {
            return setupCanisterMethod(
                target,
                paramsIdls,
                returnIdl,
                'update',
                args.manual,
                key,
                descriptor
            );
        }
    };
}

function newTypesToStingArr(newTypes: CandidTypesDefs): string[] {
    return Object.entries(newTypes).map(
        ([name, candid]) => `type ${name} = ${candid}`
    );
}

function handleRecursiveParams(
    idls: CandidClass[]
): [IDL.Type<any>[], CandidDef[], CandidTypesDefs] {
    const paramIdls = toParamIDLTypes(idls);
    const paramInfo = paramIdls.map((paramIdl) => display(paramIdl, {}));
    return [paramIdls, ...extractCandid(paramInfo, {})];
}

function handleRecursiveReturn(
    returnIdl: ReturnCandidClass,
    paramCandidTypeDefs: CandidTypesDefs
): [IDL.Type<any>[], CandidDef[], CandidTypesDefs] {
    const returnIdls = toReturnIDLType(returnIdl);
    const returnInfo = returnIdls.map((returnIdl) => display(returnIdl, {}));
    return [returnIdls, ...extractCandid(returnInfo, paramCandidTypeDefs)];
}

function setupCanisterMethod(
    target: any,
    paramsIdls: CandidClass[],
    returnIdl: ReturnCandidClass,
    mode: Mode,
    manual: boolean,
    key: string,
    descriptor: PropertyDescriptor
) {
    const paramCandid = handleRecursiveParams(paramsIdls);
    const returnCandid = handleRecursiveReturn(returnIdl, paramCandid[2]);

    if (target.constructor._azleCanisterMethods === undefined) {
        target.constructor._azleCanisterMethods = {
            queries: [],
            updates: []
        };
    }

    if (target.constructor._azleCandidInitParams === undefined) {
        target.constructor._azleCandidInitParams = [];
    }

    if (mode === 'init' || mode === 'postUpgrade') {
        target.constructor._azleCandidInitParams = paramCandid[1];
    }

    if (target.constructor._azleCandidTypes === undefined) {
        target.constructor._azleCandidTypes = [];
    }

    target.constructor._azleCandidTypes = [
        ...target.constructor._azleCandidTypes,
        ...newTypesToStingArr(returnCandid[2])
    ];

    if (mode === 'query' || mode === 'update') {
        if (target.constructor._azleCandidMethods === undefined) {
            target.constructor._azleCandidMethods = [];
        }

        target.constructor._azleCandidMethods.push(
            `${key}: (${paramCandid[1].join(', ')}) -> (${returnCandid[1]})${
                modeToCandid[mode]
            };`
        );

        if (target instanceof Service) {
            addIDLForMethodToServiceConstructor(
                target.constructor,
                key,
                paramsIdls,
                returnIdl,
                mode
            );
        }
    }

    if (mode === 'query') {
        target.constructor._azleCanisterMethods.queries.push({
            name: key
        });
    }

    if (mode === 'update') {
        target.constructor._azleCanisterMethods.updates.push({
            name: key
        });
    }

    if (mode === 'heartbeat') {
        target.constructor._azleCanisterMethods.heartbeat = {
            name: key
        };
    }

    if (mode === 'inspectMessage') {
        target.constructor._azleCanisterMethods.inspect_message = {
            name: key
        };
    }

    const originalMethod = descriptor.value;

    // This must remain a function and not an arrow function
    // in order to set the context (this) correctly
    descriptor.value = function (...args: any[]) {
        if (args[0] === '_AZLE_CROSS_CANISTER_CALL') {
            const serviceCallInner = serviceCall(key, paramsIdls, returnIdl);
            return serviceCallInner.call(this, ...args);
        }

        if (mode === 'heartbeat') {
            originalMethod.call(this);
            return;
        }

        // TODO: Recursively convert principals (that should be services) into services.

        paramCandid[0].forEach((candid) => console.log(candid.display()));

        // Keep in mind each thing in paramCandid[0] is a regular javascript type
        // So we can just make a function on the ParamIDL thing that takes that javascript value and does the thing with it
        // Go though each param
        // if its a record
        //     go though each member and do this check
        // if its a variant
        //     go though each member and do this check
        // if it's a tuple
        //     go though each member and do this check
        // if it's an opt
        //     go though each member and do this check
        // etc
        //     go though each member and do this check
        // if it's a service
        //     Get the service constructor
        const decoded = IDL.decode(paramCandid[0], args[0]);
        // TODO when this is ready to go just use this instead of decoded
        // Then do a similar thing on the way out
        let newDecoded = paramsIdls.map((candid, index) => {
            if (
                'convertCandidJsToAzleJs' in candid &&
                typeof candid.convertCandidJsToAzleJs === 'function'
            ) {
                return candid.convertCandidJsToAzleJs(decoded[index]);
            }
            return candid;
        });

        const firstDecoded = decoded[0];

        const theirServiceClass = paramsIdls[0];

        const serviceFixedFirstItem =
            firstDecoded instanceof Principal
                ? new theirServiceClass(firstDecoded)
                : firstDecoded;

        const serviceFixedDecoded = [serviceFixedFirstItem];

        // loop through the param IDLs
        // see if any of those are children of service

        // Recursively go through the decoded stuff and wrap any services in `new ThatServiceType()`

        console.log(`About to call method with: ${serviceFixedDecoded}`);

        const result = originalMethod.apply(this, serviceFixedDecoded);

        if (
            mode === 'init' ||
            mode === 'postUpgrade' ||
            mode === 'inspectMessage'
        ) {
            return;
        }

        const is_promise =
            result !== undefined &&
            result !== null &&
            typeof result.then === 'function';

        if (is_promise) {
            result
                .then((result) => {
                    const encodeReadyResult =
                        result === undefined ? [] : [result];

                    const encoded = IDL.encode(
                        returnCandid[0],
                        encodeReadyResult
                    );

                    // TODO this won't be accurate because we have most likely had
                    // TODO cross-canister calls
                    console.log(
                        `final instructions: ${ic.instructionCounter()}`
                    );

                    if (!manual) {
                        ic.replyRaw(new Uint8Array(encoded));
                    }
                })
                .catch((error) => {
                    ic.trap(error.toString());
                });
        } else {
            // TODO: Recursively convert services to principals
            const serviceFixedResult =
                result instanceof Service ? result.canisterId : result;

            const encodeReadyResult =
                result === undefined ? [] : [serviceFixedResult];

            if (!manual) {
                const encoded = IDL.encode(returnCandid[0], encodeReadyResult);
                ic.replyRaw(new Uint8Array(encoded));
            }

            console.log(`final instructions: ${ic.instructionCounter()}`);
        }
    };

    if (mode === 'init') {
        globalThis._azleInitName = key;
    }

    if (mode === 'postUpgrade') {
        globalThis._azlePostUpgradeName = key;
    }

    return descriptor;
}

/**
 * Stores an IDL representation of the canister method into a private
 * `_azleFunctionInfo` object on the provided constructor. If that property doesn't
 * exist, then it will be added as a side-effect.
 *
 * @param constructor The class on which to store the IDL information. This
 *   should probably be a Service. This type should probably be tightened down.
 * @param methodName The public name of the canister method
 * @param paramIdls The IDLs of the parameters, coming from the `@query` and
 *   `@update` decorators.
 * @param returnIdl The IDL of the return type, coming from the `@query` and
 *   `@update` decorators.
 * @param mode The mode in which the method should be executed.
 */
function addIDLForMethodToServiceConstructor<T>(
    constructor: T & ServiceConstructor,
    methodName: string,
    paramIdls: CandidClass[],
    returnIdl: ReturnCandidClass,
    mode: 'query' | 'update'
): void {
    if (constructor._azleFunctionInfo === undefined) {
        constructor._azleFunctionInfo = {};
    }

    //  TODO: Technically, there is a possibility that the method name already
    // exists. We may want to handle that case.

    constructor._azleFunctionInfo[methodName] = {
        mode,
        paramIdls,
        returnIdl
    };
}
