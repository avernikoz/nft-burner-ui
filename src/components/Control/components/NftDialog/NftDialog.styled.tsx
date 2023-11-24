import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { styled, keyframes } from "styled-components";

export const StyledDialog = styled(Dialog)`
    .p-dialog-header {
        background-color: #8d8d8d;
        color: white;
    }
    .p-dialog-content {
        background-color: #505050;
        display: flex;
        flex-direction: column;
        align-items: center;
        color: white;

        img {
            border-radius: 10px;
            box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
            object-fit: cover;
        }
        p {
            font-size: 18px;
            margin: 10px 0;
            color: white;
        }
        .card {
            margin: 0.5rem;
            padding: 0.5rem;
            border-radius: 10px;
            border: 1px #adadad solid;
            min-width: 250px;
            color: white;
        }
    }

    .p-dialog-footer {
        display: flex;
        justify-content: center;
    }

    .submit::after {
        content: "Let's BURN";
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        background: #ef4444;
        padding-top: 0.7rem;
        color: white;
    }
`;

const fill = keyframes`
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
`;

export const FillButton = styled(Button)`
    position: relative;
    overflow: hidden;

    &::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 0%;
        padding-top: 0.7rem;
        background: #ef4444;
        animation: ${fill} 2s linear backwards paused;
        white-space: nowrap;
        overflow: hidden;
    }

    &:active::after {
        animation-play-state: running;
        content: "Let's BURN";
        color: white;
    }
    &:not(:active)::after {
        animation: none;
    }
`;
