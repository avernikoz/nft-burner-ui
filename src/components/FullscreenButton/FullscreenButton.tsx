import { StyledButton } from "./FullscreenButton.styled";
import { useState } from "react";

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

    return <StyledButton onClick={handleFullscreen} icon="pi pi-desktop" rounded severity="secondary"></StyledButton>;
}

export default FullScreenButton;
