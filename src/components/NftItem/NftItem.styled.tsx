import { keyframes, styled } from "styled-components";

const fireAnimation = keyframes`
    0% {
        opacity: 0.5;
    }
    50% {
        opacity: 1;
    }
    100% {
        opacity: 0.5;
    }
`;

export const BurnEffect = styled.div`
    transform: scale(0.5);
    opacity: 0;
    z-index: 100;
    transition:
        transform 0.3s ease-in-out,
        opacity 0.3s ease-in-out;
`;
export const Card = styled.div`
    width: 200px;
    height: 220px;
    position: relative;
    border: 1px solid #ccc;
    border-radius: 10px;
    overflow: hidden;
    transition: box-shadow 0.3s ease-in-out;
    cursor: pointer;

    &.active {
        animation: ${fireAnimation} 1.5s infinite;
        z-index: 1;
    }

    &:hover {
        box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);
    }

    &:hover div {
        opacity: 1;
    }
`;

export const CardImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

export const CardTitle = styled.div`
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
`;
