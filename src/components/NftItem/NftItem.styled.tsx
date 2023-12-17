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
    position: relative;
    border-radius: 2px;
    overflow: hidden;

    & {
        img {
            filter: brightness(0.75) saturate(0.5);
        }
    }

    &:hover {
        img {
            filter: none;
        }
    }

    /* For title */
    &:hover div {
        opacity: 1;
        z-index: 100;
    }

    &.active {
        border-radius: 2px;
        border-top: 2px solid #fff;
        border-bottom: 2px solid #fff;
        background: rgba(255, 74, 0, 0.9);
        z-index: 1;
        width: 100%;
        height: 100%;

        img {
            filter: none;
            animation: ${burnAnimation} 1s infinite;

            position: absolute;
            top: 0;
            left: 0;
        }
    }

    /* &:hover {
        opacity: 0.7;
        transition: 1s ease;
    } */
`;

export const CardImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

export const CardTitle = styled.div`
    font-family: Rubik;
    font-weight: 500;
    position: absolute;
    bottom: 0;
    width: 100%;
    padding: 8px;
    background: rgba(255, 255, 255, 255);
    color: black;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
    text-overflow: ellipsis;
    overflow: hidden;
`;
