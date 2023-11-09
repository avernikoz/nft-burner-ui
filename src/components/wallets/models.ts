// eslint-disable-next-line import/no-unresolved
import { MenuItem } from "primereact/menuitem";
import { ReactNode } from "react";

export interface IAccount {
    id?: string;
    balance?: string;
    walletIcon?: string | JSX.Element;
}

export interface IMenuConnectionItem extends MenuItem {
    list: ReactNode;
    chainId?: number;
}
