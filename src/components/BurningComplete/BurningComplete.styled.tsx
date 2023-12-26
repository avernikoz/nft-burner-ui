import { styled } from "styled-components";

export const BurningCompleteContainer = styled.div`
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;

    z-index: 9;
    bottom: 50px;
    position: absolute;
    width: 50%;

    @media (max-width: 600px) {
        width: 100%;
    }
`;
