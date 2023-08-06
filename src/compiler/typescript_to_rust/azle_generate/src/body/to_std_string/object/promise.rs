use proc_macro2::TokenStream;
use quote::quote;

pub fn generate() -> TokenStream {
    quote! {
        fn js_promise_object_to_string(
            js_object: &boa_engine::JsObject,
            context: &mut boa_engine::Context,
        ) -> String {
            try_js_promise_object_to_string(js_object, context).unwrap_or_else(|js_error| {
                let cause = js_error.to_std_string(&mut *context);

                format!(
                    "InternalError: Encountered an error while serializing a Promise\n  \
                        [cause]: {cause}"
                )
            })
        }

        fn try_js_promise_object_to_string(
            js_object: &boa_engine::JsObject,
            context: &mut boa_engine::Context,
        ) -> Result<String, boa_engine::JsError> {
            let js_promise =
                boa_engine::object::builtins::JsPromise::from_object(js_object.clone())?;
            let state = js_promise.state()?;

            let promise_string_representation = match state {
                boa_engine::builtins::promise::PromiseState::Pending => {
                    "Promise {<pending>}".to_string()
                }
                boa_engine::builtins::promise::PromiseState::Fulfilled(js_value) => {
                    format!(
                        "Promise {{<fulfilled>: {}}}",
                        js_value.to_std_string(&mut *context)
                    )
                }
                boa_engine::builtins::promise::PromiseState::Rejected(js_value) => {
                    format!(
                        "Promise {{<rejected>: {}}}",
                        js_value.to_std_string(&mut *context)
                    )
                }
            };

            Ok(promise_string_representation)
        }
    }
}
