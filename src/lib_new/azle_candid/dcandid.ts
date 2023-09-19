import { IDL } from '@dfinity/candid';

// This file is for stuff that we need from @dfinity/candid but that aren't exported from that package

const toReadableString_max = 400; // will not display arguments after 400chars. Makes sure 2mb blobs don't get inside the error

export declare class TypeTable {
    private _typs;
    private _idx;
    has(obj: IDL.ConstructType): boolean;
    add<T>(type: IDL.ConstructType<T>, buf: ArrayBuffer): void;
    merge<T>(obj: IDL.ConstructType<T>, knot: string): void;
    encode(): ArrayBuffer;
    indexOf(typeName: string): ArrayBuffer;
}

/**
 *
 * @param x
 * @returns {string}
 */
export function toReadableString(x: any): string {
    const str = JSON.stringify(x, (_key, value) =>
        typeof value === 'bigint' ? `BigInt(${value})` : value
    );
    return str && str.length > toReadableString_max
        ? str.substring(0, toReadableString_max - 3) + '...'
        : str;
}
