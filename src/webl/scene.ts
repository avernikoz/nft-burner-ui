export const SceneDesc = {
    ViewportSize: { x: 512, y: 512 },
    ViewportMin: 512,
    ScreenRatio: 16.0 / 9.0,
    bWideScreen: true,
    ViewRatioXY: { x: 16.0 / 9.0, y: 1.0 }, //Used for pre-ViewportTransform, For WideScreen: y = 1, for Narrow Screen: x = 1
    FirePlaneSizeScaleNDC: 0.75, //Related to ViewportMin
};

//GPU-side Cam is packed like vec3(Offset.xy, Zoom)
export const CameraDesc = {
    PositionOffset: { x: 0.0, y: 0.0 },
    ZoomScale: 1.0,
    OrientationEuler: { yaw: 0.0, pitch: 0.0 },
};
