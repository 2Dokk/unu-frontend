"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  CuboidCollider,
  Physics,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type PointerState = {
  active: boolean;
  x: number;
  y: number;
  revision: number;
};

type LandingState = {
  id: number;
  x: number;
  z: number;
  scale: number;
  visible: boolean;
};

const FACE_LETTERS = ["U", "U", "N", "N", "C", "C"];
const CUBE_SIZE = 1.24;

const ANCHOR_FONT_SCALE_STOPS: [fontSizePx: number, scale: number][] = [
  [12.6, 0.5],
  [21.6, 0.58],
];
const DEFAULT_CUBE_SCALE = ANCHOR_FONT_SCALE_STOPS[0][1];

function getFontSizeCubeScale(fontSizePx: number | null): number {
  if (fontSizePx === null) return DEFAULT_CUBE_SCALE;

  const stops = ANCHOR_FONT_SCALE_STOPS;
  if (fontSizePx <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) {
    const [prevSize, prevScale] = stops[i - 1];
    const [size, scale] = stops[i];
    if (fontSizePx <= size) {
      const t = (fontSizePx - prevSize) / (size - prevSize);
      return prevScale + t * (scale - prevScale);
    }
  }
  return stops[stops.length - 1][1];
}
const CUBE_START_POSITION: [number, number, number] = [-2.35, 0.41, -0.1];
const CUBE_START_ROTATION: [number, number, number] = [0.34, -0.55, 0];
const CUBE_INTRO_START_X = 5.2;
const CUBE_INTRO_START_Y = 3.45;
const CUBE_INTRO_DURATION = 2.4;
const CUBE_INTRO_FIRST_CONTACT = 0.28;
const CUBE_INTRO_SECOND_CONTACT = 0.72;
const CUBE_INTRO_FINAL_CONTACT = 0.94;
const CUBE_INTRO_CONTACT_X = [2.15, -1, CUBE_START_POSITION[0]];
const CUBE_INTRO_CONTACT_ANGLE = [(Math.PI * 3) / 4, Math.PI / 4, 0];
const CUBE_INTRO_HOP_HEIGHT = [0.82, 0.34];
const HOVER_TRIGGER_RADIUS = 0.25;
const HOVER_RESET_RADIUS = 0.36;
const MIN_REACTION_INTERVAL = 0.65;
const FLOOR_SURFACE_Y = -0.46;
const AIRBORNE_CLEARANCE = 0.06;

function getCubeGroundContact(quaternion: THREE.Quaternion) {
  const rotationMatrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);
  const rotatedCorner = new THREE.Vector3();
  const contactOffset = new THREE.Vector3();
  const halfSize = CUBE_SIZE / 2;
  let lowestY = Number.POSITIVE_INFINITY;
  let contactCount = 0;

  for (const x of [-halfSize, halfSize]) {
    for (const y of [-halfSize, halfSize]) {
      for (const z of [-halfSize, halfSize]) {
        rotatedCorner.set(x, y, z).applyMatrix4(rotationMatrix);

        if (rotatedCorner.y < lowestY - 0.025) {
          lowestY = rotatedCorner.y;
          contactOffset.copy(rotatedCorner);
          contactCount = 1;
        } else if (Math.abs(rotatedCorner.y - lowestY) <= 0.025) {
          contactOffset.add(rotatedCorner);
          contactCount += 1;
        }
      }
    }
  }

  contactOffset.divideScalar(contactCount);
  return {
    centerY: FLOOR_SURFACE_Y - lowestY,
    offsetX: contactOffset.x,
    offsetZ: contactOffset.z,
  };
}

function createLandingWebGeometry() {
  const lineVertices: number[] = [];
  const spokeCount = 12;
  const ringCount = 5;
  const spokeAngles = Array.from({ length: spokeCount }, (_, spoke) =>
    (spoke / spokeCount) * Math.PI * 2 + Math.sin(spoke * 2.17) * 0.035,
  );

  const pointAt = (angle: number, radius: number) => [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius,
    0,
  ] as const;

  for (let spoke = 0; spoke < spokeCount; spoke += 1) {
    const angle = spokeAngles[spoke];
    const radius = 0.96 + Math.sin(spoke * 1.9) * 0.08;
    lineVertices.push(...pointAt(angle, 0.07), ...pointAt(angle, radius));
  }

  for (let ring = 1; ring <= ringCount; ring += 1) {
    const ringRadius = 0.08 + (ring / ringCount) * 0.9;

    for (let spoke = 0; spoke < spokeCount; spoke += 1) {
      const angle = spokeAngles[spoke];
      const nextAngle =
        spoke === spokeCount - 1 ? spokeAngles[0] + Math.PI * 2 : spokeAngles[spoke + 1];
      const radius = ringRadius * (1 + Math.sin(spoke * 1.7 + ring) * 0.045);
      const nextRadius =
        ringRadius * (1 + Math.sin((spoke + 1) * 1.7 + ring) * 0.045);
      let previousPoint = pointAt(angle, radius);
      for (let segment = 1; segment <= 4; segment += 1) {
        const progress = segment / 4;
        const segmentAngle = THREE.MathUtils.lerp(angle, nextAngle, progress);
        const curvedRadius =
          THREE.MathUtils.lerp(radius, nextRadius, progress) -
          Math.sin(progress * Math.PI) * (0.018 + ring * 0.006);
        const nextPoint = pointAt(segmentAngle, curvedRadius);
        lineVertices.push(...previousPoint, ...nextPoint);
        previousPoint = nextPoint;
      }
    }
  }

  const lines = new THREE.BufferGeometry();
  lines.setAttribute("position", new THREE.Float32BufferAttribute(lineVertices, 3));
  return lines;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function createFaceTexture(letter: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext("2d");
  if (!context) return new THREE.CanvasTexture(canvas);

  context.fillStyle = "#68c29d";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(255, 255, 255, 0.16)";
  context.lineWidth = 10;
  context.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  context.fillStyle = "#ffffff";
  context.font = "800 310px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(letter, canvas.width / 2, canvas.height / 2 + 10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

function Arena() {
  const halfWidth = 4.65;
  const floorY = -0.58;
  const ceilingY = 2.78;
  const wallCenterY = (floorY + ceilingY) / 2;
  const wallHalfHeight = (ceilingY - floorY) / 2;

  return (
    <>
      <RigidBody name="arena-floor" type="fixed" colliders={false}>
        <CuboidCollider
          args={[halfWidth, 0.12, 1.75]}
          position={[0, floorY, 0]}
          friction={0.82}
          restitution={0.4}
        />
      </RigidBody>
      <RigidBody name="arena-bounds" type="fixed" colliders={false}>
        <CuboidCollider
          args={[halfWidth, 0.12, 1.75]}
          position={[0, ceilingY, 0]}
          friction={0.6}
          restitution={0.46}
        />
        <CuboidCollider
          args={[0.12, wallHalfHeight, 1.75]}
          position={[-halfWidth, wallCenterY, 0]}
          friction={0.7}
          restitution={0.56}
        />
        <CuboidCollider
          args={[0.12, wallHalfHeight, 1.75]}
          position={[halfWidth, wallCenterY, 0]}
          friction={0.7}
          restitution={0.56}
        />
        <CuboidCollider
          args={[halfWidth, wallHalfHeight, 0.12]}
          position={[0, wallCenterY, -1.5]}
          restitution={0.46}
        />
        <CuboidCollider
          args={[halfWidth, wallHalfHeight, 0.12]}
          position={[0, wallCenterY, 1.5]}
          restitution={0.46}
        />
      </RigidBody>
    </>
  );
}

function FloorShadow() {
  return (
    <mesh
      position={[0, -0.44, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[8.3, 3.2]} />
      <shadowMaterial transparent opacity={0.34} depthWrite={false} />
    </mesh>
  );
}

function LandingWeb({ landingRef }: { landingRef: RefObject<LandingState> }) {
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.LineBasicMaterial>(null);
  const lastLandingIdRef = useRef(0);
  const startedAtRef = useRef(Number.NEGATIVE_INFINITY);
  const impactScaleRef = useRef(1);
  const geometry = useMemo(() => createLandingWebGeometry(), []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    const material = materialRef.current;
    if (!group || !material) return;

    if (landingRef.current.id !== lastLandingIdRef.current) {
      lastLandingIdRef.current = landingRef.current.id;

      if (!landingRef.current.visible) {
        group.visible = false;
        return;
      }

      startedAtRef.current = clock.elapsedTime;
      group.position.x = landingRef.current.x;
      group.position.z = landingRef.current.z;
      impactScaleRef.current = landingRef.current.scale;
      group.visible = true;
    }

    const elapsed = clock.elapsedTime - startedAtRef.current;
    const progress = elapsed / 2.4;
    if (progress < 0) {
      group.visible = false;
      return;
    }

    if (progress >= 1) {
      group.visible = false;
      return;
    }

    const eased = 1 - Math.pow(1 - progress, 3);
    const elasticity = Math.sin(progress * Math.PI * 2.2) * (1 - progress) * 0.015;
    const scale = 0.72 + eased * 0.2;
    const impactScale = impactScaleRef.current;
    group.scale.set(
      scale * (1 + elasticity) * impactScale,
      scale * (1 - elasticity * 0.45) * impactScale,
      scale * impactScale,
    );
    material.opacity = Math.pow(1 - progress, 1.35) * 0.65;
  });

  return (
    <group
      ref={groupRef}
      visible={false}
      position={[0, FLOOR_SURFACE_Y + 0.012, 0]}
      rotation={[-Math.PI / 2 + 0.14, 0, 0]}
    >
      <lineSegments geometry={geometry}>
        <lineBasicMaterial
          ref={materialRef}
          color="#b8f4d4"
          transparent
          opacity={0}
          depthTest
          depthWrite={false}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}

function CubeVisual({ cubeSize }: { cubeSize: number }) {
  const { gl } = useThree();
  const geometry = useMemo(
    () => new RoundedBoxGeometry(cubeSize, cubeSize, cubeSize, 6, cubeSize * 0.07),
    [cubeSize],
  );
  const textures = useMemo(() => FACE_LETTERS.map(createFaceTexture), []);

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    textures.forEach((texture) => {
      texture.anisotropy = Math.min(8, maxAnisotropy);
      texture.needsUpdate = true;
    });
  }, [gl, textures]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      {textures.map((texture, index) => (
        <meshStandardMaterial
          key={`${FACE_LETTERS[index]}-${index}`}
          attach={`material-${index}`}
          map={texture}
          color="#ffffff"
          roughness={0.46}
          metalness={0}
          transparent={false}
          opacity={1}
          depthTest
          depthWrite
          side={THREE.FrontSide}
        />
      ))}
    </mesh>
  );
}

function CompactCube({
  reducedMotion,
  anchorFontSizePx,
  anchorNDC,
}: {
  reducedMotion: boolean;
  anchorFontSizePx: number | null;
  anchorNDC: { x: number; y: number } | null;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const cubeScale = getFontSizeCubeScale(anchorFontSizePx);
  const cubeSize = CUBE_SIZE * cubeScale;


  const basePosition = useMemo(() => {
    if (!anchorNDC) return null;
    const targetZ = -0.3;
    const near = new THREE.Vector3(anchorNDC.x, anchorNDC.y, 0).unproject(camera);
    const far = new THREE.Vector3(anchorNDC.x, anchorNDC.y, 1).unproject(camera);
    const direction = far.sub(near).normalize();
    const distance = (targetZ - near.z) / direction.z;
    return near.add(direction.multiplyScalar(distance));
  }, [anchorNDC, camera]);

  const rotationAxis = useMemo(
    () => new THREE.Vector3(0.72, 1, 0.38).normalize(),
    [],
  );
  const baseRotation = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(0.14, -0.32, -0.08)),
    [],
  );
  const spinRotation = useMemo(() => new THREE.Quaternion(), []);

  useFrame(({ clock }) => {
    if (!groupRef.current || reducedMotion || !basePosition) return;

    spinRotation.setFromAxisAngle(rotationAxis, clock.elapsedTime * 0.38);
    groupRef.current.quaternion.copy(baseRotation).premultiply(spinRotation);
    groupRef.current.position.y =
      basePosition.y + Math.sin(clock.elapsedTime * 0.7) * 0.06;
  });

  if (!basePosition) return null;

  return (
    <group ref={groupRef} position={[basePosition.x, basePosition.y, basePosition.z]}>
      <CubeVisual cubeSize={cubeSize} />
    </group>
  );
}

function CnuCube({
  reducedMotion,
  pointerRef,
  landingRef,
  landingArmedRef,
}: {
  reducedMotion: boolean;
  pointerRef: RefObject<PointerState>;
  landingRef: RefObject<LandingState>;
  landingArmedRef: RefObject<boolean>;
}) {
  const bodyRef = useRef<RapierRigidBody>(null);
  const introCubeRef = useRef<THREE.Group>(null);
  const physicsCubeRef = useRef<THREE.Group>(null);
  const introStartedAtRef = useRef<number | null>(null);
  const introCompleteRef = useRef(reducedMotion);
  const introLandingCountRef = useRef(0);
  const hoverArmedRef = useRef(true);
  const lastReactionRef = useRef(Number.NEGATIVE_INFINITY);
  const observedPointerRevisionRef = useRef(-1);
  const bouncePendingRef = useRef(false);
  const physicsStartedRef = useRef(false);
  const projectedPosition = useMemo(() => new THREE.Vector3(), []);
  const rotationQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const introFinalQuaternion = useMemo(
    () => new THREE.Quaternion().setFromEuler(new THREE.Euler(...CUBE_START_ROTATION)),
    [],
  );
  const introRollQuaternion = useMemo(() => new THREE.Quaternion(), []);
  const introRollAxis = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const introContacts = useMemo(
    () =>
      CUBE_INTRO_CONTACT_ANGLE.map((angle, index) => {
        const roll = new THREE.Quaternion().setFromAxisAngle(introRollAxis, angle);
        const orientation = new THREE.Quaternion()
          .copy(introFinalQuaternion)
          .premultiply(roll);
        const groundContact = getCubeGroundContact(orientation);

        return {
          angle,
          x: CUBE_INTRO_CONTACT_X[index],
          centerY: groundContact.centerY,
          webX: CUBE_INTRO_CONTACT_X[index] + groundContact.offsetX,
          webZ: CUBE_START_POSITION[2] + groundContact.offsetZ,
        };
      }),
    [introFinalQuaternion, introRollAxis],
  );
  const rotationMatrix = useMemo(() => new THREE.Matrix4(), []);
  const contactOffset = useMemo(() => new THREE.Vector3(), []);
  const rotatedCorner = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();

  useFrame(({ clock }) => {
    const body = bodyRef.current;
    const introCube = introCubeRef.current;
    const physicsCube = physicsCubeRef.current;
    if (!body || !introCube || !physicsCube || reducedMotion) return;

    if (!introCompleteRef.current) {
      introStartedAtRef.current ??= clock.elapsedTime;
      const progress = Math.min(
        (clock.elapsedTime - introStartedAtRef.current) / CUBE_INTRO_DURATION,
        1,
      );
      let x: number;
      let y: number;
      let angle: number;

      if (progress < CUBE_INTRO_FIRST_CONTACT) {
        const phaseProgress = progress / CUBE_INTRO_FIRST_CONTACT;
        const contact = introContacts[0];
        angle = THREE.MathUtils.lerp((Math.PI * 5) / 4, contact.angle, phaseProgress);
        x = THREE.MathUtils.lerp(CUBE_INTRO_START_X, contact.x, phaseProgress);
        y = THREE.MathUtils.lerp(
          CUBE_INTRO_START_Y,
          contact.centerY,
          phaseProgress * phaseProgress,
        );
      } else if (progress < CUBE_INTRO_SECOND_CONTACT) {
        const phaseProgress =
          (progress - CUBE_INTRO_FIRST_CONTACT) /
          (CUBE_INTRO_SECOND_CONTACT - CUBE_INTRO_FIRST_CONTACT);
        const start = introContacts[0];
        const end = introContacts[1];
        angle = THREE.MathUtils.lerp(start.angle, end.angle, phaseProgress);
        x = THREE.MathUtils.lerp(start.x, end.x, phaseProgress);
        y =
          THREE.MathUtils.lerp(start.centerY, end.centerY, phaseProgress) +
          4 * phaseProgress * (1 - phaseProgress) * CUBE_INTRO_HOP_HEIGHT[0];
      } else {
        const phaseProgress =
          (progress - CUBE_INTRO_SECOND_CONTACT) /
          (CUBE_INTRO_FINAL_CONTACT - CUBE_INTRO_SECOND_CONTACT);
        const start = introContacts[1];
        const end = introContacts[2];
        angle = THREE.MathUtils.lerp(start.angle, end.angle, phaseProgress);
        x = THREE.MathUtils.lerp(start.x, end.x, phaseProgress);
        y =
          THREE.MathUtils.lerp(start.centerY, end.centerY, phaseProgress) +
          4 * phaseProgress * (1 - phaseProgress) * CUBE_INTRO_HOP_HEIGHT[1];
      }

      introRollQuaternion.setFromAxisAngle(introRollAxis, angle);
      introCube.quaternion
        .copy(introFinalQuaternion)
        .premultiply(introRollQuaternion);

      introCube.position.set(x, y, CUBE_START_POSITION[2]);

      const reachedLandingCount =
        progress >= CUBE_INTRO_FINAL_CONTACT
          ? 3
          : progress >= CUBE_INTRO_SECOND_CONTACT
            ? 2
            : progress >= CUBE_INTRO_FIRST_CONTACT
              ? 1
              : 0;

      while (introLandingCountRef.current < reachedLandingCount) {
        const contact = introContacts[introLandingCountRef.current];
        landingRef.current.id += 1;
        landingRef.current.x = contact.webX;
        landingRef.current.z = contact.webZ;
        landingRef.current.scale = introLandingCountRef.current === 2 ? 0.82 : 1;
        landingRef.current.visible = true;
        introLandingCountRef.current += 1;
      }

      if (progress >= CUBE_INTRO_FINAL_CONTACT) {
        const contact = introContacts[2];
        introCompleteRef.current = true;
        introCube.visible = false;
        physicsCube.visible = true;
        body.setTranslation(
          {
            x: contact.x,
            y: contact.centerY,
            z: CUBE_START_POSITION[2],
          },
          true,
        );
        body.setRotation(introFinalQuaternion, true);
        body.setGravityScale(1, true);
        body.setLinvel({ x: -0.42, y: -0.9, z: 0 }, true);
        body.setAngvel({ x: 0, y: 0, z: -0.52 }, true);
        physicsStartedRef.current = true;
        hoverArmedRef.current = false;
        observedPointerRevisionRef.current = pointerRef.current.revision;
      }
      return;
    }

    const translation = body.translation();
    if (
      !Number.isFinite(translation.x) ||
      translation.y < -4 ||
      Math.abs(translation.x) > 6 ||
      Math.abs(translation.z) > 3
    ) {
      body.setTranslation(
        {
          x: CUBE_START_POSITION[0],
          y: CUBE_START_POSITION[1],
          z: CUBE_START_POSITION[2],
        },
        true,
      );
      body.setLinvel({ x: 0, y: 0, z: 0 }, true);
      body.setAngvel({ x: 0.4, y: -0.25, z: 0.3 }, true);
      hoverArmedRef.current = true;
      landingArmedRef.current = false;
      bouncePendingRef.current = false;
      return;
    }

    const verticalVelocity = body.linvel().y;

    if (bouncePendingRef.current || landingArmedRef.current) {
      const rotation = body.rotation();
      rotationQuaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      rotationMatrix.makeRotationFromQuaternion(rotationQuaternion);
      const elements = rotationMatrix.elements;
      const halfExtentY =
        (CUBE_SIZE / 2) *
        (Math.abs(elements[1]) + Math.abs(elements[5]) + Math.abs(elements[9]));
      const bottomY = translation.y - halfExtentY;

      if (bouncePendingRef.current) {
        if (bottomY > FLOOR_SURFACE_Y + AIRBORNE_CLEARANCE) {
          landingArmedRef.current = true;
          bouncePendingRef.current = false;
        } else if (verticalVelocity <= 0) {
          bouncePendingRef.current = false;
        }
      }

      if (landingArmedRef.current && verticalVelocity < -0.2 && bottomY < -0.38) {
        const halfSize = CUBE_SIZE / 2;
        let lowestY = Number.POSITIVE_INFINITY;
        let contactCount = 0;
        contactOffset.set(0, 0, 0);

        for (const x of [-halfSize, halfSize]) {
          for (const y of [-halfSize, halfSize]) {
            for (const z of [-halfSize, halfSize]) {
              rotatedCorner.set(x, y, z).applyMatrix4(rotationMatrix);

              if (rotatedCorner.y < lowestY - 0.025) {
                lowestY = rotatedCorner.y;
                contactOffset.copy(rotatedCorner);
                contactCount = 1;
              } else if (Math.abs(rotatedCorner.y - lowestY) <= 0.025) {
                contactOffset.add(rotatedCorner);
                contactCount += 1;
              }
            }
          }
        }

        contactOffset.divideScalar(contactCount);
        landingRef.current.id += 1;
        landingRef.current.x = translation.x + contactOffset.x;
        landingRef.current.z = translation.z + contactOffset.z;
        landingRef.current.scale = 1;
        landingRef.current.visible = true;
        landingArmedRef.current = false;
      }
    }

    const angularVelocity = body.angvel();
    const angularSpeed = Math.hypot(
      angularVelocity.x,
      angularVelocity.y,
      angularVelocity.z,
    );
    if (angularSpeed > 3.4) {
      const scale = 3.4 / angularSpeed;
      body.setAngvel(
        {
          x: angularVelocity.x * scale,
          y: angularVelocity.y * scale,
          z: angularVelocity.z * scale,
        },
        true,
      );
    }

    const pointer = pointerRef.current;
    if (!pointer.active) {
      hoverArmedRef.current = true;
      observedPointerRevisionRef.current = pointer.revision;
      return;
    }

    projectedPosition.set(translation.x, translation.y, translation.z).project(camera);
    const dx = projectedPosition.x - pointer.x;
    const dy = projectedPosition.y - pointer.y;
    const distance = Math.hypot(dx, dy);
    const now = clock.elapsedTime;
    const pointerMoved = pointer.revision !== observedPointerRevisionRef.current;
    observedPointerRevisionRef.current = pointer.revision;

    if (
      !hoverArmedRef.current &&
      pointerMoved &&
      distance > HOVER_RESET_RADIUS
    ) {
      hoverArmedRef.current = true;
    }

    if (
      !hoverArmedRef.current ||
      distance >= HOVER_TRIGGER_RADIUS ||
      now - lastReactionRef.current < MIN_REACTION_INTERVAL
    ) {
      return;
    }

    hoverArmedRef.current = false;
    lastReactionRef.current = now;

    if (!physicsStartedRef.current) {
      body.setGravityScale(1, true);
      physicsStartedRef.current = true;
    }

    const xDirection = dx === 0 ? (Math.random() > 0.5 ? 1 : -1) : Math.sign(dx);
    const depthDirection = Math.random() > 0.5 ? 1 : -1;

    body.setLinvel(
      {
        x: xDirection * 2.65,
        y: 2.15,
        z: depthDirection * 0.42,
      },
      true,
    );
    landingArmedRef.current = false;
    bouncePendingRef.current = true;
    body.setAngvel(
      {
        x: (Math.random() - 0.5) * 1.8,
        y: (Math.random() - 0.5) * 1.4,
        z: -xDirection * 2.9,
      },
      true,
    );
  });

  return (
    <>
      <group
        ref={introCubeRef}
        visible={!reducedMotion}
        position={[CUBE_INTRO_START_X, CUBE_INTRO_START_Y, CUBE_START_POSITION[2]]}
        rotation={CUBE_START_ROTATION}
      >
        <CubeVisual cubeSize={CUBE_SIZE} />
      </group>
      <RigidBody
        ref={bodyRef}
        type={reducedMotion ? "fixed" : "dynamic"}
        colliders={false}
        position={CUBE_START_POSITION}
        rotation={CUBE_START_ROTATION}
        gravityScale={0}
        linearDamping={0.42}
        angularDamping={0.46}
        friction={0.8}
        restitution={0.48}
        canSleep
      >
        <CuboidCollider args={[CUBE_SIZE / 2, CUBE_SIZE / 2, CUBE_SIZE / 2]} />
        <group ref={physicsCubeRef} visible={reducedMotion}>
          <CubeVisual cubeSize={CUBE_SIZE} />
        </group>
      </RigidBody>
    </>
  );
}

function PhysicsCubeWorld({
  reducedMotion,
  pointerRef,
}: {
  reducedMotion: boolean;
  pointerRef: RefObject<PointerState>;
}) {
  const landingRef = useRef<LandingState>({
    id: 0,
    x: 0,
    z: 0,
    scale: 1,
    visible: false,
  });
  const landingArmedRef = useRef(false);

  return (
    <Physics gravity={[0, -6.2, 0]} timeStep={1 / 60} interpolate>
      <Arena />
      <FloorShadow />
      <LandingWeb landingRef={landingRef} />
      <CnuCube
        reducedMotion={reducedMotion}
        pointerRef={pointerRef}
        landingRef={landingRef}
        landingArmedRef={landingArmedRef}
      />
    </Physics>
  );
}

function CubeWorld({
  reducedMotion,
  pointerRef,
  viewportWidth,
  mobileLikeDevice,
  anchorNDC,
  anchorFontSizePx,
}: {
  reducedMotion: boolean;
  pointerRef: RefObject<PointerState>;
  viewportWidth: number | null;
  mobileLikeDevice: boolean | null;
  anchorNDC: { x: number; y: number } | null;
  anchorFontSizePx: number | null;
}) {
  if (viewportWidth === null || mobileLikeDevice === null) {
    return null;
  }

  const compact = viewportWidth < 720 || mobileLikeDevice;
  const hideCompactCube = viewportWidth < 375;

  if (hideCompactCube) {
    return null;
  }

  if (compact) {
    return (
      <CompactCube
        reducedMotion={reducedMotion}
        anchorFontSizePx={anchorFontSizePx}
        anchorNDC={anchorNDC}
      />
    );
  }

  return <PhysicsCubeWorld reducedMotion={reducedMotion} pointerRef={pointerRef} />;
}

export function HomeHeroScene() {
  const reducedMotion = useReducedMotion();
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [mobileLikeDevice, setMobileLikeDevice] = useState<boolean | null>(null);

  const [anchorNDC, setAnchorNDC] = useState<{ x: number; y: number } | null>(null);
  const [anchorFontSizePx, setAnchorFontSizePx] = useState<number | null>(null);
  const pointerRef = useRef<PointerState>({ active: false, x: 0, y: 0, revision: 0 });

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    const touchOnlyQuery = window.matchMedia("(pointer: coarse) and (hover: none)");
    const updateMobileLikeDevice = () => {
      const smallTouchScreen =
        navigator.maxTouchPoints > 0 &&
        Math.min(window.screen.width, window.screen.height) <= 900;

      setMobileLikeDevice(touchOnlyQuery.matches || smallTouchScreen);
    };
    const updateAnchor = () => {
      const anchorEl = document.querySelector<HTMLElement>("[data-hero-anchor]");
      const heroEl = anchorEl?.closest<HTMLElement>("[data-home-hero]");
      if (!anchorEl || !heroEl) {
        setAnchorNDC(null);
        setAnchorFontSizePx(null);
        return;
      }
      const anchorRect = anchorEl.getBoundingClientRect();
      const heroRect = heroEl.getBoundingClientRect();
      const px = anchorRect.left - heroRect.left;
      const py = anchorRect.top - heroRect.top + anchorRect.height / 2;
      setAnchorNDC({
        x: (px / heroRect.width) * 2 - 1,
        y: -((py / heroRect.height) * 2 - 1),
      });
      setAnchorFontSizePx(parseFloat(getComputedStyle(anchorEl).fontSize));
    };

    updateViewportWidth();
    updateMobileLikeDevice();
    updateAnchor();
    window.addEventListener("resize", updateViewportWidth, { passive: true });
    window.addEventListener("resize", updateAnchor, { passive: true });
    window.addEventListener("orientationchange", updateMobileLikeDevice);
    window.addEventListener("orientationchange", updateAnchor);
    touchOnlyQuery.addEventListener("change", updateMobileLikeDevice);
    return () => {
      window.removeEventListener("resize", updateViewportWidth);
      window.removeEventListener("resize", updateAnchor);
      window.removeEventListener("orientationchange", updateMobileLikeDevice);
      window.removeEventListener("orientationchange", updateAnchor);
      touchOnlyQuery.removeEventListener("change", updateMobileLikeDevice);
    };
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const target = event.target;
      const hero = target instanceof Element
        ? target.closest<HTMLElement>("[data-home-hero]")
        : null;

      if (!hero) {
        pointerRef.current = {
          ...pointerRef.current,
          active: false,
          revision: pointerRef.current.revision + 1,
        };
        return;
      }

      const bounds = hero.getBoundingClientRect();

      pointerRef.current = {
        active: true,
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
        revision: pointerRef.current.revision + 1,
      };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 [&_canvas]:h-full [&_canvas]:w-full"
      aria-hidden="true"
    >
      <Canvas
        shadows
        camera={{ position: [0, 0, 8.4], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.05} />
        <hemisphereLight args={["#e2f3e8", "#172b21", 1.65]} />
        <directionalLight
          castShadow
          position={[-4, 6, 6]}
          intensity={3.5}
          color="#f7fffa"
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[3, -1, 4]} intensity={8} color="#5fc391" distance={10} />
        <pointLight position={[-3, 1, 3]} intensity={4} color="#c2ead0" distance={9} />
        <fog attach="fog" args={["#14231b", 8.7, 13.8]} />
        <Suspense fallback={null}>
          <CubeWorld
            reducedMotion={reducedMotion}
            pointerRef={pointerRef}
            viewportWidth={viewportWidth}
            mobileLikeDevice={mobileLikeDevice}
            anchorNDC={anchorNDC}
            anchorFontSizePx={anchorFontSizePx}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
