import { IDL } from '@dfinity/candid';

type VisitorData = { js_data: any; js_class: any };
type VisitorResult = any;

// We need the data to be the information we need make the class
// We need the return type to be the fully formed java classes.
// We need the type so that we can use the right constructor

/*
Lets take a look at how that would look for a Service
class MyService extends Service {
  @update
  myUpdate();

  @query()
  myQuery();
}

We would expect to receive a principal because that is all that we can get from the decoded values
So we don't actually care about the funcs. Any sub services will have to have the information on
how to make it's self because we will not and cannot have tht information. but any caniter id should
be known by the canister we are expanding

So we are going to have MyService the class be in the info. We will have the principal
be in the info and our return type will be an instance of MyService
data: {js_data: any, js_class: any}
*/

// This Visitor just needs to take a principal and turn it into a service
class Func {}

class DecodeVisitor extends IDL.Visitor<VisitorData, VisitorResult> {
    visitService(t: IDL.ServiceClass, data: VisitorData): VisitorResult {
        return new data.js_class(data.js_data);
    }
    visitPrimitive<T>(
        t: IDL.PrimitiveType<T>,
        data: VisitorData
    ): VisitorResult {
        return data.js_data;
    }
    /**
     * For visiting tuples we will want to visit each component and then spread the
     * results of that into a tuple. In order to visit each one we need the Tuple
     * data to look like this
     * [value1, value2, value3]
     * and the class is going to need to look like
     * {_azleCandidComponents: [idlable1, idlable2, idlable3]}
     * @param t
     * @param components
     * @param data
     * @returns
     */
    visitTuple<T extends any[]>(
        t: IDL.TupleClass<T>,
        components: IDL.Type<any>[],
        data: VisitorData
    ): VisitorResult {
        const fields = components.map((value, index) =>
            value.accept(this, {
                js_data: data.js_data[index],
                js_class: data.js_class._azleCandidComponents[index]
            })
        );
        return [...fields];
    }
    visitOpt<T>(
        t: IDL.OptClass<T>,
        ty: IDL.Type<T>,
        data: VisitorData
    ): VisitorResult {
        if (data.js_data.length === 0) {
            return data.js_data;
        }
        const candid = ty.accept(this, {
            js_data: data.js_data[0],
            js_class: data.js_class._azleCandidComponent
        });
        return [candid];
    }
    visitVec<T>(
        t: IDL.VecClass<T>,
        ty: IDL.Type<T>,
        data: VisitorData
    ): VisitorResult {
        const vec_elems = data.js_data.map((array_elem) => {
            ty.accept(this, {
                js_data: array_elem,
                js_class: data.js_class._azleCandidComponentType
            });
        });
        return [...vec_elems];
    }
    /**
     * Lets see the funcs are going to similar to the services....
     * We have a function name and a principal id
     * @param t
     * @param data
     * @returns
     */
    visitFunc(t: IDL.FuncClass, data: VisitorData): VisitorResult {
        return new data.js_class(data.js_data.principal, data.js_data.name);
    }
    visitRec<T>(
        t: IDL.RecClass<T>,
        ty: IDL.ConstructType<T>,
        data: VisitorData
    ): VisitorResult {
        // TODO
    }
    visitRecord(
        t: IDL.RecordClass,
        fields: [string, IDL.Type<any>][],
        data: VisitorData
    ): VisitorResult {
        const candidFields = fields.reduce((acc, [key, value]) => {
            const fieldData = data.js_data._azleCandidMap[key];
            const fieldClass = {};

            return {
                ...acc,
                [key]: value.accept(this, {
                    js_data: fieldData,
                    js_class: fieldClass
                })
            };
        }, {});
        return data.js_class.create(candidFields);
    }
    visitVariant(
        t: IDL.VariantClass,
        fields: [string, IDL.Type<any>][],
        data: VisitorData
    ): VisitorResult {
        const candidFields = fields.map(([key, value]) =>
            value.accept(this, { ...data, is_on_service: false })
        );
        const candid = extractCandid(candidFields);
        const fields_string = fields.map(
            ([key, value], index) =>
                key + (value.name === 'null' ? '' : ':' + candid[0][index])
        );
        return [`variant {${fields_string.join('; ')}}`, candid[1]];
    }
}

export function do_thing() {
    const myVisitor = new DecodeVisitor();
    const myNode = IDL.Record({ myName: IDL.Bool });
    const myRec = IDL.Rec();
    myRec.fill(IDL.Record({ first: myNode, second: myRec }));
    const myService = IDL.Service({
        myQuery: IDL.Func([myNode], [myRec]),
        myFunckyQuery: IDL.Func([IDL.Func([IDL.Int], [IDL.Nat])], [IDL.Empty])
    });
    let myResult = myService.accept(myVisitor, {
        usedRecClasses: [],
        is_on_service: false
    });
    const candidTypes = myResult[1];
    const candidString = myResult[0];
    console.log('The final result is', myResult);
    console.log('The candid file would be');
    console.log(
        Object.entries(candidTypes)
            .map(([name, type]) => `type ${name} = type`)
            .join('\n')
    );
    console.log(candidString);
}

do_thing();
