import { styled } from "styled-components";
import {ListBox} from "primereact/listbox";

export const Item = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    div {
        margin: 0 1rem;
    }
`;

export const StyledListBox = styled(ListBox)`
    max-height: 330px;
`;
