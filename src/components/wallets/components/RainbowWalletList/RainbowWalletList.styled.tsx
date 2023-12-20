import { styled } from "styled-components";
import { ListBox } from "primereact/listbox";

export const Item = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    div {
        margin: 0 1rem;
    }
`;

export const StyledListBox = styled(ListBox)`
    max-height: 240px;
    overflow: scroll;
    background: transparent;
    border: none;
    color: #b5b5c2;
    font-family: Rubik;
    font-size: 16px;
    font-style: normal;
    font-weight: 400;

    .p-listbox-item:hover {
    }

    .p-listbox-list .p-listbox-item {
        color: #b5b5c2;

        &:hover {
            color: #fff;
            background: transparent;
            font-weight: 500;
        }
    }
`;
