import { styled } from "styled-components";

export const Footer = styled.div`
    Button {
        background-color: transparent;
        position: fixed;
        margin: 1rem;
        bottom: 0;
        right: 0;
    }
`;

export const BodyContainer = styled.div`
    /* display: grid;
    grid-template-columns: 1fr 1fr; */
    width: 50vw;
    padding: 0 1rem;
    z-index: 10;
    position: absolute;
    top: 100px;
    left: 0;

    .half {
        /* grid-column: span 1; */
        background-color: rgba(0, 0, 0, 0.3);
        padding: 0.5rem;
        border: 1px solid #acacac;
        border-radius: 15px;
        height: 80vh;
        width: 100%;
    }
`;
