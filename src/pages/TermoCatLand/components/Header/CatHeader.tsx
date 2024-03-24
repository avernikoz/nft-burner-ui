import React from "react";
import { HeaderContainer, NavLinks, StyledLogo } from "./CatHeader.styled";
import { BuyNowButton, NavLink } from "../../TermoCatLand.styled";
import { ReactComponent as Logo } from "../../../../assets/termo-cat-land/catLogo.svg";
export function CatHeader() {
    // const [visible, setVisible] = useState(false);

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
            {/*{*/}
            {/*    <>*/}
            {/*        <Sidebar position="right" visible={visible} onHide={() => setVisible(false)}>*/}
            {/*            <SideBarContent>*/}
            {/*                <NavLink>About</NavLink>*/}
            {/*                <NavLink>Story</NavLink>*/}
            {/*                <NavLink>Catemonics</NavLink>*/}
            {/*                <NavLink>How to Buy</NavLink>*/}
            {/*            </SideBarContent>*/}
            {/*        </Sidebar>*/}
            {/*        <Button icon="pi pi-arrow-right" onClick={() => setVisible(true)} />*/}
            {/*    </>*/}
            {/*}*/}
        </HeaderContainer>
    );
}
