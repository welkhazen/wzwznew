import { useEffect, useMemo, useState } from "react";

interface EncryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
}

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

export function EncryptedText({ text, className, speed = 28 }: EncryptedTextProps) {
  const [frame, setFrame] = useState(0);

  const letters = useMemo(() => text.split(""), [text]);

  useEffect(() => {
    setFrame(0);
    const duration = Math.max(letters.length * speed, 240);
    const tickMs = 34;
    const maxFrames = Math.ceil(duration / tickMs);
    let current = 0;

    const interval = window.setInterval(() => {
      current += 1;
      setFrame(current);
      if (current >= maxFrames) {
        window.clearInterval(interval);
      }
    }, tickMs);

    return () => window.clearInterval(interval);
  }, [letters.length, speed, text]);

  const revealProgress = frame / Math.max(1, Math.ceil((Math.max(letters.length * speed, 240)) / 34));
  const revealCount = Math.floor(revealProgress * letters.length);

  const display = letters
    .map((char, index) => {
      if (char === " ") return " ";
      if (index < revealCount) return char;
      return CHARSET[(frame + index * 7) % CHARSET.length];
    })
    .join("");

  return <span className={className}>{display}</span>;
}
