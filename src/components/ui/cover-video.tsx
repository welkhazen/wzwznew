import { useEffect, useRef, useState } from "react";

interface CoverVideoProps {
  src: string;
  className?: string;
  poster?: string;
  type?: string;
}

export function CoverVideo({ src, className, poster, type = "video/webm" }: CoverVideoProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "360px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [shouldLoad]);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      {shouldLoad ? (
        <video
          ref={videoRef}
          className={className}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={poster}
          disablePictureInPicture
        >
          <source src={src} type={type} />
        </video>
      ) : poster ? (
        <img src={poster} alt="" className={className} loading="lazy" decoding="async" aria-hidden="true" />
      ) : (
        <div className={className} />
      )}
    </div>
  );
}
