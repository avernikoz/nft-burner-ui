//Objects positions are described in View Space, pre-Viewport Transform performed only on .x

import { DrawUISingleton } from "./helpers/gui";
import { MathLerp, MathLerpVec3, MathSmoothstep, MathVector3Negate, MathVector3Normalize } from "./utils";

export const GScreenDesc = {
    WindowSize: { x: 512, y: 512 }, //size displayed on the page
    RenderTargetSize: { x: 512, y: 512 }, //drawingBuffer size //TODO: Set min max allowed resolution, add half size support, dynamic RT size support
    ScreenRatio: 16.0 / 9.0,
    bWideScreen: true,
    ViewRatioXY: { x: 16.0 / 9.0, y: 1.0 }, //Used for pre-ViewportTransform, For WideScreen: y = 1, for Narrow Screen: x = 1
};

export const GSceneDesc = {
    //GPU-side Cam is packed like vec3(Offset.xyz, Zoom)
    Camera: {
        Position: { x: 0.0, y: 0.0, z: -4.0 },
        ZoomScale: 2.0,
        OrientationEuler: { yaw: 0.0, pitch: 0.0 },
    },
    //Surface to be burned
    FirePlane: {
        PositionOffset: { x: 0.0, y: 0.0, z: 0.0 },
        SizeScale: 1.0,
        OrientationEuler: { yaw: 0.0, pitch: 0.0, roll: 0.0 },
    },
    Floor: {
        Position: { x: 0.0, y: -1, z: 0.0 },
        SizeScale: 4.0,
    },

    //GPU Side SpotlightDesc: vec3(Radius, ConeAngles.xy)
    Spotlight: {
        Position: { x: 0.0, y: 2.5, z: -1.0 },
        FocusPosition: { x: 0.0, y: 0.0, z: 1.5 }, //To deduce light direction
        SizeScale: { x: 1.5, y: 2.5 },
        ProjectedLightSizeScale: { x: 1.0, y: 1.0 },
        Radius: 7,
        ConeAngles: { x: 0.1, y: 0.4 }, //Radians, Cone Inner, Cone Outer, Inner < Outer,
        GetDirection: function () {
            const sp = GSceneDesc.Spotlight.FocusPosition;
            return MathVector3Normalize(
                MathVector3Negate(
                    {
                        x: sp.x,
                        y: -1.0 + sp.y,
                        z: sp.z,
                    },
                    GSceneDesc.Spotlight.Position,
                ),
            );
        },
    },
};

export type SceneStateDescription = {
    CameraPosition: { x: number; y: number; z: number };
    CameraZoom: number;
    SpotlightPosition: { x: number; y: number; z: number };
    SpotlightFocusPosition: { x: number; y: number; z: number };
    FloorHeight: number;
};

export const GSceneStateDescsArray = [
    //Dummy
    {
        CameraPosition: { x: -1.6, y: 0.0, z: -3.61 },
        SpotlightPosition: { x: -2.88, y: 1.57, z: -1.71 },
        SpotlightFocusPosition: { x: 0, y: 1.03, z: 1.5 },
        FloorHeight: -1,
        CameraZoom: 2,
    },
    //Intro
    {
        CameraPosition: { x: -1.6, y: 0.0, z: -3.61 },
        SpotlightPosition: { x: -2.88, y: 1.57, z: -1.71 },
        SpotlightFocusPosition: { x: 0, y: 1.03, z: 1.5 },
        FloorHeight: -1,
        CameraZoom: 2,
    },
    //Inventory
    {
        CameraPosition: { x: -1.5, y: 0.0, z: -6.0 },
        SpotlightPosition: { x: -1.43, y: -1.33, z: -1.0 },
        SpotlightFocusPosition: { x: 0, y: 1.0, z: 0.0 },
        FloorHeight: -2,
        CameraZoom: 4,
    },
    /* {
        CameraPosition: { x: -1.23, y: 0.0, z: -2.5 },
        SpotlightPosition: { x: -1.81, y: 1.65, z: -1.71 },
        SpotlightFocusPosition: { x: 0, y: 0.03, z: 1.5 },
        FloorHeight: -2,
		CameraZoom : 2,
    }, */
    //Burn
    {
        CameraPosition: { x: 0, y: 0.0, z: -4.0 },
        SpotlightPosition: { x: 0.0, y: 2.5, z: -1.0 },
        SpotlightFocusPosition: { x: 0.0, y: 0.0, z: 1.5 },
        FloorHeight: -1,
        CameraZoom: 2,
    },
];

export function AssignSceneDescription(inSceneDesc: SceneStateDescription): void {
    GSceneDesc.Camera.Position = inSceneDesc.CameraPosition;
    GSceneDesc.Camera.ZoomScale = inSceneDesc.CameraZoom;
    GSceneDesc.Spotlight.Position.x = inSceneDesc.SpotlightPosition.x;
    GSceneDesc.Spotlight.Position.y = inSceneDesc.SpotlightPosition.y;
    GSceneDesc.Spotlight.Position.z = inSceneDesc.SpotlightPosition.z;
    GSceneDesc.Spotlight.FocusPosition.x = inSceneDesc.SpotlightFocusPosition.x;
    GSceneDesc.Spotlight.FocusPosition.y = inSceneDesc.SpotlightFocusPosition.y;
    GSceneDesc.Spotlight.FocusPosition.z = inSceneDesc.SpotlightFocusPosition.z;
    GSceneDesc.Floor.Position.y = inSceneDesc.FloorHeight;
}

export function AssignSceneDescriptions(
    inSceneDescPrev: SceneStateDescription,
    inSceneDescNew: SceneStateDescription,
    inParameter: number,
): void {
    const t = MathSmoothstep(0.0, 1.0, inParameter);
    const sceneDescIntermediate: SceneStateDescription = {
        CameraZoom: MathLerp(inSceneDescPrev.CameraZoom, inSceneDescNew.CameraZoom, t),
        CameraPosition: MathLerpVec3(inSceneDescPrev.CameraPosition, inSceneDescNew.CameraPosition, t),
        SpotlightPosition: MathLerpVec3(inSceneDescPrev.SpotlightPosition, inSceneDescNew.SpotlightPosition, t),
        SpotlightFocusPosition: MathLerpVec3(
            inSceneDescPrev.SpotlightFocusPosition,
            inSceneDescNew.SpotlightFocusPosition,
            t,
        ),
        FloorHeight: MathLerp(inSceneDescPrev.FloorHeight, inSceneDescNew.FloorHeight, t),
    };
    AssignSceneDescription(sceneDescIntermediate);
}

export function EnableSceneDescUI() {
    const GDatGUI = DrawUISingleton.getInstance().getDrawUI();
    if (GDatGUI) {
        const folder = GDatGUI.addFolder("SceneDesc");
        folder.open();
        /* folder.add(GSceneDesc.FirePlane.PositionOffset, "x", -2, 5).name("PlanePosX").step(0.01);
        folder.add(GSceneDesc.FirePlane.PositionOffset, "y", -3, 10).name("PlanePosY").step(0.01);
        folder.add(GSceneDesc.FirePlane.PositionOffset, "z", -10, 2).name("PlanePosZ").step(0.01); */
        folder.add(GSceneDesc.FirePlane.OrientationEuler, "pitch", -Math.PI, Math.PI).name("pitch").step(0.01);
        folder.add(GSceneDesc.FirePlane.OrientationEuler, "yaw", -Math.PI, Math.PI).name("yaw").step(0.01);
        folder.add(GSceneDesc.FirePlane.OrientationEuler, "roll", -Math.PI, Math.PI).name("roll").step(0.01);

        folder.add(GSceneDesc.Camera.Position, "x", -2, 5).name("CamPosX").step(0.01).listen();
        folder.add(GSceneDesc.Camera.Position, "y", -3, 10).name("CamPosY").step(0.01).listen();
        folder.add(GSceneDesc.Camera.Position, "z", -10, 2).name("CamPosZ").step(0.01).listen();
        folder.add(GSceneDesc.Camera, "ZoomScale", 0, 5).name("Zoom").step(0.01).listen();

        //folder.add(GSceneDesc.Floor.PositionOffset, "x", -2, 5).name("FloorPosX").step(0.01);
        folder.add(GSceneDesc.Floor.Position, "y", -3, 10).name("FloorPosY").step(0.01);
        //folder.add(GSceneDesc.Floor.PositionOffset, "z", -10, 2).name("FloorPosZ").step(0.01);

        folder.add(GSceneDesc.Floor, "SizeScale", -2, 5).name("FloorSizeScale").step(0.01);

        const spotlightFolder = folder.addFolder("Spotlight");
        spotlightFolder.open();
        spotlightFolder.add(GSceneDesc.Spotlight.SizeScale, "x", -2, 5).name("LightSizeX").step(0.01);
        spotlightFolder.add(GSceneDesc.Spotlight.SizeScale, "y", -2, 5).name("LightSizeY").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.Position, "x", -3, 10).name("LightPosX").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.Position, "y", -3, 10).name("LightPosY").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.Position, "z", -10, 10).name("LightPosZ").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.FocusPosition, "x", -3, 10).name("FocusPosX").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.FocusPosition, "y", -3, 10).name("FocusPosY").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight.FocusPosition, "z", -3, 10).name("FocusPosZ").step(0.01).listen();
        spotlightFolder.add(GSceneDesc.Spotlight, "Radius", 0, 10).name("Radius").step(0.01);
        spotlightFolder
            .add(GSceneDesc.Spotlight.ConeAngles, "x", 0, Math.PI / 2)
            .name("InnerAngle")
            .step(0.01);
        spotlightFolder
            .add(GSceneDesc.Spotlight.ConeAngles, "y", 0, Math.PI / 2)
            .name("OuterAngle")
            .step(0.01);

        spotlightFolder.add(GSceneDesc.Spotlight.ProjectedLightSizeScale, "x", 0, 40).name("ProjSizeX").step(0.01);
        spotlightFolder.add(GSceneDesc.Spotlight.ProjectedLightSizeScale, "y", 0, 40).name("ProjSizeY").step(0.01);
    }
}
