"use client";

import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import * as THREE from "three";

const Globe: React.FC<{
  rotationSpeed: number;
  radius: number;
  color?: string;
}> = ({ rotationSpeed, radius, color = "#F5F5F5" }) => {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
      groupRef.current.rotation.x += rotationSpeed * 0.3;
      groupRef.current.rotation.z += rotationSpeed * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 64, 64]} />
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
