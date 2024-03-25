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
                <NavLink href="#section1">About</NavLink>
                <NavLink href="#section2">Story</NavLink>
                <NavLink href="#section3">Catemonics</NavLink>
                <NavLink href="#section4">How to Buy</NavLink>
                <BuyNowButton>
                    Buy Now
                    <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
                </BuyNowButton>
            </NavLinks>
            <MobileNav>
                <Sidebar position="right" visible={visible} onHide={() => setVisible(false)}>
                    <SideBarContent>
                        <NavLink href="#section1" onClick={() => setVisible(false)}>
                            About
                        </NavLink>
                        <NavLink href="#section2" onClick={() => setVisible(false)}>
                            Story
                        </NavLink>
                        <NavLink href="#section3" onClick={() => setVisible(false)}>
                            Catemonics
                        </NavLink>
                        <NavLink href="#section4" onClick={() => setVisible(false)}>
                            How to Buy
                        </NavLink>
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
