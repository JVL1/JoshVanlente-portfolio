"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

// next/dynamic only code-splits when the dynamic import lives in a CLIENT
// component. Next's docs are explicit: "When a Server Component dynamically
// imports a Client Component, automatic code splitting is not currently
// supported." registry.tsx is a server module, so calling dynamic() there would
// ship the slider on every write-up route while looking correct — Task 1's
// spike measured exactly that, and only this wrapper isolated the chunk
// (docs/plans/2026-07-24-velite-spike-result.md, condition 8).
//
// This wrapper is a few lines and does ship everywhere; the slider itself stays
// behind the dynamic import and loads only where it renders.
//
// No `ssr: false`: it is an error inside a Server Component, and the default
// server-renders the widget, which is what puts the comparison in the HTML.
const Slider = dynamic(() =>
  import("./BeforeAfterSlider").then((m) => m.BeforeAfterSlider),
);

export function BeforeAfterSlider(props: ComponentProps<typeof Slider>) {
  return <Slider {...props} />;
}
