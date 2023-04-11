pub fn generate() -> proc_macro2::TokenStream {
    quote::quote! {
        fn _azle_ic_reject_message(
            _this: &boa_engine::JsValue,
            _aargs: &[boa_engine::JsValue],
            context: &mut boa_engine::Context,
        ) -> boa_engine::JsResult<boa_engine::JsValue> {
            Ok(ic_cdk::api::call::reject_message().try_into_vm_value(context).unwrap())
        }
    }
}
