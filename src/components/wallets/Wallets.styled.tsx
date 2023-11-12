import { styled } from "styled-components";
import { Dialog } from "primereact/dialog";

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

    button {
        margin: 0.8rem 0.5rem;
    }
`;

export const ProfileLabel = styled.div`
    display: flex;
    align-items: center;
    padding: 10px;
    border: 2px solid #ffffff;
    border-radius: 8px;
    background-color: #4f46e5;
    font-family: Arial, sans-serif;
    font-size: 18px;
    color: #ffffff;
    width: 200px;
    margin-left: 0.5rem;
    height: min-content;
    margin-top: 0.2rem;

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
`;
