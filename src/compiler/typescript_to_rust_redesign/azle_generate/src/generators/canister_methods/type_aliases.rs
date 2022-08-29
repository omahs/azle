use std::collections::{HashMap, HashSet};

use proc_macro2::TokenStream;
use quote::{format_ident, quote};
use swc_ecma_ast::TsTypeAliasDecl;

use super::{ts_type_to_rust_type, RustType, StructInfo};

/**
 * Loops through all of the dependant types, finds the corresponding ts types in
 * the type aliases, converts them to a rust type, and inserts it into the
 * result map
 */
pub fn generate_type_alias_token_streams(
    type_alias_dependant_types: &HashSet<&String>,
    ast_type_alias_decls: &Vec<TsTypeAliasDecl>,
    inline_dep_count: u32,
) -> (HashMap<String, TokenStream>, Vec<StructInfo>, u32) {
    let type_alias_lookup = generate_hash_map(ast_type_alias_decls);

    println!(
        "We generating the type alias token streams for {:#?}",
        type_alias_dependant_types
    );
    // For each dependant type, generate a dependency map and add it to the overall dependency map
    // TODO I'm guessing that we aren't going to want acc to be mutable
    type_alias_dependant_types.iter().fold(
        (HashMap::new(), vec![], inline_dep_count),
        |(mut all_type_alias_dependencies, mut all_inline_types, count), dependant_type| {
            println!("We are about to generate the map for {}", dependant_type);
            let type_alias_decl = type_alias_lookup.get(dependant_type.clone());
            let (dependency_map, inline_types, count) = match type_alias_decl {
                Some(type_alias_decl) => {
                    let (dependency_map, inline_deps, count) =
                        generate_dependencies_map_for(type_alias_decl, &type_alias_lookup, count);
                    (dependency_map, inline_deps, count)
                }
                None => {
                    todo!("ERROR: Dependant Type [{dependant_type}] not found type alias list!")
                }
            };
            all_type_alias_dependencies.extend(dependency_map.into_iter());
            all_inline_types.extend(inline_types);
            println!{"We are expecting the length to be 1 and the length is actually {}", all_inline_types.len()}
            (all_type_alias_dependencies, all_inline_types, count)
        },
    )
}

/**
 * Generate a dependency map for the given type alias decl using the given type
 * alias lookup map.
 *
 * As a reminder the type alias decl looks like this
 * TsTypeAliasDeclaration {
 *     id: Identifier; (Will have the name of the type alias)
 *     typeAnnotation: TsType; (Will have the type that the alias is aliasing)
 * }
 *
 * This will get the name from the id, parse the type from the typeAnnotation.
 * Then return a map with the idea as the key and an alias token stream as the value.
 *
 * {
 *     id: `type id = TsTypeAsTokenStream`;
 * }
 *
 * It is possible that the TsType from the typeAnnotation will also have
 * dependencies. In this case we will collect the dependency map for that type
 * as well and extend the result to include that information.
 *
 * {
 *     id: `type id = {member1: sub_id1, member2: sub_id2}`;
 *     sub_id1: `type sub_id1 = SubTsType1AsTokenStream`;
 *     sub_id2: `type sub_id2 = SubTsType2AsTokenStream`;
 * }
 */
fn generate_dependencies_map_for(
    type_alias_decl: &TsTypeAliasDecl,
    type_alias_lookup: &HashMap<String, TsTypeAliasDecl>,
    inline_struct_count: u32,
) -> (HashMap<String, TokenStream>, Vec<StructInfo>, u32) {
    let mut inline_struct_count = inline_struct_count;
    // TODO I feel like this might run into some namespace issues
    let ts_type_name = type_alias_decl.id.sym.chars().as_str().to_string();
    println!("IN THE RECURSIVE FUNCTION for {}", ts_type_name);
    let ts_type_alias_ident = format_ident!("{}", ts_type_name);

    let ts_type = *type_alias_decl.type_ann.clone();

    let mut dependency_map: HashMap<String, TokenStream> = HashMap::new();

    let (aliased_rust_type, count) =
        ts_type_to_rust_type(&ts_type, inline_struct_count, Some(&ts_type_alias_ident));
    inline_struct_count = count;

    let aliased_type_sub_dependencies = aliased_rust_type.get_type_alias_dependency();
    let (aliased_type_sub_dependency_map, top_level_inline_deps, count) =
        aliased_type_sub_dependencies.iter().fold(
            (HashMap::new(), vec![], inline_struct_count),
            |(mut acc, mut acc_inline_deps, count), type_alias_name_thing_rename| {
                let decl = type_alias_lookup.get(type_alias_name_thing_rename);
                match decl {
                    Some(decl) => {
                        let (aliased_type_sub_dependency_map, sub_inline_deps, count) =
                            generate_dependencies_map_for(decl, type_alias_lookup, count);
                        acc.extend(aliased_type_sub_dependency_map);
                        acc_inline_deps.extend(sub_inline_deps);
                        (acc, acc_inline_deps, count)
                    }
                    None => todo!("Handle if we can't find the type in the dictionary"),
                }
            },
        );
    dependency_map.extend(aliased_type_sub_dependency_map);
    println!(
        "the length of the inline_types is {}",
        top_level_inline_deps.len()
    );
    inline_struct_count = count;

    let aliased_type_ident = aliased_rust_type.get_type_ident();
    match aliased_rust_type.clone() {
        RustType::Struct(struct_info) => {
            dependency_map.insert(struct_info.name, struct_info.structure);
        }
        _ => {
            dependency_map.insert(
                ts_type_name,
                quote! {
                    type #ts_type_alias_ident = #aliased_type_ident;
                },
            );
        }
    };
    let inline_dep = match aliased_rust_type.get_inline_dependencies() {
        Some(dependency) => vec![dependency],
        None => vec![],
    };
    let inline_dep = vec![]; // TODO obviously we dont' want this to be empty
    (dependency_map, inline_dep, inline_struct_count)
}

fn generate_hash_map(
    ast_type_alias_decls: &Vec<TsTypeAliasDecl>,
) -> HashMap<String, TsTypeAliasDecl> {
    ast_type_alias_decls
        .iter()
        .fold(HashMap::new(), |mut acc, ast_type_alias_decl| {
            let type_alias_names = ast_type_alias_decl.id.sym.chars().as_str().to_string();
            acc.insert(type_alias_names, ast_type_alias_decl.clone());
            acc
        })
}
