"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const FACE_LETTERS = ["U", "U", "N", "N", "C", "C"];

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

function StaticCube() {
  const { gl } = useThree();
  const geometry = useMemo(
    () => new RoundedBoxGeometry(1.34, 1.34, 1.34, 6, 0.09),
    [],
  );
  const textures = useMemo(() => FACE_LETTERS.map(createFaceTexture), []);

  useEffect(() => {
    const maxAnisotropy = gl.capabilities.getMaxAnisotropy();
    textures.forEach((texture) => {
      texture.anisotropy = Math.min(8, maxAnisotropy);
      texture.needsUpdate = true;
    });

    return () => {
      geometry.dispose();
      textures.forEach((texture) => texture.dispose());
    };
  }, [geometry, gl, textures]);

  return (
    <group rotation={[0.48, -0.55, 0.05]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        {textures.map((texture, index) => (
          <meshStandardMaterial
            key={`${FACE_LETTERS[index]}-${index}`}
            attach={`material-${index}`}
            map={texture}
            color="#ffffff"
            roughness={0.46}
            metalness={0}
          />
        ))}
      </mesh>
    </group>
  );
}

export function CnuStaticCube() {
  return (
    <div className="pointer-events-none size-full [&_canvas]:size-full" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 4.3], fov: 38 }}
        dpr={[1, 1.5]}
        frameloop="demand"
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      >
        <ambientLight intensity={1.1} />
        <hemisphereLight args={["#e2f3e8", "#172b21", 1.5]} />
        <directionalLight position={[-3, 5, 5]} intensity={3.2} color="#f7fffa" />
        <pointLight position={[3, -1, 4]} intensity={6} color="#5fc391" distance={9} />
        <StaticCube />
      </Canvas>
    </div>
  );
}
