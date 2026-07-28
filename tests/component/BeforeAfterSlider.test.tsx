import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BeforeAfterSlider } from "@/components/mdx/BeforeAfterSlider";

/**
 * The slider's whole job is a number, and it publishes that number as
 * `aria-valuenow` on its handle. Reading it is what lets a gesture be asserted
 * without touching a style or a class name.
 */
function insetNow(): number {
  return Number(screen.getByRole("slider").getAttribute("aria-valuenow"));
}

const WIDTH = 400;

/** The clientX that lands the divider at `percent` of a WIDTH-wide container. */
const atPercent = (percent: number) => (percent / 100) * WIDTH;

const restore: Array<() => void> = [];

afterEach(() => {
  for (const undo of restore.splice(0)) undo();
});

/**
 * jsdom lays nothing out, so every box is 0×0 and every percentage the
 * component computes comes out as NaN or 0. Giving the container a width is
 * what makes a clientX mean a position.
 */
function stubLayout() {
  const original = HTMLElement.prototype.getBoundingClientRect;
  const rect = new DOMRect(0, 0, WIDTH, 225);
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    return rect;
  };
  restore.push(() => {
    HTMLElement.prototype.getBoundingClientRect = original;
  });
}

/**
 * Label width is the other half of the layout, and the one that changes on its
 * own: a label measured in the fallback font grows when Inter swaps in. The
 * setter is how a test plays that swap.
 */
function stubLabelWidth(initial: number) {
  let width = initial;
  const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get: () => width,
  });
  restore.push(() => {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, "offsetWidth", descriptor);
    else Reflect.deleteProperty(HTMLElement.prototype, "offsetWidth");
  });
  return (next: number) => {
    width = next;
  };
}

/** Hold `document.fonts.ready` open so a test can decide when Inter lands. */
function stubFontsReady() {
  let settle = () => {};
  const ready = new Promise<void>((resolve) => {
    settle = resolve;
  });
  const descriptor = Object.getOwnPropertyDescriptor(document, "fonts");
  Object.defineProperty(document, "fonts", { configurable: true, value: { ready } });
  restore.push(() => {
    if (descriptor) Object.defineProperty(document, "fonts", descriptor);
    else Reflect.deleteProperty(document, "fonts");
  });
  return async () => {
    await act(async () => {
      settle();
      await ready;
    });
  };
}

function pointer(
  target: Element,
  type: string,
  init: { pointerId: number; clientX?: number; pointerType?: string },
) {
  fireEvent(
    target,
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: "touch",
      ...init,
    }),
  );
}

function renderSlider(initial: number) {
  const { container } = render(
    <BeforeAfterSlider
      beforeSrc="/images/before.png"
      afterSrc="/images/after.png"
      altBefore="Before"
      altAfter="After"
      initial={initial}
    />,
  );
  return container.firstElementChild as HTMLElement;
}

describe("BeforeAfterSlider", () => {
  it("leaves the drag with the finger that started it when a second one lands", () => {
    stubLayout();
    const widget = renderSlider(50);

    pointer(widget, "pointerdown", { pointerId: 1, clientX: atPercent(40) });
    expect(insetNow()).toBe(40);

    // A second finger resting anywhere on the widget used to run the whole
    // pointerdown path: it jumped the divider to itself, and its own lift then
    // ended the first finger's drag mid-gesture.
    pointer(widget, "pointerdown", { pointerId: 2, clientX: atPercent(80) });
    expect(insetNow()).toBe(40);
  });

  it("puts the divider back when a lost capture is followed by a cancel", () => {
    stubLayout();
    const widget = renderSlider(50);

    pointer(widget, "pointerdown", { pointerId: 1, clientX: atPercent(10) });
    expect(insetNow()).toBe(10);

    // What Chromium does to a vertical scroll that started on the widget: it
    // takes the capture, then says the gesture was never the page's. The
    // divider has to end where the reader found it, or scrolling past a
    // comparison moves it permanently.
    pointer(widget, "lostpointercapture", { pointerId: 1 });
    pointer(widget, "pointercancel", { pointerId: 1 });
    expect(insetNow()).toBe(50);
  });

  it("keeps a keyboard adjustment made after a lost capture, cancel or no cancel", () => {
    stubLayout();
    const widget = renderSlider(50);

    pointer(widget, "pointerdown", { pointerId: 1, clientX: atPercent(10) });
    pointer(widget, "lostpointercapture", { pointerId: 1 });

    const handle = screen.getByRole("slider");
    for (let i = 0; i < 5; i += 1) fireEvent.keyDown(handle, { key: "ArrowRight" });
    expect(insetNow()).toBe(15);

    // Chrome hands the mouse pointerId 1 for the whole session, so a cancel
    // arriving any time later matches a snapshot nobody cleared. Restoring it
    // here would throw away five deliberate keypresses.
    pointer(widget, "pointercancel", { pointerId: 1 });
    expect(insetNow()).toBe(15);
  });

  it("re-measures the labels once the fonts have settled", async () => {
    stubLayout();
    const setLabelWidth = stubLabelWidth(0);
    const fontsSettled = stubFontsReady();

    renderSlider(10);
    const before = screen.getByTestId("slider-label-before");
    // Measured at 0 wide, the "Before" label claims a 2% band, and a divider at
    // 10% clears it.
    expect(before.style.visibility).toBe("visible");

    // Inter arrives after first paint and the label grows to 60px, which puts
    // its right edge at 17% — past the divider, so the two now overlap. No
    // container resize accompanies this, so the ResizeObserver never fires and
    // `fonts.ready` is the only signal there is.
    setLabelWidth(60);
    await fontsSettled();

    expect(before.style.visibility).toBe("hidden");
  });
});
