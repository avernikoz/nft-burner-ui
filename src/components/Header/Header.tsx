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

export const Header = () => (
    <HeaderContainer>
        <BurnerLogoIcon />
        <HeaderLine />
    </HeaderContainer>
);
