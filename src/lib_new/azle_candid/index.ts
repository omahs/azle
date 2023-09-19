import { IDL } from '@dfinity/candid';
import { TypeTable } from './dcandid';
import { PipeArrayBuffer as Pipe } from '@dfinity/candid/lib/cjs/utils/buffer';
import { Type, Visitor } from '@dfinity/candid/lib/cjs/idl';

export { IDL } from '@dfinity/candid';
export { TypeTable, toReadableString } from './dcandid';
export { PipeArrayBuffer as Pipe } from '@dfinity/candid/lib/cjs/utils/buffer';
export { Type, Visitor } from '@dfinity/candid/lib/cjs/idl';

type Candid = string;
type CandidDependencies = string[];

/* This class should be work as a replacement for IDL.Type
 */
export abstract class AzleCandid<T = any> {
    abstract readonly name: string;

    static getIdl(): Type {
        throw new Error('getIdl must be implemented by child class.');
    }

    static toCandid(): [Candid, CandidDependencies] {
        throw new Error(
            'toCandidDisplay method must be implemented by child class'
        );
    }

    static display(): String {
        return this.getIdl().display();
    }

    abstract accept<D, R>(v: Visitor<D, R>, d: D): R;

    valueToString(x: T): string {}

    buildTypeTable(typeTable: TypeTable): void {}
    /**
     * Assert that JavaScript's `x` is the proper type represented by this
     * Type.
     */
    abstract covariant(x: any): x is T;
    /**
     * Encode the value. This needs to be public because it is used by
     * encodeValue() from different types.
     * @internal
     */
    abstract encodeValue(x: T): ArrayBuffer;
    /**
     * Implement `I` in the IDL spec.
     * Encode this type for the type table.
     */
    abstract encodeType(typeTable: TypeTable): ArrayBuffer;
    abstract checkType(t: Type): Type;
    abstract decodeValue(x: Pipe, t: Type): T;
    protected abstract _buildTypeTableImpl(typeTable: TypeTable): void;
}
