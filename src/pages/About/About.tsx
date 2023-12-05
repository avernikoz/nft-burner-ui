import React from "react";
import "./About.css";
import { ERenderingState, GRenderingStateMachine } from "../../webl/states";
import { ProgressBar } from "./ProgressBar";

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
                    GRenderingStateMachine.SetRenderingState(ERenderingState.Intro, false);
                    //GFirstRenderingFrame = false;
                    //BurningSurface.SetToBurned(gl);
                }}
            >
                START
            </button>
            <button className="aboutButton">ABOUT</button>
        </>
    );
};
