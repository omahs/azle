use quote::{format_ident, quote};
use swc_ecma_ast::{
    TsKeywordTypeKind::{TsNullKeyword, TsVoidKeyword},
    TsType,
};

use crate::{canister_method::AnnotatedFnDecl, ts_ast::SourceMapped, Error};

pub fn generate(
    fn_decl: &SourceMapped<AnnotatedFnDecl>,
) -> Result<proc_macro2::TokenStream, Vec<Error>> {
    let function_name = fn_decl.get_function_name();

    let param_name_idents: Vec<proc_macro2::Ident> = fn_decl
        .build_params()?
        .iter()
        .map(|param| format_ident!("{}", param.get_prefixed_name()))
        .collect();

    let return_expression = generate_return_expression(fn_decl).map_err(|err| vec![err])?;

    Ok(quote! {
        BOA_CONTEXT_REF_CELL.with(|box_context_ref_cell| {
            let mut boa_context = box_context_ref_cell.borrow_mut();
            let params = vec![
                #(#param_name_idents),*
            ];
            let final_return_value = call_global_js_function(#function_name, &params);
            #return_expression
        })
    })
}

/// Generates the return expression for a canister method body
///
/// # Context
///
/// * `final_return_value: boa_engine::JsValue` - The value to be returned
///    unless this is a ManualReply method.
/// * `boa_context: &mut boa_engine::Context` - The current boa context
fn generate_return_expression(
    annotated_fn_decl: &SourceMapped<AnnotatedFnDecl>,
) -> Result<proc_macro2::TokenStream, Error> {
    if annotated_fn_decl.is_manual()? || annotated_fn_decl.is_promise()? {
        return Ok(quote! {
            ic_cdk::api::call::ManualReply::empty()
        });
    }

    let return_type = annotated_fn_decl.get_return_ts_type()?;

    let null_and_void_handler = match return_type {
        TsType::TsKeywordType(keyword) => match keyword.kind {
            TsNullKeyword => quote! {
                if !final_return_value.is_null() {
                    ic_cdk::api::trap("Uncaught TypeError: value is not of type 'null'");
                }
            },
            TsVoidKeyword => quote! {
                if !final_return_value.is_undefined() {
                    ic_cdk::api::trap("Uncaught TypeError: value is not of type 'void'");
                }
            },
            _ => quote! {},
        },
        _ => quote! {},
    };

    Ok(quote! {
        #null_and_void_handler
        match final_return_value.try_from_vm_value(&mut *boa_context) {
            Ok(return_value) => return_value,
            Err(e) => ic_cdk::api::trap(&format!("Uncaught TypeError: {}",&e.0))
        }
    })
}
