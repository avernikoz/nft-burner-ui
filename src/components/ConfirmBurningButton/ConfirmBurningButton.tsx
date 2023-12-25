import { styled } from "styled-components";

export const ConfirmBurningButton = styled.button`
    justify-content: center;
    align-items: center;
    gap: 10px;

    border-radius: 4px;
    background: #b53b00;
    padding: 12px 32px;

    border: none;
    color: #fff;
    /* bt-orange-hover */
    text-shadow:
        0px 1px 16px rgba(255, 255, 255, 0.6),
        0px 1px 4px rgba(255, 194, 170, 0.4);
    font-family: Khand;
    font-size: 24px;
    font-style: normal;
    font-weight: 600;
    line-height: 32px; /* 133.333% */
    letter-spacing: 2.88px;
    text-transform: uppercase;
    cursor: pointer;

    &:hover {
        border-radius: 4px;
        background: var(--Orange-act--02, #ff852d);
    }
`;
