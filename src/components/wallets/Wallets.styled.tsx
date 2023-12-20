import { styled } from "styled-components";
import { Dialog } from "primereact/dialog";
import { STYLES_CONFIG } from "../../config/styles.config";
import { Button } from "primereact/button";
import { PanelMenu } from "primereact/panelmenu";

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
    display: flex;
    align-items: center;
    padding: 10px;
    border: ${STYLES_CONFIG.button.border};
    border-radius: ${STYLES_CONFIG.button.borderRadius};
    background-color: ${STYLES_CONFIG.button.backgroundColor};
    font-family: Arial, sans-serif;
    font-size: 18px;
    color: ${STYLES_CONFIG.button.color};
    width: 200px;
    margin-left: 0.5rem;
    height: 72px;
    margin-top: 0;

    .icon {
        margin-right: 8px;
    }

    .content {
        display: flex;
        flex-direction: column;
        width: 80%;
    }

    .chain-id {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .balance {
        font-weight: bold;
    }

    &:hover {
        color: ${STYLES_CONFIG.button.active.color};
    }
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
        font-weight: 500;
        line-height: 16px; /* 114.286% */
        letter-spacing: 1px;
    }

    .p-menuitem-text:hover {
        color: #fff;
    }

    .p-toggleable-content {
        position: absolute;
        min-width: 210px;
    }
`;
