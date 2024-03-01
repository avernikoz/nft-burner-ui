import { GSceneDesc, GScreenDesc } from "./scene";
import { GetVec2, GetVec3, Vector2 } from "./types";

export function TransformFromNDCToView(ndcPos: Vector2) {
    const viewPos = GetVec2(0, 0);
    viewPos.x = ndcPos.x * GScreenDesc.ScreenRatio;
    viewPos.y = ndcPos.y;

    viewPos.x /= GSceneDesc.Camera.ZoomScale;
    viewPos.y /= GSceneDesc.Camera.ZoomScale;

    return viewPos;
}

export function TransformFromNDCToWorld(ndcPos: Vector2, viewPosZ: number = -GSceneDesc.Camera.Position.z) {
    const posVS = TransformFromNDCToView(ndcPos);
    posVS.x *= 1 + viewPosZ;
    posVS.y *= 1 + viewPosZ;
    //view to world
    const posWS = GetVec3(0, 0, 0);
    posWS.x = posVS.x + GSceneDesc.Camera.Position.x;
    posWS.y = posVS.y + GSceneDesc.Camera.Position.y;
    posWS.z = viewPosZ + GSceneDesc.Camera.Position.z;
    return posWS;
}
