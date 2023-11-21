import { Button } from "primereact/button";
import { ControlContainer } from "./Control.styled";
import { ReactComponent as TwitchLogo } from "../../assets/svg/twitch.svg";
import { Dialog } from "primereact/dialog";
import { useState } from "react";

function Control() {
    const [visible, setVisible] = useState<boolean>(false);
    return (
        <>
            <ControlContainer>
                <div className="control__burn">
                    <Button label="Burn NFT" severity="danger" rounded size="large" onClick={() => setVisible(true)} />
                    <Dialog
                        header="Header"
                        visible={visible}
                        style={{ width: "50vw" }}
                        onHide={() => setVisible(false)}
                    >
                        <p className="m-0">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut
                            labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
                            laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in
                            voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
                            cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                    </Dialog>
                </div>
                <div className="control__social">
                    <Button label="Chedule Burn" severity="warning" rounded />
                    <div className="control__social--media">
                        <Button icon="pi pi-twitter " rounded text severity="info" aria-label="Notification" />
                        <Button rounded text severity="help" aria-label="Favorite">
                            <TwitchLogo></TwitchLogo>
                        </Button>
                        <Button icon="pi pi-youtube" rounded text severity="danger" aria-label="Cancel" />
                    </div>
                </div>
            </ControlContainer>
        </>
    );
}

export default Control;
