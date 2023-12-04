import { styled } from "styled-components";

export const Footer = styled.div`
    @media (max-width: 1000px) {
        display: none;
    }

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
    position: absolute;
    top: 100px;
    left: 0;
    height: 85vh;

    @media (max-width: 1000px) {
        height: 55%;
        width: 100%;
        position: absolute;
        bottom: 0;
        top: auto;
        padding: 0 0.5rem;
    }

    .half {
        /* grid-column: span 1; */
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.5rem;
        border-radius: 15px;
        height: 100%;
        width: 90%;
        z-index: 10;
        position: relative;

        @media (max-width: 1000px) {
            width: 100%;
        }

        .control {
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
            padding: 0.5rem;

            &__burn {
                width: 40%;
                display: flex;
                flex-direction: column;
            }

            &__social {
                width: 40%;
                display: flex;
                flex-direction: column;
                button {
                    margin: 0.2rem;
                }

                &--media {
                    display: flex;
                    flex-direction: row;
                    justify-content: space-between;
                }
            }
        }
    }
`;
