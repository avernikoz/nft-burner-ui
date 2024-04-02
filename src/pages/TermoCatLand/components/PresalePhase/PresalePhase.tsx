import { styled } from "styled-components";
import { CopyButton, HeadPhaseSection } from "../../TermoCatLand.styled";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { PhaseWarning } from "../PhaseWarning/PhaseWarning";
import { EPhase } from "../../TermoCatModel";
import { ChangeEvent, FormEvent, useContext, useState } from "react";
import { ToastContext } from "../../../../components/ToastProvider/ToastProvider";
import { encode } from "../../../../utils/encode";
import { sleep } from "../../../../utils/sleep";

const PresalePhaseWrapper = styled.div`
    width: 45vw;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: auto auto 1rem;

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

const PresaleForm = styled.form`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 80%;

    @media screen and (max-width: 700px) {
        width: 100%;
    }
`;

const StyledInput = styled(InputText)`
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

const StyledTextarea = styled(InputTextarea)`
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

const SendButton = styled(CopyButton)`
    padding: 0.7rem 1rem;
    font-size: 1rem;
    display: inline-flex;
`;

export interface FormData {
    name: string;
    email: string;
    message: string;
}

export const PresalePhase = () => {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        message: "",
    });
    const toastController = useContext(ToastContext);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            // Your form submission logic here
            const response = await fetch("/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: encode({
                    "form-name": "contact",
                    ...formData,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to submit form: ${response.statusText}`);
            }

            toastController?.showSuccess("Message sent successfully! Thanks for reaching out.");

            // Optional: Wait for 5 seconds before clearing the form
            await sleep(5000);

            // Clear the form after submission (optional)
            setFormData({ name: "", email: "", message: "" });
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                toastController?.showError("Failed to send contact message: " + error.message);
            } else {
                toastController?.showError("Failed to send contact message: " + error);
            }
        }
    };
    return (
        <div style={{ marginBottom: "2rem" }} id={EPhase.PRE_SALE}>
            <PresalePhaseWrapper>
                <HeadPhaseSection>
                    <h1>Presale phase</h1>
                    <button className="open-button">OPEN</button>
                    <p>
                        If you'd like to buy $THERMO CAT during the Presale stage, please fill out the form or reach out
                        to us on X at @nftburnerapp
                    </p>
                </HeadPhaseSection>
                <PresaleForm
                    onSubmit={handleSubmit}
                    name="contact"
                    method="POST"
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                >
                    <input type="hidden" name="form-name" value="contact" />
                    <input type="hidden" name="bot-field" />
                    <StyledInput
                        type="text"
                        placeholder="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                    <StyledInput
                        type="email"
                        placeholder="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <StyledTextarea
                        value={formData.message}
                        onChange={handleChange}
                        rows={4}
                        name="message"
                        placeholder="Write your message for us here"
                        required
                    />
                    <SendButton type="submit">Send</SendButton>
                </PresaleForm>
            </PresalePhaseWrapper>
            <PhaseWarning
                textWarning={"The Presale will run from the moment of announcement until the start of the airdrop."}
            ></PhaseWarning>
        </div>
    );
};

export default PresalePhase;
