import { StyledButton } from "./FullscreenButton.styled";

function FullScreenButton() {
    let toggle: boolean = false;
    const handleFullscreen = () => {
        const element = document.documentElement;
        if (!toggle) {
            toggle = true;
            element.requestFullscreen();
        } else {
            toggle = false;
            document.exitFullscreen();
        }
    };

    return <StyledButton onClick={handleFullscreen} icon="pi pi-desktop" rounded severity="secondary"></StyledButton>;
}

export default FullScreenButton;
