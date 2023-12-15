import { keyframes, styled } from "styled-components";

export const BurnEffect = styled.div`
    transform: scale(0.5);
    opacity: 0;
    z-index: 100;
    transition:
        transform 0.3s ease-in-out,
        opacity 0.3s ease-in-out;
`;

const burnAnimation = keyframes`
    0% {
        opacity: 1;
    }
    50% {
        opacity: .5;
    }
    100% {
        opacity: 1;
    }
`;

export const Card = styled.div`
    width: 150px;
    height: 160px;
    position: relative;
    border-radius: 2px;
    border: 1px solid #2d2d31;
    overflow: hidden;
    margin: auto;
    transition: box-shadow 0.3s ease-in-out;
    cursor: pointer;

    &.active {
        border-radius: 2px;
        border-top: 2px solid #fff;
        border-bottom: 2px solid #fff;
        background: rgba(255, 74, 0, 0.6);

        z-index: 1;
        animation: ${burnAnimation} 1s infinite;
        img {
            position: absolute;
            top: 0;
            left: 0;
        }
    }

    &:hover {
        box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);
    }

    &:hover div {
        opacity: 1;
        z-index: 100;
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
