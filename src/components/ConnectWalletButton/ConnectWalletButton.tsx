import { styled } from "styled-components";

export const ConnectWalletButton = styled.button`
    padding: 16px 56px;

    color: #fff;

    /* text light */
    text-shadow:
        0px 1px 16px #325055,
        0px 1px 4px #ffe37c;
    font-family: Khand;
    font-size: 24px;
    font-style: normal;
    font-weight: 700;
    line-height: 32px; /* 133.333% */
    letter-spacing: 2.88px;
    text-transform: uppercase;

    border-radius: 4px;
    border: 2px solid #fff;

    background: radial-gradient(
            965.55% 55.58% at 50% 50%,
            rgba(255, 244, 204, 0.12) 0%,
            rgba(27, 26, 33, 0) 99.99%,
            rgba(76, 9, 9, 0) 100%
        ),
        rgba(11, 11, 12, 0.4);

    /* 2 */
    box-shadow:
        0px 1px 4px 0px rgba(252, 252, 252, 0.25) inset,
        0px 0px 80px 0px rgba(50, 80, 85, 0.4),
        0px 0px 4px 0px #fff,
        0px -2px 12px 0px rgba(50, 80, 85, 0.3) inset,
        0px 0px 1px 0px #fff;

    &:hover {
        color: var(--Black-01, #0b0b0c);
        text-shadow:
            0px 1px 16px rgba(45, 45, 49, 0.8),
            0px 0px 2px #2d2d31;

        background: radial-gradient(
                965.55% 55.58% at 50% 50%,
                rgba(255, 244, 204, 0.12) 0%,
                rgba(27, 26, 33, 0) 99.99%,
                rgba(76, 9, 9, 0) 100%
            ),
            #fff;
    }
`;
