import { styled } from "styled-components";

export const List = styled.div`
    width: 100%;
    height: 80%;
    // border-bottom: 1px solid #4d4c4c;

    h3 {
        color: white;
    }
    .virtual-container {
        width: 100%;
        height: 90%;
        &::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 50px;
            box-shadow: inset -40px -23px 18px rgba(0, 0, 0, 0.81);
        }
    }

    .nft-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        justify-items: center;
        gap: 20px;
        overflow-y: auto !important;
        overflow-x: hidden !important;

        ::-webkit-scrollbar {
            width: 10px;
            border-radius: 5px;
        }

        ::-webkit-scrollbar-track {
            border-radius: 5px;
            background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
            background: #888;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: #555;
        }

        scrollbar-width: thin;
        scrollbar-color: #888 #f1f1f1;
    }

    .spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }
`;
