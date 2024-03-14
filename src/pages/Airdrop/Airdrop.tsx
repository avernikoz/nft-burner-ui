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
import { ReactComponent as SuccessCheckmark } from "../../assets/svg/successCheckmark.svg";

export interface FormData {
    walletAdress: string;
    userName: string;
    repost: string;
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
        walletAdress: "",
        userName: "",
        repost: "",
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const toastController = useContext(ToastContext);

    useEffect(() => {
        setFormData((data) => ({ ...data, walletAdress: suietWallet.account?.address ?? "" }));
    }, [suietWallet.account?.address]);

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setIsSubmitted(formData.walletAdress.length > 0);
            setFormData({ walletAdress: "", userName: "", repost: "" });
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
                    header="AIRDROP"
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
                                    name="walletAdress"
                                    placeholder="WALLET ADDRESS"
                                    value={formData.walletAdress}
                                    onChange={handleChange}
                                />
                            </StyledLabel>

                            <StyledLabel>
                                <GlowingInput
                                    type="email"
                                    name="userName"
                                    placeholder="X USERNAME"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    required
                                />
                            </StyledLabel>

                            <StyledLabel>
                                <GlowingInput
                                    name="repost"
                                    placeholder="X REPOST"
                                    value={formData.repost}
                                    onChange={handleChange}
                                    required
                                />
                            </StyledLabel>

                            <SubmitContainer>
                                <ConfirmBurningButton type="submit" style={{ width: "150px", height: "44px" }}>
                                    Submit
                                </ConfirmBurningButton>
                                {isSubmitted && (
                                    <>
                                        <div className="icon">
                                            <SuccessCheckmark />
                                        </div>
                                        <span>Submit success</span>
                                    </>
                                )}
                            </SubmitContainer>
                        </StyledForm>
                    </NftBurnDialogContainer>
                </StyledDialog>
            </div>
        </>
    );
};
