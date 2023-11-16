import { styled } from "styled-components";

export const List = styled.div`
    width: 100%;
    height: 80%;
    overflow: hidden;
    overflow-y: auto;
    border-bottom: 1px solid #4d4c4c;

    h3 {
        color: white;
    }

    .nft-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, 200px);
        justify-content: space-around;
        justify-items: center;
        row-gap: 20px;
        align-items: center;
    }

    .spinner {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
    }

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
`;
