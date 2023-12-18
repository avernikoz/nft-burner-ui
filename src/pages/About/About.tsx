/* eslint-disable @typescript-eslint/no-unused-vars */
import { styled } from "styled-components";
import React, { RefObject, useRef } from "react";
import "./About.css";
import { ProgressBar } from "./ProgressBar";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";

const sectionTextList = [
    "The NFT ecosystem is currently saturated with an overwhelming number of low-value tokens, diluting the essence of true artistic and collectible value. Burning NFTs serves as a means to clear the clutter, allowing more visibility and recognition for high-quality, meaningful digital creations.",
    "As the market floods with NFTs lacking genuine artistic or cultural significance, burning tokens becomes a symbolic act of reclaiming authenticity. By letting go of uninspiring assets, users contribute to a narrative that champions quality over quantity, renewing the focus on genuine artistic expression.",
    "The low volume and diminished value of the NFT market have led some to question the very foundation on which it stands. Burning NFTs invites a conversation about redefining value within the digital art space. It prompts us to explore alternative models that prioritize the intrinsic worth of the creations over speculative trading.",
    "In this subtle dance between destruction and creation, those who embark on the journey of burning NFTs are not seeking mere attention; rather, they are embracing a role as contributors to a larger narrative of reinvention. It's a nuanced approach, allowing for personal expression within the evolving dynamics of the digital art space, where visibility is earned through meaningful performances.",
];

const sectionTitleList = [
    "Clearing the Clutter",
    "Reclaiming Authenticity",
    "Redefining Value",
    "Crafting a Distinct Narrative",
];

const titles = ["ANNIHILATE THE DEPRECTIATED", "ANNIHILATE THE DEPRECTIATED"];

export const MainQuoteText = styled.span`
    color: #fff;

    text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff;
    font-family: Poppins;
    font-size: clamp(24px, 10vw, 196px);
    font-style: normal;
    font-weight: 700;

    text-align: center;

    margin: 10%;

    width: 90vw;
    //height: 50%;
`;

export const HeaderContainer = styled.div`
    width: 100%;
    height: 10vh;
    background-color: #500fe9cf;
`;

export const StartScreenWrapMain = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    align-items: center;
    background-color: rgba(233, 15, 15, 0.815);
`;

export const AboutFirstSection = ({
    setAboutPageActive,
    setShowMore,
}: {
    setAboutPageActive: (isAboutPageActive: boolean) => void;
    setShowMore: () => void;
}) => {
    return (
        <StartScreenWrapMain>
            <HeaderContainer></HeaderContainer>
            <MainQuoteText>ANNIHILATE THE DEPRECTIATED</MainQuoteText>
        </StartScreenWrapMain>

        /* <div className="section">
            <ProgressBar />
            <div className="intro_quote">
                <p>{titles[Math.random()]}</p>
            </div>
            <button
                className="startButton"
                onClick={() => {
                    setAboutPageActive(false);
                    GReactGLBridgeFunctions.OnStartButtonPressed();
                }}
            >
                START
            </button>
            <button
                className="aboutButton"
                onClick={() => {
                    GReactGLBridgeFunctions.OnAboutButtonPressed();
                    setShowMore();
                }}
            >
                ABOUT
            </button>
        </div> */
    );
};

export const AboutSecondSection = ({ refProp }: { refProp: RefObject<HTMLDivElement> }) => {
    return (
        <div className="section" ref={refProp}>
            <div className="intro_quote section_title">
                <p>A Call for Renewal: The Case for Burning NFTs</p>
            </div>
            <div className="intro_quote section_text">
                <p>
                    In the ever-evolving landscape of digital assets, the NFT market, once vibrant and dynamic, now
                    faces a critical juncture. As enthusiasts and creators alike navigate through a sea of low-value
                    entities and witness a decline in market volume, the question arises:
                </p>
                <p>
                    How can we breathe new life into a space that was once synonymous with innovation and artistic
                    expression?
                </p>
                <p>
                    The proposal on the table is unconventional yet thought-provoking: the deliberate act of burning
                    NFTs. This concept, borne out of a desire to revitalize a market drowning in mediocrity, seeks to
                    spark a renaissance by shedding the weight of underwhelming digital assets.
                </p>
            </div>
        </div>
    );
};

export const AboutGenericSection = ({ sectionText, sectionTitle }: { sectionText: string; sectionTitle: string }) => {
    return (
        <div className="section small_height_section">
            <div className="intro_quote section_title">
                <p>{sectionTitle}</p>
            </div>
            <div className="intro_quote section_text">
                <p>{sectionText}</p>
            </div>
        </div>
    );
};

export const About = ({ setAboutPageActive }: { setAboutPageActive: (isAboutPageActive: boolean) => void }) => {
    const myRef: RefObject<HTMLDivElement> = useRef(null);
    const executeScroll = () => myRef.current?.scrollIntoView({ behavior: "smooth" });

    return (
        <div className="sectionContainer">
            <AboutFirstSection setAboutPageActive={setAboutPageActive} setShowMore={executeScroll} />
            <AboutSecondSection refProp={myRef} />
            {sectionTextList.map((text, i) => (
                <AboutGenericSection key={i} sectionText={text} sectionTitle={sectionTitleList[i]} />
            ))}
        </div>
    );
};
