import { styled } from "styled-components";

export const Card = styled.div`
    width: 200px;
    height: 220px;
    position: relative;
    border: 1px solid #ccc;
    border-radius: 10px;
    overflow: hidden;
    transition: box-shadow 0.3s ease-in-out;

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
