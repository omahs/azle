import {
    AzleCandid,
    TypeTable,
    Type,
    IDL,
    Visitor,
    toReadableString,
    Pipe
} from '.';

abstract class AzlePrimitiveTest<T> extends AzleCandid {
    checkType(t: Type): Type {
        if (this.name !== t.name) {
            throw new Error(
                `type mismatch: type on the wire ${t.name}, expect type ${this.name}`
            );
        }
        return t;
    }
    _buildTypeTableImpl(typeTable: TypeTable) {
        // No type table encoding for Primitive types.
        return;
    }

    static getIdl() {
        return T.getIdl();
    }

    display() {
        return this.idl.display();
    }

    accept<D, R>(v: Visitor<D, R>, d: D): R {
        return this.idl.accept(v, d);
    }
    covariant(x: any): x is any {
        return this.idl.covariant(x);
    }
    encodeValue(x: any) {
        return this.idl.encodeValue(x);
    }
    encodeType() {
        return IDL.Bool.encodeType();
    }
    decodeValue(b: Pipe, t: Type) {
        return IDL.Bool.decodeValue(b, t);
    }
    get name() {
        return IDL.Bool.name;
    }
}

abstract class AzlePrimitive extends AzleCandid {
    idl: Type;

    constructor(idl: Type) {
        super();
        this.idl = idl;
    }

    checkType(t: Type): Type {
        if (this.name !== t.name) {
            throw new Error(
                `type mismatch: type on the wire ${t.name}, expect type ${this.name}`
            );
        }
        return t;
    }
    _buildTypeTableImpl(typeTable: TypeTable) {
        // No type table encoding for Primitive types.
        return;
    }

    getIdl() {
        return this.idl;
    }

    display() {
        return this.idl.display();
    }

    accept<D, R>(v: Visitor<D, R>, d: D): R {
        return this.idl.accept(v, d);
    }
    covariant(x: any): x is any {
        return this.idl.covariant(x);
    }
    encodeValue(x: any) {
        return this.idl.encodeValue(x);
    }
    encodeType() {
        return IDL.Bool.encodeType();
    }
    decodeValue(b: Pipe, t: Type) {
        return IDL.Bool.decodeValue(b, t);
    }
    get name() {
        return IDL.Bool.name;
    }
}

export class bool extends AzlePrimitive {
    static getIdl() {
        return IDL.Bool;
    }

    static display() {
        return bool.getIdl().display();
    }

    accept<D, R>(v: Visitor<D, R>, d: D): R {
        return IDL.Bool.accept(v, d);
    }
    covariant(x: any): x is any {
        return IDL.Bool.covariant(x);
    }
    encodeValue(x: any) {
        return IDL.Bool.encodeValue(x);
    }
    encodeType() {
        return IDL.Bool.encodeType();
    }
    decodeValue(b: Pipe, t: Type) {
        return IDL.Bool.decodeValue(b, t);
    }
    get name() {
        return IDL.Bool.name;
    }
}

export class blob extends AzlePrimitive {
    static getIdl() {
        return IDL.Vec(IDL.Nat8);
    }

    static display() {
        return blob.getIdl().display();
    }
}
class empty extends AzlePrimitive {
    static getIdl() {
        return IDL.Empty;
    }

    static display(): String {
        return empty.getIdl().display();
    }
}

class int extends AzlePrimitive {
    static getIdl() {
        return IDL.Int;
    }

    static display() {
        return int.getIdl().display();
    }
}
class int8 extends AzlePrimitive {
    static getIdl() {
        return IDL.Int8;
    }

    static display() {
        return int8.getIdl().display();
    }
}
class int16 extends AzlePrimitive {
    static getIdl() {
        return IDL.Int16;
    }

    static display() {
        return int16.getIdl().display();
    }
}
class int32 extends AzlePrimitive {
    static getIdl() {
        return IDL.Int32;
    }

    static display() {
        return int32.getIdl().display();
    }
}
class int64 extends AzlePrimitive {
    static getIdl() {
        return IDL.Int64;
    }

    static display() {
        return int64.getIdl().display();
    }
}
class nat extends AzlePrimitive {
    static getIdl() {
        return IDL.Nat;
    }

    static display() {
        return nat.getIdl().display();
    }
}
class nat8 extends AzlePrimitive {
    static getIdl() {
        return IDL.Nat8;
    }

    static display() {
        return nat8.getIdl().display();
    }
}
class nat16 extends AzlePrimitive {
    static getIdl() {
        return IDL.Nat16;
    }

    static display() {
        return nat16.getIdl().display();
    }
}
class nat32 extends AzlePrimitive {
    static getIdl() {
        return IDL.Nat32;
    }

    static display() {
        return nat32.getIdl().display();
    }
}
class nat64 extends AzlePrimitive {
    static getIdl() {
        return IDL.Nat64;
    }

    static display() {
        return nat64.getIdl().display();
    }
}
class Null extends AzlePrimitive {
    static getIdl() {
        return IDL.Null;
    }

    static display() {
        return Null.getIdl().display();
    }
}
class reserved extends AzlePrimitive {
    static getIdl() {
        return IDL.Reserved;
    }

    static display() {
        return reserved.getIdl().display();
    }
}
class text extends AzlePrimitive {
    static getIdl() {
        return IDL.Text;
    }

    static display() {
        return text.getIdl().display();
    }
}
class float32 extends AzlePrimitive {
    static getIdl() {
        return IDL.Float32;
    }

    static display() {
        return float32.getIdl().display();
    }
}
class float64 extends AzlePrimitive {
    static getIdl() {
        return IDL.Float64;
    }

    static display() {
        return float64.getIdl().display();
    }
}
class Principal extends AzlePrimitive {
    static getIdl() {
        return IDL.Principal;
    }

    static display() {
        return Principal.getIdl().display();
    }
}
