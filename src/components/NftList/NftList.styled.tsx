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

export const List = styled.div`
    width: 100%;
    height: 80%;

    .nftListAutosizerContainer {
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
        }
    }

    .nft-list {
        overflow-y: auto !important;
        overflow-x: hidden !important;

        ::-webkit-scrollbar {
            width: 2px;
            border-radius: 5px;
        }

        ::-webkit-scrollbar-track {
            border-radius: 6px;
            background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
            border-radius: 6px;
            background: #888;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        scrollbar-width: 2px;
        scrollbar-color: #888 #f1f1f1;
    }

    .spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
`;
