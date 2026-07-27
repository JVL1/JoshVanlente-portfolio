import Image from "next/image";
// A thin "use client" wrapper, NOT the slider itself and NOT next/dynamic here.
// This module is a server module; see the note in BeforeAfterSliderLazy.tsx.
import { BeforeAfterSlider } from "./BeforeAfterSliderLazy";

type MdxImageProps = {
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
};

/**
 * Body images route through next/image. The width and height come from
 * src/lib/mdx/rehype-image-dimensions.ts, which reads them off the file at
 * build time; without them next/image throws and names the src, so a body image
 * that somehow reached here undimensioned fails the build rather than shifting
 * the layout.
 */
function MdxImage({ src, alt, width, height }: MdxImageProps) {
  return (
    <Image
      src={src}
      alt={alt ?? ""}
      width={Number(width)}
      height={Number(height)}
      sizes="(max-width: 900px) 100vw, 760px"
      loading="lazy"
      className="my-8 h-auto w-full rounded-lg"
    />
  );
}

export const components = {
  img: MdxImage,
  BeforeAfterSlider,
};
