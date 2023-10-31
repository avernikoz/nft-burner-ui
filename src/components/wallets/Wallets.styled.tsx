import { Sidebar } from "primereact/sidebar";
import { styled } from "styled-components";

export const StyledSidebar = styled(Sidebar)`
    .button-control {
        display: flex;
        flex-direction: column;
        width: 300px;
        button {
            margin: 0.5rem;
        }
    }
`;
