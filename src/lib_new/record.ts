import { IDL } from './index';
import { CandidClass, Parent, processMap } from './utils';

// Without this default constructor we get errors when initializing variants and
// records. While the decorators are able to add constructors they are not
// communicating that change to the type checker. If we can get it to do that
// then we can get rid of this class
export abstract class Record {
    constructor(args: any) {
        if (
            Object.entries(this.constructor._azleCandidMap).length !==
            Object.entries(args).length
        ) {
            throw `Wrong number of properties: expected ${
                Object.entries(this.constructor._azleCandidMap).length
            } got ${Object.entries(args).length}`;
        }

        for (const propertyName in this.constructor._azleCandidMap) {
            if (!(propertyName in args)) {
                throw `Missing property: ${propertyName}`;
            }
            this[propertyName] = args[propertyName];
        }
    }

    static getIDL(parents: Parent[]) {
        const idl = IDL.Rec();
        idl.fill(
            IDL.Record(
                processMap(this._azleCandidMap, [
                    ...parents,
                    {
                        idl: idl,
                        name: this.name
                    }
                ])
            )
        );
        return idl;
    }

    static create<T extends Constructor>(
        this: T,
        props: InstanceType<T>
    ): InstanceType<T> {
        return new this(props) as InstanceType<T>;
    }

    static convertCandidJsToAzleJs<T extends Constructor>(
        this: T,
        candidJs: T
    ) {
        let result = Object.entries(this._azleCandidMap).reduce(
            (acc, [name, idlLike]) => {
                if (
                    'convertCandidJsToAzleJs' in idlLike &&
                    typeof idlLike.convertCandidJsToAzleJs === 'function'
                ) {
                    return idlLike.convertCandidJsToAzleJs(candidJs[name]);
                }
                return {
                    ...acc,
                    [name]: candidJs[name]
                };
            },
            {}
        );
        // TODO use result to make an azle ready version of this record
        return new this(result) as InstanceType<T>;
    }

    convertAzleJsToCandidJs(): Record {
        // TODO implement this
        // Basically what we want to do is go though all of the members and see
        // if they need to be converted. I haven't figured out how to make it be
        // a record again... maybe just make an object literal with all of the
        // right names and types... I'm not sure
        // But the only thing that should be different right now is Services
        // which should be principals. Everything else only needs to undergo
        // this if it might have a service inside of it
        return this;
    }
}

type Constructor<T = {}> = new (...args: any[]) => T;

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
