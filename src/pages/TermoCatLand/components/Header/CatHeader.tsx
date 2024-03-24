import React from "react";
import {HeaderContainer, NavLinks, StyledLogo} from "./CatHeader.styled";
import {BuyNowButton, NavLink} from "../../TermoCatLand.styled";

export function CatHeader() {
    return     <HeaderContainer>
        <StyledLogo/>
        <NavLinks>
            <NavLink>About</NavLink>
            <NavLink>Story</NavLink>
            <NavLink>Catemonics</NavLink>
            <NavLink>How to Buy</NavLink>
            <BuyNowButton>
                Buy Now
                <i className="pi pi-wallet" style={{fontSize: '1rem'}}></i>
            </BuyNowButton>
        </NavLinks>
    </HeaderContainer>;
}
