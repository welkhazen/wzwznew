"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Globe } from "@/components/ui/globe-hero";

interface GlobeHeroSceneProps {
  globeColor: string;
}

export function GlobeHeroScene({ globeColor }: GlobeHeroSceneProps) {
  return (
    <Canvas gl={{ powerPreference: "low-power", antialias: false, alpha: true }} dpr={[1, 1.5]}>
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={75} />
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <Globe rotationSpeed={0.004} radius={1.1} color={globeColor} />
    </Canvas>
  );
}
