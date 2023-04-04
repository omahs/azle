use proc_macro2::TokenStream;

use crate::canister_method::{rust, AnnotatedFnDecl};

pub fn generate(post_upgrade_fn_decl_option: Option<&AnnotatedFnDecl>) -> TokenStream {
    let call_to_post_upgrade_js_function =
        rust::maybe_generate_call_to_js_function(&post_upgrade_fn_decl_option);

    let function_name = match post_upgrade_fn_decl_option {
        Some(post_upgrade_fn_decl) => post_upgrade_fn_decl.get_function_name(),
        None => "DOES_NOT_EXIST".to_string(),
    };

    quote::quote! {
        crate::ref_cells::BOA_CONTEXT.with(|boa_context_ref_cell| {
            let mut _azle_boa_context = boa_context_ref_cell.borrow_mut();

            crate::ref_cells::set_method_name(&#function_name.to_string());

            ic_object::register(&mut _azle_boa_context);

            _azle_boa_context.eval(format!(
                "let exports = {{}}; {compiled_js}",
                compiled_js = crate::javascript::MAIN_JS
            )).or_trap(&mut _azle_boa_context);

            #call_to_post_upgrade_js_function

            ic_cdk_timers::set_timer(core::time::Duration::new(0, 0), crate::random::_cdk_rng_seed);
        });
    }
}
