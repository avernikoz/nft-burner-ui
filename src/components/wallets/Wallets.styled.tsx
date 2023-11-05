import { styled } from "styled-components";
import { Dialog } from "primereact/dialog";

export const StyledDialog = styled(Dialog)`
    .p-menuitem-link {
      padding: .75rem;
    }
`;

export const ButtonContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    .p-panelmenu .p-panelmenu-panel {
        margin-bottom: 0;
    }

    button {
        margin: 0 0.5rem;
    }
`;

export const ProfileLabel  = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  border: 2px solid #333;
  border-radius: 8px;
  background-color: #f0f0f0;
  font-family: Arial, sans-serif;
  font-size: 18px;
  color: #333;

  .icon {
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }

  .content {
    display: flex;
    flex-direction: column;
  }

  .balance {
    font-weight: bold;
  }
}

`;
