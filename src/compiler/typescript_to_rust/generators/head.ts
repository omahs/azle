import { Rust } from '../../../types';

export function generateHead(): Rust {
    return `
        // This code is automatically generated by Azle

        #![allow(dead_code)]
        #![allow(non_camel_case_types)]
        #![allow(non_snake_case)]
        #![allow(unused_imports)]
        #![allow(unused_variables)]

        // TODO old safe working way
        // TODO I want to make sure I am doing this safely, but I can't do async code from within a with block
        // thread_local! {
        //     static BOA_CONTEXT: std::cell::RefCell<boa_engine::Context> = std::cell::RefCell::new(boa_engine::Context::default());
        // }

        // TODO new unsafe working way
        // TODO we are treading in dangerous territory now
        // TODO study this: https://mmapped.blog/posts/01-effective-rust-canisters.html
        // TODO try to get help from those on the forum
        // TODO it might be fine since we only ever obtain one mutable reference per query/update call
        // TODO we do not allow the user to obtain multiple mutable references, we only have one
        // TODO as long as we enforce that, we might be fine
        static mut BOA_CONTEXT_OPTION: Option<boa_engine::Context> = None;

        fn custom_getrandom(_buf: &mut [u8]) -> Result<(), getrandom::Error> { Ok(()) }

        getrandom::register_custom_getrandom!(custom_getrandom);
    `;
}