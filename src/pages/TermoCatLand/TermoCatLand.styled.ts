import {keyframes, styled} from "styled-components";
import catBackImage from '../../assets/termo-cat-land/cat-back.png';
import { ReactComponent as Logo } from '../../assets/termo-cat-land/catLabel.svg';
import {InputText} from "primereact/inputtext";

export const StyledHeadingLogo = styled(Logo)`
    height: auto;
    width: 100%;
    margin-bottom: 2rem;
`;

export const LandWrapper = styled.div`
    background-color: black;
`;

export const PreviewContainer =  styled.div`
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-image:  url(${catBackImage});
`;

export const PreviewBody =  styled.div`
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

    &:hover {
        cursor: pointer;

        svg {
            color: rgba(0, 0, 0, 1);
        }
    }

    &:active {
        background-color: #d5d5d5;
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
    background-color: #FD9E1B;
    overflow: hidden;
    display: flex;
    justify-content: space-around;
    align-items: center;
    
    .text {
        font-size: 1.5rem;
        color: #000;
        animation: ${moveText} 10s infinite alternate;
    }
`;


export const AboutContainer = styled.div`
    width: 80vw;
    margin: auto;
    padding-top: 3rem;
    color: #fff
`

export const AboutCard = styled.div`
    margin: 1rem 1rem 2rem;
    display: flex;
    align-items: center;
    border: 4px solid #ccc;
    overflow: visible;
    height: 580px;
    background-color: #2D1622;
`

export const SVGWrapper = styled.div`
 flex: 1;
 overflow: visible;
`;

export const TextWrapper = styled.div`
    width: 55%;
    padding: 2rem 1.25rem 2rem 2rem;
    color: #fff;
    
    p {
        font-size: 1.1rem;
    }
`;

export const ImageWrapper = styled.img`
    flex: 1;
    height: 110%;
    width: 40%;
    object-fit: contain;
    transform: translateY(-12px);
`;



export const BuyNowButton = styled.button`
    color: #fff;
    padding: .7rem 1.2rem;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 10%;
    border: 1px solid #fff;
    background-color: rgba(0, 0, 0, 0);
    width: 9em;
    transition: background-color 0.3s ease, color 0.3s ease;

    
    &:hover {
        background-color: #ffffff;
        color: rgba(0, 0, 0, 1);


        svg {
            color: rgba(0, 0, 0, 1);
        }
    }

    &:disabled {
        &:hover {
            background-color: rgba(0, 0, 0, 0);
        }
    }
`;

export const  ComicsContainer = styled.img`
    flex: 1;
    width: 100%;
    object-fit: contain;
    margin-top: 1rem;
`;

export const  ComicsText = styled.div`
    border: 8px solid #fff;
    font-size: 1.5rem;
    color: #fff;
    max-width: 700px;
    margin: 1rem auto;
    padding: 1rem; 

    font-family: "Comic Neue", cursive;
    font-weight: 700;
    font-style: normal;
    
    span {
        color: #FF852D; 
    }
`;

export const  LinksSection = styled.div`
    color: white;
    width: 40vw;
    margin: 4rem auto 2rem;

    p {
        text-align: center;
    }

    .links {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        margin-bottom: 2rem;
    }

    .joinUs {
        display: flex;
        flex-direction: row;
        justify-content: center;
        gap:2rem;
    }
`;


export const NavLink = styled.a`
    text-decoration: none;
    color: #ffffff;
`;
