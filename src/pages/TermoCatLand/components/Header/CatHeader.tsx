import React, { lazy, Suspense } from "react";
import { HeaderContainer, NavLink, NavLinks, StyledLogo } from "./CatHeader.styled";
import { BuyNowButton } from "../../TermoCatLand.styled";
import { ReactComponent as Logo } from "../../../../assets/termo-cat-land/catLogo.svg";
import { EPhase } from "../../TermoCatModel";

const SideBar = lazy(() => import("./components/MobileSidebar"));
export function CatHeader() {
    const phaseRoutes = {
        [EPhase.AIRDROP]: "Air drop",
        [EPhase.PRE_SALE]: "Presale",
        [EPhase.TRADING]: "How to Buy",
    };

    const phase = (process.env.REACT_APP_THERMOCAT_CURRENT_TOKEN_PHASE ?? EPhase.TRADING) as EPhase;

    return (
        <HeaderContainer>
            <StyledLogo>
                <Logo></Logo>
            </StyledLogo>
            <NavLinks>
                <NavLink href="#about">About</NavLink>
                <NavLink href="#story">Story</NavLink>
                <NavLink href="#catenomics">Catenomics</NavLink>
                <NavLink href={"#" + phase}>{phaseRoutes[phase]}</NavLink>
                {phase == EPhase.TRADING && (
                    <BuyNowButton>
                        Buy Now
                        <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
                    </BuyNowButton>
                )}
            </NavLinks>
            <Suspense>
                <SideBar></SideBar>
            </Suspense>
        </HeaderContainer>
    );
}
