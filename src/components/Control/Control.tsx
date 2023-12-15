import { Button } from "primereact/button";
import { ControlContainer } from "./Control.styled";
import { ReactComponent as TwitchLogo } from "../../assets/svg/twitch.svg";
import { useContext, useEffect, useState } from "react";
import { NftDialog } from "./components/NftDialog/NftDialog";
import { NftContext } from "../NftProvider/NftProvider";
import { INft } from "../../utils/types";
import "../BurnButton/BurnButton.css";
import { BurnButton } from "../BurnButton/BurnButton";

export const Control = () => {
    const [visible, setVisible] = useState<boolean>(false);
    const [nft, setNft] = useState<INft | null>(null);

    const NftController = useContext(NftContext);

    useEffect(() => {
        setNft(NftController.activeNft ?? null);
    }, [NftController.activeNft]);

    return (
        <>
            <ControlContainer>
                <div className="control__burn">
                    <BurnButton className="burnButton mainButton" onClick={() => setVisible(true)} disabled={!nft}>
                        Burn
                    </BurnButton>
                    {nft && (
                        <NftDialog
                            nft={nft}
                            visible={visible}
                            setVisible={() => {
                                setVisible(false);
                            }}
                        />
                    )}
                </div>
                <div className="control__social">
                    <Button label="Chedule Burn" severity="warning" />
                    <div className="control__social--media">
                        <Button icon="pi pi-twitter " rounded text severity="info" aria-label="Notification" />
                        <Button rounded text severity="help" aria-label="Favorite">
                            <TwitchLogo />
                        </Button>
                        <Button icon="pi pi-youtube" rounded text severity="danger" aria-label="Cancel" />
                    </div>
                </div>
            </ControlContainer>
        </>
    );
};
