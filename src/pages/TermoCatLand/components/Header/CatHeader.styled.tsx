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

    @media screen and (max-width: 1000px) {
        justify-content: space-between;
    }
`;

export const StyledLogo = styled.div`
    width: 150px;
    height: auto;
`;

export const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 3rem;

    @media screen and (max-width: 1000px) {
        display: none;
    }
`;

export const MobileNav = styled.nav`
    display: none;

    @media screen and (max-width: 1000px) {
        display: block;
    }

    .burger {
        color: white;
    }
`;

export const NavLink = styled.a`
    text-decoration: none;
    color: #ffffff;

    &:hover {
        color: #fd9e1b;
        cursor: pointer;
    }

    @media screen and (max-width: 1000px) {
        color: black;
    }
`;
