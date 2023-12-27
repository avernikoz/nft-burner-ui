import { css, styled } from "styled-components";

export const BodyContainer = styled.div<{ showBackground?: boolean }>`
    /* display: grid;
    grid-template-columns: 1fr 1fr; */
    width: 50vw;
    padding: 0 3rem;
    position: absolute;
    top: 100px;
    left: 0;
    height: 85vh;

    @media (max-width: 1024px) {
        height: 50%;
        width: 100%;
        position: absolute;
        bottom: 0;
        top: auto;
        padding: 0 0.5rem;
    }

    .half {
        ${({ showBackground }) =>
            showBackground &&
            css`
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 15px;
            `}
        padding: 0.5rem;
        border-radius: 15px;
        height: 100%;
        width: 80%;
        z-index: 10;
        position: relative;

        @media (max-width: 1024px) {
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
