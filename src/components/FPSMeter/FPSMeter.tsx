import { styled } from "styled-components";
import React, { useState } from "react";

interface FPSContainerProps {
    isVisible: boolean;
}

const FPSContainer = styled.div<FPSContainerProps>`
    display: ${(props) => (props.isVisible ? "block" : "none")};
    position: absolute;
    top: 0;
    left: 0;
    color: white; /* Adjust the text color as needed */
    font-size: 16px; /* Adjust the font size as needed */
    padding: 8px; /* Adjust padding as needed */
    background-color: rgba(0, 0, 0, 0.5); /* Adjust the background color and transparency as needed */
    z-index: 10;
`;

export const FPSMeter = () => {
    const [isVisible, setIsVisible] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const enableFPSContainer = () => {
        setIsVisible(true);
    };

    return (
        <FPSContainer isVisible={isVisible} className="fpsContainer">
            fps: <span id="fps">0.0</span>
        </FPSContainer>
    );
};
