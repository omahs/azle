# stable64 grow

This section is a work in progress.

Examples:

-   [stable_memory](https://github.com/demergent-labs/azle/tree/main/examples/stable_memory)

```typescript
import { ic, nat64, Stable64GrowResult, $update } from 'azle';

$update;
export function stable64Grow(newPages: nat64): Stable64GrowResult {
    return ic.stable64Grow(newPages);
}
```
