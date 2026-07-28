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
  const [inset, setInset] = useState(() => Math.min(100, Math.max(0, initial)));
  // Which pointer owns the drag, or null when nothing is dragging.
  //
  // This was a `dragging` boolean, and a boolean cannot tell two fingers apart.
  // A second touch anywhere on the widget ran the whole pointerdown path: it
  // jumped the divider to the second finger, and then that finger's lift — or
  // the capture change its own setPointerCapture provoked — ended the first
  // finger's drag mid-gesture. An id makes the second finger a no-op and leaves
  // the drag to end on the lift of the pointer that started it.
  //
  // A ref rather than state: nothing renders from it, so state would only add a
  // re-render per gesture and give the handlers a value one render stale.
  const activePointerId = useRef<number | null>(null);
  // Where the divider sat when the gesture started, and which pointer started
  // it, so a cancelled gesture can put it back. See onPointerCancel for why a
  // cancel is routine. The pointer id rides along because this outlives
  // `activePointerId`: a lost capture clears the drag, and the cancel that
  // explains it arrives afterwards and still needs the snapshot.
  const gestureStart = useRef<{ pointerId: number; inset: number } | null>(null);
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
    // A drag already belongs to another pointer, so this one is a second finger
    // resting on the widget. Ignoring it is the whole fix: it neither moves the
    // divider nor takes a capture whose loss would end the drag in progress.
    if (activePointerId.current !== null) return;

    activePointerId.current = e.pointerId;
    gestureStart.current = { pointerId: e.pointerId, inset };
    (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerId !== activePointerId.current) return;
    updateFromClientX(e.clientX);
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerId !== activePointerId.current) return;
    activePointerId.current = null;
    // The drag finished where the reader left it, so there is nothing to
    // restore and a later stray cancel must not put the divider back.
    gestureStart.current = null;
    (e.currentTarget as HTMLDivElement).releasePointerCapture?.(e.pointerId);
  };

  // A cancel is the browser saying "this gesture was never yours". Under
  // `touch-action: pan-y` that is the ordinary end of a vertical scroll that
  // began on the widget, and Chromium delivers two pointermove events before
  // the cancel — both of which onPointerMove has already applied. Leaving them
  // applied means a reader who merely scrolled past the comparison leaves it
  // moved to wherever their thumb travelled, permanently. Putting the divider
  // back where it started is the only way a scroll can be a scroll.
  //
  // Matched against the snapshot rather than the active pointer, because
  // `onLostPointerCapture` may already have cleared the active pointer for the
  // same gesture. The Pointer Events spec fires lostpointercapture after the
  // cancel, but nothing here depends on that order holding.
  const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (gestureStart.current?.pointerId !== e.pointerId) return;
    activePointerId.current = null;
    setInset(gestureStart.current.inset);
    gestureStart.current = null;
  };

  // A gesture can also end with the capture taken by something else and no
  // pointerup or pointercancel at all. That is not the browser rejecting the
  // gesture, so the divider keeps where the reader dragged it; only the stuck
  // drag needs clearing, which otherwise lets the next stray mouse move drag
  // the slider with no button held down. The snapshot is deliberately left in
  // place for the cancel that may still be coming.
  const onLostPointerCapture: React.PointerEventHandler<HTMLDivElement> = (e) => {
    if (e.pointerId !== activePointerId.current) return;
    activePointerId.current = null;
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

  // The observer above watches the container, and the container is what never
  // changes here. Inter arrives through next/font/google after first paint, so
  // "Before" and "After" are measured in the fallback font and then resize when
  // the swap lands — a change no container resize accompanies, which leaves the
  // thresholds describing label boxes that no longer exist. Recalculating when
  // the fonts settle is the only signal for it.
  //
  // `document.fonts` is optional: the FontFaceSet API is absent in older
  // browsers, and `ready` is what actually gets read, so both are checked.
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts?.ready) return;

    let cancelled = false;
    void fonts.ready.then(() => {
      if (!cancelled) recalcThresholds();
    });
    return () => {
      cancelled = true;
    };
  }, [recalcThresholds]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    position: "relative",
    width: "100%",
    borderRadius: rounded ? "12px" : undefined,
    // Prefer aspect-ratio if provided; fallback to explicit height
    aspectRatio: height ? undefined : aspectRatio,
    height: height,
    userSelect: "none",
    // `pan-y` rather than `none`. The widget is 219px tall on a 390px phone, and
    // `none` made that a dead zone in the middle of a scrolling article: a
    // vertical swipe that started on it moved nothing. `pan-y` leaves the
    // horizontal gesture to the drag and gives vertical scrolling back to the
    // browser. The browser then cancels the pointer when it takes over a
    // vertical swipe, which is what onPointerCancel and onLostPointerCapture
    // below are for.
    //
    // This is a trade rather than a free win. Chrome on Android locks direction
    // once it reads a gesture as horizontal, so a drag that wanders vertically
    // still belongs to the slider. Safari does not lock: with `pan-y` on a
    // scrolling page it cancels a drag that strays far from straight, so a
    // careless drag there ends early. A fragile drag is the better half of the
    // trade against a scroll that does nothing.
    touchAction: "pan-y",
    background: "var(--color-surface)",
  }), [rounded, aspectRatio, height]);

  // The rounding clip lives on this inner frame rather than on the container,
  // so it covers the two images and nothing else. With `overflow: hidden` on
  // the container, the handle's focus ring — which the base layer draws outside
  // the button, 3px out — was cut off at 0% and 100%, which is exactly where
  // Home and End put it.
  const frameStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    inset: 0,
    zIndex: 1,
    overflow: "hidden",
    borderRadius: rounded ? "12px" : undefined,
  }), [rounded]);

  const trackStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: `${inset}%`,
    width: showDivider ? 2 : 0,
    transform: "translateX(-1px)",
    // --color-border-strong is #262a27, a near-black line that disappears over
    // any dark interior, and this divider is the whole drag affordance. The
    // accent is not the answer: its budget is four places — the headline
    // italic, hover and focus, the primary CTA, the payoff figure in a chart —
    // and a divider that is always on is none of them. --color-text is the
    // light neutral, so it reads over a photograph without spending a fifth.
    background: "var(--color-text)",
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
    border: "1px solid var(--color-border-strong)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    cursor: "ew-resize",
  }), [inset]);

  const iconBarStyle: React.CSSProperties = useMemo(() => ({
    width: 14,
    height: 2,
    background: "currentColor",
    opacity: 0.5,
    borderRadius: 1,
  }), []);

  // The labels are hidden with `visibility`, so their display mode is set once
  // here rather than toggled — a hidden label keeps the box recalcThresholds
  // measures.
  const labelStyle: React.CSSProperties = useMemo(() => ({
    position: "absolute",
    display: "inline-flex",
    top: 8,
    zIndex: 5,
    fontSize: "var(--text-xs)",
    // Paired with the size rather than repeating its 16px result, so an edit to
    // the token moves both halves at once.
    lineHeight: "var(--text-xs--line-height)",
    padding: "2px 8px",
    borderRadius: 8,
    background: "var(--color-surface)",
    color: "var(--color-text)",
    border: "1px solid var(--color-border-strong)",
    pointerEvents: "none",
  }), []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={containerStyle}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onLostPointerCapture={onLostPointerCapture}
    >
      <div style={frameStyle}>
        {/* Base image (before/original) */}
        {/* draggable={false}: a native image drag starts on pointerdown and
            takes the pointer with it, which cancels the capture and strands the
            comparison mid-drag. */}
        <Image
          src={beforeSrc}
          alt={altBefore}
          fill
          draggable={false}
          sizes="(max-width: 900px) 100vw, 760px"
          loading="lazy"
          style={{ objectFit: "cover", zIndex: 1 }}
        />

        {/* Overlay image (after/updated) - clipped from the left */}
        <Image
          src={afterSrc}
          alt={altAfter}
          fill
          draggable={false}
          sizes="(max-width: 900px) 100vw, 760px"
          loading="lazy"
          style={{
            objectFit: "cover",
            zIndex: 2,
            clipPath: `inset(0 0 0 ${inset}%)`,
          }}
        />
      </div>

      {/* Corner labels */}
      <span
        aria-hidden
        data-testid="slider-label-before"
        ref={leftLabelRef}
        style={{
          ...labelStyle,
          left: 8,
          // `visibility` rather than `display`. A `display: none` label has no
          // box, so offsetWidth reads 0 and recalcThresholds latches the
          // threshold to roughly 1% — which puts the divider inside the band and
          // flips the label on and off every frame. Hidden this way the box
          // stays measurable.
          visibility: inset > leftThreshold ? "visible" : "hidden",
        }}
      >
        Before
      </span>
      <span
        aria-hidden
        data-testid="slider-label-after"
        ref={rightLabelRef}
        style={{
          ...labelStyle,
          right: 8,
          visibility: inset < rightThreshold ? "visible" : "hidden",
        }}
      >
        After
      </span>

      {/* Divider line */}
      {showDivider && <div aria-hidden style={trackStyle} />}

      {/* Handle (keyboard and mouse/touch accessible). The focus ring is the
          base layer's, unmodified; see frameStyle for what had to move so it
          survives at the two extremes. */}
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
