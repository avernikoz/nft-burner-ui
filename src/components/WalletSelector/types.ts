import { ALLOWED_NETWORKS } from "@avernikoz/nft-sdk";
// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { JSX, ReactNode } from "react";
import { Connector } from "wagmi";

export interface IAccount {
    id?: string;
    walletIcon?: string | JSX.Element;
    network: ALLOWED_NETWORKS;
}

export interface IMenuConnectionItem extends MenuItem {
    list: ReactNode;
    chainId?: number;
}

export interface IWallet {
    logo: JSX.Element;
    label: string;
    wallet: Connector;
}
