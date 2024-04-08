import { styled } from "styled-components";
import { useState } from "react";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";
import { ReactComponent as SoundEnabledIcon } from "../../assets/svg/soundEnabled.svg";
import { ReactComponent as SoundDisabledIcon } from "../../assets/svg/soundDisabled.svg";
import { ReactComponent as FAQIcon } from "../../assets/svg/faq.svg";
import { ReactComponent as LetterIcon } from "../../assets/svg/letter.svg";

import { ReactComponent as FullScreenIcon } from "../../assets/svg/fullScreen.svg";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import { ContactDialog } from "../ContactDialog/ContactDialog";

export const FooterContainer = styled.div`
    background-color: rgba(0, 0, 0, 0);
    width: 300px;
    display: inline-flex;
    justify-content: flex-end;
    padding: 16px;
    align-items: center;
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 99;
    height: 128px;

    @media (max-width: 1024px) {
        display: none;
    }
`;

export const FooterButtonsContainer = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 48px;

    border-radius: 4px;
    background-color: rgba(11, 11, 12, 0.8);
`;

export const IconContainer = styled.div`
    align-items: center;
    display: flex;
    justify-content: center;
    width: 48px;
    height: 48px;

    color: #bebebe;

    cursor: pointer;

    &:hover {
        color: #fff;
    }
    //padding: 16px;
`;

export const Divider = styled.div`
    display: inline-flex;
    align-items: center;
    height: 24px;
    width: 2px;

    background-color: #2d2d31;
`;

export const AboutContainer = styled.span`
    align-items: center;
    //width: 120px;
    padding: 16px;
    height: 48px;

    color: #bebebe;

    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-family: Rubik;
    font-size: 20px;
    font-style: normal;
    font-weight: 500;
    //line-height: 16px;
    letter-spacing: 4px;
    text-transform: uppercase;

    cursor: pointer;

    &:hover {
        color: #fff;
    }
`;

export const FullScreenButton = () => {
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleFullscreen = () => {
        const element = document.documentElement;
        if (!isFullScreen) {
            element.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
        setIsFullScreen(!isFullScreen);
    };

    return (
        <IconContainer onClick={handleFullscreen}>
            <FullScreenIcon />
        </IconContainer>
    );
};

const SoundIconElement = () => {
    const [isSoundEnabled, setSoundEnabled] = useState(GReactGLBridgeFunctions.GetIsSoundEnabled());

    return (
        <IconContainer
            onClick={() => {
                GReactGLBridgeFunctions.OnToggleSoundInAudioEngine();
                setSoundEnabled(!isSoundEnabled);
            }}
        >
            {isSoundEnabled && <SoundEnabledIcon />}
            {!isSoundEnabled && <SoundDisabledIcon />}
        </IconContainer>
    );
};

const FAQIconElement = () => (
    <IconContainer>
        <FAQIcon />
    </IconContainer>
);

const ContactIconElement = () => (
    <IconContainer>
        <LetterIcon />
    </IconContainer>
);

export const FAQComponent = () => (
    <a target="_blank" rel="noopener noreferrer" href="https://nft-burner.gitbook.io/overview/">
        <FAQIconElement />
    </a>
);

export const ContactFormComponent = ({ showContactForm }: { showContactForm: () => void }) => {
    return (
        <div onClick={showContactForm}>
            <ContactIconElement />
        </div>
    );
};

export const Footer = ({ setAboutPageActive }: { setAboutPageActive: (isAboutPageActive: boolean) => void }) => {
    const [contactPopupVisible, setContactPopupVisible] = useState<boolean>(false);

    return (
        <>
            <ContactDialog
                visible={contactPopupVisible}
                setVisible={() => {
                    setContactPopupVisible(false);
                }}
            />
            <FooterContainer>
                <FooterButtonsContainer>
                    <SoundIconElement />
                    <Divider />
                    <FullScreenButton />
                    {/* <Divider /> */}
                    {/* <FAQComponent /> */}
                    <Divider />
                    <ContactFormComponent showContactForm={() => setContactPopupVisible(true)} />
                    <Divider />
                    <AboutContainer
                        onClick={() => {
                            if (GRenderingStateMachine.GetInstance().currentState > ERenderingState.Inventory) {
                                return;
                            }
                            GReactGLBridgeFunctions.OnAboutButtonPressed();

                            setAboutPageActive(true);
                        }}
                    >
                        ABOUT
                    </AboutContainer>
                </FooterButtonsContainer>
            </FooterContainer>
        </>
    );
};

export const FooterStartScreen = () => {
    const [contactPopupVisible, setContactPopupVisible] = useState<boolean>(false);

    return (
        <>
            <ContactDialog
                visible={contactPopupVisible}
                setVisible={() => {
                    setContactPopupVisible(false);
                }}
            />
            <FooterContainer>
                <FooterButtonsContainer>
                    <SoundIconElement />
                </FooterButtonsContainer>
            </FooterContainer>
        </>
    );
};
