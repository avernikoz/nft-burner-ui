import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { styled, keyframes, css } from "styled-components";

export const NftBurnDialogContainer = styled.div`
    display: flex;
    min-width: 650px;
    gap: 0px 30px;
    margin-bottom: 1.5rem;

    @media (max-width: 1024px) {
        flex-direction: column;
        align-items: center;
        min-width: auto;
    }
`;

export const NftBurnDialogInfoContainer = styled.div`
    display: flex;
    justify-content: space-between;
`;

export const NftBurnDialogInfoTitle = styled.p`
    color: #787885;

    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px; /* 133.333% */
    letter-spacing: 0.48px;

    margin: 0 0 0.5rem 0;

    display: flex;
    gap: 5px;
`;

export const NftBurnDialogInfoValue = styled.p`
    color: #fff;

    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 600;
    line-height: 16px; /* 133.333% */
    letter-spacing: 0.48px;

    margin: 0 0 0.5rem 0;
`;

export const BurningCeremonyText = styled.p`
    color: #fff;

    font-family: Rubik;
    font-size: 14px;
    font-style: normal;
    font-weight: 400;
    line-height: 20px; /* 142.857% */
`;

export const BurningCeremonyHighlight = styled.span`
    color: #ff6a2d;
    font-family: Rubik;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 20px;
`;

export const WarningContainer = styled.div`
    border-radius: 4px;
    background: rgba(255, 74, 0, 0.3);
    padding: 8px 12px;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
`;

export const WarningText = styled.p`
    color: #ffc2aa;

    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px; /* 133.333% */
    letter-spacing: 0.48px;
`;

export const StatusTransactionContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;

export const StatusTransactionText = styled.p<{
    $isActive?: boolean;
}>`
    color: #b5b5c2;

    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 18px; /* 150% */

    ${({ $isActive }) =>
        $isActive &&
        css`
            color: #fff;
            font-weight: 500;
        `}
`;

export const NftBurnDialogImg = styled.img`
    border-radius: 2px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    object-fit: cover;
    width: 300px;
    height: 300px;
    @media screen and (aspect-ratio: 1/1) {
        width: 250px;
        height: 250px;
    }
`;

export const NftBurnDialogImgTitle = styled.div`
    font-family: Rubik;
    font-weight: 500;
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    width: calc(100% - 16px);
    height: 56px;
    border-radius: 2px;
    background: #0b0b0c;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 8px;
`;

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

export const DialogImageContainer = styled.div`
    position: relative;
    width: 300px;
    height: 300px;

    @media screen and (aspect-ratio: 1/1) {
        width: 250px;
        height: 250px;
    }

    @media (max-width: 1024px) {
        margin-bottom: 0.5rem;
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
