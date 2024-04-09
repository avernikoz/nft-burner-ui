import { NightlyConnectSuiAdapter } from "@nightlylabs/wallet-selector-sui";

let adapter: NightlyConnectSuiAdapter | undefined;
export const getAdapter = async () => {
    if (adapter) return adapter;
    adapter = await NightlyConnectSuiAdapter.build({
        appMetadata: {
            name: "Sui Template",
            description: "Sui Template",
            icon: "https://docs.nightly.app/img/logo.png",
        },
    });
    return adapter;
};
