import { styled } from "styled-components";
import React, { RefObject, useEffect, useRef, useState } from "react";
import "./About.css";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";

import { ReactComponent as DownArrowIcon } from "../../assets/svg/downArrow.svg";
import { ReactComponent as RightArrowIcon } from "../../assets/svg/rightArrow.svg";
import { Header } from "../../components/Header/Header";
import { ProgressSpinner } from "primereact/progressspinner";

//=========================
// 	  PAGE 1 : START
//=========================

export const StartScreenWrapMain = styled.div`
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: flex-start;
    flex-direction: column;
    align-items: center;
    //background-color: rgba(233, 15, 15, 0.815);
`;

export const MainQuoteText = styled.span`
    color: #ebebeb;

    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-family: Poppins;
    font-size: clamp(24px, 10vw, 296px);
    font-style: normal;
    font-weight: 700;

    line-height: 85%;

    text-align: center;

    margin: 10vh;

    width: 90vw;
    //height: 50%;
`;

export const StartTitleAndButtonContainer = styled.div`
    width: 100vw;
    height: 80vh;
    display: flex;
    justify-content: space-around;
    flex-direction: column;
    align-items: center;
    //background-color: rgba(233, 15, 15, 0.815);
`;

export const AboutStartContainer = styled.div`
    width: clamp(300px, 80vw, 620px);
    height: 80px;
    display: inline-flex;
    //margin: 50px;
    /* justify-content: flex-end;
    align-items: flex-end; */
    background-color: rgba(0, 0, 0, 0);
`;

export const AboutText = styled.span`
    font-family: Rubik;
    font-size: clamp(4px, 5vw, 24px);
    font-style: normal;
    font-weight: 400;

    text-align: center;

    letter-spacing: 3px;
`;

export const StartText = styled.span`
    color: rgba(0.5, 0.5, 0.5, 0);
    //color: #b53600;

    font-family: Rubik;
    font-size: clamp(4px, 5vw, 28px);
    font-style: normal;
    font-weight: 500;

    text-align: center;

    letter-spacing: 3px;

    /* --progress: 20%; */
    /* background: linear-gradient(90deg, #ce3e00 0, #ce3e00 20%, #969696 20%); */
    /* background-clip: text; */
`;

export const StartMenuButton = styled.button`
    color: #fff;

    width: 50%;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 10%;
    border: 1px solid #fff;
    background-color: rgba(0, 0, 0, 0);

    &:hover {
        background-color: #ffffff;

        ${AboutText} {
            color: rgba(0, 0, 0, 1);
        }

        svg {
            color: rgba(0, 0, 0, 1);
        }
    }

    &:disabled {
        &:hover {
            background-color: rgba(0, 0, 0, 0);
        }
    }
`;

const titleArray = [
    () => (
        <MainQuoteText>
            ANNIHILATE <br /> THE <br /> DEPRECIATED
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            BURN YOUR <br /> OBSOLETE <br /> RELICS
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            CONFLAGRATION <br /> BRINGS <br /> REDEMPTION
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            SUMMON THE <br /> CLEANSING <br /> FLAMES
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            ERADICATE <br /> HOLLOW <br /> CREATIONS
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            INCINERATE <br /> YOUR FAUX <br /> TREASURES
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            LET THE FLAMES <br /> DEVOUR <br /> THE PRETENSE
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            PURGE AWAY <br /> THE <br /> RESENTMENT
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            THE DEMISE <br /> OF ETERNAL <br /> INFAMY
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            VINDICATION <br /> FOR <br /> THE DECEIVED
        </MainQuoteText>
    ),
    //
    () => (
        <MainQuoteText>
            CULMINATION <br /> OF THE <br /> PLAGUED ERA
        </MainQuoteText>
    ),
];

const GetRandomTitle = () => {
    const randomIndex = Math.floor(Math.random() * titleArray.length);
    return titleArray[randomIndex]();
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const RandomTitle = GetRandomTitle();

export const AboutFirstSection = ({
    setAboutPageActive,
    setShowMore,
}: {
    setAboutPageActive: (isAboutPageActive: boolean) => void;
    setShowMore: () => void;
}) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [loadingPercentage, setLoadingPercentage] = useState(0);
    const [loadingFinished, setLoadingFinished] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line prefer-const
        let intervalId: string | number | NodeJS.Timeout | undefined;

        const updateProgressBar = () => {
            // Calculate the loading percentage based on your requirements
            const loadProgressRes = GReactGLBridgeFunctions.GetLoadingProgressParameterNormalised();
            if (loadProgressRes !== null) {
                const percentage = loadProgressRes * 100;
                console.debug("loadingPercentage: ", percentage);

                setLoadingPercentage(percentage);
            } else {
                setLoadingPercentage(100);
                setLoadingFinished(true);
                clearInterval(intervalId);
            }
        };

        intervalId = setInterval(updateProgressBar, 250);

        return () => clearInterval(intervalId);
    }, []);

    return (
        <StartScreenWrapMain>
            <StartTitleAndButtonContainer>
                {RandomTitle}
                <AboutStartContainer>
                    <StartMenuButton
                        onClick={() => {
                            GReactGLBridgeFunctions.OnAboutButtonPressed();
                            setShowMore();
                        }}
                    >
                        <AboutText>ABOUT</AboutText>
                        <DownArrowIcon />
                    </StartMenuButton>
                    <StartMenuButton
                        disabled={!loadingFinished}
                        onClick={() => {
                            setAboutPageActive(false);
                            GReactGLBridgeFunctions.OnStartButtonPressed();
                        }}
                    >
                        <StartText
                            style={{
                                background: `text linear-gradient(90deg, #ce3e00 0, #ce3e00 ${loadingPercentage}%, #969696 ${loadingPercentage}%)`,
                                // backgroundClip: "text",
                            }}
                        >
                            START
                        </StartText>
                        {loadingFinished ? (
                            <RightArrowIcon />
                        ) : (
                            <ProgressSpinner
                                strokeWidth={"7"}
                                //color={"white"}
                                style={{ width: "25px", height: "25px", margin: 0 }}
                            />
                        )}
                    </StartMenuButton>
                </AboutStartContainer>
            </StartTitleAndButtonContainer>
        </StartScreenWrapMain>
    );
};

//=========================
// 	  	 LP COMMON
//=========================

export const LPContainerMain = styled.div`
    /* width: 100vw;
    height: 100vh; */
    position: absolute;
    display: block;
    z-index: 1;
    top: 64px;
    overflow: hidden;
    width: 100%;
`;

export const LPSectionExtendable = styled.div`
    width: 100vw;
    position: relative;
    display: flex;
    flex-direction: column;
`;

export const LPSectionExtendableCentered = styled(LPSectionExtendable)`
    justify-content: space-around;
    align-items: center;

    &.page3 {
        background-image: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%),
            url("../assets/lpAssets/Page3.webp");
        background-color: lightgray;
        background-position: 50%;
        background-size: cover;
        background-repeat: no-repeat;
    }
`;

const LPSectionFullscreenCentered = styled(LPSectionExtendableCentered)`
    height: 100vh;
    width: 100vw;
`;

export const LPShrinkContainer = styled(LPSectionExtendableCentered)`
    width: 75vw;
    max-width: 2000px;

    @media screen and (max-width: 1000px) {
        width: 85vw; /* Adjusted width for screen widths up to 2000px */
    }

    @media screen and (max-width: 500px) {
        width: 95vw; /* Adjusted width for screen widths up to 1000px */
    }
`;

export const LPShrinkContainerMid = styled(LPSectionExtendableCentered)`
    width: 60vw;
    max-width: 1600px;

    @media screen and (max-width: 1000px) {
        width: 70vw; /* Adjusted width for screen widths up to 2000px */
    }

    @media screen and (max-width: 500px) {
        width: 80vw; /* Adjusted width for screen widths up to 1000px */
    }
`;

export const TextContainerAlignLeftIndent25 = styled.div`
    width: 100%;
    //padding-left: 10vw;
    //display: inline-flex;
`;

export const TextContainerCenter = styled.div`
    width: 100vw;
    display: inline-flex;
`;

export const DescTextContainerAlignRight = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-end;
`;

export const SectionDivider = styled.div`
    width: 70vw;
    height: 1px;
    margin-left: 15vw;
    background-color: #515158;
`;

export const LPTitleText = styled.span`
    color: #fff;
    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-size: clamp(24px, 5vw, 160px);
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: 2px;
    text-transform: uppercase;
    width: 100%;
`;

export const LPDescText = styled.span`
    color: #fff;

    font-family: Rubik;
    font-size: clamp(16px, 1.25vw, 36px);
    font-style: normal;
    font-weight: 400;
    line-height: 160%;
    letter-spacing: 0.48px;
    //width: clamp(32px, 40vw, 512px);
`;

//=========================
// 	  	   PAGE 2
//=========================

export const Page2Title = styled(LPTitleText)`
    margin-top: clamp(56px, 11vh, 160px);
`;

export const Page2AdditionalTitle = styled(Page2Title)`
    margin-top: clamp(56px, 15vh, 160px);
    font-size: clamp(24px, 5vw, 160px);
    width: 100%;
`;

export const Page2Title2 = styled(LPTitleText)`
    font-size: clamp(24px, 3vw, 296px);
    font-weight: 700;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
`;

export const Page2Title2Background = styled.div`
    height: 40vh;
    background:
        linear-gradient(180deg, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0.5) 100%),
        url("../assets/lpAssets/Page1.webp") center/cover no-repeat;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const SectionDividerSpecific = styled(SectionDivider)`
    position: absolute;
    bottom: 5%;
    margin-left: 0vw;
`;

export const SectionDividerSpecific2 = styled(SectionDivider)`
    position: absolute;
    bottom: 40%;
    margin-left: 0vw;
`;

export const Page2AdditionalImage = styled.div`
    /* --sizeVar: clamp(256px, 30vw, 1024px);
    width: var(--sizeVar);
    height: var(--sizeVar); */

    background: url("../assets/lpAssets/Page2.webp") center/cover no-repeat;
    height: clamp(450px, 35vw, 1170px);
    width: 100vw;
    position: absolute;
    //left: 50%;
    //top: 12.5%;
    bottom: 5%;
    z-index: -1;
`;

export const Page2AddWrapper = styled(LPSectionExtendable)`
    align-items: center;
    margin-top: 20vh;
    margin-bottom: clamp(64px, 15vw, 1024px);
    width: 100%;

    @media screen and (max-width: 576px) {
        margin-bottom: clamp(64px, 45vw, 1024px);
    }
`;

export const Page2DescText = styled(LPDescText)`
    margin-top: 6vh;
    margin-bottom: 8vh;
    width: 50%;
    @media screen and (max-width: 576px) {
        width: 75%;
    }
`;

export const LPPage2Additional = () => (
    <Page2AddWrapper>
        <TextContainerAlignLeftIndent25>
            <LPDescText>
                The proposal on the table is unconventional <br /> yet thought-provoking:
            </LPDescText>
        </TextContainerAlignLeftIndent25>
        <LPShrinkContainerMid>
            <Page2AdditionalTitle>
                the deliberate act <br /> of burning NFTs
            </Page2AdditionalTitle>
        </LPShrinkContainerMid>
    </Page2AddWrapper>
);

export const LPPage2 = ({ refProp }: { refProp: RefObject<HTMLDivElement> }) => {
    return (
        <LPSectionExtendableCentered ref={refProp}>
            <LPShrinkContainer>
                <Page2Title>
                    A Call for Renewal: <br /> The Case for <span style={{ color: "#FF852D" }}>Burning </span>
                    NFTs
                </Page2Title>
                <Page2DescText>
                    The NFT market, once vibrant and dynamic, now faces a critical juncture, and the question arises:
                </Page2DescText>
                <Page2Title2Background>
                    <Page2Title2>
                        How can we breathe new life into a space that was once synonymous with innovation and artistic
                        expression?
                    </Page2Title2>
                </Page2Title2Background>
                <LPPage2Additional />
                <SectionDividerSpecific2 />
                <Page2AdditionalImage />
                <SectionDividerSpecific />
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  	   PAGE 3
//=========================

export const Page3StartTitle = styled(LPTitleText)`
    margin-top: 10vh;
    font-weight: 800;
    font-size: clamp(24px, 2vw, 296px);
`;

export const Page3MainTitle = styled(LPTitleText)`
    margin-top: 2vh;
    margin-bottom: 6vh;
    font-size: clamp(24px, 7vw, 296px);
    line-height: 100%;
`;

export const Page3DescText = styled(LPDescText)`
    margin: 2vh;
    padding: 2vh;
    width: 35%;

    background: radial-gradient(103.55% 95.36% at 50.09% 45.72%, rgba(0, 0, 0, 0.74) 0%, rgba(0, 0, 0, 0) 100%);

    @media screen and (max-width: 1024px) {
        width: 55%;
    }
    @media screen and (max-width: 512px) {
        width: 95%;
    }
`;

export const Page3DescContainer = styled.div`
    background-color: #0051ff;
    display: flex;
    flex-direction: column;
`;

export const Page3BackgroundImage = styled.div`
    width: 75vw;
    height: 75vh;
    position: absolute;
    z-index: -1;
    left: 5%;
    bottom: 0%;
    transform: translate(-10vw, 0);
`;

export const Page3OffsetSpace = styled(LPSectionExtendable)`
    width: 100vw;
    height: 15vh;
`;

export const LPPage3 = () => {
    return (
        <LPSectionExtendableCentered className="page3">
            <LPShrinkContainer>
                <Page3StartTitle>Elevate the Burn:</Page3StartTitle>
                <LPShrinkContainerMid>
                    <Page3MainTitle>Ignite a Visual Spectacle! </Page3MainTitle>
                </LPShrinkContainerMid>
                <DescTextContainerAlignRight>
                    <Page3DescText>
                        Sure, you can technically burn your NFT with a simple transaction on the blockchain. But let's
                        face it — who beyond the NFT or DeFi community cares about a transaction buried in the depths of
                        the blockchain?
                    </Page3DescText>
                    <Page3DescText>
                        Enter our app, where burning your NFT is not just a transaction; it's a visual spectacle, a
                        performance on a digital canvas. Picture this: Your NFTs annihilated in the myriad of effective
                        ways, all meticulously crafted to seize attention and resonate beyond the niche community.
                    </Page3DescText>
                </DescTextContainerAlignRight>
                <Page3OffsetSpace />
                <Page3BackgroundImage />
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  	   PAGE 4
//=========================

export const LPShrinkContainerSpaceAround = styled(LPShrinkContainer)`
    height: 100vh;
    justify-content: space-around;
    padding: 15vh 0;
`;

export const Page4TitleText = styled(LPTitleText)`
    font-size: clamp(42px, 9vw, 296px);
    text-align: center;
    width: 100%;
    line-height: 100%;
    margin-top: 10vh;
`;

export const Page4DescText = styled(LPTitleText)`
    color: #ff852d;
    font-size: clamp(24px, 3.375vw, 296px);
    text-align: center;
    width: 100%;
`;

export const LPPage4 = () => {
    return (
        <LPSectionFullscreenCentered>
            <LPShrinkContainerSpaceAround>
                <Page4TitleText>It's not just about burning</Page4TitleText>
                <Page4DescText>it's a combination of more profound meanings:</Page4DescText>
            </LPShrinkContainerSpaceAround>
        </LPSectionFullscreenCentered>
    );
};

//=========================
// 	  SUB-PAGES COMMON
//=========================

export const SubPageNumber = styled(LPTitleText)`
    color: #ff852d;
    font-size: clamp(24px, 2vw, 128px);
    width: 100%;
    margin-top: 20vh;
`;

export const SubPageFullHeightWrapContainer = styled.div`
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    //justify-content: space-evenly;
`;

export const SubPageTitle = styled(LPTitleText)`
    margin-top: clamp(56px, 5vh, 160px);
    margin-bottom: clamp(56px, 10vh, 160px);
    width: 70%;

    @media screen and (max-width: 1024px) {
        width: 85%;
    }
    @media screen and (max-width: 512px) {
        width: 95%;
    }
`;

export const SubPageDescText = styled(LPDescText)`
    margin-bottom: 8vh;
    width: 50%;
    @media screen and (max-width: 1024px) {
        width: 85%;
    }
    @media screen and (max-width: 512px) {
        width: 95%;
    }
`;

//=========================
// 	  SUB-PAGE 1
//=========================

export const SubPage1Image = styled.div`
    width: 75%;
    height: 75%;
    background: linear-gradient(0deg, rgba(0, 0, 0, 0.25) 0%, rgba(0, 0, 0, 0.25) 100%),
        url("../assets/lpAssets/DistNarrative.webp");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    position: absolute;
    left: 25%;
    //top: 12.5%;
    bottom: 10%;
    z-index: -1;

    @media screen and (max-width: 1024px) {
        left: 35%;
    }
    @media screen and (max-width: 512px) {
        left: 15%;
    }
`;

export const SubPage1 = () => {
    return (
        <LPSectionExtendableCentered>
            <LPShrinkContainer>
                <SubPageFullHeightWrapContainer>
                    <SubPageNumber>01</SubPageNumber>
                    <SubPageTitle>Crafting a Distinct Narrative</SubPageTitle>
                    <SubPageDescText>
                        In subtle dance between destruction and creation, NFT burners are not seeking mere attention;
                        rather, they are embracing a role as contributors to a larger narrative. It's a nuanced
                        approach, allowing for personal expression within the evolving dynamics of the digital space,
                        where visibility is earned through meaningful performances.
                    </SubPageDescText>
                </SubPageFullHeightWrapContainer>
                <SubPage1Image />
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  SUB-PAGE 2
//=========================

export const SubPage2Title = styled(SubPageTitle)`
    font-size: clamp(24px, 4vw, 160px);
`;

export const SubPage2Image = styled.div`
    --sizeVar: clamp(256px, 25vw, 1024px);
    width: var(--sizeVar);
    height: var(--sizeVar);
    background-color: #0051ff;
    position: absolute;
    left: -10%;
    bottom: 15%;
    z-index: -1;

    @media screen and (max-width: 1024px) {
        left: 35%;
    }
    @media screen and (max-width: 512px) {
        left: 20%;
    }
`;

export const SubPageFullHeightWrapContainerIndent = styled(SubPageFullHeightWrapContainer)`
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding-left: 20vw;
    //justify-content: space-evenly;
`;

export const SubPage2 = () => {
    return (
        <LPSectionExtendableCentered>
            <LPShrinkContainer>
                <SubPageFullHeightWrapContainerIndent>
                    <SubPageNumber>02</SubPageNumber>
                    <SubPage2Title>Sharing Your Performance</SubPage2Title>
                    <SubPageDescText>
                        Users have the option to share their NFT burning performance directly on social media platforms.
                        This invites others to witness and engage in the evolving narrative. It's not just burning an
                        NFT; it's creating a shared experience that draws attention organically, fostering community
                        engagement around the unique stories each user is crafting.
                    </SubPageDescText>
                </SubPageFullHeightWrapContainerIndent>
                <SubPage2Image />
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  SUB-PAGE 3
//=========================

export const SubPageNumberWhite = styled(LPTitleText)`
    color: #ffffff;
    font-size: clamp(24px, 2vw, 128px);
    width: 100%;
    margin-top: 7%;
`;

export const SubPage3Title = styled(LPTitleText)`
    margin-top: clamp(32px, 2vh, 160px);
    margin-bottom: clamp(56px, 5vh, 160px);
    width: 100%;
    font-size: clamp(24px, 4vw, 160px);
`;

export const SubPage3DescText = styled(LPDescText)`
    width: 80%;
    margin-bottom: 20vh;
`;

export const SubPage3Canvas = styled.div`
    width: 100%;
    height: 60vh;
    position: absolute;
    bottom: 20%;
    display: flex;
    flex-direction: column;
    padding-left: 5vw;
    background: url("../assets/lpAssets/Authenticity.webp") center/cover no-repeat;
    background-blend-mode: hard-light;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
`;

export const SubPage3 = () => {
    return (
        <LPSectionExtendableCentered>
            <LPShrinkContainer>
                <SubPageFullHeightWrapContainer>
                    <SubPage3Canvas>
                        <SubPageNumberWhite>03</SubPageNumberWhite>
                        <SubPage3Title>Reclaiming Authenticity</SubPage3Title>
                        <SubPage3DescText>
                            As the market floods with NFTs lacking genuine artistic or cultural significance, burning
                            tokens becomes a symbolic act of reclaiming authenticity. By letting go of uninspiring
                            assets, users contribute to a narrative that champions quality over quantity, renewing the
                            focus on genuine artistic expression.
                        </SubPage3DescText>
                    </SubPage3Canvas>
                </SubPageFullHeightWrapContainer>
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  SUB-PAGE 4
//=========================

export const SubPage4DescText = styled(LPDescText)`
    margin-left: 5vw;

    width: 75%;
    @media screen and (max-width: 1024px) {
        width: 85%;
    }
    @media screen and (max-width: 512px) {
        width: 90%;
    }
`;

export const SubPage4DescTextColored = styled(LPTitleText)`
    margin-top: 5vw;
    font-size: clamp(24px, 2vw, 160px);
    margin-left: 5vw;
    color: #ff852d;
    width: 75%;
    @media screen and (max-width: 1024px) {
        width: 85%;
    }
    @media screen and (max-width: 512px) {
        width: 90%;
    }
`;

export const SubPage4 = () => {
    return (
        <LPSectionExtendableCentered>
            <LPShrinkContainer>
                <SubPageFullHeightWrapContainer>
                    <SubPageNumber>04</SubPageNumber>
                    <SubPage3Title>Regaining hope</SubPage3Title>
                    <SubPage4DescText>
                        The call to burn NFTs is not a demand for destruction but a plea for renewal. It's a strategic
                        move to elevate the NFT market from its current state of stagnation, encouraging a renaissance.
                    </SubPage4DescText>
                    <SubPage4DescTextColored>
                        The decision to burn NFTs becomes a declaration of commitment to a future where the digital art
                        space thrives on merit and purpose.
                    </SubPage4DescTextColored>
                </SubPageFullHeightWrapContainer>
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  	   PAGE ECO
//=========================

export const EcoDescText = styled(Page2DescText)`
    background-color: #ffffff;
    color: #003100;
    padding: 48px;
    border-radius: 24px;

    @media screen and (max-width: 576px) {
        width: 95%;
    }
`;

export const EcoTitle = styled(Page2Title)`
    font-size: clamp(24px, 3vw, 160px);
`;

export const CallToActionTitle = styled(LPTitleText)`
    font-size: clamp(24px, 2vw, 296px);
    font-weight: 700;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80%;
`;

export const CallToActionBackground = styled.div`
    height: 40vh;
    background:
        linear-gradient(0deg, rgba(11, 11, 12, 0.2) 0%, rgba(11, 11, 12, 0.2) 100%),
        url("../assets/lpAssets/EcoPage.webp"),
        lightgray -91.461px -119.922px / 114.291% 194.021% no-repeat;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;

    display: flex;
    align-items: center;
    justify-content: center;
`;

export const LPPageFinal = () => {
    return (
        <LPSectionExtendableCentered>
            <LPShrinkContainer>
                <EcoTitle>
                    Digital Responsibility: <br /> Embracing Eco-Friendly NFT Practices
                </EcoTitle>
                <EcoDescText>
                    Letting go of your digital tokens isn't just saying goodbye to a virtual possession – it's a big
                    step toward a more eco-friendly digital world! In a space where the value and legitimacy of many
                    NFTs are uncertain, our approach promotes responsible ownership. Across different blockchains, we
                    strive for eco-friendly practices! Potentially reducing{" "}
                    <span style={{ color: "#D90000" }}>CO2</span> emissions!
                </EcoDescText>
                <CallToActionBackground>
                    <CallToActionTitle>
                        Join us in creating a story where digital ownership aligns with taking care of the environment,
                        subtly lessening the impact of your digital presence!
                    </CallToActionTitle>
                </CallToActionBackground>
            </LPShrinkContainer>
        </LPSectionExtendableCentered>
    );
};

//=========================
// 	  	   ENTRY
//=========================

export const About = ({ setAboutPageActive }: { setAboutPageActive: (isAboutPageActive: boolean) => void }) => {
    const myRef: RefObject<HTMLDivElement> = useRef(null);
    const executeScroll = () => myRef.current?.scrollIntoView({ behavior: "smooth" });

    return (
        <>
            <Header />
            <LPContainerMain>
                <AboutFirstSection setAboutPageActive={setAboutPageActive} setShowMore={executeScroll} />
                <SectionDivider />
                <LPPage2 refProp={myRef} />
                <LPPage3 />
                <LPPage4 />
                <SectionDivider />
                <SubPage1 />
                <SubPage2 />
                <SubPage3 />
                <SubPage4 />
                <SectionDivider />
                <LPPageFinal />
            </LPContainerMain>
        </>
    );
};
