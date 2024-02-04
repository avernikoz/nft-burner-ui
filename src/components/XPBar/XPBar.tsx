import { styled } from "styled-components";

export const XPBannerContainer = styled.div`
    background-color: #500fe9cf;
    width: 20vw;
    //height: 5vw;
    display: flex;
    flex-direction: column;
    align-items: center;

    position: absolute;
    right: 5vw;
    top: 8vw;
    //height: 108px;
    padding: 12px;
`;

export const XPBarContainer = styled.div`
    background-color: #0fe933cf;
    width: 100%;
    height: 50%;
    //height: 5vw;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
`;

export const XPBarLine = styled.div`
    background-color: #e90f87cf;
    width: 90%;
    height: 8px;
    //height: 5vw;
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
`;

export const LevelText = styled.span`
    color: #fff;
    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-size: clamp(12px, 1vw, 86px);
    font-family: Rubik;
    font-style: normal;
    font-weight: 600;
    line-height: auto;
    text-transform: uppercase;
    width: 100%;
    margin: 12px;
`;

export const CounterText = styled.span`
    color: #fff;
    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-size: clamp(12px, 0.1vw, 86px);
    font-family: Khand;
    font-style: normal;
    font-weight: 500;
    line-height: auto;
    text-transform: uppercase;
    width: 100%;
    margin: 12px;
`;

export const LevelNumberText = styled.span`
    color: #ff6a2d;
    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-size: clamp(12px, 1vw, 86px);
    font-family: Rubik;
    font-style: normal;
    font-weight: 600;
    line-height: auto;
    text-transform: uppercase;
    width: 100%;
    margin: 12px;
`;

export const XPBar = () => (
    <XPBannerContainer>
        <LevelText>LEVEL</LevelText>
        <XPBarContainer>
            <LevelNumberText>3</LevelNumberText>
            <XPBarLine />
        </XPBarContainer>
        <CounterText>101 / 200</CounterText>
    </XPBannerContainer>
);
