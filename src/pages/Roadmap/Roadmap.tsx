import React from "react";
import { styled } from "styled-components";
import { ReactComponent as FireStepCircle } from "../../assets/roadmap/stepCircle.svg";

const RoadmapContainer = styled.div`
    width: 70vw;
    margin: auto;
    font-family: Khand;
    color: white;
    position: relative;

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
    background-color: #ff4a00;
    z-index: -1;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    margin-left: 1.65rem;
`;

const SmallVerticalLine = styled.div`
    width: 5px;
    height: 3.75em;
    background-color: #ff4a00;
    z-index: -1;
    margin-top: 0.5em;
    margin-bottom: 0.5rem;
    margin-left: 1.65rem;
`;

const HorizontalLine = styled.div`
    left: 50%;
    width: 12.5em;
    height: 5px;
    background-color: #ff4a00;
    z-index: -1;
    margin: 0.5rem;

    @media (max-width: 700px) {
        display: none;
    }
`;

const TextBody = styled.div`
    display: flex;
    flex-direction: row;
    align-items: start;
    height: 4.063rem;

    @media (max-width: 700px) {
        height: 2.25em;
        flex-direction: column;
        margin: 1rem;

        h2 {
            margin: 0;
        }
    }

    .description {
        display: flex;
        flex-direction: column;
        max-width: 16em;

        p {
            color: #ffffff80;
        }
    }

    .date {
        margin-right: 1rem;
    }
`;

export const Roadmap = () => {
    const steps = ["hello", "hello 2", "hello 2", "hello 2"];

    return (
        <RoadmapContainer>
            <h1>ROADMAP</h1>
            <StepperContainer>
                <SmallVerticalLine />
                {steps.map((step, index) => (
                    <>
                        <Step key={index}>
                            <div className="small-svg">
                                <FireStepCircle width={56} height={56}>
                                    {index + 1}
                                </FireStepCircle>
                            </div>
                            <HorizontalLine />
                            <TextBody>
                                <h2 className="date">April 2024</h2>
                                <div className="description">
                                    <h2>HEAT Coin Integration</h2>
                                    <p>
                                        I think in each of the points (Q1,Q2,Q3...) we will simply write 2-3 paragraphs
                                        or 2-3 points inside that will say what we are doing, etc.
                                    </p>
                                </div>
                            </TextBody>
                        </Step>
                        <VerticalLine></VerticalLine>
                    </>
                ))}
            </StepperContainer>
            <div className="last-fire-circle">
                <FireStepCircle></FireStepCircle>
            </div>
        </RoadmapContainer>
    );
};
