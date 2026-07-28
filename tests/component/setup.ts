import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/**
 * The parts of the browser jsdom leaves out that these components read.
 *
 * jsdom implements no Pointer Events at all — no `PointerEvent` constructor and
 * no capture methods on `Element` — so a widget whose entire input model is
 * pointer capture has nothing to run against until they exist. Each stub is the
 * smallest thing that behaves like the real one for what the components do with
 * it; none of them tries to be the spec.
 */

type PointerInit = MouseEventInit & {
  pointerId?: number;
  pointerType?: string;
  isPrimary?: boolean;
};

class PointerEventStub extends MouseEvent {
  readonly pointerId: number;
  readonly pointerType: string;
  readonly isPrimary: boolean;

  constructor(type: string, init: PointerInit = {}) {
    super(type, init);
    this.pointerId = init.pointerId ?? 0;
    this.pointerType = init.pointerType ?? "mouse";
    this.isPrimary = init.isPrimary ?? true;
  }
}

globalThis.PointerEvent = PointerEventStub as unknown as typeof PointerEvent;

// Capture is what routes later events to the element that took it, and jsdom
// dispatches straight at the target either way — so these record the id and do
// nothing else. A test that wants a capture lost dispatches the event itself,
// which is also how a browser delivers the interesting cases: the browser
// decides, the page finds out.
const captured = new WeakMap<Element, Set<number>>();

Element.prototype.setPointerCapture = function setPointerCapture(pointerId: number) {
  const ids = captured.get(this) ?? new Set<number>();
  ids.add(pointerId);
  captured.set(this, ids);
};

Element.prototype.releasePointerCapture = function releasePointerCapture(
  pointerId: number,
) {
  captured.get(this)?.delete(pointerId);
};

Element.prototype.hasPointerCapture = function hasPointerCapture(pointerId: number) {
  return captured.get(this)?.has(pointerId) ?? false;
};

afterEach(cleanup);
