import { styled } from "styled-components";
import React, { RefObject, useRef } from "react";
import "./About.css";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";

import { ReactComponent as DownArrowIcon } from "../../assets/svg/downArrow.svg";
import { ReactComponent as RightArrowIcon } from "../../assets/svg/rightArrow.svg";
import { Header } from "../../components/Header/Header";

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
    color: #fff;

    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-family: Poppins;
    font-size: clamp(24px, 10vw, 296px);
    font-style: normal;
    font-weight: 700;

    line-height: 100%;

    text-align: center;

    margin: 3vh;

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
    color: #fff;

    font-family: Rubik;
    font-size: clamp(4px, 5vw, 24px);
    font-style: normal;
    font-weight: 400;

    text-align: center;

    letter-spacing: 3px;
`;

export const StartText = styled.span`
    color: #b53600;

    font-family: Rubik;
    font-size: clamp(4px, 5vw, 28px);
    font-style: normal;
    font-weight: 500;

    text-align: center;

    letter-spacing: 3px;
`;

export const StartMenuButton = styled.button`
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
    }
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
            <StartTitleAndButtonContainer>
                <MainQuoteText>ANNIHILATE THE DEPRECTIATED</MainQuoteText>
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
                        onClick={() => {
                            setAboutPageActive(false);
                            GReactGLBridgeFunctions.OnStartButtonPressed();
                        }}
                    >
                        <StartText>START</StartText>
                        <RightArrowIcon />
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
    overflow: scroll;
    align-items: center;
    justify-content: center;
    z-index: 2;
    top: 64px;
`;

export const LPSection = styled.div`
    width: 100vw;
    height: 100vh;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
`;

export const LPSectionHalf = styled.div`
    width: 100vw;
    height: 50vh;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    align-items: center;
`;

export const SectionDivider = styled.div`
    width: 80vw;
    height: 1px;
    margin-left: 10vw;
    background-color: #515158;
`;

export const LPTitleTextSemibold = styled.span`
    color: #fff;
    /* text-shadow:
        0px 0px 50px rgba(255, 255, 255, 0.5),
        0px 0px 10px #fff; */
    font-family: Poppins;
    font-style: normal;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: 2px;
    text-transform: uppercase;
`;

export const LPTitleTextBold = styled(LPTitleTextSemibold)`
    font-weight: 700;
`;

export const LPDescText = styled.span`
    color: #fff;

    font-family: Rubik;
    font-size: 24px;
    font-style: normal;
    font-weight: 400;
    line-height: 160%;
    letter-spacing: 0.48px;
    width: 40vw;
`;

export const LPTitleBackground = styled.div`
    width: 75vw;
    height: 40vh;
    background-color: orangered;
    display: flex;
    align-items: center;
    justify-content: center;
`;

//=========================
// 	  	   PAGE 2
//=========================

export const Page2Title = styled(LPTitleTextSemibold)`
    margin-top: 10vh;
    font-size: clamp(24px, 5vw, 296px);
    width: 75vw;
`;

export const Page2Title2 = styled(LPTitleTextBold)`
    font-size: clamp(24px, 3vw, 296px);
    text-align: center;
    display: flex;
    align-items: center;
    width: 80%;
    justify-content: center;
`;

export const LPPage2 = ({ refProp }: { refProp: RefObject<HTMLDivElement> }) => {
    return (
        <LPSection ref={refProp}>
            <Page2Title>
                A Call for Renewal: <br /> The Case for Burning NFTs
            </Page2Title>
            <LPDescText>
                <p>The NFT market, once vibrant and dynamic, now faces a critical juncture, and the question arises:</p>
            </LPDescText>
            <LPTitleBackground>
                <Page2Title2>
                    How can we breathe new life into a space that was once synonymous with innovation and artistic
                    expression?
                </Page2Title2>
            </LPTitleBackground>
        </LPSection>
    );
};

export const LPPage2Additional = () => (
    <LPSectionHalf>
        <Page2Title>
            A Call for Renewal: <br /> The Case for Burning NFTs
        </Page2Title>
    </LPSectionHalf>
);

//=========================
// 	  	   PAGE 3
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
                <LPPage2Additional />
                <SectionDivider />
            </LPContainerMain>
        </>
    );
};
