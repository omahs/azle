use proc_macro2::TokenStream;
use quote::quote;

mod object;

pub fn generate() -> TokenStream {
    let js_object_to_string_function_definition = object::generate();

    quote! {
        trait ToStdString {
            fn to_std_string(
                self,
                nesting_level: usize,
                context: &mut boa_engine::Context,
            ) -> String;
        }

        impl ToStdString for boa_engine::JsError {
            fn to_std_string(
                self,
                nesting_level: usize,
                context: &mut boa_engine::Context,
            ) -> String {
                self.to_opaque(context)
                    .to_std_string(nesting_level, context)
            }
        }

        impl ToStdString for boa_engine::JsValue {
            fn to_std_string(
                self,
                nesting_level: usize,
                context: &mut boa_engine::Context,
            ) -> String {
                match &self {
                    boa_engine::JsValue::BigInt(bigint) => format!("{}n", bigint.to_string()),
                    boa_engine::JsValue::Boolean(boolean) => boolean.to_string(),
                    boa_engine::JsValue::Integer(integer) => integer.to_string(),
                    boa_engine::JsValue::Null => "null".to_string(),
                    boa_engine::JsValue::Object(object) => {
                        js_object_to_string(&self, nesting_level, &object, context)
                    }
                    boa_engine::JsValue::Rational(rational) => rational.to_std_string(0, context),
                    boa_engine::JsValue::String(string) => string
                        .to_std_string() // TODO: Wrap these in single quotes, double, or backticks
                        .unwrap_or_else(|err| format!("InternalError: {err}")),
                    boa_engine::JsValue::Symbol(symbol) => symbol.to_string(),
                    boa_engine::JsValue::Undefined => "undefined".to_string(),
                }
            }
        }

        impl ToStdString for f64 {
            fn to_std_string(
                self,
                nesting_level: usize,
                context: &mut boa_engine::Context,
            ) -> String {
                if self.is_infinite() {
                    return if self.is_sign_negative() {
                        "-Infinity".to_string()
                    } else {
                        "Infinity".to_string()
                    };
                }

                self.to_string()
            }
        }

        #js_object_to_string_function_definition
    }
}
