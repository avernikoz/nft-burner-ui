import { styled } from "styled-components";
import { useState } from "react";

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

    color: red;

    cursor: pointer;

    &:hover {
        border-top: 1px solid #747474;
        border-bottom: 1px solid #747474;
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
        border-top: 1px solid #747474;
        border-bottom: 1px solid #747474;
    }
`;

function FullScreenButton() {
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
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                    d="M6 1H1V6M12 1H17V6M17 12V17H12M6 17H1V12"
                    stroke="white"
                    stroke-width="1.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                />
            </svg>
        </IconContainer>
    );
}

const SoundIconElement = () => (
    <IconContainer>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M10.9313 1.68374C10.8362 1.63139 10.7514 1.55884 10.6818 1.47026C10.6122 1.38169 10.5592 1.27884 10.5258 1.16762C10.4925 1.05641 10.4794 0.939023 10.4873 0.82222C10.4953 0.705416 10.5241 0.591498 10.5722 0.487014C10.6203 0.382531 10.6866 0.289544 10.7674 0.213401C10.8482 0.137258 10.9419 0.0794601 11.0431 0.0433317C11.1442 0.0072032 11.2509 -0.00654348 11.3569 0.00288221C11.4629 0.0123079 11.5661 0.04472 11.6607 0.0982547C14.3258 1.58598 16 4.58631 16 8.00079C16 11.4064 14.3217 14.4103 11.6623 15.9024C11.5679 15.9557 11.4649 15.9878 11.3591 15.9972C11.2534 16.0065 11.147 15.9928 11.0461 15.9567C10.9452 15.9207 10.8517 15.8632 10.771 15.7873C10.6903 15.7115 10.624 15.6189 10.5759 15.5148C10.5277 15.4107 10.4987 15.2971 10.4904 15.1806C10.4821 15.0641 10.4948 14.947 10.5276 14.8359C10.5605 14.7248 10.6129 14.622 10.6819 14.5332C10.7509 14.4445 10.8351 14.3716 10.9297 14.3187C13.0501 13.1296 14.3863 10.7372 14.3863 8.00079C14.3863 5.2573 13.0542 2.8693 10.9313 1.68374ZM9.95179 5.3755C9.79215 5.21852 9.69567 4.99812 9.68356 4.76278C9.67146 4.52745 9.74472 4.29645 9.88724 4.12062C10.0298 3.94478 10.2299 3.83851 10.4435 3.82518C10.6572 3.81184 10.8669 3.89254 11.0265 4.04952C12.0625 5.068 12.6459 6.46152 12.6459 8.00079C12.6459 9.54094 12.0625 10.9336 11.0265 11.9521C10.9475 12.0298 10.8553 12.0896 10.7553 12.1281C10.6552 12.1666 10.5493 12.183 10.4435 12.1764C10.2299 12.1631 10.0298 12.0568 9.88724 11.881C9.74472 11.7051 9.67146 11.4741 9.68356 11.2388C9.69567 11.0035 9.79215 10.7831 9.95179 10.6261C10.6497 9.94087 11.0322 9.02637 11.0322 8.00079C11.0322 6.9752 10.6497 6.06159 9.95179 5.3755ZM1.49918 11.5565C0.671072 11.5561 2.05177e-06 10.8846 4.58366e-06 10.0565L1.71517e-05 5.94589C1.96845e-05 5.11746 0.671592 4.44589 1.50002 4.44589H2.94503L6.75744 1.08652C6.87607 0.981898 7.01911 0.916309 7.1701 0.8973C7.32108 0.878292 7.47387 0.906636 7.61088 0.97907C7.74788 1.0515 7.86353 1.16508 7.9445 1.30673C8.02548 1.44838 8.06849 1.61233 8.06858 1.77972V14.2219C8.06864 14.3893 8.02574 14.5534 7.94482 14.6952C7.86391 14.8369 7.74827 14.9507 7.61124 15.0232C7.47421 15.0957 7.32136 15.1242 7.1703 15.1052C7.01924 15.0862 6.87612 15.0206 6.75744 14.9159L2.94423 11.5566H1.61372L1.49918 11.5565Z"
                fill="#D7D7D7"
            />
        </svg>
    </IconContainer>
);

const FAQIconElement = () => (
    <IconContainer>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M10.0067 13.6667C9.82667 13.6667 9.66 13.6 9.53333 13.4733C9.4 13.34 9.34 13.1867 9.34 13C9.33333 12.6333 9.62667 12.34 9.99333 12.3333C10 12.3333 10 12.3333 10.0067 12.3333C10.1933 12.3333 10.3467 12.4 10.48 12.5267C10.6 12.6533 10.6667 12.8133 10.6667 12.9933C10.6667 13.1733 10.6 13.3333 10.4733 13.4667C10.3467 13.6 10.1867 13.6667 10.0067 13.6667ZM9.42 11.2267C9.42 10.9267 9.48667 10.6667 9.61333 10.4533C9.74 10.2333 9.96667 9.98667 10.28 9.70667C10.4667 9.54 10.6 9.39333 10.6867 9.26667C10.7733 9.14 10.8133 9 10.8133 8.84C10.8133 8.64667 10.74 8.48667 10.6 8.34667C10.46 8.21333 10.2667 8.14667 10.0333 8.14667C9.78667 8.14667 9.54 8.21333 9.39333 8.34667C9.25333 8.48 9.12667 8.64667 9.12667 9H8C8 8.32667 8.30667 7.84667 8.64667 7.52667C9.02 7.18667 9.5 7 10 7C10.3933 7 10.74 7.08 11.0467 7.23333C11.3533 7.38667 11.5733 7.6 11.7467 7.87333C11.92 8.14667 12 8.44667 12 8.77333C12 9.1 11.9333 9.37333 11.7933 9.60667C11.6533 9.84 11.4733 10.08 11.2 10.3333C10.9867 10.5333 10.8467 10.7067 10.7667 10.8467C10.6867 10.9867 10.6467 11.1733 10.6467 11.3867V11.6667H9.41333V11.2267H9.42Z"
                fill="white"
            />
            <circle cx="10" cy="10" r="8.6" stroke="white" stroke-width="1.2" />
        </svg>
    </IconContainer>
);

export const Footer = () => (
    <FooterContainer>
        <FooterButtonsContainer>
            <SoundIconElement />
            <Divider />
            <FullScreenButton />
            <Divider />
            <FAQIconElement />
            <Divider />
            <AboutContainer>ABOUT</AboutContainer>
        </FooterButtonsContainer>
    </FooterContainer>
);
