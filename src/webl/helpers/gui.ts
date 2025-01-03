import * as dat from "dat.gui";
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

    public getDrawUI(): dat.GUI | null {
        if (APP_ENVIRONMENT === "development") {
            if (!this.drawUI) {
                this.drawUI = new dat.GUI({ width: 500 });
            }
            return this.drawUI;
        } else {
            return null;
        }
    }
}
