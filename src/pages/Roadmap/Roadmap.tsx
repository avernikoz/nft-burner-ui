import React from "react";
import { styled } from "styled-components";
import { ReactComponent as FireStepCircle } from "../../assets/roadmap/stepCircle.svg";
import { ReactComponent as TwitterLogo } from "../../assets/roadmap/Twitter.svg";
import { ReactComponent as InstLogo } from "../../assets/roadmap/inst.svg";
import { Header } from "../../components/Header/Header";
import { EAppPages } from "../App/AppModel";

const RoadmapContainer = styled.div`
    width: 70vw;
    margin: 6rem auto auto;
    font-family: Khand;
    color: white;
    z-index: 100;

    @media (max-width: 700px) {
        width: 80vw;
    }

    h1 {
        font-size: 4rem;
        margin-bottom: 0;
        margin-left: 1.5rem;
    }

    .small-svg {
        width: 56px;
        height: 56px;
    }

    .last-fire-circle {
        width: 96px;
        height: 99px;
        position: absolute;
        bottom: -89px;
        left: -18px;
    }
`;

const StepperContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: start;
    position: relative;
`;

const Step = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    position: relative;
`;

const VerticalLine = styled.div`
    top: 20px;
    left: 50%;
    width: 5px;
    height: 200px;
    background-color: #ff852d;
    z-index: -1;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    margin-left: 1.65rem;
`;

const SmallVerticalLine = styled.div`
    width: 5px;
    height: 3.75em;
    background-color: #ff852d;
    z-index: -1;
    margin-top: 0.5em;
    margin-bottom: 0.5rem;
    margin-left: 1.65rem;
`;

const HorizontalLine = styled.div`
    left: 50%;
    width: 12.5em;
    height: 5px;
    background-color: #ff852d;
    z-index: -1;
    margin: 0.5rem 1rem 0.5rem 0.5rem;

    @media (max-width: 700px) {
        display: none;
    }
`;

const TextBody = styled.div`
    display: flex;
    flex-direction: row;
    align-items: start;
    height: 2.5rem;

    @media (max-width: 700px) {
        height: 3em;
        flex-direction: column;
        margin: 1rem;

        h2 {
            margin: 0;
        }
    }

    h2 {
        margin-top: 0.5rem;
        margin-bottom: 0.5rem;
    }

    .description {
        display: flex;
        flex-direction: column;
        max-width: 16em;

        @media (max-width: 700px) {
            h2 {
                margin: 0;
            }
        }

        .description-body {
            margin-top: 0.4rem;
            color: #ffffff80;
            font-family: sans-serif;
        }
    }

    .date {
        margin-right: 1rem;
        @media (max-width: 700px) {
            margin: 0;
        }
    }
`;

export interface IStep {
    title: string;
    date: string;
    descriptions: string[];
}

const LinkFooter = styled.div`
    margin: 10rem auto 2rem;
    width: 70vw;
    font-family: Khand;
    color: white;

    @media (max-width: 700px) {
        width: 90vw;
    }

    @media (max-width: 900px) {
        width: 80vw;
    }

    hr {
        border-color: #515158;
    }

    .footer-wrapper {
        display: flex;
        flex-direction: row;
        justify-content: space-around;
        align-items: center;
        font-family: "Poppins", sans-serif;

        h2 {
            font-size: clamp(1rem, 9vw, 2.5em);
        }

        @media (max-width: 820px) {
            flex-direction: column;
            justify-content: start;
        }
    }

    .links {
        min-height: 5rem;
        margin-left: 1rem;

        a {
            margin-right: 1rem;
        }
    }
`;

export const Roadmap = ({ setActivePage }: { setActivePage: (isAboutPageActive: EAppPages) => void }) => {
    const steps: IStep[] = [
        {
            date: "February 2024",
            title: "Building PoC",
            descriptions: [
                `Support NFT collections using Mysten Kiosk with OriginByte Kiosk extension.`,
                `Integrate first Burning Tools and Burning Surface.`,
                `Add audio for UI and sfx.`,
            ],
        },
        {
            date: "March 2024",
            title: "Performance optimizations",
            descriptions: [
                `Optimize Rendering Engine performance to support lower-end devices.`,
                `Improve metadata fetching performance by leveraging off-chain and on-chain data sources.`,
                `Add support for Bluemove NFT collection standard.`,
            ],
        },
        {
            date: "April 2024",
            title: "Utility Coin & Physical Engine",
            descriptions: [
                `Integrate Physics Engine with Rigid Body Simulation and Springs to add dynamics to the burning process.`,
                `Design in-app economics and revenue model for the utility coin launch.`,
                `Develop smart contracts for utility coin usage within the app.`,
            ],
        },
        {
            date: "May 2024",
            title: "Minting Burned NFTs",
            descriptions: [
                `Allow user's to mint the burned versions of their nfts as a separate nft collection. `,
                `Integrate additional Burning Surface Material Types and Burnt Image style.`,
                `Add interactive Velocity Field and Procedural Density Texture for dynamic vfx.`,
            ],
        },
        {
            date: "June 2024",
            title: "Bridge NFTs from other chains",
            descriptions: [``],
        },
    ];

    return (
        <>
            <Header setActivePage={setActivePage} />
            <RoadmapContainer>
                <h1>ROADMAP</h1>
                <StepperContainer>
                    <SmallVerticalLine />
                    {steps.map((step, index) => (
                        <div key={index}>
                            <Step>
                                <div className="small-svg">
                                    <FireStepCircle width={56} height={56}>
                                        {index + 1}
                                    </FireStepCircle>
                                </div>
                                <HorizontalLine />
                                <TextBody>
                                    <h2 className="date">{step.date}</h2>
                                    <div className="description">
                                        <h2>{step.title}</h2>
                                        <p className="description-body">
                                            {step.descriptions.map((el) => (
                                                <>
                                                    {el} <br />
                                                </>
                                            ))}
                                        </p>
                                    </div>
                                </TextBody>
                            </Step>
                            <VerticalLine></VerticalLine>
                        </div>
                    ))}
                    <div className="last-fire-circle">
                        <FireStepCircle></FireStepCircle>
                    </div>
                </StepperContainer>
                <LinkFooter>
                    <hr />
                    <div className="footer-wrapper">
                        <h2>OUR SOCIAL MEDIA</h2>
                        <div className="links">
                            <a className="logo" href="https://twitter.com/nftburnerapp">
                                <TwitterLogo />
                            </a>
                            <a
                                className="logo"
                                href="https://www.instagram.com/nftburnerapp?igsh=em81OTFnc3psanhq&utm_source=qr "
                            >
                                <InstLogo />
                            </a>
                        </div>
                    </div>
                </LinkFooter>
            </RoadmapContainer>
        </>
    );
};
