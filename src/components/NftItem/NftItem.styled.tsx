import { css, keyframes, styled } from "styled-components";

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

const pulseColorAnimation = keyframes`
  0%, 100% {
    background-color: #080808;  // Darker color
  }
  50% {
    background-color: #444444;  // Dark gray
  }
`;

export interface CardProps {
    $isActive: boolean;
    $isImageClickable: boolean;
    $loaded: boolean;
}

export const ImageLoaderPlaceholder = styled.div<{ $loaded: boolean }>`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1; /* Set a higher z-index to ensure it's on top of the image */

    ${({ $loaded }) =>
        !$loaded &&
        css`
            animation: ${pulseColorAnimation} 1s infinite; // Adjust the animation duration as needed
            cursor: progress;
        `}

    ${({ $loaded }) =>
        $loaded &&
        css`
            display: none;
        `}
`;

export const Card = styled.div<CardProps>`
    position: relative;
    border-radius: 2px;
    overflow: hidden;
    width: 100%;
    height: 100%;

    ${({ $loaded }) =>
        !$loaded &&
        css`
            cursor: progress;
        `}

    ${({ $isImageClickable }) =>
        $isImageClickable &&
        css`
            cursor: pointer;
        `}

    ${({ $isActive }) =>
        $isActive &&
        css`
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
        `}

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
