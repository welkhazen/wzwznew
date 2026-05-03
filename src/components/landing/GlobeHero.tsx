"use client";

import React from "react";
import { motion } from "motion/react";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { ArrowRight, Zap } from "lucide-react";
import { track } from "@/lib/analytics";

import { GlobeHeroTypewriterSequence } from "@/components/landing/GlobeHeroTypewriterSequence";
import { TypewriterStack } from "@/components/ui/typewriter-stack";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";

import { Globe } from "@/components/ui/globe-hero";
import { useTheme } from "@/providers/useTheme";

interface GlobeHeroProps {
  onSignupClick: () => void;
}

export function GlobeHero({ onSignupClick }: GlobeHeroProps) {
  const { mode } = useTheme();
  const globeColor = mode === "light" ? "#0A0A0A" : "#F5F5F5";

  const handlePrimaryClick = () => {
    track("landing_cta_clicked", {
      cta_id: "globe_hero_join_now",
      cta_text: "Join Now",
      source_section: "globe_hero",
    });
    onSignupClick();
  };

  const handleSecondaryClick = () => {
    track("landing_cta_clicked", {
      cta_id: "globe_hero_learn_more",
      cta_text: "Learn More",
      source_section: "globe_hero",
    });
  };

  return (
    <div className="relative flex min-h-[620px] items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background/95 to-muted/10 pb-8 pt-10 sm:min-h-[680px] sm:pt-14">
      {/* Globe behind text, centered and smaller */}
      <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
        <div className="w-[340px] h-[340px] md:w-[420px] md:h-[420px] lg:w-[520px] lg:h-[520px]">
          <Canvas>
            <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={75} />
            <Globe rotationSpeed={0.004} radius={1.1} color={globeColor} />
          </Canvas>
        </div>
      </div>
      <div className="relative z-10 mx-auto max-w-5xl space-y-9 px-4 py-10 pt-20 text-center sm:space-y-12 sm:px-6 sm:py-12 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative inline-flex w-full max-w-none items-center justify-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 px-4 py-3 backdrop-blur-xl shadow-2xl sm:gap-3 sm:px-6"
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10 animate-pulse" />
            <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="relative z-10 w-full text-center text-[0.69rem] font-bold uppercase tracking-[0.2em] text-primary sm:text-sm sm:tracking-wider">Fully Anonymous • Community Driven • Identity Based</span>
            <div
              className="w-2 h-2 bg-primary rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            />
          </motion.div>

          <div className="space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="select-none text-[2.1rem] font-black leading-[0.9] tracking-tight sm:text-[2.6rem] md:text-[3.825rem] lg:text-[5.1rem] xl:text-[6.8rem]"
            >
              <span className="block relative">
                <span
                  className="font-black relative z-10 block"
                  style={{
                    filter:
                      "drop-shadow(0 0 24px hsl(var(--primary) / 0.45)) drop-shadow(0 0 48px hsl(var(--primary) / 0.25))",
                  }}
                >
                  <TypewriterStack
                    words={["Your Place", "Your People", "Your Self", "raW"]}
                    prefix="Your"
                    prefixClassName="text-foreground font-black"
                    startScale={0.6}
                    endScale={1.15}
                    textClassName="bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text text-transparent font-black"
                    firstWordClassName="text-metallic font-black"
                    cursorClassName="bg-primary"
                    highlightRawWord
                    rawWordBaseClassName="raw-chrome-w-3d font-black"
                    rawWClassName="raw-chrome-w-3d font-black"
                    lineClassNamesByIndex={{ 3: "mt-14" }}
                  />
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                  className="absolute -bottom-6 left-0 h-3 bg-gradient-to-r from-primary via-primary/80 to-transparent rounded-full shadow-lg shadow-primary/50"
                />
              </span>
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mx-auto max-w-3xl space-y-4 pt-6 sm:pt-8"
          >
            <p
              className="font-display text-lg font-medium leading-relaxed text-foreground sm:text-xl md:text-2xl"
            >
              Your new 24/7 living and ever-growing new world
            </p>
            <p
              className="text-base font-semibold leading-relaxed text-primary sm:text-lg"
              style={{
                textShadow:
                  "0 0 12px hsl(var(--primary) / 0.6), 0 0 28px hsl(var(--primary) / 0.35)",
              }}
            >
              Username And Password Only
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="flex flex-col items-center justify-center gap-4 pt-2 sm:flex-row sm:gap-6 sm:pt-4"
        >
          <motion.button
            type="button"
            onClick={handlePrimaryClick}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(0,0,0,0.2), 0 0 25px hsl(var(--primary) / 0.3)",
              y: -2,
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex min-h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-primary/90 px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-xl transition-all duration-500 hover:shadow-primary/30 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.8 }}
            />
            <span className="relative z-10 tracking-wide">Join Now</span>
            <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
          </motion.button>

          <motion.a
            href="#communities"
            onClick={handleSecondaryClick}
            whileHover={{
              scale: 1.05,
              backgroundColor: "hsl(var(--accent))",
              borderColor: "hsl(var(--primary))",
              boxShadow: "0 15px 30px rgba(0,0,0,0.1), 0 0 15px hsl(var(--primary) / 0.1)",
              y: -2,
            }}
            whileTap={{ scale: 0.98 }}
            className="group relative inline-flex min-h-11 w-full items-center justify-center gap-3 overflow-hidden rounded-xl border-2 border-border/40 bg-background/60 px-6 py-3.5 text-base font-semibold shadow-lg backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-background/90 sm:w-auto sm:px-8 sm:py-4 sm:text-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Zap className="relative z-10 w-5 h-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
            <span className="relative z-10 tracking-wide">Learn More</span>
          </motion.a>
        </motion.div>
      </div>
    </div>
  );
}
