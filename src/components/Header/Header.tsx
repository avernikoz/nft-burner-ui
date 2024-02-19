import { styled } from "styled-components";

import { ReactComponent as BurnerLogoIcon } from "../../assets/svg/burnerLogoDesktop.svg";

export const HeaderContainer = styled.div`
    //background-color: #500fe9cf;
    width: 100%;
    display: flex;
    align-items: center;
    position: absolute;
    top: 0;
    z-index: 99;
    padding: 1.25vw 4vw;
    height: 102px;

    @media (max-width: 600px) {
        flex-direction: column;
        justify-content: space-around;
    }
`;

export const HeaderLine = styled.div`
    width: 85%;
    height: 1px;
    margin: 1vw;
    background-color: #515158;
`;

export const BetaContainer = styled.div`
    //background-color: #500fe9cf;
    display: flex;
    align-items: center;
    border: 2px solid #ff842d7a;
    border-radius: 32px;
    position: relative;
    bottom: -5%;
    margin: 0px 4px;
`;

export const BetaText = styled.span`
    color: #ff842de8;

    font-family: Rubik;
    font-size: clamp(8px, 1vw, 16px);
    font-style: normal;
    font-weight: 500;
    letter-spacing: 0px;
    position: relative;
    //bottom: -5%;
    transform: translateY(0%);
    margin: 4px 8px;
    //width: clamp(32px, 40vw, 512px);
`;

export const Header = () => (
    <HeaderContainer>
        <BurnerLogoIcon />
        <BetaContainer>
            <BetaText> beta</BetaText>
        </BetaContainer>
        <HeaderLine />
    </HeaderContainer>
);
