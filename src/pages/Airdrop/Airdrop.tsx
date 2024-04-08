import { BetaContainer, BetaText } from "../../components/Header/Header";
import { WalletSelector } from "../../components/WalletSelector/WalletSelector";
import { DesktopLogoIcon, HeaderAppContainer, LogoContainer, LogoDivider, MobileLogoIcon } from "../App/app.styled";
import { useWallet as suietUseWallet } from "@suiet/wallet-kit";
import BurnerLogoDesktopIcon from "../../assets/svg/burnerLogoDesktop.svg";
import BurnerLogoMobileIcon from "../../assets/svg/burnerLogoMobile.svg";
import { ChangeEvent, FormEvent, useContext, useEffect, useState } from "react";
import { NftBurnDialogContainer } from "../../components/Control/components/NftBurnDialog/NftBurnDialog.styled";
import { styled } from "styled-components";
import { ToastContext } from "../../components/ToastProvider/ToastProvider";
import { ConfirmBurningButton, StyledDialog, SubmitContainer } from "./Airdrop.styled";
import { encode } from "../../utils/encode";
import { GAudioEngine } from "../../webl/audioEngine";

export interface FormData {
    walletAddress: string | null;
    userName: string | null;
    repost: string | null;
    userNameCorrect: boolean;
    fieldsValid: boolean;
    touched: boolean;
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

export const StyledError = styled.label`
    color: #b53b00;
    font-size: 10px;
`;

export const StyledInfoSection = styled.div`
    padding: 0.5rem;
    background-color: #b53b00;
    text-align: center;
    margin: auto;
    width: 250px;
    border-radius: 5px;
    font-size: 0.8rem;
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
        text-align: center;
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

export const Airdrop = () => {
    const suietWallet = suietUseWallet();
    const [walletSelectPopupVisible, setWalletSelectPopupVisible] = useState<boolean>(false);

    const [formData, setFormData] = useState<FormData>({
        walletAddress: null,
        userName: null,
        repost: null,
        userNameCorrect: false,
        fieldsValid: false,
        touched: false,
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const toastController = useContext(ToastContext);

    useEffect(() => {
        GAudioEngine.getInstance().toggleSound();
    }, []);

    useEffect(() => {
        setFormData((data) => ({ ...data, walletAddress: suietWallet.account?.address ?? "" }));
    }, [suietWallet.account?.address]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let fieldsRequired = false;
        let userNameCorrect = false;

        const form = { ...formData, [e.target.name]: e.target.value };
        const regex = /@[a-zA-Z0-9_]+/;
        if (form.userName !== null && regex.test(form.userName)) {
            userNameCorrect = true;
        }
        if (form.repost?.length && form.userName?.length && form.walletAddress?.length && userNameCorrect) {
            fieldsRequired = true;
        }
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
            fieldsValid: fieldsRequired,
            userNameCorrect,
            touched: true,
        });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            setIsSubmitted((formData.walletAddress ?? "").length > 0);
            const message = {
                walletAddress: formData.walletAddress,
                userName: formData.userName,
                repost: formData.repost,
            };
            const publicKey = suietWallet.account?.publicKey;

            const msgBytes = new TextEncoder().encode(JSON.stringify(message));
            const resultSignature = await suietWallet.signMessage({
                message: msgBytes,
            });

            if (!publicKey) {
                throw new Error(`Wallet is not connected`);
            }

            const verifyResult = await suietWallet.verifySignedMessage(resultSignature, publicKey);
            console.log("verify sign:", verifyResult);

            if (!formData.walletAddress) {
                throw new Error(`Wallet is not connected`);
            }

            //
            const data = {
                walletAddress: formData.walletAddress,
                userName: formData.userName,
                repost: formData.repost,
                signature: resultSignature.signature,
                messageBytes: resultSignature.messageBytes,
            } as { [key: string]: string | number | boolean };

            const response = await fetch("/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: encode({
                    "form-name": "giveaway",
                    ...data,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to submit form: ${response.statusText}`);
            }

            setFormData({
                walletAddress: null,
                userName: null,
                repost: null,
                fieldsValid: false,
                userNameCorrect: false,
                touched: false,
            });
            console.log(isSubmitted);
            toastController?.showSuccess("Success");
        } catch (error) {
            if (error instanceof Error) {
                toastController?.showError("Failed to send contact message: " + error.message);
            } else {
                toastController?.showError("Failed to send contact message: " + error);
            }
        }
    };

    return (
        <>
            <HeaderAppContainer>
                <LogoContainer>
                    <DesktopLogoIcon src={BurnerLogoDesktopIcon} />
                    <MobileLogoIcon src={BurnerLogoMobileIcon} />
                </LogoContainer>
                <BetaContainer>
                    <BetaText> beta</BetaText>
                </BetaContainer>
                <LogoDivider />
                <WalletSelector
                    walletSelectPopupVisible={walletSelectPopupVisible}
                    setWalletSelectPopupVisible={setWalletSelectPopupVisible}
                    hideUI={() => {}}
                />
            </HeaderAppContainer>
            <div>
                <StyledDialog
                    header="GIVEAWAY"
                    headerStyle={{ textAlign: "center" }}
                    closable={false}
                    style={{ width: "min-content" }}
                    onHide={() => {}}
                    visible={true}
                    modal={false}
                    draggable={false}
                    resizable={false}
                >
                    <NftBurnDialogContainer style={{ maxWidth: "450px", width: "100%", marginBottom: 0 }}>
                        <StyledForm
                            onSubmit={handleSubmit}
                            name="contact"
                            method="POST"
                            data-netlify="true"
                            data-netlify-honeypot="bot-field"
                        >
                            <input type="hidden" name="form-name" value="contact" />

                            <StyledInfoSection>
                                Plase provide the necessary URLs by pasting them into designated areas
                            </StyledInfoSection>

                            <StyledLabel>
                                <GlowingInput
                                    type="text"
                                    name="walletAddress"
                                    placeholder="WALLET ADDRESS"
                                    value={formData.walletAddress ?? ""}
                                    onChange={handleChange}
                                    disabled
                                />
                                {formData.touched &&
                                    formData.walletAddress !== null &&
                                    !formData.walletAddress.length && <StyledError>Please provide Adress</StyledError>}
                            </StyledLabel>

                            <StyledLabel>
                                <GlowingInput
                                    type="text"
                                    name="userName"
                                    placeholder="X USERNAME"
                                    value={formData.userName ?? ""}
                                    onChange={handleChange}
                                    required
                                />
                                {formData.touched && formData.userName !== null && !formData.userNameCorrect && (
                                    <StyledError>Please provide a valid username: @yourName</StyledError>
                                )}
                            </StyledLabel>

                            <StyledLabel>
                                <GlowingInput
                                    name="repost"
                                    placeholder="X POST OF YOUR BURNED NFT"
                                    value={formData.repost ?? ""}
                                    onChange={handleChange}
                                    required
                                />
                                {formData.touched && formData.repost !== null && !formData.repost.length && (
                                    <StyledError>Please provide repost</StyledError>
                                )}
                            </StyledLabel>

                            <SubmitContainer>
                                <ConfirmBurningButton
                                    type="submit"
                                    style={{ width: "150px", height: "44px" }}
                                    disabled={!formData.fieldsValid}
                                >
                                    Submit
                                </ConfirmBurningButton>
                            </SubmitContainer>
                        </StyledForm>
                    </NftBurnDialogContainer>
                </StyledDialog>
            </div>
        </>
    );
};
