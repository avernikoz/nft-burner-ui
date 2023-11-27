import * as dat from "dat.gui";
import { GTime } from "../utils";
import { GScreenDesc } from "../scene";
import { APP_ENVIRONMENT } from "../../config/config";

export class DrawUISingleton {
    private static _instance: DrawUISingleton;

    private drawUI: dat.GUI | undefined;

    public static getInstance(): DrawUISingleton {
        if (!DrawUISingleton._instance) {
            DrawUISingleton._instance = new DrawUISingleton();
        }
        return DrawUISingleton._instance;
    }

    public getDrawUI(guiParams: dat.GUIParams = {}): dat.GUI | null {
        if (APP_ENVIRONMENT === "development") {
            if (!this.drawUI) {
                this.drawUI = new dat.GUI({ ...guiParams });
            }
            return this.drawUI;
        } else {
            return null;
        }
    }
}

export function DrawUI(GSettings: { bRunSimulation: boolean }) {
    // Create a GUI instance
    const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
    if (GDatGUI) {
        GDatGUI.close();

        GDatGUI.add(GSettings, "bRunSimulation").name("Run Simulation"); // 'Enable Feature' is the label for the checkbox

        GDatGUI.add(GTime, "DeltaMs").name("DeltaTime").listen().step(0.1);
        GDatGUI.add(GTime, "Cur").name("CurTime").listen().step(0.0001);

        GDatGUI.add(GScreenDesc, "ScreenRatio").name("ScreenRatio").listen().step(0.01);
        GDatGUI.add(GScreenDesc.WindowSize, "y").name("Resolution").listen().step(0.01);
    }
}
