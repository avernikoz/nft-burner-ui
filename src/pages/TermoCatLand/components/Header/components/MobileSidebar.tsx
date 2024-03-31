import { NavLink } from "../CatHeader.styled";
import { EPhase } from "../../../TermoCatModel";
import { BuyNowButton } from "../../../TermoCatLand.styled";
import { Button } from "primereact/button";
import React, { useState } from "react";
import { Sidebar } from "primereact/sidebar";
import { styled } from "styled-components";

const MobileNav = styled.nav`
    display: none;

    @media screen and (max-width: 1000px) {
        display: block;
    }

    .burger {
        color: white;
    }
`;

const SideBarContent = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 1rem;
`;

const BlackSideBar = styled(Sidebar)`
    background-color: #000000;
`;

const MobileSidebar = () => {
    const [visible, setVisible] = useState(false);
    const phaseRoutes = {
        [EPhase.AIRDROP]: "Air drop",
        [EPhase.PRE_SALE]: "Pre sale",
        [EPhase.TRADING]: "How to Buy",
    };

    const phase = (process.env.REACT_APP_THERMOCAT_CURRENT_TOKEN_PHASE ?? EPhase.TRADING) as EPhase;

    return (
        <MobileNav>
            <BlackSideBar position="right" visible={visible} onHide={() => setVisible(false)} color="secondary">
                <SideBarContent>
                    <NavLink href="#about" onClick={() => setVisible(false)}>
                        About
                    </NavLink>
                    <NavLink href="#story" onClick={() => setVisible(false)}>
                        Story
                    </NavLink>
                    <NavLink href="#catenomics" onClick={() => setVisible(false)}>
                        Catemonics
                    </NavLink>
                    <NavLink href={"#" + phase} onClick={() => setVisible(false)}>
                        {phaseRoutes[phase]}
                    </NavLink>
                    {phase == EPhase.TRADING && (
                        <BuyNowButton>
                            Buy Now
                            <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
                        </BuyNowButton>
                    )}
                </SideBarContent>
            </BlackSideBar>
            <Button icon="pi pi-bars burger" text onClick={() => setVisible(true)} />
        </MobileNav>
    );
};

export default MobileSidebar;
