import { styled } from "styled-components";
import { Dialog } from "primereact/dialog";
import { STYLES_CONFIG } from "../../config/styles.config";

export const StyledDialog = styled(Dialog)`
    width: 450px;
    height: 500px;

    .p-menuitem-link {
        padding: 0.75rem;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;

    .p-panelmenu .p-panelmenu-panel {
        margin-bottom: 0;
    }

    .phoneAdapt {
        @media (max-width: 1000px) {
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
