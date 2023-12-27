import { styled } from "styled-components";

export const BurnAndInfoContainer = styled.div`
    width: 100%;

    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const BurnScheduleContainer = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    gap: 16px;
`;

export const NftInfoContainer = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
    align-items: center;
    height: 44px;
    //background-color: #00b272;

    @media (max-width: 600px) {
        display: none;
    }
`;
export const NftInfoDivider = styled.div`
    stroke-width: 4px;
    stroke: #fff;
    background-color: #2d2d31;
    width: 1px;
    height: 100%;
    flex-shrink: 0;
`;
export const BurnerFuelInfoContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 16px;
`;
export const NetworkFeeInfoContainer = styled.div`
    display: flex;
    justify-content: space-between;
    gap: 24px;
`;

export const BurnerFuelInfoText = styled.span`
    color: #b5b5c2;
    font-family: Rubik;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.5px;

    display: flex;
    gap: 5px;
`;

export const BurnerFuelInfoTextNumbers = styled.span`
    color: #fff;
    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.5px;
`;

export const NetworkFeeInfoText = styled.span`
    color: #b5b5c2;
    font-family: Rubik;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.5px;
`;

export const NetworkFeeInfoTextNumbers = styled.span`
    color: #00b272;
    font-family: Rubik;
    font-size: 12px;
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0.5px;
`;
