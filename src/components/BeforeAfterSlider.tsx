"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type BeforeAfterSliderProps = {
  beforeSrc: string;
  afterSrc: string;
  altBefore: string;
  altAfter: string;
  initial?: number; // 0-100, default 50
  aspectRatio?: string; // e.g. "16 / 9"; default "16 / 9"
  height?: number | string; // alternative to aspectRatio
  rounded?: boolean;
  showDivider?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  altBefore,
  altAfter,
  initial = 50,
  aspectRatio = "16 / 9",
  height,
  rounded = true,
  showDivider = true,
  ariaLabel = "Reveal comparison",
  className,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftLabelRef = useRef<HTMLSpanElement>(null);
  const rightLabelRef = useRef<HTMLSpanElement>(null);
  const [dragging, setDragging] = useState(false);
  const [inset, setInset] = useState(() => Math.min(100, Math.max(0, initial)));
  const [leftThreshold, setLeftThreshold] = useState(0);    // percent from left
  const [rightThreshold, setRightThreshold] = useState(100); // percent from left

  const clamp = useCallback((v: number) => Math.min(100, Math.max(0, v)), []);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setInset(clamp(pct));
  }, [clamp]);

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    // Only left button or primary pointer
    if (e.pointerType === "mouse" && e.button !== 0) return;
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (!dragging) return;
    updateFromClientX(e.clientX);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    setDragging(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
  };

  const onKeyDown: React.KeyboardEventHandler<HTMLButtonElement> = (e) => {
    let next = inset;
    const step = e.shiftKey ? 10 : 1;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        next = inset - step;
        break;
      case "ArrowRight":
      case "ArrowUp":
        next = inset + step;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = 100;
        break;
      case "PageDown":
        next = inset - 10;
        break;
      case "PageUp":
        next = inset + 10;
        break;
      default:
        return;
    }
    e.preventDefault();
    setInset(clamp(next));
  };

  // Compute thresholds for hiding the labels when the divider overlaps them
  const recalcThresholds = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.getBoundingClientRect().width || el.clientWidth || 1;
    const margin = 8; // px, same as label padding offset
    const leftLabelWidth = leftLabelRef.current?.offsetWidth || 0;
    const rightLabelWidth = rightLabelRef.current?.offsetWidth || 0;

    const leftPx = margin + leftLabelWidth; // right edge of left label
    const rightPx = width - margin - rightLabelWidth; // left edge of right label

    setLeftThreshold((leftPx / width) * 100);
    setRightThreshold((rightPx / width) * 100);
  }, []);

  useEffect(() => {
    recalcThresholds();
  }, [recalcThresholds]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(() => recalcThresholds());
    obs.observe(el);
    return () => obs.disconnect();
  }, [recalcThresholds]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: "relative",
    width: "100%",
    overflow: "hidden",
    borderRadius: rounded ? "12px" : undefined,
    // Prefer aspect-ratio if provided; fallback to explicit height
    aspectRatio: height ? undefined : (aspectRatio as any),
    height: height,
    userSelect: "none",
    touchAction: "none",
    background: "var(--neutral-background-medium)",
  }), [rounded, aspectRatio, height]);

  const trackStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `${inset}%`,
    width: showDivider ? 2 : 0,
    transform: "translateX(-1px)",
    background: "var(--neutral-border-strong)",
    zIndex: 3,
    pointerEvents: "none",
  }), [inset, showDivider]);

  const handleStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    left: `${inset}%`,
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 4,
    width: 32,
    height: 32,
    borderRadius: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "1px solid var(--neutral-border-medium)",
    background: "var(--page-background, #fff)",
    color: "var(--neutral-on-background-strong)",
    boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
    cursor: "ew-resize",
  }), [inset]);

  const iconBarStyle: React.CSSProperties = useMemo(() => ({
    width: 14,
    height: 2,
    background: "currentColor",
    opacity: 0.5,
    borderRadius: 1,
  }), []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Base image (before/original) */}
      <Image
        src={beforeSrc}
        alt={altBefore}
        fill
        sizes="100vw"
        loading="lazy"
        style={{ objectFit: "cover", zIndex: 1 }}
      />

      {/* Overlay image (after/updated) - clipped from the left */}
      <Image
        src={afterSrc}
        alt={altAfter}
        fill
        sizes="100vw"
        loading="lazy"
        style={{
          objectFit: "cover",
          zIndex: 2,
          clipPath: `inset(0 0 0 ${inset}%)`,
        }}
      />

      {/* Corner labels */}
      <span
        aria-hidden
        ref={leftLabelRef}
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          zIndex: 5,
          fontSize: 12,
          lineHeight: "16px",
          padding: "2px 8px",
          borderRadius: 8,
          background: "var(--neutral-alpha-weak)",
          color: "var(--neutral-on-background-strong)",
          border: "1px solid var(--neutral-border-weak)",
          pointerEvents: "none",
          display: inset > leftThreshold ? "inline-flex" : "none",
        }}
      >
        Before
      </span>
      <span
        aria-hidden
        ref={rightLabelRef}
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          zIndex: 5,
          fontSize: 12,
          lineHeight: "16px",
          padding: "2px 8px",
          borderRadius: 8,
          background: "var(--neutral-alpha-weak)",
          color: "var(--neutral-on-background-strong)",
          border: "1px solid var(--neutral-border-weak)",
          pointerEvents: "none",
          display: inset < rightThreshold ? "inline-flex" : "none",
        }}
      >
        After
      </span>

      {/* Divider line */}
      {showDivider && <div aria-hidden style={trackStyle} />}

      {/* Handle (keyboard and mouse/touch accessible) */}
      <button
        type="button"
        aria-label={ariaLabel}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(inset)}
        onKeyDown={onKeyDown}
        style={handleStyle}
      >
        {/* Simple grip icon using three bars */}
        <div style={{ display: "flex", gap: 2, transform: "rotate(90deg)" }}>
          <span style={iconBarStyle} />
          <span style={iconBarStyle} />
          <span style={iconBarStyle} />
        </div>
      </button>
    </div>
  );
}
