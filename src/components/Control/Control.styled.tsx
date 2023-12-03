import { styled } from "styled-components";

export const ControlContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;
    padding: 0.5rem;
    .control {
        &__burn {
            width: 40%;
            display: flex;
            flex-direction: column;
        }
        @media (max-width: 1000px) {
            &__burn {
                width: 45%;
                .p-button {
                    padding: 0.5rem 0.5rem;
                }
            }

            &__social {
                width: 45%;
                .p-button {
                    padding: 0.5rem 0.5rem;
                }
            }
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
`;
