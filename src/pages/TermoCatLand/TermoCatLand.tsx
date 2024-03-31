import { CatHeader } from "./components/Header/CatHeader";
import {
    AboutCard,
    AboutContainer,
    ComicsContainer,
    ComicsContainerMobile,
    ComicsText,
    CopyButton,
    ImageWrapper,
    LandWrapper,
    LinksSection,
    NavLink,
    PreviewBody,
    PreviewContainer,
    ReadMoreButton,
    StyledHeadingLogo,
    TermoCatCoinLine,
    TextWrapper,
} from "./TermoCatLand.styled";
import React, { useState } from "react";
import { HowToByContainer } from "./components/HowToByContainer/HowToByContainer";
import { CatenomicsSection } from "./components/CatenomicsSection/CatenomicsSection";

import { ReactComponent as DiscordSVG } from "../../assets/termo-cat-land/discord.svg";
import { ReactComponent as TicTokSVG } from "../../assets/termo-cat-land/tiktok.svg";
import { ReactComponent as XWitterSVG } from "../../assets/termo-cat-land/Xwitter.svg";
import { ReactComponent as YouTubeSVG } from "../../assets/termo-cat-land/tube.svg";
import * as process from "process";
import { AirdropPhaseContainer } from "./components/AirdropPhaseContainer/AirdropPhaseContainer";
import { PresalePhase } from "./components/PresalePhase/PresalePhase";
import { EPhase } from "./TermoCatModel";
import { CoinAddress } from "./components/CoinAddress/CoinAddress";

export const TermoCatLand = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const KEY =
        process.env.REACT_APP_THERMOCAT_ADDRESS ?? "0xd06278ad71b5a4d622f179bd21d163d2efc8aaf14e1750884026f63e3d07ca3a";

    const phase = process.env.REACT_APP_THERMOCAT_CURRENT_TOKEN_PHASE ?? EPhase.AIRDROP;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(KEY);
            setCopySuccess("Copied!");
        } catch (err) {
            setCopySuccess("Failed to copy!");
        }
    };

    const renderPhaseSwitch = (currentPhase: EPhase) => {
        switch (currentPhase) {
            case EPhase.AIRDROP:
                return <AirdropPhaseContainer></AirdropPhaseContainer>;
            case EPhase.PRE_SALE:
                return <PresalePhase></PresalePhase>;
            case EPhase.TRADING:
                return <HowToByContainer></HowToByContainer>;
        }
    };

    return (
        <>
            <LandWrapper>
                <PreviewContainer>
                    <CatHeader></CatHeader>
                    <PreviewBody>
                        <StyledHeadingLogo />
                        <div className="control">
                            <CoinAddress address={KEY}></CoinAddress>
                            <CopyButton onClick={copyLink}>{copySuccess ? "Copied!" : "Copy address"}</CopyButton>
                        </div>
                    </PreviewBody>
                </PreviewContainer>
                <TermoCatCoinLine>
                    <div className="text">THERMO COIN</div>
                    <div className="text">THERMO COIN</div>
                    <div className="text">THERMO COIN</div>
                    <div className="text">THERMO COIN</div>
                    <div className="text">THERMO COIN</div>
                </TermoCatCoinLine>
                <AboutContainer id="about">
                    <AboutCard>
                        <TextWrapper className={isExpanded ? "expanded" : "collapsed"}>
                            <h1>About</h1>
                            <div className="text-content">
                                <p>
                                    Thermo Cat was a frequent visitor of the NFT Burner Chambers, captivated by the
                                    sight of transcended pixels as he watched old digital art disintegrate into
                                    something new.
                                </p>
                                <p>
                                    But one fateful night, an oversight occurred: a forgetful artist neglected to
                                    evacuate our Cat before commencing the burning of NFTs.  As the pixels ignited and
                                    the chamber grew infernal, poor Cat was bathed in a torrent of scorching HEAT and
                                    blockchain energy.
                                </p>
                                <p>
                                    When the blaze subsided and the embers cooled, Thermo Cat emerged from the smoke,
                                    forever changed. No longer an ordinary house cat, absorbing all the digital HEAT, it
                                    now exuded an ethereal glow, its once-muted fur now a radiant display of infrared
                                    grace.
                                </p>
                                <p>
                                    Dubbed "Thermo Cat" by the astonished artists who witnessed its miraculous
                                    metamorphosis, the feline became a living legend within the art community. Its
                                    presence in the NFT Burning Chamber was regarded as a symbol of experimentation and
                                    discovery in the digital age.
                                </p>
                            </div>
                        </TextWrapper>
                        <ReadMoreButton onClick={() => setIsExpanded(!isExpanded)}>
                            Read more
                            {isExpanded ? (
                                <i className="pi pi-arrow-up ms-2"></i>
                            ) : (
                                <i className="pi pi-arrow-down ms-2"></i>
                            )}
                        </ReadMoreButton>
                        <ImageWrapper src={require("../../assets/termo-cat-land/aboutCat.png")}></ImageWrapper>
                    </AboutCard>
                    <h1 id="story" style={{ textAlign: "start" }}>
                        Thermo Cat's Origin Story
                    </h1>
                    <ComicsContainerMobile src={require("assets/termo-cat-land/comics_mob.webp")} />
                    <ComicsContainer src={require("assets/termo-cat-land/comics_1-1.webp")} />
                    <ComicsText>
                        When the blaze subsided and the embers cooled,<span>Thermo Cat</span> emerged, forever changed.
                        No longer an ordinary house cat, absorbing all the digital <span>HEAT</span>, it now became a
                        radiant display of <span>infrared grace</span>!
                    </ComicsText>

                    <ComicsContainer id="story" src={require("assets/termo-cat-land/comics_2.webp")} />
                    <ComicsContainerMobile id="story" src={require("assets/termo-cat-land/reborn_Mob.webp")} />
                    <span className="end-comics">to be continued...</span>
                </AboutContainer>
                <CatenomicsSection></CatenomicsSection>
                {renderPhaseSwitch(phase as EPhase)}

                <LinksSection>
                    <div className="links">
                        <NavLink href="#section1">About</NavLink>
                        <NavLink href="#section2">Story</NavLink>
                        <NavLink href="#section3">Catemonics</NavLink>
                        <NavLink href="#section4">How to Buy</NavLink>
                    </div>
                    <div className="joinUs">
                        <span>Join us</span>
                        <div className="joinUsList">
                            <a href="https://twitter.com/nftburnerapp">
                                <DiscordSVG className="item"></DiscordSVG>
                            </a>

                            <a href="https://www.tiktok.com/@nftburnerio?_t=8l5ZDPO93se&_r=1">
                                <TicTokSVG className="item"></TicTokSVG>
                            </a>
                            <a href="https://twitter.com/nftburnerapp">
                                <XWitterSVG className="item"></XWitterSVG>
                            </a>

                            <a href="https://youtube.com/@NFTBurner?si=EQH-Uh9h3MyoDm6T">
                                <YouTubeSVG className="item"></YouTubeSVG>
                            </a>
                        </div>
                    </div>
                </LinksSection>
            </LandWrapper>
        </>
    );
};
