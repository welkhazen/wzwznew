"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface TypewriterStackProps {
  words: string[];
  typeSpeed?: number;
  lastWordDurationMs?: number;
  pauseAfterWord?: number;
  nextWordDelay?: number;
  className?: string;
  lineClassName?: string;
  textClassName?: string;
  firstWordClassName?: string;
  cursorClassName?: string;
  prefix?: string;
  prefixClassName?: string;
  startScale?: number;
  endScale?: number;
  highlightRawWord?: boolean;
  rawWordBaseClassName?: string;
  rawWClassName?: string;
  lineClassNamesByIndex?: Partial<Record<number, string>>;
}

type Phase = "typing" | "pausing" | "done";

export function TypewriterStack({
  words,
  typeSpeed = 85,
  lastWordDurationMs,
  pauseAfterWord = 450,
  nextWordDelay = 220,
  className,
  lineClassName,
  textClassName,
  firstWordClassName,
  cursorClassName,
  prefix,
  prefixClassName,
  startScale = 1,
  endScale = 1,
  highlightRawWord = false,
  rawWordBaseClassName = "text-foreground",
  rawWClassName,
  lineClassNamesByIndex,
}: TypewriterStackProps) {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<Phase>("typing");

  useEffect(() => {
    if (phase === "done" || words.length === 0) return;
    const current = words[wordIndex];
    let timer: ReturnType<typeof setTimeout>;

    const isLastWord = wordIndex === words.length - 1;
    const effectiveSpeed =
      isLastWord && lastWordDurationMs && current.length > 0
        ? Math.max(1, Math.round(lastWordDurationMs / current.length))
        : typeSpeed;

    if (phase === "typing") {
      if (text.length < current.length) {
        timer = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          effectiveSpeed
        );
      } else if (wordIndex + 1 < words.length) {
        timer = setTimeout(() => setPhase("pausing"), pauseAfterWord);
      } else {
        setPhase("done");
      }
    } else if (phase === "pausing") {
      timer = setTimeout(() => {
        setWordIndex((i) => i + 1);
        setText("");
        setPhase("typing");
      }, nextWordDelay);
    }

    return () => clearTimeout(timer);
  }, [text, phase, wordIndex, words, typeSpeed, lastWordDurationMs, pauseAfterWord, nextWordDelay]);

  const prefixMatch = prefix ? `${prefix} ` : null;
  const splitWord = (full: string, typed: string) => {
    if (!prefixMatch || !prefix || !full.startsWith(prefixMatch)) {
      return { head: "", tail: typed };
    }
    if (typed.length <= prefix.length) {
      return { head: typed, tail: "" };
    }
    return { head: prefix, tail: typed.slice(prefix.length) };
  };

  const current = words[wordIndex] ?? "";
  const typing = splitWord(current, text);

  const scaleFor = (i: number) => {
    if (words.length <= 1) return endScale;
    const t = i / (words.length - 1);
    return startScale + (endScale - startScale) * t;
  };

  const renderStyledTail = (tail: string) => {
    if (!highlightRawWord || !tail.includes("raW")) {
      return <span className={textClassName}>{tail}</span>;
    }

    const rawIndex = tail.indexOf("raW");
    const before = tail.slice(0, rawIndex);
    const ra = tail.slice(rawIndex, rawIndex + 2);
    const w = tail.slice(rawIndex + 2, rawIndex + 3);
    const after = tail.slice(rawIndex + 3);

    return (
      <>
        {before ? <span className={textClassName}>{before}</span> : null}
        {ra ? <span className={rawWordBaseClassName}>{ra}</span> : null}
        {w ? <span className={rawWClassName ?? textClassName}>{w}</span> : null}
        {after ? <span className={textClassName}>{after}</span> : null}
      </>
    );
  };

  return (
    <span className={cn("flex flex-col items-center", className)}>
      {words.slice(0, wordIndex).map((w, i) => {
        const done = splitWord(w, w);
        return (
          <motion.span
            key={`done-${i}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className={cn("block will-change-transform", lineClassName, lineClassNamesByIndex?.[i])}
            style={{ fontSize: `${scaleFor(i)}em` }}
          >
            {done.head ? <span className={prefixClassName}>{done.head}</span> : null}
            {renderStyledTail(done.tail)}
          </motion.span>
        );
      })}
      <motion.span
        key={`typing-${wordIndex}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
        className={cn("inline-flex items-center will-change-transform", lineClassName, lineClassNamesByIndex?.[wordIndex])}
        style={{ fontSize: `${scaleFor(wordIndex)}em` }}
      >
        <span aria-live="polite">
          {typing.head ? <span className={prefixClassName}>{typing.head}</span> : null}
          {renderStyledTail(typing.tail)}
        </span>
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className={cn(
            "ml-2 inline-block rounded-sm w-[4px] h-4 sm:h-6 md:h-8 lg:h-10 xl:h-12 bg-primary",
            cursorClassName
          )}
        />
      </motion.span>
    </span>
  );
}
