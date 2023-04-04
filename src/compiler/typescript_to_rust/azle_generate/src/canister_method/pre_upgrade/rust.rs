use crate::canister_method::{rust, AnnotatedFnDecl};

pub fn generate(pre_upgrade_fn_decl: &AnnotatedFnDecl) -> proc_macro2::TokenStream {
    let call_to_pre_upgrade_js_function = rust::generate_call_to_js_function(&pre_upgrade_fn_decl);

    let function_name = pre_upgrade_fn_decl.get_function_name();

    quote::quote! {
        crate::ref_cells::BOA_CONTEXT.with(|boa_context_ref_cell| {
            let mut _azle_boa_context = boa_context_ref_cell.borrow_mut();

            crate::ref_cells::set_method_name(&#function_name.to_string());

            #call_to_pre_upgrade_js_function
        })
    }
}
