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
    TwitterSection,
    GlobalStyle,
} from "./TermoCatLand.styled";
import React, { useState, lazy, Suspense, useEffect } from "react";

import { ReactComponent as DiscordSVG } from "../../assets/termo-cat-land/discord.svg";
import { ReactComponent as TicTokSVG } from "../../assets/termo-cat-land/tiktok.svg";
import { ReactComponent as XWitterSVG } from "../../assets/termo-cat-land/Xwitter.svg";
import { ReactComponent as YouTubeSVG } from "../../assets/termo-cat-land/tube.svg";
import * as process from "process";
import { EPhase } from "./TermoCatModel";
import CatenomicsSection from "./components/CatenomicsSection/CatenomicsSection";
import CoinAddress from "./components/CoinAddress/CoinAddress";
import axios from "axios";
// eslint-disable-next-line import/no-unresolved
import { Tweet } from "react-tweet";

const AirdropPhaseContainer = lazy(() => import("./components/AirdropPhaseContainer/AirdropPhaseContainer"));
const PresalePhase = lazy(() => import("./components/PresalePhase/PresalePhase"));
const HowToByContainer = lazy(() => import("./components/HowToByContainer/HowToByContainer"));

export const TermoCatLand = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const KEY =
        process.env.REACT_APP_THERMOCAT_ADDRESS ?? "0xd06278ad71b5a4d622f179bd21d163d2efc8aaf14e1750884026f63e3d07ca3a";

    const TWEET1 = process.env.REACT_APP_TWEET_1 ?? "1455776873032601600";
    const TWEET2 = process.env.REACT_APP_TWEET_2 ?? "1772306781642867043";
    const TWEET3 = process.env.REACT_APP_TWEET_3 ?? "1762614646572188032";
    const TWEET4 = process.env.REACT_APP_TWEET_4 ?? "1774861431776657560";
    const TWEET5 = process.env.REACT_APP_TWEET_5 ?? "1773445706826609080";
    const TWEET6 = process.env.REACT_APP_TWEET_6 ?? "1767564996496519613";

    const phase = (process.env.REACT_APP_THERMOCAT_CURRENT_TOKEN_PHASE ?? EPhase.AIRDROP) as EPhase;
    const phaseRoutes = {
        [EPhase.AIRDROP]: "Air drop",
        [EPhase.PRE_SALE]: "Presale",
        [EPhase.TRADING]: "How to Buy",
    };

    const getTweets = async () => {
        const url = "https://api.twitter.com/1.1/search/tweets.json";
        const params = {
            q: "%23example", // Замените #example на ваш хештег
            count: 5,
        };
        const headers = {
            Authorization: `Bearer AAAAAAAAAAAAAAAAAAAAABFdtAEAAAAAjd1ZkBFh6yUMxhdy8j9IF8Qp8ko%3DghyiTkrOJ1b87ZjRtro3M7bHzZmmnGTo5CfeysWvMJ3rn9gMt3`, // Замените YOUR_BEARER_TOKEN на ваш токен доступа
        };

        try {
            const response = await axios.get(url, { params, headers });
            console.log(response.data);
            // Обработайте полученные твиты здесь
        } catch (error) {
            console.error("Ошибка при получении твитов:", error);
        }
    };

    useEffect(() => {
        getTweets();
    }, []);

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
                return <Suspense fallback={<div>Loading Airdrop...</div>}>{<AirdropPhaseContainer />}</Suspense>;
            case EPhase.PRE_SALE:
                return (
                    <Suspense fallback={<div>Loading Presale...</div>}>
                        <PresalePhase />
                    </Suspense>
                );
            case EPhase.TRADING:
                return (
                    <Suspense fallback={<div>Loading Trading...</div>}>
                        <HowToByContainer />
                    </Suspense>
                );
            default:
                return <div>No phase selected</div>;
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
                    <div className="text">$THERMO CAT</div>
                    <div className="text">$THERMO CAT</div>
                    <div className="text">$THERMO CAT</div>
                    <div className="text">$THERMO CAT</div>
                    <div className="text">$THERMO CAT</div>
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
                        <ImageWrapper
                            loading="lazy"
                            src={require("../../assets/termo-cat-land/aboutCat.webp")}
                        ></ImageWrapper>
                    </AboutCard>
                    <h1 id="story" style={{ textAlign: "start" }}>
                        Thermo Cat's Origin Story
                    </h1>
                    <ComicsContainerMobile
                        loading="lazy"
                        rel="preload"
                        src={require("assets/termo-cat-land/comics_mob.webp")}
                    />
                    <ComicsContainer
                        loading="lazy"
                        rel="preload"
                        src={require("assets/termo-cat-land/comics_1-1.webp")}
                    />
                    <ComicsText>
                        When the blaze subsided and the embers cooled, <span>Thermo Cat</span> emerged, forever changed.
                        No longer an ordinary house cat, absorbing all the digital <span>HEAT</span>, it now became a
                        radiant display of <span>infrared grace</span>!
                    </ComicsText>

                    <ComicsContainer id="story" loading="lazy" src={require("assets/termo-cat-land/comics_2.webp")} />
                    <ComicsContainerMobile
                        id="story"
                        loading="lazy"
                        src={require("assets/termo-cat-land/reborn_Mob.webp")}
                    />
                    <span className="end-comics">to be continued...</span>
                </AboutContainer>
                <CatenomicsSection></CatenomicsSection>
                {renderPhaseSwitch(phase as EPhase)}

                <Suspense fallback={<h2>Loading...</h2>}>
                    <GlobalStyle />
                    <TwitterSection>
                        <div className="tweet dark">
                            <Tweet id={TWEET1} />
                        </div>
                        <div className="tweet dark">
                            <Tweet id={TWEET2} />
                        </div>
                        <div className="tweet dark">
                            <Tweet id={TWEET3} />
                        </div>
                        <div className="tweet dark">
                            <Tweet id={TWEET4} />
                        </div>
                        <div className="tweet dark">
                            <Tweet id={TWEET5} />
                        </div>
                        <div className="tweet dark">
                            <Tweet id={TWEET6} />
                        </div>
                    </TwitterSection>
                </Suspense>

                <LinksSection>
                    <div className="links">
                        <NavLink href="#about">About</NavLink>
                        <NavLink href="#story">Story</NavLink>
                        <NavLink href="#catenomics">Catenomics</NavLink>
                        <NavLink href={"#" + phase}>{phaseRoutes[phase]}</NavLink>
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
