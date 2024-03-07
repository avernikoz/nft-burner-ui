import { styled } from "styled-components";
// import { ReactComponent as RaribleLogo } from "../../assets/svg/rarible.svg";
// import { ReactComponent as OpenSeaLogo } from "../../assets/svg/openSea.svg";
// import { ReactComponent as MagicEdenLogo } from "../../assets/svg/magicEden.svg";
import { ReactComponent as BlueMoveLogo } from "../../assets/svg/sui-marketplaces-logo/bluemove.svg";
import { ReactComponent as ClutchyLogo } from "../../assets/svg/sui-marketplaces-logo/clutchy.svg";

export const EmptyNFTInfoBoxMain = styled.div`
    width: 75%;
    height: 30%;
    display: flex;
    flex-direction: column;
    /* justify-content: space-around; */
    gap: 12px;
    align-items: center;
    padding: 16px;

    @media (max-width: 1024px) {
        height: 75%;
    }

    @media (max-width: 600px) {
        height: 100%;
    }
`;

export const TextOUH = styled.span`
    color: #fff;

    text-align: center;
    font-family: Khand;
    font-size: 32px;
    font-style: normal;
    font-weight: 600;
    text-transform: uppercase;
`;

export const TextExplanation = styled.span`
    color: #b5b5c2;

    text-align: center;
    font-family: Rubik;
    font-size: 18px;
    font-style: normal;
    font-weight: 400;
    margin-bottom: 20px;
`;

export const MarketReferencesContainer = styled.div`
    display: inline-flex;
    align-items: flex-start;
    gap: 16px;
    width: 100%;
    height: 40%;
    display: flex;
    flex-direction: row;
    justify-content: space-around;
`;

export const Market = styled.a`
    width: 30%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

export const EmptyNFTList = () => {
    return (
        <>
            <EmptyNFTInfoBoxMain>
                <TextOUH>OUH!</TextOUH>
                <TextExplanation>Seems like you don’t have any NFTs to burn, so...</TextExplanation>
                <MarketReferencesContainer>
                    {/* <Market target="_blank" rel="noopener noreferrer" href="https://rarible.com">
                        <RaribleLogo />
                    </Market>
                    <Market target="_blank" rel="noopener noreferrer" href="https://magiceden.io">
                        <MagicEdenLogo />
                    </Market>
                    <Market target="_blank" rel="noopener noreferrer" href="https://opensea.io">
                        <OpenSeaLogo />
                    </Market> */}

                    <Market target="_blank" rel="noopener noreferrer" href="https://sui.bluemove.net">
                        <BlueMoveLogo />
                    </Market>
                    <Market target="_blank" rel="noopener noreferrer" href="https://clutchy.io">
                        <ClutchyLogo />
                    </Market>
                </MarketReferencesContainer>
            </EmptyNFTInfoBoxMain>
        </>
    );
};
