import { CatHeader } from "./components/Header/CatHeader";
import {
    AboutCard,
    AboutContainer,
    ComicsContainer,
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
    StyledInput,
    TermoCatCoinLine,
    TextWrapper,
    TwitterSection,
} from "./TermoCatLand.styled";
import React, { useState } from "react";
import { HowToByContainer } from "./components/HowToByContainer/HowToByContainer";
import { CatenomicsSection } from "./components/CatenomicsSection/CatenomicsSection";

import { ReactComponent as DiscordSVG } from "../../assets/termo-cat-land/discord.svg";
import { ReactComponent as TicTokSVG } from "../../assets/termo-cat-land/tiktok.svg";
import { ReactComponent as XWitterSVG } from "../../assets/termo-cat-land/Xwitter.svg";
import { ReactComponent as YouTubeSVG } from "../../assets/termo-cat-land/tube.svg";
import * as process from "process";
import { Tweet } from "react-twitter-widgets";
import { AirdropPhaseContainer } from "./components/AirdropPhaseContainer/AirdropPhaseContainer";
import { PresalePhase } from "./components/PresalePhase/PresalePhase";
import { EPhase } from "./TermoCatModel";

export const TermoCatLand = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const KEY =
        process.env.REACT_APP_THERMOCAT_ADDRESS ?? "0xd06278ad71b5a4d622f179bd21d163d2efc8aaf14e1750884026f63e3d07ca3a";

    const phase = EPhase.AIRDROP;

    const copyLink = async () => {
        try {
            console.log(process.env);
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
                            <StyledInput placeholder="XXXXXXXXXXXXXX" value={KEY}></StyledInput>
                            <CopyButton onClick={copyLink}>{copySuccess ? "Copied!" : "Copy address"}</CopyButton>
                        </div>
                    </PreviewBody>
                </PreviewContainer>
                <TermoCatCoinLine>
                    <div className="text">TERMOCAT COIN</div>
                    <div className="text">TERMOCAT COIN</div>
                    <div className="text">TERMOCAT COIN</div>
                    <div className="text">TERMOCAT COIN</div>
                    <div className="text">TERMOCAT COIN</div>
                </TermoCatCoinLine>
                <AboutContainer id="section1">
                    <AboutCard>
                        <TextWrapper className={isExpanded ? "expanded" : "collapsed"}>
                            <h1>About</h1>
                            <div className="text-content">
                                Thermo Cat was a frequent visitor of the NFT Burner Chambers, captivated by the sight of
                                transcended pixels as he watched old digital art disintegrate into something new.
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
                    <h1 style={{ textAlign: "start" }}>Thermo Cat's Origin Story</h1>
                    <ComicsContainer id="section2" src={require("assets/termo-cat-land/comics_1.png")} />
                    <ComicsText>
                        When the blaze subsided and the embers cooled,<span>Thermo Cat</span> emerged, forever changed.
                        No longer an ordinary house cat, absorbing all the digital <span>HEAT</span>, it now became a
                        radiant display of <span>infrared grace</span>!
                    </ComicsText>

                    <ComicsContainer src={require("assets/termo-cat-land/comics_2.png")} />
                    <span className="end-comics">to be continued...</span>
                </AboutContainer>
                <CatenomicsSection></CatenomicsSection>
                {renderPhaseSwitch(phase as EPhase)}

                <TwitterSection>
                    <Tweet tweetId="1455776873032601600" options={{ theme: "dark", height: "400" }} />
                    <Tweet tweetId="1772306781642867043" options={{ theme: "dark", height: "400" }} />
                    <Tweet tweetId="1455776873032601600" options={{ theme: "dark", height: "400" }} />
                    <Tweet tweetId="1772306781642867043" options={{ theme: "dark", height: "400" }} />
                </TwitterSection>

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
                            <DiscordSVG className="item"></DiscordSVG>
                            <TicTokSVG className="item"></TicTokSVG>
                            <XWitterSVG className="item"></XWitterSVG>
                            <YouTubeSVG className="item"></YouTubeSVG>
                        </div>
                    </div>
                </LinksSection>
            </LandWrapper>
        </>
    );
};
