import { css, styled } from "styled-components";

export const BurningCompleteContainer = styled.div`
    display: flex;
    gap: 20px;
    justify-content: center;
    align-items: center;

    z-index: 9;
    bottom: 12.5vh;
    position: absolute;
    width: 50%;

    @media (max-width: 600px) {
        width: 100%;
    }
`;

export const BurningCompleteText = styled.span<{ $show?: boolean }>`
    color: #fff;
    text-align: center;
    text-shadow:
        0px 0px 50px rgba(230, 224, 255, 0.75),
        0px 0px 10px #e6e0ff;
    font-family: Poppins;
    font-style: normal;
    font-size: clamp(32px, 6vw, 512px);
    position: absolute;
    width: 100vw;
    top: 12vh;
    font-weight: 500;
    line-height: 100%; /* 100px */

    z-index: 9;

    ${({ $show }) =>
        $show &&
        css`
            opacity: 1;
        `}

    ${({ $show }) =>
        !$show &&
        css`
            opacity: 0;
            transition: opacity 1.3s ease;
        `}
`;
