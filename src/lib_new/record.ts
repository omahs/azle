import { IDL } from '@dfinity/candid';

// Without this default constructor we get errors when initializing variants and
// records. While the decorators are able to add constructors they are not
// communicating that change to the type checker. If we can get it to do that
// then we can get rid of this class
export class Record {
    constructor(throwAway: any) {}
}

export function record<T extends new (...args: any[]) => any>(target: T): T {
    return class extends target {
        constructor(...args: any[]) {
            super(...args);
            if (
                Object.entries(target._azleCandidMap).length !==
                Object.entries(args).length
            ) {
                throw 'Wrong number of properties';
            }

            for (const propertyName in target._azleCandidMap) {
                if (!args[0][propertyName]) {
                    throw `Missing property: ${propertyName}`;
                }
                this[propertyName] = args[0][propertyName];
            }
        }

        static getIDL() {
            return IDL.Record(target._azleCandidMap);
        }
    };
}

// makeObjectLit() {
//     let result = {};
//     // @ts-ignore
//     for (const propertyName in target.constructor._azleCandidMap) {
//         // @ts-ignore
//         if (!target[propertyName]) {
//             throw `Missing property: ${propertyName}`;
//         }
//         result = {
//             ...result,
//             // @ts-ignore
//             [propertyName]: target[propertyName]
//         };
//     }
//     return result;
// }

// encode(): ArrayBuffer {
//     return IDL.encode(
//         // @ts-ignore
//         [target.constructor._azleEncoder],
//         [target.makeObjectLit()]
//     );
// }

// static decode(encoded: ArrayBuffer) {
//     // @ts-ignore
//     const objectLitArray = IDL.decode([target._azleEncoder], encoded);
//     return new target(objectLitArray[0]);
// }

// export function record<T extends new (...args: any[]) => any>(target: T) {
//     Object.getOwnPropertyNames(Record.prototype).forEach((name) => {
//         if (name !== 'constructor') {
//             target.prototype[name] = Record.prototype[name];
//         }
//     });
//     return target;
// }
