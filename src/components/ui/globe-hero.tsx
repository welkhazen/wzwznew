"use client";

import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

const Globe: React.FC<{
  animate: boolean;
  rotationSpeed: number;
  radius: number;
  segments: number;
  color?: string;
}> = ({ animate, rotationSpeed, radius, segments, color = "#F5F5F5" }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (!animate || !groupRef.current) return;
    groupRef.current.rotation.y += rotationSpeed;
    groupRef.current.rotation.x += rotationSpeed * 0.2;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, segments, segments]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.35}
          wireframe
        />
      </mesh>
    </group>
  );
};

export { Globe };
