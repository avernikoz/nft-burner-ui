import { styled } from "styled-components";

import { ReactComponent as LogoIcon } from "../../assets/svg/burnerLogoH.svg";

export const HeaderContainer = styled.div`
    //background-color: #500fe9cf;
    width: 100%;
    display: inline-flex;
    align-items: center;
    position: absolute;
    top: 0;
    z-index: 99;
    padding: 1.25vw 4vw;
    height: 64px;
`;

export const HeaderLine = styled.div`
    width: 85%;
    height: 1px;
    margin: 1vw;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    background-color: #515158;
`;

export const Header = () => (
    <HeaderContainer>
        <LogoIcon />
        <HeaderLine />
    </HeaderContainer>
);
