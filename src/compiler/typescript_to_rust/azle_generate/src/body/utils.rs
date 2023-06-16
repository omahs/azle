use proc_macro2::TokenStream;
use quote::quote;

pub fn generate() -> TokenStream {
    quote! {
        fn call_global_js_function<T>(function_name: &str, param_rust_values: Vec<P>) -> Result<T, String>
        where
            P: impl CdkActTryIntoVmValue<&mut boa_engine::Context<'_>, boa_engine::JsValue>
        {
            BOA_CONTEXT_REF_CELL.with(|box_context_ref_cell| {
                let mut boa_context = box_context_ref_cell.borrow_mut();
                let uuid = uuid::Uuid::new_v4().to_string();

                UUID_REF_CELL.with(|uuid_ref_cell| {
                    let mut uuid_mut = uuid_ref_cell.borrow_mut();
                    *uuid_mut = uuid.clone();
                });

                METHOD_NAME_REF_CELL.with(|method_name_ref_cell| {
                    let mut method_name_mut = method_name_ref_cell.borrow_mut();
                    *method_name_mut = "getRandomnessDirectly".to_string();
                });

                MANUAL_REF_CELL.with(|manual_ref_cell| {
                    let mut manual_mut = manual_ref_cell.borrow_mut();
                    *manual_mut = false;
                });

                let params = param_rust_values
                    .iter()
                    .map(|rust_param| {
                        // TODO: Handle the unwrap here
                        rust_param.try_into_vm_value(&mut boa_context).unwrap()
                    })
                    .collect();

                let exports_js_value = unwrap_boa_result(
                    boa_context.eval_script(boa_engine::Source::from_bytes("exports")),
                    &mut boa_context,
                );
                let exports_js_object = exports_js_value.as_object().unwrap();

                let function_js_value = exports_js_object
                    .get(function_name, &mut boa_context)
                    .unwrap();
                let function_js_object = function_js_value.as_object().unwrap();

                let boa_return_value = unwrap_boa_result(
                    function_js_object.call(&boa_engine::JsValue::Null, &params, &mut boa_context),
                    &mut boa_context,
                );

                let final_return_value = async_await_result_handler(
                    &mut boa_context,
                    &boa_return_value,
                    &uuid,
                    function_name,
                    false,
                );

                final_return_value.try_from_vm_value(&mut *boa_context)
                    .map_err(|err| format!("Uncaught TypeError: {}", & err.0))
            })
        }
    }
}
