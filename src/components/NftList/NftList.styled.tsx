import { styled } from "styled-components";

export const NftListTitle = styled.h3`
    color: #fff;

    font-family: Khand;
    font-size: 16px;
    font-style: normal;
    font-weight: 600;
    line-height: 24px; /* 150% */
    letter-spacing: 1.92px;
    text-transform: uppercase;
    text-align: left;
`;

export const NftListAutosizerContainer = styled.div`
    width: 100%;
    height: 90%;
    &::after {
        content: "";
        position: absolute;
        bottom: 19%;
        left: 0;
        right: 0;
        height: 50px;
        box-shadow: inset 0px -23px 12px rgba(0, 0, 0, 0.81);
        opacity: 0.6;
    }

    @media (max-width: 1024px) {
        &::after {
            display: none;
        }
    }
}
`;

export const SpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
`;

export const List = styled.div<{ isListEmpty: boolean }>`
    width: 100%;
    height: 80%;
    margin-bottom: 1rem;

    ${({ isListEmpty }) =>
        isListEmpty &&
        `
        display: flex;
        justify-content: center;
        align-items: center;
    `}

    .nft-list {
        overflow-y: auto !important;
        overflow-x: hidden !important;

        scrollbar-width: none;
        scrollbar-color: transparent;

        &::-webkit-scrollbar {
            display: none;
            width: 0;
        }
    }
`;
