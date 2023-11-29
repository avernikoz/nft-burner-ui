import { styled } from "styled-components";

export const Footer = styled.div`
    @media (max-width: 800px) {
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
    height: 80vh;

    @media (max-width: 400px) {
        height: 50%;
        width: 100%;
        position: absolute;
        bottom: 0;
        top: auto;
    }

    .half {
        /* grid-column: span 1; */
        background-color: rgba(0, 0, 0, 0.3);
        padding: 0.5rem;
        border: 1px solid #acacac;
        border-radius: 15px;
        height: 80vh;
        max-width: 650px;
        z-index: 10;
        position: relative;

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
