import { styled } from "styled-components";
import { PhaseWarning } from "../PhaseWarning/PhaseWarning";
import { HeadPhaseSection } from "../../TermoCatLand.styled";

export const AirdropPhaseWrapper = styled.div`
    width: 100vw;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 3.5rem 1rem 1rem;
    background-color: #141b2a;
    margin: auto auto 2rem;

    @media screen and (max-width: 1000px) {
        width: 100%;
    }
`;

export const CardContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: center;
    width: 90%;

    @media screen and (max-width: 1400px) {
        justify-content: space-around;
    }

    @media screen and (max-width: 1000px) {
        flex-direction: column;
        align-items: center;
    }
`;

export const StepCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 25%;

    img {
        width: 100%;
        border: 0.3em solid #fff;

        @media screen and (max-width: 1400px) {
            border: none;
        }
    }

    .card-header {
        text-align: center;
        margin-bottom: 1rem;

        h1 {
            margin: 0.5rem;
        }

        p {
            margin: 0.5rem;

            font-size: 1.5rem;
        }
    }

    .description {
        background-color: #cee4f9;
        color: black;
        border: 0.5em solid #fff;
        width: 80%;
        text-align: center;
        padding: 0.2rem;

        font-family: "Comic Neue", cursive;
        font-style: normal;
        font-size: 1rem;

        @media screen and (max-width: 1000px) {
            border: 0.5em solid #fff;
            width: 100%;
        }
    }

    &:nth-child(1) {
        .description {
            transform: translateY(-7.5rem) translateX(-6rem);

            @media screen and (max-width: 1400px) {
                transform: translateY(-1.5rem);
            }
        }
    }

    &:nth-child(2) {
        .description {
            transform: translateY(-2rem);

            @media screen and (max-width: 1400px) {
                transform: translateY(-1.5rem);
            }
        }
    }

    &:nth-child(3) {
        .description {
            transform: translateY(-21rem) translateX(6rem);
            @media screen and (max-width: 2900px) {
                transform: translateY(-32em) translateX(15rem);
            }

            @media screen and (max-width: 2500px) {
                transform: translateY(-28em) translateX(6rem);
            }

            @media screen and (max-width: 2100px) {
                transform: translateY(-22rem) translateX(6rem);
            }

            @media screen and (max-width: 1400px) {
                transform: translateY(-1.5rem);
            }
        }
    }

    @media screen and (max-width: 1000px) {
        width: 100%;
        flex-direction: column;
        margin-bottom: 1rem;
        max-width: 18em;

        &:last-child {
            margin-bottom: 0;
        }

        img {
            width: 250px;
        }
    }
`;

export const AirdropPhaseContainer = () => {
    return (
        <AirdropPhaseWrapper>
            <HeadPhaseSection>
                <button className="open-button">Airdrop active</button>
            </HeadPhaseSection>
            <CardContainer>
                <StepCard>
                    <div className="card-header">
                        <h1>Step 1</h1>
                        <p>Snap your ThermoCat</p>
                    </div>
                    <img src={require("assets/termo-cat-land/airdropStep1.png")} alt="step 1" />
                    <div className="description">
                        Take a photo/video of your cat with a Thermo filter applied to it  (e.g. Thermo Mask on
                        Instagram)
                    </div>
                </StepCard>
                <StepCard>
                    <div className="card-header">
                        <h1>Step 2</h1>
                        <p>Share your ThermoCat</p>
                    </div>
                    <img src={require("assets/termo-cat-land/airdropStep2.png")} alt="step 1" />
                    <div className="description">
                        Share a Twitter post featuring a your Thermo Cat, including $THERMO #THERMOCAT, and tag
                        @nftburnerapp.
                    </div>
                </StepCard>
                <StepCard>
                    <div className="card-header">
                        <h1>Step 3</h1>
                        <p>Get a Reward</p>
                    </div>
                    <img src={require("assets/termo-cat-land/airdropStep3.png")} alt="step 1" />
                    <div className="description">We ensure all conditions are met and send you coins.</div>
                </StepCard>
            </CardContainer>
            <PhaseWarning
                textWarning={
                    "The airdrop will occur from the moment of announcement until the distribution of tokens to users is completed."
                }
            ></PhaseWarning>
        </AirdropPhaseWrapper>
    );
};
