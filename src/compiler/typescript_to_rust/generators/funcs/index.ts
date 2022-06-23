import * as tsc from 'typescript';
import { Rust } from '../../../../types';
import { getFuncTypeAliasDeclarations } from '../call_functions';

export function generate_func_structs_and_impls(
    sourceFiles: readonly tsc.SourceFile[]
): {
    func_structs_and_impls: Rust;
    func_names: string[]
} {
    const func_type_alias_declarations = getFuncTypeAliasDeclarations(sourceFiles);
    const func_structs_and_impls = generate_func_structs_and_impls_from_type_alias_declarations(func_type_alias_declarations);
    const func_names = func_type_alias_declarations.map((type_alias_declaration) => type_alias_declaration.name.escapedText.toString());

    return {
        func_structs_and_impls: /* rust */ `
            /// A marker type to match unconstrained callback arguments
            #[derive(Debug, Clone, Copy, PartialEq, Deserialize)]
            pub struct ArgToken;

            impl CandidType for ArgToken {
                fn _ty() -> candid::types::Type {
                    candid::types::Type::Empty
                }

                fn idl_serialize<S: candid::types::Serializer>(&self, _serializer: S) -> Result<(), S::Error> {
                    // We cannot implement serialize, since our type must be \`Empty\` in order to accept anything.
                    // Attempting to serialize this type is always an error and should be regarded as a compile time error.
                    unimplemented!("Token is not serializable")
                }
            }

            ${func_structs_and_impls.join('\n')}
        `,
        func_names
    };
}

function generate_func_structs_and_impls_from_type_alias_declarations(
    typeAliasDeclarations: tsc.TypeAliasDeclaration[]
): Rust[] {
    return typeAliasDeclarations.map(
        (typeAliasDeclaration) => {
            return generate_func_struct_and_impls_from_type_alias_declaration(
                typeAliasDeclaration
            );
        },
        []
    );
}

function generate_func_struct_and_impls_from_type_alias_declaration(
    typeAliasDeclaration: tsc.TypeAliasDeclaration
): string {
    if (typeAliasDeclaration.type.kind !== tsc.SyntaxKind.TypeReference) {
        throw new Error('This cannot happen');
    }

    const typeRefenceNode = typeAliasDeclaration.type as tsc.TypeReferenceNode;

    if (typeRefenceNode.typeArguments === undefined) {
        throw new Error('This cannot happen');
    }

    const firstTypeArgument = typeRefenceNode.typeArguments[0];

    if (firstTypeArgument.kind !== tsc.SyntaxKind.FunctionType) {
        throw new Error('This cannot happen');
    }

    const function_type_node = firstTypeArgument as tsc.FunctionTypeNode;

    return generate_func_struct_and_impls_from_function_type_node(
        function_type_node,
        typeAliasDeclaration.name.escapedText.toString()
    );
}

// TODO add proper licensing
function generate_func_struct_and_impls_from_function_type_node(
    function_type_node: tsc.FunctionTypeNode,
    typeAliasName: string
): string {
    return /* rust */ `
        #[derive(Debug, Clone)]
        struct ${typeAliasName}<ArgToken = self::ArgToken>(
            pub candid::Func,
            pub std::marker::PhantomData<ArgToken>,
        );

        impl AzleIntoJsValue for ${typeAliasName} {
            fn azle_into_js_value(self, context: &mut boa_engine::Context) -> boa_engine::JsValue {
                self.0.azle_into_js_value(context)
            }
        }

        impl AzleTryFromJsValue<${typeAliasName}<ArgToken>> for boa_engine::JsValue {
            fn azle_try_from_js_value(self, context: &mut boa_engine::Context) -> Result<${typeAliasName}<ArgToken>, AzleTryFromJsValueError> {
                let candid_func: candid::Func = self.azle_try_from_js_value(context).unwrap();
                Ok(candid_func.into())
            }
        }

        impl<ArgToken: CandidType> CandidType for ${typeAliasName}<ArgToken> {
            fn _ty() -> candid::types::Type {
                // TODO this is the part that needs to be generated from the TypeScript type for type
                // TODO basically go grab all of the Funcs, grab the query/update, and grab the args and return type
                // TODO should not be too bad actually
                candid::types::Type::Func(candid::types::Function {
                    modes: vec![candid::parser::types::FuncMode::Query],
                    args: vec![candid::types::Type::Text],
                    rets: vec![candid::types::Type::Text]
                })
            }

            fn idl_serialize<S: candid::types::Serializer>(&self, serializer: S) -> Result<(), S::Error> {
                self.0.idl_serialize(serializer)
            }
        }

        impl<'de, ArgToken> Deserialize<'de> for ${typeAliasName}<ArgToken> {
            fn deserialize<D: serde::de::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
                candid::Func::deserialize(deserializer).map(Self::from)
            }
        }
        
        impl<ArgToken> From<candid::Func> for ${typeAliasName}<ArgToken> {
            fn from(f: candid::Func) -> Self {
                Self(f, std::marker::PhantomData)
            }
        }
        
        impl<ArgToken> From<${typeAliasName}<ArgToken>> for candid::Func {
            fn from(c: ${typeAliasName}<ArgToken>) -> Self {
                c.0
            }
        }
        
        impl<ArgToken> std::ops::Deref for ${typeAliasName}<ArgToken> {
            type Target = candid::Func;
            fn deref(&self) -> &candid::Func {
                &self.0
            }
        }
        
        impl<ArgToken> std::ops::DerefMut for ${typeAliasName}<ArgToken> {
            fn deref_mut(&mut self) -> &mut candid::Func {
                &mut self.0
            }
        }
    `;
}