"use client";

import React, { useEffect, useRef, useState } from "react";

interface DemoClipProps {
  /** Muted, looping MP4 in /public/demo. */
  src: string;
  /** First frame as an image: shown while loading and for visitors who prefer reduced motion. */
  poster: string;
  /** What the clip shows, for screen readers. */
  label: string;
  /** Text in the fake address bar, e.g. "epi-gram.app/problems". */
  address: string;
}

/**
 * A short product clip that plays like a GIF (autoplay, muted, looping) but as a small MP4.
 * It only plays while on screen, and stays on its poster for prefers-reduced-motion.
 */
export default function DemoClip({ src, poster, label, address }: DemoClipProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video || reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.35 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <div
      style={{
        background: "#faf9f5",
        borderRadius: "12px",
        border: "1px solid rgb(220,218,210)",
        boxShadow: "0 24px 48px rgba(20,19,16,0.10)",
        overflow: "hidden",
      }}
    >
      {/* Browser chrome, matching the cheatsheet preview further down the page */}
      <div style={{ background: "#e9e6dc", padding: "8px 14px", display: "flex", alignItems: "center", gap: "7px", borderBottom: "1px solid rgb(220,218,210)" }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ width: "9px", height: "9px", borderRadius: "50%", background: "rgba(20,19,16,0.15)" }} />
        ))}
        <span style={{ fontSize: "11px", color: "#9b9b93", marginLeft: "8px", fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {address}
        </span>
      </div>
      <video
        ref={ref}
        src={src}
        poster={poster}
        aria-label={label}
        muted
        loop
        playsInline
        preload="metadata"
        controls={reduceMotion}
        style={{ display: "block", width: "100%", height: "auto", aspectRatio: "16 / 10", objectFit: "cover", background: "#faf9f5" }}
      />
    </div>
  );
}
