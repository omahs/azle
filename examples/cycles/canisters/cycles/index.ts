import {
    CallResult,
    nat,
    nat64,
    Principal,
    Service,
    serviceUpdate
} from 'azle';

export class Cycles extends Service {
    @serviceUpdate
    receiveCycles: () => CallResult<nat64>;

    @serviceUpdate
    receiveCycles128: () => CallResult<nat>;
}

export const cyclesCanister = new Cycles(
    Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai')
);
