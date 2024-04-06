import { styled } from "styled-components";
import { ReactComponent as TwitterLogo } from "../../assets/unsupportMobileModal/twitter-logo.svg";
import { ReactComponent as InstLogo } from "../../assets/unsupportMobileModal/instagram-logo.svg";
import { ReactComponent as BurnerLogoIcon } from "../../assets/svg/burnerLogoDesktop.svg";

const StyledCard = styled.div`
    padding: 2rem;
    margin: auto;
    border: 1px solid #2d2d31;
    border-radius: 4px;
    color: white;
    text-align: center;

    h1 {
        font-family: Khand;
        letter-spacing: 3px;
        margin: 0;
    }

    p {
        margin: 0;
    }
`;

const ImageContainer = styled.div`
    margin-top: 5rem;
    width: 100%;
    padding: 1rem;
    display: flex;
    justify-content: center;

    img {
        max-width: 15em;
        margin: auto;
        width: 100%;
        box-shadow: 8px 8px 15px rgba(0, 0, 0, 0.5);
        border-radius: 2rem;
    }
`;

const Wrapper = styled.div`
    width: 100vw;
    padding: 1rem;
    z-index: 100;

    .links {
        margin: 1rem;
        width: 100%;
        min-height: 5rem;
        display: flex;
        align-items: center;
        justify-content: center;

        a {
            margin-right: 1rem;
        }
    }
`;

const ModalHeader = styled.header`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    padding: 1rem;
    min-height: 2rem;
    display: flex;
    justify-content: center;
`;

export const UnsupportedMobileModal = () => {
    return (
        <Wrapper>
            <div></div>
            <ModalHeader>
                <BurnerLogoIcon />
            </ModalHeader>
            <ImageContainer>
                <img src={require("assets/unsupportMobileModal/CARD.webp")} alt="unsupport-image" loading="lazy" />
            </ImageContainer>
            <StyledCard>
                <h1>OUCH!</h1>
                <p>Sorry, NFT Burner is not supported on mobile devices. Consider use a desktop device</p>
            </StyledCard>
            <div className="links">
                <a className="logo" href="https://www.instagram.com/nftburnerapp?igsh=em81OTFnc3psanhq&utm_source=qr">
                    <TwitterLogo />
                </a>
                <a className="logo" href="https://twitter.com/nftburnerapp">
                    <InstLogo />
                </a>
            </div>
        </Wrapper>
    );
};
