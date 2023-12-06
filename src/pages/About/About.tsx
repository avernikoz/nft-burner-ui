import React from "react";
import "./About.css";
import { ProgressBar } from "./ProgressBar";
import { GReactGLBridgeFunctions } from "../../webl/reactglBridge";

export const About = ({ setAboutPageActive }: { setAboutPageActive: (isAboutPageActive: boolean) => void }) => {
    return (
        <>
            <ProgressBar />
            <div className="intro_quote">
                <p>
                    In the realm where illusory value crumbles to reveal its useless nature, we summon you to a covenant
                    of cleansing flame
                </p>
            </div>
            <button
                className="startButton"
                onClick={() => {
                    setAboutPageActive(false);
                    GReactGLBridgeFunctions.OnStartButtonPressed();
                }}
            >
                START
            </button>
            <button
                className="aboutButton"
                onClick={() => {
                    GReactGLBridgeFunctions.OnAboutButtonPressed();
                }}
            >
                ABOUT
            </button>
        </>
    );
};
