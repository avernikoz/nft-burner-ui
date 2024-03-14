import { Dialog } from "primereact/dialog";
import { styled } from "styled-components";

export const StyledDialog = styled(Dialog)`
    .p-dialog-header {
        border-radius: 8px 8px 0px 0px;
        border-bottom: 2px solid #ff6a2d;
        background: rgba(11, 11, 12, 0.8);
        backdrop-filter: blur(12px);
    }

    .p-dialog-header .p-dialog-title {
        color: #fff;
        font-family: Khand;
        font-size: 32px;
        font-style: normal;
        font-weight: 600;
        line-height: 32px; /* 100% */
        letter-spacing: 3.84px;
        text-transform: uppercase;
        text-align: left;
        text-align: center;

        &::before {
            content: "$HEAT ";
            color: #ff6a2d;
        }
    }

    .p-dialog-header-icons {
        align-self: center;
    }

    .p-dialog-content {
        color: #fff;

        padding: 1.5rem;
        border-radius: 0px 0px 8px 8px;
        background: linear-gradient(180deg, rgba(24, 24, 26, 0.8) 0%, rgba(11, 11, 12, 0.8) 100%);
        backdrop-filter: blur(12px);
        font-family: Rubik;
    }
`;

export const SubmitContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;

    .icon {
        margin: 0 0.4rem;
    }
`;

export const ConfirmBurningButton = styled.button`
    justify-content: center;
    align-items: center;
    gap: 10px;

    border-radius: 4px;
    background: #b53b00;
    padding: 6px 22px;

    border: none;
    color: #fff;
    /* bt-orange-hover */
    text-shadow:
        0px 1px 16px rgba(255, 255, 255, 0.6),
        0px 1px 4px rgba(255, 194, 170, 0.4);
    font-family: Khand;
    font-size: 24px;
    font-style: normal;
    font-weight: 600;
    line-height: 32px; /* 133.333% */
    letter-spacing: 2.88px;
    text-transform: uppercase;
    cursor: pointer;

    &:hover {
        border-radius: 4px;
        background: var(--Orange-act--02, #ff852d);
    }
`;
