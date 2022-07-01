import { cleanDeploy, run_tests, Test } from 'azle/test';
import { createActor } from '../test/dfx_generated/blog';

const blog_canister = createActor('rrkah-fqaaa-aaaaa-aaaaq-cai', {
    agentOptions: {
        host: 'http://127.0.0.1:8000'
    }
});

const tests: Test[] = [
    ...cleanDeploy('blog'),
    {
        name: 'init get count',
        test: async () => {
            const result = await blog_canister.getPostCount();

            return {
                ok: result === 0
            };
        }
    }
];

run_tests(tests);
