import { styled } from "styled-components";
import { CopyButton, HeadPhaseSection } from "../../TermoCatLand.styled";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { PhaseWarning } from "../PhaseWarning/PhaseWarning";

export const PresalePhaseWrapper = styled.div`
    width: 45vw;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: auto auto;

    @media screen and (max-width: 1000px) {
        width: 70vw;
    }

    @media screen and (max-width: 700px) {
        width: 90vw;
    }

    p {
        font-size: 1.5rem;
    }
`;

export const PresaleForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;

    @media screen and (max-width: 700px) {
        width: 100%;
    }
`;

export const StyledInput = styled(InputText)`
    border: 2px solid #fff;
    width: 100%;
    border-radius: 0;
    background-color: transparent;
    color: #fff;
    margin-bottom: 1rem;

    @media screen and (max-width: 1000px) {
        font-size: 0.8rem;
        width: 100%;
    }
`;

export const StyledTextarea = styled(InputTextarea)`
    border: 2px solid #fff;
    width: 100%;
    min-height: 8em;
    border-radius: 0;
    background-color: transparent;
    color: #fff;
    margin-bottom: 1rem;

    @media screen and (max-width: 1000px) {
        font-size: 0.8rem;
        width: 100%;
    }
`;

export const SendButton = styled(CopyButton)`
    padding: 0.7rem 1rem;
    font-size: 1rem;
    display: inline-flex;
`;

export const PresalePhase = () => {
    return (
        <>
            <PresalePhaseWrapper>
                <HeadPhaseSection>
                    <h1>Pre-sale phase</h1>
                    <button className="open-button">OPEN</button>
                    <p>
                        If you'd like to receive a coin during the Presale stage, please fill out the form or reach out
                        to us on TwitterX at @nftburnerapp
                    </p>
                </HeadPhaseSection>
                <PresaleForm>
                    <StyledInput type="text" placeholder="Name or nickname" required />
                    <StyledInput type="email" placeholder="Email" required />
                    <StyledTextarea placeholder="Write your message for us here" required />
                    <SendButton
                        type="submit"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        Send
                    </SendButton>
                </PresaleForm>
            </PresalePhaseWrapper>
            <PhaseWarning
                textWarning={"The Presale will run from the moment of announcement until the start of the airdrop."}
            ></PhaseWarning>
        </>
    );
};
