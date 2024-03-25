import { keyframes, styled } from "styled-components";
import catBackImage from "../../assets/termo-cat-land/cat-back.png";
import { ReactComponent as Logo } from "../../assets/termo-cat-land/catLabel.svg";
import { InputText } from "primereact/inputtext";

export const StyledHeadingLogo = styled(Logo)`
    height: auto;
    width: 100%;
    margin-bottom: 2rem;
`;

export const LandWrapper = styled.div`
    background-color: black;
`;

export const PreviewContainer = styled.div`
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image: url(${catBackImage});
`;

export const PreviewBody = styled.div`
    margin-top: 6rem;
    width: 60vw;
    margin-left: auto;
    margin-right: auto;
    display: flex;
    flex-direction: column;
    align-items: center;

    .control {
        display: flex;
        flex-direction: column;
        align-items: start;
        width: 100%;
    }
`;

export const CopyButton = styled.button`
    padding: 1rem 1.2rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    background-color: #ffffff;
    color: rgba(0, 0, 0, 1);
    font-size: 20px;
    gap: 10%;
    border: 1px solid #fff;
    width: 9em;
    transition:
        background-color 0.3s ease,
        color 0.3s ease;

    &:hover {
        cursor: pointer;
        border-color: #fd9e1b;
        background-color: #fd9e1b;

        svg {
            color: rgba(0, 0, 0, 1);
        }
    }

    &:active {
        border-color: #f1552e;
        background-color: #f1552e;
    }

    &:disabled {
        &:hover {
            background-color: rgba(0, 0, 0, 0);
        }
    }
`;

export const StyledInput = styled(InputText)`
    border: 2px solid #fff;
    width: 40%;
    border-radius: 0;
    background-color: transparent;
    color: #838383;
    margin-bottom: 1rem;
`;

const moveText = keyframes`
 from {
    transform: translateX(-100%);
 }
 to {
    transform: translateX(100%);
 }
`;

export const TermoCatCoinLine = styled.div`
    height: 2.5rem;
    background-color: #fd9e1b;
    overflow: hidden;
    display: flex;
    justify-content: space-around;
    align-items: center;
    white-space: nowrap;

    .text {
        font-size: 1.5rem;
        color: #000;
        animation: ${moveText} 10s infinite alternate;
        margin-right: 2rem;
    }
`;

export const AboutContainer = styled.div`
    width: 80vw;
    margin: auto;
    padding-top: 3rem;
    color: #fff;
`;

export const AboutCard = styled.div`
    margin: 1rem 1rem 2rem;
    display: flex;
    align-items: center;
    border: 4px solid #ccc;
    overflow: visible;
    max-height: 660px;
    background-color: #2d1622;

    @media screen and (max-width: 1000px) {
        flex-direction: column;
        max-height: fit-content;
    }

    .collapsed {
        @media screen and (max-width: 1000px) {
            max-height: 370px !important;
            display: -webkit-box;
            -webkit-line-clamp: 3; /* Количество строк, после которых будет добавлено многоточие */
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
`;

export const TextWrapper = styled.div`
    width: 55%;
    padding: 2rem;
    color: #fff;
    transition: height 0.5s linear;

    div {
        font-size: clamp(0.6rem, 2vw, 1.1rem);
    }

    @media screen and (max-width: 1000px) {
        padding: 1rem;
        width: 100%;
        max-height: fit-content;

        h1 {
            margin: 0;
        }

        .text-content {
            text-overflow: ellipsis;
            overflow: hidden;
        }
    }
`;

export const ReadMoreButton = styled.button`
    background-color: transparent;
    border: none;
    color: white;
    padding: 10px 20px;
    cursor: pointer;
    margin-top: 10px;
    align-self: end;
    display: none;

    @media screen and (max-width: 1000px) {
        display: block;
    }

    .pi {
        margin-left: 1rem;
    }
`;

export const ImageWrapper = styled.img`
    flex: 1;
    height: 110%;
    width: 40%;
    object-fit: contain;
    align-self: end;

    @media screen and (max-width: 1000px) {
        align-self: center;
        transform: scaleX(-1);
    }
`;

export const BuyNowButton = styled.button`
    color: #fff;
    padding: 0.7rem 1.2rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 10%;
    border: 3px solid #fff;
    background-color: rgba(0, 0, 0, 0);
    width: 9em;
    transition:
        background-color 0.3s ease,
        color 0.3s ease;

    &:hover {
        background-color: #fd9e1b;
        border-color: #fd9e1b;
        color: rgba(0, 0, 0, 1);
        cursor: pointer;

        svg {
            color: rgba(0, 0, 0, 1);
        }
    }

    &:disabled {
        &:hover {
            background-color: rgba(0, 0, 0, 0);
        }
    }

    @media screen and (max-width: 1000px) {
        border: 3px solid #000000;
        color: #000000;

        &:hover {
            background-color: #000000;
            color: #fff;
            cursor: pointer;

            svg {
                color: #fff;
            }
        }
    }
`;

export const ComicsContainer = styled.img`
    flex: 1;
    width: 100%;
    object-fit: contain;
    margin-top: 1rem 1rem;
`;

export const ComicsText = styled.div`
    border: 8px solid #fff;
    font-size: 1.5rem;
    color: #fff;
    max-width: 700px;
    margin: 2rem auto;
    padding: 1rem;

    font-family: "Comic Neue", cursive;
    font-weight: 700;
    font-style: normal;

    span {
        color: #ff852d;
    }
`;

export const LinksSection = styled.div`
    color: white;
    width: 40vw;
    margin: 4rem auto 2rem;
    display: flex;
    flex-direction: column;

    p {
        text-align: center;
    }

    @media screen and (max-width: 1000px) {
        width: 90vw;
        flex-direction: row;
    }

    .links {
        flex-grow: 1;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 2rem;

        @media screen and (max-width: 700px) {
            flex-direction: column;
            gap: 0.5rem;
            width: 50%;
        }
    }

    .joinUs {
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        align-items: center;

        span {
            margin-bottom: 1rem;
        }

        @media screen and (max-width: 700px) {
            width: 50%;
        }
    }

    .joinUsList {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap: 2rem;

        svg {
            width: 48px;
        }

        @media screen and (max-width: 700px) {
            flex-direction: row;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
    }
`;

export const NavLink = styled.a`
    text-decoration: none;
    color: #ffffff;

    &:hover {
        color: #fd9e1b;
        cursor: pointer;
    }
`;

export const SideBarContent = styled.a`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: end;
    gap: 1rem;
`;
