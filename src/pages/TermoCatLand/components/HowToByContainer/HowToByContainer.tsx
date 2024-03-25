import { styled } from "styled-components";
import React from "react";

export const BuyList = styled.ul`
    display: flex;
    flex-direction: column;
    gap: 1.75rem;
    list-style: none;
    padding: 0;
    margin: 2rem 0 2.5rem;
`;

export const ListItem = styled.li<{ $primary?: string }>`
    background-color: ${(props) => props.$primary || "#BF4F74"};
    display: flex;
    flex-direction: row;
    padding: 1rem;

    .img-section {
        margin-right: 1rem;
    }

    .text-section {
        text-align: start;
    }

    @media screen and (max-width: 1000px) {
        flex-direction: column;
        align-items: center;
    }
`;

export const HowToByWrapper = styled.div<{ $primary?: string }>`
    width: 60vw;
    margin: auto;
    color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;

    @media screen and (max-width: 1000px) {
        width: 100%;
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
    width: 10em;
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
`;

export function HowToByContainer() {
    return (
        <HowToByWrapper id="section4">
            <h1>How to buy</h1>
            <BuyList>
                <ListItem $primary={"#F1552E"}>
                    <div className={"img-section"}>
                        <img src={require("assets/termo-cat-land/wallet.png")} />
                    </div>
                    <div className={"text-section"}>
                        <h2>Create a wallet</h2>
                        <p>
                            Download Metamask or your wallet of choice from the app store or google play store for free.
                            For desktop users, download the google chrome extension by going to metamask.io.
                        </p>
                    </div>
                </ListItem>
                <ListItem $primary={"#4362D0"}>
                    <div className={"img-section"}>
                        <img src={require("assets/termo-cat-land/Eth.png")} />
                    </div>
                    <div className={"text-section"}>
                        <h2>Get Some ETH</h2>
                        <p>
                            Have ETH in your wallet to switch to $Thermocat. If you don’t have any ETH, you can buy
                            directly on metamask, transfer from another wallet, or buy on another exchange and send it
                            to your wallet.
                        </p>
                    </div>
                </ListItem>
                <ListItem $primary={"#D616CE"}>
                    <div className={"img-section"}>
                        <img src={require("assets/termo-cat-land/horse.png")} />
                    </div>
                    <div className={"text-section"}>
                        <h2>Go to Uniswap</h2>
                        <p>
                            Connect to Uniswap. Go to app.uniswap.org in google chrome or on the browser inside your
                            Metamask app. Connect your wallet. Paste the $Thermocat token address into Uniswap, select
                            Pepe, and confirm. When Metamask prompts you for a wallet signature, sign.
                        </p>
                    </div>
                </ListItem>
                <ListItem $primary={"#107350"}>
                    <div className={"img-section"}>
                        <img src={require("assets/termo-cat-land/switch.png")} />
                    </div>
                    <div className={"text-section"}>
                        <h2>Switch ETH for $Thermocat</h2>
                        <p>
                            Switch ETH for $Thermocat. We have ZERO taxes so you don’t need to worry about buying with a
                            specific slippage, although you may need to use slippage during times of market volatility.
                        </p>
                    </div>
                </ListItem>
            </BuyList>
            <BuyNowButton>
                Buy Now
                <i className="pi pi-wallet" style={{ fontSize: "1rem" }}></i>
            </BuyNowButton>
        </HowToByWrapper>
    );
}
