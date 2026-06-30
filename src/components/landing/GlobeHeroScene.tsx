"use client";

import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import { Globe } from "@/components/ui/globe-hero";

interface GlobeHeroSceneProps {
  animate: boolean;
  globeColor: string;
  quality: "mobile" | "desktop";
}

export function GlobeHeroScene({ animate, globeColor, quality }: GlobeHeroSceneProps) {
  const isMobile = quality === "mobile";

  return (
    <Canvas
      dpr={isMobile ? [1, 1] : [1, 1.25]}
      frameloop={animate ? "always" : "demand"}
      gl={{ powerPreference: "low-power", antialias: false, alpha: true }}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={75} />
      <Globe
        animate={animate}
        color={globeColor}
        radius={1.05}
        rotationSpeed={isMobile ? 0.0018 : 0.003}
        segments={isMobile ? 32 : 48}
      />
    </Canvas>
  );
}
