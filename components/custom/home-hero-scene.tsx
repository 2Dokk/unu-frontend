"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

type Point = [number, number, number];

const BRANCHES: Array<{ points: Point[]; radius: number }> = [
  {
    points: [
      [0, -1.92, 0],
      [-0.08, -1.2, 0.02],
      [0.08, -0.48, 0.08],
      [0, 0.28, 0.12],
      [-0.05, 1.02, 0.02],
      [0.03, 1.72, -0.18],
    ],
    radius: 0.12,
  },
  {
    points: [
      [0.02, -0.73, 0.04],
      [-0.48, -0.24, 0],
      [-1, 0.24, -0.14],
      [-1.52, 0.55, -0.28],
    ],
    radius: 0.075,
  },
  {
    points: [
      [0.04, -0.51, 0.06],
      [0.52, -0.12, 0.01],
      [1.02, 0.16, -0.12],
      [1.52, 0.42, -0.27],
    ],
    radius: 0.073,
  },
  {
    points: [
      [0.02, -0.08, 0.1],
      [-0.38, 0.4, 0.04],
      [-0.7, 0.86, -0.12],
      [-1.04, 1.27, -0.3],
    ],
    radius: 0.06,
  },
  {
    points: [
      [0.01, 0.04, 0.1],
      [0.38, 0.45, 0.04],
      [0.66, 0.92, -0.12],
      [0.98, 1.38, -0.29],
    ],
    radius: 0.06,
  },
  {
    points: [
      [-0.48, 0.54, -0.04],
      [-0.94, 0.96, -0.2],
      [-1.54, 1.4, -0.5],
    ],
    radius: 0.043,
  },
  {
    points: [
      [0.46, 0.58, -0.03],
      [0.96, 1.02, -0.2],
      [1.54, 1.42, -0.48],
    ],
    radius: 0.043,
  },
  {
    points: [
      [-0.02, 1.04, -0.04],
      [-0.52, 1.42, -0.23],
      [-0.84, 1.72, -0.42],
    ],
    radius: 0.037,
  },
  {
    points: [
      [0.02, 1.12, -0.05],
      [0.48, 1.48, -0.24],
      [0.79, 1.79, -0.43],
    ],
    radius: 0.037,
  },
  {
    points: [
      [0, -1.78, -0.02],
      [-0.36, -2.02, -0.12],
      [-0.9, -2.12, -0.3],
    ],
    radius: 0.046,
  },
  {
    points: [
      [0, -1.78, -0.02],
      [0.38, -2.02, -0.12],
      [0.92, -2.1, -0.3],
    ],
    radius: 0.046,
  },
];

const LEAF_CLUSTERS: Array<{ center: Point; count: number; spread: number }> = [
  { center: [-1.52, 0.57, -0.25], count: 5, spread: 0.32 },
  { center: [1.53, 0.44, -0.24], count: 5, spread: 0.32 },
  { center: [-1.04, 1.28, -0.27], count: 5, spread: 0.3 },
  { center: [0.98, 1.39, -0.26], count: 5, spread: 0.3 },
  { center: [0.02, 1.78, -0.2], count: 6, spread: 0.32 },
  { center: [-1.52, 1.42, -0.47], count: 5, spread: 0.28 },
  { center: [1.53, 1.44, -0.45], count: 5, spread: 0.28 },
  { center: [-0.82, 1.72, -0.4], count: 4, spread: 0.24 },
  { center: [0.8, 1.79, -0.4], count: 4, spread: 0.24 },
  { center: [-0.45, 0.58, 0.03], count: 4, spread: 0.22 },
  { center: [0.48, 0.62, 0.02], count: 4, spread: 0.22 },
];

const LEAF_COLORS = ["#4f8667", "#669d79", "#7daf8d", "#95bda1", "#abcab4"];

function seededRandom(seed: number) {
  const value = Math.sin(seed) * 43_758.5453;
  return value - Math.floor(value);
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

function OrganicBranch({ points, radius }: { points: Point[]; radius: number }) {
  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point))),
    [points],
  );

  return (
    <mesh>
      <tubeGeometry args={[curve, 32, radius, 10, false]} />
      <meshPhysicalMaterial
        color={radius > 0.1 ? "#819b89" : "#74907e"}
        roughness={0.62}
        clearcoat={0.12}
        clearcoatRoughness={0.72}
      />
    </mesh>
  );
}

function createLeafShape() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.5);
  shape.bezierCurveTo(0.34, -0.3, 0.36, 0.24, 0, 0.5);
  shape.bezierCurveTo(-0.36, 0.24, -0.34, -0.3, 0, -0.5);
  return shape;
}

function Leaf({
  index,
  position,
  rotation,
  scale,
  color,
  reducedMotion,
  clickImpulseRef,
}: {
  index: number;
  position: Point;
  rotation: Point;
  scale: Point;
  color: string;
  reducedMotion: boolean;
  clickImpulseRef: RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const shape = useMemo(() => createLeafShape(), []);
  const phase = index * 0.83;

  useFrame(({ clock }, delta) => {
    if (!group.current || reducedMotion) return;

    const time = clock.elapsedTime;
    const impulse = clickImpulseRef.current;
    const idleSway = Math.sin(time * 0.72 + phase) * 0.012;
    const clickSway = Math.sin(time * 18 + phase) * impulse * 0.2;

    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      rotation[2] + idleSway + clickSway,
      12,
      delta,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      rotation[0] + Math.cos(time * 16 + phase) * impulse * 0.07,
      12,
      delta,
    );
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      <mesh>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.07,
              bevelEnabled: true,
              bevelSegments: 2,
              bevelSize: 0.025,
              bevelThickness: 0.022,
            },
          ]}
        />
        <meshPhysicalMaterial
          color={color}
          roughness={0.46}
          clearcoat={0.34}
          clearcoatRoughness={0.44}
          sheen={0.32}
          sheenColor="#d8eadf"
          sheenRoughness={0.72}
        />
      </mesh>
      <mesh position={[0, -0.04, 0.105]}>
        <boxGeometry args={[0.022, 0.68, 0.016]} />
        <meshBasicMaterial color="#315d44" transparent opacity={0.42} />
      </mesh>
    </group>
  );
}

function TreeCanopy({
  reducedMotion,
  clickImpulseRef,
}: {
  reducedMotion: boolean;
  clickImpulseRef: RefObject<number>;
}) {
  const leaves = useMemo(
    () =>
      LEAF_CLUSTERS.flatMap(({ center, count, spread }, clusterIndex) =>
        Array.from({ length: count }, (_, leafIndex) => {
          const angle = (leafIndex / count) * Math.PI * 2 + clusterIndex * 0.41;
          const ring = leafIndex === count - 1 ? 0.26 : 0.72 + (leafIndex % 2) * 0.22;
          const x = center[0] + Math.cos(angle) * spread * ring;
          const y = center[1] + Math.sin(angle) * spread * ring;
          const z = center[2] + ((leafIndex + clusterIndex) % 3) * 0.1;
          const length = 0.46 + ((leafIndex + clusterIndex) % 3) * 0.07;

          return {
            key: `${clusterIndex}-${leafIndex}`,
            index: clusterIndex * 10 + leafIndex,
            position: [x, y, z] as Point,
            rotation: [
              Math.sin(angle) * 0.2,
              Math.cos(angle) * 0.28,
              angle - Math.PI / 2,
            ] as Point,
            scale: [length * 0.72, length, 1] as Point,
            color: LEAF_COLORS[(clusterIndex + leafIndex) % LEAF_COLORS.length],
          };
        }),
      ),
    [],
  );

  return leaves.map(({ key, ...leaf }) => (
    <Leaf
      key={key}
      {...leaf}
      reducedMotion={reducedMotion}
      clickImpulseRef={clickImpulseRef}
    />
  ));
}

function FallingLeaf({
  slot,
  compact,
  reducedMotion,
  fallTriggerRef,
  fallSeedRef,
}: {
  slot: number;
  compact: boolean;
  reducedMotion: boolean;
  fallTriggerRef: RefObject<number>;
  fallSeedRef: RefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const leafMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const veinMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const lastTriggerRef = useRef(0);
  const startTimeRef = useRef(-1);
  const startPositionRef = useRef(new THREE.Vector3());
  const phaseRef = useRef(0);
  const shape = useMemo(() => createLeafShape(), []);

  useFrame(({ clock }) => {
    const group = groupRef.current;
    if (!group || reducedMotion || (compact && slot > 0)) return;

    const trigger = fallTriggerRef.current;
    if (trigger !== lastTriggerRef.current) {
      lastTriggerRef.current = trigger;
      const seed = fallSeedRef.current + slot * 101.7;
      const xRandom = seededRandom(seed + 1.13);
      const yRandom = seededRandom(seed + 8.47);
      const zRandom = seededRandom(seed + 17.31);
      const x = compact
        ? THREE.MathUtils.lerp(-1.65, 1.65, xRandom)
        : slot === 0
          ? THREE.MathUtils.lerp(-1.8, -0.45, xRandom)
          : THREE.MathUtils.lerp(0.45, 1.8, xRandom);

      startPositionRef.current.set(x, 1.24 + yRandom * 0.56, 0.62 + zRandom * 0.18);
      startTimeRef.current = clock.elapsedTime + slot * 0.12;
      phaseRef.current = seed * 0.0137 + slot * 2.1;
      group.visible = false;
    }

    const elapsed = clock.elapsedTime - startTimeRef.current;
    const duration = 2.25 + slot * 0.18;
    if (startTimeRef.current < 0 || elapsed < 0 || elapsed > duration) {
      group.visible = false;
      return;
    }

    const start = startPositionRef.current;
    const phase = phaseRef.current;
    const fade = Math.min(1, Math.max(0, (duration - elapsed) / 0.48));
    const drift = slot === 0 ? -0.075 : 0.075;

    group.visible = true;
    group.position.set(
      start.x + Math.sin(elapsed * 4.4 + phase) * 0.2 + elapsed * drift,
      start.y - elapsed * (1.28 + slot * 0.08) - elapsed * elapsed * 0.15,
      start.z + Math.cos(elapsed * 3.2 + phase) * 0.09,
    );
    group.rotation.set(
      Math.sin(elapsed * 5.2 + phase) * 0.42,
      Math.cos(elapsed * 4.1 + phase) * 0.32,
      elapsed * (3.4 + slot * 0.3) + phase,
    );

    if (leafMaterialRef.current) leafMaterialRef.current.opacity = fade;
    if (veinMaterialRef.current) veinMaterialRef.current.opacity = fade * 0.4;
  });

  return (
    <group ref={groupRef} visible={false} scale={[0.36, 0.54, 1]}>
      <mesh>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.07,
              bevelEnabled: true,
              bevelSegments: 2,
              bevelSize: 0.025,
              bevelThickness: 0.022,
            },
          ]}
        />
        <meshPhysicalMaterial
          ref={leafMaterialRef}
          color={slot === 0 ? "#a8cdb5" : "#bed8c6"}
          roughness={0.46}
          clearcoat={0.34}
          transparent
        />
      </mesh>
      <mesh position={[0, -0.04, 0.105]}>
        <boxGeometry args={[0.022, 0.68, 0.016]} />
        <meshBasicMaterial
          ref={veinMaterialRef}
          color="#315d44"
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
}

function LivingTree({
  reducedMotion,
  pointer,
  clickImpulseRef,
  fallTriggerRef,
  fallSeedRef,
}: {
  reducedMotion: boolean;
  pointer: RefObject<{ x: number; y: number }>;
  clickImpulseRef: RefObject<number>;
  fallTriggerRef: RefObject<number>;
  fallSeedRef: RefObject<number>;
}) {
  const group = useRef<THREE.Group>(null);
  const { size } = useThree();
  const compact = size.width < 720;

  useFrame(({ clock }, delta) => {
    if (!group.current || reducedMotion) return;

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      pointer.current.x * 0.16,
      3.2,
      delta,
    );
    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      pointer.current.y * -0.07,
      3.2,
      delta,
    );
    const impulse = clickImpulseRef.current;
    group.current.rotation.z =
      Math.sin(clock.elapsedTime * 0.32) * 0.018 +
      Math.sin(clock.elapsedTime * 19) * impulse * 0.065;
    group.current.position.x = Math.sin(clock.elapsedTime * 22) * impulse * 0.055;
    group.current.position.y =
      Math.sin(clock.elapsedTime * 0.48) * 0.05 +
      Math.cos(clock.elapsedTime * 17) * impulse * 0.025;

    clickImpulseRef.current = Math.max(0, impulse - delta * 1.35);
  });

  return (
    <group ref={group} position={[0, 0, compact ? -1.5 : -0.12]} scale={compact ? 0.74 : 1.1}>
      {BRANCHES.map(({ points, radius }, index) => (
        <OrganicBranch key={index} points={points} radius={radius} />
      ))}
      <TreeCanopy reducedMotion={reducedMotion} clickImpulseRef={clickImpulseRef} />
      <FallingLeaf
        slot={0}
        compact={compact}
        reducedMotion={reducedMotion}
        fallTriggerRef={fallTriggerRef}
        fallSeedRef={fallSeedRef}
      />
      <FallingLeaf
        slot={1}
        compact={compact}
        reducedMotion={reducedMotion}
        fallTriggerRef={fallTriggerRef}
        fallSeedRef={fallSeedRef}
      />
    </group>
  );
}

export function HomeHeroScene() {
  const reducedMotion = useReducedMotion();
  const pointer = useRef({ x: 0, y: 0 });
  const clickImpulseRef = useRef(0);
  const fallTriggerRef = useRef(0);
  const fallSeedRef = useRef(0);
  const clickCountRef = useRef(0);
  const lastFallTimeRef = useRef(Number.NEGATIVE_INFINITY);

  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerMove = (event: PointerEvent) => {
      pointer.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: (event.clientY / window.innerHeight) * 2 - 1,
      };
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest("[data-home-hero]")) return;
      clickImpulseRef.current = 1;
      clickCountRef.current += 1;

      const canFall = event.timeStamp - lastFallTimeRef.current >= 5_000;
      if (clickCountRef.current % 3 === 0 && canFall) {
        fallSeedRef.current = Math.random() * 10_000;
        fallTriggerRef.current += 1;
        lastFallTimeRef.current = event.timeStamp;
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [reducedMotion]);

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 8.4], fov: 40 }}
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.25} />
        <hemisphereLight args={["#d8eadf", "#203e2f", 1.7]} />
        <directionalLight position={[-4, 5, 6]} intensity={3.2} color="#f6fff9" />
        <pointLight position={[3, -2, 4]} intensity={8} color="#5eaa7f" distance={9} />
        <pointLight position={[-3, 1, 3]} intensity={5} color="#c5dfcd" distance={8} />
        <fog attach="fog" args={["#14231b", 7.8, 13]} />
        <LivingTree
          reducedMotion={reducedMotion}
          pointer={pointer}
          clickImpulseRef={clickImpulseRef}
          fallTriggerRef={fallTriggerRef}
          fallSeedRef={fallSeedRef}
        />
      </Canvas>
    </div>
  );
}
