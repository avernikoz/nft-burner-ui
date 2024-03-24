import { styled } from "styled-components";

export const HeaderContainer = styled.header`
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    position: static;
    top: 0;
    padding: 1rem 2rem;
    background-color: transparent;
`;

export const StyledLogo = styled.div`
    width: 150px;
    height: auto;
`;

export const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 3rem;
`;
