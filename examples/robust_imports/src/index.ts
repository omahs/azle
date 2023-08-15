// Named Imports
export * from './import_coverage';
export * from './azle_coverage';
export * from './type_alias_decls';
export * from './ts_primitives';
export * from './star_exports';
export * from './not_azle';
export * from './conflicts';

export * from './conflicts/not-compiling-canisters/double_local_conflicts';
export * from './conflicts/not-compiling-canisters/double_local_override_with_conflict';
export * from './conflicts/not-compiling-canisters/export_conflict';

// Not Named Imports
import './azle_coverage/fruit'; // Shouldn't do anything. It's just here to make sure it doesn't do anything
