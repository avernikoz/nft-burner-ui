import {styled} from "styled-components";
import { ReactComponent as Logo } from '../../../../assets/termo-cat-land/catLogo.svg';


export const HeaderContainer = styled.header`
    display: flex;
    justify-content: space-around;
    align-items: center;
    width: 100%;
    position: static;
    top:0;
    padding: 1rem 2rem;
    background-color: transparent;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

export const StyledLogo = styled(Logo)`
    width: 150px; 
    height: auto;
`;

export const NavLinks = styled.nav`
    display: flex;
    align-items: center;
    gap: 3rem;
`;



