import { ChangeEvent, FormEvent, useContext, useEffect, useState } from "react";
import { NftBurnDialogContainer, StyledDialog } from "../Control/components/NftBurnDialog/NftBurnDialog.styled";
import { styled } from "styled-components";
import { ConfirmBurningButton } from "../ConfirmBurningButton/ConfirmBurningButton";
import { sleep } from "../../utils/sleep";
import { encode } from "../../utils/encode";
import { ProgressSpinner } from "primereact/progressspinner";
import { ToastContext } from "../ToastProvider/ToastProvider";

export interface FormData {
    name: string;
    email: string;
    message: string;
}

export const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: baseline;
    width: 100%;
`;

export const StyledLabel = styled.label`
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
`;

export const StyledLabelText = styled.span`
    color: #b5b5c2;

    font-family: Rubik;
    font-style: normal;
    font-weight: 400;
    font-size: 12px;
    letter-spacing: 0.5px;
`;

export const GlowingInput = styled.input`
    color: #fff;

    &::placeholder {
        color: #b5b5c2;
    }

    &::selection {
        background-color: transparent; /* Set the background color for selection */
    }

    background-clip: text;
    &:-webkit-autofill {
        -webkit-text-fill-color: #fff !important;
        -webkit-background-clip: text;
    }

    /* Allow text selection in the input */
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
    user-select: text;

    background: rgba(11, 11, 12, 0.8) 100%;

    font-family: Rubik;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;

    padding: 10px;
    border: 2px solid #515158;
    border-radius: 2px;
    transition:
        border-color 0.3s ease-in-out,
        box-shadow 0.3s ease-in-out;

    &:focus {
        border-color: #ff4a00;
        box-shadow: 0 0 5px #ff4a00;
        outline: none; /* Remove the default focus outline */
    }
`;

const GlowingTextarea = styled.textarea`
    color: #fff;

    &::placeholder {
        color: #b5b5c2;
    }

    background: rgba(11, 11, 12, 0.8);

    font-family: Rubik;
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    letter-spacing: 0.5px;

    resize: none;

    padding: 10px;
    border: 2px solid #515158;
    border-radius: 2px;
    transition:
        border-color 0.3s ease-in-out,
        box-shadow 0.3s ease-in-out;

    &:focus {
        border-color: #ff4a00;
        box-shadow: 0 0 5px #ff4a00;
        outline: none; /* Remove the default focus outline */
    }
`;

export const ContactDialog = ({ visible, setVisible }: { visible: boolean; setVisible: () => void }) => {
    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        message: "",
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const toastController = useContext(ToastContext);

    useEffect(() => {
        if (visible) {
            document.body.classList.add("blur-background");
        }

        return () => {
            document.body.classList.remove("blur-background");
        };
    }, [visible]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setLoading(true);

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

            setLoading(false);
            setIsSubmitted(true);
            toastController?.showSuccess("Message sent successfully! Thanks for reaching out.");

            // Optional: Wait for 5 seconds before clearing the form
            await sleep(5000);

            // Clear the form after submission (optional)
            setFormData({ name: "", email: "", message: "" });
            setIsSubmitted(false);
        } catch (error) {
            setLoading(false);
            console.error(error);
            if (error instanceof Error) {
                toastController?.showError("Failed to send contact message: " + error.message);
            } else {
                toastController?.showError("Failed to send contact message: " + error);
            }
        }
    };

    return (
        <StyledDialog
            header="Contact us"
            visible={visible}
            style={{ width: "min-content" }}
            onHide={() => setVisible()}
            draggable={false}
            resizable={false}
        >
            <NftBurnDialogContainer style={{ minWidth: "350px" }}>
                <StyledForm
                    onSubmit={handleSubmit}
                    name="contact"
                    method="POST"
                    data-netlify="true"
                    data-netlify-honeypot="bot-field"
                >
                    <input type="hidden" name="form-name" value="contact" />

                    {/* Honeypot field for preventing spam submissions */}
                    <input type="hidden" name="bot-field" />

                    <StyledLabel>
                        <StyledLabelText>Name</StyledLabelText>
                        <GlowingInput
                            type="text"
                            name="name"
                            placeholder="How can we call you?"
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </StyledLabel>

                    <StyledLabel>
                        <StyledLabelText>Email</StyledLabelText>
                        <GlowingInput
                            type="email"
                            name="email"
                            placeholder="How can we contact you?"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </StyledLabel>

                    <StyledLabel>
                        <StyledLabelText>Message</StyledLabelText>
                        <GlowingTextarea
                            name="message"
                            placeholder="Your thoughts matter, type away!"
                            value={formData.message}
                            onChange={handleChange}
                            rows={4}
                            required
                        />
                    </StyledLabel>

                    <ConfirmBurningButton type="submit" style={{ width: "100%", display: "flex", height: "58.5px" }}>
                        {isLoading ? (
                            <ProgressSpinner style={{ width: "25px", height: "25px", margin: 0 }} />
                        ) : isSubmitted ? (
                            `Thank you!`
                        ) : (
                            `Submit`
                        )}
                    </ConfirmBurningButton>
                </StyledForm>
            </NftBurnDialogContainer>
        </StyledDialog>
    );
};
