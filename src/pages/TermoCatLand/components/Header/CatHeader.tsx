import React, { useState } from "react";
import { HeaderContainer, MobileNav, NavLink, NavLinks, StyledLogo } from "./CatHeader.styled";
import { BuyNowButton, SideBarContent } from "../../TermoCatLand.styled";
import { ReactComponent as Logo } from "../../../../assets/termo-cat-land/catLogo.svg";
import { Sidebar } from "primereact/sidebar";
import { Button } from "primereact/button";
export function CatHeader() {
    const [visible, setVisible] = useState(false);

    return (
        <HeaderContainer>
            <StyledLogo>
                <Logo></Logo>
            </StyledLogo>
            <NavLinks>
                <NavLink>About</NavLink>
                <NavLink>Story</NavLink>
                <NavLink>Catemonics</NavLink>
                <NavLink>How to Buy</NavLink>
                <BuyNowButton>
                    Buy Now
                    <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
                </BuyNowButton>
            </NavLinks>
            <MobileNav>
                <Sidebar position="right" visible={visible} onHide={() => setVisible(false)}>
                    <SideBarContent>
                        <NavLink>About</NavLink>
                        <NavLink>Story</NavLink>
                        <NavLink>Catemonics</NavLink>
                        <NavLink>How to Buy</NavLink>
                        <BuyNowButton>
                            Buy Now
                            <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
                        </BuyNowButton>
                    </SideBarContent>
                </Sidebar>
                <Button icon="pi pi-bars burger" text onClick={() => setVisible(true)} />
            </MobileNav>
        </HeaderContainer>
    );
}
