import { styled } from "styled-components";
import { PhaseWarning } from "../PhaseWarning/PhaseWarning";
import { HeadPhaseSection } from "../../TermoCatLand.styled";

export const AirdropPhaseWrapper = styled.div`
    width: 90vw;
    margin: auto;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;

    @media screen and (max-width: 1000px) {
        width: 100%;
    }
`;

export const CardContainer = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    width: 100%;

    @media screen and (max-width: 1000px) {
        flex-direction: column;
        align-items: center;
    }
`;

export const StepCard = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 30%;

    img {
        width: 250px;
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
        width: 100%;
        max-width: 18em;
        text-align: center;

        font-family: "Comic Neue", cursive;
        font-weight: 700;
        font-style: normal;

        @media screen and (max-width: 1000px) {
            border: 0.5em solid #fff;
        }
    }

    @media screen and (max-width: 1000px) {
        flex-direction: column;
    }
`;

export const AirdropPhaseContainer = () => {
    return (
        <AirdropPhaseWrapper>
            <HeadPhaseSection>
                <h1>Airdrop phase</h1>
                <button className="open-button">OPEN</button>
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
                        Share a Twitter post featuring a your Thermo Cat, including $THERMOCAT #THERMOCAT, and tag
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
