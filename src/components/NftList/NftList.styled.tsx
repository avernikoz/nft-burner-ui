import { styled } from "styled-components";

export const List = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, 200px);
    width: 100%;
    height: 100%;
    row-gap: 20px;
    overflow: hidden;
    justify-content: space-around;
    justify-items: center;
    overflow-y: auto;
`;
