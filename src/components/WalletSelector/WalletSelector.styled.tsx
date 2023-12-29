import { styled } from "styled-components";
import { Dialog } from "primereact/dialog";
import { STYLES_CONFIG } from "../../config/styles.config";
import { Button } from "primereact/button";
import { PanelMenu } from "primereact/panelmenu";
import { Menu } from "primereact/menu";

export const StyledDialog = styled(Dialog)`
    width: 450px;
    height: 500px;

    .p-menuitem-link {
        padding: 0.75rem;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;

    .phoneAdapt {
        @media (max-width: 1024px) {
            display: none;
        }
    }

    button {
        margin: 0.8rem 0.5rem;
        border: ${STYLES_CONFIG.button.border};
        background-color: ${STYLES_CONFIG.button.backgroundColor};
    }
`;

export const ProfileLabel = styled.div`
    padding: 1.25rem;
    height: 50px;
    width: 180px;

    display: flex;
    align-items: center;
    border-radius: 4px;
    background: rgba(11, 11, 12, 0.8);
    color: #fff;
    gap: 16px;

    text-align: center;
    font-family: Rubik;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 16px; /* 114.286% */
    text-transform: uppercase;

    margin-top: 0;

    .balance {
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 3px;
    }

    /* .icon {
        margin-right: 8px;
    } */

    .content {
        display: flex;
        flex-direction: column;
        width: 80%;
    }

    /* .chain-id {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    } */
`;

export const WalletButton = styled(Button)`
    &&& {
        height: 50px;
        padding: 16px;
        margin: 0;
        border-radius: 4px;
        border: none;
        background: rgba(11, 11, 12, 0.8);
    }
`;

export const StyledPanelMenu = styled(PanelMenu)`
    min-width: 210px;
    border-radius: 4px;
    background: rgba(11, 11, 12, 0.8);
    display: flex;
    align-items: center;

    .p-panelmenu-panel {
        margin-bottom: 0;
        width: 100%;
        position: relative;
    }

    .p-panelmenu-header-link {
        height: 50px;
        border: none;
    }

    .p-panelmenu-header-link .p-menuitem-text {
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 3px;
    }

    .p-panelmenu-header-link svg {
        color: #fff;

        &:hover {
            color: #fff;
        }
    }

    .p-panelmenu-header.p-highlight::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--Orange--01, #ff4a00);
    }

    .p-menuitem-text {
        color: #b5b5c2;

        text-align: center;
        font-family: Rubik;
        font-size: 14px;
        font-style: normal;
        line-height: 16px; /* 114.286% */
        letter-spacing: 1px;
    }

    .p-menuitem-text:hover {
        font-weight: 500;
        color: #fff;
    }

    .p-toggleable-content {
        position: absolute;
        min-width: 210px;
    }

    .p-toggleable-content .p-panelmenu-content {
        background: var(
            --Liner-bg-popup,
            linear-gradient(180deg, rgba(24, 24, 26, 0.8) 0%, rgba(11, 11, 12, 0.8) 100%)
        );
        border: none;
    }
`;

export const StyledMenu = styled(Menu)`
    width: 180px;
    color: #b5b5c2;

    font-family: Rubik;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px; /* 114.286% */
    letter-spacing: 1px;

    border-radius: 0px 0px 4px 4px;
    background: var(--Liner-bg-popup, linear-gradient(180deg, rgba(24, 24, 26, 0.8) 0%, rgba(11, 11, 12, 0.8) 100%));
    backdrop-filter: blur(12px);

    .p-menuitem-link .p-menuitem-text,
    .p-menuitem-link .p-menuitem-icon {
        color: #b5b5c2;
    }

    .p-menuitem-link:hover .p-menuitem-icon {
        color: #fff;
    }

    .p-menuitem-link:hover .p-menuitem-text {
        font-weight: 500;
        color: #fff;
    }

    .p-menuitem-text {
        text-align: center;
        font-family: Rubik;
        font-size: 14px;
        font-style: normal;
        line-height: 16px; /* 114.286% */
        letter-spacing: 1px;
    }

    &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: var(--Orange--01, #ff4a00);
    }
`;
