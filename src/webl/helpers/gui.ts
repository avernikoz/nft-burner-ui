import * as dat from "dat.gui";
import { GTime } from "../utils";

export class DrawUISingleton {
    private static _instance: DrawUISingleton;

    private drawUI: dat.GUI | undefined;

    public static getInstance(): DrawUISingleton {
        if (!DrawUISingleton._instance) {
            DrawUISingleton._instance = new DrawUISingleton();
        }
        return DrawUISingleton._instance;
    }

    public getDrawUI(guiParams: dat.GUIParams = { width: 768 }) {
        if (!this.drawUI) {
            this.drawUI = new dat.GUI({ ...guiParams });
        }

        return this.drawUI;
    }
}

export function DrawUI(GSettings: { bRunSimulation: boolean }) {
    // Create a GUI instance
    const GDatGUI = DrawUISingleton.getInstance().getDrawUI();

    GDatGUI.add(GSettings, "bRunSimulation").name("Run Simulation"); // 'Enable Feature' is the label for the checkbox

    GDatGUI.add(GTime, "DeltaMs").name("DeltaTime").listen().step(0.1);
    GDatGUI.add(GTime, "Cur").name("CurTime").listen().step(0.0001);
}
