/* eslint-disable @typescript-eslint/lines-between-class-members */
import { GetVec2, GetVec3, Vector3 } from "./types";
import {
    GTime,
    MapSphericalToCartesian,
    MathClamp,
    MathGetVec2Length,
    MathGetVec3Length,
    MathLerp,
    MathVector3Normalize,
    Vec3Dot,
    Vec3Multiply,
    Vec3Negate,
} from "./utils";
import { CommonVertexAttributeLocationList } from "./shaders/shaderConfig";
import { GLineRenderer, GPointRenderer } from "./helpers/debugRender";
import { TransformFromNDCToWorld } from "./transform";
import { GUserInputDesc } from "./input";

class PhysPoint {
    PositionCur = GetVec3(0, 0, 0);
    PositionPrev = GetVec3(0, 0, 0);
    Velocity = GetVec3(0, 0, 0);
    PrevVelocity = GetVec3(0, 0, 0); //Mostly to avoid heap alloc
    Acceleration = GetVec3(0, 0, 0);
    bIsPinned;

    constructor(inbPinned = false) {
        this.bIsPinned = inbPinned;
    }

    AddAcceleration(force: Vector3) {
        this.Acceleration.Add(force);
    }

    Translate(t: Vector3) {
        if (!this.bIsPinned) this.PositionCur.Add(t);
    }
    TranslateNegate(t: Vector3) {
        if (!this.bIsPinned) this.PositionCur.Negate(t);
    }
}

class Constraint {
    pObjectA: PhysPoint;
    pObjectB: PhysPoint;
    RestLength: number;
    Stiffness = 1.0;

    CurDirection = GetVec3(0, 0, 0); //B - A

    //Euler
    static bSpringConstraint = false;
    DampingFactor = 100.0;

    constructor(inpObjectA: PhysPoint, inpObjectB: PhysPoint, inRestLength = 0, inStiffness = 1) {
        this.pObjectA = inpObjectA;
        this.pObjectB = inpObjectB;
        this.RestLength = inRestLength;
        this.Stiffness = inStiffness;
    }

    GetSpringForce() {
        let curDist = MathGetVec3Length(Vec3Negate(this.pObjectB.PositionCur, this.pObjectA.PositionCur));
        curDist -= this.RestLength;
        return curDist * this.Stiffness * 100.0;
    }

    GetDampingForce() {
        const dirFromAtoB = MathVector3Normalize(Vec3Negate(this.pObjectB.PositionCur, this.pObjectA.PositionCur));
        const velBFromA = Vec3Negate(this.pObjectB.Velocity, this.pObjectA.Velocity);
        const dotAB = Vec3Dot(dirFromAtoB, velBFromA);
        return dotAB * this.DampingFactor * 5.0;
    }

    ResolveConnection() {
        if (Constraint.bSpringConstraint) {
            let force = this.GetSpringForce();
            if (true) {
                force += this.GetDampingForce();
            }
            this.pObjectA.AddAcceleration(
                Vec3Multiply(
                    MathVector3Normalize(Vec3Negate(this.pObjectB.PositionCur, this.pObjectA.PositionCur)),
                    force,
                ),
            );
            this.pObjectB.AddAcceleration(
                Vec3Multiply(
                    MathVector3Normalize(Vec3Negate(this.pObjectA.PositionCur, this.pObjectB.PositionCur)),
                    force,
                ),
            );
        } else {
            ////position based dynamics constraint
            this.CurDirection.Set(this.pObjectB.PositionCur);
            this.CurDirection.Negate(this.pObjectA.PositionCur);
            //this.CurDirection = Vec3Negate(this.pObjectB.PositionCur, this.pObjectA.PositionCur);
            const curDist = MathGetVec3Length(this.CurDirection);
            const delta = curDist - this.RestLength;
            this.CurDirection.Normalize();
            this.CurDirection.Mul(delta * 0.5 * this.Stiffness);
            this.pObjectA.Translate(this.CurDirection);
            this.pObjectB.TranslateNegate(this.CurDirection);
        }
    }
}

enum EConstraintMode {
    Flowing = 0,
    Hanging,
}

export class RectRigidBody {
    Points: PhysPoint[];
    Constraints: Constraint[];
    ConstraintMode = EConstraintMode.Hanging;

    static VelocityDampingScale = 0.99;

    ConstantForce = GetVec3(0, 0, 0);

    SimulationNumSubSteps = 1.0;
    NumSolverIterations = 1.0;

    PlaneShapeVertexBufferGPU: null | WebGLBuffer = null;
    PlaneShapeTexCoordsBufferGPU: null | WebGLBuffer = null;
    PlaneShapeVAO: null | WebGLVertexArrayObject = null;

    constructor(gl: WebGL2RenderingContext) {
        const width = 2.0;
        const height = 2.0;
        const center = GetVec3(0, 0, 0);

        this.Points = [];
        this.Constraints = [];

        // Calculate half width and half height
        const halfWidth = width / 2;
        const halfHeight = height / 2;

        // Create PhysObjects for each corner of the rectangle
        const topLeft = new PhysPoint();
        const topRight = new PhysPoint();
        const bottomLeft = new PhysPoint();
        const bottomRight = new PhysPoint();

        // Set initial positions for the corners
        topLeft.PositionCur.Set3(center.x - halfWidth, center.y + halfHeight, center.z);
        topRight.PositionCur.Set3(center.x + halfWidth, center.y + halfHeight, center.z);
        bottomLeft.PositionCur.Set3(center.x - halfWidth, center.y - halfHeight, center.z);
        bottomRight.PositionCur.Set3(center.x + halfWidth, center.y - halfHeight, center.z);

        //Clockwise
        this.Points.push(bottomLeft, topLeft, topRight, bottomRight);

        // Create constraints between adjacent corners to maintain the shape of the rectangle
        // Top edge constraint
        this.Constraints.push(new Constraint(topLeft, topRight, width));
        // Bottom edge constraint
        this.Constraints.push(new Constraint(bottomLeft, bottomRight, width));
        // Left edge constraint
        this.Constraints.push(new Constraint(topLeft, bottomLeft, height));
        // Right edge constraint
        this.Constraints.push(new Constraint(topRight, bottomRight, height));

        //Cross Constraints
        const diagonalDist = MathGetVec3Length(Vec3Negate(topRight.PositionCur, bottomLeft.PositionCur));
        this.Constraints.push(new Constraint(topLeft, bottomRight, diagonalDist));
        this.Constraints.push(new Constraint(topRight, bottomLeft, diagonalDist));

        //Pinned Constaints
        /* const centerPoint = new PhysPoint();
        centerPoint.PositionCur.Set3(0, 0, 0);
        centerPoint.bIsPinned = true;
        this.Points.push(centerPoint); */
        /* const distToCenter = MathGetVec3Length(topRight.PositionCur);
        this.Constraints.push(new Constraint(topLeft, centerPoint, distToCenter));
        this.Constraints.push(new Constraint(bottomLeft, centerPoint, distToCenter));
        this.Constraints.push(new Constraint(topRight, centerPoint, distToCenter));
        this.Constraints.push(new Constraint(bottomRight, centerPoint, distToCenter)); */

        if (this.ConstraintMode == EConstraintMode.Flowing) {
            const pinnedConstraintStiffness = 0.01;
            const pinnedConstraintStiffnessBottom = pinnedConstraintStiffness;
            const topLeftPinned = new PhysPoint(true);
            topLeftPinned.PositionCur.Set(topLeft.PositionCur);
            this.Constraints.push(new Constraint(topLeftPinned, topLeft, 0, pinnedConstraintStiffness));

            const topRightPinned = new PhysPoint(true);
            topRightPinned.PositionCur.Set(topRight.PositionCur);
            this.Constraints.push(new Constraint(topRightPinned, topRight, 0, pinnedConstraintStiffness));

            const bottomLeftPinned = new PhysPoint(true);
            bottomLeftPinned.PositionCur.Set(bottomLeft.PositionCur);
            this.Constraints.push(new Constraint(bottomLeftPinned, bottomLeft, 0, pinnedConstraintStiffnessBottom));

            const bottomRightPinned = new PhysPoint(true);
            bottomRightPinned.PositionCur.Set(bottomRight.PositionCur);
            this.Constraints.push(new Constraint(bottomRightPinned, bottomRight, 0, pinnedConstraintStiffnessBottom));
        } else if (this.ConstraintMode == EConstraintMode.Hanging) {
            //Ropes
            const ropesStiffness = 1.0;
            const ropesLength = height * 0.75;

            const topLeftPinnedRope = new PhysPoint(true);
            this.Points.push(topLeftPinnedRope);
            topLeftPinnedRope.PositionCur.Set(topLeft.PositionCur);
            topLeftPinnedRope.PositionCur.y += ropesLength;
            this.Constraints.push(new Constraint(topLeftPinnedRope, topLeft, ropesLength, ropesStiffness));

            const topRightPinnedRope = new PhysPoint(true);
            this.Points.push(topRightPinnedRope);
            topRightPinnedRope.PositionCur.Set(topRight.PositionCur);
            topRightPinnedRope.PositionCur.y += ropesLength;
            this.Constraints.push(new Constraint(topRightPinnedRope, topRight, ropesLength, ropesStiffness));

            this.ConstantForce.y = -50.0;
        } else {
            //error
        }

        //Resources
        this.PlaneShapeVertexBufferGPU = gl.createBuffer();
        this.PlaneShapeTexCoordsBufferGPU = gl.createBuffer();
        this.PlaneShapeVAO = gl.createVertexArray();

        this.GenerateMesh(gl);
    }

    static IntergratePosVel(pPoint: PhysPoint, dt: number) {
        if (!pPoint.bIsPinned) {
            if (false) {
                //Euler
                pPoint.PositionPrev.Set(pPoint.PositionCur);
                pPoint.Acceleration.Mul(dt);
                pPoint.Velocity.Add(pPoint.Acceleration);
                pPoint.Velocity.Mul(dt);
                pPoint.PositionCur.Add(pPoint.Velocity);
            } else {
                pPoint.PrevVelocity.Set3(
                    pPoint.PositionCur.x - pPoint.PositionPrev.x,
                    pPoint.PositionCur.y - pPoint.PositionPrev.y,
                    pPoint.PositionCur.z - pPoint.PositionPrev.z,
                );
                pPoint.PositionPrev.Set(pPoint.PositionCur);
                pPoint.PrevVelocity.Mul(this.VelocityDampingScale);
                pPoint.Acceleration.Mul(dt * dt);
                pPoint.PrevVelocity.Add(pPoint.Acceleration);
                pPoint.PositionCur.Add(pPoint.PrevVelocity);
            }
        } else {
            pPoint.PositionPrev.Set(pPoint.PositionCur);
        }
    }

    WindStrengthFrequency = 0.5;
    WindStrengthFrequency2 = 1;
    WindStrengthFrequency2Weight = 1.0;
    WindDirectionFrequency = 1;
    WindStrength = 10.0;
    CurWindForce = GetVec3(0, 0, 0);

    ComputeCurWindForce() {
        const t = GTime.Cur;
        const main = Math.sin(t * this.WindStrengthFrequency) + 1;
        let freq = main;
        freq += (Math.sin(t * 2.3 * this.WindStrengthFrequency) + 1) * 0.5;
        freq += main * this.WindStrengthFrequency2Weight * 0.1 * (Math.sin(t * 20.0) + 1.0) * 0.5;
        ///Interpolate between angular endpoints
        const pitchMinMax = GetVec2(-Math.PI * 0.5, Math.PI * 0.5);
        const yawMinMax = GetVec2(0, Math.PI * 2.0);
        const pitchAngleCur = MathLerp(
            pitchMinMax.x,
            pitchMinMax.y,
            (Math.sin((t / this.WindDirectionFrequency) * 0.4 * 0.01) + 1.0) * 0.5,
        );
        const yawAngleCur = MathLerp(
            yawMinMax.x,
            yawMinMax.y,
            (Math.sin((t / this.WindDirectionFrequency) * 0.01) + 1.0) * 0.5,
        );

        this.CurWindForce.Set(MapSphericalToCartesian(yawAngleCur, pitchAngleCur, 1));

        this.CurWindForce.Mul(this.WindStrength * freq);
    }

    OnUpdate(gl: WebGL2RenderingContext) {
        //const dt = GTime.Delta / this.SimulationNumSubSteps;
        const dt = 1 / 60 / this.SimulationNumSubSteps;
        for (let i = 0; i < this.SimulationNumSubSteps; i++) {
            this.Simulate(dt);
        }

        this.GenerateMesh(gl);

        /* if (GUserInputDesc.bPointerInputPressedCurFrame) {
            const posWSCur = TransformFromNDCToWorld(GUserInputDesc.InputPosCurNDC);
            this.ApplyForce(posWSCur, 1.0, 2.0);
        } */
        //Apply force if mouse movement
        const posWSCur = TransformFromNDCToWorld(GUserInputDesc.InputPosCurNDC);
        if (Math.abs(posWSCur.x) < 1.0 && Math.abs(posWSCur.y) < 1.0) {
            const strngth = MathGetVec2Length(GUserInputDesc.InputVelocityCurViewSpace);
            for (const point of this.Points) {
                if (!point.bIsPinned) {
                    point.Acceleration.z += strngth * 10.0;
                    point.Acceleration.y += GUserInputDesc.InputVelocityCurViewSpace.y * 10.0;
                }
            }
        }
    }

    Simulate(dt: number) {
        for (const point of this.Points) {
            //point.Acceleration.Set3(0, 0, 0);
            if (!point.bIsPinned) {
                point.Velocity.Mul(0.99);
            }

            RectRigidBody.IntergratePosVel(point, dt);
        }

        for (let i = 0; i < this.NumSolverIterations; i++) {
            // Iterate over each constraint and resolve it
            for (const constraint of this.Constraints) {
                constraint.ResolveConnection();
            }
        }

        for (const point of this.Points) {
            point.Acceleration.Set3(0, 0, 0);
            point.Acceleration.Add(this.ConstantForce);
        }
    }

    GenerateMesh(gl: WebGL2RenderingContext) {
        //Create Vertex Buffer
        {
            const addPoint = (arr: number[], pos: Vector3) => {
                arr.push(pos.x, pos.y, pos.z);
            };

            const verts: number[] = [];
            for (let i = 0; i < 3; i++) {
                addPoint(verts, this.Points[i].PositionCur);
                //verts.push(this.Points[i].PositionCur.x, this.Points[i].PositionCur.y, this.Points[i].PositionCur.z);
            }
            addPoint(verts, this.Points[2].PositionCur);
            addPoint(verts, this.Points[3].PositionCur);
            addPoint(verts, this.Points[0].PositionCur);
            /* verts.push(this.Points[2].PositionCur.x, this.Points[2].PositionCur.y);
            verts.push(this.Points[3].PositionCur.x, this.Points[3].PositionCur.y);
            verts.push(this.Points[0].PositionCur.x, this.Points[0].PositionCur.y); */

            const planeVertexBufferCPU = new Float32Array(verts);

            //this.PlaneShapeVertexBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PlaneShapeVertexBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeVertexBufferCPU, gl.STATIC_DRAW);
        }

        //Create TexCoord Buffer
        {
            const planeTexCoords = [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0];
            const planeTexCoordsBufferCPU = new Float32Array(planeTexCoords);

            //this.PlaneShapeTexCoordsBufferGPU = gl.createBuffer();
            //Upload from CPU to GPU
            gl.bindBuffer(gl.ARRAY_BUFFER, this.PlaneShapeTexCoordsBufferGPU);
            gl.bufferData(gl.ARRAY_BUFFER, planeTexCoordsBufferCPU, gl.STATIC_DRAW);
        }

        //VAO
        //this.PlaneShapeVAO = gl.createVertexArray();
        gl.bindVertexArray(this.PlaneShapeVAO);
        //Vertex Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PlaneShapeVertexBufferGPU);
        gl.enableVertexAttribArray(CommonVertexAttributeLocationList.VertexBuffer); //turn on attribute
        gl.vertexAttribPointer(
            CommonVertexAttributeLocationList.VertexBuffer,
            3,
            gl.FLOAT,
            false,
            3 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );

        //TexCoords Buffer Bind
        //bind resource to this attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, this.PlaneShapeTexCoordsBufferGPU);
        gl.enableVertexAttribArray(CommonVertexAttributeLocationList.TexCoordsBuffer); //turn on attribute
        gl.vertexAttribPointer(
            CommonVertexAttributeLocationList.TexCoordsBuffer,
            2,
            gl.FLOAT,
            false,
            2 * Float32Array.BYTES_PER_ELEMENT,
            0,
        );
    }

    DebugRenderMesh(gl: WebGL2RenderingContext) {
        for (const point of this.Points) {
            GPointRenderer.GInstance!.Render(gl, point.PositionCur, 0.1);
        }
        for (const constraint of this.Constraints) {
            GLineRenderer.GInstance!.Render(gl, constraint.pObjectA.PositionCur, constraint.pObjectB.PositionCur);
        }
    }

    ApplyForce(forceSourcePos: Vector3, strength: number, radius = 1.0) {
        //proportional to the distance to each point
        for (let i = 0; i < 4; i++) {
            const point = this.Points[i];
            const dist = MathGetVec3Length(Vec3Negate(forceSourcePos, point.PositionCur));
            const forceScale = MathClamp(1.0 - dist / radius, 0, 1);
            point.Acceleration.z += strength * 10 * forceScale;
        }
    }

    SubmitDebugUI(datGui: dat.GUI) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const folder = datGui.addFolder("Rigid Body");
        folder.open();

        folder.add(this, "SimulationNumSubSteps", 1, 5).name("Num Sub Steps").step(1);
        folder.add(this, "NumSolverIterations", 1, 5).name("Num Solver Iters").step(1);

        /* folder.add(this.Points[4].PositionCur, "x", -2, 5).name("StartPosX").step(0.01).listen();
        folder.add(this.Points[4].PositionCur, "y", -3, 10).name("StartPosY").step(0.01).listen();
        folder.add(this.Points[4].PositionCur, "z", -10, 2).name("StartPosZ").step(0.01).listen(); */

        /* folder.add(this.AnimationComponent, "FadeInParameter", 0, 1).step(0.01).listen();
        folder.add(this.AnimationComponent, "FadeOutParameter", 0, 1).step(0.01).listen();
        folder.add(this, "bActiveThisFrame", 0, 1).listen();
        folder.add(this, "bIntersection", 0, 1).listen(); */

        const shakeParam = {
            buttonText: "Push",
            handleClick: () => {
                //this.GenerateMesh();
            },
        };
        folder.add(shakeParam, "handleClick").name(shakeParam.buttonText);
    }
}
